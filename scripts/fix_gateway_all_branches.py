#!/usr/bin/env python3
"""Corrige ports gateway + pathRewrite sur branches M2 #12-#19."""
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

BRANCHES = [
    "13-module-etudiants-crud-et-dossier-academique",
    "14-module-cours-crud-et-affectation-enseignant-programme",
    "15-module-salles-et-batiments-crud-et-disponibilite",
    "16-module-plannings-gestion-des-emplois-du-temps",
    "17-detection-automatique-des-conflits-de-salles",
    "18-module-inscriptions-enrolement-etudiant-aux-cours",
    "19-module-notes-et-absences-saisie-et-consultation",
]

PROXY = REPO / "services/gateway/src/proxy/proxy.config.ts"
MAIN = REPO / "services/gateway/src/main.ts"

PORT_FIXES = [
    ("http://localhost:3001", "http://localhost:3002"),  # academic (si erroné)
    ("defaultUrl: 'http://localhost:3002',\n    label: 'Svc Facturation'",  # billing décalé
     "defaultUrl: 'http://localhost:3003',\n    label: 'Svc Facturation'"),
    ("defaultUrl: 'http://localhost:3003',\n    label: 'Svc Notification'",
     "defaultUrl: 'http://localhost:3004',\n    label: 'Svc Notification'"),
]

BUILD_PROXY_OLD = re.compile(
    r"export function buildProxyOptions\(target: string\): Options \{\n"
    r"  return \{\n"
    r"    target,\n"
    r"    changeOrigin: true,\n"
    r"(?:    // Réinjecte le préfixe mount.*\n"
    r"    pathRewrite:.*\n)?"
    r"    // Transmet les cookies",
    re.MULTILINE,
)

BUILD_PROXY_NEW = """export function buildProxyOptions(target: string, mountPath?: string): Options {
  return {
    target,
    changeOrigin: true,
    // Réinjecte le préfixe mount (/api/auth + /login → /api/auth/login)
    pathRewrite: mountPath ? (path) => `${mountPath}${path}` : undefined,
    // Transmet les cookies"""


def run(*args, check=True):
    return subprocess.run(
        args, cwd=REPO, check=check, capture_output=True, text=True
    )


def fix_proxy(text: str) -> str:
    for old, new in PORT_FIXES:
        text = text.replace(old, new)
    if "mountPath?: string" not in text:
        text = BUILD_PROXY_OLD.sub(BUILD_PROXY_NEW, text, count=1)
    return text


def fix_main(text: str) -> str:
    text = text.replace(
        "process.env.ACADEMIC_SERVICE_URL ?? 'http://localhost:3001'",
        "process.env.ACADEMIC_SERVICE_URL ?? 'http://localhost:3002'",
    )
    text = text.replace("const port = process.env.PORT ?? 3000;", "const port = process.env.PORT ?? 3001;")
    text = text.replace(
        "createProxyMiddleware(buildProxyOptions(target))",
        "createProxyMiddleware(buildProxyOptions(target, route.path))",
    )
    text = text.replace(
        "createProxyMiddleware(\n      buildProxyOptions(academicUrl),\n    )",
        "createProxyMiddleware(buildProxyOptions(academicUrl, '/api'))",
    )
    return text


def process_branch(branch: str) -> None:
    print(f"=== {branch} ===")
    run("git", "checkout", branch)
    proxy_text = PROXY.read_text(encoding="utf-8")
    main_text = MAIN.read_text(encoding="utf-8")
    new_proxy = fix_proxy(proxy_text)
    new_main = fix_main(main_text)
    changed = False
    if new_proxy != proxy_text:
        PROXY.write_text(new_proxy, encoding="utf-8")
        changed = True
    if new_main != main_text:
        MAIN.write_text(new_main, encoding="utf-8")
        changed = True
    if not changed:
        print("  rien à changer")
        return
    run("git", "add", "services/gateway/src/proxy/proxy.config.ts", "services/gateway/src/main.ts")
    r = run(
        "git", "commit", "-m",
        "fix(gateway): ports SOA officiels (3001/3002/3003/3004) et pathRewrite proxy",
        check=False,
    )
    if r.returncode != 0:
        print(r.stderr or r.stdout)
        raise SystemExit(1)
    run("git", "push", "origin", branch)
    print("  OK poussé")


def main():
    for branch in BRANCHES:
        process_branch(branch)
    print("Terminé.")


if __name__ == "__main__":
    main()
