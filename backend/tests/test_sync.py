import asyncio
from datetime import UTC, datetime
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.sync import SyncRequest
from app.routers.sync import get_settings
from app.services.supabase_client import SupabaseGateway, SyncGatewayError


class FakeSettings:
    supabase_url = "https://example.supabase.co"
    supabase_anon_key = "anon"
    supabase_service_role_key = "service"
    supabase_edge_sync_url = "https://example.supabase.co/functions/v1/sync-outbox"


def valid_event(key: str) -> dict[str, Any]:
    return {
        "idempotency_key": key,
        "event_type": "patient_upsert",
        "device_id": "device-a",
        "payload": {
            "chw_id": "00000000-0000-0000-0000-0000000000a1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "name": "Test Patient",
            "age": 24,
            "gestational_age_weeks": 28,
            "last_risk_level": "LOW",
        },
    }


@pytest.fixture
def override_settings() -> None:
    app.dependency_overrides[get_settings] = lambda: FakeSettings()
    yield
    app.dependency_overrides.clear()


def test_sync_validates_payload_shape(override_settings: None, fake_sync_gateway: None) -> None:
    client = TestClient(app)
    response = client.post(
        "/sync",
        headers={"Authorization": "Bearer test-token"},
        json={"events": [valid_event("sync-test-1")]},
    )

    assert response.status_code == 200
    assert response.json()["results"][0]["status"] == "SYNCED"


def test_sync_rejects_empty_batch(override_settings: None, fake_sync_gateway: None) -> None:
    client = TestClient(app)
    response = client.post(
        "/sync",
        headers={"Authorization": "Bearer test-token"},
        json={"events": []},
    )

    assert response.status_code == 422


def test_sync_requires_bearer_token(override_settings: None, fake_sync_gateway: None) -> None:
    client = TestClient(app)
    response = client.post("/sync", json={"events": [valid_event("sync-test-2")]})

    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "UNAUTHORIZED",
            "message": "Bearer token is required.",
        }
    }


def test_sync_rejects_malformed_payload(override_settings: None, fake_sync_gateway: None) -> None:
    malformed = valid_event("sync-test-malformed")
    del malformed["payload"]["age"]

    client = TestClient(app)
    response = client.post(
        "/sync",
        headers={"Authorization": "Bearer test-token"},
        json={"events": [malformed]},
    )

    assert response.status_code == 422
    assert "detail" in response.json()


def test_sync_rejects_oversized_batch(override_settings: None, fake_sync_gateway: None) -> None:
    client = TestClient(app)
    response = client.post(
        "/sync",
        headers={"Authorization": "Bearer test-token"},
        json={"events": [valid_event(f"sync-test-{index}") for index in range(101)]},
    )

    assert response.status_code == 422
    assert "detail" in response.json()


def test_sync_idempotency_duplicate_on_second_call(
    override_settings: None,
    fake_sync_gateway: None,
) -> None:
    client = TestClient(app)

    first = client.post(
        "/sync",
        headers={"Authorization": "Bearer test-token"},
        json={"events": [valid_event("sync-test-3")]},
    )
    second = client.post(
        "/sync",
        headers={"Authorization": "Bearer test-token"},
        json={"events": [valid_event("sync-test-3")]},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["results"][0]["status"] == "SYNCED"
    assert second.json()["results"][0]["status"] == "DUPLICATE"


def test_sync_gateway_error_response_shape(
    monkeypatch: pytest.MonkeyPatch,
    override_settings: None,
) -> None:
    async def gateway_error(self: Any, request: Any, bearer_token: str) -> dict[str, Any]:
        raise SyncGatewayError(
            502,
            {
                "error": {
                    "code": "SYNC_EDGE_UNREACHABLE",
                    "message": "Sync edge function is unavailable.",
                }
            },
        )

    monkeypatch.setattr("app.routers.sync.SupabaseGateway.sync_outbox", gateway_error)

    client = TestClient(app)
    response = client.post(
        "/sync",
        headers={"Authorization": "Bearer test-token"},
        json={"events": [valid_event("sync-test-gateway-error")]},
    )

    assert response.status_code == 502
    assert response.json() == {
        "error": {
            "code": "SYNC_EDGE_UNREACHABLE",
            "message": "Sync edge function is unavailable.",
        }
    }


def test_supabase_gateway_uses_service_role_apikey(monkeypatch: pytest.MonkeyPatch) -> None:
    captured_headers: dict[str, dict[str, str]] = {}
    captured_post_body: dict[str, Any] = {}

    class FakeAsyncClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> "FakeAsyncClient":
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, url: str, headers: dict[str, str]) -> httpx.Response:
            if url.endswith("/auth/v1/user"):
                captured_headers["auth"] = headers
                return httpx.Response(
                    200,
                    json={
                        "id": "956b1219-aff5-42d4-bcca-75c4251b601d",
                        "email": "chw_a@maasheba.test",
                    },
                )

            if "/rest/v1/chws" in url:
                captured_headers["chw"] = headers
                return httpx.Response(200, json=[{"id": "00000000-0000-0000-0000-0000000000a1", "is_active": True}])

            raise AssertionError(f"Unexpected GET url: {url}")

        async def post(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            captured_headers["rpc"] = headers
            captured_post_body.update(json)
            return httpx.Response(
                200,
                json=[{"idempotency_key": "sync-test-service-key", "status": "SYNCED"}],
            )

    monkeypatch.setattr("app.services.supabase_client.httpx.AsyncClient", FakeAsyncClient)

    gateway = SupabaseGateway(FakeSettings())
    sync_request = SyncRequest(events=[valid_event("sync-test-service-key")])

    payload = asyncio.run(gateway.sync_outbox(sync_request, "Bearer chw-token"))

    assert captured_headers["auth"]["Authorization"] == "Bearer chw-token"
    assert captured_headers["auth"]["apikey"] == "anon"
    assert captured_headers["chw"]["Authorization"] == "Bearer service"
    assert captured_headers["chw"]["apikey"] == "service"
    assert captured_headers["rpc"]["Authorization"] == "Bearer service"
    assert captured_headers["rpc"]["apikey"] == "service"
    assert captured_post_body["events"][0]["idempotency_key"] == "sync-test-service-key"
    assert payload["results"][0]["status"] == "SYNCED"


def test_supabase_gateway_rejects_cross_chw_events(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeAsyncClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> "FakeAsyncClient":
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, url: str, headers: dict[str, str]) -> httpx.Response:
            if url.endswith("/auth/v1/user"):
                return httpx.Response(200, json={"id": "956b1219-aff5-42d4-bcca-75c4251b601d"})

            if "/rest/v1/chws" in url:
                return httpx.Response(200, json=[{"id": "00000000-0000-0000-0000-0000000000a1", "is_active": True}])

            raise AssertionError(f"Unexpected GET url: {url}")

        async def post(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            raise AssertionError("RPC should not be called for a cross-CHW payload")

    monkeypatch.setattr("app.services.supabase_client.httpx.AsyncClient", FakeAsyncClient)

    gateway = SupabaseGateway(FakeSettings())
    mismatched = valid_event("sync-test-cross-chw")
    mismatched["payload"]["chw_id"] = "00000000-0000-0000-0000-0000000000b2"
    sync_request = SyncRequest(events=[mismatched])

    with pytest.raises(SyncGatewayError) as exc_info:
        asyncio.run(gateway.sync_outbox(sync_request, "Bearer chw-token"))

    assert exc_info.value.status_code == 403
    assert exc_info.value.payload == {
        "error": {
            "code": "FORBIDDEN",
            "message": "Event payload CHW does not match the authenticated CHW.",
            "details": {"idempotency_key": "sync-test-cross-chw"},
        }
    }


@pytest.fixture
def fake_sync_gateway(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: set[str] = set()

    async def fake_sync_outbox(self: Any, request: Any, bearer_token: str) -> dict[str, Any]:
        results = []
        for event in request.events:
            status = "DUPLICATE" if event.idempotency_key in seen else "SYNCED"
            seen.add(event.idempotency_key)
            results.append({"idempotency_key": event.idempotency_key, "status": status})
        return {
            "results": results,
            "synced_at": datetime.now(UTC).isoformat(),
        }

    monkeypatch.setattr("app.routers.sync.SupabaseGateway.sync_outbox", fake_sync_outbox)
