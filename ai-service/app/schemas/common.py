from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    detail: str | list[str] = Field(
        ...,
        description="Message d'erreur HTTP (FastAPI standard)",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"detail": "Authentification requise"}],
        },
    }


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["ok"])
    service: str = Field(..., examples=["ai-service"])
    agent: str = Field(..., examples=["resolution-conflits-edt"])
    llm_provider: str = Field(..., examples=["template", "groq"])
    llm_model: str | None = Field(None, examples=["llama-3.1-8b-instant"])
    llm_configured: bool = Field(..., examples=[True])
