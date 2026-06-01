from typing import Any

from fastapi.testclient import TestClient

from app.main import app


class FakeSettings:
    groq_api_key = "groq-test"
    gemini_api_key = "gemini-test"


def test_chat_returns_structured_bangla_response(monkeypatch: Any) -> None:
    async def fake_groq(question: str, api_key: str, system_prompt: str) -> str:
        assert api_key == "groq-test"
        return "গর্ভাবস্থায় বমি হলে অল্প অল্প করে খাবার খান এবং পানি পান করুন।"

    monkeypatch.setattr("app.services.chat_service.get_settings", lambda: FakeSettings())
    monkeypatch.setattr("app.services.chat_service._call_groq", fake_groq)

    client = TestClient(app)
    response = client.post("/chat", json={"question": "গর্ভাবস্থায় বমি হলে কী করব?"})

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "groq"
    assert body["is_emergency"] is False
    assert "গর্ভাবস্থায়" in body["answer"]


def test_chat_emergency_response_appends_hospital_instruction(monkeypatch: Any) -> None:
    async def fake_groq(question: str, api_key: str, system_prompt: str) -> str:
        return "অতিরিক্ত রক্তপাত গুরুতর লক্ষণ। এখনই হাসপাতালে যান।"

    monkeypatch.setattr("app.services.chat_service.get_settings", lambda: FakeSettings())
    monkeypatch.setattr("app.services.chat_service._call_groq", fake_groq)

    client = TestClient(app)
    response = client.post("/chat", json={"question": "হঠাৎ অনেক রক্তপাত হচ্ছে"})

    assert response.status_code == 200
    body = response.json()
    assert body["is_emergency"] is True
    assert "হাসপাতালে" in body["answer"]
    assert body["emergency_text"] == "এখনই হাসপাতালে যান।"


def test_chat_returns_degraded_fallback_without_provider_keys(monkeypatch: Any) -> None:
    class EmptySettings:
        groq_api_key = ""
        gemini_api_key = ""

    monkeypatch.setattr("app.services.chat_service.get_settings", lambda: EmptySettings())

    client = TestClient(app)
    response = client.post("/chat", json={"question": "গর্ভাবস্থায় কী খাওয়া উচিত?"})

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "fallback"
    assert "অফলাইন তথ্য ব্যবহার করুন" in body["answer"]


def test_chat_falls_back_to_gemini_when_groq_answer_is_unsafe(monkeypatch: Any) -> None:
    async def fake_groq(question: str, api_key: str, system_prompt: str) -> str:
        return "প্রথমে এক কাপ চা খান। তারপর একটি কাপ কফি খান।"

    async def fake_gemini(question: str, api_key: str, system_prompt: str) -> str:
        return "এখনই হাসপাতালে যান। হঠাৎ অনেক রক্তপাত গুরুতর লক্ষণ।"

    monkeypatch.setattr("app.services.chat_service.get_settings", lambda: FakeSettings())
    monkeypatch.setattr("app.services.chat_service._call_groq", fake_groq)
    monkeypatch.setattr("app.services.chat_service._call_gemini", fake_gemini)

    client = TestClient(app)
    response = client.post("/chat", json={"question": "হঠাৎ অনেক রক্তপাত হচ্ছে"})

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "gemini"
    assert body["is_emergency"] is True
    assert "হাসপাতালে" in body["answer"]


def test_chat_accepts_optional_system_prompt(monkeypatch: Any) -> None:
    seen: dict[str, str] = {}

    async def fake_groq(question: str, api_key: str, system_prompt: str) -> str:
        seen["question"] = question
        seen["system_prompt"] = system_prompt
        return "ক্লিনিক্যালভাবে BP যাচাই করুন এবং ঝুঁকি থাকলে রেফার করুন।"

    monkeypatch.setattr("app.services.chat_service.get_settings", lambda: FakeSettings())
    monkeypatch.setattr("app.services.chat_service._call_groq", fake_groq)

    client = TestClient(app)
    response = client.post(
        "/chat",
        json={
            "question": "BP 150/95, কী করব?",
            "system_prompt": "clinical-system-prompt"
        },
    )

    assert response.status_code == 200
    assert seen == {
        "question": "BP 150/95, কী করব?",
        "system_prompt": "clinical-system-prompt"
    }


def test_voice_chat_success_returns_structured_response(monkeypatch: Any) -> None:
    class MockResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": '{"transcription": "আমার তীব্র মাথাব্যথা করছে", "symptoms": ["headache"], "answer": "তীব্র মাথাব্যথা প্রিক্ল্যাম্পসিয়ার লক্ষণ হতে পারে।", "is_emergency": true}'
                                }
                            ]
                        }
                    }
                ]
            }

    async def fake_post(*args: Any, **kwargs: Any) -> MockResponse:
        return MockResponse()

    monkeypatch.setattr("app.services.chat_service.get_settings", lambda: FakeSettings())
    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    client = TestClient(app)
    response = client.post(
        "/chat/voice",
        files={"file": ("test.m4a", b"dummy_audio_bytes", "audio/m4a")}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["transcription"] == "আমার তীব্র মাথাব্যথা করছে"
    assert "headache" in body["symptoms"]
    assert "তীব্র মাথাব্যথা" in body["answer"]
    assert body["is_emergency"] is True
    assert body["source"] == "gemini-voice"


def test_voice_chat_failure_returns_fallback_response(monkeypatch: Any) -> None:
    async def fake_post(*args: Any, **kwargs: Any) -> None:
        raise Exception("API error")

    monkeypatch.setattr("app.services.chat_service.get_settings", lambda: FakeSettings())
    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    client = TestClient(app)
    response = client.post(
        "/chat/voice",
        files={"file": ("test.m4a", b"dummy_audio_bytes", "audio/m4a")}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["transcription"] == "অডিও ফাইলটি বিশ্লেষণ করা সম্ভব হয়নি।"
    assert body["symptoms"] == []
    assert "দুঃখিত" in body["answer"]
    assert body["is_emergency"] is False
    assert body["source"] == "fallback-voice"
