from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, status
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ussd", tags=["ussd"])


class UssdPayload(BaseModel):
    msisdn: str = Field(..., description="Mobile subscriber number (phone number)")
    session_id: str = Field(..., description="Unique telecom session identifier")
    text: str = Field(default="", description="User input text containing menu responses")


async def _fetch_patient_details(patient_id: str, settings: Settings) -> dict[str, Any] | None:
    """
    Fetches the patient record and their latest vitals from Supabase using service-role access.
    """
    url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/patients?select=name,age,gestational_age_weeks,last_risk_level&id=eq.{patient_id}&limit=1"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, headers=headers)
        if response.status_code != 200:
            logger.error("Supabase patient lookup failed with status %d: %s", response.status_code, response.text)
            return None
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            return data[0]
    except Exception as exc:
        logger.error("Error querying Supabase patient for USSD lookup: %s", exc)
    return None


@router.post("", response_class=PlainTextResponse)
async def process_ussd_request(
    payload: UssdPayload,
    settings: Settings = Depends(get_settings),
) -> PlainTextResponse:
    """
    GSMA compliant USSD Protocol Emulator endpoint.
    Returns PlainText responses prefixed with CON (continue) or END (terminate session).
    """
    text_input = payload.text.strip()
    
    # Parse inputs split by '*' representing USSD menu traversal
    parts = [p.strip() for p in text_input.split("*") if p.strip()]
    
    # Session root menu
    if len(parts) == 0:
        menu_text = (
            "CON মাশেবা (MaaSheba) USSD সেবা\n"
            "১. রোগীর অবস্থা যাচাই\n"
            "২. নিকটবর্তী স্বাস্থ্যকেন্দ্র\n"
            "৩. জরুরি নম্বরসমূহ"
        )
        return PlainTextResponse(menu_text)
        
    choice = parts[0]
    
    # 1. Check Patient Status
    if choice == "1":
        if len(parts) == 1:
            return PlainTextResponse("CON রোগীর সঠিক আইডি (UUID) লিখুন:")
            
        patient_id = parts[1]
        # Validate UUID structure
        try:
            UUID(patient_id)
        except ValueError:
            return PlainTextResponse("CON ভুল আইডি ফরম্যাট। আবার রোগীর সঠিক আইডি (UUID) লিখুন:")
            
        patient = await _fetch_patient_details(patient_id, settings)
        if not patient:
            return PlainTextResponse("END দুঃখিত, এই আইডি-তে কোনো গর্ভবতী রোগী খুঁজে পাওয়া যায়নি।")
            
        name = patient.get("name", "অজানা")
        weeks = patient.get("gestational_age_weeks", 0)
        risk = patient.get("last_risk_level", "LOW")
        
        # Build standard recommendations based on risk assessments
        if risk == "HIGH":
            guideline = "⚠️ অত্যন্ত ঝুঁকিপূর্ণ! অবিলম্বে নিকটস্থ হাসপাতালে যান বা ১৬৭৬৭ নম্বরে কল করুন।"
        elif risk == "MODERATE":
            guideline = "⚠️ মাঝারি ঝুঁকি। দ্রুত চিকিৎসকের পরামর্শ নিন ও পর্যাপ্ত বিশ্রাম নিশ্চিত করুন।"
        else:
            guideline = "🟢 রোগী স্বাভাবিক আছেন। নিয়মিত পুষ্টিকর খাবার ও আয়রন সাপ্লিমেন্ট নিশ্চিত করুন।"
            
        response_text = (
            f"END রোগী: {name}\n"
            f"গর্ভাবস্থা: {weeks} সপ্তাহ\n"
            f"ঝুঁকির মাত্রা: {risk}\n"
            f"পরামর্শ: {guideline}"
        )
        return PlainTextResponse(response_text)
        
    # 2. Nearest Clinic
    elif choice == "2":
        clinic_text = (
            "END মা ও শিশু স্বাস্থ্য কেন্দ্র\n"
            "দূরত্ব: ২ কি.মি. • খোলা আছে\n"
            "জরুরি যোগাযোগ: ১৬৭৬৭"
        )
        return PlainTextResponse(clinic_text)
        
    # 3. Emergency Numbers
    elif choice == "3":
        emergency_text = (
            "END জাতীয় জরুরি সেবা: ৯৯৯\n"
            "মা ও শিশু হেল্পলাইন: ১৬৭৬৭"
        )
        return PlainTextResponse(emergency_text)
        
    # Fallback/Invalid Entry
    else:
        menu_text = (
            "CON ভুল ইনপুট। আবার চেষ্টা করুন:\n"
            "১. রোগীর অবস্থা যাচাই\n"
            "২. নিকটবর্তী স্বাস্থ্যকেন্দ্র\n"
            "৩. জরুরি নম্বরসমূহ"
        )
        return PlainTextResponse(menu_text)
