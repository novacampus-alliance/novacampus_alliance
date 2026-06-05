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
        subgraph NEST["backend/ — Node.js + NestJS"]
            SA["Svc Académique<br/>Campus · Cours · EDT · Notes<br/>Inscriptions · Conflits salles"]
            SF["Svc Facturation<br/>Factures · Paiements · Échéanciers<br/>Suivi encaissements"]
            SN["Svc Notification<br/>Email · SMS · Push<br/>Alertes · Rappels"]
        end
        subgraph AI["ai-service/ — Python + FastAPI + LangChain"]
            SIA["Svc IA — Agent de Relance Financière<br/>Détection retards · Relances LLM<br/>Échéanciers · Escalade humaine"]
        end
    end

    subgraph DATA["🟩 Couche Données & Stockage"]
        direction LR
        PG[("PostgreSQL<br/>Prisma ORM<br/>Données structurées")]
        MG[("MongoDB<br/>Documents · Logs<br/>Historique relances IA")]
        RD[("Redis<br/>Sessions · Cache")]
    end

    PE & PEN & PA & PD --> GW
    GW --> SA & SF & SN & SIA

    SA --> PG
    SF --> PG & MG
    SN --> MG & RD
    SIA --> MG & RD
    SF -.->|HTTP interne| SIA
    SN -.->|événements| SIA
    SA -.->|données étudiants| SIA
```

---

## Flux des requêtes

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant F as Frontend (Next.js)
    participant G as API Gateway (Middleware)
    participant B as Backend (NestJS)
    participant A as AI Service (FastAPI)
    participant P as PostgreSQL
    participant M as MongoDB

    U->>F: Action (ex: consulter factures)
    F->>G: Requête HTTP + JWT
    G->>G: Vérification JWT & rôle
    G->>B: Routage vers service métier

    alt Service Académique / Facturation
        B->>P: Lecture / écriture Prisma
        P-->>B: Données
        B-->>F: Réponse JSON
    end

    alt Agent IA — Relance impayés
        B->>A: POST /api/v1/relances/generer
        A->>P: Récupération PAYMENTS (via NestJS)
        A->>M: Historique relances précédentes
        A->>A: Génération relance LLM (LangChain)
        A-->>B: Brouillon personnalisé
        B-->>F: Relance en attente de validation
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

    subgraph IA["Svc IA — Relance Financière"]
        I1[Surveillance PAYMENTS]
        I2[Détection retards]
        I3[Relances LLM personnalisées]
        I4[Proposition échéanciers]
        I5[Escalade humaine]
    end

    FACTURATION --> IA
    IA --> NOTIFICATION
    ACADEMIQUE --> FACTURATION
```

---

## Mapping code ↔ architecture

| Couche | Dossier | Technologie |
|---|---|---|
| Présentation | `frontend/` | Next.js 14, shadcn/ui, Tailwind |
| Gateway | `frontend/middleware.ts` | JWT, routage, protection routes |
| Svc Académique | `backend/src/` (modules) | NestJS, Prisma |
| Svc Facturation | `backend/src/` (modules) | NestJS, Prisma, MongoDB |
| Svc Notification | `backend/src/` (modules) | NestJS, MongoDB, Redis |
| Svc IA | `ai-service/` | FastAPI, LangChain, OpenAI |
| Données relationnelles | `prisma/` | PostgreSQL + Prisma ORM |
| Infrastructure | `docker-compose.yml` | Docker Compose, VPS IONOS |

---

## Légende

| Couleur | Signification |
|---|---|
| 🔵 Bleu | Portails IHM (couche présentation) |
| ⚫ Gris | API Gateway / ESB |
| 🟢 Vert | Services métiers SOA |
| 🟠 Orange | Service IA (innovation) |
| 🟩 Vert clair | Couche données |
