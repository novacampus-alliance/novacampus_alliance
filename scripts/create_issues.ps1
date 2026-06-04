$repo = "Meckagameers85/novacampus_alliance"

function New-Issue($title, $body, $labels, $milestone) {
    gh issue create --repo $repo --title $title --body $body --label $labels --milestone $milestone
}

# ─── M1 — Infrastructure & Setup ────────────────────────────

New-Issue `
  "Initialiser la structure du monorepo" `
  "## Objectif`nMettre en place l'arborescence de base du projet.`n`n## Taches`n- Creer les dossiers racine : frontend/, backend/, ai-service/, prisma/, docker/, docs/`n- Initialiser Next.js 14 dans frontend/`n- Initialiser NestJS dans backend/`n- Initialiser FastAPI dans ai-service/`n- Ajouter les .gitignore par service`n- Verifier que tout se compile`n`n## Branche`nfeature/init-monorepo" `
  "infrastructure" 1

New-Issue `
  "Configurer Docker Compose (PostgreSQL, MongoDB, Redis)" `
  "## Objectif`nMettre en place l'environnement de developpement local via Docker Compose.`n`n## Taches`n- Creer docker-compose.yml a la racine`n- Service PostgreSQL (port 5432)`n- Service MongoDB (port 27017)`n- Service Redis (port 6379)`n- Volumes persistants pour chaque base`n- Variables d'environnement via .env`n- Verifier que docker compose up fonctionne`n`n## Branche`nfeature/docker-setup" `
  "infrastructure,database" 1

New-Issue `
  "Configurer Prisma ORM et le schema relationnel complet" `
  "## Objectif`nInitialiser Prisma avec PostgreSQL et definir le schema relationnel base sur la base de donnees fournie.`n`n## Taches`n- Installer Prisma dans backend/`n- Configurer DATABASE_URL dans .env`n- Definir les modeles : Campus, Programme, Enseignant, Etudiant, Cours, Salle, Batiment, Planning, Inscription, Note, Paiement, Facture, Notification, Utilisateur`n- Creer la premiere migration`n- Verifier la connexion a PostgreSQL`n`n## Branche`nfeature/prisma-schema" `
  "database,backend" 1

New-Issue `
  "Mettre en place le CI/CD GitHub Actions (deploiement VPS IONOS)" `
  "## Objectif`nAutomatiser le deploiement sur le VPS IONOS a chaque merge sur production.`n`n## Taches`n- Creer le workflow .github/workflows/deploy.yml`n- Connexion SSH au VPS via secrets GitHub`n- Pull de la branche production sur le serveur`n- Rebuild Docker Compose en production`n- Tester un deploiement complet de bout en bout`n`n## Branche`nfeature/cicd-pipeline" `
  "infrastructure" 1

New-Issue `
  "Configurer les branch protection rules (main + production)" `
  "## Objectif`nSecuriser les branches principales pour imposer le workflow de revue de code.`n`n## Taches`n- Activer Require a pull request sur main`n- Activer Require approvals (1 reviewer minimum)`n- Activer Dismiss stale PR approvals`n- Repliquer les memes regles sur production`n- Documenter le workflow dans le README`n`n## Note`nConfiguration directe dans GitHub Settings > Branches > Branch protection rules" `
  "infrastructure" 1

New-Issue `
  "Creer les templates d'environnement (.env.example)" `
  "## Objectif`nFournir des fichiers .env.example pour chaque service.`n`n## Taches`n- frontend/.env.example (NEXT_PUBLIC_API_URL, etc.)`n- backend/.env.example (DATABASE_URL, JWT_SECRET, REDIS_URL, etc.)`n- ai-service/.env.example (OPENAI_API_KEY ou equivalent, etc.)`n- Documenter chaque variable dans les fichiers`n`n## Branche`nfeature/env-templates" `
  "infrastructure" 1

# ─── M2 — Svc Académique ────────────────────────────────────

New-Issue `
  "Authentification JWT — login, logout, gestion des roles" `
  "## Objectif`nImplementer le systeme d'authentification avec JWT et gestion des roles (Etudiant, Enseignant, Administration, Direction).`n`n## Taches`n- Module Auth dans NestJS (login/logout)`n- Generation et validation du JWT`n- Guards NestJS par role`n- Hash des mots de passe (bcrypt)`n- Middleware Next.js pour proteger les routes frontend`n`n## Branche`nfeature/auth-jwt" `
  "backend" 2

New-Issue `
  "Module Campus — CRUD et gestion multi-campus" `
  "## Objectif`nGerer les campus du groupe (creation, modification, consultation).`n`n## Taches`n- Endpoints REST : GET /campus, GET /campus/:id, POST /campus, PUT /campus/:id`n- Validation des donnees (class-validator)`n- Liaison avec Adresse, Batiment, Programme, Etudiant, Enseignant`n`n## Branche`nfeature/module-campus" `
  "backend" 2

New-Issue `
  "Module Programmes — CRUD des filieres et formations" `
  "## Objectif`nGerer les programmes academiques (licence, master, etc.) par campus.`n`n## Taches`n- Endpoints REST CRUD pour Programme`n- Champs : Nom, Type, Duree_Annees, Frais_Annuels, Campus_ID, Dept_ID`n- Relation avec Cours et Etudiants`n`n## Branche`nfeature/module-programmes" `
  "backend" 2

New-Issue `
  "Module Enseignants — CRUD et affectation aux cours" `
  "## Objectif`nGerer les enseignants et intervenants du groupe.`n`n## Taches`n- Endpoints REST CRUD pour Enseignant`n- Liaison avec Personne (heritage)`n- Champs : Specialisation, Date_Embauche, Dept_ID, Campus_ID`n- Consultation de la liste des cours affectes`n`n## Branche`nfeature/module-enseignants" `
  "backend" 2

New-Issue `
  "Module Etudiants — CRUD et dossier academique" `
  "## Objectif`nGerer les etudiants inscrits dans le groupe.`n`n## Taches`n- Endpoints REST CRUD pour Etudiant`n- Liaison avec Personne (heritage)`n- Champs : Annee_Inscription, Campus_ID, Program_ID, Statut`n- Consultation du dossier academique complet (notes, absences, inscriptions)`n`n## Branche`nfeature/module-etudiants" `
  "backend" 2

New-Issue `
  "Module Cours — CRUD et affectation enseignant/programme" `
  "## Objectif`nGerer le catalogue de cours.`n`n## Taches`n- Endpoints REST CRUD pour Cours`n- Champs : Nom, Code, Semestre, Credits, Heures, Program_ID, Instructor_ID`n- Relation avec Planning et Inscription`n`n## Branche`nfeature/module-cours" `
  "backend" 2

New-Issue `
  "Module Salles et Batiments — CRUD et disponibilite" `
  "## Objectif`nGerer les salles, leurs batiments et equipements.`n`n## Taches`n- Endpoints REST CRUD pour Salle et Batiment`n- Champs Salle : Nom, Etage, Capacite, Type, Batiment_ID`n- Endpoint GET /salles/disponibles?jour=&heure= pour verifier la dispo`n`n## Branche`nfeature/module-salles" `
  "backend" 2

New-Issue `
  "Module Plannings — gestion des emplois du temps" `
  "## Objectif`nCreer et consulter les plannings de cours par campus, filiere ou enseignant.`n`n## Taches`n- Endpoints REST CRUD pour Planning (Sched)`n- Champs : Course_ID, Instructor_ID, Room_ID, Jour, Heure_Debut, Heure_Fin`n- Endpoint GET /plannings?campus=&semaine= pour l'affichage EDT`n`n## Branche`nfeature/module-plannings" `
  "backend" 2

New-Issue `
  "Detection automatique des conflits de salles" `
  "## Objectif`nEmpêcher la double reservation d'une salle sur le meme creneau.`n`n## Taches`n- Logique de verification a la creation/modification d'un planning`n- Retourner une erreur explicite si conflit detecte`n- Endpoint GET /plannings/conflits pour lister les conflits existants`n- Tests unitaires sur la logique de conflit`n`n## Branche`nfeature/conflit-salles" `
  "backend" 2

New-Issue `
  "Module Inscriptions — enrolement etudiant aux cours" `
  "## Objectif`nGerer les inscriptions des etudiants aux cours.`n`n## Taches`n- Endpoints REST CRUD pour Inscription (Enr)`n- Champs : Student_ID, Course_ID, Note_Finale, Taux_Presence, Statut, Annee_Acad`n- Verification des prerequis et de la capacite`n`n## Branche`nfeature/module-inscriptions" `
  "backend" 2

New-Issue `
  "Module Notes et Absences — saisie et consultation" `
  "## Objectif`nPermettre aux enseignants de saisir notes et absences, et aux etudiants de les consulter.`n`n## Taches`n- Endpoint PUT /inscriptions/:id/note (saisie note finale)`n- Endpoint PUT /inscriptions/:id/presence (saisie taux presence)`n- Endpoint GET /etudiants/:id/notes`n- Endpoint GET /etudiants/:id/absences`n- Guard : seul l'enseignant du cours ou l'admin peut saisir`n`n## Branche`nfeature/notes-absences" `
  "backend" 2

# ─── M3 — Svc Facturation ────────────────────────────────────

New-Issue `
  "Module Paiements — CRUD et suivi des statuts" `
  "## Objectif`nGerer les paiements des etudiants.`n`n## Taches`n- Endpoints REST CRUD pour Paiement`n- Champs : Student_ID, Date_Emission, Date_Echeance, Montant, Statut, Date_Paiement`n- Endpoint GET /paiements?statut=en_retard pour filtrer`n`n## Branche`nfeature/module-paiements" `
  "facturation,backend" 3

New-Issue `
  "Generation automatique des factures a l'inscription" `
  "## Objectif`nGenerer automatiquement une facture lors de l'inscription d'un etudiant a un programme.`n`n## Taches`n- Hook NestJS sur l'evenement d'inscription`n- Calcul du montant base sur les frais annuels du programme`n- Creation de l'entite Paiement avec statut 'En attente'`n- Stockage du document facture en MongoDB`n`n## Branche`nfeature/generation-factures" `
  "facturation,backend" 3

New-Issue `
  "Suivi des encaissements et gestion des echeanciers" `
  "## Objectif`nPermettre le suivi des paiements recus et la gestion des echeanciers.`n`n## Taches`n- Endpoint POST /paiements/:id/confirmer (marquer comme paye)`n- Support des paiements en plusieurs echeances`n- Calcul automatique du solde restant`n- Historique complet des paiements par etudiant`n`n## Branche`nfeature/suivi-encaissements" `
  "facturation,backend" 3

New-Issue `
  "Systeme de relances automatiques (paiements en retard)" `
  "## Objectif`nEnvoyer automatiquement des relances pour les paiements dont la date d'echeance est depassee.`n`n## Taches`n- Job cron NestJS (verif quotidienne des echeances depassees)`n- Generer une notification de relance (voir M5)`n- Mettre a jour le statut du paiement en 'En retard'`n- Log des relances envoyees`n`n## Branche`nfeature/relances-automatiques" `
  "facturation,backend" 3

# ─── M4 — Portails IHM ───────────────────────────────────────

New-Issue `
  "Portail Etudiant — Emploi du temps" `
  "## Objectif`nAfficher l'emploi du temps de l'etudiant connecte avec les modifications en temps reel.`n`n## Taches`n- Page /etudiant/planning`n- Vue calendrier hebdomadaire (librairie a choisir)`n- Indicateur visuel en cas de changement de salle`n- Responsive mobile`n`n## Branche`nfeature/portail-etudiant-planning" `
  "frontend" 4

New-Issue `
  "Portail Etudiant — Notes, absences et releve academique" `
  "## Objectif`nPermettre a l'etudiant de consulter ses notes, absences et son releve de parcours.`n`n## Taches`n- Page /etudiant/notes`n- Tableau par cours : note finale, taux de presence, statut`n- Page /etudiant/releve (historique complet)`n- Export PDF du releve`n`n## Branche`nfeature/portail-etudiant-notes" `
  "frontend" 4

New-Issue `
  "Portail Etudiant — Factures et paiements" `
  "## Objectif`nPermettre a l'etudiant de consulter ses factures et l'etat de ses paiements.`n`n## Taches`n- Page /etudiant/factures`n- Liste des factures avec statut (paye, en attente, en retard)`n- Detail d'une facture`n- Telechargement de la facture PDF`n`n## Branche`nfeature/portail-etudiant-factures" `
  "frontend" 4

New-Issue `
  "Portail Enseignant — Saisie des notes et absences" `
  "## Objectif`nPermettre a l'enseignant de saisir les notes et absences pour ses cours.`n`n## Taches`n- Page /enseignant/cours/:id/notes`n- Tableau des etudiants inscrits avec champ de saisie note`n- Saisie du taux de presence par etudiant`n- Sauvegarde et confirmation`n`n## Branche`nfeature/portail-enseignant-notes" `
  "frontend" 4

New-Issue `
  "Portail Enseignant — Gestion des cours et planning" `
  "## Objectif`nPermettre a l'enseignant de consulter ses cours affectes et son emploi du temps.`n`n## Taches`n- Page /enseignant/cours (liste des cours affectes)`n- Page /enseignant/planning (vue calendrier)`n- Detail d'un cours (etudiants inscrits, statistiques)`n`n## Branche`nfeature/portail-enseignant-cours" `
  "frontend" 4

New-Issue `
  "Portail Administration — Gestion des inscriptions et dossiers etudiants" `
  "## Objectif`nPermettre a l'administration de gerer les inscriptions et les dossiers.`n`n## Taches`n- Page /admin/etudiants (liste, recherche, filtres)`n- Creation et modification d'un dossier etudiant`n- Gestion des inscriptions aux programmes et cours`n- Export des listes`n`n## Branche`nfeature/portail-admin-inscriptions" `
  "frontend" 4

New-Issue `
  "Portail Administration — Gestion des plannings et conflits" `
  "## Objectif`nPermettre a l'administration de gerer les plannings et de resoudre les conflits de salles.`n`n## Taches`n- Page /admin/plannings (vue globale multi-campus)`n- Creation et modification de creneaux`n- Vue des conflits detectes avec suggestion de resolution`n- Affectation manuelle d'une salle alternative`n`n## Branche`nfeature/portail-admin-plannings" `
  "frontend" 4

New-Issue `
  "Portail Administration — Suivi paiements et relances" `
  "## Objectif`nPermettre a l'administration de suivre les paiements et de declencher des relances.`n`n## Taches`n- Page /admin/paiements (tableau de bord financier)`n- Filtres : campus, statut, periode`n- Declenchement manuel d'une relance`n- Vue des echeances a venir`n`n## Branche`nfeature/portail-admin-paiements" `
  "frontend" 4

# ─── M5 — Svc Notification ───────────────────────────────────

New-Issue `
  "Implementer le service de notifications (Mail / Push)" `
  "## Objectif`nConstruire le service de notifications multicanal.`n`n## Taches`n- Module Notification dans NestJS`n- Integration d'un provider email (ex: Resend ou Nodemailer)`n- Structure de l'entite Notification (User_ID, Type, Message, Date_Envoi, Lu)`n- Endpoint GET /notifications pour l'utilisateur connecte`n- Endpoint PUT /notifications/:id/lire`n`n## Branche`nfeature/service-notifications" `
  "notification,backend" 5

New-Issue `
  "Notifications automatiques — changements d'emploi du temps" `
  "## Objectif`nNotifier les etudiants et enseignants lors d'un changement de salle ou d'horaire.`n`n## Taches`n- Hook sur la modification d'un Planning`n- Envoyer une notification in-app + email aux personnes concernees`n- Message clair : ancien vs nouveau creneau`n`n## Branche`nfeature/notif-edt" `
  "notification,backend" 5

New-Issue `
  "Notifications automatiques — rappels deadlines et paiements en retard" `
  "## Objectif`nEnvoyer des rappels automatiques avant les echeances importantes.`n`n## Taches`n- Cron job : J-3 avant echeance de paiement → notification etudiant`n- Cron job : J-7 avant fin de periode d'inscription`n- Notification lors du passage en statut 'En retard'`n`n## Branche`nfeature/notif-rappels" `
  "notification,backend" 5

# ─── M6 — Dashboard Direction & KPIs ────────────────────────

New-Issue `
  "Dashboard Direction — KPIs consolides par campus" `
  "## Objectif`nAfficher les indicateurs cles de performance consolides pour la direction.`n`n## Taches`n- Page /direction/dashboard`n- KPIs : nombre etudiants actifs, taux d'occupation des salles, taux de reussite global`n- Filtres par campus et par periode`n- Mise a jour en temps reel ou near-realtime`n`n## Branche`nfeature/dashboard-kpis" `
  "kpi,frontend" 6

New-Issue `
  "Dashboard Direction — Taux de reussite et occupation par filiere" `
  "## Objectif`nFournir une analyse detaillee par programme et filiere.`n`n## Taches`n- Graphiques : taux de reussite par cours / programme`n- Graphiques : taux d'occupation des salles par batiment`n- Comparaison inter-campus`n- Export des donnees en CSV`n`n## Branche`nfeature/dashboard-filieres" `
  "kpi,frontend" 6

New-Issue `
  "Dashboard Direction — Rapports financiers (revenus, impayes)" `
  "## Objectif`nProduire des rapports financiers consolides pour le pilotage.`n`n## Taches`n- Vue revenus par campus et par periode`n- Suivi des impayes et du taux de recouvrement`n- Graphiques d'evolution mensuelle`n- Export PDF du rapport`n`n## Branche`nfeature/dashboard-finances" `
  "kpi,frontend" 6

# ─── M7 — Agent IA (réservé) ────────────────────────────────

New-Issue `
  "[IA] Definir le perimetre et les fonctionnalites de l'agent IA" `
  "## Objectif`nAligner l'equipe sur le perimetre exact de l'agent IA avant tout developpement.`n`n## Questions a trancher`n- Quel processus metier l'agent va-t-il couvrir ?`n- Fonctionnalites retenues (RAG, prediction, chatbot, relances intelligentes...)`n- Modele LLM utilise (OpenAI, Mistral, local ?)`n- Perimetre des donnees accessibles par l'agent`n`n## Resultat attendu`nUn document de specification valide par l'equipe." `
  "ia" 7

New-Issue `
  "[IA] Initialiser le service Python FastAPI + LangChain" `
  "## Objectif`nMettre en place le squelette du service IA isole.`n`n## Taches`n- Initialiser le projet FastAPI dans ai-service/`n- Installer LangChain et les dependances`n- Endpoint de test GET /health`n- Connexion au service depuis NestJS (appel HTTP interne)`n- Dockerfile pour le service IA`n`n## Branche`nfeature/ia-service-init`n`n## Dependance`nA faire apres validation de l'issue de specification." `
  "ia" 7

New-Issue `
  "[IA] Implementer les fonctionnalites IA definies" `
  "## Objectif`nDevelopper les fonctionnalites retenues lors de la phase de specification.`n`n## Taches`nA completer apres validation de l'issue de specification.`n`n## Branche`nfeature/ia-implementation" `
  "ia" 7

New-Issue `
  "[IA] Integrer l'agent IA dans les portails IHM" `
  "## Objectif`nExposer les capacites de l'agent IA dans l'interface utilisateur.`n`n## Taches`nA completer selon les fonctionnalites definies.`n`n## Branche`nfeature/ia-integration-ui" `
  "ia" 7

Write-Host "Toutes les issues ont ete creees avec succes."
