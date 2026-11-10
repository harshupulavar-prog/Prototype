import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Root directory of PrototypeHub
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "PrototypeHub"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "protohub_enterprise_super_secret_jwt_key_2026_xyz")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database: SQLite by default for zero-setup friction, or PostgreSQL via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'prototypehub.db'}")

    # Paths
    PROTOTYPES_DIR: Path = BASE_DIR / "prototypes"
    GENERATED_DIR: Path = BASE_DIR / "generated"
    HOSTED_INSTANCES_DIR: Path = BASE_DIR / "generated" / "hosted-instances"
    GIT_REPOS_DIR: Path = BASE_DIR / "generated" / "git-repos"
    EXPORTS_DIR: Path = BASE_DIR / "generated" / "exports"

    # Public URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.HOSTED_INSTANCES_DIR.mkdir(parents=True, exist_ok=True)
settings.GIT_REPOS_DIR.mkdir(parents=True, exist_ok=True)
settings.PROTOTYPES_DIR.mkdir(parents=True, exist_ok=True)
