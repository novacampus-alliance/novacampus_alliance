from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.llm_client import get_active_model_name

app = FastAPI(
    title="Novacampus AI Service",
    description="Service IA — agent de résolution des conflits EDT",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
        "agent": "resolution-conflits-edt",
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": get_active_model_name(),
        "llm_configured": settings.llm_configured(),
    }
