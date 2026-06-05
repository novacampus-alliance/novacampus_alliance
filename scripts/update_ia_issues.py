import subprocess

REPO = "Meckagameers85/novacampus_alliance"

def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if result.returncode != 0:
        print(f"  FAIL: {result.stderr.strip()}")
    return result

# ── 1. Fermer #38 (spec générique — décision prise) ──────────────────────────
print("[1/8] Fermeture de #38 (spec generique) avec commentaire...")
run([
    "gh", "issue", "comment", "38", "--repo", REPO,
    "--body",
    "Decision prise par l'equipe : l'agent IA sera un **Agent de Relance Financiere Intelligente**.\n\n"
    "Perimetre retenu :\n"
    "- Surveillance de la table PAYMENTS et detection des retards\n"
    "- Generation de relances personnalisees via LLM (ton adapte au profil + historique de relances)\n"
    "- Proposition d'echeanciers adaptes\n"
    "- Escalade automatique vers un gestionnaire humain au-dela d'un seuil configurable\n\n"
    "Les issues de specification sont remplacees par des issues d'implementation detaillees dans M7.\n"
    "Fermeture de cette issue de cadrage."
])
run(["gh", "issue", "close", "38", "--repo", REPO])

# ── 2. Fermer #40 (implementation vague) ─────────────────────────────────────
print("[2/8] Fermeture de #40 (implementation vague)...")
run([
    "gh", "issue", "comment", "40", "--repo", REPO,
    "--body",
    "Remplacee par des issues d'implementation specifiques a l'agent de relance financiere.\n"
    "Voir les nouvelles issues M7 creees dans le cadre de la decision d'equipe."
])
run(["gh", "issue", "close", "40", "--repo", REPO])

# ── 3. Mettre a jour #39 (init service) ──────────────────────────────────────
print("[3/8] Mise a jour de #39 (init service IA)...")
run([
    "gh", "issue", "edit", "39", "--repo", REPO,
    "--title", "[IA] Initialiser le service Python FastAPI + LangChain",
    "--body",
    """## Contexte
L'agent IA retenu est un **Agent de Relance Financiere Intelligente** (voir decision d'equipe).
Ce service est le socle technique sur lequel toutes les fonctionnalites IA seront construites.

## Objectif
Mettre en place le squelette du service IA isole et fonctionnel.

## Taches
- Initialiser le projet FastAPI dans `ai-service/`
- Installer LangChain, langchain-openai et les dependances (voir requirements.txt)
- Configurer Pydantic Settings (cles API, URLs MongoDB/Redis)
- Endpoint de sante GET /health
- Connexion HTTP interne depuis NestJS vers le service IA
- Dockerfile + integration dans docker-compose.yml
- Variables d'environnement documentees dans `.env.example`

## Branche
`feature/ia-service-init`"""
])

# ── 4. Mettre a jour #41 (integration portail) ───────────────────────────────
print("[4/8] Mise a jour de #41 (integration portail admin)...")
run([
    "gh", "issue", "edit", "41", "--repo", REPO,
    "--title", "[IA] Portail Administration — suivi et validation des relances generees",
    "--body",
    """## Objectif
Exposer les capacites de l'agent de relance dans le portail Administration.

## Taches
- Page `/admin/relances` : liste des relances generees par l'agent
- Affichage du brouillon de relance avec le ton choisi par l'agent
- Bouton "Valider et envoyer" / "Modifier" / "Ignorer"
- Indicateur du niveau de relance (1re, 2e, 3e) et du statut d'escalade
- Badge visuel sur les dossiers en escalade vers un gestionnaire humain
- Lien vers la fiche etudiant et l'historique de paiement

## Branche
`feature/ia-portail-relances`

## Dependance
Toutes les issues M7 d'implementation doivent etre terminees."""
])

# ── 5. Nouvelle issue : detection des retards ────────────────────────────────
print("[5/8] Creation : detection des retards de paiement...")
run([
    "gh", "issue", "create", "--repo", REPO,
    "--title", "[IA] Detection automatique des retards de paiement",
    "--body",
    """## Objectif
Mettre en place le mecanisme de surveillance de la table PAYMENTS pour detecter les retards.

## Logique
- Un paiement est "en retard" si `Date_Echeance < today` et `Statut != 'Paye'`
- Niveaux de retard :
  - Niveau 1 : 1 a 7 jours de retard
  - Niveau 2 : 8 a 30 jours de retard
  - Niveau 3 : plus de 30 jours de retard → escalade automatique

## Taches
- Endpoint FastAPI : `GET /api/v1/relances/a-traiter` (liste des paiements en retard avec niveau)
- Cron job NestJS ou appel depuis le service IA (a arbitrer)
- Calcul du niveau de retard et enrichissement du contexte (profil etudiant, historique relances)
- Stockage de l'etat dans MongoDB (nb relances envoyees, derniere date, niveau actuel)

## Branche
`feature/ia-detection-retards`

## Dependance
Issue #39 (init service IA)""",
    "--label", "ia",
    "--milestone", "M7 — Agent IA",
])

# ── 6. Nouvelle issue : generation de relances personnalisees ─────────────────
print("[6/8] Creation : generation de relances personnalisees...")
run([
    "gh", "issue", "create", "--repo", REPO,
    "--title", "[IA] Generation de relances personnalisees via LLM",
    "--body",
    """## Objectif
Generer automatiquement des emails de relance personnalises en fonction du profil etudiant
et de l'historique des relances precedentes.

## Logique de personnalisation
| Niveau | Ton | Contenu |
|--------|-----|---------|
| 1re relance | Courtois, bienveillant | Simple rappel, propose un contact |
| 2e relance | Ferme, professionnel | Rappel des consequences, propose un echeancier |
| 3e relance | Formel, urgent | Mise en demeure, escalade imminente |

## Taches
- Prompt engineering LangChain avec variables : nom, montant, echeance, nb relances, programme
- Endpoint FastAPI : `POST /api/v1/relances/generer` → retourne le brouillon de l'email
- Stockage du brouillon en MongoDB (statut : en_attente_validation)
- Support de plusieurs langues si necessaire (fr par defaut)
- Tests avec differents profils pour valider la coherence du ton

## Branche
`feature/ia-generation-relances`

## Dependance
Issue detection des retards""",
    "--label", "ia",
    "--milestone", "M7 — Agent IA",
])

# ── 7. Nouvelle issue : proposition d'echeanciers ────────────────────────────
print("[7/8] Creation : proposition d'echeanciers...")
run([
    "gh", "issue", "create", "--repo", REPO,
    "--title", "[IA] Proposition d'echeanciers adaptes par l'agent",
    "--body",
    """## Objectif
Permettre a l'agent de proposer automatiquement un echeancier de remboursement adapte
au montant du, au profil de l'etudiant et a son historique de paiement.

## Logique
- Calcul automatique de 2 ou 3 propositions d'echeancier (ex: 2x, 3x, 4x)
- Prise en compte du montant restant et de la date de fin d'annee academique
- L'echeancier propose est inclus dans la relance de niveau 2

## Taches
- Endpoint FastAPI : `POST /api/v1/relances/echeancier` → retourne les propositions
- Logique de calcul (pure Python, pas besoin de LLM)
- Affichage des propositions dans le portail Administration
- Si accepte par l'admin : creation des echeances dans la table PAYMENTS via NestJS

## Branche
`feature/ia-echeanciers`

## Dependance
Issue generation de relances""",
    "--label", "ia",
    "--milestone", "M7 — Agent IA",
])

# ── 8. Nouvelle issue : escalade automatique ─────────────────────────────────
print("[8/8] Creation : escalade automatique vers l'humain...")
run([
    "gh", "issue", "create", "--repo", REPO,
    "--title", "[IA] Escalade automatique vers un gestionnaire humain",
    "--body",
    """## Objectif
Au-dela d'un seuil configurable, l'agent cesse d'envoyer des relances automatiques
et transfere le dossier a un gestionnaire humain avec un resume complet.

## Seuil par defaut
- Niveau 3 (plus de 30 jours de retard) OU 3 relances sans reponse → escalade

## Taches
- Logique de declenchement de l'escalade dans le service IA
- Generation d'un resume de dossier (LangChain) : historique, montant, relances envoyees
- Notification au gestionnaire via le Svc Notification (Mail + alerte in-app)
- Changement de statut du paiement : `escalade_humain`
- Dashboard admin : vue dediee des dossiers en escalade
- Seuil configurable via variable d'environnement (`ESCALADE_SEUIL_JOURS`, `ESCALADE_SEUIL_RELANCES`)

## Branche
`feature/ia-escalade`

## Dependance
Issue generation de relances + Svc Notification (M5)""",
    "--label", "ia",
    "--milestone", "M7 — Agent IA",
])

print("\nTermine. Resume :")
print("  - #38 ferme (spec generique)")
print("  - #40 ferme (implementation vague)")
print("  - #39 mis a jour (init service)")
print("  - #41 mis a jour (portail admin relances)")
print("  - 4 nouvelles issues creees (detection, generation, echeanciers, escalade)")
