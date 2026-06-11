from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.auth import AuthContext, require_conflict_agent, require_conflict_agent_context
from app.core.config import settings
from app.core.llm_client import get_active_model_name
from app.schemas.common import ErrorResponse
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

router = APIRouter(prefix="/conflicts", tags=["Agent — Conflits EDT"])

_AUTH_ERRORS: dict[int, dict] = {
    status.HTTP_401_UNAUTHORIZED: {
        "model": ErrorResponse,
        "description": "JWT absent, invalide ou expiré",
    },
    status.HTTP_403_FORBIDDEN: {
        "model": ErrorResponse,
        "description": "Rôle non autorisé (ex. STUDENT) ou token refusé par le gateway",
    },
}

_ORCHESTRATION_ERRORS: dict[int, dict] = {
    **_AUTH_ERRORS,
    status.HTTP_404_NOT_FOUND: {
        "model": ErrorResponse,
        "description": "Aucun conflit sur le campus (seed M7 requis) ou paire introuvable",
    },
    status.HTTP_502_BAD_GATEWAY: {
        "model": ErrorResponse,
        "description": "Erreur en cascade depuis academic-service",
    },
    status.HTTP_503_SERVICE_UNAVAILABLE: {
        "model": ErrorResponse,
        "description": "Gateway / academic-service injoignable ou JWT_SECRET manquant",
    },
}


@router.get(
    "/llm/status",
    response_model=LlmStatusResponse,
    summary="Statut du provider LLM",
    description=(
        "Vérifie si le provider configuré (`LLM_PROVIDER`) est opérationnel. "
        "**Sans authentification.**"
    ),
    responses={
        status.HTTP_200_OK: {"description": "État du provider et du modèle actif"},
    },
)
def llm_status():
    return LlmStatusResponse(
        provider=settings.LLM_PROVIDER,
        model=get_active_model_name(),
        configured=settings.llm_configured(),
    )


@router.post(
    "/suggest",
    response_model=ConflictSuggestResponse,
    summary="Suggestion MVP (payload manuel)",
    description=(
        "Le client envoie le **conflit** et les **ressources libres** "
        "(salles et/ou enseignants). Utile pour tests unitaires et démos isolées."
    ),
    responses={
        status.HTTP_200_OK: {"description": "Suggestions + explication LLM"},
        **_AUTH_ERRORS,
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": ErrorResponse,
            "description": "JWT_SECRET non configuré",
        },
    },
)
async def suggest_resolution(
    body: ConflictSuggestRequest,
    _user: Annotated[object, Depends(require_conflict_agent)],
):
    return await build_suggest_response(
        body.conflict,
        body.available_rooms,
        body.available_instructors or None,
    )


@router.post(
    "/suggest/auto",
    response_model=ConflictSuggestResponse,
    summary="Suggestion orchestrée (un conflit)",
    description=(
        "L'agent appelle le gateway : `GET /schedules/conflicts`, "
        "`GET /rooms/available`, `GET /instructors` (si type `instructor`).\n\n"
        "Fournir uniquement `campus_id` pour traiter le **premier conflit**, "
        "ou `schedule_a_id` + `schedule_b_id` pour une paire précise."
    ),
    responses={
        status.HTTP_200_OK: {"description": "Suggestions pour le conflit ciblé"},
        **_ORCHESTRATION_ERRORS,
    },
)
async def suggest_resolution_auto(
    body: OrchestratedSuggestRequest,
    auth: Annotated[AuthContext, Depends(require_conflict_agent_context)],
):
    return await resolve_orchestrated(
        body.campus_id,
        body.schedule_a_id,
        body.schedule_b_id,
        auth.token,
    )


@router.post(
    "/suggest/batch",
    response_model=ConflictSuggestBatchResponse,
    summary="Suggestion orchestrée (tous les conflits)",
    description=(
        "Traite **chaque conflit** du campus séquentiellement. "
        "Requiert des conflits en base (`npm run prisma:seed:m7-conflict`)."
    ),
    responses={
        status.HTTP_200_OK: {"description": "Liste des suggestions par conflit"},
        **_ORCHESTRATION_ERRORS,
    },
)
async def suggest_resolution_batch(
    body: BatchSuggestRequest,
    auth: Annotated[AuthContext, Depends(require_conflict_agent_context)],
):
    return await resolve_batch(body.campus_id, auth.token)
