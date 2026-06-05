from __future__ import annotations

from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


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


def install_admin_httpx(
    monkeypatch: pytest.MonkeyPatch,
    *,
    active_admin: bool = True,
    role: str = "super_admin",
    fail_heatmap: bool = False,
    fail_audit_writes: bool = False,
    fail_sms_read: bool = False,
    fail_audit_read: bool = False,
) -> dict[str, Any]:
    state: dict[str, Any] = {
        "patches": [],
        "posts": [],
        "deletes": [],
    }

    class FakeAsyncClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> "FakeAsyncClient":
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, url: str, headers: dict[str, str]) -> httpx.Response:
            state.setdefault("gets", []).append({"url": url, "headers": headers})
            if url.endswith("/auth/v1/user"):
                return httpx.Response(200, json={"id": "00000000-0000-0000-0000-00000000ad01", "email": "admin@maasheba.local"})
            if "/rest/v1/admin_users" in url:
                if not active_admin:
                    return httpx.Response(200, json=[])
                return httpx.Response(200, json=[{"auth_user_id": "00000000-0000-0000-0000-00000000ad01", "role": role, "is_active": True}])
            if "/rest/v1/v_chw_list" in url:
                return httpx.Response(200, json=[{"chw_id": "chw-a", "name": "CHW A", "union_name": "Shibpur", "upazila": "Narsingdi", "is_active": True, "patient_count": 2}])
            if "/rest/v1/v_risk_summary" in url:
                return httpx.Response(200, json=[{"chw_id": "chw-a", "chw_name": "CHW A", "low_count": 1, "moderate_count": 0, "high_count": 1}])
            if "/rest/v1/v_upazila_risk_heatmap" in url:
                if fail_heatmap:
                    return httpx.Response(404, json={"message": "relation v_upazila_risk_heatmap does not exist"})
                return httpx.Response(200, json=[{"upazila": "Narsingdi", "low_count": 1, "moderate_count": 0, "high_count": 1, "total_patients": 2}])
            if "/rest/v1/patients" in url:
                return httpx.Response(200, json=[{"id": "patient-a", "chw_id": "chw-a", "name": "Marium Begum", "age": 24, "gestational_age_weeks": 32, "last_risk_level": "HIGH", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}])
            if "/rest/v1/master_qa" in url:
                return httpx.Response(200, json=[{"id": "qa-a", "trimester": "T1", "topic": "Nutrition", "question_bn": "প্রশ্ন", "answer_bn": "উত্তর", "question_en": "Question", "answer_en": "Answer", "severity": "LOW", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}])
            if "/rest/v1/sms_failures" in url:
                if fail_sms_read:
                    return httpx.Response(404, json={"message": "relation sms_failures does not exist"})
                return httpx.Response(200, json=[{"id": "sms-a", "visit_id": None, "phone_number": "01712345678", "message": "Alert", "error_message": "Timeout", "attempts": 3, "created_at": "2026-06-02T00:00:00Z", "review_status": "OPEN", "review_notes": None, "reviewed_at": None}])
            if "/rest/v1/admin_audit_events" in url:
                if fail_audit_read:
                    return httpx.Response(404, json={"message": "relation admin_audit_events does not exist"})
                return httpx.Response(200, json=[{"id": "audit-a", "actor_user_id": "00000000-0000-0000-0000-00000000ad01", "action": "admin.summary.read", "entity_type": "dashboard", "entity_id": None, "metadata": {}, "created_at": "2026-06-02T00:00:00Z"}])
            raise AssertionError(f"Unexpected GET url: {url}")

        async def post(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            state["posts"].append({"url": url, "headers": headers, "json": json})
            if "/rest/v1/master_qa" in url:
                body = json | {"id": "qa-new", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}
                return httpx.Response(201, json=[body])
            if "/rest/v1/admin_audit_events" in url:
                if fail_audit_writes:
                    return httpx.Response(404, json={"message": "relation admin_audit_events does not exist"})
                return httpx.Response(201, json=[json | {"id": "audit-new", "created_at": "2026-06-02T00:00:00Z"}])
            raise AssertionError(f"Unexpected POST url: {url}")

        async def patch(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            state["patches"].append({"url": url, "headers": headers, "json": json})
            if "/rest/v1/chws" in url:
                return httpx.Response(200, json=[{"id": "chw-a", "is_active": json["is_active"]}])
            if "/rest/v1/master_qa" in url:
                return httpx.Response(200, json=[{"id": "qa-a", "trimester": "T1", "topic": json.get("topic", "Nutrition"), "question_bn": "প্রশ্ন", "answer_bn": "উত্তর", "question_en": "Question", "answer_en": "Answer", "severity": "LOW", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}])
            if "/rest/v1/sms_failures" in url:
                return httpx.Response(200, json=[{"id": "sms-a", "review_status": json["review_status"], "review_notes": json.get("review_notes"), "reviewed_at": "2026-06-02T00:00:00Z"}])
            raise AssertionError(f"Unexpected PATCH url: {url}")

        async def delete(self, url: str, headers: dict[str, str]) -> httpx.Response:
            state["deletes"].append({"url": url, "headers": headers})
            if "/rest/v1/master_qa" in url:
                return httpx.Response(204)
            raise AssertionError(f"Unexpected DELETE url: {url}")

    monkeypatch.setattr("app.routers.admin.httpx.AsyncClient", FakeAsyncClient)
    return state


def test_admin_router_is_registered() -> None:
    route_paths = {getattr(route, "path", "") for route in app.routes}

    assert "/api/v1/admin/summary" in route_paths


def test_admin_endpoints_require_bearer_token(client: TestClient) -> None:
    response = client.get("/api/v1/admin/summary")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_inactive_or_missing_admin_is_forbidden(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch, active_admin=False)

    response = client.get("/api/v1/admin/summary", headers={"Authorization": "Bearer user-token"})

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_admin_summary_returns_aggregate_payload(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch)

    response = client.get("/api/v1/admin/summary", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 200
    body = response.json()
    assert body["metrics"] == {"active_chws": 1, "tracked_patients": 2, "high_risk_patients": 1}
    assert body["chws"][0]["name"] == "CHW A"
    assert body["risk_summary"][0]["high_count"] == 1
    assert body["heatmap"][0]["upazila"] == "Narsingdi"


def test_admin_summary_still_renders_when_heatmap_view_and_audit_table_are_missing(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_admin_httpx(monkeypatch, fail_heatmap=True, fail_audit_writes=True)

    response = client.get("/api/v1/admin/summary", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 200
    body = response.json()
    assert body["metrics"] == {"active_chws": 1, "tracked_patients": 2, "high_risk_patients": 1}
    assert body["heatmap"] == [
        {
            "upazila": "Narsingdi",
            "low_count": 1,
            "moderate_count": 0,
            "high_count": 1,
            "total_patients": 2,
        }
    ]


def test_admin_can_toggle_chw_status(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch)

    response = client.patch(
        "/api/v1/admin/chws/chw-a/status",
        headers={"Authorization": "Bearer admin-token"},
        json={"is_active": False},
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False
    assert state["patches"][0]["json"] == {"is_active": False}


def test_non_super_admin_cannot_deactivate_chw(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch, role="admin")

    response = client.patch(
        "/api/v1/admin/chws/chw-a/status",
        headers={"Authorization": "Bearer admin-token"},
        json={"is_active": False},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
    assert state["patches"] == []


def test_admin_can_reactivate_chw(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch, role="admin")

    response = client.patch(
        "/api/v1/admin/chws/chw-a/status",
        headers={"Authorization": "Bearer admin-token"},
        json={"is_active": True},
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is True
    assert state["patches"][0]["json"] == {"is_active": True}


def test_admin_can_crud_qa_items(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch)
    headers = {"Authorization": "Bearer admin-token"}

    created = client.post(
        "/api/v1/admin/qa",
        headers=headers,
        json={"trimester": "T1", "topic": "Nutrition", "question_bn": "প্রশ্ন", "answer_bn": "উত্তর", "question_en": "Question", "answer_en": "Answer", "severity": "LOW"},
    )
    updated = client.patch("/api/v1/admin/qa/qa-a", headers=headers, json={"topic": "Danger signs"})
    deleted = client.delete("/api/v1/admin/qa/qa-a", headers=headers)

    assert created.status_code == 201
    assert created.json()["id"] == "qa-new"
    assert updated.status_code == 200
    assert updated.json()["topic"] == "Danger signs"
    assert deleted.status_code == 204
    assert state["posts"][0]["json"]["trimester"] == "T1"
    assert state["deletes"][0]["url"].endswith("master_qa?id=eq.qa-a")


def test_non_super_admin_cannot_delete_qa_items(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch, role="admin")

    response = client.delete("/api/v1/admin/qa/qa-a", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
    assert state["deletes"] == []


def test_invalid_qa_payload_is_rejected(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch)

    response = client.post(
        "/api/v1/admin/qa",
        headers={"Authorization": "Bearer admin-token"},
        json={"trimester": "BAD", "topic": "", "question_bn": "", "answer_bn": "", "severity": "LOW"},
    )

    assert response.status_code == 422


def test_admin_can_review_sms_failure(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch)

    response = client.patch(
        "/api/v1/admin/telemetry/sms/sms-a",
        headers={"Authorization": "Bearer admin-token"},
        json={"review_status": "REVIEWED", "review_notes": "District supervisor notified."},
    )

    assert response.status_code == 200
    assert response.json()["review_status"] == "REVIEWED"


def test_admin_sms_telemetry_returns_empty_list_when_table_is_missing(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_admin_httpx(monkeypatch, fail_sms_read=True)

    response = client.get("/api/v1/admin/telemetry/sms", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 200
    assert response.json() == {"failures": []}


def test_admin_export_supports_csv_and_pdf(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch)
    headers = {"Authorization": "Bearer admin-token"}

    csv_response = client.get("/api/v1/admin/reports/export?format=csv", headers=headers)
    pdf_response = client.get("/api/v1/admin/reports/export?format=pdf", headers=headers)

    assert csv_response.status_code == 200
    assert csv_response.headers["content-type"].startswith("text/csv")
    assert "Marium Begum" in csv_response.text
    assert pdf_response.status_code == 200
    assert pdf_response.headers["content-type"] == "application/pdf"
    assert pdf_response.content.startswith(b"%PDF")


def test_non_super_admin_cannot_export_reports(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch, role="admin")

    response = client.get("/api/v1/admin/reports/export?format=csv", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_admin_audit_endpoint_returns_events(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch)

    response = client.get("/api/v1/admin/audit", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 200
    assert response.json()["events"][0]["action"] == "admin.summary.read"


def test_non_super_admin_cannot_read_audit_events(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch, role="admin")

    response = client.get("/api/v1/admin/audit", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_admin_audit_endpoint_returns_empty_list_when_table_is_missing(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_admin_httpx(monkeypatch, fail_audit_read=True)

    response = client.get("/api/v1/admin/audit", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 200
    assert response.json() == {"events": []}
