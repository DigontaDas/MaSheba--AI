from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import get_settings


class FakeSettings:
    supabase_url = "https://example.supabase.co"
    supabase_anon_key = "anon"
    supabase_service_role_key = "service"


@pytest.fixture(autouse=True)
def override_settings() -> None:
    app.dependency_overrides[get_settings] = lambda: FakeSettings()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_ussd_root_menu(client: TestClient) -> None:
    payload = {
        "msisdn": "01712345678",
        "session_id": "sess_111",
        "text": ""
    }
    response = client.post("/api/v1/ussd", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    
    text = response.text
    assert text.startswith("CON")
    assert "মাশেবা" in text
    assert "১. রোগীর অবস্থা যাচাই" in text
    assert "২. নিকটবর্তী স্বাস্থ্যকেন্দ্র" in text
    assert "৩. জরুরি নম্বরসমূহ" in text


def test_ussd_select_check_patient_asks_uuid(client: TestClient) -> None:
    payload = {
        "msisdn": "01712345678",
        "session_id": "sess_111",
        "text": "1"
    }
    response = client.post("/api/v1/ussd", json=payload)
    assert response.status_code == 200
    assert response.text.startswith("CON")
    assert "রোগীর সঠিক আইডি (UUID) লিখুন:" in response.text


def test_ussd_check_patient_invalid_uuid(client: TestClient) -> None:
    payload = {
        "msisdn": "01712345678",
        "session_id": "sess_111",
        "text": "1 * invalid-uuid-format"
    }
    response = client.post("/api/v1/ussd", json=payload)
    assert response.status_code == 200
    assert response.text.startswith("CON")
    assert "ভুল আইডি ফরম্যাট" in response.text


@patch("app.routers.ussd._fetch_patient_details")
def test_ussd_check_patient_not_found(mock_fetch: AsyncMock, client: TestClient) -> None:
    mock_fetch.return_value = None
    
    payload = {
        "msisdn": "01712345678",
        "session_id": "sess_111",
        "text": "1 * 956b1219-aff5-42d4-bcca-75c4251b601d"
    }
    response = client.post("/api/v1/ussd", json=payload)
    assert response.status_code == 200
    assert response.text.startswith("END")
    assert "গর্ভবতী রোগী খুঁজে পাওয়া যায়নি" in response.text
    mock_fetch.assert_called_once()


@pytest.mark.parametrize(
    "risk_level,expected_guideline",
    [
        ("HIGH", "অত্যন্ত ঝুঁকিপূর্ণ"),
        ("MODERATE", "মাঝারি ঝুঁকি"),
        ("LOW", "রোগী স্বাভাবিক আছেন"),
    ],
)
@patch("app.routers.ussd._fetch_patient_details")
def test_ussd_check_patient_found_with_guidelines(
    mock_fetch: AsyncMock,
    risk_level: str,
    expected_guideline: str,
    client: TestClient,
) -> None:
    mock_fetch.return_value = {
        "name": "সুমি বেগম",
        "age": 24,
        "gestational_age_weeks": 32,
        "last_risk_level": risk_level,
    }
    
    payload = {
        "msisdn": "01712345678",
        "session_id": "sess_111",
        "text": "1 * 956b1219-aff5-42d4-bcca-75c4251b601d"
    }
    response = client.post("/api/v1/ussd", json=payload)
    assert response.status_code == 200
    assert response.text.startswith("END")
    
    text = response.text
    assert "সুমি বেগম" in text
    assert "32 সপ্তাহ" in text
    assert f"ঝুঁকির মাত্রা: {risk_level}" in text
    assert expected_guideline in text


def test_ussd_select_clinic_info(client: TestClient) -> None:
    payload = {
        "msisdn": "01712345678",
        "session_id": "sess_111",
        "text": "2"
    }
    response = client.post("/api/v1/ussd", json=payload)
    assert response.status_code == 200
    assert response.text.startswith("END")
    assert "মা ও শিশু স্বাস্থ্য কেন্দ্র" in response.text
    assert "১৬৭৬৭" in response.text


def test_ussd_select_emergency_info(client: TestClient) -> None:
    payload = {
        "msisdn": "01712345678",
        "session_id": "sess_111",
        "text": "3"
    }
    response = client.post("/api/v1/ussd", json=payload)
    assert response.status_code == 200
    assert response.text.startswith("END")
    assert "৯৯৯" in response.text
    assert "১৬৭৬৭" in response.text


def test_ussd_invalid_option(client: TestClient) -> None:
    payload = {
        "msisdn": "01712345678",
        "session_id": "sess_111",
        "text": "9"
    }
    response = client.post("/api/v1/ussd", json=payload)
    assert response.status_code == 200
    assert response.text.startswith("CON")
    assert "ভুল ইনপুট" in response.text
