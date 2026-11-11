import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.base import Base
from app.database.session import engine, SessionLocal, run_migrations
import app.models  # Ensure all models are registered
from app.models.user import User
from app.core.security import get_password_hash
from app.services.prototype_service import PrototypeRegistryService

from app.api.auth import router as auth_router
from app.api.prototypes import router as prototypes_router
from app.api.hosting import router as hosting_router
from app.api.export import router as export_router
from app.api.health import router as health_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("prototypehub")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure directories, create tables, seed initial data
    logger.info("Initializing PrototypeHub backend...")
    settings.GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    (settings.GENERATED_DIR / "hosted-instances").mkdir(parents=True, exist_ok=True)
    (settings.GENERATED_DIR / "git-repos").mkdir(parents=True, exist_ok=True)
    (settings.GENERATED_DIR / "exports").mkdir(parents=True, exist_ok=True)

    Base.metadata.create_all(bind=engine)
    run_migrations()
    logger.info("Database tables initialized.")

    db = SessionLocal()
    try:
        # Seed default users
        demo_user = db.query(User).filter(User.email == "demo@prototypehub.io").first()
        if not demo_user:
            demo_user = User(
                name="Enterprise Developer",
                email="demo@prototypehub.io",
                password_hash=get_password_hash("password123"),
                role="developer"
            )
            db.add(demo_user)
            logger.info("Created default user: demo@prototypehub.io")

        admin_user = db.query(User).filter(User.email == "admin@prototypehub.io").first()
        if not admin_user:
            admin_user = User(
                name="Platform Admin",
                email="admin@prototypehub.io",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin_user)
            logger.info("Created admin user: admin@prototypehub.io")

        db.commit()

        # Seed/Sync prototypes from prototypes/ folder
        synced = PrototypeRegistryService.sync_prototypes_from_disk(db)
        logger.info(f"Registered {len(synced)} prototypes from disk.")
    except Exception as e:
        logger.error(f"Error during database startup seed: {e}")
        db.rollback()
    finally:
        db.close()

    yield

    logger.info("PrototypeHub backend shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Enterprise Prototype Management and Hosting Platform API",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(prototypes_router, prefix="/api")
app.include_router(hosting_router, prefix="/api")
app.include_router(export_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Welcome to PrototypeHub Enterprise API",
        "docs": "/docs",
        "health": "/api/health"
    }
