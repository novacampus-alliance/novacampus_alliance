from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.conflict import (
    AvailableInstructor,
    AvailableRoom,
    ConflictPair,
    ConflictType,
    ScheduleSlot,
)

TIMEOUT = httpx.Timeout(15.0)


def _api_url(path: str) -> str:
    base = settings.BACKEND_URL.rstrip("/")
    suffix = path if path.startswith("/") else f"/{path}"
    return f"{base}{suffix}"


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _normalize_time(value: Any) -> str:
    raw = str(value)
    if "T" in raw:
        return raw.split("T")[1][:8]
    return raw[:8] if len(raw) >= 5 else raw


def map_schedule(raw: dict[str, Any]) -> ScheduleSlot:
    course = raw.get("course") or {}
    instructor = raw.get("instructor") or {}
    room = raw.get("room") or {}

    first = instructor.get("first_name", "")
    last = instructor.get("last_name", "")
    instructor_name = f"{first} {last}".strip() or None

    return ScheduleSlot(
        schedule_id=str(raw["schedule_id"]),
        course_id=course.get("course_id"),
        course_name=course.get("course_name"),
        instructor_id=instructor.get("instructor_id"),
        instructor_name=instructor_name,
        room_id=str(raw["room_id"]),
        room_name=room.get("room_name"),
        day_of_week=int(raw["day_of_week"]),
        start_time=_normalize_time(raw["start_time"]),
        end_time=_normalize_time(raw["end_time"]),
        academic_year=raw.get("academic_year"),
    )


def map_conflict(raw: dict[str, Any]) -> ConflictPair:
    conflict_type: ConflictType = raw.get("type", "room")
    if conflict_type not in ("room", "instructor"):
        conflict_type = "room"
    return ConflictPair(
        schedule_a=map_schedule(raw["schedule_a"]),
        schedule_b=map_schedule(raw["schedule_b"]),
        reason=raw.get("reason"),
        type=conflict_type,
    )


def map_instructor(raw: dict[str, Any]) -> AvailableInstructor:
    first = raw.get("first_name", "")
    last = raw.get("last_name", "")
    name = f"{first} {last}".strip() or str(raw.get("instructor_id", ""))
    return AvailableInstructor(
        instructor_id=str(raw["instructor_id"]),
        instructor_name=name,
    )


def map_available_room(raw: dict[str, Any]) -> AvailableRoom:
    return AvailableRoom(
        room_id=str(raw["room_id"]),
        room_name=str(raw.get("room_name", "")),
        capacity=raw.get("capacity"),
        building=raw.get("building"),
    )


async def _request(
    method: str,
    path: str,
    token: str,
    *,
    params: dict[str, Any] | None = None,
) -> Any:
    url = _api_url(path)
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.request(
                method,
                url,
                headers=_auth_headers(token),
                params=params,
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service académique injoignable ({settings.BACKEND_URL})",
        ) from exc

    if response.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refusé par le service académique",
        )
    if response.status_code == 403:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé par le service académique",
        )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erreur service académique ({response.status_code})",
        )

    return response.json()


async def fetch_instructors(token: str) -> list[AvailableInstructor]:
    data = await _request("GET", "/api/instructors", token)
    if not isinstance(data, list):
        return []
    return [map_instructor(item) for item in data]


async def fetch_conflicts(campus_id: str, token: str) -> list[ConflictPair]:
    data = await _request(
        "GET",
        "/api/schedules/conflicts",
        token,
        params={"campus_id": campus_id},
    )
    if not isinstance(data, list):
        return []
    return [map_conflict(item) for item in data]


async def fetch_available_rooms(
    campus_id: str,
    day_of_week: int,
    start_time: str,
    end_time: str,
    token: str,
    academic_year: str | None = None,
) -> list[AvailableRoom]:
    params: dict[str, Any] = {
        "campus_id": campus_id,
        "day_of_week": day_of_week,
        "start_time": _normalize_time(start_time)[:5],
        "end_time": _normalize_time(end_time)[:5],
    }
    if academic_year:
        params["academic_year"] = academic_year

    data = await _request("GET", "/api/rooms/available", token, params=params)
    if not isinstance(data, list):
        return []
    return [map_available_room(item) for item in data]


def find_conflict_pair(
    conflicts: list[ConflictPair],
    schedule_a_id: str,
    schedule_b_id: str,
) -> ConflictPair | None:
    ids = {schedule_a_id, schedule_b_id}
    for conflict in conflicts:
        pair_ids = {conflict.schedule_a.schedule_id, conflict.schedule_b.schedule_id}
        if pair_ids == ids:
            return conflict
    return None


async def load_conflict_context(
    campus_id: str,
    schedule_a_id: str,
    schedule_b_id: str,
    token: str,
) -> tuple[ConflictPair, list[AvailableRoom], list[AvailableInstructor]]:
    conflicts = await fetch_conflicts(campus_id, token)
    if not conflicts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Aucun conflit détecté pour ce campus. "
                "Exécutez : npm run prisma:seed:m7-conflict (depuis academic-service)."
            ),
        )
    conflict = find_conflict_pair(conflicts, schedule_a_id, schedule_b_id)
    if conflict is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Conflit introuvable pour les créneaux fournis. "
                f"IDs attendus parmi : "
                f"{[c.schedule_a.schedule_id for c in conflicts]} / "
                f"{[c.schedule_b.schedule_id for c in conflicts]}"
            ),
        )

    rooms, instructors = await _fetch_supporting_data(conflict, campus_id, token)
    return conflict, rooms, instructors


async def _fetch_supporting_data(
    conflict: ConflictPair,
    campus_id: str,
    token: str,
) -> tuple[list[AvailableRoom], list[AvailableInstructor]]:
    slot = conflict.schedule_a
    academic_year = slot.academic_year or conflict.schedule_b.academic_year
    rooms = await fetch_available_rooms(
        campus_id=campus_id,
        day_of_week=slot.day_of_week,
        start_time=slot.start_time,
        end_time=slot.end_time,
        token=token,
        academic_year=academic_year,
    )
    instructors: list[AvailableInstructor] = []
    if conflict.type == "instructor":
        instructors = await fetch_instructors(token)
    return rooms, instructors
