# Novacampus Alliance ERP

> *"Shaping Tomorrow's Minds"*

Système ERP académique multi-campus conçu pour centraliser, digitaliser et piloter l'ensemble des processus de gestion d'un groupe d'enseignement supérieur privé.

---

## Contexte

Novacampus Alliance est un groupe d'enseignement supérieur privé en pleine expansion. En 6 ans, le nombre d'étudiants a doublé, deux nouveaux campus ont été ouverts et les formations se sont diversifiées — mais le système d'information n'a jamais été repensé globalement.

Les principaux dysfonctionnements identifiés :

- Conflits de salles fréquents
- Centralisation tardive des notes
- Retards de facturation et relances semi-manuelles
- Absence de reporting consolidé inter-campus
- Multiplication d'outils non interconnectés

La direction a pris la décision d'unifier le système d'information via un ERP académique centralisé.

---

## Mission

Concevoir un ERP académique capable de :

- Centraliser la gestion multi-campus
- Digitaliser les processus académiques et administratifs
- Garantir la traçabilité académique complète
- Produire des indicateurs stratégiques fiables
- Intégrer un agent IA au sein d'un processus métier clé

---

## Utilisateurs & Besoins

| Rôle | Besoins principaux |
|---|---|
| **Étudiant** | Emploi du temps, notes, absences, notifications, historique académique |
| **Enseignant** | Gestion des cours, saisie notes/absences, affectation salles, historique classes |
| **Administration** | Inscriptions, dossiers étudiants, paiements, gestion plannings & salles |
| **Direction** | KPIs consolidés, rapports stratégiques, analyse par campus et filière |

---

## Architecture

L'application suit une architecture **SOA (Service-Oriented Architecture)** organisée en quatre couches :

- **Couche présentation (IHM)** — Portails Étudiant, Enseignant, Administration et Dashboard Direction
- **Couche routage & sécurité** — API Gateway / ESB avec authentification JWT et chiffrement TLS
- **Couche services métiers** — Services académique, facturation, IA et notification
- **Couche données** — Base relationnelle PostgreSQL + NoSQL (MongoDB, Redis)

- Diagrammes SOA : [docs/architecture-soa.md](docs/architecture-soa.md)
- Structure des fichiers : [docs/project-structure.md](docs/project-structure.md)

---

## Stack Technique

### Frontend
- **Framework** : Next.js 14 (App Router + API Routes)
- **Design System** : shadcn/ui + Tailwind CSS

### API Gateway
- **Next.js Middleware** — authentification JWT et routage des requêtes

### Backend (SOA)
- **API Gateway** : `services/gateway/` — point d'entrée unique (port 3001)
- **Svc Académique** : `services/academic-service/` — auth, campus
- **Svc Facturation** : `services/billing-service/` — paiements
- **Svc Notification** : `services/notification-service/` — alertes

### Service IA
- **Framework** : Python + FastAPI + LangChain
- **Agent M7** : résolution des conflits EDT (salles + double réservation enseignant)
- **Doc** : [docs/m7-agent-conflits-edt.md](docs/m7-agent-conflits-edt.md)
- **Tests** : collection Postman `postman/m7-agent-conflits-edt.postman_collection.json`

### Persistance
- **Relationnel** : PostgreSQL + Prisma ORM
- **NoSQL / Cache** : MongoDB Atlas + Redis

### Infrastructure
- **Orchestration** : Docker Compose
- **Hébergement** : VPS IONOS (auto-hébergé)

---

## Structure du projet

```
novacampus_alliance/
├── frontend/                    # Next.js — portails IHM
├── services/
│   ├── gateway/                 # API Gateway — point d'entrée (port 3001)
│   ├── academic-service/        # Svc Académique — auth, campus
│   ├── billing-service/         # Svc Facturation — paiements
│   └── notification-service/    # Svc Notification — alertes
├── ai-service/                  # Python / FastAPI — agent IA
├── prisma/                      # Schéma et migrations PostgreSQL
├── docker-compose.yml           # Orchestration SOA
└── docs/                        # Documentation technique
```

---

## Données

Le projet s'appuie sur une base de données réelle fournie par l'entreprise (`NOVACAMPUS_ALLIANCE_DATABASE.xlsx`). Ces données sont **confidentielles** et ne doivent pas être diffusées.

--- 

## Workflow
1. **Analyse des besoins** — Compréhension approfondie du contexte et des besoins métier
2. **Conception de l'architecture** — Définition de l'architecture SOA et des interactions entre services
3. **Développement itératif** — Mise en place des services métiers, intégration de l'agent IA conflits EDT (M7), développement des portails IHM
4. **Tests & validation** — Tests unitaires, d'intégration et de performance
5. **Documentation** — Rédaction de la documentation technique et des diagrammes d'architecture

---

## Agent IA — Conflits EDT (M7)

L'agent IA aide l'administration à **proposer des solutions** aux conflits d'emploi du temps détectés par `academic-service` :

| Type | Détection | Suggestion typique |
|------|-----------|-------------------|
| `room` | Même salle, même créneau | `change_room` vers une salle libre |
| `instructor` | Même enseignant, même créneau | `change_instructor` ou `reschedule` |

**Démarrage rapide (Docker) :**

```bash
docker compose up -d
cd services/academic-service && npm run prisma:seed:m7-conflict
```

Puis `POST /api/v1/conflicts/suggest/auto` avec `{ "campus_id": "..." }` (JWT admin).

Voir [docs/m7-agent-conflits-edt.md](docs/m7-agent-conflits-edt.md) et [docs/issue-17-conflicts.md](docs/issue-17-conflicts.md) pour la détection côté academic-service.