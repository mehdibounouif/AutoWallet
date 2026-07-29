from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """ Pydantic = validates inputs."""
    database_url: str
    secret_key: str

    class Config:
        env_file = ".env"

settings = Settings()
