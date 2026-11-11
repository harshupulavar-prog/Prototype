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

    # Cloudflare R2 Storage Settings
    R2_ACCOUNT_ID: str = os.getenv("R2_ACCOUNT_ID", "")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME", "nexus-prototypes")
    R2_ENDPOINT_URL: str = os.getenv("R2_ENDPOINT_URL", "")
    R2_PUBLIC_URL: str = os.getenv("R2_PUBLIC_URL", "")

    # Vercel Deployment Settings
    VERCEL_TOKEN: str = os.getenv("VERCEL_TOKEN", "")
    VERCEL_PROJECT_ID: str = os.getenv("VERCEL_PROJECT_ID", "")
    VERCEL_TEAM_ID: str = os.getenv("VERCEL_TEAM_ID", "")

    # Storage fallback dir for local mode
    R2_STORAGE_DIR: Path = BASE_DIR / "generated" / "r2-storage"

    # SMTP Email Notification Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "noreply@prototypehub.io")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "Nexus Platform")

    # Email simulation directory for local mode
    EMAILS_DIR: Path = BASE_DIR / "generated" / "emails"

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.HOSTED_INSTANCES_DIR.mkdir(parents=True, exist_ok=True)
settings.GIT_REPOS_DIR.mkdir(parents=True, exist_ok=True)
settings.PROTOTYPES_DIR.mkdir(parents=True, exist_ok=True)
settings.R2_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.EMAILS_DIR.mkdir(parents=True, exist_ok=True)
