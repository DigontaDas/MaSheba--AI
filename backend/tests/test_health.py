from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers.health import get_settings


class FakeSettings:
    supabase_url = "https://example.supabase.co"
    supabase_anon_key = "anon"
    supabase_service_role_key = "service"
    supabase_edge_sync_url = "https://example.supabase.co/functions/v1/sync-outbox"


@pytest.fixture(autouse=True)
def override_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    app.dependency_overrides[get_settings] = lambda: FakeSettings()

    async def fake_health_check(self: Any) -> bool:
        return True

    monkeypatch.setattr("app.routers.health.SupabaseGateway.health_check", fake_health_check)
    yield
    app.dependency_overrides.clear()


def test_health_returns_ok() -> None:
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["supabase_reachable"] is True
    assert "timestamp" in body
