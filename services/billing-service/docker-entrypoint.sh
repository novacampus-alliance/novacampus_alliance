#!/bin/sh
set -e

echo "Svc Facturation — application des migrations Prisma..."
npx prisma migrate deploy --schema=../prisma/schema.prisma

echo "Démarrage du service de facturation..."
exec node dist/main.js
