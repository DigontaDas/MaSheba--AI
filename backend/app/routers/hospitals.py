import httpx
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.config import Settings, get_settings

router = APIRouter(prefix="/api/v1/hospitals", tags=["hospitals"])

@router.get("/nearby")
async def get_nearby_hospitals(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_km: float = Query(15.0, description="Radius in kilometers"),
    settings: Settings = Depends(get_settings),
) -> list[dict[str, Any]]:
    url = f"{str(settings.supabase_url).rstrip('/')}/rest/v1/rpc/get_nearby_hospitals"
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {settings.supabase_anon_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "lat": lat,
        "lng": lng,
        "radius_km": radius_km
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Database connection failed")
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
        
    return response.json()
