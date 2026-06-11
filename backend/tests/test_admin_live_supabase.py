from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
import pytest
from dotenv import dotenv_values
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


@dataclass(frozen=True)
class LiveSettings:
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    admin_dev_auth_enabled: bool = False
    admin_dev_token: str = ""


def _live_settings() -> LiveSettings:
    if os.getenv("MAASHEBA_RUN_LIVE_SUPABASE") != "1":
        pytest.skip("Set MAASHEBA_RUN_LIVE_SUPABASE=1 to run live Supabase smoke tests.")
    dotenv = dotenv_values(Path(__file__).resolve().parents[2] / ".env")
    required = ("CI_SUPABASE_URL", "CI_SUPABASE_ANON_KEY", "CI_SUPABASE_SERVICE_ROLE_KEY")
    values = {name: os.getenv(name) or dotenv.get(name) for name in required}
    missing = [name for name in required if not values.get(name)]
    if missing:
        pytest.skip(f"Missing live Supabase environment variables: {', '.join(missing)}")
    return LiveSettings(
        supabase_url=str(values["CI_SUPABASE_URL"]).strip().strip("'\"").rstrip("/"),
        supabase_anon_key=str(values["CI_SUPABASE_ANON_KEY"]).strip().strip("'\""),
        supabase_service_role_key=str(values["CI_SUPABASE_SERVICE_ROLE_KEY"]).strip().strip("'\""),
    )


class SupabaseLiveClient:
    def __init__(self, settings: LiveSettings) -> None:
        self.settings = settings
        self.client = httpx.Client(timeout=30.0)

    def close(self) -> None:
        self.client.close()

    def _service_headers(self, *, returning: bool = False) -> dict[str, str]:
        headers = {
            "apikey": self.settings.supabase_service_role_key,
            "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }
        if returning:
            headers["Prefer"] = "return=representation"
        return headers

    def _anon_headers(self) -> dict[str, str]:
        return {
            "apikey": self.settings.supabase_anon_key,
            "Content-Type": "application/json",
        }

    def create_auth_user(self, email: str, password: str, metadata: dict[str, Any]) -> str:
        response = self.client.post(
            f"{self.settings.supabase_url}/auth/v1/admin/users",
            headers=self._service_headers(),
            json={
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": metadata,
            },
        )
        response.raise_for_status()
        payload = response.json()
        user = payload.get("user", payload)
        user_id = user.get("id")
        assert isinstance(user_id, str) and user_id
        return user_id

    def delete_auth_user(self, user_id: str) -> None:
        response = self.client.delete(
            f"{self.settings.supabase_url}/auth/v1/admin/users/{user_id}",
            headers=self._service_headers(),
        )
        if response.status_code not in (200, 204, 404):
            response.raise_for_status()

    def sign_in(self, email: str, password: str) -> str:
        response = self.client.post(
            f"{self.settings.supabase_url}/auth/v1/token?grant_type=password",
            headers=self._anon_headers(),
            json={"email": email, "password": password},
        )
        response.raise_for_status()
        access_token = response.json().get("access_token")
        assert isinstance(access_token, str) and access_token
        return access_token

    def insert_row(self, table: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.client.post(
            f"{self.settings.supabase_url}/rest/v1/{table}",
            headers=self._service_headers(returning=True),
            json=payload,
        )
        response.raise_for_status()
        rows = response.json()
        assert isinstance(rows, list) and rows
        return rows[0]

    def select_rows(self, table: str, *, select: str = "*", query: str = "") -> list[dict[str, Any]]:
        response = self.client.get(
            f"{self.settings.supabase_url}/rest/v1/{table}?select={select}{query}",
            headers=self._service_headers(),
        )
        response.raise_for_status()
        rows = response.json()
        assert isinstance(rows, list)
        return rows

    def delete_rows(self, table: str, query: str) -> None:
        response = self.client.delete(
            f"{self.settings.supabase_url}/rest/v1/{table}?{query}",
            headers=self._service_headers(),
        )
        if response.status_code not in (200, 204, 404):
            response.raise_for_status()


@pytest.mark.live_supabase
def test_live_admin_can_approve_and_reject_chw_verifications() -> None:
    settings = _live_settings()
    supabase = SupabaseLiveClient(settings)
    run_id = uuid.uuid4().hex
    password = f"MaaSheba-{run_id[:12]}!"

    admin_user_id: str | None = None
    approve_user_id: str | None = None
    reject_user_id: str | None = None
    approve_chw_id = str(uuid.uuid4())
    reject_chw_id = str(uuid.uuid4())

    try:
        admin_email = f"ci-admin-{run_id}@maasheba.test"
        approve_email = f"ci-chw-approve-{run_id}@maasheba.test"
        reject_email = f"ci-chw-reject-{run_id}@maasheba.test"

        admin_user_id = supabase.create_auth_user(admin_email, password, {"role": "admin", "name": "CI Admin"})
        approve_user_id = supabase.create_auth_user(approve_email, password, {"role": "chw", "name": "CI CHW Approve"})
        reject_user_id = supabase.create_auth_user(reject_email, password, {"role": "chw", "name": "CI CHW Reject"})

        # Clean up any trigger-created rows to avoid unique constraint violations on auth_user_id
        supabase.delete_rows("chws", f"auth_user_id=eq.{approve_user_id}")
        supabase.delete_rows("chws", f"auth_user_id=eq.{reject_user_id}")
        supabase.delete_rows("mothers", f"auth_user_id=eq.{admin_user_id}")

        supabase.insert_row("admin_users", {"auth_user_id": admin_user_id, "role": "super_admin", "is_active": True})
        supabase.insert_row(
            "chws",
            {
                "id": approve_chw_id,
                "auth_user_id": approve_user_id,
                "name": "CI CHW Approve",
                "union_name": "CI Union",
                "upazila": "CI Upazila",
                "is_active": False,
                "organization_name": "CI Clinic",
                "worker_type": "HA",
                "years_of_experience": 3,
                "certificate_url": "https://example.com/ci-certificate.png",
                "verification_status": "PENDING",
            },
        )
        supabase.insert_row(
            "chws",
            {
                "id": reject_chw_id,
                "auth_user_id": reject_user_id,
                "name": "CI CHW Reject",
                "union_name": "CI Union",
                "upazila": "CI Upazila",
                "is_active": False,
                "organization_name": "CI Clinic",
                "worker_type": "FWA",
                "years_of_experience": 2,
                "certificate_url": "https://example.com/ci-certificate.png",
                "verification_status": "PENDING",
            },
        )

        token = supabase.sign_in(admin_email, password)
        app.dependency_overrides[get_settings] = lambda: settings
        client = TestClient(app)

        approve_response = client.patch(
            f"/api/v1/admin/chws/{approve_chw_id}/verification",
            headers={"Authorization": f"Bearer {token}"},
            json={"verification_status": "APPROVED"},
        )
        reject_response = client.patch(
            f"/api/v1/admin/chws/{reject_chw_id}/verification",
            headers={"Authorization": f"Bearer {token}"},
            json={"verification_status": "REJECTED", "rejection_reason": "CI smoke rejection."},
        )

        assert approve_response.status_code == 200, approve_response.text
        assert reject_response.status_code == 200, reject_response.text
        assert approve_response.json()["verification_status"] == "APPROVED"
        assert reject_response.json()["verification_status"] == "REJECTED"

        rows = supabase.select_rows(
            "chws",
            select="id,is_active,verification_status,rejection_reason",
            query=f"&id=in.({approve_chw_id},{reject_chw_id})&order=id.asc",
        )
        by_id = {row["id"]: row for row in rows}
        assert by_id[approve_chw_id]["is_active"] is True
        assert by_id[approve_chw_id]["verification_status"] == "APPROVED"
        assert by_id[approve_chw_id]["rejection_reason"] is None
        assert by_id[reject_chw_id]["is_active"] is False
        assert by_id[reject_chw_id]["verification_status"] == "REJECTED"
        assert by_id[reject_chw_id]["rejection_reason"] == "CI smoke rejection."

        audit_rows = supabase.select_rows(
            "admin_audit_events",
            select="action,entity_type,entity_id,metadata",
            query=f"&action=eq.admin.chw.verification.update&entity_id=in.({approve_chw_id},{reject_chw_id})",
        )
        assert {row["entity_id"] for row in audit_rows} == {approve_chw_id, reject_chw_id}
        audit_by_entity = {row["entity_id"]: row for row in audit_rows}
        assert audit_by_entity[approve_chw_id]["entity_type"] == "chw"
        assert audit_by_entity[approve_chw_id]["metadata"]["verification_status"] == "APPROVED"
        assert audit_by_entity[reject_chw_id]["entity_type"] == "chw"
        assert audit_by_entity[reject_chw_id]["metadata"]["verification_status"] == "REJECTED"
        assert audit_by_entity[reject_chw_id]["metadata"]["rejection_reason"] == "CI smoke rejection."
    finally:
        app.dependency_overrides.pop(get_settings, None)
        try:
            if admin_user_id:
                supabase.delete_rows("admin_audit_events", f"actor_user_id=eq.{admin_user_id}")
            supabase.delete_rows("chws", f"id=in.({approve_chw_id},{reject_chw_id})")
            if approve_user_id and reject_user_id:
                supabase.delete_rows("chws", f"auth_user_id=in.({approve_user_id},{reject_user_id})")
            elif approve_user_id:
                supabase.delete_rows("chws", f"auth_user_id=eq.{approve_user_id}")
            elif reject_user_id:
                supabase.delete_rows("chws", f"auth_user_id=eq.{reject_user_id}")
            if admin_user_id:
                supabase.delete_rows("admin_users", f"auth_user_id=eq.{admin_user_id}")
                supabase.delete_rows("mothers", f"auth_user_id=eq.{admin_user_id}")
            for user_id in (approve_user_id, reject_user_id, admin_user_id):
                if user_id:
                    supabase.delete_auth_user(user_id)
        finally:
            supabase.close()
