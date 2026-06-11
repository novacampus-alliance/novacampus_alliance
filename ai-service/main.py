from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.llm_client import get_active_model_name
from app.core.openapi import setup_openapi
from app.schemas.common import HealthResponse

app = FastAPI(
    title="Novacampus AI Service — Agent Conflits EDT",
    version="0.4.0",
    description="Agent IA de résolution des conflits d'emploi du temps (M7).",
    docs_url=None,
    redoc_url=None,
    openapi_url="/openapi.json",
    license_info={
        "name": "Novacampus Alliance — usage interne",
    },
    contact={
        "name": "Novacampus Alliance",
        "url": "https://github.com/novacampus-alliance/novacampus_alliance",
    },
)

setup_openapi(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/docs", include_in_schema=False)
async def swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{app.title} — Swagger UI",
        swagger_ui_parameters={
            "docExpansion": "list",
            "defaultModelsExpandDepth": 2,
            "persistAuthorization": True,
            "displayRequestDuration": True,
        },
    )


@app.get("/redoc", include_in_schema=False)
async def redoc_ui():
    return get_redoc_html(
        openapi_url="/openapi.json",
        title=f"{app.title} — ReDoc",
    )


@app.get(
    "/health",
    tags=["Santé"],
    response_model=HealthResponse,
    summary="Santé du service",
    description="Contrôle de vie du conteneur et état du provider LLM. **Sans authentification.**",
)
def health_check():
    return HealthResponse(
        status="ok",
        service="ai-service",
        agent="resolution-conflits-edt",
        llm_provider=settings.LLM_PROVIDER,
        llm_model=get_active_model_name(),
        llm_configured=settings.llm_configured(),
    )
