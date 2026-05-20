from fastapi import APIRouter, Depends, Header, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.models.sync import SyncRequest, SyncResponse
from app.services.supabase_client import SupabaseGateway, SyncGatewayError

router = APIRouter(tags=["sync"])


@router.post("/sync", response_model=SyncResponse)
async def sync_outbox(
    request: SyncRequest,
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> SyncResponse | JSONResponse:
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

    gateway = SupabaseGateway(settings)
    try:
        payload = await gateway.sync_outbox(request, authorization)
    except SyncGatewayError as error:
        return JSONResponse(
            status_code=error.status_code,
            content={
                "error": error.payload.get(
                    "error",
                    {
                        "code": "SYNC_EDGE_ERROR",
                        "message": "Sync edge function returned an error.",
                    },
                )
            },
        )

    try:
        return SyncResponse.model_validate(payload)
    except ValidationError:
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={
                "error": {
                    "code": "SYNC_EDGE_INVALID_RESPONSE",
                    "message": "Sync edge function returned an invalid response.",
                }
            },
        )
