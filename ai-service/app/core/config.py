import json
from typing import List, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LlmProvider = Literal["groq", "openai", "ollama", "template"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    APP_NAME: str = "Novacampus AI Service"
    DEBUG: bool = False
    PORT: int = 8000

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    # Provider : groq | openai | ollama | template
    LLM_PROVIDER: LlmProvider = "template"

    # Groq (clés gsk_...) — https://console.groq.com
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # OpenAI (optionnel)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Ollama (dev local)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:1b"

    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "novacampus_ai"
    REDIS_URL: str = "redis://localhost:6379"
    BACKEND_URL: str = "http://localhost:3001"

    # Même secret que academic-service (validation JWT)
    JWT_SECRET: str = ""

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, value):
        if isinstance(value, str):
            return json.loads(value)
        return value

    def llm_configured(self) -> bool:
        if self.LLM_PROVIDER == "groq":
            return bool(self.GROQ_API_KEY)
        if self.LLM_PROVIDER == "openai":
            return bool(self.OPENAI_API_KEY)
        if self.LLM_PROVIDER == "ollama":
            return True
        return True


settings = Settings()
