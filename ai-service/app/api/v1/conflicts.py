from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import AuthContext, require_conflict_agent, require_conflict_agent_context
from app.core.config import settings
from app.core.llm_client import get_active_model_name
from app.schemas.conflict import (
    BatchSuggestRequest,
    ConflictSuggestBatchResponse,
    ConflictSuggestRequest,
    ConflictSuggestResponse,
    LlmStatusResponse,
    OrchestratedSuggestRequest,
)
from app.services.conflict_resolver import (
    build_suggest_response,
    resolve_batch,
    resolve_orchestrated,
)

router = APIRouter(prefix="/conflicts", tags=["conflicts"])


@router.get("/llm/status", response_model=LlmStatusResponse)
def llm_status():
    return LlmStatusResponse(
        provider=settings.LLM_PROVIDER,
        model=get_active_model_name(),
        configured=settings.llm_configured(),
    )


@router.post("/suggest", response_model=ConflictSuggestResponse)
async def suggest_resolution(
    body: ConflictSuggestRequest,
    _user: Annotated[object, Depends(require_conflict_agent)],
):
    """MVP — le client fournit le conflit et les salles libres."""
    return await build_suggest_response(
        body.conflict,
        body.available_rooms,
        body.available_instructors or None,
    )


@router.post("/suggest/auto", response_model=ConflictSuggestResponse)
async def suggest_resolution_auto(
    body: OrchestratedSuggestRequest,
    auth: Annotated[AuthContext, Depends(require_conflict_agent_context)],
):
    """Orchestration — récupère conflit + salles via le gateway SOA."""
    return await resolve_orchestrated(
        body.campus_id,
        body.schedule_a_id,
        body.schedule_b_id,
        auth.token,
    )


@router.post("/suggest/batch", response_model=ConflictSuggestBatchResponse)
async def suggest_resolution_batch(
    body: BatchSuggestRequest,
    auth: Annotated[AuthContext, Depends(require_conflict_agent_context)],
):
    """Orchestration — traite tous les conflits d'un campus."""
    return await resolve_batch(body.campus_id, auth.token)
