# Issue #19 — Notes & Absences

> Guide d'utilisation du module **Notes et Absences** (saisie et consultation)  
> Branche : `19-module-notes-et-absences-saisie-et-consultation`  
> PR : [#81](https://github.com/novacampus-alliance/novacampus_alliance/pull/81)

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture et dépendances](#architecture-et-dépendances)
3. [Démarrage local](#démarrage-local)
4. [Authentification](#authentification)
5. [Modèle de données](#modèle-de-données)
6. [Endpoints API](#endpoints-api)
7. [Parcours métier complet](#parcours-métier-complet)
8. [Guide Postman](#guide-postman)
9. [Exemples cURL](#exemples-curl)
10. [Règles métier et validations](#règles-métier-et-validations)
11. [Codes d'erreur](#codes-derreur)
12. [Dépannage](#dépannage)

---

## Vue d'ensemble

Le module **Notes & Absences** permet de :

- **Saisir** la note finale d'une inscription (`final_grade` sur une `enrollment`)
- **Saisir** le taux de présence d'une inscription (`attendance_rate`)
- **Consulter** l'historique des notes d'un étudiant
- **Consulter** l'historique des absences d'un étudiant (dérivé du taux de présence)

Les notes et la présence sont stockées **au niveau de l'inscription** (relation étudiant ↔ cours), pas directement sur l'étudiant. La consultation se fait **par étudiant** via des routes dédiées.

### Rôles autorisés

| Action | ADMIN | DIRECTION | INSTRUCTOR | STUDENT |
|--------|:-----:|:---------:|:----------:|:-------:|
| Saisir une note | ✅ | ✅ | ✅ | ❌ |
| Saisir une présence | ✅ | ✅ | ✅ | ❌ |
| Consulter notes d'un étudiant | ✅ | ✅ | ✅ | ✅ |
| Consulter absences d'un étudiant | ✅ | ✅ | ✅ | ✅ |
| Créer une inscription (prérequis) | ✅ | ✅ | ❌ | ❌ |

---

## Architecture et dépendances

### Services impliqués

```
Client (Postman / Frontend)
        │
        ▼
  Gateway :3001          ← point d'entrée public
  /api/students/...
  /api/enrollments/...
        │
        ▼
  Academic Service :3002 ← logique métier Notes & Absences
        │
        ▼
  PostgreSQL (table enrollments)
```

| Service | Port | Rôle |
|---------|------|------|
| **Gateway** | `3001` | Proxy HTTP, JWT, routage vers les microservices |
| **Academic Service** | `3002` | Auth, étudiants, cours, inscriptions, notes, absences |
| **PostgreSQL** | `5432` | Persistance (`enrollments.final_grade`, `enrollments.attendance_rate`) |

> Toujours appeler l'API via le **gateway** : `http://localhost:3001/api/...`  
> Ne pas appeler directement le port `3002` depuis Postman sauf pour du debug interne.

### Issues mergées sur la branche #19

La branche #19 inclut les modules nécessaires pour tester de bout en bout :

| Issue | Module | Utilité pour #19 |
|-------|--------|------------------|
| **#13** | Étudiants | Créer/consulter un étudiant |
| **#14** | Cours + Enseignants | Créer un cours rattaché à un programme |
| **#18** | Inscriptions | Lier un étudiant à un cours (`enrollment_id`) |
| **#19** | Notes & Absences | Saisie et consultation |

Sans inscription préalable (`enrollment`), il est impossible de saisir une note ou une présence.

### Fichiers source principaux

```
services/academic-service/src/
├── enrollments/
│   ├── enrollments.controller.ts   # PUT /:id/note, PUT /:id/presence
│   ├── enrollments.service.ts
│   └── dto/
│       ├── update-enrollment-note.dto.ts
│       └── update-enrollment-presence.dto.ts
└── students/
    ├── students.controller.ts      # GET /:id/notes, GET /:id/absences
    └── students.service.ts
```

Collection Postman : `docs/postman/issue-19-notes-absences.postman_collection.json`

---

## Démarrage local

### Prérequis

- Node.js 18+
- PostgreSQL accessible (Docker ou local)
- Fichiers `.env` configurés dans `services/gateway/` et `services/academic-service/`

### Option A — Docker Compose (recommandé)

```bash
# À la racine du monorepo
docker compose up -d postgres redis
```

Puis lancer les services NestJS :

```bash
# Terminal 1 — Academic Service (port 3002)
cd services/academic-service
npm install
npm run start:dev

# Terminal 2 — Gateway (port 3001)
cd services/gateway
npm install
npm run start:dev
```

### Option B — Vérification rapide

```bash
# Gateway opérationnel
curl http://localhost:3001/api/campus

# Academic Service direct (debug uniquement)
curl http://localhost:3002/api/campus
```

### Compte de test

| Champ | Valeur |
|-------|--------|
| Email | `admin@novacampus.fr` |
| Mot de passe | `Novacampus2026!` |
| Rôle | `ADMIN` |

---

## Authentification

Toutes les routes du module exigent un **JWT Bearer token**.

### Obtenir un token

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@novacampus.fr",
  "password": "Novacampus2026!"
}
```

**Réponse (200)** :

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "...",
    "email": "admin@novacampus.fr",
    "role": "ADMIN"
  }
}
```

Utiliser ensuite l'en-tête sur chaque requête :

```http
Authorization: Bearer <access_token>
```

---

## Modèle de données

Les champs notes et absences vivent sur la table **`enrollments`** :

| Champ | Type | Description |
|-------|------|-------------|
| `enrollment_id` | `string` (cuid) | Identifiant de l'inscription |
| `student_id` | `string` | Étudiant inscrit |
| `course_id` | `string` | Cours concerné |
| `academic_year` | `string` | Ex. `2025-2026` |
| `semester` | `int` | Semestre (optionnel) |
| `status` | `string` | `inscrit`, `valide`, `abandonne`, `echec` |
| `final_grade` | `decimal(4,2)` | Note finale sur 20 (nullable) |
| `attendance_rate` | `decimal(4,2)` | Taux de présence en % (nullable) |
| `enrollment_date` | `date` | Date d'inscription |

### Calcul du taux d'absence

Lors de `GET /api/students/:id/absences`, le service calcule :

```
absence_rate = 100 - attendance_rate
```

Exemple : `attendance_rate = 92.5` → `absence_rate = 7.5`

Seules les inscriptions avec une valeur **non nulle** apparaissent :
- Notes : `final_grade IS NOT NULL`
- Absences : `attendance_rate IS NOT NULL`

---

## Endpoints API

Base URL : `http://localhost:3001`

### Issue #19 — Endpoints principaux

#### 1. Saisir une note

```http
PUT /api/enrollments/:enrollment_id/note
Content-Type: application/json
Authorization: Bearer <token>
```

**Corps** :

```json
{
  "final_grade": 14.5
}
```

| Champ | Type | Contraintes |
|-------|------|-------------|
| `final_grade` | `number` | Entre **0** et **20**, max 2 décimales |

**Réponse (200)** — inscription mise à jour avec relations `student` et `course` :

```json
{
  "enrollment_id": "clx...",
  "student_id": "clx...",
  "course_id": "clx...",
  "academic_year": "2025-2026",
  "semester": 1,
  "status": "inscrit",
  "final_grade": "14.50",
  "attendance_rate": null,
  "enrollment_date": "2025-09-01T00:00:00.000Z",
  "student": { "student_id": "...", "first_name": "Emma", "last_name": "Petit", "email": "..." },
  "course": { "course_id": "...", "course_name": "Mathematiques", "course_code": "NOT-..." }
}
```

---

#### 2. Saisir une présence

```http
PUT /api/enrollments/:enrollment_id/presence
Content-Type: application/json
Authorization: Bearer <token>
```

**Corps** :

```json
{
  "attendance_rate": 92.5
}
```

| Champ | Type | Contraintes |
|-------|------|-------------|
| `attendance_rate` | `number` | Entre **0** et **100**, max 2 décimales |

**Réponse (200)** — même structure que la saisie de note, avec `attendance_rate` renseigné.

---

#### 3. Consulter les notes d'un étudiant

```http
GET /api/students/:student_id/notes
Authorization: Bearer <token>
```

**Réponse (200)** — tableau des inscriptions notées, triées par année académique décroissante :

```json
[
  {
    "enrollment_id": "clx...",
    "final_grade": "14.50",
    "academic_year": "2025-2026",
    "semester": 1,
    "course": {
      "course_id": "clx...",
      "course_name": "Mathematiques",
      "course_code": "NOT-1234567890"
    }
  }
]
```

> Retourne `[]` si aucune note n'a encore été saisie.

---

#### 4. Consulter les absences d'un étudiant

```http
GET /api/students/:student_id/absences
Authorization: Bearer <token>
```

**Réponse (200)** :

```json
[
  {
    "enrollment_id": "clx...",
    "attendance_rate": "92.50",
    "absence_rate": 7.5,
    "academic_year": "2025-2026",
    "semester": 1,
    "course": {
      "course_id": "clx...",
      "course_name": "Mathematiques",
      "course_code": "NOT-1234567890"
    }
  }
]
```

> Retourne `[]` si aucune présence n'a encore été saisie.

---

### Endpoints prérequis (issues #13, #14, #18)

Utilisés pour préparer les données de test :

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/campus` | Lister les campus |
| `GET` | `/api/programs` | Lister les programmes |
| `POST` | `/api/students` | Créer un étudiant |
| `GET` | `/api/instructors` | Lister les enseignants |
| `POST` | `/api/courses` | Créer un cours |
| `POST` | `/api/enrollments` | Inscrire un étudiant à un cours |
| `GET` | `/api/enrollments/:id` | Détail d'une inscription |

---

## Parcours métier complet

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Campus +   │────▶│   Étudiant   │────▶│    Cours    │
│  Programme  │     │   (#13)      │     │   (#14)     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                    │
                           └────────┬───────────┘
                                    ▼
                           ┌─────────────────┐
                           │  Inscription    │
                           │     (#18)       │
                           │ enrollment_id   │
                           └────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            PUT .../note    PUT .../presence   GET .../notes
            (saisie note)   (saisie présence)  GET .../absences
                    │               │          (consultation #19)
                    └───────────────┴───────────┘
```

### Étapes détaillées

1. **Authentification** — obtenir un JWT admin ou enseignant.
2. **Récupérer** un `campus_id` et un `program_id` existants.
3. **Créer un étudiant** rattaché au campus et au programme.
4. **Récupérer** un `instructor_id` et **créer un cours** sur le même programme.
5. **Inscrire l'étudiant** au cours → récupérer `enrollment_id`.
6. **Saisir la note** via `PUT /api/enrollments/{enrollment_id}/note`.
7. **Saisir la présence** via `PUT /api/enrollments/{enrollment_id}/presence`.
8. **Consulter** via `GET /api/students/{student_id}/notes` et `/absences`.

---

## Guide Postman

### Import

1. Ouvrir Postman → **Import**
2. Sélectionner `docs/postman/issue-19-notes-absences.postman_collection.json`
3. Vérifier la variable de collection `base_url` = `http://localhost:3001`

### Ordre d'exécution

Exécuter les dossiers **dans l'ordre** (les scripts Postman remplissent les variables automatiquement) :

| Dossier | Contenu |
|---------|---------|
| **0 — Auth** | Login → stocke `token` |
| **1 — Prérequis + inscription** | Campus, programme, étudiant, cours, inscription |
| **2 — Notes & Absences (#19)** | Saisie note, saisie présence, consultation |

### Variables de collection

| Variable | Remplie par | Utilisée pour |
|----------|-------------|---------------|
| `token` | Login | Auth Bearer |
| `campus_id` | Liste campus | Création étudiant |
| `program_id` | Liste programmes | Étudiant + cours |
| `student_id` | POST étudiant | Inscription + consultation |
| `instructor_id` | Liste enseignants | Création cours |
| `course_id` | POST cours | Inscription |
| `enrollment_id` | POST inscription | Saisie note/présence |
| `student_email` | Script prerequest | Email unique (`notes.{timestamp}@...`) |
| `course_code` | Script prerequest | Code cours unique (`NOT-{timestamp}`) |

### Exécution en Collection Runner

1. Clic droit sur la collection → **Run collection**
2. Laisser l'ordre par défaut
3. Vérifier que toutes les requêtes passent en **200** ou **201**

---

## Exemples cURL

Remplacez `$TOKEN`, `$STUDENT_ID` et `$ENROLLMENT_ID` par vos valeurs.

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@novacampus.fr","password":"Novacampus2026!"}' \
  | jq -r '.access_token')

# 2. Saisir une note
curl -X PUT "http://localhost:3001/api/enrollments/$ENROLLMENT_ID/note" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"final_grade": 14.5}'

# 3. Saisir une présence
curl -X PUT "http://localhost:3001/api/enrollments/$ENROLLMENT_ID/presence" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"attendance_rate": 92.5}'

# 4. Consulter les notes
curl "http://localhost:3001/api/students/$STUDENT_ID/notes" \
  -H "Authorization: Bearer $TOKEN"

# 5. Consulter les absences
curl "http://localhost:3001/api/students/$STUDENT_ID/absences" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Règles métier et validations

### Saisie de note

- `final_grade` obligatoire
- Plage : **0 à 20** (système français sur 20)
- Maximum **2 décimales** (ex. `14.5`, `16.75`)
- Met à jour uniquement le champ `final_grade` de l'inscription ciblée
- Peut être appelé plusieurs fois (écrase la note précédente)

### Saisie de présence

- `attendance_rate` obligatoire
- Plage : **0 à 100** (pourcentage de présence)
- Maximum **2 décimales**
- Met à jour uniquement `attendance_rate`
- L'absence affichée est **calculée** : `100 - attendance_rate`

### Consultation

- L'étudiant doit exister (`404` sinon)
- Seules les inscriptions **avec donnée saisie** apparaissent :
  - Notes : uniquement si `final_grade` renseigné
  - Absences : uniquement si `attendance_rate` renseigné
- Tri par `academic_year` décroissant

### Inscription (prérequis #18)

- L'étudiant et le cours doivent appartenir au **même programme**
- Capacité de salle vérifiée si le cours a une salle assignée
- Contrainte d'unicité : un étudiant ne peut être inscrit qu'**une fois** par cours et année académique

---

## Codes d'erreur

| Code | Situation | Exemple |
|------|-----------|---------|
| **200** | Saisie ou consultation réussie | Note mise à jour |
| **201** | Création (inscription, étudiant) | POST enrollment |
| **400** | Corps invalide (validation DTO) | `final_grade: 25` ou champ manquant |
| **401** | Token absent ou expiré | Pas d'en-tête `Authorization` |
| **403** | Rôle insuffisant | Étudiant qui tente de saisir une note |
| **404** | Ressource introuvable | `enrollment_id` ou `student_id` inexistant |
| **409** | Conflit métier | Email étudiant déjà utilisé (#13) |
| **422** | Règle métier non respectée | Cours hors programme de l'étudiant, salle pleine |

### Exemples de réponses d'erreur

**Note hors plage (400)** :

```json
{
  "statusCode": 400,
  "message": ["final_grade must not be greater than 20"],
  "error": "Bad Request"
}
```

**Inscription introuvable (404)** :

```json
{
  "statusCode": 404,
  "message": "Inscription introuvable : clx123...",
  "error": "Not Found"
}
```

---

## Dépannage

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| `404` sur `/api/students/.../notes` | Gateway pas redémarré après merge | Relancer `gateway` et `academic-service` sur la branche #19 |
| `401 Unauthorized` | Token expiré ou absent | Relancer **Login** dans Postman |
| `[]` sur GET notes/absences | Aucune saisie effectuée | Exécuter d'abord PUT note et/ou PUT presence |
| `422` à l'inscription | Programme étudiant ≠ programme cours | Vérifier que `program_id` est identique |
| `409` à la création étudiant | Email déjà en base | Utiliser un email unique (la collection Postman le génère automatiquement) |
| `EADDRINUSE :3001` | Port gateway occupé | Arrêter l'ancien processus ou `docker stop novacampus_backend` |
| Erreur proxy 502 | Academic service arrêté | Vérifier que le service sur le port **3002** tourne |

### Vérifier la branche active

```bash
git branch --show-current
# Attendu : 19-module-notes-et-absences-saisie-et-consultation
```

### Vérifier les routes gateway

Le fichier `services/gateway/src/proxy/proxy.config.ts` doit exposer au minimum :

- `/api/auth`
- `/api/campus`
- `/api/programs`
- `/api/students`
- `/api/instructors`
- `/api/courses`
- `/api/enrollments`

---

## Références

- Collection Postman : [`docs/postman/issue-19-notes-absences.postman_collection.json`](./postman/issue-19-notes-absences.postman_collection.json)
- Schéma BDD : [`docs/database-schema.md`](./database-schema.md)
- Architecture SOA : [`docs/architecture-soa.md`](./architecture-soa.md)
- PR #81 : [feat: module Notes et Absences (#19)](https://github.com/novacampus-alliance/novacampus_alliance/pull/81)
