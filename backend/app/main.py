from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.chat import router as chat_router
from app.routers.admin import AdminAuthError, error_response, router as admin_router
from app.routers.health import router as health_router
from app.routers.sync import router as sync_router
from app.routers.sms_webhook import router as sms_router
from app.routers.qa_sync import router as qa_router
from app.routers.ussd import router as ussd_router
from app.routers.verification import router as verification_router

app = FastAPI(
    title="MaaSheba AI Backend",
    version="0.1.0",
    description="Backend sync API for the MaaSheba AI hackathon submission.",
)

# CORS configuration
origins = [
    "https://masheba-admin.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:19000",
    "http://127.0.0.1:19000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.exception_handler(AdminAuthError)
async def admin_auth_error_handler(_request, exc: AdminAuthError):
    return error_response(exc.status_code, exc.code, exc.message)


app.include_router(health_router)
app.include_router(admin_router)
app.include_router(sync_router)
app.include_router(chat_router)
app.include_router(sms_router)
app.include_router(qa_router)
app.include_router(ussd_router)
app.include_router(verification_router)
