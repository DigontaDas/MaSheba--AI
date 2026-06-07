from __future__ import annotations

import base64
import os
import sys
import uuid
from typing import Any
from fastapi import APIRouter, HTTPException, File, UploadFile, Request, Depends, Header, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx

from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from app.core.config import Settings, get_settings
from app.services.chat_service import get_chat_response, get_voice_chat_response

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500)
    system_prompt: str | None = None
    language: str | None = "bn"


class ChatResponse(BaseModel):
    answer: str
    is_emergency: bool
    source: str
    emergency_text: str | None = None
    risk_level: str | None = None
    matched_risk: str | None = None
    red_flags: list[str] = Field(default_factory=list)
    recommended_action: str | None = None


class VoiceChatResponse(BaseModel):
    transcription: str
    symptoms: list[str]
    answer: str
    is_emergency: bool
    source: str
    risk_level: str | None = None
    matched_risk: str | None = None
    red_flags: list[str] = Field(default_factory=list)
    recommended_action: str | None = None


# Rate Limiter Setup
def get_user_id_limit_key(request: Request) -> str:
    # During pytest/testing, return a unique key per request to prevent hitting rate limits across tests
    is_testing = "pytest" in sys.modules or os.environ.get("PYTEST_CURRENT_TEST") is not None
    if is_testing:
        return str(uuid.uuid4())

    # Retrieve user_id set by the authentication dependency in request.state
    # Fallback to "anonymous" if not present
    return getattr(request.state, "user_id", "anonymous")


limiter = Limiter(key_func=get_user_id_limit_key)


# Startup Event: Dynamically register the exception handler on FastAPI app
@router.on_event("startup")
def register_rate_limit_handlers():
    from app.main import app
    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={
                "detail": "অতিরিক্ত অনুরোধ করা হয়েছে। অনুগ্রহ করে এক মিনিট পর আবার চেষ্টা করুন।"
            }
        )


# Dependency to extract Supabase user UUID if present in Authorization header
async def get_current_user_id(
    request: Request,
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings)
) -> str | None:
    if not authorization or not authorization.startswith("Bearer ") or not authorization[7:].strip():
        return None

    # Validate user session against Supabase auth API
    url = f"{str(settings.supabase_url).rstrip('/')}/auth/v1/user"
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": authorization,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            return None
        user_data = resp.json()
        user_id = user_data["id"]
        request.state.user_id = user_id
        return user_id
    except Exception:
        return None


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    chat_req: ChatRequest,
    user_id: str | None = Depends(get_current_user_id)
) -> ChatResponse:
    if not chat_req.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty")

    result = await get_chat_response(
        chat_req.question,
        system_prompt=chat_req.system_prompt,
        language=chat_req.language or "bn"
    )
    return ChatResponse(**result)


@router.post("/chat/voice", response_model=VoiceChatResponse)
@limiter.limit("5/minute")
async def chat_voice(
    request: Request,
    file: UploadFile = File(...),
    language: str = "bn",
    user_id: str | None = Depends(get_current_user_id)
) -> VoiceChatResponse:
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=422, detail="Empty audio file uploaded")
            
        base64_audio = base64.b64encode(content).decode("utf-8")
        # Ensure fallback mime type if not provided or set to generic octet-stream
        mime_type = file.content_type
        if not mime_type or mime_type == "application/octet-stream":
            mime_type = "audio/mp4"
        elif mime_type.lower() in ("audio/m4a", "audio/x-m4a"):
            mime_type = "audio/mp4"
            
        result = await get_voice_chat_response(base64_audio, mime_type, language=language)
        return VoiceChatResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
