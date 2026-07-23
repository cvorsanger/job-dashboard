from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    anthropic_api_key: Optional[str] = ""
    database_url: str = "sqlite+aiosqlite:///./jobs.db"
    model_sonnet_46: str = "claude-sonnet-4-6"
    model_cover: str = "claude-opus-4-8"
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()