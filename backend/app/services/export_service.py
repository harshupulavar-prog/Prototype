import shutil
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.instance import HostedInstance
from app.models.export import ExportHistory

logger = logging.getLogger(__name__)


class ExportService:
    @staticmethod
    def create_instance_export(db: Session, user_id: int, instance_id: str) -> ExportHistory:
        inst = db.query(HostedInstance).filter(
            HostedInstance.instance_id == instance_id,
            HostedInstance.user_id == user_id
        ).first()

        if not inst:
            raise ValueError(f"Hosted instance '{instance_id}' not found or access denied")

        instance_path = Path(inst.instance_path)
        if not instance_path.exists():
            raise FileNotFoundError(f"Instance path on disk does not exist: {instance_path}")

        exports_dir = settings.GENERATED_DIR / "exports"
        exports_dir.mkdir(parents=True, exist_ok=True)

        timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        archive_base = exports_dir / f"{instance_id}_{timestamp_str}"

        # Create zip archive without including .git folder
        archive_path = shutil.make_archive(
            base_name=str(archive_base),
            format="zip",
            root_dir=str(instance_path)
        )

        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        export_url = f"/api/export/download/{Path(archive_path).name}"

        export_rec = ExportHistory(
            instance_id=inst.id,
            user_id=user_id,
            export_url=export_url,
            status="ready",
            expires_at=expires_at,
        )
        db.add(export_rec)
        db.commit()
        db.refresh(export_rec)

        logger.info(f"Created export for {instance_id} at {archive_path}")
        return export_rec
