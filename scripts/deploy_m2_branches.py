#!/usr/bin/env python3
"""Repartit le commit M2 sur les branches issues #12-#19 depuis dev."""
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = "feature/module-instructors"
SCRIPTS = REPO / "scripts" / "branch_app_modules"

ROUTES = {
    "instructors": {
        "path": "/api/instructors",
        "label": "Svc Acad\u00e9mique \u2014 enseignants",
    },
    "students": {
        "path": "/api/students",
        "label": "Svc Acad\u00e9mique \u2014 \u00e9tudiants",
    },
    "courses": {
        "path": "/api/courses",
        "label": "Svc Acad\u00e9mique \u2014 cours",
    },
    "rooms": {
        "path": "/api/rooms",
        "label": "Svc Acad\u00e9mique \u2014 salles",
    },
    "schedules": {
        "path": "/api/schedules",
        "label": "Svc Acad\u00e9mique \u2014 plannings",
    },
    "enrollments": {
        "path": "/api/enrollments",
        "label": "Svc Acad\u00e9mique \u2014 inscriptions",
    },
}


def run(*args, check=True):
    return subprocess.run(
        args, cwd=REPO, check=check, capture_output=True, text=True
    )


def git_out(*args):
    return run("git", *args).stdout


def _load_dev_proxy() -> str:
    return git_out("show", "origin/dev:services/gateway/src/proxy/proxy.config.ts")


def _load_dev_gateway_index() -> str:
    return git_out("show", "origin/dev:services/gateway/src/app.controller.ts")


def write_proxy(route_key: str) -> None:
    base = _load_dev_proxy()
    route = ROUTES[route_key]
    block = f"""  {{
    path: '{route["path"]}',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: '{route["label"]}',
  }},
"""
    marker = "  {\n    path: '/api/payments',"
    out = base.replace(marker, block + marker)
    (REPO / "services/gateway/src/proxy/proxy.config.ts").write_text(
        out, encoding="utf-8"
    )


def write_proxy_multi(keys: list[str]) -> None:
    base = _load_dev_proxy()
    blocks = ""
    for key in keys:
        route = ROUTES[key]
        blocks += f"""  {{
    path: '{route["path"]}',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: '{route["label"]}',
  }},
"""
    marker = "  {\n    path: '/api/payments',"
    out = base.replace(marker, blocks + marker)
    (REPO / "services/gateway/src/proxy/proxy.config.ts").write_text(
        out, encoding="utf-8"
    )


def write_gateway_index(extra: str) -> None:
    base = _load_dev_gateway_index()
    old = "academic: '/api/auth, /api/campus, /api/programs',"
    new = f"academic: '/api/auth, /api/campus, /api/programs{extra}',"
    (REPO / "services/gateway/src/app.controller.ts").write_text(
        base.replace(old, new), encoding="utf-8"
    )


def deploy(branch: str, message: str, paths: list[str], app_module: str, route, gateway_extra: str):
    print(f"=== {branch} ===")
    run("git", "checkout", "-B", branch, "origin/dev")
    for p in paths:
        run("git", "checkout", SRC, "--", p)
    shutil_copy = __import__("shutil").copy
    shutil_copy(SCRIPTS / app_module, REPO / "services/academic-service/src/app.module.ts")
    if isinstance(route, list):
        write_proxy_multi(route)
    else:
        write_proxy(route)
    write_gateway_index(gateway_extra)
    run("git", "add", "services/academic-service/src", "services/gateway/src")
    r = run("git", "commit", "-m", message, check=False)
    if r.returncode != 0 and "nothing to commit" not in (r.stdout + r.stderr):
        print(r.stderr)
        raise SystemExit(1)
    run("git", "push", "-u", "origin", branch, "--force")
    print(f"  OK -> origin/{branch}")


def strip_students_notes():
    ctrl = (REPO / "services/academic-service/src/students/students.controller.ts").read_text(
        encoding="utf-8"
    )
    ctrl = re.sub(
        r"\n  @Get\(':id/notes'\).*?@Get\(':id/absences'\).*?findAbsences.*?\n  \}\n",
        "\n",
        ctrl,
        flags=re.S,
    )
    (REPO / "services/academic-service/src/students/students.controller.ts").write_text(
        ctrl, encoding="utf-8"
    )
    svc = (REPO / "services/academic-service/src/students/students.service.ts").read_text(
        encoding="utf-8"
    )
    svc = re.sub(r"\n  async findNotes\(.*?\n  \}\n", "\n", svc, flags=re.S)
    svc = re.sub(r"\n  async findAbsences\(.*?\n  \}\n", "\n", svc, flags=re.S)
    (REPO / "services/academic-service/src/students/students.service.ts").write_text(
        svc, encoding="utf-8"
    )


def strip_enrollments_notes():
    for name in [
        "update-enrollment-note.dto.ts",
        "update-enrollment-presence.dto.ts",
    ]:
        p = REPO / "services/academic-service/src/enrollments/dto" / name
        if p.exists():
            p.unlink()
    ctrl = (REPO / "services/academic-service/src/enrollments/enrollments.controller.ts").read_text(
        encoding="utf-8"
    )
    ctrl = re.sub(r"import \{ UpdateEnrollmentNoteDto \}.*\n", "", ctrl)
    ctrl = re.sub(r"import \{ UpdateEnrollmentPresenceDto \}.*\n", "", ctrl)
    ctrl = re.sub(
        r"\n  @Put\(':id/note'\).*?updatePresence.*?\n  \}\n", "\n", ctrl, flags=re.S
    )
    (REPO / "services/academic-service/src/enrollments/enrollments.controller.ts").write_text(
        ctrl, encoding="utf-8"
    )
    svc = (REPO / "services/academic-service/src/enrollments/enrollments.service.ts").read_text(
        encoding="utf-8"
    )
    svc = re.sub(r"import \{ UpdateEnrollmentNoteDto \}.*\n", "", svc)
    svc = re.sub(r"import \{ UpdateEnrollmentPresenceDto \}.*\n", "", svc)
    svc = re.sub(r"\n  async updateNote\(.*?\n  \}\n", "\n", svc, flags=re.S)
    svc = re.sub(r"\n  async updatePresence\(.*?\n  \}\n", "\n", svc, flags=re.S)
    (REPO / "services/academic-service/src/enrollments/enrollments.service.ts").write_text(
        svc, encoding="utf-8"
    )


def main():
    deploy(
        "12-module-enseignants-crud-et-affectation-aux-cours",
        "feat: module Enseignants CRUD et affectation aux cours (#12)",
        ["services/academic-service/src/instructors/"],
        "12.app.module.ts",
        "instructors",
        ", /api/instructors",
    )

    run("git", "checkout", "-B", "13-module-etudiants-crud-et-dossier-academique", "origin/dev")
    run("git", "checkout", SRC, "--", "services/academic-service/src/students/")
    strip_students_notes()
    __import__("shutil").copy(
        SCRIPTS / "13.app.module.ts", REPO / "services/academic-service/src/app.module.ts"
    )
    write_proxy("students")
    write_gateway_index(", /api/students")
    run("git", "add", "services/academic-service/src", "services/gateway/src")
    run("git", "commit", "-m", "feat: module Etudiants CRUD et dossier academique (#13)")
    run("git", "push", "-u", "origin", "13-module-etudiants-crud-et-dossier-academique", "--force")
    print("=== 13 OK ===")

    deploy(
        "14-module-cours-crud-et-affectation-enseignant-programme",
        "feat: module Cours CRUD et affectation (#14)",
        ["services/academic-service/src/courses/"],
        "14.app.module.ts",
        "courses",
        ", /api/courses",
    )
    deploy(
        "15-module-salles-et-batiments-crud-et-disponibilite",
        "feat: module Salles CRUD et disponibilite (#15)",
        ["services/academic-service/src/rooms/"],
        "15.app.module.ts",
        "rooms",
        ", /api/rooms",
    )
    deploy(
        "16-module-plannings-gestion-des-emplois-du-temps",
        "feat: module Plannings et emplois du temps (#16)",
        [
            "services/academic-service/src/schedules/",
            "services/academic-service/src/common/",
        ],
        "16.app.module.ts",
        "schedules",
        ", /api/schedules",
    )
    deploy(
        "17-detection-automatique-des-conflits-de-salles",
        "feat: detection automatique des conflits de salles (#17)",
        [
            "services/academic-service/src/schedules/",
            "services/academic-service/src/common/",
        ],
        "16.app.module.ts",
        "schedules",
        ", /api/schedules",
    )

    run("git", "checkout", "-B", "18-module-inscriptions-enrolement-etudiant-aux-cours", "origin/dev")
    run("git", "checkout", SRC, "--", "services/academic-service/src/enrollments/")
    strip_enrollments_notes()
    __import__("shutil").copy(
        SCRIPTS / "18.app.module.ts", REPO / "services/academic-service/src/app.module.ts"
    )
    write_proxy("enrollments")
    write_gateway_index(", /api/enrollments")
    run("git", "add", "services/academic-service/src", "services/gateway/src")
    run("git", "commit", "-m", "feat: module Inscriptions enrolement etudiant aux cours (#18)")
    run("git", "push", "-u", "origin", "18-module-inscriptions-enrolement-etudiant-aux-cours", "--force")
    print("=== 18 OK ===")

    run("git", "checkout", "-B", "19-module-notes-et-absences-saisie-et-consultation", "origin/dev")
    run(
        "git",
        "checkout",
        SRC,
        "--",
        "services/academic-service/src/students/",
        "services/academic-service/src/enrollments/",
    )
    __import__("shutil").copy(
        SCRIPTS / "19.app.module.ts", REPO / "services/academic-service/src/app.module.ts"
    )
    write_proxy_multi(["students", "enrollments"])
    write_gateway_index(", /api/students, /api/enrollments")
    run("git", "add", "services/academic-service/src", "services/gateway/src")
    run("git", "commit", "-m", "feat: module Notes et Absences saisie et consultation (#19)")
    run("git", "push", "-u", "origin", "19-module-notes-et-absences-saisie-et-consultation", "--force")
    print("=== 19 OK ===")

    run("git", "checkout", "feature/module-instructors")
    print("\nTermine -- 8 branches M2 poussees depuis dev.")


if __name__ == "__main__":
    main()
