from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """ Pydantic = validates inputs."""
    database_url: str
    secret_key: str
    redis_url: str
    bank_simulator_url: str
    poll_interval_seconds: int = 60
    # Email for the GDPR confirmations (app/gdpr). In development: Mailpit on localhost:1025.
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_from: str = "AutoWallet <no-reply@autowallet.local>"
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str

    class Config:
        env_file = ".env"

settings = Settings()
