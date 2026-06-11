from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings
from app.core.llm_client import get_active_model_name, get_chat_model
from app.schemas.conflict import Suggestion

SYSTEM_PROMPT = """Tu es l'assistant planning de Novacampus Alliance.
Tu aides les administrateurs à résoudre les conflits d'emploi du temps (EDT).

Contraintes :
- Rédiger en français, ton professionnel et concis
- 120 à 220 mots maximum
- Décrire le conflit puis présenter les options numérotées fournies
- Ne jamais inventer de salles, horaires ou cours non listés dans les options
- Terminer par une recommandation claire (option préférée et pourquoi)
- Répondre uniquement avec le texte explicatif, sans titre ni commentaire meta"""


def _format_suggestion(index: int, suggestion: Suggestion) -> str:
    if suggestion.type == "change_room":
        return (
            f"Option {index} : déplacer « {suggestion.target_course_name or 'le cours'} » "
            f"vers {suggestion.proposed_room_name} (confiance {suggestion.confidence}). "
            f"{suggestion.impact}"
        )
    if suggestion.type == "change_instructor":
        return (
            f"Option {index} : réassigner « {suggestion.target_course_name or 'le cours'} » "
            f"à {suggestion.proposed_instructor_name} (confiance {suggestion.confidence}). "
            f"{suggestion.impact}"
        )
    return (
        f"Option {index} : reporter « {suggestion.target_course_name or 'le cours'} » "
        f"au jour {suggestion.proposed_day_of_week} "
        f"{suggestion.proposed_start_time}-{suggestion.proposed_end_time} "
        f"(confiance {suggestion.confidence}). {suggestion.impact}"
    )


def _build_user_prompt(
    conflict_summary: str,
    suggestions: list[Suggestion],
) -> str:
    options = "\n".join(
        _format_suggestion(i + 1, s) for i, s in enumerate(suggestions)
    )
    return (
        f"Conflit détecté :\n{conflict_summary}\n\n"
        f"Options structurées à présenter :\n{options or 'Aucune salle alternative disponible.'}"
    )


def generate_template_explanation(
    conflict_summary: str,
    suggestions: list[Suggestion],
) -> str:
    if not suggestions:
        return (
            f"{conflict_summary}\n\n"
            "Aucune salle libre n'a été fournie pour ce créneau. "
            "Veuillez consulter l'EDT manuellement ou créer une nouvelle salle."
        )

    lines = [conflict_summary, "", "Solutions proposées :"]
    for i, suggestion in enumerate(suggestions, start=1):
        lines.append(_format_suggestion(i, suggestion))

    best = suggestions[0]
    if best.type == "change_room":
        reco = (
            f"\nRecommandation : privilégier le déplacement vers "
            f"{best.proposed_room_name} (solution la plus simple)."
        )
    else:
        reco = "\nRecommandation : valider manuellement le nouveau créneau avant application."

    return "\n".join(lines) + reco


async def explain_conflict(
    conflict_summary: str,
    suggestions: list[Suggestion],
) -> tuple[str, str, str | None]:
    """Retourne (explication, provider, model)."""
    provider = settings.LLM_PROVIDER

    if provider == "template":
        return (
            generate_template_explanation(conflict_summary, suggestions),
            provider,
            None,
        )

    try:
        llm = get_chat_model()
        response = await llm.ainvoke(
            [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(
                    content=_build_user_prompt(conflict_summary, suggestions)
                ),
            ]
        )
        content = response.content
        if isinstance(content, list):
            content = "".join(str(part) for part in content)
        return str(content).strip(), provider, get_active_model_name()
    except Exception:
        return (
            generate_template_explanation(conflict_summary, suggestions),
            "template",
            None,
        )
