from typing import Literal

from pydantic import BaseModel, Field


class ScheduleSlot(BaseModel):
    schedule_id: str = Field(..., max_length=50)
    course_id: str | None = Field(None, max_length=50)
    course_name: str | None = Field(None, max_length=180)
    instructor_id: str | None = Field(None, max_length=50)
    instructor_name: str | None = Field(None, max_length=180)
    room_id: str = Field(..., max_length=50)
    room_name: str | None = Field(None, max_length=120)
    day_of_week: int = Field(..., ge=1, le=7)
    start_time: str = Field(..., max_length=12)
    end_time: str = Field(..., max_length=12)
    academic_year: str | None = Field(None, max_length=50)


ConflictType = Literal["room", "instructor"]


class ConflictPair(BaseModel):
    schedule_a: ScheduleSlot
    schedule_b: ScheduleSlot
    reason: str | None = Field(None, max_length=300)
    type: ConflictType = "room"


class AvailableRoom(BaseModel):
    room_id: str = Field(..., max_length=50)
    room_name: str = Field(..., max_length=120)
    capacity: int | None = Field(None, ge=1)
    building: str | None = Field(None, max_length=120)


class AvailableInstructor(BaseModel):
    instructor_id: str = Field(..., max_length=50)
    instructor_name: str = Field(..., max_length=180)


class ConflictSuggestRequest(BaseModel):
    """Mode MVP — payload manuel."""
    conflict: ConflictPair
    available_rooms: list[AvailableRoom] = Field(default_factory=list)
    available_instructors: list[AvailableInstructor] = Field(default_factory=list)


class OrchestratedSuggestRequest(BaseModel):
    """Mode orchestré — l'agent récupère conflit + salles via le gateway."""
    campus_id: str = Field(..., max_length=50)
    schedule_a_id: str | None = Field(
        None,
        max_length=50,
        description="Optionnel — premier conflit du campus si absent",
    )
    schedule_b_id: str | None = Field(None, max_length=50)


class BatchSuggestRequest(BaseModel):
    """Orchestration — tous les conflits d'un campus."""
    campus_id: str = Field(..., max_length=50)


SuggestionType = Literal["change_room", "reschedule", "change_instructor"]
ConfidenceLevel = Literal["high", "medium", "low"]


class Suggestion(BaseModel):
    type: SuggestionType
    target_schedule_id: str
    target_course_name: str | None = None
    proposed_room_id: str | None = None
    proposed_room_name: str | None = None
    proposed_day_of_week: int | None = Field(None, ge=1, le=7)
    proposed_start_time: str | None = None
    proposed_end_time: str | None = None
    proposed_instructor_id: str | None = None
    proposed_instructor_name: str | None = None
    confidence: ConfidenceLevel
    impact: str


class ConflictSuggestResponse(BaseModel):
    provider: str
    model: str | None
    conflict_summary: str
    explanation: str
    suggestions: list[Suggestion]


class ConflictSuggestItem(ConflictSuggestResponse):
    conflict: ConflictPair


class ConflictSuggestBatchResponse(BaseModel):
    campus_id: str
    total_conflicts: int
    results: list[ConflictSuggestItem]


class LlmStatusResponse(BaseModel):
    provider: str
    model: str | None
    configured: bool
    agent: str = "resolution-conflits-edt"
