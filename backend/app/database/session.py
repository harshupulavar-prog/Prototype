from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True if not settings.DATABASE_URL.startswith("sqlite") else False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Ensure database schema is up-to-date with newly added columns."""
    try:
        with engine.begin() as conn:
            if engine.dialect.name == "sqlite":
                result = conn.exec_driver_sql("PRAGMA table_info(hosted_instances);")
                existing_cols = {row[1] for row in result.fetchall()}
                if not existing_cols:
                    return
                cols_to_add = [
                    ("app_name", "VARCHAR(150)"),
                    ("notification_email", "VARCHAR(255)"),
                    ("primary_color", "VARCHAR(50)"),
                    ("secondary_color", "VARCHAR(50)"),
                    ("logo_storage_key", "VARCHAR(500)"),
                    ("customization_json", "TEXT"),
                    ("deployment_status", "VARCHAR(50) DEFAULT 'DRAFT'"),
                    ("vercel_deployment_id", "VARCHAR(200)"),
                    ("live_url", "VARCHAR(500)"),
                    ("build_error", "TEXT"),
                    ("deployed_at", "DATETIME"),
                ]
                for col_name, col_type in cols_to_add:
                    if col_name not in existing_cols:
                        conn.exec_driver_sql(f"ALTER TABLE hosted_instances ADD COLUMN {col_name} {col_type};")
            elif engine.dialect.name == "postgresql":
                cols_to_add = [
                    ("app_name", "VARCHAR(150)"),
                    ("notification_email", "VARCHAR(255)"),
                    ("primary_color", "VARCHAR(50)"),
                    ("secondary_color", "VARCHAR(50)"),
                    ("logo_storage_key", "VARCHAR(500)"),
                    ("customization_json", "TEXT"),
                    ("deployment_status", "VARCHAR(50) DEFAULT 'DRAFT'"),
                    ("vercel_deployment_id", "VARCHAR(200)"),
                    ("live_url", "VARCHAR(500)"),
                    ("build_error", "TEXT"),
                    ("deployed_at", "TIMESTAMP"),
                ]
                for col_name, col_type in cols_to_add:
                    conn.exec_driver_sql(f"ALTER TABLE hosted_instances ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
    except Exception as e:
        import logging
        logging.getLogger("prototypehub").warning(f"Database migration note: {e}")
