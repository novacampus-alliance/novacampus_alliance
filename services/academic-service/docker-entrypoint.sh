#!/bin/sh
set -e

echo "Svc Académique — application des migrations Prisma..."
npx prisma migrate deploy --schema=../prisma/schema.prisma

echo "Svc Académique — exécution de la seed..."
NODE_PATH=/app/academic-service/node_modules npx ts-node --transpile-only --compiler-options '{"module":"CommonJS","esModuleInterop":true}' ../prisma/seed.ts

echo "Démarrage du service académique..."
exec node dist/main.js
