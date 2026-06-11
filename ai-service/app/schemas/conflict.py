from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.openapi_examples import (
    SUGGEST_AUTO,
    SUGGEST_AUTO_WITH_IDS,
    SUGGEST_BATCH,
    SUGGEST_MANUAL_INSTRUCTOR,
    SUGGEST_MANUAL_ROOM,
    SUGGEST_RESPONSE,
)


class ScheduleSlot(BaseModel):
    schedule_id: str = Field(..., max_length=50, description="Identifiant du créneau EDT")
    course_id: str | None = Field(None, max_length=50)
    course_name: str | None = Field(None, max_length=180, description="Nom du cours")
    instructor_id: str | None = Field(None, max_length=50)
    instructor_name: str | None = Field(None, max_length=180)
    room_id: str = Field(..., max_length=50, description="Identifiant salle")
    room_name: str | None = Field(None, max_length=120)
    day_of_week: int = Field(..., ge=1, le=7, description="1=lundi … 7=dimanche")
    start_time: str = Field(..., max_length=12, examples=["14:00"])
    end_time: str = Field(..., max_length=12, examples=["16:00"])
    academic_year: str | None = Field(None, max_length=50, examples=["2025-2026"])


ConflictType = Literal["room", "instructor"]


class ConflictPair(BaseModel):
    schedule_a: ScheduleSlot
    schedule_b: ScheduleSlot
    reason: str | None = Field(None, max_length=300, description="Libellé métier du conflit")
    type: ConflictType = Field(
        "room",
        description="`room` = double réservation salle · `instructor` = double affectation enseignant",
    )


class AvailableRoom(BaseModel):
    room_id: str = Field(..., max_length=50)
    room_name: str = Field(..., max_length=120)
    capacity: int | None = Field(None, ge=1)
    building: str | None = Field(None, max_length=120)


class AvailableInstructor(BaseModel):
    instructor_id: str = Field(..., max_length=50)
    instructor_name: str = Field(..., max_length=180)


class ConflictSuggestRequest(BaseModel):
    """Mode MVP — le client fournit le conflit et les ressources disponibles."""

    conflict: ConflictPair
    available_rooms: list[AvailableRoom] = Field(
        default_factory=list,
        description="Salles libres sur le créneau (conflit `room`)",
    )
    available_instructors: list[AvailableInstructor] = Field(
        default_factory=list,
        description="Enseignants disponibles (conflit `instructor`)",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [SUGGEST_MANUAL_ROOM, SUGGEST_MANUAL_INSTRUCTOR],
        },
    )


class OrchestratedSuggestRequest(BaseModel):
    """Mode orchestré — l'agent récupère conflit et ressources via le gateway SOA."""

    campus_id: str = Field(..., max_length=50, description="Campus cible")
    schedule_a_id: str | None = Field(
        None,
        max_length=50,
        description="Optionnel — sans IDs, traite le premier conflit du campus",
    )
    schedule_b_id: str | None = Field(None, max_length=50)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [SUGGEST_AUTO, SUGGEST_AUTO_WITH_IDS],
        },
    )


class BatchSuggestRequest(BaseModel):
    """Orchestration — traite tous les conflits détectés sur un campus."""

    campus_id: str = Field(..., max_length=50)

    model_config = ConfigDict(
        json_schema_extra={"examples": [SUGGEST_BATCH]},
    )


SuggestionType = Literal["change_room", "reschedule", "change_instructor"]
ConfidenceLevel = Literal["high", "medium", "low"]


class Suggestion(BaseModel):
    type: SuggestionType = Field(
        ...,
        description="`change_room` · `change_instructor` · `reschedule` (fallback)",
    )
    target_schedule_id: str = Field(..., description="Créneau à modifier")
    target_course_name: str | None = None
    proposed_room_id: str | None = None
    proposed_room_name: str | None = None
    proposed_day_of_week: int | None = Field(None, ge=1, le=7)
    proposed_start_time: str | None = None
    proposed_end_time: str | None = None
    proposed_instructor_id: str | None = None
    proposed_instructor_name: str | None = None
    confidence: ConfidenceLevel
    impact: str = Field(..., description="Résumé métier de l'impact de la suggestion")


class ConflictSuggestResponse(BaseModel):
    provider: str = Field(..., description="Provider LLM (`groq`, `template`, …)")
    model: str | None = Field(None, description="Modèle LLM actif")
    conflict_summary: str = Field(..., description="Résumé structuré du conflit")
    explanation: str = Field(..., description="Explication en français (LLM ou template)")
    suggestions: list[Suggestion] = Field(
        ...,
        description="Options de résolution (max 4, dédupliquées)",
    )

    model_config = ConfigDict(
        json_schema_extra={"examples": [SUGGEST_RESPONSE]},
    )


class ConflictSuggestItem(ConflictSuggestResponse):
    conflict: ConflictPair


class ConflictSuggestBatchResponse(BaseModel):
    campus_id: str
    total_conflicts: int = Field(..., ge=0)
    results: list[ConflictSuggestItem]


class LlmStatusResponse(BaseModel):
    provider: str = Field(..., examples=["groq", "template"])
    model: str | None = Field(None, examples=["llama-3.1-8b-instant"])
    configured: bool = Field(..., description="Clé API / provider prêt à l'emploi")
    agent: str = Field("resolution-conflits-edt", examples=["resolution-conflits-edt"])
