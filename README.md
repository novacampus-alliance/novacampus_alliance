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

---

## Stack Technique

### Frontend
- **Framework** : Next.js 14 (App Router + API Routes)
- **Design System** : shadcn/ui + Tailwind CSS

### API Gateway
- **Next.js Middleware** — authentification JWT et routage des requêtes

### Backend (SOA)
- **Runtime** : Node.js + NestJS (TypeScript)
- **Architecture** : Modulaire, orientée services

### Service IA
- **Framework** : Python + FastAPI + LangChain
- **Usage** : Service isolé dédié aux fonctionnalités d'intelligence artificielle

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
├── frontend/          # Next.js — portails IHM
├── backend/           # NestJS — services métiers (SOA)
├── ai-service/        # Python / FastAPI — service IA
├── prisma/            # Schéma et migrations PostgreSQL
├── docker/            # Configuration Docker Compose
└── docs/              # Documentation technique et diagrammes
```

---

## Données

Le projet s'appuie sur une base de données réelle fournie par l'entreprise (`NOVACAMPUS_ALLIANCE_DATABASE.xlsx`). Ces données sont **confidentielles** et ne doivent pas être diffusées.
