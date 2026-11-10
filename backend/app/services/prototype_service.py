import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.prototype import Prototype

logger = logging.getLogger(__name__)

DEFAULT_BRANDING_FIELDS = ["app_name", "logo", "primary_color", "secondary_color"]


class PrototypeRegistryService:
    @staticmethod
    def sync_prototypes_from_disk(db: Session) -> List[Prototype]:
        """
        Scans the prototypes/ directory, reads prototype.json in each prototype folder,
        and registers/updates prototypes in the database.
        """
        prototypes_dir = settings.PROTOTYPES_DIR
        if not prototypes_dir.exists():
            logger.warning(f"Prototypes directory not found at {prototypes_dir}")
            return []

        synced = []
        for item in prototypes_dir.iterdir():
            if item.is_dir():
                meta_file = item / "prototype.json"
                if meta_file.exists():
                    try:
                        with open(meta_file, "r", encoding="utf-8") as f:
                            data = json.load(f)

                        p_id = data.get("id") or item.name
                        name = data.get("name") or item.name.replace("-", " ").title()
                        description = data.get("description", "")
                        category = data.get("category", "General")
                        version = data.get("version", "1.0.0")

                        # Check if exists in DB
                        db_proto = db.query(Prototype).filter(Prototype.prototype_id == p_id).first()
                        if not db_proto:
                            db_proto = Prototype(
                                prototype_id=p_id,
                                name=name,
                                description=description,
                                category=category,
                                version=version,
                                source_path=str(item.resolve()),
                                metadata_json=json.dumps(data),
                            )
                            db.add(db_proto)
                        else:
                            db_proto.name = name
                            db_proto.description = description
                            db_proto.category = category
                            db_proto.version = version
                            db_proto.source_path = str(item.resolve())
                            db_proto.metadata_json = json.dumps(data)

                        db.commit()
                        db.refresh(db_proto)
                        synced.append(db_proto)
                    except Exception as e:
                        logger.error(f"Error registering prototype in {item}: {e}")
                        db.rollback()

        return synced

    @staticmethod
    def list_prototypes(
        db: Session,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Prototype)
        if category and category.lower() != "all":
            query = query.filter(Prototype.category.ilike(f"%{category}%"))
        if search:
            query = query.filter(
                (Prototype.name.ilike(f"%{search}%")) |
                (Prototype.description.ilike(f"%{search}%")) |
                (Prototype.category.ilike(f"%{search}%"))
            )

        items = query.all()
        result = []
        for item in items:
            meta = {}
            if item.metadata_json:
                try:
                    meta = json.loads(item.metadata_json)
                except Exception:
                    pass

            result.append({
                "id": item.id,
                "prototype_id": item.prototype_id,
                "name": item.name,
                "description": item.description,
                "category": item.category,
                "version": item.version,
                "technologies": meta.get("technologies", []),
                "features": meta.get("features", []),
                "thumbnail": meta.get("thumbnail"),
                "screenshots": meta.get("screenshots", []),
                "branding_fields": meta.get("branding_fields", DEFAULT_BRANDING_FIELDS),
                "created_at": item.created_at,
            })
        return result

    @staticmethod
    def get_prototype_by_id(db: Session, prototype_id: str) -> Optional[Dict[str, Any]]:
        item = db.query(Prototype).filter(Prototype.prototype_id == prototype_id).first()
        if not item:
            return None

        meta = {}
        if item.metadata_json:
            try:
                meta = json.loads(item.metadata_json)
            except Exception:
                pass

        return {
            "id": item.id,
            "prototype_id": item.prototype_id,
            "name": item.name,
            "description": item.description,
            "category": item.category,
            "version": item.version,
            "technologies": meta.get("technologies", []),
            "features": meta.get("features", []),
            "thumbnail": meta.get("thumbnail"),
            "screenshots": meta.get("screenshots", []),
            "branding_fields": meta.get("branding_fields", DEFAULT_BRANDING_FIELDS),
            "source_path": item.source_path,
            "metadata": meta,
            "created_at": item.created_at,
        }
