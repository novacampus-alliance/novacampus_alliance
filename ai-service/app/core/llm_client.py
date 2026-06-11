from langchain_core.language_models.chat_models import BaseChatModel

from app.core.config import settings


def get_chat_model() -> BaseChatModel:
    provider = settings.LLM_PROVIDER

    if provider == "groq":
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY manquante")
        from langchain_groq import ChatGroq

        return ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.3,
        )

    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY manquante")
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.3,
        )

    if provider == "ollama":
        from langchain_community.chat_models import ChatOllama

        return ChatOllama(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL,
            temperature=0.3,
        )

    raise ValueError(f"Provider LLM non supporté pour génération : {provider}")


def get_active_model_name() -> str | None:
    provider = settings.LLM_PROVIDER
    if provider == "groq":
        return settings.GROQ_MODEL
    if provider == "openai":
        return settings.OPENAI_MODEL
    if provider == "ollama":
        return settings.OLLAMA_MODEL
    return None
