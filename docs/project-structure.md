# Structure des fichiers — Novacampus Alliance

Arborescence cible du monorepo en **architecture SOA**.  
Chaque service métier est un **projet indépendant** (NestJS ou FastAPI) avec son propre `package.json`, `Dockerfile` et port.

> Voir aussi : [architecture-soa.md](./architecture-soa.md) · [database-schema.md](./database-schema.md)

---

## Vue d'ensemble

```
novacampus_alliance/
├── frontend/                          # Couche présentation — Next.js 14 (port 8080)
├── services/
│   ├── gateway/                       # API Gateway NestJS (port 3000) — point d'entrée unique
│   ├── academic-service/              # Svc Académique NestJS (port 3001)
│   ├── billing-service/               # Svc Facturation NestJS (port 3002)
│   └── notification-service/          # Svc Notification NestJS (port 3003)
├── ai-service/                        # Svc IA FastAPI (port 8000)
├── prisma/                            # Schéma PostgreSQL partagé (Prisma ORM)
├── docs/                              # Documentation technique
├── docker-compose.yml                 # Orchestration SOA (tous les services)
├── nginx/                             # Reverse proxy Nginx (port 80 → gateway:3000)
│   └── nginx.conf                     # Configuration Nginx
├── .env.example                       # Variables racine (Docker Compose)
└── deploy.sh                          # Script déploiement VPS IONOS
```

**Règle :** le frontend et les clients externes appellent **uniquement** le gateway (`NEXT_PUBLIC_API_URL=http://localhost:3000`). Les services métiers communiquent sur le réseau Docker interne.

---

## Arborescence complète

```
novacampus_alliance/
│
├── .github/
│   └── workflows/
│       └── deploy.yml                 # CD — déploiement VPS via SSH
│
├── docs/
│   ├── architecture-soa.md            # Diagrammes Mermaid, flux SOA
│   ├── database-schema.md             # ERD, tables PostgreSQL
│   └── project-structure.md           # Ce fichier
│
├── prisma/                            # ◄ Schéma partagé par les services NestJS
│   ├── schema.prisma                  # 14 modèles (Campus, Student, Payment…)
│   └── migrations/
│       └── 20260607202856_init/
│           └── migration.sql
│
├── frontend/                          # ◄ Couche Présentation (Next.js 14)
│   ├── Dockerfile
│   ├── .env.example
│   ├── next.config.mjs                # output: 'standalone' pour Docker
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── middleware.ts              # Gateway IHM — JWT, protection routes par rôle
│       ├── lib/
│       │   └── auth.ts                # Rôles, cookie, chemins portails
│       ├── components/
│       │   └── portal-layout.tsx
│       └── app/
│           ├── layout.tsx
│           ├── page.tsx
│           ├── login/page.tsx
│           ├── unauthorized/page.tsx
│           ├── etudiant/page.tsx      # Portail Étudiant (placeholder)
│           ├── enseignant/page.tsx    # Portail Enseignant (placeholder)
│           ├── admin/page.tsx         # Portail Administration (placeholder)
│           ├── direction/page.tsx     # Dashboard Direction (placeholder)
│           └── api/
│               └── auth/
│                   ├── login/route.ts # BFF — cookie httpOnly + proxy gateway
│                   └── logout/route.ts
│
├── services/
│   │
│   ├── README.md                      # Guide démarrage SOA local
│   │
│   ├── gateway/                       # ◄ API Gateway (NestJS, port 3001)
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.ts                # Bootstrap + reverse proxy HTTP
│   │       ├── app.module.ts
│   │       ├── app.controller.ts      # GET /health
│   │       └── proxy/
│   │           └── proxy.config.ts    # Routage /api/* → services métiers
│   │
│   ├── academic-service/              # ◄ Svc Académique (NestJS, port 3002)
│   │   ├── Dockerfile
│   │   ├── docker-entrypoint.sh       # prisma migrate deploy au démarrage
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── prisma/
│   │   │   └── seed.ts                # Utilisateurs de test par rôle
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── auth/                  # ✅ JWT login, logout, /me, guards, Redis blacklist
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── dto/login.dto.ts
│   │       │   ├── guards/
│   │       │   ├── strategies/jwt.strategy.ts
│   │       │   ├── decorators/
│   │       │   └── utils/
│   │       ├── campus/                # ✅ CRUD campus multi-campus
│   │       │   ├── campus.module.ts
│   │       │   ├── campus.controller.ts
│   │       │   ├── campus.service.ts
│   │       │   └── dto/
│   │       ├── programs/              # ✅ CRUD programmes académiques par campus
│   │       ├── instructors/           # 🔲 À faire — enseignants
│   │       ├── students/              # 🔲 À faire — étudiants
│   │       ├── courses/               # 🔲 À faire — cours
│   │       ├── rooms/                 # 🔲 À faire — salles et bâtiments
│   │       ├── schedules/             # 🔲 À faire — plannings / EDT
│   │       ├── enrollments/           # 🔲 À faire — inscriptions
│   │       ├── grades/                # 🔲 À faire — notes et absences
│   │       ├── conflicts/             # 🔲 À faire — détection conflits salles
│   │       ├── prisma/                # PrismaModule global
│   │       └── redis/                 # Redis — blacklist JWT logout
│   │
│   ├── billing-service/               # ◄ Svc Facturation (NestJS, port 3003)
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── payments/              # ✅ Squelette GET /api/payments
│   │       │   ├── payments.module.ts
│   │       │   ├── payments.controller.ts
│   │       │   └── payments.service.ts
│   │       ├── invoices/              # 🔲 À faire — génération factures
│   │       ├── schedules-billing/     # 🔲 À faire — échéanciers
│   │       └── prisma/
│   │
│   └── notification-service/          # ◄ Svc Notification (NestJS, port 3004)
│       ├── Dockerfile
│       ├── .env.example
│       ├── package.json
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── notifications/         # ✅ Squelette GET /api/notifications
│           │   ├── notifications.module.ts
│           │   ├── notifications.controller.ts
│           │   └── notifications.service.ts
│           ├── email/                 # 🔲 À faire — provider email (Resend/Nodemailer)
│           ├── push/                  # 🔲 À faire — notifications push
│           └── prisma/
│
├── ai-service/                        # ◄ Svc IA (FastAPI, port 8000)
│   ├── Dockerfile
│   ├── .env.example
│   ├── requirements.txt
│   ├── main.py                        # ✅ GET /health
│   └── app/
│       ├── core/
│       │   └── config.py              # Pydantic Settings
│       └── api/
│           └── v1/
│               └── router.py          # ✅ GET /api/v1/ping — 🔲 relances LLM
│
├── docker/
│   └── .gitkeep
│
├── scripts/                           # Utilitaires GitHub (issues, milestones)
│   ├── create_issues.py
│   └── create_issues.ps1
│
├── docker-compose.yml                 # Postgres, MongoDB, Redis + 6 services app
├── .env.example                       # Variables Docker Compose
├── .dockerignore
├── deploy.sh
└── README.md
```

**Légende :** ✅ implémenté · 🔲 à développer

---

## Mapping service → domaine métier

| Service | Dossier | Port | Modules / responsabilités |
|---|---|---|---|
| **Gateway** | `services/gateway/` | 3001 | Routage HTTP, santé gateway |
| **Académique** | `services/academic-service/` | 3002 | Auth, campus, programmes, cours, EDT, notes, inscriptions |
| **Facturation** | `services/billing-service/` | 3003 | Paiements, factures, échéanciers, relances manuelles |
| **Notification** | `services/notification-service/` | 3004 | Alertes in-app, emails, SMS, push |
| **IA** | `ai-service/` | 8000 | Agent résolution conflits EDT (LangChain / Groq) — [guide](./m7-agent-conflits-edt.md) |
| **Présentation** | `frontend/` | 3000 | Portails IHM, middleware JWT, BFF auth |

---

## Routage gateway → services

| Préfixe HTTP public | Service cible |
|---|---|
| `GET/POST /api/auth/*` | academic-service |
| `GET/POST/PUT /api/campus/*` | academic-service |
| `GET/POST/PUT /api/programs/*` | academic-service |
| `GET /api/payments` | billing-service |
| `GET /api/notifications` | notification-service |
| `GET/POST /api/v1/*` | ai-service |
| `GET /health` | gateway (direct) |

---

## Fichiers d'environnement

| Fichier | Usage |
|---|---|
| `.env` (racine) | Docker Compose — **ne pas committer** |
| `.env.example` (racine) | Template Docker Compose |
| `frontend/.env.example` | `NEXT_PUBLIC_API_URL`, `JWT_SECRET` |
| `services/gateway/.env.example` | URLs des services internes |
| `services/academic-service/.env.example` | `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL` |
| `services/billing-service/.env.example` | `DATABASE_URL` |
| `services/notification-service/.env.example` | `DATABASE_URL` |
| `ai-service/.env.example` | `OPENAI_API_KEY`, `MONGODB_URL` |

---

## Conventions de développement

1. **Nouveau module métier académique** → `services/academic-service/src/<module>/`
2. **Nouveau module facturation** → `services/billing-service/src/<module>/`
3. **Nouvelle route publique** → enregistrer le préfixe dans `services/gateway/src/proxy/proxy.config.ts`
4. **Migration BDD** → `prisma/migrations/` (partagée, exécutée par academic-service au démarrage Docker)
5. **Seed données test** → `services/academic-service/prisma/seed.ts`
6. **Pas de dossier `backend/`** — architecture 100 % SOA via `services/`

---

## Branches Git (convention)

```
feature/<issue-id>-<description>   → dev   → main   → production
```

Exemples :
- `10-module-campus-crud-et-gestion-multi-campus`
- `refactor/architecture-soa`
