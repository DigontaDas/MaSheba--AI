from datetime import UTC, datetime

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.models.sync import HealthResponse
from app.services.supabase_client import SupabaseGateway

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    gateway = SupabaseGateway(settings)
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(UTC),
        supabase_reachable=await gateway.health_check(),
    )
