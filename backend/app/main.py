from fastapi import FastAPI

from app.routers.health import router as health_router
from app.routers.sync import router as sync_router

app = FastAPI(
    title="MaaSheba AI Backend",
    version="0.1.0",
    description="Backend sync API for the MaaSheba AI hackathon submission.",
)

app.include_router(health_router)
app.include_router(sync_router)
