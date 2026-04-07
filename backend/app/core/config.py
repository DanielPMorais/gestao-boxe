import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GestaoBoxe"
    # Fallback to localhost if running outside docker
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://boxeadmin:boxepassword@localhost:5432/gestaoboxe_db"
    )

settings = Settings()
