from __future__ import annotations

import csv
import io
from datetime import UTC, datetime
from typing import Any, Literal
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
        raise AdminAuthError(status.HTTP_502_BAD_GATEWAY, "DATABASE_QUERY_FAILED", f"Failed to query {path}.")
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


@router.get("/summary", response_model=None)
async def get_summary(
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        chws, risk_summary, heatmap = await _load_summary_rows(settings)
        await audit(settings, admin, "admin.summary.read", "dashboard")
        return {
            "metrics": _metrics(chws, risk_summary),
            "chws": chws,
            "risk_summary": risk_summary,
            "heatmap": heatmap,
        }
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/chws", response_model=None)
async def get_chws(
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        chws = await _supabase_get(settings, "v_chw_list", select="chw_id,name,union_name,upazila,is_active,patient_count", query="&order=name.asc")
        await audit(settings, admin, "admin.chws.read", "chw")
        return {"chws": chws}
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


@router.get("/patients", response_model=None)
async def get_patients(
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        patients = await _supabase_get(
            settings,
            "patients",
            select="id,chw_id,name,age,gestational_age_weeks,last_risk_level,created_at,updated_at",
            query="&order=updated_at.desc&limit=500",
        )
        await audit(settings, admin, "admin.patients.read", "patient")
        return {"patients": patients}
    except AdminAuthError as error:
        return _handle_admin_error(error)


@router.get("/qa", response_model=None)
async def get_qa_items(
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        items = await _supabase_get(settings, "master_qa", select="id,trimester,topic,question_bn,answer_bn,question_en,answer_en,severity,created_at,updated_at", query="&order=updated_at.desc")
        await audit(settings, admin, "admin.qa.read", "master_qa")
        return {"items": items}
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
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        failures = await _supabase_get(
            settings,
            "sms_failures",
            select="id,visit_id,phone_number,message,error_message,attempts,created_at,review_status,review_notes,reviewed_at",
            query="&order=created_at.desc&limit=200",
        )
        await audit(settings, admin, "admin.telemetry.sms.read", "sms_failure")
        return {"failures": failures}
    except AdminAuthError as error:
        if error.code == "DATABASE_QUERY_FAILED":
            return {"failures": []}
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
    settings: Settings = Depends(get_settings),
    admin: AdminContext = Depends(require_admin),
) -> dict[str, Any] | JSONResponse:
    try:
        _require_super_admin(admin, "read audit events")
        events = await _supabase_get(
            settings,
            "admin_audit_events",
            select="id,actor_user_id,action,entity_type,entity_id,metadata,created_at",
            query="&order=created_at.desc&limit=200",
        )
        await audit(settings, admin, "admin.audit.read", "admin_audit_events")
        return {"events": events}
    except AdminAuthError as error:
        if error.code == "DATABASE_QUERY_FAILED":
            return {"events": []}
        return _handle_admin_error(error)


async def _load_summary_rows(settings: Settings) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    chws = await _supabase_get(settings, "v_chw_list", select="chw_id,name,union_name,upazila,is_active,patient_count", query="&order=name.asc")
    risk_summary = await _supabase_get(settings, "v_risk_summary", select="chw_id,chw_name,low_count,moderate_count,high_count", query="&order=chw_name.asc")
    try:
        heatmap = await _supabase_get(settings, "v_upazila_risk_heatmap", select="upazila,low_count,moderate_count,high_count,total_patients", query="&order=upazila.asc")
    except AdminAuthError:
        heatmap = _derive_heatmap(chws, risk_summary)
    return chws, risk_summary, heatmap


def _metrics(chws: list[dict[str, Any]], risk_summary: list[dict[str, Any]]) -> dict[str, int]:
    return {
        "active_chws": sum(1 for chw in chws if chw.get("is_active")),
        "tracked_patients": sum(int(chw.get("patient_count") or 0) for chw in chws),
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
