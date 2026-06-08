# Services SOA — Novacampus Alliance

Architecture orientée services : chaque service métier est **déployable indépendamment**.

## Point d'entrée unique

| Service | Port | Rôle |
|---|---|---|
| **gateway** | 3001 | API Gateway — routage HTTP vers les services |
| academic-service | 3002 | Auth JWT, campus, cours (interne) |
| billing-service | 3003 | Paiements, factures (interne) |
| notification-service | 3004 | Alertes, notifications (interne) |
| ai-service | 8000 | Agent IA relance financière |

Le **frontend** et les clients externes appellent uniquement le **gateway** (`NEXT_PUBLIC_API_URL=http://localhost:3001`).

## Routage gateway

| Préfixe HTTP | Service cible |
|---|---|
| `/api/auth`, `/api/campus`, `/api/programs`, `/api` | academic-service |
| `/api/payments` | billing-service |
| `/api/notifications` | notification-service |
| `/api/v1` | ai-service |

## Démarrage local (sans Docker)

```bash
# Terminal 1 — Svc Académique
cd services/academic-service && npm install && npm run start:dev

# Terminal 2 — Svc Facturation
cd services/billing-service && npm install && npm run start:dev

# Terminal 3 — Svc Notification
cd services/notification-service && npm install && npm run start:dev

# Terminal 4 — Gateway
cd services/gateway && npm install && npm run start:dev

# Terminal 5 — Frontend
cd frontend && npm run dev
```

## Seed des données de test

```bash
cd services/academic-service
npm run prisma:seed
```

Comptes créés : `admin@novacampus.fr`, `etudiant@novacampus.fr`, etc. — mot de passe `Novacampus2026!`
