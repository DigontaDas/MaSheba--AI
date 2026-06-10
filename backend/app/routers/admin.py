from __future__ import annotations

import csv
import base64
import io
import json
from datetime import UTC, datetime
from typing import Any, Literal, NamedTuple
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, Header, Query, status
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings


router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


class AdminContext(BaseModel):
    auth_user_id: str
    email: str | None = None
    role: Literal["admin", "super_admin"]


class AdminAuthError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message


class ChwStatusRequest(BaseModel):
    is_active: bool


class ChwVerificationRequest(BaseModel):
    verification_status: Literal["APPROVED", "REJECTED"]
    rejection_reason: str | None = Field(default=None, max_length=500)


class QaCreateRequest(BaseModel):
    trimester: Literal["T1", "T2", "T3", "POSTPARTUM", "ALL"]
    topic: str = Field(min_length=1, max_length=160)
    question_bn: str = Field(min_length=1, max_length=2000)
    answer_bn: str = Field(min_length=1, max_length=6000)
    question_en: str = Field(min_length=1, max_length=2000)
    answer_en: str = Field(min_length=1, max_length=6000)
    severity: Literal["LOW", "MODERATE", "HIGH"]


class QaUpdateRequest(BaseModel):
    trimester: Literal["T1", "T2", "T3", "POSTPARTUM", "ALL"] | None = None
    topic: str | None = Field(default=None, min_length=1, max_length=160)
    question_bn: str | None = Field(default=None, min_length=1, max_length=2000)
    answer_bn: str | None = Field(default=None, min_length=1, max_length=6000)
    question_en: str | None = Field(default=None, min_length=1, max_length=2000)
    answer_en: str | None = Field(default=None, min_length=1, max_length=6000)
    severity: Literal["LOW", "MODERATE", "HIGH"] | None = None

    def update_payload(self) -> dict[str, Any]:
        return self.model_dump(exclude_none=True)


class SmsReviewRequest(BaseModel):
    review_status: Literal["OPEN", "REVIEWED", "DISMISSED"]
    review_notes: str | None = Field(default=None, max_length=2000)


class ChwReviewModerationRequest(BaseModel):
    status: Literal["active", "flagged", "removed"]
    moderation_reason: str | None = Field(default=None, max_length=500)


class ChwAssignmentRequest(BaseModel):
    chw_id: str
    age: int | None = Field(default=None, ge=10, le=60)


class ReassignmentResolveRequest(BaseModel):
    new_chw_id: str


class ReassignmentDismissRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class NotificationProcessRequest(BaseModel):
    limit: int = Field(default=50, ge=1, le=100)


class CursorPage(NamedTuple):
    query: str
    order: str
    limit: int
    fields: tuple[str, str]
    direction: Literal["asc", "desc"]


def error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


def _base_url(settings: Settings) -> str:
    return str(settings.supabase_url).rstrip("/")


def _service_headers(settings: Settings, *, returning: bool = False) -> dict[str, str]:
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    if returning:
        headers["Prefer"] = "return=representation"
    return headers


def _auth_headers(settings: Settings, authorization: str) -> dict[str, str]:
    return {
        "apikey": settings.supabase_anon_key,
        "Authorization": authorization,
    }


async def _supabase_get(settings: Settings, path: str, *, select: str = "*", query: str = "") -> list[dict[str, Any]]:
    url = f"{_base_url(settings)}/rest/v1/{path}?select={quote(select, safe=',()*')}{query}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_service_headers(settings))
    if response.status_code >= 400:
        print(f"Supabase GET failed for {path} with status {response.status_code}: {response.text}")
        raise AdminAuthError(status.HTTP_502_BAD_GATEWAY, "DATABASE_QUERY_FAILED", f"Failed to query {path}. {response.text}")
    return response.json()


async def _supabase_post(settings: Settings, path: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{_base_url(settings)}/rest/v1/{path}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_service_headers(settings, returning=True), json=payload)
    if response.status_code >= 400:
        raise AdminAuthError(status.HTTP_502_BAD_GATEWAY, "DATABASE_WRITE_FAILED", f"Failed to create {path}.")
    data = response.json()
    return data[0] if isinstance(data, list) and data else {}


async def _supabase_patch(settings: Settings, path: str, entity_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{_base_url(settings)}/rest/v1/{path}?id=eq.{quote(entity_id)}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(url, headers=_service_headers(settings, returning=True), json=payload)
    if response.status_code >= 400:
        raise AdminAuthError(status.HTTP_502_BAD_GATEWAY, "DATABASE_WRITE_FAILED", f"Failed to update {path}.")
    data = response.json()
    return data[0] if isinstance(data, list) and data else {}


async def _supabase_delete(settings: Settings, path: str, entity_id: str) -> None:
    url = f"{_base_url(settings)}/rest/v1/{path}?id=eq.{quote(entity_id)}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.delete(url, headers=_service_headers(settings))
    if response.status_code >= 400:
        raise AdminAuthError(status.HTTP_502_BAD_GATEWAY, "DATABASE_WRITE_FAILED", f"Failed to delete {path}.")


async def _get_chw_auth_contact(settings: Settings, chw: dict[str, Any]) -> tuple[str | None, str | None]:
    if not chw.get("auth_user_id"):
        return None, None
    try:
        auth_url = f"{_base_url(settings)}/auth/v1/admin/users/{chw['auth_user_id']}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(auth_url, headers=_service_headers(settings))
        if response.status_code != 200:
            return None, None
        data = response.json()
        return data.get("email"), data.get("phone")
    except httpx.HTTPError:
        return None, None


async def _send_expo_push(messages: list[dict[str, Any]]) -> tuple[bool, Any]:
    if not messages:
        return True, {"sent": 0}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://exp.host/--/api/v2/push/send",
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            json=messages,
        )
    try:
        payload: Any = response.json()
    except ValueError:
        payload = {"text": response.text}
    return response.status_code < 400, payload


async def require_admin(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> AdminContext | JSONResponse:
    if not authorization or not authorization.startswith("Bearer ") or not authorization[7:].strip():
        raise AdminAuthError(status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", "Bearer token is required.")

    token = authorization[7:].strip()
    if getattr(settings, "admin_dev_auth_enabled", False) and getattr(settings, "admin_dev_token", "") and token == settings.admin_dev_token:
        return AdminContext(auth_user_id="00000000-0000-0000-0000-00000000ad01", email="admin@maasheba.local", role="super_admin")

    auth_url = f"{_base_url(settings)}/auth/v1/user"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            auth_response = await client.get(auth_url, headers=_auth_headers(settings, authorization))
        if auth_response.status_code >= 400:
            raise AdminAuthError(status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", "Invalid or expired authorization token.")
        auth_user = auth_response.json()
        auth_user_id = auth_user.get("id")
        if not auth_user_id:
            raise AdminAuthError(status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", "Authorization token did not include a user id.")

        profiles = await _supabase_get(
            settings,
            "admin_users",
            select="auth_user_id,role,is_active",
            query=f"&auth_user_id=eq.{quote(auth_user_id)}&is_active=eq.true&limit=1",
        )
    except AdminAuthError:
        raise
    except httpx.HTTPError as exc:
        raise AdminAuthError(status.HTTP_502_BAD_GATEWAY, "AUTH_SERVICE_UNAVAILABLE", "Admin authorization service is unreachable.") from exc

    if not profiles:
        raise AdminAuthError(status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Active admin privileges are required.")

    profile = profiles[0]
    return AdminContext(auth_user_id=auth_user_id, email=auth_user.get("email"), role=profile["role"])


async def audit(settings: Settings, admin: AdminContext, action: str, entity_type: str, entity_id: str | None = None, metadata: dict[str, Any] | None = None) -> None:
    try:
        await _supabase_post(
            settings,
            "admin_audit_events",
            {
                "actor_user_id": admin.auth_user_id,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "metadata": metadata or {},
            },
        )
    except AdminAuthError:
        return


def _handle_admin_error(error: AdminAuthError) -> JSONResponse:
    return error_response(error.status_code, error.code, error.message)


def _require_super_admin(admin: AdminContext, action: str) -> None:
    if admin.role != "super_admin":
        raise AdminAuthError(status.HTTP_403_FORBIDDEN, "FORBIDDEN", f"Super-admin privileges are required to {action}.")


def _decode_cursor(cursor: str | None) -> dict[str, str] | None:
    if not cursor:
        return None
    try:
        padding = "=" * (-len(cursor) % 4)
        decoded = base64.urlsafe_b64decode(f"{cursor}{padding}".encode()).decode()
        payload = json.loads(decoded)
    except (ValueError, json.JSONDecodeError) as exc:
        raise AdminAuthError(status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "Invalid pagination cursor.") from exc
    if not isinstance(payload, dict) or not all(isinstance(value, str) for value in payload.values()):
        raise AdminAuthError(status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "Invalid pagination cursor.")
    if "chw_id" in payload and "id" not in payload:
        payload["id"] = payload["chw_id"]
    return payload


def _encode_cursor(row: dict[str, Any], fields: tuple[str, str]) -> str:
    payload = {field: str(row.get(field) or "") for field in fields}
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode()
    return encoded.rstrip("=")


def _cursor_page(
    *,
    order: str,
    fields: tuple[str, str],
    direction: Literal["asc", "desc"],
    limit: int,
    cursor: str | None,
    extra_query: str = "",
) -> CursorPage:
    query = extra_query
    cursor_payload = _decode_cursor(cursor)
    if cursor_payload:
        first, second = fields
        if first not in cursor_payload or second not in cursor_payload:
            raise AdminAuthError(status.HTTP_422_UNPROCESSABLE_CONTENT, "VALIDATION_ERROR", "Invalid pagination cursor.")
        operator = "gt" if direction == "asc" else "lt"
        first_value = quote(cursor_payload[first], safe="")
        second_value = quote(cursor_payload[second], safe="")
        query += f"&or=({first}.{operator}.{first_value},and({first}.eq.{first_value},{second}.{operator}.{second_value}))"
    query += f"&order={order}&limit={limit}"
    return CursorPage(query=query, order=order, limit=limit, fields=fields, direction=direction)


def _page(rows: list[dict[str, Any]], page: CursorPage) -> dict[str, Any]:
    return {
        "limit": page.limit,
        "count": len(rows),
        "next_cursor": _encode_cursor(rows[-1], page.fields) if len(rows) == page.limit and rows else None,
    }


def _in_filter(values: list[str]) -> str:
    return ",".join(quote(value, safe="") for value in values if value)


def _parse_location(loc: Any) -> tuple[float | None, float | None]:
    """Parse a Supabase geography column (GeoJSON dict or WKT string) into (lat, lng).
    Returns (None, None) if the location is missing or unparseable."""
    if not loc:
        return None, None
    if isinstance(loc, dict) and loc.get("type") == "Point" and isinstance(loc.get("coordinates"), list):
        coords = loc["coordinates"]
        if len(coords) >= 2:
            return float(coords[1]), float(coords[0])  # GeoJSON is [lng, lat]
    if isinstance(loc, str):
        try:
            content = loc.replace("POINT(", "").replace(")", "").strip()
            parts = content.split()
            if len(parts) >= 2:
                return float(parts[1]), float(parts[0])  # WKT is "lng lat"
        except (ValueError, IndexError):
            pass
    return None, None


async def _load_mother_registry(settings: Settings, page: CursorPage) -> list[dict[str, Any]]:

    mothers = await _supabase_get(
        settings,
        "mothers",
        select="id,auth_user_id,name,phone,verification_status,patient_id,gestational_age_weeks,location,age,location_name,created_at,updated_at,chw_phone",
        query=page.query,
    )
    patient_ids = sorted({mother.get("patient_id") for mother in mothers if mother.get("patient_id")})
    patients_by_id: dict[str, dict[str, Any]] = {}
    chws_by_id: dict[str, dict[str, Any]] = {}

    if patient_ids:
        patients = await _supabase_get(
            settings,
            "patients",
            select="id,chw_id,name,age,gestational_age_weeks,last_risk_level,created_at,updated_at",
            query=f"&id=in.({_in_filter(patient_ids)})",
        )
        patients_by_id = {patient["id"]: patient for patient in patients if patient.get("id")}

        chw_ids = sorted({patient.get("chw_id") for patient in patients if patient.get("chw_id")})
        if chw_ids:
            chws = await _supabase_get(
                settings,
                "chws",
                select="id,name",
                query=f"&id=in.({_in_filter(chw_ids)})",
            )
            chws_by_id = {chw["id"]: chw for chw in chws if chw.get("id")}

    rows: list[dict[str, Any]] = []
    for mother in mothers:
        patient = patients_by_id.get(mother.get("patient_id") or "")
        chw_id = patient.get("chw_id") if patient else None
        chw = chws_by_id.get(chw_id or "")
        rows.append(
            {
                "id": mother.get("id"),
                "auth_user_id": mother.get("auth_user_id"),
                "name": mother.get("name"),
                "phone": mother.get("phone"),
                "verification_status": mother.get("verification_status"),
                "patient_id": mother.get("patient_id"),
                "chw_id": chw_id,
                "chw_name": chw.get("name") if chw else None,
                "chw_phone": mother.get("chw_phone"),
                "age": mother.get("age") if mother.get("age") is not None else (patient.get("age") if patient else None),
                "gestational_age_weeks": patient.get("gestational_age_weeks") if patient and patient.get("gestational_age_weeks") is not None else mother.get("gestational_age_weeks"),
                "last_risk_level": patient.get("last_risk_level") if patient else None,
                "link_status": "LINKED" if patient else "UNLINKED",
                "location": mother.get("location"),
                "location_name": mother.get("location_name"),
                "created_at": mother.get("created_at"),
                "updated_at": mother.get("updated_at") or mother.get("created_at"),
            }
        )
    return rows


@router.get("/summary", response_model=None)
async def get_summary(
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        chws, risk_summary, heatmap = await _load_summary_rows(settings)
        mothers = await _supabase_get(settings, "mothers", select="id", query="&limit=10000")
        await audit(settings, admin, "admin.summary.read", "dashboard")
        return {
            "metrics": _metrics(chws, risk_summary, len(mothers)),
            "chws": chws,
            "risk_summary": risk_summary,
            "heatmap": heatmap,
        }
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/chws", response_model=None)
async def get_chws(
    limit: int = Query(default=50, ge=1, le=200),
    cursor: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        page = _cursor_page(order="name.asc,id.asc", fields=("name", "id"), direction="asc", limit=limit, cursor=cursor)
        chws = await _supabase_get(
            settings,
            "chws",
            select="id,name,union_name,upazila,district,is_active,verification_status,rejection_reason,created_at,organization_name,worker_type,years_of_experience,certificate_url,location",
            query=page.query,
        )
        chw_ids = [c["id"] for c in chws if c.get("id")]
        patient_counts = {}
        if chw_ids:
            patients = await _supabase_get(
                settings,
                "patients",
                select="chw_id",
                query=f"&chw_id=in.({_in_filter(chw_ids)})",
            )
            for p in patients:
                c_id = p.get("chw_id")
                if c_id:
                    patient_counts[c_id] = patient_counts.get(c_id, 0) + 1
        
        mapped_chws = []
        for c in chws:
            chw_lat, chw_lng = _parse_location(c.get("location"))
            mapped_chws.append({
                "id": c["id"],
                "chw_id": c["id"],
                "name": c["name"],
                "union_name": c["union_name"],
                "upazila": c["upazila"],
                "district": c.get("district"),
                "is_active": c["is_active"],
                "verification_status": c.get("verification_status"),
                "rejection_reason": c.get("rejection_reason"),
                "created_at": c.get("created_at"),
                "organization_name": c.get("organization_name"),
                "worker_type": c.get("worker_type"),
                "years_of_experience": c.get("years_of_experience"),
                "certificate_url": c.get("certificate_url"),
                "patient_count": patient_counts.get(c["id"], 0),
                "lat": chw_lat,
                "lng": chw_lng,
            })
        await audit(settings, admin, "admin.chws.read", "chw")
        return {"chws": mapped_chws, "page": _page(mapped_chws, page)}
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/chws/pending-verifications", response_model=None)
async def get_pending_chw_verifications(
    limit: int = Query(default=50, ge=1, le=200),
    cursor: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        page = _cursor_page(
            order="created_at.asc,id.asc",
            fields=("created_at", "id"),
            direction="asc",
            limit=limit,
            cursor=cursor,
            extra_query="&verification_status=eq.PENDING",
        )
        pending = await _supabase_get(
            settings,
            "chws",
            select="id,name,union_name,upazila,district,organization_name,worker_type,years_of_experience,certificate_url,verification_status,created_at",
            query=page.query,
        )
        await audit(settings, admin, "admin.chw.verifications.read", "chw")
        return {"chws": pending, "page": _page(pending, page)}
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.patch("/chws/{chw_id}/status", response_model=None)
async def update_chw_status(
    chw_id: str,
    request: ChwStatusRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        if request.is_active is False:
            _require_super_admin(admin, "deactivate CHWs")
        updated = await _supabase_patch(settings, "chws", chw_id, {"is_active": request.is_active})
        await audit(settings, admin, "admin.chw.status.update", "chw", chw_id, {"is_active": request.is_active})
        return updated
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.patch("/chws/{chw_id}/verification", response_model=None)
async def update_chw_verification(
    chw_id: str,
    request: ChwVerificationRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        _require_super_admin(admin, "approve or reject CHW verification requests")
        if request.verification_status == "REJECTED" and not (request.rejection_reason or "").strip():
            return error_response(status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "Rejection reason is required.")

        payload: dict[str, Any] = {
            "is_active": request.verification_status == "APPROVED",
            "verification_status": request.verification_status,
            "rejection_reason": None if request.verification_status == "APPROVED" else request.rejection_reason.strip(),
        }
        updated = await _supabase_patch(settings, "chws", chw_id, payload)
        await audit(settings, admin, "admin.chw.verification.update", "chw", chw_id, payload)
        return updated
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/chw-reviews/summary", response_model=None)
async def get_chw_review_summary(
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        rows = await _supabase_get(
            settings,
            "v_chw_review_summary",
            select="chw_id,chw_name,average_rating,review_count",
            query="&order=chw_name.asc",
        )
        await audit(settings, admin, "admin.chw_reviews.summary.read", "chw_review")
        return {
            "reviews": [
                {
                    **row,
                    "is_low_rated": bool(row.get("review_count", 0) and float(row.get("average_rating") or 0) < 3.0),
                }
                for row in rows
            ]
        }
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/chw-reviews", response_model=None)
async def get_chw_reviews(
    chw_id: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        query = "&order=created_at.desc"
        if chw_id:
            query += f"&chw_id=eq.{quote(chw_id)}"
        rows = await _supabase_get(
            settings,
            "chw_reviews",
            select="id,mother_id,chw_id,rating,review_text,status,moderation_reason,created_at,updated_at",
            query=query,
        )
        mother_ids = sorted({row.get("mother_id") for row in rows if row.get("mother_id")})
        mothers_by_id: dict[str, dict[str, Any]] = {}
        if mother_ids:
            mothers = await _supabase_get(
                settings,
                "mothers",
                select="id,name",
                query=f"&id=in.({_in_filter(mother_ids)})",
            )
            mothers_by_id = {mother["id"]: mother for mother in mothers if mother.get("id")}

        reviews = []
        for row in rows:
            mother_name = (mothers_by_id.get(row.get("mother_id") or "", {}).get("name") or "Ma").strip()
            reviews.append(
                {
                    **row,
                    "mother_first_name": mother_name.split()[0] if mother_name else "Ma",
                }
            )
        await audit(settings, admin, "admin.chw_reviews.read", "chw_review", metadata={"chw_id": chw_id})
        return {"reviews": reviews}
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.patch("/chw-reviews/{review_id}/moderation", response_model=None)
async def moderate_chw_review(
    review_id: str,
    request: ChwReviewModerationRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        _require_super_admin(admin, "moderate CHW reviews")
        payload = {
            "status": request.status,
            "moderation_reason": request.moderation_reason.strip() if request.moderation_reason else None,
            "moderated_by": admin.auth_user_id,
            "moderated_at": datetime.now(UTC).isoformat(),
        }
        if request.status == "active":
            payload["moderation_reason"] = None
            payload["moderated_by"] = None
            payload["moderated_at"] = None
        updated = await _supabase_patch(settings, "chw_reviews", review_id, payload)
        await audit(settings, admin, "admin.chw_review.moderate", "chw_review", review_id, payload)
        return updated
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.post("/notifications/process", response_model=None)
async def process_notification_events(
    request: NotificationProcessRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, int] | JSONResponse:
    try:
        _require_super_admin(admin, "process push notification events")
        events = await _supabase_get(
            settings,
            "notification_events",
            select="id,recipient_user_id,event_type,title,body,data,created_at",
            query=f"&status=eq.queued&order=created_at.asc&limit={request.limit}",
        )
        if not events:
            await audit(settings, admin, "admin.notifications.process", "notification_events", metadata={"processed": 0})
            return {"processed": 0, "sent": 0, "failed": 0}

        user_ids = sorted({row["recipient_user_id"] for row in events if row.get("recipient_user_id")})
        devices = await _supabase_get(
            settings,
            "notification_devices",
            select="auth_user_id,expo_push_token",
            query=f"&enabled=eq.true&auth_user_id=in.({_in_filter(user_ids)})" if user_ids else "&id=is.null",
        )
        tokens_by_user: dict[str, list[str]] = {}
        for device in devices:
            user_id = device.get("auth_user_id")
            token = device.get("expo_push_token")
            if user_id and token:
                tokens_by_user.setdefault(user_id, []).append(token)

        sent = 0
        failed = 0
        for event in events:
            event_id = event["id"]
            tokens = tokens_by_user.get(event.get("recipient_user_id"), [])
            if not tokens:
                failed += 1
                await _supabase_patch(
                    settings,
                    "notification_events",
                    event_id,
                    {"status": "failed", "provider_response": {"error": "NO_ENABLED_DEVICE"}},
                )
                continue

            ok, provider_response = await _send_expo_push(
                [
                    {
                        "to": token,
                        "title": event["title"],
                        "body": event["body"],
                        "data": event.get("data") or {},
                    }
                    for token in tokens
                ]
            )
            if ok:
                sent += 1
                await _supabase_patch(
                    settings,
                    "notification_events",
                    event_id,
                    {
                        "status": "sent",
                        "provider_response": provider_response,
                        "sent_at": datetime.now(UTC).isoformat(),
                    },
                )
            else:
                failed += 1
                await _supabase_patch(
                    settings,
                    "notification_events",
                    event_id,
                    {"status": "failed", "provider_response": provider_response},
                )

        await audit(
            settings,
            admin,
            "admin.notifications.process",
            "notification_events",
            metadata={"processed": len(events), "sent": sent, "failed": failed},
        )
        return {"processed": len(events), "sent": sent, "failed": failed}
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/patients", response_model=None)
async def get_patients(
    limit: int = Query(default=50, ge=1, le=5000),
    cursor: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        page = _cursor_page(order="updated_at.desc,id.desc", fields=("updated_at", "id"), direction="desc", limit=limit, cursor=cursor)
        mothers = await _load_mother_registry(settings, page)
        await audit(settings, admin, "admin.patients.read", "mother")
        return {"patients": mothers, "page": _page(mothers, page)}
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/emergencies", response_model=None)
async def get_emergencies(
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        page = CursorPage(query="&limit=1000", order="updated_at.desc", limit=1000, fields=("updated_at", "id"), direction="desc")
        mothers = await _load_mother_registry(settings, page)
        emergencies = [
            {
                "mother_id": m["id"],
                "name": m["name"],
                "phone": m["phone"],
                "gestational_age_weeks": m["gestational_age_weeks"],
                "location_name": m["location_name"],
                "chw_name": m["chw_name"],
                "chw_phone": m["chw_phone"],
            }
            for m in mothers
            if m.get("last_risk_level") == "HIGH"
        ]
        return {"emergencies": emergencies}
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.patch("/mothers/{mother_id}/chw-assignment", response_model=None)
async def assign_chw_to_mother(
    mother_id: str,
    request: ChwAssignmentRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        _require_super_admin(admin, "assign or reassign CHWs to mothers")
        
        # 1. Fetch mother
        mothers = await _supabase_get(settings, "mothers", query=f"&id=eq.{quote(mother_id)}")
        if not mothers:
            return error_response(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Mother not found.")
        mother = mothers[0]
        
        # 2. Fetch CHW
        chws = await _supabase_get(settings, "chws", query=f"&id=eq.{quote(request.chw_id)}")
        if not chws:
            return error_response(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "CHW not found.")
        chw = chws[0]
        
        # 3. Validate CHW is approved (verified) and active
        if chw.get("verification_status") != "APPROVED" or not chw.get("is_active"):
            return error_response(status.HTTP_400_BAD_REQUEST, "INVALID_CHW", "Assignment requires a verified and active CHW.")
            
        old_chw_id = None
        patient_id = mother.get("patient_id")
        
        # Get CHW's email and phone from Supabase Auth
        chw_email = None
        chw_phone = None
        if chw.get("auth_user_id"):
            try:
                auth_url = f"{_base_url(settings)}/auth/v1/admin/users/{chw['auth_user_id']}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    auth_resp = await client.get(auth_url, headers=_service_headers(settings))
                if auth_resp.status_code == 200:
                    auth_data = auth_resp.json()
                    chw_email = auth_data.get("email")
                    chw_phone = auth_data.get("phone")
            except Exception:
                pass

        # 4. Handle Patient record creation or update
        if not patient_id:
            if request.age is None:
                return error_response(status.HTTP_400_BAD_REQUEST, "AGE_REQUIRED", "Age is required to create a patient record.")
            
            # Create a new patient record
            patient_payload = {
                "chw_id": request.chw_id,
                "name": mother["name"],
                "age": request.age,
                "gestational_age_weeks": mother.get("gestational_age_weeks") or 12,
                "last_risk_level": "LOW",
            }
            patient = await _supabase_post(settings, "patients", patient_payload)
            patient_id = patient.get("id")
            if not patient_id:
                return error_response(status.HTTP_502_BAD_GATEWAY, "DATABASE_WRITE_FAILED", "Failed to create patient record.")
            
            # Update mothers table with patient_id, chw_email, and chw_phone
            await _supabase_patch(
                settings,
                "mothers",
                mother_id,
                {
                    "patient_id": patient_id,
                    "chw_email": chw_email,
                    "chw_phone": chw_phone,
                },
            )
        else:
            # Fetch existing patient to get old CHW ID for audit log
            patients = await _supabase_get(settings, "patients", query=f"&id=eq.{quote(patient_id)}")
            if patients:
                old_chw_id = patients[0].get("chw_id")
            
            # Update existing patient record with new CHW ID
            await _supabase_patch(settings, "patients", patient_id, {"chw_id": request.chw_id})
            
            # Update mothers table with chw_email and chw_phone to synchronize
            await _supabase_patch(
                settings,
                "mothers",
                mother_id,
                {
                    "chw_email": chw_email,
                    "chw_phone": chw_phone,
                },
            )
            
        # 5. Audit the assignment
        await audit(
            settings,
            admin,
            action="admin.mother.chw_assignment",
            entity_type="mother",
            entity_id=mother_id,
            metadata={
                "patient_id": patient_id,
                "old_chw_id": old_chw_id,
                "new_chw_id": request.chw_id,
            },
        )
        
        # 6. Load and return updated mother registry row
        page = _cursor_page(order="id.asc", fields=("id", "id"), direction="asc", limit=1, cursor=None, extra_query=f"&id=eq.{quote(mother_id)}")
        rows = await _load_mother_registry(settings, page)
        return rows[0] if rows else {}
        
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/qa", response_model=None)
async def get_qa_items(
    limit: int = Query(default=50, ge=1, le=200),
    cursor: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        page = _cursor_page(order="updated_at.desc,id.desc", fields=("updated_at", "id"), direction="desc", limit=limit, cursor=cursor)
        items = await _supabase_get(settings, "master_qa", select="id,trimester,topic,question_bn,answer_bn,question_en,answer_en,severity,created_at,updated_at", query=page.query)
        await audit(settings, admin, "admin.qa.read", "master_qa")
        return {"items": items, "page": _page(items, page)}
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.post("/qa", status_code=status.HTTP_201_CREATED, response_model=None)
async def create_qa_item(
    request: QaCreateRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        created = await _supabase_post(settings, "master_qa", request.model_dump())
        await audit(settings, admin, "admin.qa.create", "master_qa", created.get("id"), {"topic": request.topic})
        return created
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.patch("/qa/{qa_id}", response_model=None)
async def update_qa_item(
    qa_id: str,
    request: QaUpdateRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    payload = request.update_payload()
    if not payload:
        return error_response(status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "At least one QA field must be provided.")
    try:
        updated = await _supabase_patch(settings, "master_qa", qa_id, payload)
        await audit(settings, admin, "admin.qa.update", "master_qa", qa_id, payload)
        return updated
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.delete("/qa/{qa_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_qa_item(
    qa_id: str,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> Response | JSONResponse:
    try:
        _require_super_admin(admin, "delete QA items")
        await _supabase_delete(settings, "master_qa", qa_id)
        await audit(settings, admin, "admin.qa.delete", "master_qa", qa_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/telemetry/sms", response_model=None)
async def get_sms_telemetry(
    limit: int = Query(default=50, ge=1, le=200),
    cursor: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        page = _cursor_page(order="created_at.desc,id.desc", fields=("created_at", "id"), direction="desc", limit=limit, cursor=cursor)
        failures = await _supabase_get(
            settings,
            "sms_failures",
            select="id,visit_id,phone_number,message,error_message,attempts,created_at,review_status,review_notes,reviewed_at",
            query=page.query,
        )
        await audit(settings, admin, "admin.telemetry.sms.read", "sms_failure")
        return {"failures": failures, "page": _page(failures, page)}
    except AdminAuthError as error:
        if error.code == "DATABASE_QUERY_FAILED":
            return {"failures": [], "page": {"limit": limit, "count": 0, "next_cursor": None}}
        return _handle_admin_error(error)


@router.patch("/telemetry/sms/{sms_id}", response_model=None)
async def review_sms_failure(
    sms_id: str,
    request: SmsReviewRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        updated = await _supabase_patch(
            settings,
            "sms_failures",
            sms_id,
            {
                "review_status": request.review_status,
                "review_notes": request.review_notes,
                "reviewed_by": admin.auth_user_id,
                "reviewed_at": datetime.now(UTC).isoformat(),
            },
        )
        await audit(settings, admin, "admin.telemetry.sms.review", "sms_failure", sms_id, request.model_dump())
        return updated
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/reports/export", response_model=None)
async def export_report(
    format: Literal["csv", "pdf"] = Query(default="csv"),
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> Response | JSONResponse:
    try:
        _require_super_admin(admin, "export patient reports")
        patients = await _supabase_get(
            settings,
            "patients",
            select="id,chw_id,name,age,gestational_age_weeks,last_risk_level,updated_at",
            query="&order=updated_at.desc&limit=1000",
        )
        await audit(settings, admin, "admin.report.export", "patient", metadata={"format": format})
        if format == "csv":
            return _csv_response(patients)
        return _pdf_response(patients)
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/audit", response_model=None)
async def get_audit_events(
    limit: int = Query(default=50, ge=1, le=200),
    cursor: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        _require_super_admin(admin, "read audit events")
        page = _cursor_page(order="created_at.desc,id.desc", fields=("created_at", "id"), direction="desc", limit=limit, cursor=cursor)
        events = await _supabase_get(
            settings,
            "admin_audit_events",
            select="id,actor_user_id,action,entity_type,entity_id,metadata,created_at",
            query=page.query,
        )
        await audit(settings, admin, "admin.audit.read", "admin_audit_events")
        return {"events": events, "page": _page(events, page)}
    except AdminAuthError as error:
        if error.code == "DATABASE_QUERY_FAILED":
            return {"events": [], "page": {"limit": limit, "count": 0, "next_cursor": None}}
        return _handle_admin_error(error)


async def _load_summary_rows(settings: Settings) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    chws_raw = await _supabase_get(
        settings,
        "chws",
        select="id,name,union_name,upazila,district,is_active,verification_status,rejection_reason,created_at,organization_name,worker_type,years_of_experience,certificate_url,location",
        query="&order=name.asc",
    )
    chw_ids = [c["id"] for c in chws_raw if c.get("id")]
    patient_counts = {}
    if chw_ids:
        patients = await _supabase_get(
            settings,
            "patients",
            select="chw_id",
            query=f"&chw_id=in.({_in_filter(chw_ids)})",
        )
        for p in patients:
            c_id = p.get("chw_id")
            if c_id:
                patient_counts[c_id] = patient_counts.get(c_id, 0) + 1
    
    chws = []
    for c in chws_raw:
        chw_lat, chw_lng = _parse_location(c.get("location"))
        chws.append({
            "id": c["id"],
            "chw_id": c["id"],
            "name": c["name"],
            "union_name": c["union_name"],
            "upazila": c["upazila"],
            "district": c.get("district"),
            "is_active": c["is_active"],
            "verification_status": c.get("verification_status"),
            "rejection_reason": c.get("rejection_reason"),
            "created_at": c.get("created_at"),
            "organization_name": c.get("organization_name"),
            "worker_type": c.get("worker_type"),
            "years_of_experience": c.get("years_of_experience"),
            "certificate_url": c.get("certificate_url"),
            "patient_count": patient_counts.get(c["id"], 0),
            "lat": chw_lat,
            "lng": chw_lng,
        })

    risk_summary = await _supabase_get(settings, "v_risk_summary", select="chw_id,chw_name,low_count,moderate_count,high_count", query="&order=chw_name.asc")
    try:
        heatmap = await _supabase_get(settings, "v_upazila_risk_heatmap", select="upazila,low_count,moderate_count,high_count,total_patients", query="&order=upazila.asc")
    except AdminAuthError:
        heatmap = _derive_heatmap(chws, risk_summary)
    return chws, risk_summary, heatmap


def _metrics(chws: list[dict[str, Any]], risk_summary: list[dict[str, Any]], mother_count: int | None = None) -> dict[str, int]:
    return {
        "active_chws": sum(1 for chw in chws if chw.get("is_active")),
        "tracked_patients": mother_count if mother_count is not None else sum(int(chw.get("patient_count") or 0) for chw in chws),
        "high_risk_patients": sum(int(row.get("high_count") or 0) for row in risk_summary),
    }


def _derive_heatmap(chws: list[dict[str, Any]], risk_summary: list[dict[str, Any]]) -> list[dict[str, Any]]:
    risk_by_chw = {row.get("chw_id"): row for row in risk_summary}
    grouped: dict[str, dict[str, int | str]] = {}

    for chw in chws:
        upazila = str(chw.get("upazila") or "Unassigned")
        row = grouped.setdefault(
            upazila,
            {
                "upazila": upazila,
                "low_count": 0,
                "moderate_count": 0,
                "high_count": 0,
                "total_patients": 0,
            },
        )
        risk = risk_by_chw.get(chw.get("chw_id"), {})
        row["low_count"] = int(row["low_count"]) + int(risk.get("low_count") or 0)
        row["moderate_count"] = int(row["moderate_count"]) + int(risk.get("moderate_count") or 0)
        row["high_count"] = int(row["high_count"]) + int(risk.get("high_count") or 0)
        row["total_patients"] = int(row["total_patients"]) + int(chw.get("patient_count") or 0)

    return sorted(grouped.values(), key=lambda item: str(item["upazila"]))


def _csv_response(rows: list[dict[str, Any]]) -> Response:
    buffer = io.StringIO()
    fieldnames = ["id", "chw_id", "name", "age", "gestational_age_weeks", "last_risk_level", "updated_at"]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=maasheba-patient-report.csv"},
    )


def _pdf_response(rows: list[dict[str, Any]]) -> Response:
    lines = ["MaaSheba Patient Report", f"Generated: {datetime.now(UTC).isoformat()}", ""]
    for row in rows[:60]:
        lines.append(
            f"{row.get('name', 'Unknown')} | age {row.get('age', '-')} | "
            f"{row.get('gestational_age_weeks', '-')} weeks | {row.get('last_risk_level', '-')}"
        )
    pdf = _simple_pdf(lines)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=maasheba-patient-report.pdf"},
    )


def _simple_pdf(lines: list[str]) -> bytes:
    escaped_lines = [line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for line in lines]
    text = "BT /F1 10 Tf 48 780 Td " + " Tj 0 -16 Td ".join(f"({line})" for line in escaped_lines) + " Tj ET"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(text.encode('latin-1', errors='replace'))} >>\nstream\n{text}\nendstream".encode("latin-1", errors="replace"),
    ]
    output = io.BytesIO()
    output.write(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(output.tell())
        output.write(f"{index} 0 obj\n".encode())
        output.write(obj)
        output.write(b"\nendobj\n")
    xref_pos = output.tell()
    output.write(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        output.write(f"{offset:010d} 00000 n \n".encode())
    output.write(f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode())
    return output.getvalue()


class ChwAssignBody(BaseModel):
    chw_id: str


@router.get("/chw-reassignment-requests", response_model=None)
async def get_chw_reassignment_requests(
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> list[dict[str, Any]] | JSONResponse:
    try:
        requests = await _supabase_get(
            settings,
            "chw_reassignment_requests",
            select="id,mother_id,current_chw_id,requested_chw_id,reason,note,status,created_at,resolved_at",
            query="&status=eq.pending&order=created_at.asc",
        )
        if not requests:
            return []

        mother_ids = sorted({row["mother_id"] for row in requests if row.get("mother_id")})
        chw_ids = sorted(
            {
                row.get("current_chw_id")
                for row in requests
                if row.get("current_chw_id")
            }
        )
        mothers_by_id: dict[str, dict[str, Any]] = {}
        chws_by_id: dict[str, dict[str, Any]] = {}
        if mother_ids:
            mothers = await _supabase_get(
                settings,
                "mothers",
                select="id,name",
                query=f"&id=in.({_in_filter(mother_ids)})",
            )
            mothers_by_id = {mother["id"]: mother for mother in mothers if mother.get("id")}
        if chw_ids:
            chws = await _supabase_get(
                settings,
                "chws",
                select="id,name",
                query=f"&id=in.({_in_filter(chw_ids)})",
            )
            chws_by_id = {chw["id"]: chw for chw in chws if chw.get("id")}

        result = []
        for row in requests:
            mother = mothers_by_id.get(row.get("mother_id") or "", {})
            current_chw = chws_by_id.get(row.get("current_chw_id") or "", {})
            result.append(
                {
                    **row,
                    "mother_name": mother.get("name") or "Unknown Mother",
                    "current_chw_name": current_chw.get("name"),
                }
            )
        await audit(settings, admin, "admin.chw_reassignment_requests.read", "chw_reassignment_request")
        return result
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.patch("/chw-reassignment-requests/{request_id}/assign", response_model=None)
async def assign_reassignment_request(
    request_id: str,
    request: ReassignmentResolveRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        _require_super_admin(admin, "resolve CHW reassignment requests")
        rows = await _supabase_get(settings, "chw_reassignment_requests", query=f"&id=eq.{quote(request_id)}")
        if not rows:
            return error_response(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Reassignment request not found.")
        reassignment = rows[0]
        if reassignment.get("status") != "pending":
            return error_response(status.HTTP_400_BAD_REQUEST, "INVALID_STATUS", "Reassignment request is not pending.")

        mothers = await _supabase_get(settings, "mothers", query=f"&id=eq.{quote(reassignment['mother_id'])}")
        if not mothers:
            return error_response(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Mother not found.")
        mother = mothers[0]
        patient_id = mother.get("patient_id")
        if not patient_id:
            return error_response(status.HTTP_400_BAD_REQUEST, "MOTHER_NOT_LINKED", "Mother does not have a patient link to reassign.")

        chws = await _supabase_get(settings, "chws", query=f"&id=eq.{quote(request.new_chw_id)}")
        if not chws:
            return error_response(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "CHW not found.")
        chw = chws[0]
        if chw.get("verification_status") != "APPROVED" or not chw.get("is_active"):
            return error_response(status.HTTP_400_BAD_REQUEST, "INVALID_CHW", "Assignment requires a verified and active CHW.")

        chw_email, chw_phone = await _get_chw_auth_contact(settings, chw)
        await _supabase_patch(settings, "patients", patient_id, {"chw_id": request.new_chw_id})
        await _supabase_patch(
            settings,
            "mothers",
            reassignment["mother_id"],
            {"chw_email": chw_email, "chw_phone": chw_phone},
        )

        now_str = datetime.now(UTC).isoformat()
        updated = await _supabase_patch(
            settings,
            "chw_reassignment_requests",
            request_id,
            {
                "requested_chw_id": request.new_chw_id,
                "status": "assigned",
                "resolved_by": admin.auth_user_id,
                "resolved_at": now_str,
                "updated_at": now_str,
            },
        )
        await audit(
            settings,
            admin,
            "admin.chw_reassignment_request.assign",
            "chw_reassignment_request",
            request_id,
            {
                "mother_id": reassignment["mother_id"],
                "old_chw_id": reassignment.get("current_chw_id"),
                "new_chw_id": request.new_chw_id,
                "patient_id": patient_id,
            },
        )
        return updated
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.patch("/chw-reassignment-requests/{request_id}/dismiss", response_model=None)
async def dismiss_reassignment_request(
    request_id: str,
    request: ReassignmentDismissRequest,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        _require_super_admin(admin, "dismiss CHW reassignment requests")
        now_str = datetime.now(UTC).isoformat()
        updated = await _supabase_patch(
            settings,
            "chw_reassignment_requests",
            request_id,
            {
                "status": "dismissed",
                "resolved_by": admin.auth_user_id,
                "resolved_at": now_str,
                "updated_at": now_str,
            },
        )
        await audit(
            settings,
            admin,
            "admin.chw_reassignment_request.dismiss",
            "chw_reassignment_request",
            request_id,
            {"reason": request.reason},
        )
        return updated
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/connection-requests/pending", response_model=None)
async def get_pending_connection_requests(
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> list[dict[str, Any]] | JSONResponse:
    try:
        # Fetch pending and assigned requests
        requests = await _supabase_get(
            settings,
            "connection_requests",
            select="id,mother_id,status,notes,created_at,mother_location,assigned_at",
            query="&status=in.(pending,assigned)&order=created_at.asc"
        )
        
        if not requests:
            return []
            
        mother_ids = sorted({r["mother_id"] for r in requests if r.get("mother_id")})
        mothers_by_id = {}
        if mother_ids:
            mothers = await _supabase_get(
                settings,
                "mothers",
                select="id,name",
                query=f"&id=in.({_in_filter(mother_ids)})"
            )
            mothers_by_id = {m["id"]: m for m in mothers if m.get("id")}
            
        result = []
        for r in requests:
            mother = mothers_by_id.get(r.get("mother_id"), {})
            # Parse geography point to lat/lng
            lat, lng = None, None
            loc = r.get("mother_location")
            if loc and isinstance(loc, dict) and loc.get("type") == "Point" and isinstance(loc.get("coordinates"), list):
                coords = loc["coordinates"]
                if len(coords) >= 2:
                    lng, lat = coords[0], coords[1]
            elif isinstance(loc, str):
                try:
                    # Standard WKT fallback
                    content = loc.replace("POINT(", "").replace(")", "").strip()
                    parts = content.split()
                    if len(parts) >= 2:
                        lng = float(parts[0])
                        lat = float(parts[1])
                except Exception:
                    pass

            result.append({
                "id": r["id"],
                "mother_id": r["mother_id"],
                "mother_name": mother.get("name") or "Unknown Mother",
                "status": r["status"],
                "notes": r.get("notes"),
                "created_at": r["created_at"],
                "assigned_at": r.get("assigned_at"),
                "lat": lat,
                "lng": lng
            })
            
        await audit(settings, admin, "admin.connection_requests.pending.read", "connection_requests")
        return result
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.patch("/connection-requests/{request_id}/assign", response_model=None)
async def assign_connection_request(
    request_id: str,
    body: ChwAssignBody,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        _require_super_admin(admin, "assign connection requests to CHWs")
        
        # 1. Fetch connection request
        requests = await _supabase_get(
            settings,
            "connection_requests",
            query=f"&id=eq.{quote(request_id)}"
        )
        if not requests:
            return error_response(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Connection request not found.")
        req = requests[0]
        
        if req.get("status") != "pending":
            return error_response(status.HTTP_400_BAD_REQUEST, "INVALID_STATUS", "Connection request is not pending.")
            
        # 2. Fetch CHW
        chw_id = body.chw_id
        chws = await _supabase_get(settings, "chws", query=f"&id=eq.{quote(chw_id)}")
        if not chws:
            return error_response(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "CHW not found.")
        chw = chws[0]
        
        # 3. Validate CHW is approved and active
        if chw.get("verification_status") != "APPROVED" or not chw.get("is_active"):
            return error_response(status.HTTP_400_BAD_REQUEST, "INVALID_CHW", "Assignment requires a verified and active CHW.")
            
        # 4. Fetch mother to see if she already has a patient record
        mother_id = req["mother_id"]
        mothers = await _supabase_get(settings, "mothers", query=f"&id=eq.{quote(mother_id)}")
        if not mothers:
            return error_response(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Mother not found.")
        mother = mothers[0]
        
        patient_id = mother.get("patient_id")
        
        chw_email = None
        chw_phone = None
        if chw.get("auth_user_id"):
            try:
                auth_url = f"{_base_url(settings)}/auth/v1/admin/users/{chw['auth_user_id']}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    auth_resp = await client.get(auth_url, headers=_service_headers(settings))
                if auth_resp.status_code == 200:
                    auth_data = auth_resp.json()
                    chw_email = auth_data.get("email")
                    chw_phone = auth_data.get("phone")
            except Exception:
                pass
                
        # Link or create Patient
        if not patient_id:
            patient_payload = {
                "chw_id": chw_id,
                "name": mother["name"],
                "age": 25,
                "gestational_age_weeks": mother.get("gestational_age_weeks") or 12,
                "last_risk_level": "LOW",
            }
            patient = await _supabase_post(settings, "patients", patient_payload)
            patient_id = patient.get("id")
            if not patient_id:
                return error_response(status.HTTP_502_BAD_GATEWAY, "DATABASE_WRITE_FAILED", "Failed to create patient record.")
            
            # Update mothers table
            await _supabase_patch(
                settings,
                "mothers",
                mother_id,
                {
                    "patient_id": patient_id,
                    "chw_email": chw_email,
                    "chw_phone": chw_phone,
                },
            )
        else:
            # Update patient record with new CHW ID
            await _supabase_patch(settings, "patients", patient_id, {"chw_id": chw_id})
            
            # Sync mothers table
            await _supabase_patch(
                settings,
                "mothers",
                mother_id,
                {
                    "chw_email": chw_email,
                    "chw_phone": chw_phone,
                },
            )
            
        # 5. Update connection_requests status to assigned
        now_str = datetime.now(UTC).isoformat()
        updated_request = await _supabase_patch(
            settings,
            "connection_requests",
            request_id,
            {
                "chw_id": chw_id,
                "status": "assigned",
                "assigned_at": now_str,
                "updated_at": now_str
            }
        )
        
        # 6. Audit
        await audit(
            settings,
            admin,
            action="admin.connection_request.assign",
            entity_type="connection_requests",
            entity_id=request_id,
            metadata={
                "mother_id": mother_id,
                "chw_id": chw_id,
                "patient_id": patient_id
            }
        )
        
        return updated_request
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/chws/{chw_id}/certificate", response_model=None)
async def get_chw_certificate(
    chw_id: str,
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> Response | JSONResponse:
    try:
        chws = await _supabase_get(
            settings,
            "chws",
            select="certificate_url",
            query=f"&id=eq.{quote(chw_id)}",
        )
        if not chws or not chws[0].get("certificate_url"):
            return JSONResponse(status_code=404, content={"error": "Certificate not found or not provided."})
        
        cert_url = chws[0]["certificate_url"]
        
        if "/storage/v1/object/" in cert_url and "/certificates/" in cert_url:
            filename = cert_url.split("/certificates/")[-1].split("?")[0]
            storage_url = f"{_base_url(settings)}/storage/v1/object/certificates/{filename}"
            headers = _service_headers(settings)
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(storage_url, headers=headers)
                
            if response.status_code >= 400:
                storage_url_auth = f"{_base_url(settings)}/storage/v1/object/authenticated/certificates/{filename}"
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.get(storage_url_auth, headers=headers)
            
            if response.status_code < 400:
                content_type = response.headers.get("content-type", "application/octet-stream")
                return Response(content=response.content, media_type=content_type)
        
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=cert_url)
    except AdminAuthError as error:
        return _handle_admin_error(error)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Failed to retrieve certificate: {str(e)}"})

