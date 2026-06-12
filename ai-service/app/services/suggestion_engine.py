from app.schemas.conflict import (
    AvailableInstructor,
    AvailableRoom,
    ConflictPair,
    ConflictType,
    ScheduleSlot,
    Suggestion,
)

DAY_LABELS = {
    1: "lundi",
    2: "mardi",
    3: "mercredi",
    4: "jeudi",
    5: "vendredi",
    6: "samedi",
    7: "dimanche",
}


def _normalize_time(value: str) -> str:
    return value[:5] if len(value) >= 5 else value


def _slot_label(slot: ScheduleSlot) -> str:
    day = DAY_LABELS.get(slot.day_of_week, f"jour {slot.day_of_week}")
    room = slot.room_name or slot.room_id
    instructor = slot.instructor_name or "enseignant non précisé"
    course = slot.course_name or "cours sans nom"
    return (
        f"« {course} » — {day} {_normalize_time(slot.start_time)}-"
        f"{_normalize_time(slot.end_time)} — {room} — {instructor}"
    )


def build_conflict_summary(conflict: ConflictPair) -> str:
    if conflict.type == "instructor":
        default = "Conflit double réservation enseignant sur le même créneau"
    else:
        default = "Conflit de salle sur le même créneau"
    reason = conflict.reason or default
    return (
        f"{reason}. Créneau A : {_slot_label(conflict.schedule_a)}. "
        f"Créneau B : {_slot_label(conflict.schedule_b)}."
    )


def _room_change_suggestions(
    slot: ScheduleSlot,
    available_rooms: list[AvailableRoom],
) -> list[Suggestion]:
    suggestions: list[Suggestion] = []
    course = slot.course_name or "ce cours"

    for room in available_rooms:
        if room.room_id == slot.room_id:
            continue
        cap = f" (capacité {room.capacity})" if room.capacity else ""
        suggestions.append(
            Suggestion(
                type="change_room",
                target_schedule_id=slot.schedule_id,
                target_course_name=slot.course_name,
                proposed_room_id=room.room_id,
                proposed_room_name=room.room_name,
                confidence="high",
                impact=(
                    f"Déplacer {course} vers {room.room_name}{cap} "
                    f"au même créneau — résout le conflit de salle"
                ),
            )
        )

    return suggestions[:2]


def _instructor_change_suggestions(
    slot: ScheduleSlot,
    conflict: ConflictPair,
    available_instructors: list[AvailableInstructor],
) -> list[Suggestion]:
    suggestions: list[Suggestion] = []
    course = slot.course_name or "ce cours"
    busy_ids = {
        conflict.schedule_a.instructor_id,
        conflict.schedule_b.instructor_id,
    }

    for instructor in available_instructors:
        if instructor.instructor_id in busy_ids:
            continue
        suggestions.append(
            Suggestion(
                type="change_instructor",
                target_schedule_id=slot.schedule_id,
                target_course_name=slot.course_name,
                proposed_instructor_id=instructor.instructor_id,
                proposed_instructor_name=instructor.instructor_name,
                confidence="medium",
                impact=(
                    f"Réassigner {course} à {instructor.instructor_name} "
                    f"— libère l'enseignant en conflit sur ce créneau"
                ),
            )
        )

    return suggestions[:2]


def _reschedule_fallback(slot: ScheduleSlot, label: str) -> Suggestion:
    next_day = slot.day_of_week + 1 if slot.day_of_week < 5 else 1
    course = slot.course_name or "ce cours"
    day_label = DAY_LABELS.get(next_day, f"jour {next_day}")

    return Suggestion(
        type="reschedule",
        target_schedule_id=slot.schedule_id,
        target_course_name=slot.course_name,
        proposed_day_of_week=next_day,
        proposed_start_time=_normalize_time(slot.start_time),
        proposed_end_time=_normalize_time(slot.end_time),
        confidence="medium",
        impact=(
            f"Décaler {course} au {day_label} "
            f"{_normalize_time(slot.start_time)}-{_normalize_time(slot.end_time)} "
            f"({label})"
        ),
    )


def _dedupe_suggestions(suggestions: list[Suggestion], limit: int = 4) -> list[Suggestion]:
    seen: set[tuple[str, str | None, int | None, str | None]] = set()
    unique: list[Suggestion] = []
    for item in suggestions:
        key = (
            item.target_schedule_id,
            item.proposed_room_id,
            item.proposed_day_of_week,
            item.proposed_instructor_id,
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique[:limit]


def build_suggestions(
    conflict: ConflictPair,
    available_rooms: list[AvailableRoom],
    available_instructors: list[AvailableInstructor] | None = None,
) -> list[Suggestion]:
    instructors = available_instructors or []
    conflict_type: ConflictType = conflict.type
    suggestions: list[Suggestion] = []

    if conflict_type == "instructor":
        for slot in (conflict.schedule_b, conflict.schedule_a):
            suggestions.extend(
                _instructor_change_suggestions(slot, conflict, instructors)
            )
        if not suggestions:
            suggestions.append(
                _reschedule_fallback(conflict.schedule_b, "résout le conflit enseignant")
            )
        return _dedupe_suggestions(suggestions)

    for slot in (conflict.schedule_b, conflict.schedule_a):
        suggestions.extend(_room_change_suggestions(slot, available_rooms))

    if not suggestions:
        fallback = _reschedule_fallback(conflict.schedule_b, "à valider sur l'EDT")
        suggestions.append(fallback)

    return _dedupe_suggestions(suggestions)
