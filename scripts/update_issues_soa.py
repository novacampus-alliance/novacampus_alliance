#!/usr/bin/env python3
"""Met à jour les issues GitHub pour refléter l'architecture SOA."""

import json
import subprocess
import sys

REPO = "Meckagameers85/novacampus_alliance"
DOC = "docs/project-structure.md"

ACADEMIC_FOOTER = f"""
## Service SOA
Implementer dans `services/academic-service/` (port 3002, expose via gateway :3001).
Prefixe API public : `/api/<ressource>` (routage automatique par le gateway).

## Documentation
- [{DOC}]({DOC})
- [docs/architecture-soa.md](docs/architecture-soa.md)
"""

BILLING_FOOTER = f"""
## Service SOA
Implementer dans `services/billing-service/` (port 3003, expose via gateway :3001).
Prefixe API public : `/api/payments`, `/api/invoices`, etc.

## Documentation
- [{DOC}]({DOC})
"""

NOTIFICATION_FOOTER = f"""
## Service SOA
Implementer dans `services/notification-service/` (port 3004, expose via gateway :3001).
Prefixe API public : `/api/notifications`.

## Documentation
- [{DOC}]({DOC})
"""

# issue_number -> (new_body or None to append footer only, labels to add, close?)
UPDATES: dict[int, dict] = {
    3: {
        "body": """## Objectif
Mettre en place l'arborescence de base du monorepo SOA.

## Taches (realisees)
- [x] Dossiers racine : `frontend/`, `services/`, `ai-service/`, `prisma/`, `docs/`
- [x] Next.js 14 dans `frontend/`
- [x] Services NestJS dans `services/` (gateway, academic, billing, notification)
- [x] FastAPI dans `ai-service/`
- [x] `.gitignore` par service
- [x] Builds verifies

## Structure actuelle
```
services/
├── gateway/              # API Gateway :3001
├── academic-service/       # Svc Academique :3002
├── billing-service/      # Svc Facturation :3003
└── notification-service/ # Svc Notification :3004
```

## Documentation
- [docs/project-structure.md](docs/project-structure.md)

## Branche
`feature/init-monorepo` (merge) + `refactor/architecture-soa`
""",
        "labels_add": ["infrastructure"],
    },
    4: {
        "body": """## Objectif
Mettre en place l'environnement de developpement local via Docker Compose (architecture SOA).

## Taches (realisees)
- [x] `docker-compose.yml` a la racine
- [x] PostgreSQL (port 5432), MongoDB (27017), Redis (6379)
- [x] Volumes persistants
- [x] Services applicatifs : gateway, academic-service, billing-service, notification-service, ai-service, frontend
- [x] Variables via `.env.example`

## Commande
```bash
docker compose --env-file .env up -d --build
```

## Documentation
- [docs/project-structure.md](docs/project-structure.md)

## Branche
`refactor/architecture-soa`
""",
        "labels_add": ["infrastructure"],
    },
    9: {
        "body": """## Objectif
Implementer le systeme d'authentification avec JWT et gestion des roles.

## Realise dans `services/academic-service/`
- [x] Module Auth NestJS (login/logout/me)
- [x] Generation et validation JWT avec `jti` pour revocation
- [x] Guards NestJS par role (`JwtAuthGuard`, `RolesGuard`)
- [x] Hash bcrypt des mots de passe
- [x] Liste noire Redis au logout (revocation serveur)
- [x] Middleware Next.js + pages login + portails par role
- [x] Seed utilisateurs de test (`Novacampus2026!`)

## Routes (via gateway :3001)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Branche
`9-authentification-jwt-login-logout-gestion-des-roles`
""",
    },
    10: {
        "body": """## Objectif
Gerer les campus du groupe (creation, modification, consultation).

## Realise dans `services/academic-service/src/campus/`
- [x] `GET /api/campus` — liste avec compteurs
- [x] `GET /api/campus/:id` — detail avec liaisons
- [x] `POST /api/campus` — creation
- [x] `PUT /api/campus/:id` — mise a jour
- [x] Validation class-validator (DTOs)
- [x] Liaisons : adresse, programmes, enseignants, etudiants, batiments (salles groupees)

## Roles
- Lecture : ADMIN, DIRECTION, INSTRUCTOR
- Ecriture : ADMIN, DIRECTION

## Branche
`10-module-campus-crud-et-gestion-multi-campus`
""",
        "close": True,
        "comment": "Implemente dans `services/academic-service/src/campus/`. Voir docs/project-structure.md",
    },
    39: {
        "body": """## Contexte
Agent de Relance Financiere Intelligente.

## Objectif
Squelette du service IA isole et fonctionnel.

## Taches
- [x] Projet FastAPI dans `ai-service/`
- [x] Pydantic Settings (`app/core/config.py`)
- [x] `GET /health`
- [x] `GET /api/v1/ping`
- [x] Dockerfile + integration docker-compose.yml
- [x] `.env.example` documente
- [ ] Installer LangChain + langchain-openai (requirements.txt a enrichir)
- [ ] Connexion HTTP depuis billing-service vers ai-service
- [ ] Endpoint `POST /api/v1/relances/generer`

## Service SOA
`ai-service/` (port 8000, expose via gateway `/api/v1`)

## Branche
`feature/ia-service-init`
""",
    },
}

# Issues academiques #11-19
ACADEMIC_ISSUES = {
    11: ("Programmes", "programmes", "Programme", "Cours et Etudiants"),
    12: ("Enseignants", "instructors", "Enseignant", "affectation aux cours"),
    13: ("Etudiants", "students", "Etudiant", "dossier academique"),
    14: ("Cours", "courses", "Cours", "affectation enseignant/programme"),
    15: ("Salles et Batiments", "rooms", "Salle/Batiment", "disponibilite"),
    16: ("Plannings", "schedules", "Planning/EDT", "emplois du temps"),
    17: ("Conflits de salles", "conflicts", "Conflit", "detection automatique"),
    18: ("Inscriptions", "enrollments", "Inscription", "enrolement aux cours"),
    19: ("Notes et Absences", "grades", "Note/Absence", "saisie et consultation"),
}

for num, (title, module, entity, extra) in ACADEMIC_ISSUES.items():
    UPDATES[num] = {
        "body": f"""## Objectif
Gerer les {title.lower()} du groupe.

## Taches
- Endpoints REST CRUD pour {entity}
- Validation class-validator (DTOs)
- Module NestJS dans `services/academic-service/src/{module}/`
- Relation Prisma selon schema (`prisma/schema.prisma`)

## Contexte
{extra}

## Branche
`feature/module-{module}`
{ACADEMIC_FOOTER}""",
        "labels_add": ["backend"],
    }

# Facturation #20-23
BILLING_ISSUES = {
    20: "Module Paiements — CRUD et suivi des statuts",
    21: "Generation automatique des factures a l'inscription",
    22: "Suivi des encaissements et gestion des echeanciers",
    23: "Systeme de relances automatiques (paiements en retard)",
}

for num, title in BILLING_ISSUES.items():
    UPDATES[num] = {
        "body": f"""## Objectif
{title}.

## Taches
- Module NestJS dans `services/billing-service/src/`
- Endpoints REST via gateway `/api/payments` (et extensions)
- Prisma : modeles Payment, RelanceHistory

## Branche
`feature/billing-{num}`
{BILLING_FOOTER}""",
        "labels_add": ["facturation", "backend"],
    }

# Notification #32-34
NOTIF_ISSUES = {
    32: "Implementer le service de notifications (Mail / Push)",
    33: "Notifications automatiques — changements d'emploi du temps",
    34: "Notifications automatiques — rappels deadlines et paiements en retard",
}

for num, title in NOTIF_ISSUES.items():
    UPDATES[num] = {
        "body": f"""## Objectif
{title}.

## Taches
- Module dans `services/notification-service/src/`
- Endpoints REST `/api/notifications`
- Prisma : modele Notification
- Integration email (Resend ou Nodemailer) si applicable

## Branche
`feature/notification-{num}`
{NOTIFICATION_FOOTER}""",
        "labels_add": ["notification", "backend"],
    }


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERR: {' '.join(cmd)}", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)


def main() -> None:
    # Creer labels SOA si absents
    for label, desc, color in [
        ("academic-service", "Svc Academique NestJS (port 3002)", "1d76db"),
        ("billing-service", "Svc Facturation NestJS (port 3003)", "f9d0c4"),
        ("notification-service", "Svc Notification NestJS (port 3004)", "0e8a16"),
        ("gateway", "API Gateway NestJS (port 3001)", "5319e7"),
    ]:
        subprocess.run(
            ["gh", "label", "create", label, "--description", desc, "--color", color],
            capture_output=True,
        )

    # Mettre a jour le label backend
    subprocess.run(
        [
            "gh", "label", "edit", "backend",
            "--description", "Services NestJS SOA (voir academic-service, billing-service…)",
        ],
        capture_output=True,
    )

    for num, cfg in sorted(UPDATES.items()):
        print(f"Mise a jour issue #{num}...")
        run(["gh", "issue", "edit", str(num), "--body", cfg["body"]])
        for label in cfg.get("labels_add", []):
            run(["gh", "issue", "edit", str(num), "--add-label", label])
        if num in ACADEMIC_ISSUES:
            run(["gh", "issue", "edit", str(num), "--add-label", "academic-service"])
        if num in BILLING_ISSUES:
            run(["gh", "issue", "edit", str(num), "--add-label", "billing-service"])
        if num in NOTIF_ISSUES:
            run(["gh", "issue", "edit", str(num), "--add-label", "notification-service"])
        if cfg.get("close"):
            comment = cfg.get("comment", "Realise.")
            run(["gh", "issue", "close", str(num), "--comment", comment])

    print("Termine.")


if __name__ == "__main__":
    main()
