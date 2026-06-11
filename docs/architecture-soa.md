# Architecture SOA — Novacampus Alliance

Architecture orientée services (SOA) en quatre couches, déployée via Docker Compose sur VPS IONOS.

---

## Vue d'ensemble

```mermaid
flowchart TB
    subgraph PRESENTATION["🔵 Couche Présentation — IHM (Next.js 14)"]
        direction LR
        PE["Portail Étudiant<br/>EDT · Notes · Absences"]
        PEN["Portail Enseignant<br/>Cours · Saisie · Planning"]
        PA["Portail Administration<br/>Inscriptions · Conflits · Paiements"]
        PD["Dashboard Direction<br/>KPIs · Rapports · Simulations"]
    end

    subgraph GATEWAY["⚫ Couche Routage & Sécurité"]
        GW["API Gateway / ESB<br/>Next.js Middleware<br/>JWT · TLS · Routage"]
    end

    subgraph SERVICES["🟢 Couche Services Métiers — NestJS (SOA)"]
        direction TB
        GW2["API Gateway<br/>services/gateway :3001"]
        SA["Svc Académique<br/>academic-service :3002"]
        SF["Svc Facturation<br/>billing-service :3003"]
        SN["Svc Notification<br/>notification-service :3004"]
        subgraph AI["ai-service/ — Python + FastAPI + LangChain"]
            SIA["Svc IA — Agent Résolution Conflits EDT<br/>Orchestration · Suggestions · Explication LLM"]
        end
    end

    subgraph DATA["🟩 Couche Données & Stockage"]
        direction LR
        PG[("PostgreSQL<br/>Prisma ORM<br/>Données structurées")]
        MG[("MongoDB<br/>Documents · Logs<br/>Historique IA")]
        RD[("Redis<br/>Sessions · Cache")]
    end

    PE & PEN & PA & PD --> GW
    GW --> GW2
    GW2 --> SA & SF & SN & SIA

    SA --> PG
    SF --> PG & MG
    SN --> MG & RD
    SIA --> MG & RD
    SIA -.->|orchestration HTTP| GW2
    GW2 -.-> SA
```

---

## Flux des requêtes

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant F as Frontend (Next.js)
    participant G as API Gateway (Middleware)
    participant G2 as Gateway (NestJS)
    participant B as Svc Métier (NestJS)
    participant A as AI Service (FastAPI)
    participant P as PostgreSQL
    participant M as MongoDB

    U->>F: Action (ex: consulter factures)
    F->>G: Requête HTTP + JWT
    G->>G: Vérification JWT & rôle (middleware IHM)
    G->>G2: Requête HTTP
    G2->>B: Routage vers service métier

    alt Service Académique / Facturation
        B->>P: Lecture / écriture Prisma
        P-->>B: Données
        B-->>F: Réponse JSON
    end

    alt Agent IA — Résolution conflits EDT
        F->>G2: POST /api/v1/conflicts/suggest/auto + JWT
        G2->>A: Routage ai-service
        A->>G2: GET /api/schedules/conflicts
        G2->>B: academic-service
        B->>P: Plannings · salles
        A->>G2: GET /api/rooms/available
        G2->>B: academic-service
        A->>A: Règles + explication LLM (LangChain / Groq)
        A-->>F: Suggestions structurées + texte
    end

    F-->>U: Affichage
```

---

## Services métiers — détail

```mermaid
flowchart LR
    subgraph ACADEMIQUE["Svc Académique"]
        A1[Campus & Programmes]
        A2[Étudiants & Enseignants]
        A3[Cours & Salles]
        A4[Plannings & EDT]
        A5[Notes & Absences]
        A6[Détection conflits]
    end

    subgraph FACTURATION["Svc Facturation"]
        F1[Génération factures]
        F2[Suivi paiements]
        F3[Échéanciers]
        F4[Relances manuelles]
    end

    subgraph NOTIFICATION["Svc Notification"]
        N1[Notifications in-app]
        N2[Emails]
        N3[Alertes EDT]
        N4[Rappels deadlines]
    end

    subgraph IA["Svc IA — Résolution Conflits EDT"]
        I1[Orchestration gateway]
        I2[Moteur de règles]
        I3[Suggestions change_room / reschedule]
        I4[Explication LLM Groq]
        I5[Fallback template]
    end

    ACADEMIQUE --> IA
    IA -.->|HTTP| ACADEMIQUE
```

---

## Mapping code ↔ architecture (implémentation SOA)

| Couche | Dossier | Port | Technologie |
|---|---|---|---|
| Présentation | `frontend/` | 3000 | Next.js 14, middleware JWT IHM |
| **API Gateway** | `services/gateway/` | **3001** | NestJS, http-proxy-middleware |
| Svc Académique | `services/academic-service/` | 3002 | NestJS, Prisma, Redis (auth, campus) |
| Svc Facturation | `services/billing-service/` | 3003 | NestJS, Prisma (payments) |
| Svc Notification | `services/notification-service/` | 3004 | NestJS, Prisma (notifications) |
| Svc IA | `ai-service/` | 8000 | FastAPI, LangChain, Groq — [guide M7](./m7-agent-conflits-edt.md) |
| Données relationnelles | `prisma/` | — | PostgreSQL + Prisma ORM |
| Infrastructure | `docker-compose.yml` | — | Docker Compose, VPS IONOS |

### Flux SOA actuel

```mermaid
flowchart LR
    F[frontend :3000] --> G[gateway :3001]
    G --> A[academic-service :3002]
    G --> B[billing-service :3003]
    G --> N[notification-service :3004]
    G --> AI[ai-service :8000]
    A --> PG[(PostgreSQL)]
    B --> PG
    N --> PG
    A --> RD[(Redis)]
    AI --> MG[(MongoDB)]
```

Le frontend appelle **uniquement le gateway** (`NEXT_PUBLIC_API_URL`).  
Les services métiers ne sont pas exposés publiquement (réseau Docker interne).

**Arborescence complète des fichiers :** [project-structure.md](./project-structure.md)

---

## Légende

| Couleur | Signification |
|---|---|
| 🔵 Bleu | Portails IHM (couche présentation) |
| ⚫ Gris | API Gateway / ESB |
| 🟢 Vert | Services métiers SOA |
| 🟠 Orange | Service IA (innovation) |
| 🟩 Vert clair | Couche données |
