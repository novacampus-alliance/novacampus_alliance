"""Exemples JSON pour la documentation Swagger."""

SCHEDULE_A = {
    "schedule_id": "sched-m7-a",
    "course_id": "course-algo",
    "course_name": "Algorithmique",
    "instructor_id": "inst-dupont",
    "instructor_name": "Jean Dupont",
    "room_id": "room-a",
    "room_name": "Salle A",
    "day_of_week": 2,
    "start_time": "14:00",
    "end_time": "16:00",
    "academic_year": "2025-2026",
}

SCHEDULE_B = {
    "schedule_id": "sched-m7-b",
    "course_id": "course-bdd",
    "course_name": "Bases de données",
    "instructor_id": "inst-dupont",
    "instructor_name": "Jean Dupont",
    "room_id": "room-b",
    "room_name": "Salle B",
    "day_of_week": 2,
    "start_time": "14:00",
    "end_time": "16:00",
    "academic_year": "2025-2026",
}

SUGGEST_MANUAL_ROOM = {
    "conflict": {
        "schedule_a": SCHEDULE_A,
        "schedule_b": {
            **SCHEDULE_B,
            "room_id": "room-a",
            "room_name": "Salle A",
        },
        "reason": "Conflit salle Salle A — jour 2",
        "type": "room",
    },
    "available_rooms": [
        {"room_id": "room-c", "room_name": "Salle C", "capacity": 40, "building": "Bât. B"},
    ],
    "available_instructors": [],
}

SUGGEST_MANUAL_INSTRUCTOR = {
    "conflict": {
        "schedule_a": SCHEDULE_A,
        "schedule_b": SCHEDULE_B,
        "reason": "Conflit enseignant Jean Dupont — jour 2",
        "type": "instructor",
    },
    "available_rooms": [],
    "available_instructors": [
        {"instructor_id": "inst-martin", "instructor_name": "Marie Martin"},
    ],
}

SUGGEST_AUTO = {"campus_id": "campus-paris-01"}

SUGGEST_AUTO_WITH_IDS = {
    "campus_id": "campus-paris-01",
    "schedule_a_id": "sched-m7-a",
    "schedule_b_id": "sched-m7-b",
}

SUGGEST_BATCH = {"campus_id": "campus-paris-01"}

SUGGEST_RESPONSE = {
    "provider": "template",
    "model": None,
    "conflict_summary": (
        "Conflit salle Salle A — jour 2. Créneau A : « Algorithmique » — mardi 14:00-16:00. "
        "Créneau B : « Bases de données » — mardi 14:00-16:00."
    ),
    "explanation": (
        "Deux cours partagent la Salle A au même créneau. "
        "Je recommande de déplacer Bases de données vers la Salle C."
    ),
    "suggestions": [
        {
            "type": "change_room",
            "target_schedule_id": "sched-m7-b",
            "target_course_name": "Bases de données",
            "proposed_room_id": "room-c",
            "proposed_room_name": "Salle C",
            "proposed_day_of_week": None,
            "proposed_start_time": None,
            "proposed_end_time": None,
            "proposed_instructor_id": None,
            "proposed_instructor_name": None,
            "confidence": "high",
            "impact": "Déplacer Bases de données vers Salle C (capacité 40) — résout le conflit de salle",
        },
    ],
}
