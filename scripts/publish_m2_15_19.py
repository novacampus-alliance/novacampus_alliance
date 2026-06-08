#!/usr/bin/env python3
"""Merge dépendances + Postman + push branches M2 #15-#19."""
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

MODULE_IMPORTS = [
    "AuthModule",
    "CampusModule",
    "ProgramsModule",
    "InstructorsModule",
    "StudentsModule",
    "CoursesModule",
    "RoomsModule",
    "SchedulesModule",
    "EnrollmentsModule",
]

MODULE_PATHS = {
    "AuthModule": "./auth/auth.module",
    "CampusModule": "./campus/campus.module",
    "ProgramsModule": "./programs/programs.module",
    "InstructorsModule": "./instructors/instructors.module",
    "StudentsModule": "./students/students.module",
    "CoursesModule": "./courses/courses.module",
    "RoomsModule": "./rooms/rooms.module",
    "SchedulesModule": "./schedules/schedules.module",
    "EnrollmentsModule": "./enrollments/enrollments.module",
}

PROXY_ROUTES = [
    ("/api/auth", "ACADEMIC_SERVICE_URL", "authentification"),
    ("/api/campus", "ACADEMIC_SERVICE_URL", "campus"),
    ("/api/programs", "ACADEMIC_SERVICE_URL", "programmes"),
    ("/api/instructors", "ACADEMIC_SERVICE_URL", "enseignants"),
    ("/api/students", "ACADEMIC_SERVICE_URL", "étudiants"),
    ("/api/courses", "ACADEMIC_SERVICE_URL", "cours"),
    ("/api/rooms", "ACADEMIC_SERVICE_URL", "salles"),
    ("/api/schedules", "ACADEMIC_SERVICE_URL", "plannings"),
    ("/api/enrollments", "ACADEMIC_SERVICE_URL", "inscriptions"),
]

BRANCHES = [
    {
        "branch": "15-module-salles-et-batiments-crud-et-disponibilite",
        "merges": [],
        "postman": "issue-15-rooms.postman_collection.json",
        "modules": ["AuthModule", "CampusModule", "ProgramsModule", "RoomsModule"],
        "routes": ["/api/auth", "/api/campus", "/api/programs", "/api/rooms"],
        "issue": 15,
        "title": "feat: module Salles — CRUD et disponibilité (#15)",
    },
    {
        "branch": "16-module-plannings-gestion-des-emplois-du-temps",
        "merges": [
            "14-module-cours-crud-et-affectation-enseignant-programme",
            "15-module-salles-et-batiments-crud-et-disponibilite",
        ],
        "postman": "issue-16-schedules.postman_collection.json",
        "modules": [
            "AuthModule", "CampusModule", "ProgramsModule",
            "InstructorsModule", "CoursesModule", "RoomsModule", "SchedulesModule",
        ],
        "routes": [
            "/api/auth", "/api/campus", "/api/programs", "/api/instructors",
            "/api/courses", "/api/rooms", "/api/schedules",
        ],
        "issue": 16,
        "title": "feat: module Plannings — gestion des emplois du temps (#16)",
    },
    {
        "branch": "17-detection-automatique-des-conflits-de-salles",
        "merges": ["16-module-plannings-gestion-des-emplois-du-temps"],
        "postman": "issue-17-conflicts.postman_collection.json",
        "modules": [
            "AuthModule", "CampusModule", "ProgramsModule",
            "InstructorsModule", "CoursesModule", "RoomsModule", "SchedulesModule",
        ],
        "routes": [
            "/api/auth", "/api/campus", "/api/programs", "/api/instructors",
            "/api/courses", "/api/rooms", "/api/schedules",
        ],
        "issue": 17,
        "title": "feat: détection automatique des conflits de salles (#17)",
    },
    {
        "branch": "18-module-inscriptions-enrolement-etudiant-aux-cours",
        "merges": [
            "13-module-etudiants-crud-et-dossier-academique",
            "14-module-cours-crud-et-affectation-enseignant-programme",
        ],
        "postman": "issue-18-enrollments.postman_collection.json",
        "modules": [
            "AuthModule", "CampusModule", "ProgramsModule",
            "InstructorsModule", "StudentsModule", "CoursesModule", "EnrollmentsModule",
        ],
        "routes": [
            "/api/auth", "/api/campus", "/api/programs", "/api/instructors",
            "/api/students", "/api/courses", "/api/enrollments",
        ],
        "issue": 18,
        "title": "feat: module Inscriptions — enrôlement étudiant aux cours (#18)",
    },
    {
        "branch": "19-module-notes-et-absences-saisie-et-consultation",
        "merges": ["18-module-inscriptions-enrolement-etudiant-aux-cours"],
        "postman": "issue-19-notes-absences.postman_collection.json",
        "modules": [
            "AuthModule", "CampusModule", "ProgramsModule",
            "InstructorsModule", "StudentsModule", "CoursesModule", "EnrollmentsModule",
        ],
        "routes": [
            "/api/auth", "/api/campus", "/api/programs", "/api/instructors",
            "/api/students", "/api/courses", "/api/enrollments",
        ],
        "issue": 19,
        "title": "feat: module Notes et Absences — saisie et consultation (#19)",
    },
]


def run(*args, check=True):
    return subprocess.run(args, cwd=REPO, check=check, capture_output=True, text=True)


def fix_app_module(path: Path, modules: list[str]) -> None:
    file_map = {
        "CampusModule": "campus",
        "ProgramsModule": "programs",
        "InstructorsModule": "instructors",
        "StudentsModule": "students",
        "CoursesModule": "courses",
        "RoomsModule": "rooms",
        "SchedulesModule": "schedules",
        "EnrollmentsModule": "enrollments",
    }
    ordered = []
    for m in [
        "CampusModule", "ProgramsModule", "InstructorsModule", "StudentsModule",
        "CoursesModule", "RoomsModule", "SchedulesModule", "EnrollmentsModule",
    ]:
        if m in modules:
            ordered.append(m)
    imports_lines = [
        f"import {{ {m} }} from './{file_map[m]}/{file_map[m]}.module';"
        for m in ordered
    ]
    mod_imports = "\n    ".join(f"{m}," for m in ordered)
    text = f"""import {{ Module }} from '@nestjs/common';
import {{ ConfigModule }} from '@nestjs/config';
import {{ AppController }} from './app.controller';
import {{ AppService }} from './app.service';
import {{ AuthModule }} from './auth/auth.module';
{chr(10).join(imports_lines)}
import {{ PrismaModule }} from './prisma/prisma.module';
import {{ RedisModule }} from './redis/redis.module';

@Module({{
  imports: [
    ConfigModule.forRoot({{ isGlobal: true }}),
    PrismaModule,
    RedisModule,
    AuthModule,
    {mod_imports}
  ],
  controllers: [AppController],
  providers: [AppService],
}})
export class AppModule {{}}
"""
    path.write_text(text, encoding="utf-8")


def fix_proxy(path: Path, routes: list[str]) -> None:
    blocks = []
    labels = {
        "/api/auth": "Svc Académique — authentification",
        "/api/campus": "Svc Académique — campus",
        "/api/programs": "Svc Académique — programmes",
        "/api/instructors": "Svc Académique — enseignants",
        "/api/students": "Svc Académique — étudiants",
        "/api/courses": "Svc Académique — cours",
        "/api/rooms": "Svc Académique — salles",
        "/api/schedules": "Svc Académique — plannings",
        "/api/enrollments": "Svc Académique — inscriptions",
    }
    for r in routes:
        blocks.append(f"""  {{
    path: '{r}',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: '{labels[r]}',
  }},""")
    content = f"""import {{ Options }} from 'http-proxy-middleware';

export interface ServiceRoute {{
  path: string;
  envKey: string;
  defaultUrl: string;
  label: string;
}}

export const SERVICE_ROUTES: ServiceRoute[] = [
{chr(10).join(blocks)}
  {{
    path: '/api/payments',
    envKey: 'BILLING_SERVICE_URL',
    defaultUrl: 'http://localhost:3003',
    label: 'Svc Facturation',
  }},
  {{
    path: '/api/notifications',
    envKey: 'NOTIFICATION_SERVICE_URL',
    defaultUrl: 'http://localhost:3004',
    label: 'Svc Notification',
  }},
  {{
    path: '/api/v1',
    envKey: 'AI_SERVICE_URL',
    defaultUrl: 'http://localhost:8000',
    label: 'Svc IA — relance financière',
  }},
];

export function buildProxyOptions(target: string, mountPath?: string): Options {{
  return {{
    target,
    changeOrigin: true,
    pathRewrite: mountPath ? (path) => `${{mountPath}}${{path}}` : undefined,
    cookieDomainRewrite: '',
    on: {{
      proxyReq: (proxyReq, req) => {{
        const auth = req.headers.authorization;
        if (auth) proxyReq.setHeader('Authorization', auth);
      }},
    }},
  }};
}}
"""
    path.write_text(content, encoding="utf-8")


def fix_gateway_controller(path: Path, routes: list[str]) -> None:
    academic = ", ".join(routes)
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r"academic: '[^']*'",
        f"academic: '{academic}'",
        text,
    )
    path.write_text(text, encoding="utf-8")


def remove_conflict_markers(path: Path) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "<<<<<<<" not in text:
        return
    # keep HEAD side as fallback — will be overwritten by fix_* functions
    text = re.sub(r"<<<<<<< HEAD\n", "", text)
    text = re.sub(r"=======\n[\s\S]*?>>>>>>> [^\n]+\n", "", text)
    path.write_text(text, encoding="utf-8")


def process(cfg: dict) -> None:
    branch = cfg["branch"]
    print(f"\n========== {branch} ==========")
    run("git", "checkout", branch)
    run("git", "pull", "origin", branch, check=False)

    for src in cfg["merges"]:
        print(f"  merge {src}")
        r = run(
            "git", "merge", f"origin/{src}",
            "-m", f"merge: intégrer {src} dans {branch}",
            check=False,
        )
        if r.returncode != 0:
            print(r.stderr)
            for p in [
                REPO / "services/academic-service/src/app.module.ts",
                REPO / "services/gateway/src/proxy/proxy.config.ts",
                REPO / "services/gateway/src/app.controller.ts",
            ]:
                remove_conflict_markers(p)
            fix_app_module(
                REPO / "services/academic-service/src/app.module.ts",
                cfg["modules"],
            )
            fix_proxy(REPO / "services/gateway/src/proxy/proxy.config.ts", cfg["routes"])
            fix_gateway_controller(
                REPO / "services/gateway/src/app.controller.ts", cfg["routes"]
            )
            run("git", "add", "services/academic-service/src/app.module.ts",
                "services/gateway/src/proxy/proxy.config.ts",
                "services/gateway/src/app.controller.ts")
            run("git", "commit", "-m", f"merge: résolution conflits après {src}", check=False)

    fix_app_module(REPO / "services/academic-service/src/app.module.ts", cfg["modules"])
    fix_proxy(REPO / "services/gateway/src/proxy/proxy.config.ts", cfg["routes"])
    fix_gateway_controller(REPO / "services/gateway/src/app.controller.ts", cfg["routes"])

    postman = REPO / "docs/postman" / cfg["postman"]
    gitignore = REPO / ".gitignore"
    gi = gitignore.read_text(encoding="utf-8")
    gi = gi.replace("\n# POSTMAN\ndocs/postman/\n", "\n")
    gitignore.write_text(gi, encoding="utf-8")

    run("git", "add",
        str(postman),
        "services/academic-service/src/app.module.ts",
        "services/gateway/src/proxy/proxy.config.ts",
        "services/gateway/src/app.controller.ts",
        ".gitignore")
    run("git", "commit", "-m", f"docs: collection Postman issue #{cfg['issue']} + merges dépendances", check=False)
    run("git", "push", "origin", branch)
    print(f"  pushed {branch}")


def main():
    for cfg in BRANCHES:
        process(cfg)
    print("\nTerminé. Créer les PR avec gh pr create.")


if __name__ == "__main__":
    main()
