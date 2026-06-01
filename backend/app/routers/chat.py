from __future__ import annotations

import base64
from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel, Field

from app.services.chat_service import get_chat_response, get_voice_chat_response

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500)
    system_prompt: str | None = None


class ChatResponse(BaseModel):
    answer: str
    is_emergency: bool
    source: str
    emergency_text: str | None = None


class VoiceChatResponse(BaseModel):
    transcription: str
    symptoms: list[str]
    answer: str
    is_emergency: bool
    source: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if not request.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty")

    result = await get_chat_response(request.question, system_prompt=request.system_prompt)
    return ChatResponse(**result)


@router.post("/chat/voice", response_model=VoiceChatResponse)
async def chat_voice(file: UploadFile = File(...)) -> VoiceChatResponse:
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=422, detail="Empty audio file uploaded")
            
        base64_audio = base64.b64encode(content).decode("utf-8")
        # Ensure fallback mime type if not provided or set to generic octet-stream
        mime_type = file.content_type
        if not mime_type or mime_type == "application/octet-stream":
            mime_type = "audio/m4a"
            
        result = await get_voice_chat_response(base64_audio, mime_type)
        return VoiceChatResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

