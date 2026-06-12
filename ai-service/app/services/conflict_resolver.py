from fastapi import HTTPException, status

from app.llm.conflict_explainer import explain_conflict
from app.schemas.conflict import (
    AvailableInstructor,
    AvailableRoom,
    ConflictPair,
    ConflictSuggestBatchResponse,
    ConflictSuggestItem,
    ConflictSuggestResponse,
)
from app.services.academic_client import (
    _fetch_supporting_data,
    fetch_conflicts,
    load_conflict_context,
)
from app.services.suggestion_engine import build_conflict_summary, build_suggestions


async def build_suggest_response(
    conflict: ConflictPair,
    available_rooms: list[AvailableRoom],
    available_instructors: list[AvailableInstructor] | None = None,
) -> ConflictSuggestResponse:
    conflict_summary = build_conflict_summary(conflict)
    suggestions = build_suggestions(
        conflict,
        available_rooms,
        available_instructors,
    )
    explanation, provider, model = await explain_conflict(
        conflict_summary,
        suggestions,
    )
    return ConflictSuggestResponse(
        provider=provider,
        model=model,
        conflict_summary=conflict_summary,
        explanation=explanation,
        suggestions=suggestions,
    )


async def resolve_orchestrated(
    campus_id: str,
    schedule_a_id: str | None,
    schedule_b_id: str | None,
    token: str,
) -> ConflictSuggestResponse:
    if schedule_a_id and schedule_b_id:
        conflict, rooms, instructors = await load_conflict_context(
            campus_id,
            schedule_a_id,
            schedule_b_id,
            token,
        )
    else:
        conflicts = await fetch_conflicts(campus_id, token)
        if not conflicts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Aucun conflit détecté pour ce campus. "
                    "Exécutez : npm run prisma:seed:m7-conflict (depuis academic-service)."
                ),
            )
        conflict = conflicts[0]
        rooms, instructors = await _fetch_supporting_data(conflict, campus_id, token)

    return await build_suggest_response(conflict, rooms, instructors)


async def resolve_batch(campus_id: str, token: str) -> ConflictSuggestBatchResponse:
    conflicts = await fetch_conflicts(campus_id, token)
    results: list[ConflictSuggestItem] = []

    for conflict in conflicts:
        rooms, instructors = await _fetch_supporting_data(conflict, campus_id, token)
        suggestion = await build_suggest_response(conflict, rooms, instructors)
        results.append(
            ConflictSuggestItem(
                conflict=conflict,
                **suggestion.model_dump(),
            )
        )

    return ConflictSuggestBatchResponse(
        campus_id=campus_id,
        total_conflicts=len(results),
        results=results,
    )
