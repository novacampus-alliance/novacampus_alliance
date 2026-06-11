from app.schemas.conflict import (
    AvailableInstructor,
    AvailableRoom,
    ConflictPair,
    ScheduleSlot,
)
from app.services.suggestion_engine import build_conflict_summary, build_suggestions


def _slot(
    schedule_id: str,
    *,
    room_id: str = "room-a",
    instructor_id: str = "inst-1",
    course_name: str = "Maths",
) -> ScheduleSlot:
    return ScheduleSlot(
        schedule_id=schedule_id,
        course_name=course_name,
        instructor_id=instructor_id,
        instructor_name="Jean Dupont",
        room_id=room_id,
        room_name="Salle A",
        day_of_week=2,
        start_time="14:00",
        end_time="16:00",
        academic_year="2025-2026",
    )


def test_room_conflict_suggests_change_room():
    conflict = ConflictPair(
        schedule_a=_slot("s1"),
        schedule_b=_slot("s2", course_name="Physique"),
        type="room",
    )
    rooms = [
        AvailableRoom(room_id="room-b", room_name="Salle B", capacity=30),
        AvailableRoom(room_id="room-a", room_name="Salle A", capacity=20),
    ]
    suggestions = build_suggestions(conflict, rooms)
    assert suggestions
    assert all(s.type == "change_room" for s in suggestions)
    assert suggestions[0].proposed_room_id == "room-b"


def test_instructor_conflict_suggests_change_instructor():
    conflict = ConflictPair(
        schedule_a=_slot("s1", room_id="room-a"),
        schedule_b=_slot("s2", room_id="room-b", course_name="Physique"),
        type="instructor",
    )
    instructors = [
        AvailableInstructor(instructor_id="inst-1", instructor_name="Jean Dupont"),
        AvailableInstructor(instructor_id="inst-2", instructor_name="Marie Martin"),
    ]
    suggestions = build_suggestions(conflict, [], instructors)
    assert suggestions
    assert any(s.type == "change_instructor" for s in suggestions)
    assert all(s.proposed_instructor_id == "inst-2" for s in suggestions if s.type == "change_instructor")


def test_instructor_conflict_fallback_reschedule():
    conflict = ConflictPair(
        schedule_a=_slot("s1"),
        schedule_b=_slot("s2"),
        type="instructor",
    )
    suggestions = build_suggestions(conflict, [], [])
    assert len(suggestions) == 1
    assert suggestions[0].type == "reschedule"


def test_conflict_summary_instructor():
    conflict = ConflictPair(
        schedule_a=_slot("s1"),
        schedule_b=_slot("s2"),
        type="instructor",
    )
    summary = build_conflict_summary(conflict)
    assert "enseignant" in summary.lower()
