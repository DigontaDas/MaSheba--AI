from __future__ import annotations

import logging
from datetime import datetime, UTC
from typing import Any
import httpx
from fastapi import APIRouter, Depends, Header, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from urllib.parse import quote

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/qa", tags=["qa"])


class MasterQaItem(BaseModel):
    id: str
    trimester: str
    topic: str
    question_bn: str
    answer_bn: str
    severity: str
    created_at: str
    updated_at: str


class QaSyncResponse(BaseModel):
    items: list[MasterQaItem]
    synced_at: str


@router.get("/sync", response_model=QaSyncResponse)
async def sync_master_qa(
    last_synced_at: str | None = None,
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> QaSyncResponse | JSONResponse:
    """
    Incremental sync endpoint for master Q&As.
    Requires Bearer token authentication.
    Returns all entries updated after `last_synced_at` (ISO 8601 timestamp).
    """
    # 1. Enforce Bearer token authentication
    if not authorization or not authorization.startswith("Bearer ") or not authorization[7:].strip():
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Bearer token is required.",
                }
            },
        )

    # 2. Call Supabase auth/v1/user to verify authentication token
    auth_url = f"{str(settings.supabase_url).rstrip('/')}/auth/v1/user"
    auth_headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": authorization,
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            auth_response = await client.get(auth_url, headers=auth_headers)
        
        if auth_response.status_code >= 400:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Invalid or expired authorization token.",
                    }
                },
            )
    except httpx.HTTPError as exc:
        logger.error("Supabase auth verification failed: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={
                "error": {
                    "code": "AUTH_SERVICE_UNAVAILABLE",
                    "message": "Supabase authentication service is currently unreachable.",
                }
            },
        )

    # 3. Construct Supabase REST API URL
    url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/master_qa?select=id,trimester,topic,question_bn,answer_bn,severity,created_at,updated_at&order=updated_at.asc"
    
    if last_synced_at:
        # Check if last_synced_at is a valid ISO timestamp format
        try:
            # We try parsing to validate it, but allow the raw string to be forwarded if valid
            # e.g., '2026-06-01T00:00:00Z'
            clean_timestamp = last_synced_at.strip()
            # Basic validation
            datetime.fromisoformat(clean_timestamp.replace("Z", "+00:00"))
            url += f"&updated_at=gt.{quote(clean_timestamp)}"
        except ValueError:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": {
                        "code": "INVALID_TIMESTAMP",
                        "message": "last_synced_at query parameter must be a valid ISO 8601 timestamp.",
                    }
                },
            )

    # 4. Fetch matching master FAQs from Supabase
    db_headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": authorization,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=db_headers)
        
        if response.status_code >= 400:
            logger.error("Supabase REST query to master_qa failed with status %d: %s", response.status_code, response.text)
            return JSONResponse(
                status_code=response.status_code,
                content={
                    "error": {
                        "code": "DATABASE_QUERY_FAILED",
                        "message": "Failed to retrieve master guidelines from the database.",
                    }
                },
            )
            
        data = response.json()
        items = [MasterQaItem(**item) for item in data]
        
        # Return items along with the current server time to be used for the next sync point
        current_server_time = datetime.now(UTC).isoformat().replace("+00:00", "Z")
        return QaSyncResponse(items=items, synced_at=current_server_time)

    except httpx.HTTPError as exc:
        logger.error("Supabase REST call to master_qa failed: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={
                "error": {
                    "code": "DATABASE_SERVICE_UNAVAILABLE",
                    "message": "Database service is currently unreachable.",
                }
            },
        )
    except Exception as exc:
        logger.error("Unexpected error in sync_master_qa endpoint: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred.",
                }
            },
        )
