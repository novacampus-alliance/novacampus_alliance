#!/usr/bin/env python3
"""Postman + merges pour branches M2 #15-#19."""
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POSTMAN = REPO / "docs" / "postman"


def run(*args, check=True):
    return subprocess.run(args, cwd=REPO, check=check, capture_output=True, text=True)


def merge(branch: str, *sources: str) -> None:
    run("git", "checkout", branch)
    run("git", "pull", "origin", branch, check=False)
    for src in sources:
        print(f"  merge {src} -> {branch}")
        r = run("git", "merge", f"origin/{src}", "-m", f"merge: intégrer {src} dans {branch}", check=False)
        if r.returncode != 0 and "CONFLICT" in (r.stdout + r.stderr):
            raise SystemExit(f"Conflit merge {src} dans {branch} — résoudre manuellement")


def commit_postman(branch: str, filename: str, msg: str, extra_paths: list[str] | None = None) -> None:
    run("git", "checkout", branch)
    paths = [str(POSTMAN / filename)]
    if extra_paths:
        paths.extend(extra_paths)
    run("git", "add", *paths)
    r = run("git", "commit", "-m", msg, check=False)
    if r.returncode != 0 and "nothing to commit" not in (r.stdout + r.stderr):
        print(r.stderr)
        raise SystemExit(1)
    run("git", "push", "origin", branch)


if __name__ == "__main__":
    print("Utiliser les commandes git manuellement — script de référence.")
