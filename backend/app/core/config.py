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

    class Config:
        env_file = ".env"

settings = Settings()
