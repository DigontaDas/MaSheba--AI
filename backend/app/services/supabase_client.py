from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx

from app.core.config import Settings
from app.models.sync import SyncRequest


class SupabaseGateway:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def health_check(self) -> bool:
        url = f"{str(self._settings.supabase_url).rstrip('/')}/rest/v1/"
        headers = {
            "apikey": self._settings.supabase_anon_key,
            "Authorization": f"Bearer {self._settings.supabase_anon_key}",
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url, headers=headers)
            return response.status_code < 500
        except httpx.HTTPError:
            return False

    async def sync_outbox(self, request: SyncRequest, bearer_token: str) -> dict[str, Any]:
        user = await self._fetch_authenticated_user(bearer_token)
        chw_id = await self._fetch_active_chw_id(str(user["id"]))
        self._ensure_matching_chw(request, chw_id)
        results = await self._process_outbox_batch(request)
        return {
            "results": results,
            "synced_at": datetime.now(UTC).isoformat(),
        }

    async def _fetch_authenticated_user(self, bearer_token: str) -> dict[str, Any]:
        url = f"{str(self._settings.supabase_url).rstrip('/')}/auth/v1/user"
        headers = {
            "apikey": self._settings.supabase_anon_key,
            "Authorization": bearer_token,
        }
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url, headers=headers)
        except httpx.HTTPError as exc:
            raise SyncGatewayError(
                502,
                {
                    "error": {
                        "code": "SYNC_SUPABASE_UNREACHABLE",
                        "message": "Supabase auth service is unavailable.",
                    }
                },
            ) from exc

        if response.status_code >= 400:
            if response.status_code in {401, 403}:
                raise SyncGatewayError(
                    response.status_code,
                    {
                        "error": {
                            "code": "UNAUTHORIZED",
                            "message": "Invalid or expired token.",
                        }
                    },
                )
            raise SyncGatewayError(
                502,
                {
                    "error": {
                        "code": "SYNC_SUPABASE_UNREACHABLE",
                        "message": "Supabase auth service is unavailable.",
                    }
                },
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise SyncGatewayError(
                502,
                {
                    "error": {
                        "code": "SYNC_SUPABASE_INVALID_RESPONSE",
                        "message": "Supabase auth service returned an invalid response.",
                    }
                },
            ) from exc

        if not isinstance(payload, dict) or not isinstance(payload.get("id"), str):
            raise SyncGatewayError(
                502,
                {
                    "error": {
                        "code": "SYNC_SUPABASE_INVALID_RESPONSE",
                        "message": "Supabase auth service returned an invalid response.",
                    }
                },
            )

        return payload

    async def _fetch_active_chw_id(self, auth_user_id: str) -> str:
        url = f"{str(self._settings.supabase_url).rstrip('/')}/rest/v1/chws?select=id,is_active&auth_user_id=eq.{auth_user_id}&limit=1"
        headers = {
            "apikey": self._settings.supabase_service_role_key,
            "Authorization": f"Bearer {self._settings.supabase_service_role_key}",
        }
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url, headers=headers)
        except httpx.HTTPError as exc:
            raise SyncGatewayError(
                502,
                {
                    "error": {
                        "code": "SYNC_SUPABASE_UNREACHABLE",
                        "message": "Supabase CHW lookup is unavailable.",
                    }
                },
            ) from exc

        if response.status_code >= 400:
            error_payload = _safe_error_payload(response)
            raise SyncGatewayError(response.status_code, error_payload)

        try:
            payload = response.json()
        except ValueError as exc:
            raise SyncGatewayError(
                502,
                {
                    "error": {
                        "code": "SYNC_SUPABASE_INVALID_RESPONSE",
                        "message": "Supabase CHW lookup returned an invalid response.",
                    }
                },
            ) from exc

        if not isinstance(payload, list) or not payload:
            raise SyncGatewayError(
                403,
                {
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "Authenticated user is not an active CHW.",
                    }
                },
            )

        chw = payload[0]
        if not isinstance(chw, dict) or not isinstance(chw.get("id"), str) or not chw.get("is_active"):
            raise SyncGatewayError(
                403,
                {
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "Authenticated user is not an active CHW.",
                    }
                },
            )

        return chw["id"]

    def _ensure_matching_chw(self, request: SyncRequest, chw_id: str) -> None:
        cross_chw_event = next((event for event in request.events if event.payload["chw_id"] != chw_id), None)
        if cross_chw_event is None:
            return

        raise SyncGatewayError(
            403,
            {
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Event payload CHW does not match the authenticated CHW.",
                    "details": {"idempotency_key": cross_chw_event.idempotency_key},
                }
            },
        )

    async def _process_outbox_batch(self, request: SyncRequest) -> list[dict[str, Any]]:
        url = f"{str(self._settings.supabase_url).rstrip('/')}/rest/v1/rpc/process_outbox_batch"
        headers = {
            "apikey": self._settings.supabase_service_role_key,
            "Authorization": f"Bearer {self._settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }
        payload = {"events": request.model_dump(mode="json")["events"]}
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(url, headers=headers, json=payload)
        except httpx.HTTPError as exc:
            raise SyncGatewayError(
                502,
                {
                    "error": {
                        "code": "SYNC_SUPABASE_UNREACHABLE",
                        "message": "Supabase sync RPC is unavailable.",
                    }
                },
            ) from exc

        if response.status_code >= 400:
            error_payload = _safe_error_payload(response)
            raise SyncGatewayError(response.status_code, error_payload)

        try:
            payload = response.json()
        except ValueError as exc:
            raise SyncGatewayError(
                502,
                {
                    "error": {
                        "code": "SYNC_SUPABASE_INVALID_RESPONSE",
                        "message": "Supabase sync RPC returned an invalid response.",
                    }
                },
            ) from exc

        if not isinstance(payload, list):
            raise SyncGatewayError(
                502,
                {
                    "error": {
                        "code": "SYNC_SUPABASE_INVALID_RESPONSE",
                        "message": "Supabase sync RPC returned an invalid response.",
                    }
                },
            )

        return payload


class SyncGatewayError(Exception):
    def __init__(self, status_code: int, payload: dict[str, Any]) -> None:
        super().__init__("sync gateway error")
        self.status_code = status_code
        self.payload = payload


def _safe_error_payload(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except ValueError:
        return {
            "error": {
                "code": "SYNC_EDGE_ERROR",
                "message": "Sync edge function returned an error.",
            }
        }

    if not isinstance(payload, dict) or not isinstance(payload.get("error"), dict):
        return {
            "error": {
                "code": "SYNC_EDGE_ERROR",
                "message": "Sync edge function returned an error.",
            }
        }

    error = payload["error"]
    code = error.get("code") if isinstance(error.get("code"), str) else "SYNC_EDGE_ERROR"
    message = (
        error.get("message")
        if isinstance(error.get("message"), str)
        else "Sync edge function returned an error."
    )
    return {"error": {"code": code, "message": message}}
