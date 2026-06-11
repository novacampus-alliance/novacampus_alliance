"""Configuration OpenAPI / Swagger UI pour l'agent conflits EDT."""

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

API_DESCRIPTION = """
## Agent IA — Résolution des conflits EDT

Service **Novacampus Alliance** (M7) : propose des solutions aux conflits d'emploi du temps
détectés par `academic-service`, avec explication en langage naturel (LLM Groq ou mode `template`).

### Types de conflits

| `type` | Détection | Suggestions typiques |
|--------|-----------|----------------------|
| `room` | Même salle, même créneau | `change_room`, `reschedule` |
| `instructor` | Même enseignant, même créneau | `change_instructor`, `reschedule` |

### Modes d'appel

1. **MVP** — `POST /conflicts/suggest` : le client envoie le conflit et les ressources libres.
2. **Orchestration** — `POST /conflicts/suggest/auto` : l'agent interroge le gateway SOA.
3. **Batch** — `POST /conflicts/suggest/batch` : tous les conflits d'un campus.

L'agent **ne modifie jamais l'EDT** — seul un **ADMIN** applique via `PUT /api/schedules/:id`.

### Authentification

JWT Bearer (même secret que `academic-service`).

```
POST /api/auth/login  →  access_token
Authorization: Bearer <access_token>
```

Rôles autorisés : **ADMIN**, **DIRECTION**, **INSTRUCTOR**.
"""

OPENAPI_TAGS = [
    {
        "name": "Santé",
        "description": "État du service et du provider LLM.",
    },
    {
        "name": "Agent — Conflits EDT",
        "description": (
            "Suggestions structurées + explication LLM pour les conflits salle / enseignant."
        ),
    },
]

PUBLIC_PATH_SUFFIXES = ("/health", "/llm/status", "/ping", "/openapi.json", "/docs", "/redoc")


def _is_public_path(path: str) -> bool:
    return any(path.endswith(suffix) or suffix in path for suffix in PUBLIC_PATH_SUFFIXES)


def setup_openapi(app: FastAPI) -> None:
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=API_DESCRIPTION,
            routes=app.routes,
            tags=OPENAPI_TAGS,
        )

        schema["servers"] = [
            {
                "url": "http://localhost/api/v1",
                "description": "Production Docker — via gateway + nginx",
            },
            {
                "url": "http://localhost:8000/api/v1",
                "description": "Développement — service IA direct",
            },
        ]

        components = schema.setdefault("components", {})
        components.setdefault("securitySchemes", {})["BearerAuth"] = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": (
                "JWT émis par `POST /api/auth/login` (champ `access_token`). "
                "Même `JWT_SECRET` que academic-service."
            ),
        }

        for path, path_item in schema.get("paths", {}).items():
            if _is_public_path(path):
                continue
            if "/conflicts" not in path:
                continue
            for method, operation in path_item.items():
                if method in {"get", "post", "put", "patch", "delete"}:
                    operation["security"] = [{"BearerAuth": []}]

        app.openapi_schema = schema
        return app.openapi_schema

    app.openapi = custom_openapi
