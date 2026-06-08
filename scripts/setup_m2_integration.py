#!/usr/bin/env python3
"""Branche d'intégration M2 : merge toutes les issues #11-#19."""
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BRANCH = "integration/m2-milestone-complet-11-19"

ALL_MODULES = [
    "AuthModule", "CampusModule", "ProgramsModule",
    "InstructorsModule", "StudentsModule", "CoursesModule",
    "RoomsModule", "SchedulesModule", "EnrollmentsModule",
]

ALL_ROUTES = [
    "/api/auth", "/api/campus", "/api/programs", "/api/instructors",
    "/api/students", "/api/courses", "/api/rooms", "/api/schedules",
    "/api/enrollments",
]

MERGE_ORDER = [
    "19-module-notes-et-absences-saisie-et-consultation",
    "17-detection-automatique-des-conflits-de-salles",
]


def run(*args, check=True):
    return subprocess.run(args, cwd=REPO, check=check, capture_output=True, text=True)


def fix_app_module(path: Path) -> None:
    file_map = {
        "CampusModule": "campus", "ProgramsModule": "programs",
        "InstructorsModule": "instructors", "StudentsModule": "students",
        "CoursesModule": "courses", "RoomsModule": "rooms",
        "SchedulesModule": "schedules", "EnrollmentsModule": "enrollments",
    }
    ordered = [m for m in [
        "CampusModule", "ProgramsModule", "InstructorsModule", "StudentsModule",
        "CoursesModule", "RoomsModule", "SchedulesModule", "EnrollmentsModule",
    ] if m in ALL_MODULES]
    imports = [f"import {{ {m} }} from './{file_map[m]}/{file_map[m]}.module';" for m in ordered]
    mods = "\n    ".join(f"{m}," for m in ordered)
    path.write_text(f"""import {{ Module }} from '@nestjs/common';
import {{ ConfigModule }} from '@nestjs/config';
import {{ AppController }} from './app.controller';
import {{ AppService }} from './app.service';
import {{ AuthModule }} from './auth/auth.module';
{chr(10).join(imports)}
import {{ PrismaModule }} from './prisma/prisma.module';
import {{ RedisModule }} from './redis/redis.module';

@Module({{
  imports: [
    ConfigModule.forRoot({{ isGlobal: true }}),
    PrismaModule,
    RedisModule,
    AuthModule,
    {mods}
  ],
  controllers: [AppController],
  providers: [AppService],
}})
export class AppModule {{}}
""", encoding="utf-8")


def fix_proxy(path: Path) -> None:
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
    blocks = "\n".join(
        f"""  {{
    path: '{r}',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: '{labels[r]}',
  }},""" for r in ALL_ROUTES
    )
    path.write_text(f"""import {{ Options }} from 'http-proxy-middleware';

export interface ServiceRoute {{
  path: string;
  envKey: string;
  defaultUrl: string;
  label: string;
}}

export const SERVICE_ROUTES: ServiceRoute[] = [
{blocks}
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
""", encoding="utf-8")


def fix_gateway_controller(path: Path) -> None:
    academic = ", ".join(ALL_ROUTES)
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"academic: '[^']*'", f"academic: '{academic}'", text)
    path.write_text(text, encoding="utf-8")


def remove_conflict_markers(path: Path) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "<<<<<<<" not in text:
        return
    text = re.sub(r"<<<<<<< HEAD\n", "", text)
    text = re.sub(r"=======\n[\s\S]*?>>>>>>> [^\n]+\n", "", text)
    path.write_text(text, encoding="utf-8")


def main():
    run("git", "fetch", "origin", check=False)
    r = run("git", "checkout", "-B", BRANCH, "origin/dev", check=False)
    if r.returncode != 0:
        run("git", "checkout", "-B", BRANCH, "dev")

    for src in MERGE_ORDER:
        print(f"merge {src}...")
        r = run("git", "merge", f"origin/{src}",
                "-m", f"merge: intégrer {src} dans {BRANCH}", check=False)
        if r.returncode != 0:
            print(r.stderr)
            for p in [
                REPO / "services/academic-service/src/app.module.ts",
                REPO / "services/academic-service/src/students/students.service.ts",
                REPO / "services/academic-service/src/students/students.controller.ts",
                REPO / "services/academic-service/src/enrollments/enrollments.service.ts",
                REPO / "services/academic-service/src/enrollments/enrollments.controller.ts",
                REPO / "services/gateway/src/proxy/proxy.config.ts",
                REPO / "services/gateway/src/app.controller.ts",
            ]:
                remove_conflict_markers(p)
            run("git", "add", "-A", check=False)
            run("git", "commit", "-m", f"merge: résolution conflits {src}", check=False)

    app = REPO / "services/academic-service/src/app.module.ts"
    proxy = REPO / "services/gateway/src/proxy/proxy.config.ts"
    gw = REPO / "services/gateway/src/app.controller.ts"
    fix_app_module(app)
    fix_proxy(proxy)
    fix_gateway_controller(gw)

    gi = REPO / ".gitignore"
    text = gi.read_text(encoding="utf-8")
    text = text.replace("\n# POSTMAN\ndocs/postman/\n", "\n")
    gi.write_text(text, encoding="utf-8")

    run("git", "add",
        "services/academic-service/src/app.module.ts",
        "services/gateway/src/proxy/proxy.config.ts",
        "services/gateway/src/app.controller.ts",
        ".gitignore", check=False)
    run("git", "commit", "-m", "chore: configuration gateway + app.module pour intégration M2 complète", check=False)
    print(f"Branche {BRANCH} prête.")


if __name__ == "__main__":
    main()
