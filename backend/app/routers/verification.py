from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
import httpx
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings

router = APIRouter(prefix="/api/v1/verification", tags=["verification"])


class VerifyApproveRequest(BaseModel):
    mother_id: str = Field(..., description="UUID of the mother to approve")
    age: int = Field(..., ge=10, le=60, description="Mother's age for patient record")


class VerifyRejectRequest(BaseModel):
    mother_id: str = Field(..., description="UUID of the mother to reject")
    rejection_reason: str = Field(..., min_length=2, max_length=200, description="Reason for rejection")


def calculate_weeks(lmp_date_str: str | None) -> int:
    if not lmp_date_str:
        return 12
    try:
        lmp = date.fromisoformat(lmp_date_str)
        today = date.today()
        delta = today - lmp
        return max(1, min(45, delta.days // 7))
    except Exception:
        return 12


async def get_current_chw(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings)
) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer ") or not authorization[7:].strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is required."
        )

    # 1. Fetch user from Supabase auth service
    url = f"{str(settings.supabase_url).rstrip('/')}/auth/v1/user"
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": authorization,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session."
            )
        user_data = resp.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase auth service is unavailable."
        ) from exc

    # 2. Query CHW table to verify active status
    chw_url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/chws?select=id,name,is_active&auth_user_id=eq.{user_data['id']}&limit=1"
    chw_headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}"
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            chw_resp = await client.get(chw_url, headers=chw_headers)
        if chw_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to query health worker profile."
            )
        chw_data = chw_resp.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase database is unreachable."
        ) from exc

    if not chw_data or not chw_data[0].get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user is not an active health worker."
        )

    # Add email and phone to chw info dictionary
    chw_info = chw_data[0]
    chw_info["email"] = user_data.get("email")
    chw_info["phone"] = user_data.get("phone")
    return chw_info


@router.get("/pending")
async def get_pending(
    chw: dict[str, Any] = Depends(get_current_chw),
    settings: Settings = Depends(get_settings)
) -> list[dict[str, Any]]:
    # Retrieve pending mother registration records assigned specifically to this CHW
    chw_email = chw.get("email")
    chw_phone = chw.get("phone")

    or_filters = []
    if chw_email:
        or_filters.append(f"chw_email.eq.{chw_email}")
    if chw_phone:
        or_filters.append(f"chw_phone.eq.{chw_phone}")

    # If CHW has no email or phone, return empty list to protect patient privacy
    if not or_filters:
        return []

    or_query = f"&or=({','.join(or_filters)})"
    url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/mothers?verification_status=eq.PENDING&select=id,name,phone,chw_email,chw_phone,lmp_date,certificate_url,created_at{or_query}"
    
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}"
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to retrieve pending verifications."
            )
        return resp.json()
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Database communication failure."
        ) from exc


@router.post("/approve")
async def approve(
    req: VerifyApproveRequest,
    chw: dict[str, Any] = Depends(get_current_chw),
    settings: Settings = Depends(get_settings)
) -> dict[str, Any]:
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Prefer": "return=representation"
    }

    # 1. Fetch the mother profile details
    mother_url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/mothers?id=eq.{req.mother_id}&limit=1"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(mother_url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to query mother profile."
            )
        mothers = resp.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Database lookup error."
        ) from exc

    if not mothers:
        raise HTTPException(status_code=404, detail="Mother profile not found.")

    mother = mothers[0]
    if mother.get("verification_status") != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve mother profile with status '{mother.get('verification_status')}'."
        )

    # 2. Calculate gestational age weeks dynamically from LMP
    weeks = calculate_weeks(mother.get("lmp_date"))

    # 3. Create a clinical record in public.patients
    patient_payload = {
        "chw_id": chw["id"],
        "name": mother["name"],
        "age": req.age,
        "gestational_age_weeks": weeks,
        "lmp_date": mother.get("lmp_date"),
        "last_risk_level": "LOW"
    }
    patient_url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/patients"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            p_resp = await client.post(patient_url, headers=headers, json=patient_payload)
        if p_resp.status_code != 201:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to create patient record: {p_resp.text}"
            )
        patient = p_resp.json()[0]
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to communicate with patient database."
        ) from exc

    # 4. Update the mother record: change status to VERIFIED, link patient_id, and clear rejection_reason
    update_url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/mothers?id=eq.{req.mother_id}"
    update_payload = {
        "verification_status": "VERIFIED",
        "patient_id": patient["id"],
        "rejection_reason": None
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            u_resp = await client.patch(update_url, headers=headers, json=update_payload)
        if u_resp.status_code not in (200, 204):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to update mother verification status."
            )
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Database write failure on mother profile."
        ) from exc

    return {"status": "success", "patient_id": patient["id"]}


@router.post("/reject")
async def reject(
    req: VerifyRejectRequest,
    chw: dict[str, Any] = Depends(get_current_chw),
    settings: Settings = Depends(get_settings)
) -> dict[str, Any]:
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}"
    }

    # 1. Fetch mother details to verify status
    mother_url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/mothers?id=eq.{req.mother_id}&limit=1"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(mother_url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to query mother profile."
            )
        mothers = resp.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Database lookup error."
        ) from exc

    if not mothers:
        raise HTTPException(status_code=404, detail="Mother profile not found.")

    mother = mothers[0]
    if mother.get("verification_status") != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject mother profile with status '{mother.get('verification_status')}'."
        )

    # 2. Update status to REJECTED and set rejection_reason
    update_url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/mothers?id=eq.{req.mother_id}"
    update_payload = {
        "verification_status": "REJECTED",
        "rejection_reason": req.rejection_reason
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            u_resp = await client.patch(update_url, headers=headers, json=update_payload)
        if u_resp.status_code not in (200, 204):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to update mother verification status."
            )
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Database write failure on mother profile."
        ) from exc

    return {"status": "success"}
