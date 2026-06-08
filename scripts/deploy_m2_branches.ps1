# Repartit le commit M2 sur les branches issues #12-#19 depuis dev
$ErrorActionPreference = "Stop"
$Repo = "c:\Users\abdou\Documents\novacampus_alliance"
$SrcRef = "feature/module-instructors"
Set-Location $Repo

function Write-AppModule {
    param([string]$ImportPath, [string]$ModuleName)
    @"
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { ProgramsModule } from './programs/programs.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ${ModuleName} } from '${ImportPath}';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    CampusModule,
    ProgramsModule,
    ${ModuleName},
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
"@ | Set-Content -Encoding utf8 "services/academic-service/src/app.module.ts"
}

function Write-ProxyConfig {
    param([hashtable]$Route)
    $routeBlock = @"
  {
    path: '$($Route.path)',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: '$($Route.label)',
  },
"@
    $devProxy = git show "origin/dev:services/gateway/src/proxy/proxy.config.ts"
    $insertAfter = "    label: 'Svc Académique — programmes',`n  },"
    $newProxy = $devProxy.Replace($insertAfter, "$insertAfter`n$routeBlock")
    $newProxy | Set-Content -Encoding utf8 "services/gateway/src/proxy/proxy.config.ts"
}

function Write-GatewayIndex {
    param([string]$AcademicRoutes)
    $devIndex = git show "origin/dev:services/gateway/src/app.controller.ts"
    $old = "academic: '/api/auth, /api/campus, /api/programs',"
    $new = "academic: '$AcademicRoutes',"
    $devIndex.Replace($old, $new) | Set-Content -Encoding utf8 "services/gateway/src/app.controller.ts"
}

function Deploy-Branch {
    param(
        [string]$Branch,
        [string]$Message,
        [string[]]$Paths,
        [string]$ImportPath,
        [string]$ModuleName,
        [hashtable]$Route,
        [string]$GatewayAcademic
    )
    Write-Host "=== $Branch ===" -ForegroundColor Cyan
    git checkout -B $Branch origin/dev 2>&1 | Out-Null
    foreach ($p in $Paths) {
        git checkout $SrcRef -- $p 2>&1 | Out-Null
    }
    Write-AppModule $ImportPath $ModuleName
    Write-ProxyConfig $Route
    Write-GatewayIndex $GatewayAcademic
    git add services/academic-service/src services/gateway/src
    git commit -m $Message 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host "  (rien a committer ou deja fait)" }
    git push -u origin $Branch --force 2>&1 | Out-Null
    Write-Host "  OK -> origin/$Branch" -ForegroundColor Green
}

# #12 Enseignants
Deploy-Branch `
    -Branch "12-module-enseignants-crud-et-affectation-aux-cours" `
    -Message "feat: module Enseignants CRUD et affectation aux cours (#12)" `
    -Paths @("services/academic-service/src/instructors/") `
    -ImportPath "./instructors/instructors.module" `
    -ModuleName "InstructorsModule" `
    -Route @{ path="/api/instructors"; label="Svc Académique — enseignants" } `
    -GatewayAcademic "/api/auth, /api/campus, /api/programs, /api/instructors"

# #13 Etudiants (sans notes/absences -> #19)
git checkout -B 13-module-etudiants-crud-et-dossier-academique origin/dev 2>&1 | Out-Null
git checkout $SrcRef -- services/academic-service/src/students/ 2>&1 | Out-Null
$ctrl = Get-Content "services/academic-service/src/students/students.controller.ts" -Raw
$ctrl = $ctrl -replace "(?s)  @Get\(':id/notes'\).*?findAbsences.*?\r?\n\r?\n", ""
Set-Content "services/academic-service/src/students/students.controller.ts" $ctrl -Encoding utf8
$svc = Get-Content "services/academic-service/src/students/students.service.ts" -Raw
$svc = $svc -replace "(?s)  async findNotes\(id: string\) \{.*?\r?\n  \}\r?\n\r?\n  async findAbsences", "  async findAbsences_PLACEHOLDER"
$svc = $svc -replace "(?s)  async findAbsences_PLACEHOLDER\(id: string\) \{.*?\r?\n  \}\r?\n\r?\n", ""
Set-Content "services/academic-service/src/students/students.service.ts" $svc -Encoding utf8
Write-AppModule "./students/students.module" "StudentsModule"
Write-ProxyConfig @{ path="/api/students"; label="Svc Académique — étudiants" }
Write-GatewayIndex "/api/auth, /api/campus, /api/programs, /api/students"
git add services/academic-service/src/students services/academic-service/src/app.module.ts services/gateway/src
git commit -m "feat: module Etudiants CRUD et dossier academique (#13)" 2>&1 | Out-Null
git push -u origin 13-module-etudiants-crud-et-dossier-academique --force 2>&1 | Out-Null
Write-Host "=== 13-module-etudiants... OK ===" -ForegroundColor Green

# #14 Cours
Deploy-Branch `
    -Branch "14-module-cours-crud-et-affectation-enseignant-programme" `
    -Message "feat: module Cours CRUD et affectation (#14)" `
    -Paths @("services/academic-service/src/courses/") `
    -ImportPath "./courses/courses.module" `
    -ModuleName "CoursesModule" `
    -Route @{ path="/api/courses"; label="Svc Académique — cours" } `
    -GatewayAcademic "/api/auth, /api/campus, /api/programs, /api/courses"

# #15 Salles
Deploy-Branch `
    -Branch "15-module-salles-et-batiments-crud-et-disponibilite" `
    -Message "feat: module Salles CRUD et disponibilite (#15)" `
    -Paths @("services/academic-service/src/rooms/") `
    -ImportPath "./rooms/rooms.module" `
    -ModuleName "RoomsModule" `
    -Route @{ path="/api/rooms"; label="Svc Académique — salles" } `
    -GatewayAcademic "/api/auth, /api/campus, /api/programs, /api/rooms"

# #16 Plannings
Deploy-Branch `
    -Branch "16-module-plannings-gestion-des-emplois-du-temps" `
    -Message "feat: module Plannings et emplois du temps (#16)" `
    -Paths @("services/academic-service/src/schedules/", "services/academic-service/src/common/") `
    -ImportPath "./schedules/schedules.module" `
    -ModuleName "SchedulesModule" `
    -Route @{ path="/api/schedules"; label="Svc Académique — plannings" } `
    -GatewayAcademic "/api/auth, /api/campus, /api/programs, /api/schedules"

# #17 Conflits (meme module schedules — focus detection conflits)
Deploy-Branch `
    -Branch "17-detection-automatique-des-conflits-de-salles" `
    -Message "feat: detection automatique des conflits de salles (#17)" `
    -Paths @("services/academic-service/src/schedules/", "services/academic-service/src/common/") `
    -ImportPath "./schedules/schedules.module" `
    -ModuleName "SchedulesModule" `
    -Route @{ path="/api/schedules"; label="Svc Académique — plannings" } `
    -GatewayAcademic "/api/auth, /api/campus, /api/programs, /api/schedules"

# #18 Inscriptions (sans notes/presence -> #19)
git checkout -B 18-module-inscriptions-enrolement-etudiant-aux-cours origin/dev 2>&1 | Out-Null
git checkout $SrcRef -- services/academic-service/src/enrollments/ 2>&1 | Out-Null
Remove-Item "services/academic-service/src/enrollments/dto/update-enrollment-note.dto.ts" -ErrorAction SilentlyContinue
Remove-Item "services/academic-service/src/enrollments/dto/update-enrollment-presence.dto.ts" -ErrorAction SilentlyContinue
$ectrl = Get-Content "services/academic-service/src/enrollments/enrollments.controller.ts" -Raw
$ectrl = $ectrl -replace "import \{ UpdateEnrollmentNoteDto \}.*\r?\n", ""
$ectrl = $ectrl -replace "import \{ UpdateEnrollmentPresenceDto \}.*\r?\n", ""
$ectrl = $ectrl -replace "(?s)  @Put\(':id/note'\).*?updatePresence.*?\r?\n  \}\r?\n", ""
Set-Content "services/academic-service/src/enrollments/enrollments.controller.ts" $ectrl -Encoding utf8
$esvc = Get-Content "services/academic-service/src/enrollments/enrollments.service.ts" -Raw
$esvc = $esvc -replace "import \{ UpdateEnrollmentNoteDto \}.*\r?\n", ""
$esvc = $esvc -replace "import \{ UpdateEnrollmentPresenceDto \}.*\r?\n", ""
$esvc = $esvc -replace "(?s)  async updateNote\(id: string.*?\r?\n  \}\r?\n\r?\n  async updatePresence.*?\r?\n  \}\r?\n\r?\n", ""
Set-Content "services/academic-service/src/enrollments/enrollments.service.ts" $esvc -Encoding utf8
Write-AppModule "./enrollments/enrollments.module" "EnrollmentsModule"
Write-ProxyConfig @{ path="/api/enrollments"; label="Svc Académique — inscriptions" }
Write-GatewayIndex "/api/auth, /api/campus, /api/programs, /api/enrollments"
git add services/academic-service/src/enrollments services/academic-service/src/app.module.ts services/gateway/src
git commit -m "feat: module Inscriptions enrolement etudiant aux cours (#18)" 2>&1 | Out-Null
git push -u origin 18-module-inscriptions-enrolement-etudiant-aux-cours --force 2>&1 | Out-Null
Write-Host "=== 18-module-inscriptions... OK ===" -ForegroundColor Green

# #19 Notes et absences (students notes/absences + enrollments note/presence)
git checkout -B 19-module-notes-et-absences-saisie-et-consultation origin/dev 2>&1 | Out-Null
git checkout $SrcRef -- services/academic-service/src/students/ services/academic-service/src/enrollments/ 2>&1 | Out-Null
# App module avec les deux modules
@"
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgramsModule } from './programs/programs.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    CampusModule,
    ProgramsModule,
    StudentsModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
"@ | Set-Content -Encoding utf8 "services/academic-service/src/app.module.ts"
$devProxy = git show "origin/dev:services/gateway/src/proxy/proxy.config.ts"
$devProxy = $devProxy.Replace(
    "    label: 'Svc Académique — programmes',`n  },",
    @"
    label: 'Svc Académique — programmes',
  },
  {
    path: '/api/students',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — étudiants',
  },
  {
    path: '/api/enrollments',
    envKey: 'ACADEMIC_SERVICE_URL',
    defaultUrl: 'http://localhost:3002',
    label: 'Svc Académique — inscriptions',
  },
"@
)
$devProxy | Set-Content -Encoding utf8 "services/gateway/src/proxy/proxy.config.ts"
Write-GatewayIndex "/api/auth, /api/campus, /api/programs, /api/students, /api/enrollments"
git add services/academic-service/src/students services/academic-service/src/enrollments services/academic-service/src/app.module.ts services/gateway/src
git commit -m "feat: module Notes et Absences saisie et consultation (#19)" 2>&1 | Out-Null
git push -u origin 19-module-notes-et-absences-saisie-et-consultation --force 2>&1 | Out-Null
Write-Host "=== 19-module-notes... OK ===" -ForegroundColor Green

git checkout feature/module-instructors 2>&1 | Out-Null
Write-Host "`nTermine — 8 branches M2 poussees depuis dev." -ForegroundColor Cyan
