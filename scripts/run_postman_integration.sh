#!/usr/bin/env bash
# Exécute la collection Postman M2 intégration via Newman (CLI)
# Prérequis : gateway :3001 + academic-service :3002 démarrés

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COLLECTION="$ROOT/docs/postman/m2-integration-full.postman_collection.json"

echo "=== Novacampus M2 — Test Postman intégration ==="
echo "Collection : $COLLECTION"

if ! curl -sf "http://localhost:3001/health" >/dev/null 2>&1; then
  echo "ATTENTION: gateway inaccessible sur :3001"
fi

npx --yes newman run "$COLLECTION" \
  --env-var "base_url=http://localhost:3001" \
  --reporters cli \
  --color on \
  --delay-request 100

echo "Tous les tests M2 ont réussi."
