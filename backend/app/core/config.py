from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """ Pydantic = validates inputs."""
    database_url: str
    secret_key: str
    redis_url: str
    bank_simulator_url: str
    poll_interval_seconds: int = 60
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str

    # AI assistant (app/ai): any OpenAI-compatible API (Gemini, OpenRouter, OpenAI...)
    ai_api_key: str | None = None
    ai_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    ai_model: str = "gemini-3.5-flash-lite"

    class Config:
        env_file = ".env"

settings = Settings()
