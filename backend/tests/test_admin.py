from __future__ import annotations

import base64
import json
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
    admin_dev_auth_enabled = False
    admin_dev_token = ""


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
            if "/auth/v1/admin/users/" in url:
                user_id = url.split("/auth/v1/admin/users/")[1].split("?")[0]
                return httpx.Response(200, json={"id": user_id, "email": "chw-a@maasheba.local", "phone": "+8801700000001"})
            if "/rest/v1/admin_users" in url:
                if not active_admin:
                    return httpx.Response(200, json=[])
                return httpx.Response(200, json=[{"auth_user_id": "00000000-0000-0000-0000-00000000ad01", "role": role, "is_active": True}])
            if "/rest/v1/chws" in url:
                if "id=in." in url:
                    rows = []
                    if "chw-a" in url:
                        rows.append({"id": "chw-a", "name": "CHW A"})
                    if "chw-pending" in url:
                        rows.append({"id": "chw-pending", "name": "Pending CHW"})
                    return httpx.Response(200, json=rows)
                if "id=eq." in url:
                    chw_id = url.split("id=eq.")[1].split("&")[0]
                    if chw_id == "chw-a":
                        return httpx.Response(200, json=[{"id": "chw-a", "name": "CHW A", "is_active": True, "verification_status": "APPROVED", "union_name": "Shibpur", "upazila": "Narsingdi", "auth_user_id": "auth-chw-a"}])
                    elif chw_id == "chw-pending":
                        return httpx.Response(200, json=[{"id": "chw-pending", "name": "Pending CHW", "is_active": False, "verification_status": "PENDING", "union_name": "Shibpur", "upazila": "Narsingdi"}])
                    elif chw_id == "chw-rejected":
                        return httpx.Response(200, json=[{"id": "chw-rejected", "name": "Rejected CHW", "is_active": False, "verification_status": "REJECTED", "union_name": "Shibpur", "upazila": "Narsingdi"}])
                    elif chw_id == "chw-inactive":
                        return httpx.Response(200, json=[{"id": "chw-inactive", "name": "Inactive CHW", "is_active": False, "verification_status": "APPROVED", "union_name": "Shibpur", "upazila": "Narsingdi"}])
                    else:
                        return httpx.Response(200, json=[])
                if "verification_status=eq.PENDING" in url:
                    return httpx.Response(200, json=[{"id": "chw-pending", "name": "Pending CHW", "union_name": "Shibpur", "upazila": "Narsingdi", "organization_name": "Clinic", "worker_type": "HA", "years_of_experience": 3, "certificate_url": "https://example.com/cert.png", "verification_status": "PENDING", "created_at": "2026-06-02T00:00:00Z"}])
                return httpx.Response(
                    200,
                    json=[
                        {
                            "id": "chw-a",
                            "name": "CHW A",
                            "union_name": "Shibpur",
                            "upazila": "Narsingdi",
                            "organization_name": "Clinic A",
                            "worker_type": "HA",
                            "years_of_experience": 5,
                            "certificate_url": "https://example.com/cert-a.png",
                            "verification_status": "APPROVED",
                            "is_active": True,
                            "auth_user_id": "auth-chw-a",
                            "created_at": "2026-06-01T00:00:00Z",
                        },
                        {
                            "id": "chw-pending",
                            "name": "Pending CHW",
                            "union_name": "Shibpur",
                            "upazila": "Narsingdi",
                            "organization_name": "Clinic",
                            "worker_type": "HA",
                            "years_of_experience": 3,
                            "certificate_url": "https://example.com/cert.png",
                            "verification_status": "PENDING",
                            "is_active": False,
                            "created_at": "2026-06-02T00:00:00Z",
                        },
                    ],
                )
            if "/rest/v1/v_risk_summary" in url:
                return httpx.Response(200, json=[{"chw_id": "chw-a", "chw_name": "CHW A", "low_count": 1, "moderate_count": 0, "high_count": 1}])
            if "/rest/v1/v_upazila_risk_heatmap" in url:
                if fail_heatmap:
                    return httpx.Response(404, json={"message": "relation v_upazila_risk_heatmap does not exist"})
                return httpx.Response(200, json=[{"upazila": "Narsingdi", "low_count": 1, "moderate_count": 0, "high_count": 1, "total_patients": 2}])
            if "/rest/v1/mothers" in url:
                if "id=eq." in url:
                    m_id = url.split("id=eq.")[1].split("&")[0]
                    if m_id == "mother-linked":
                        return httpx.Response(200, json=[{
                            "id": "mother-linked",
                            "auth_user_id": "auth-linked",
                            "name": "Seed Mother",
                            "phone": "+8801700000001",
                            "verification_status": "PENDING",
                            "patient_id": "patient-a",
                            "gestational_age_weeks": 28,
                            "created_at": "2026-06-03T00:00:00Z",
                            "updated_at": "2026-06-03T00:00:00Z",
                        }])
                    elif m_id == "mother-real":
                        pat_id = None
                        for patch in state["patches"]:
                            if "/rest/v1/mothers" in patch["url"] and "id=eq.mother-real" in patch["url"]:
                                pat_id = patch["json"].get("patient_id")
                        return httpx.Response(200, json=[{
                            "id": "mother-real",
                            "auth_user_id": "auth-real",
                            "name": "Real Phone Mother",
                            "phone": "+8801712345678",
                            "verification_status": "VERIFIED",
                            "patient_id": pat_id,
                            "gestational_age_weeks": 12,
                            "created_at": "2026-06-04T00:00:00Z",
                            "updated_at": "2026-06-04T00:00:00Z",
                        }])
                    else:
                        return httpx.Response(200, json=[])
                return httpx.Response(
                    200,
                    json=[
                        {
                            "id": "mother-linked",
                            "auth_user_id": "auth-linked",
                            "name": "Seed Mother",
                            "phone": "+8801700000001",
                            "verification_status": "PENDING",
                            "patient_id": "patient-a",
                            "gestational_age_weeks": 28,
                            "created_at": "2026-06-03T00:00:00Z",
                            "updated_at": "2026-06-03T00:00:00Z",
                        },
                        {
                            "id": "mother-real",
                            "auth_user_id": "auth-real",
                            "name": "Real Phone Mother",
                            "phone": "+8801712345678",
                            "verification_status": "VERIFIED",
                            "patient_id": None,
                            "gestational_age_weeks": 12,
                            "created_at": "2026-06-04T00:00:00Z",
                            "updated_at": "2026-06-04T00:00:00Z",
                        },
                    ],
                )
            if "/rest/v1/patients" in url:
                if "id=eq." in url:
                    p_id = url.split("id=eq.")[1].split("&")[0]
                    if p_id == "patient-a":
                        chw_id = "chw-a"
                        for patch in state["patches"]:
                            if "/rest/v1/patients" in patch["url"] and "id=eq.patient-a" in patch["url"]:
                                chw_id = patch["json"].get("chw_id", chw_id)
                        return httpx.Response(200, json=[{"id": "patient-a", "chw_id": chw_id, "name": "Marium Begum", "age": 24, "gestational_age_weeks": 32, "last_risk_level": "HIGH", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}])
                if "id=in." in url or "id=eq." in url or "patient-a" in url or "patient-new" in url:
                    rows = []
                    if "patient-a" in url:
                        chw_id = "chw-a"
                        for patch in state["patches"]:
                            if "/rest/v1/patients" in patch["url"] and "id=eq.patient-a" in patch["url"]:
                                chw_id = patch["json"].get("chw_id", chw_id)
                        rows.append({"id": "patient-a", "chw_id": chw_id, "name": "Marium Begum", "age": 24, "gestational_age_weeks": 32, "last_risk_level": "HIGH", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"})
                    if "patient-new" in url:
                        rows.append({"id": "patient-new", "chw_id": "chw-a", "name": "Real Phone Mother", "age": 25, "gestational_age_weeks": 12, "last_risk_level": "LOW", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"})
                    if not rows:
                        rows = [
                            {"id": "patient-a", "chw_id": "chw-a", "name": "Marium Begum", "age": 24, "gestational_age_weeks": 32, "last_risk_level": "HIGH", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"},
                            {"id": "patient-b", "chw_id": "chw-a", "name": "Fatema Begum", "age": 28, "gestational_age_weeks": 20, "last_risk_level": "LOW", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}
                        ]
                    return httpx.Response(200, json=rows)
                return httpx.Response(200, json=[
                    {"id": "patient-a", "chw_id": "chw-a", "name": "Marium Begum", "age": 24, "gestational_age_weeks": 32, "last_risk_level": "HIGH", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"},
                    {"id": "patient-b", "chw_id": "chw-a", "name": "Fatema Begum", "age": 28, "gestational_age_weeks": 20, "last_risk_level": "LOW", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}
                ])
            if "/rest/v1/master_qa" in url:
                return httpx.Response(200, json=[{"id": "qa-a", "trimester": "T1", "topic": "Nutrition", "question_bn": "প্রশ্ন", "answer_bn": "উত্তর", "question_en": "Question", "answer_en": "Answer", "severity": "LOW", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}])
            if "/rest/v1/hospitals" in url:
                return httpx.Response(200, json=[{"id": "hosp-a", "name": "Narsingdi Hospital", "type": "government", "district": "Narsingdi", "upazila": "Narsingdi Sadar", "address": "Sadar Road", "phone": "01700000000", "location": "POINT(90.7153 23.9097)", "is_partner": True, "created_at": "2026-06-02T00:00:00Z"}])
            if "/rest/v1/sms_failures" in url:
                if fail_sms_read:
                    return httpx.Response(404, json={"message": "relation sms_failures does not exist"})
                return httpx.Response(200, json=[{"id": "sms-a", "visit_id": None, "phone_number": "01712345678", "message": "Alert", "error_message": "Timeout", "attempts": 3, "created_at": "2026-06-02T00:00:00Z", "review_status": "OPEN", "review_notes": None, "reviewed_at": None}])
            if "/rest/v1/admin_audit_events" in url:
                if fail_audit_read:
                    return httpx.Response(404, json={"message": "relation admin_audit_events does not exist"})
                return httpx.Response(200, json=[{"id": "audit-a", "actor_user_id": "00000000-0000-0000-0000-00000000ad01", "action": "admin.summary.read", "entity_type": "dashboard", "entity_id": None, "metadata": {}, "created_at": "2026-06-02T00:00:00Z"}])
            if "/rest/v1/notification_events" in url:
                return httpx.Response(200, json=[{
                    "id": "notification-a",
                    "recipient_user_id": "auth-linked",
                    "event_type": "chat_message_created",
                    "title": "New message",
                    "body": "You have a new message.",
                    "data": {"chat_message_id": "message-a"},
                    "created_at": "2026-06-02T00:00:00Z",
                }])
            if "/rest/v1/notification_devices" in url:
                return httpx.Response(200, json=[{
                    "auth_user_id": "auth-linked",
                    "expo_push_token": "ExponentPushToken[test-token]",
                }])
            raise AssertionError(f"Unexpected GET url: {url}")

        async def post(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            state["posts"].append({"url": url, "headers": headers, "json": json})
            if "https://exp.host/--/api/v2/push/send" in url:
                return httpx.Response(200, json={"data": [{"status": "ok"}]})
            if "/rest/v1/patients" in url:
                return httpx.Response(201, json=[json | {"id": "patient-new", "created_at": "2026-06-02T00:00:00Z"}])
            if "/rest/v1/master_qa" in url:
                body = json | {"id": "qa-new", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}
                return httpx.Response(201, json=[body])
            if "/rest/v1/hospitals" in url:
                body = json | {"id": "hosp-new", "created_at": "2026-06-02T00:00:00Z"}
                return httpx.Response(201, json=[body])
            if "/rest/v1/admin_audit_events" in url:
                if fail_audit_writes:
                    return httpx.Response(404, json={"message": "relation admin_audit_events does not exist"})
                return httpx.Response(201, json=[json | {"id": "audit-new", "created_at": "2026-06-02T00:00:00Z"}])
            raise AssertionError(f"Unexpected POST url: {url}")

        async def patch(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            state["patches"].append({"url": url, "headers": headers, "json": json})
            if "/rest/v1/patients" in url:
                return httpx.Response(200, json=[{"id": "patient-a", **json}])
            if "/rest/v1/mothers" in url:
                return httpx.Response(200, json=[{"id": "mother-real", **json}])
            if "/rest/v1/chws" in url:
                return httpx.Response(200, json=[{"id": "chw-a", **json}])
            if "/rest/v1/master_qa" in url:
                return httpx.Response(200, json=[{"id": "qa-a", "trimester": "T1", "topic": json.get("topic", "Nutrition"), "question_bn": "প্রশ্ন", "answer_bn": "উত্তর", "question_en": "Question", "answer_en": "Answer", "severity": "LOW", "created_at": "2026-06-02T00:00:00Z", "updated_at": "2026-06-02T00:00:00Z"}])
            if "/rest/v1/sms_failures" in url:
                return httpx.Response(200, json=[{"id": "sms-a", "review_status": json["review_status"], "review_notes": json.get("review_notes"), "reviewed_at": "2026-06-02T00:00:00Z"}])
            if "/rest/v1/notification_events" in url:
                return httpx.Response(200, json=[{"id": "notification-a", **json}])
            if "/rest/v1/hospitals" in url:
                mock_hospital = {
                    "id": "hosp-a",
                    "name": "Narsingdi Hospital",
                    "type": "government",
                    "district": "Narsingdi",
                    "upazila": "Narsingdi Sadar",
                    "address": "Sadar Road",
                    "phone": "01700000000",
                    "location": "POINT(90.7153 23.9097)",
                    "is_partner": True,
                    "created_at": "2026-06-02T00:00:00Z"
                }
                return httpx.Response(200, json=[mock_hospital | json])
            raise AssertionError(f"Unexpected PATCH url: {url}")

        async def put(self, url: str, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
            state.setdefault("puts", []).append({"url": url, "headers": headers, "json": json})
            return httpx.Response(200, json={})

        async def delete(self, url: str, headers: dict[str, str]) -> httpx.Response:
            state["deletes"].append({"url": url, "headers": headers})
            if "/rest/v1/master_qa" in url:
                return httpx.Response(204)
            if "/rest/v1/hospitals" in url:
                return httpx.Response(204)
            raise AssertionError(f"Unexpected DELETE url: {url}")

    monkeypatch.setattr("app.routers.admin.httpx.AsyncClient", FakeAsyncClient)
    return state


def encode_cursor(payload: dict[str, str]) -> str:
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode()
    return encoded.rstrip("=")


def posted_audits(state: dict[str, Any]) -> list[dict[str, Any]]:
    return [item["json"] for item in state["posts"] if "/rest/v1/admin_audit_events" in item["url"]]


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


def test_process_notifications_sends_expo_push_and_marks_sent(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch, role="super_admin")

    response = client.post(
        "/api/v1/admin/notifications/process",
        headers={"Authorization": "Bearer admin-token"},
        json={"limit": 10},
    )

    assert response.status_code == 200
    assert response.json() == {"processed": 1, "sent": 1, "failed": 0}

    expo_post = next(post for post in state["posts"] if "https://exp.host/--/api/v2/push/send" in post["url"])
    assert expo_post["json"] == [{
        "to": "ExponentPushToken[test-token]",
        "title": "New message",
        "body": "You have a new message.",
        "data": {"chat_message_id": "message-a"},
    }]

    event_patch = next(patch for patch in state["patches"] if "/rest/v1/notification_events" in patch["url"])
    assert event_patch["json"]["status"] == "sent"
    assert event_patch["json"]["provider_response"] == {"data": [{"status": "ok"}]}
    assert event_patch["json"]["sent_at"]


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


def test_admin_can_list_pending_chw_verifications(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch)

    response = client.get("/api/v1/admin/chws/pending-verifications", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 200
    body = response.json()
    assert body["chws"][0]["verification_status"] == "PENDING"
    assert body["page"]["limit"] == 50
    assert body["page"]["count"] == 1
    assert "verification_status=eq.PENDING" in state["gets"][2]["url"]
    assert "order=created_at.asc,id.asc" in state["gets"][2]["url"]
    assert "limit=50" in state["gets"][2]["url"]


def test_admin_patients_returns_mother_registry_with_unlinked_real_mothers(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch)

    response = client.get("/api/v1/admin/patients", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 200
    body = response.json()
    linked, unlinked = body["patients"]
    assert linked["id"] == "mother-linked"
    assert linked["patient_id"] == "patient-a"
    assert linked["chw_id"] == "chw-a"
    assert linked["chw_name"] == "CHW A"
    assert linked["last_risk_level"] == "HIGH"
    assert linked["link_status"] == "LINKED"
    assert unlinked["id"] == "mother-real"
    assert unlinked["patient_id"] is None
    assert unlinked["last_risk_level"] is None
    assert unlinked["link_status"] == "UNLINKED"
    urls = [item["url"] for item in state["gets"]]
    assert any("/rest/v1/mothers" in url and "order=updated_at.desc,id.desc" in url for url in urls)
    assert any("/rest/v1/patients" in url and "id=in.(patient-a)" in url for url in urls)


def test_admin_list_endpoints_apply_cursor_pagination(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch)
    headers = {"Authorization": "Bearer admin-token"}

    chw_cursor = encode_cursor({"name": "CHW A", "chw_id": "chw-a"})
    patient_cursor = encode_cursor({"updated_at": "2026-06-02T00:00:00Z", "id": "patient-a"})
    qa_cursor = encode_cursor({"updated_at": "2026-06-02T00:00:00Z", "id": "qa-a"})
    sms_cursor = encode_cursor({"created_at": "2026-06-02T00:00:00Z", "id": "sms-a"})
    audit_cursor = encode_cursor({"created_at": "2026-06-02T00:00:00Z", "id": "audit-a"})

    responses = [
        client.get(f"/api/v1/admin/chws?limit=1&cursor={chw_cursor}", headers=headers),
        client.get(f"/api/v1/admin/patients?limit=1&cursor={patient_cursor}", headers=headers),
        client.get(f"/api/v1/admin/qa?limit=1&cursor={qa_cursor}", headers=headers),
        client.get(f"/api/v1/admin/telemetry/sms?limit=1&cursor={sms_cursor}", headers=headers),
        client.get(f"/api/v1/admin/audit?limit=1&cursor={audit_cursor}", headers=headers),
    ]

    assert all(response.status_code == 200 for response in responses)
    assert all(response.json()["page"]["limit"] == 1 for response in responses)
    urls = [item["url"] for item in state["gets"]]
    assert any("or=(name.gt.CHW%20A,and(name.eq.CHW%20A,id.gt.chw-a))" in url for url in urls)
    assert any("or=(updated_at.lt.2026-06-02T00%3A00%3A00Z,and(updated_at.eq.2026-06-02T00%3A00%3A00Z,id.lt.patient-a))" in url and "/rest/v1/mothers" in url for url in urls)
    assert any("or=(updated_at.lt.2026-06-02T00%3A00%3A00Z,and(updated_at.eq.2026-06-02T00%3A00%3A00Z,id.lt.qa-a))" in url for url in urls)
    assert any("or=(created_at.lt.2026-06-02T00%3A00%3A00Z,and(created_at.eq.2026-06-02T00%3A00%3A00Z,id.lt.sms-a))" in url for url in urls)
    assert any("or=(created_at.lt.2026-06-02T00%3A00%3A00Z,and(created_at.eq.2026-06-02T00%3A00%3A00Z,id.lt.audit-a))" in url for url in urls)


def test_invalid_admin_pagination_cursor_is_rejected(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch)

    response = client.get("/api/v1/admin/chws?cursor=not-a-valid-cursor", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert not any("/rest/v1/v_chw_list" in item["url"] for item in state.get("gets", []))


def test_super_admin_can_approve_chw_verification(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch)

    response = client.patch(
        "/api/v1/admin/chws/chw-a/verification",
        headers={"Authorization": "Bearer admin-token"},
        json={"verification_status": "APPROVED"},
    )

    assert response.status_code == 200
    assert response.json()["verification_status"] == "APPROVED"
    assert state["patches"][0]["json"] == {
        "is_active": True,
        "verification_status": "APPROVED",
        "rejection_reason": None,
    }
    audits = posted_audits(state)
    assert audits[-1]["action"] == "admin.chw.verification.update"
    assert audits[-1]["entity_type"] == "chw"
    assert audits[-1]["entity_id"] == "chw-a"
    assert audits[-1]["metadata"] == {
        "is_active": True,
        "verification_status": "APPROVED",
        "rejection_reason": None,
    }


def test_super_admin_can_reject_chw_verification(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch)

    response = client.patch(
        "/api/v1/admin/chws/chw-a/verification",
        headers={"Authorization": "Bearer admin-token"},
        json={"verification_status": "REJECTED", "rejection_reason": "Certificate is unreadable."},
    )

    assert response.status_code == 200
    assert response.json()["verification_status"] == "REJECTED"
    assert state["patches"][0]["json"] == {
        "is_active": False,
        "verification_status": "REJECTED",
        "rejection_reason": "Certificate is unreadable.",
    }
    audits = posted_audits(state)
    assert audits[-1]["action"] == "admin.chw.verification.update"
    assert audits[-1]["entity_type"] == "chw"
    assert audits[-1]["entity_id"] == "chw-a"
    assert audits[-1]["metadata"] == {
        "is_active": False,
        "verification_status": "REJECTED",
        "rejection_reason": "Certificate is unreadable.",
    }


def test_chw_rejection_requires_reason(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch)

    response = client.patch(
        "/api/v1/admin/chws/chw-a/verification",
        headers={"Authorization": "Bearer admin-token"},
        json={"verification_status": "REJECTED", "rejection_reason": ""},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert state["patches"] == []


def test_non_super_admin_cannot_update_chw_verification(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch, role="admin")

    response = client.patch(
        "/api/v1/admin/chws/chw-a/verification",
        headers={"Authorization": "Bearer admin-token"},
        json={"verification_status": "APPROVED"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
    assert state["patches"] == []


def test_dev_admin_token_can_approve_chw_verification(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    class DevAuthSettings(FakeSettings):
        admin_dev_auth_enabled = True
        admin_dev_token = "local-admin-dev-token"

    app.dependency_overrides[get_settings] = lambda: DevAuthSettings()
    state = install_admin_httpx(monkeypatch)

    response = client.patch(
        "/api/v1/admin/chws/chw-a/verification",
        headers={"Authorization": "Bearer local-admin-dev-token"},
        json={"verification_status": "APPROVED"},
    )

    assert response.status_code == 200
    assert state["patches"][0]["json"]["verification_status"] == "APPROVED"
    assert not any("/auth/v1/user" in item["url"] for item in state.get("gets", []))


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
    assert response.json() == {"failures": [], "page": {"limit": 50, "count": 0, "next_cursor": None}}


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
    assert response.json() == {"events": [], "page": {"limit": 50, "count": 0, "next_cursor": None}}


def test_assign_chw_unlinked_mother_success(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch, role="super_admin")
    
    response = client.patch(
        "/api/v1/admin/mothers/mother-real/chw-assignment",
        headers={"Authorization": "Bearer admin-token"},
        json={"chw_id": "chw-a", "age": 25},
    )
    
    assert response.status_code == 200
    body = response.json()
    assert body["patient_id"] == "patient-new"
    assert body["chw_id"] == "chw-a"
    assert body["link_status"] == "LINKED"
    
    # Verify patient post
    patient_post = next(p for p in state["posts"] if "/rest/v1/patients" in p["url"])
    assert patient_post["json"]["chw_id"] == "chw-a"
    assert patient_post["json"]["name"] == "Real Phone Mother"
    assert patient_post["json"]["age"] == 25
    
    # Verify mother patch
    mother_patch = next(p for p in state["patches"] if "/rest/v1/mothers" in p["url"])
    assert mother_patch["json"] == {
        "patient_id": "patient-new",
        "chw_email": "chw-a@maasheba.local",
        "chw_phone": "+8801700000001",
    }
    
    # Verify audit event
    audit_event = next(p for p in state["posts"] if "/rest/v1/admin_audit_events" in p["url"])
    assert audit_event["json"]["action"] == "admin.mother.chw_assignment"
    assert audit_event["json"]["entity_id"] == "mother-real"
    assert audit_event["json"]["metadata"]["new_chw_id"] == "chw-a"
    assert audit_event["json"]["metadata"]["old_chw_id"] is None


def test_assign_chw_linked_mother_success(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch, role="super_admin")
    
    response = client.patch(
        "/api/v1/admin/mothers/mother-linked/chw-assignment",
        headers={"Authorization": "Bearer admin-token"},
        json={"chw_id": "chw-a"},
    )
    
    assert response.status_code == 200
    body = response.json()
    assert body["patient_id"] == "patient-a"
    assert body["chw_id"] == "chw-a"
    
    # Verify patient patch (not post)
    patient_patch = next(p for p in state["patches"] if "/rest/v1/patients" in p["url"])
    assert patient_patch["json"]["chw_id"] == "chw-a"
    
    # Verify mother patch (for chw_email/chw_phone synchronization)
    mother_patch = next(p for p in state["patches"] if "/rest/v1/mothers" in p["url"])
    assert mother_patch["json"] == {
        "chw_email": "chw-a@maasheba.local",
        "chw_phone": "+8801700000001",
    }
    
    # Verify audit event
    audit_event = next(p for p in state["posts"] if "/rest/v1/admin_audit_events" in p["url"])
    assert audit_event["json"]["action"] == "admin.mother.chw_assignment"
    assert audit_event["json"]["metadata"]["old_chw_id"] == "chw-a"  # chw-a in patient-a mock
    assert audit_event["json"]["metadata"]["new_chw_id"] == "chw-a"


def test_assign_chw_unlinked_mother_missing_age(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch, role="super_admin")
    
    response = client.patch(
        "/api/v1/admin/mothers/mother-real/chw-assignment",
        headers={"Authorization": "Bearer admin-token"},
        json={"chw_id": "chw-a"},
    )
    
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "AGE_REQUIRED"


def test_assign_chw_non_super_admin_fails(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch, role="admin")
    
    response = client.patch(
        "/api/v1/admin/mothers/mother-real/chw-assignment",
        headers={"Authorization": "Bearer admin-token"},
        json={"chw_id": "chw-a", "age": 25},
    )
    
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_assign_chw_unapproved_or_inactive_chw_fails(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    install_admin_httpx(monkeypatch, role="super_admin")
    
    # Pending
    response = client.patch(
        "/api/v1/admin/mothers/mother-real/chw-assignment",
        headers={"Authorization": "Bearer admin-token"},
        json={"chw_id": "chw-pending", "age": 25},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_CHW"
    
    # Rejected
    response = client.patch(
        "/api/v1/admin/mothers/mother-real/chw-assignment",
        headers={"Authorization": "Bearer admin-token"},
        json={"chw_id": "chw-rejected", "age": 25},
    )
    assert response.status_code == 400
    
    # Inactive
    response = client.patch(
        "/api/v1/admin/mothers/mother-real/chw-assignment",
        headers={"Authorization": "Bearer admin-token"},
        json={"chw_id": "chw-inactive", "age": 25},
    )
    assert response.status_code == 400


def test_admin_can_crud_hospitals(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch, role="super_admin")
    headers = {"Authorization": "Bearer admin-token"}

    # List hospitals
    get_res = client.get("/api/v1/admin/hospitals", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["hospitals"][0]["name"] == "Narsingdi Hospital"

    # Create hospital
    create_res = client.post(
        "/api/v1/admin/hospitals",
        headers=headers,
        json={
            "name": "New Clinic",
            "type": "clinic",
            "district": "Narsingdi",
            "upazila": "Palash",
            "address": "Palash Bazar",
            "phone": "01711111111",
            "is_partner": True,
            "lat": 23.9,
            "lng": 90.6
        }
    )
    assert create_res.status_code == 201
    assert create_res.json()["id"] == "hosp-new"
    assert create_res.json()["lat"] == 23.9
    assert create_res.json()["lng"] == 90.6

    # Update hospital
    update_res = client.patch(
        "/api/v1/admin/hospitals/hosp-a",
        headers=headers,
        json={"name": "Updated Hospital"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Hospital"

    # Delete hospital
    delete_res = client.delete("/api/v1/admin/hospitals/hosp-a", headers=headers)
    assert delete_res.status_code == 204
    assert state["deletes"][0]["url"].endswith("hospitals?id=eq.hosp-a")


def test_non_super_admin_cannot_write_hospitals(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    state = install_admin_httpx(monkeypatch, role="admin")
    headers = {"Authorization": "Bearer admin-token"}

    # Create hospital should fail for normal admin
    create_res = client.post(
        "/api/v1/admin/hospitals",
        headers=headers,
        json={"name": "New Clinic", "type": "clinic"}
    )
    assert create_res.status_code == 403

    # Delete hospital should fail for normal admin
    delete_res = client.delete("/api/v1/admin/hospitals/hosp-a", headers=headers)
    assert delete_res.status_code == 403

