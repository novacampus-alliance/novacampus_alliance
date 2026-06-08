#!/bin/sh
set -e

echo "Svc Académique — application des migrations Prisma..."
npx prisma migrate deploy --schema=../prisma/schema.prisma

echo "Démarrage du service académique..."
exec node dist/main.js
