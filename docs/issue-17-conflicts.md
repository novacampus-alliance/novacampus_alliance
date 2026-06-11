# Issue #17 — Détection des conflits EDT

> Conflits de **salle** et double réservation **enseignant**  
> Collection : `postman/issue-17-conflicts.postman_collection.json`

---

## Comportement API

| Type | Détection `GET /conflicts` | Blocage `POST /schedules` |
|------|---------------------------|---------------------------|
| `room` | Même salle, même créneau | 409 + `type: room` |
| `instructor` | Même enseignant, même créneau | 409 + `type: instructor` |

Un même couple de créneaux peut produire **deux entrées** (salle + enseignant) si les deux conditions sont remplies.

---

## Important — pourquoi le 2ᵉ POST renvoie 409

L'API **refuse** l'insertion d'un créneau en conflit. Le 2ᵉ `POST` identique ne crée donc **pas** de ligne en base.

`GET /schedules/conflicts` ne liste que les conflits **déjà présents** en base (données importées, seed, incohérences historiques).

### Créer des conflits de test

```bash
cd services/academic-service
npm run prisma:seed:m7-conflict
```

Puis :

```http
GET /api/schedules/conflicts?campus_id=...
```

Réponse attendue : au moins une entrée `type: room` et `type: instructor`.

---

## Tests Postman

| Dossier | Objectif |
|---------|----------|
| `0 — Auth` | Login admin |
| `1 — Prérequis campus` | Récupère `campus_id` |
| `2 — Détection` | `GET /conflicts` (nécessite seed M7) |
| `3 — Garde API` | Vérifie le 409 sur doublon (optionnel, prérequis cours/salle) |

`base_url` = `http://localhost` (Docker + Nginx).

---

## Agent IA M7

Une fois les conflits détectés, tester l'orchestration :

→ [m7-agent-conflits-edt.md](./m7-agent-conflits-edt.md)
