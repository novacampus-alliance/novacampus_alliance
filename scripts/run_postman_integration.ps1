# Exécute la collection Postman M2 intégration via Newman (CLI)
# Prérequis : gateway :3001 + academic-service :3002 démarrés

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Collection = Join-Path $Root "docs\postman\m2-integration-full.postman_collection.json"

if (-not (Test-Path $Collection)) {
    Write-Error "Collection introuvable : $Collection"
}

Write-Host "=== Novacampus M2 — Test Postman intégration ===" -ForegroundColor Cyan
Write-Host "Collection : $Collection"
Write-Host "Base URL   : http://localhost:3001"
Write-Host ""

# Vérifier que le gateway répond
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "Gateway OK ($($health.StatusCode))" -ForegroundColor Green
} catch {
    Write-Warning "Gateway inaccessible sur :3001 — démarrer gateway + academic-service avant de lancer les tests."
}

Write-Host ""
Write-Host "Lancement Newman..." -ForegroundColor Yellow

npx --yes newman run $Collection `
    --env-var "base_url=http://localhost:3001" `
    --reporters cli `
    --color on `
    --delay-request 100

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Error "Tests Postman échoués (exit $LASTEXITCODE)"
}

Write-Host ""
Write-Host "Tous les tests M2 ont réussi." -ForegroundColor Green
