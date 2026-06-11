#!/bin/sh
set -e

# ══════════════════════════════════════════════════════════════
#  Novacampus Alliance — Academic Service — docker-entrypoint
# ══════════════════════════════════════════════════════════════

TS_NODE="NODE_PATH=/app/academic-service/node_modules npx ts-node --transpile-only --compiler-options '{\"module\":\"CommonJS\",\"esModuleInterop\":true}'"

# ── 1. Attente de PostgreSQL ──────────────────────────────────
echo " Attente de PostgreSQL (${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432})..."
RETRIES=20
until nc -z "${POSTGRES_HOST:-postgres}" "${POSTGRES_PORT:-5432}" 2>/dev/null || [ "$RETRIES" -eq 0 ]; do
  echo "   PostgreSQL pas encore prêt... ($RETRIES tentatives restantes)"
  RETRIES=$((RETRIES - 1))
  sleep 3
done
if [ "$RETRIES" -eq 0 ]; then
  echo " PostgreSQL inaccessible — abandon"
  exit 1
fi
echo "PostgreSQL est prêt"

# ── 2. Migrations Prisma ──────────────────────────────────────
echo ""
echo "Application des migrations Prisma..."
npx prisma migrate deploy --schema=../prisma/schema.prisma
echo "Migrations appliquées"

# ── 3. Seeds (ordre obligatoire) ──────────────────────────────
echo ""
echo "[1/3] Seed principale (campus, programmes, étudiants, cours, users)..."
NODE_PATH=/app/academic-service/node_modules npx ts-node --transpile-only \
  --compiler-options '{"module":"CommonJS","esModuleInterop":true}' \
  ../prisma/seed/seed.ts
echo "Seed principale terminée"

echo ""
echo "[2/3] Seed notes & relevés..."
NODE_PATH=/app/academic-service/node_modules npx ts-node --transpile-only \
  --compiler-options '{"module":"CommonJS","esModuleInterop":true}' \
  ../prisma/seed/seed-notes.ts
echo "Seed notes terminée"

echo ""
echo "[3/3] Seed paiements & factures..."
NODE_PATH=/app/academic-service/node_modules npx ts-node --transpile-only \
  --compiler-options '{"module":"CommonJS","esModuleInterop":true}' \
  ../prisma/seed/seed-paiements.ts
echo "Seed paiements terminée"

# ── 4. Démarrage ──────────────────────────────────────────────
echo ""
echo "Démarrage du service académique..."
exec node dist/main.js