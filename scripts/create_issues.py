import subprocess
import sys

REPO = "Meckagameers85/novacampus_alliance"

issues = [
    # ── M1 — Infrastructure & Setup ──────────────────────────────────────────
    {
        "title": "Initialiser la structure du monorepo",
        "body": """## Objectif
Mettre en place l'arborescence de base du projet.

## Taches
- Creer les dossiers racine : frontend/, backend/, ai-service/, prisma/, docker/, docs/
- Initialiser Next.js 14 dans frontend/
- Initialiser NestJS dans backend/
- Initialiser FastAPI dans ai-service/
- Ajouter les .gitignore par service
- Verifier que tout se compile

## Branche
`feature/init-monorepo`""",
        "labels": ["infrastructure"],
        "milestone": "M1 — Infrastructure & Setup",
    },
    {
        "title": "Configurer Docker Compose (PostgreSQL, MongoDB, Redis)",
        "body": """## Objectif
Mettre en place l'environnement de developpement local via Docker Compose.

## Taches
- Creer docker-compose.yml a la racine
- Service PostgreSQL (port 5432)
- Service MongoDB (port 27017)
- Service Redis (port 6379)
- Volumes persistants pour chaque base
- Variables d'environnement via .env
- Verifier que `docker compose up` fonctionne

## Branche
`feature/docker-setup`""",
        "labels": ["infrastructure", "database"],
        "milestone": "M1 — Infrastructure & Setup",
    },
    {
        "title": "Configurer Prisma ORM et le schema relationnel complet",
        "body": """## Objectif
Initialiser Prisma avec PostgreSQL et definir le schema relationnel base sur la base de donnees fournie.

## Taches
- Installer Prisma dans backend/
- Configurer DATABASE_URL dans .env
- Definir les modeles : Campus, Programme, Enseignant, Etudiant, Cours, Salle, Batiment, Planning, Inscription, Note, Paiement, Facture, Notification, Utilisateur
- Creer la premiere migration
- Verifier la connexion a PostgreSQL

## Branche
`feature/prisma-schema`""",
        "labels": ["database", "backend"],
        "milestone": "M1 — Infrastructure & Setup",
    },
    {
        "title": "Mettre en place le CI/CD GitHub Actions (deploiement VPS IONOS)",
        "body": """## Objectif
Automatiser le deploiement sur le VPS IONOS a chaque merge sur `production`.

## Taches
- Creer le workflow `.github/workflows/deploy.yml`
- Connexion SSH au VPS via secrets GitHub
- Pull de la branche `production` sur le serveur
- Rebuild Docker Compose en production
- Tester un deploiement complet de bout en bout

## Branche
`feature/cicd-pipeline`""",
        "labels": ["infrastructure"],
        "milestone": "M1 — Infrastructure & Setup",
    },
    {
        "title": "Configurer les branch protection rules (main + production)",
        "body": """## Objectif
Securiser les branches principales pour imposer le workflow de revue de code.

## Taches
- Activer "Require a pull request" sur `main`
- Activer "Require approvals" (1 reviewer minimum)
- Activer "Dismiss stale PR approvals"
- Repliquer les memes regles sur `production`
- Documenter le workflow dans le README

## Note
Configuration directe dans GitHub Settings > Branches > Branch protection rules""",
        "labels": ["infrastructure"],
        "milestone": "M1 — Infrastructure & Setup",
    },
    {
        "title": "Creer les templates d'environnement (.env.example)",
        "body": """## Objectif
Fournir des fichiers .env.example pour chaque service.

## Taches
- frontend/.env.example (NEXT_PUBLIC_API_URL, etc.)
- backend/.env.example (DATABASE_URL, JWT_SECRET, REDIS_URL, etc.)
- ai-service/.env.example (OPENAI_API_KEY ou equivalent, etc.)
- Documenter chaque variable dans les fichiers

## Branche
`feature/env-templates`""",
        "labels": ["infrastructure"],
        "milestone": "M1 — Infrastructure & Setup",
    },

    # ── M2 — Svc Academique ───────────────────────────────────────────────────
    {
        "title": "Authentification JWT — login, logout, gestion des roles",
        "body": """## Objectif
Implementer le systeme d'authentification avec JWT et gestion des roles.

## Roles
Etudiant, Enseignant, Administration, Direction

## Taches
- Module Auth dans NestJS (login/logout)
- Generation et validation du JWT
- Guards NestJS par role
- Hash des mots de passe avec bcrypt
- Middleware Next.js pour proteger les routes frontend

## Branche
`feature/auth-jwt`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Module Campus — CRUD et gestion multi-campus",
        "body": """## Objectif
Gerer les campus du groupe (creation, modification, consultation).

## Taches
- Endpoints REST : GET /campus, GET /campus/:id, POST /campus, PUT /campus/:id
- Validation des donnees avec class-validator
- Liaison avec Adresse, Batiment, Programme, Etudiant, Enseignant

## Branche
`feature/module-campus`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Module Programmes — CRUD des filieres et formations",
        "body": """## Objectif
Gerer les programmes academiques (licence, master, etc.) par campus.

## Taches
- Endpoints REST CRUD pour Programme
- Champs : Nom, Type, Duree_Annees, Frais_Annuels, Campus_ID, Dept_ID
- Relation avec Cours et Etudiants

## Branche
`feature/module-programmes`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Module Enseignants — CRUD et affectation aux cours",
        "body": """## Objectif
Gerer les enseignants et intervenants du groupe.

## Taches
- Endpoints REST CRUD pour Enseignant
- Liaison avec Personne
- Champs : Specialisation, Date_Embauche, Dept_ID, Campus_ID
- Endpoint GET /enseignants/:id/cours

## Branche
`feature/module-enseignants`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Module Etudiants — CRUD et dossier academique",
        "body": """## Objectif
Gerer les etudiants inscrits dans le groupe.

## Taches
- Endpoints REST CRUD pour Etudiant
- Liaison avec Personne
- Champs : Annee_Inscription, Campus_ID, Program_ID, Statut
- Endpoint GET /etudiants/:id/dossier (notes, absences, inscriptions, factures)

## Branche
`feature/module-etudiants`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Module Cours — CRUD et affectation enseignant/programme",
        "body": """## Objectif
Gerer le catalogue de cours.

## Taches
- Endpoints REST CRUD pour Cours
- Champs : Nom, Code, Semestre, Credits, Heures, Program_ID, Instructor_ID
- Relation avec Planning et Inscription

## Branche
`feature/module-cours`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Module Salles et Batiments — CRUD et disponibilite",
        "body": """## Objectif
Gerer les salles, leurs batiments et equipements.

## Taches
- Endpoints REST CRUD pour Salle et Batiment
- Champs Salle : Nom, Etage, Capacite, Type, Batiment_ID
- Endpoint GET /salles/disponibles?jour=&heure= pour verifier la disponibilite

## Branche
`feature/module-salles`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Module Plannings — gestion des emplois du temps",
        "body": """## Objectif
Creer et consulter les plannings de cours par campus, filiere ou enseignant.

## Taches
- Endpoints REST CRUD pour Planning
- Champs : Course_ID, Instructor_ID, Room_ID, Jour, Heure_Debut, Heure_Fin
- Endpoint GET /plannings?campus=&semaine= pour l'affichage EDT

## Branche
`feature/module-plannings`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Detection automatique des conflits de salles",
        "body": """## Objectif
Empecher la double reservation d'une salle sur le meme creneau.

## Taches
- Logique de verification a la creation/modification d'un planning
- Retourner une erreur explicite si conflit detecte
- Endpoint GET /plannings/conflits pour lister les conflits existants
- Tests unitaires sur la logique de conflit

## Branche
`feature/conflit-salles`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Module Inscriptions — enrolement etudiant aux cours",
        "body": """## Objectif
Gerer les inscriptions des etudiants aux cours.

## Taches
- Endpoints REST CRUD pour Inscription
- Champs : Student_ID, Course_ID, Note_Finale, Taux_Presence, Statut, Annee_Acad
- Verification des prerequis et de la capacite de la salle

## Branche
`feature/module-inscriptions`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },
    {
        "title": "Module Notes et Absences — saisie et consultation",
        "body": """## Objectif
Permettre aux enseignants de saisir notes et absences, et aux etudiants de les consulter.

## Taches
- Endpoint PUT /inscriptions/:id/note
- Endpoint PUT /inscriptions/:id/presence
- Endpoint GET /etudiants/:id/notes
- Endpoint GET /etudiants/:id/absences
- Guard : seul l'enseignant du cours ou l'admin peut saisir

## Branche
`feature/notes-absences`""",
        "labels": ["backend"],
        "milestone": "M2 — Svc Académique",
    },

    # ── M3 — Svc Facturation ─────────────────────────────────────────────────
    {
        "title": "Module Paiements — CRUD et suivi des statuts",
        "body": """## Objectif
Gerer les paiements des etudiants.

## Taches
- Endpoints REST CRUD pour Paiement
- Champs : Student_ID, Date_Emission, Date_Echeance, Montant, Statut, Date_Paiement
- Endpoint GET /paiements?statut=en_retard pour filtrer les impayes

## Branche
`feature/module-paiements`""",
        "labels": ["facturation", "backend"],
        "milestone": "M3 — Svc Facturation",
    },
    {
        "title": "Generation automatique des factures a l'inscription",
        "body": """## Objectif
Generer automatiquement une facture lors de l'inscription d'un etudiant a un programme.

## Taches
- Hook NestJS sur l'evenement d'inscription
- Calcul du montant base sur les frais annuels du programme
- Creation de l'entite Paiement avec statut "En attente"
- Stockage du document facture en MongoDB

## Branche
`feature/generation-factures`""",
        "labels": ["facturation", "backend"],
        "milestone": "M3 — Svc Facturation",
    },
    {
        "title": "Suivi des encaissements et gestion des echeanciers",
        "body": """## Objectif
Permettre le suivi des paiements recus et la gestion des echeanciers.

## Taches
- Endpoint POST /paiements/:id/confirmer
- Support des paiements en plusieurs echeances
- Calcul automatique du solde restant
- Historique complet des paiements par etudiant

## Branche
`feature/suivi-encaissements`""",
        "labels": ["facturation", "backend"],
        "milestone": "M3 — Svc Facturation",
    },
    {
        "title": "Systeme de relances automatiques (paiements en retard)",
        "body": """## Objectif
Envoyer automatiquement des relances pour les paiements dont la date d'echeance est depassee.

## Taches
- Job cron NestJS (verification quotidienne des echeances depassees)
- Generer une notification de relance (voir M5)
- Mettre a jour le statut du paiement en "En retard"
- Log des relances envoyees en MongoDB

## Branche
`feature/relances-automatiques`""",
        "labels": ["facturation", "backend"],
        "milestone": "M3 — Svc Facturation",
    },

    # ── M4 — Portails IHM ────────────────────────────────────────────────────
    {
        "title": "Portail Etudiant — Emploi du temps",
        "body": """## Objectif
Afficher l'emploi du temps de l'etudiant connecte avec les modifications en temps reel.

## Taches
- Page /etudiant/planning
- Vue calendrier hebdomadaire
- Indicateur visuel en cas de changement de salle
- Responsive mobile

## Branche
`feature/portail-etudiant-planning`""",
        "labels": ["frontend"],
        "milestone": "M4 — Portails IHM",
    },
    {
        "title": "Portail Etudiant — Notes, absences et releve academique",
        "body": """## Objectif
Permettre a l'etudiant de consulter ses notes, absences et son releve de parcours.

## Taches
- Page /etudiant/notes : tableau par cours avec note finale, taux de presence, statut
- Page /etudiant/releve : historique complet du parcours
- Export PDF du releve

## Branche
`feature/portail-etudiant-notes`""",
        "labels": ["frontend"],
        "milestone": "M4 — Portails IHM",
    },
    {
        "title": "Portail Etudiant — Factures et paiements",
        "body": """## Objectif
Permettre a l'etudiant de consulter ses factures et l'etat de ses paiements.

## Taches
- Page /etudiant/factures
- Liste des factures avec statut : paye, en attente, en retard
- Detail d'une facture
- Telechargement de la facture en PDF

## Branche
`feature/portail-etudiant-factures`""",
        "labels": ["frontend"],
        "milestone": "M4 — Portails IHM",
    },
    {
        "title": "Portail Enseignant — Saisie des notes et absences",
        "body": """## Objectif
Permettre a l'enseignant de saisir les notes et absences pour ses cours.

## Taches
- Page /enseignant/cours/:id/notes
- Tableau des etudiants inscrits avec champ de saisie note
- Saisie du taux de presence par etudiant
- Sauvegarde et confirmation

## Branche
`feature/portail-enseignant-notes`""",
        "labels": ["frontend"],
        "milestone": "M4 — Portails IHM",
    },
    {
        "title": "Portail Enseignant — Gestion des cours et planning",
        "body": """## Objectif
Permettre a l'enseignant de consulter ses cours affectes et son emploi du temps.

## Taches
- Page /enseignant/cours : liste des cours affectes
- Page /enseignant/planning : vue calendrier
- Detail d'un cours : etudiants inscrits, statistiques de reussite

## Branche
`feature/portail-enseignant-cours`""",
        "labels": ["frontend"],
        "milestone": "M4 — Portails IHM",
    },
    {
        "title": "Portail Administration — Gestion des inscriptions et dossiers etudiants",
        "body": """## Objectif
Permettre a l'administration de gerer les inscriptions et les dossiers.

## Taches
- Page /admin/etudiants : liste, recherche, filtres par campus/programme
- Creation et modification d'un dossier etudiant
- Gestion des inscriptions aux programmes et cours
- Export des listes en CSV

## Branche
`feature/portail-admin-inscriptions`""",
        "labels": ["frontend"],
        "milestone": "M4 — Portails IHM",
    },
    {
        "title": "Portail Administration — Gestion des plannings et conflits",
        "body": """## Objectif
Permettre a l'administration de gerer les plannings et de resoudre les conflits de salles.

## Taches
- Page /admin/plannings : vue globale multi-campus
- Creation et modification de creneaux
- Vue des conflits detectes avec suggestion de resolution
- Affectation manuelle d'une salle alternative

## Branche
`feature/portail-admin-plannings`""",
        "labels": ["frontend"],
        "milestone": "M4 — Portails IHM",
    },
    {
        "title": "Portail Administration — Suivi paiements et relances",
        "body": """## Objectif
Permettre a l'administration de suivre les paiements et de declencher des relances.

## Taches
- Page /admin/paiements : tableau de bord financier
- Filtres : campus, statut, periode
- Declenchement manuel d'une relance
- Vue des echeances a venir

## Branche
`feature/portail-admin-paiements`""",
        "labels": ["frontend"],
        "milestone": "M4 — Portails IHM",
    },

    # ── M5 — Svc Notification ─────────────────────────────────────────────────
    {
        "title": "Implementer le service de notifications (Mail / Push)",
        "body": """## Objectif
Construire le service de notifications multicanal.

## Taches
- Module Notification dans NestJS
- Integration d'un provider email (Resend ou Nodemailer)
- Structure de l'entite Notification : User_ID, Type, Message, Date_Envoi, Lu
- Endpoint GET /notifications pour l'utilisateur connecte
- Endpoint PUT /notifications/:id/lire

## Branche
`feature/service-notifications`""",
        "labels": ["notification", "backend"],
        "milestone": "M5 — Svc Notification",
    },
    {
        "title": "Notifications automatiques — changements d'emploi du temps",
        "body": """## Objectif
Notifier les etudiants et enseignants lors d'un changement de salle ou d'horaire.

## Taches
- Hook sur la modification d'un Planning
- Envoyer une notification in-app et email aux personnes concernees
- Message clair : ancien creneau vs nouveau creneau

## Dependance
Issue "Implementer le service de notifications"

## Branche
`feature/notif-edt`""",
        "labels": ["notification", "backend"],
        "milestone": "M5 — Svc Notification",
    },
    {
        "title": "Notifications automatiques — rappels deadlines et paiements en retard",
        "body": """## Objectif
Envoyer des rappels automatiques avant les echeances importantes.

## Taches
- Cron job : J-3 avant echeance de paiement → notification etudiant
- Cron job : J-7 avant fin de periode d'inscription
- Notification lors du passage en statut "En retard"

## Dependance
Issue "Implementer le service de notifications"

## Branche
`feature/notif-rappels`""",
        "labels": ["notification", "backend"],
        "milestone": "M5 — Svc Notification",
    },

    # ── M6 — Dashboard Direction & KPIs ─────────────────────────────────────
    {
        "title": "Dashboard Direction — KPIs consolides par campus",
        "body": """## Objectif
Afficher les indicateurs cles de performance consolides pour la direction.

## Taches
- Page /direction/dashboard
- KPIs : nombre etudiants actifs, taux d'occupation des salles, taux de reussite global
- Filtres par campus et par periode
- Graphiques interactifs

## Branche
`feature/dashboard-kpis`""",
        "labels": ["kpi", "frontend"],
        "milestone": "M6 — Dashboard Direction & KPIs",
    },
    {
        "title": "Dashboard Direction — Taux de reussite et occupation par filiere",
        "body": """## Objectif
Fournir une analyse detaillee par programme et filiere.

## Taches
- Graphiques : taux de reussite par cours et par programme
- Graphiques : taux d'occupation des salles par batiment
- Comparaison inter-campus
- Export des donnees en CSV

## Branche
`feature/dashboard-filieres`""",
        "labels": ["kpi", "frontend"],
        "milestone": "M6 — Dashboard Direction & KPIs",
    },
    {
        "title": "Dashboard Direction — Rapports financiers (revenus, impayes)",
        "body": """## Objectif
Produire des rapports financiers consolides pour le pilotage.

## Taches
- Vue revenus par campus et par periode
- Suivi des impayes et du taux de recouvrement
- Graphiques d'evolution mensuelle
- Export PDF du rapport

## Branche
`feature/dashboard-finances`""",
        "labels": ["kpi", "frontend"],
        "milestone": "M6 — Dashboard Direction & KPIs",
    },

    # ── M7 — Agent IA (reserve) ──────────────────────────────────────────────
    {
        "title": "[IA] Definir le perimetre et les fonctionnalites de l'agent IA",
        "body": """## Objectif
Aligner l'equipe sur le perimetre exact de l'agent IA avant tout developpement.

## Questions a trancher
- Quel processus metier l'agent va-t-il couvrir ?
- Fonctionnalites retenues : RAG, prediction, chatbot, relances intelligentes ?
- Modele LLM utilise : OpenAI, Mistral, local ?
- Perimetre des donnees accessibles par l'agent

## Resultat attendu
Un document de specification valide par l'equipe avant de passer aux issues d'implementation.

## Note
Cette issue doit etre completee AVANT toutes les autres issues IA.""",
        "labels": ["ia"],
        "milestone": "M7 — Agent IA",
    },
    {
        "title": "[IA] Initialiser le service Python FastAPI + LangChain",
        "body": """## Objectif
Mettre en place le squelette du service IA isole.

## Taches
- Initialiser le projet FastAPI dans ai-service/
- Installer LangChain et les dependances requises
- Endpoint de test GET /health
- Connexion au service depuis NestJS via appel HTTP interne
- Dockerfile pour le service IA

## Dependance
A faire apres validation de l'issue de specification IA.

## Branche
`feature/ia-service-init`""",
        "labels": ["ia"],
        "milestone": "M7 — Agent IA",
    },
    {
        "title": "[IA] Implementer les fonctionnalites IA definies",
        "body": """## Objectif
Developper les fonctionnalites retenues lors de la phase de specification.

## Taches
A completer apres validation de l'issue de specification.

## Dependance
Issues : specification IA + initialisation service IA

## Branche
`feature/ia-implementation`""",
        "labels": ["ia"],
        "milestone": "M7 — Agent IA",
    },
    {
        "title": "[IA] Integrer l'agent IA dans les portails IHM",
        "body": """## Objectif
Exposer les capacites de l'agent IA dans l'interface utilisateur.

## Taches
A completer selon les fonctionnalites definies dans la specification.

## Dependance
Issue : implementation IA

## Branche
`feature/ia-integration-ui`""",
        "labels": ["ia"],
        "milestone": "M7 — Agent IA",
    },
]

def create_issue(issue):
    cmd = [
        "gh", "issue", "create",
        "--repo", REPO,
        "--title", issue["title"],
        "--body", issue["body"],
        "--milestone", issue["milestone"],
    ]
    for label in issue["labels"]:
        cmd += ["--label", label]

    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if result.returncode == 0:
        url = result.stdout.strip()
        print(f"  OK  {issue['title'][:60]}")
        print(f"      {url}")
    else:
        print(f"  FAIL  {issue['title'][:60]}")
        print(f"        {result.stderr.strip()}")

print(f"\nCreation de {len(issues)} issues sur {REPO}\n")
for i, issue in enumerate(issues, 1):
    print(f"[{i}/{len(issues)}]", end=" ")
    create_issue(issue)

print("\nTermine.")
