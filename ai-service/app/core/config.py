from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Novacampus AI Service"
    DEBUG: bool = False

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "novacampus_ai"

    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
