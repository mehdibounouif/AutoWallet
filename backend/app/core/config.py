from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_backend_dir = Path(__file__).resolve().parents[2]
_root_dir = _backend_dir.parent

class Settings(BaseSettings):
    """Pydantic configuration with validation and sensible defaults."""
    database_url: str = "sqlite:///./flowpay.db"
    secret_key: str = "dev-secret-change-me-later"
    redis_url: str = "redis://localhost:6379/0"

    # AI Module Settings
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    ai_model: str = "gpt-4o-mini"
    ai_rate_limit_per_minute: int = 20

    model_config = SettingsConfigDict(
        env_file=(_root_dir / ".env", _backend_dir / ".env", ".env"),
        extra="ignore",
    )

settings = Settings()
