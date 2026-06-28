from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    anthropic_api_key: str
    database_url: str = "sqlite+aiosqlite:///./jobs.db"
    model_score: str = "claude-sonnet-4-6"
    model_tailor: str = "claude-sonnet-4-6"
    model_cover: str = "claude-opus-4-8"
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
