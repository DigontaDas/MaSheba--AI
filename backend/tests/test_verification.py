from typing import Any
import pytest
import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.routers.verification import get_settings


class FakeSettings:
    supabase_url = "https://example.supabase.co"
    supabase_anon_key = "anon"
    supabase_service_role_key = "service"


@pytest.fixture
def override_settings() -> None:
    app.dependency_overrides[get_settings] = lambda: FakeSettings()
    yield
    app.dependency_overrides.clear()


def test_verification_requires_bearer_token(override_settings: None) -> None:
    client = TestClient(app)
    response = client.get("/api/v1/verification/pending")
    assert response.status_code == 401
    assert "Bearer token is required." in response.json()["detail"]


def test_verification_checks_active_chw(monkeypatch: pytest.MonkeyPatch, override_settings: None) -> None:
    class FakeAsyncClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> "FakeAsyncClient":
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, url: str, headers: dict[str, str]) -> httpx.Response:
            if url.endswith("/auth/v1/user"):
                return httpx.Response(200, json={"id": "user-uuid", "email": "chw@maasheba.test"})
            if "/rest/v1/chws" in url:
                return httpx.Response(200, json=[{"id": "chw-id", "is_active": False}])
            raise AssertionError(f"Unexpected GET: {url}")

    monkeypatch.setattr("app.routers.verification.httpx.AsyncClient", FakeAsyncClient)

    client = TestClient(app)
    response = client.get("/api/v1/verification/pending", headers={"Authorization": "Bearer token"})
    assert response.status_code == 403
    assert "not an active health worker" in response.json()["detail"]


def test_get_pending_verifications(monkeypatch: pytest.MonkeyPatch, override_settings: None) -> None:
    captured_url = []

    class FakeAsyncClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> "FakeAsyncClient":
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, url: str, headers: dict[str, str]) -> httpx.Response:
            if url.endswith("/auth/v1/user"):
                return httpx.Response(200, json={"id": "user-uuid", "email": "chw@maasheba.test", "phone": "01712345678"})
            if "/rest/v1/chws" in url:
                return httpx.Response(200, json=[{"id": "chw-id", "is_active": True}])
            if "/rest/v1/mothers" in url:
                captured_url.append(url)
                return httpx.Response(200, json=[{
                    "id": "mother-uuid",
                    "name": "Mimi",
                    "phone": "01700000000",
                    "verification_status": "PENDING",
                    "certificate_url": "https://example.com/cert.jpg",
                    "lmp_date": "2026-03-01"
                }])
            raise AssertionError(f"Unexpected GET: {url}")

    monkeypatch.setattr("app.routers.verification.httpx.AsyncClient", FakeAsyncClient)

    client = TestClient(app)
    response = client.get("/api/v1/verification/pending", headers={"Authorization": "Bearer token"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Mimi"
    assert "or=(chw_email.eq.chw@maasheba.test,chw_phone.eq.01712345678)" in captured_url[0]


def test_approve_verification_success(monkeypatch: pytest.MonkeyPatch, override_settings: None) -> None:
    patient_created = []
    mother_updated = []

    class FakeAsyncClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> "FakeAsyncClient":
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, url: str, headers: dict[str, str]) -> httpx.Response:
            if url.endswith("/auth/v1/user"):
                return httpx.Response(200, json={"id": "user-uuid", "email": "chw@maasheba.test"})
            if "/rest/v1/chws" in url:
                return httpx.Response(200, json=[{"id": "chw-uuid", "is_active": True}])
            if "/rest/v1/mothers" in url:
                return httpx.Response(200, json=[{
                    "id": "mother-uuid",
                    "name": "Mimi",
                    "verification_status": "PENDING",
                    "lmp_date": "2026-05-01"
                }])
            raise AssertionError(f"Unexpected GET: {url}")

        async def post(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            if "/rest/v1/patients" in url:
                patient_created.append(json)
                return httpx.Response(201, json=[{"id": "new-patient-uuid"}])
            raise AssertionError(f"Unexpected POST: {url}")

        async def patch(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            if "/rest/v1/mothers" in url:
                mother_updated.append(json)
                return httpx.Response(204, text="")
            raise AssertionError(f"Unexpected PATCH: {url}")

    monkeypatch.setattr("app.routers.verification.httpx.AsyncClient", FakeAsyncClient)

    client = TestClient(app)
    response = client.post(
        "/api/v1/verification/approve",
        headers={"Authorization": "Bearer token"},
        json={"mother_id": "mother-uuid", "age": 25}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "success", "patient_id": "new-patient-uuid"}

    assert len(patient_created) == 1
    assert patient_created[0]["name"] == "Mimi"
    assert patient_created[0]["age"] == 25
    assert patient_created[0]["chw_id"] == "chw-uuid"

    assert len(mother_updated) == 1
    assert mother_updated[0]["verification_status"] == "VERIFIED"
    assert mother_updated[0]["patient_id"] == "new-patient-uuid"
    assert mother_updated[0]["rejection_reason"] is None


def test_reject_verification_success(monkeypatch: pytest.MonkeyPatch, override_settings: None) -> None:
    mother_updated = []

    class FakeAsyncClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> "FakeAsyncClient":
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, url: str, headers: dict[str, str]) -> httpx.Response:
            if url.endswith("/auth/v1/user"):
                return httpx.Response(200, json={"id": "user-uuid", "email": "chw@maasheba.test"})
            if "/rest/v1/chws" in url:
                return httpx.Response(200, json=[{"id": "chw-uuid", "is_active": True}])
            if "/rest/v1/mothers" in url:
                return httpx.Response(200, json=[{
                    "id": "mother-uuid",
                    "name": "Mimi",
                    "verification_status": "PENDING"
                }])
            raise AssertionError(f"Unexpected GET: {url}")

        async def patch(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            if "/rest/v1/mothers" in url:
                mother_updated.append(json)
                return httpx.Response(204, text="")
            raise AssertionError(f"Unexpected PATCH: {url}")

    monkeypatch.setattr("app.routers.verification.httpx.AsyncClient", FakeAsyncClient)

    client = TestClient(app)
    response = client.post(
        "/api/v1/verification/reject",
        headers={"Authorization": "Bearer token"},
        json={"mother_id": "mother-uuid", "rejection_reason": "The certificate image is blurry."}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    assert len(mother_updated) == 1
    assert mother_updated[0]["verification_status"] == "REJECTED"
    assert mother_updated[0]["rejection_reason"] == "The certificate image is blurry."
