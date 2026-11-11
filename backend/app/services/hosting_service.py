import re
import shutil
import uuid
import json
import base64
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks

from app.core.config import settings
from app.database.session import SessionLocal
from app.models.prototype import Prototype
from app.models.instance import HostedInstance
from app.models.configuration import Configuration
from app.models.user import User
from app.services.git_service import GitRepositoryService
from app.services.vscode_service import VSCodeIntegrationService
from app.services.branding_service import BrandingService, BrandingError, LOGO_DATA_URL, LOGO_EXT
from app.services.r2_storage_service import r2_service

logger = logging.getLogger(__name__)

# Ignored directories and files for security and cleanliness
EXCLUDED_PATTERNS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    ".env",
    ".env.local",
    ".DS_Store",
    "Thumbs.db",
    "dist",
    "build",
}


class PrototypeCopyService:
    @staticmethod
    def safe_copy_prototype(source_dir: Path, target_dir: Path, extra_exclude=None):
        """
        Safely copies the prototype template to an isolated target directory,
        strictly omitting secrets, git metadata, and build artifacts.
        """
        if not source_dir.exists():
            raise FileNotFoundError(f"Source prototype directory not found: {source_dir}")
        extra = set(extra_exclude or [])

        if target_dir.exists():
            shutil.rmtree(target_dir)

        target_dir.mkdir(parents=True, exist_ok=True)

        for item in source_dir.rglob("*"):
            rel_path = item.relative_to(source_dir)

            # Check if any parent or the item name matches excluded patterns
            if any(part in EXCLUDED_PATTERNS for part in rel_path.parts):
                continue
            # Prototype-specific exclusions (relative to the prototype root), e.g. build output, internal notes
            if extra and rel_path.parts[0] in extra:
                continue

            target_path = target_dir / rel_path
            if item.is_dir():
                target_path.mkdir(parents=True, exist_ok=True)
            else:
                target_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, target_path)


def slugify(name: str) -> str:
    """'DealFlow Enterprise CRM' -> 'dealflow-enterprise-crm' (used as the folder/repo name)."""
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "prototype"


class RuntimeKitService:
    KIT_DIR_NAME = "_runtime"

    @classmethod
    def apply(cls, target_dir: Path, layout: Dict[str, Any]):
        kit = settings.PROTOTYPES_DIR / cls.KIT_DIR_NAME
        if not kit.exists():
            logger.warning(f"Runtime kit not found at {kit}; instance will not auto-run")
            return

        frontend_dir = layout["frontend_dir"]
        for item in kit.rglob("*"):
            rel = item.relative_to(kit)
            if item.is_dir() or rel.name == "RUN_SECTION.md":
                continue
            if rel.parts[0] == "frontend":
                if not layout["scaffold"]:
                    continue
                rel = Path(frontend_dir, *rel.parts[1:])
            dest = target_dir / rel
            if dest.exists():
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, dest)

        (target_dir / "run.json").write_text(
            json.dumps({"frontend": frontend_dir, "backend": layout["backend_dir"]}, indent=2) + "\n",
            encoding="utf-8",
        )

        section = kit / "RUN_SECTION.md"
        readme = target_dir / "README.md"
        if section.exists():
            run_text = section.read_text(encoding="utf-8")
            existing = readme.read_text(encoding="utf-8") if readme.exists() else ""
            readme.write_text(run_text + existing, encoding="utf-8")


def read_layout(metadata_json: Optional[str]) -> Dict[str, Any]:
    """Layout of a prototype from its prototype.json, with defaults for the classic frontend/ + backend/ shape."""
    try:
        meta = json.loads(metadata_json) if metadata_json else {}
    except ValueError:
        meta = {}
    raw = meta.get("layout") or {}
    return {
        "frontend_dir": raw.get("frontend_dir", "frontend"),
        "backend_dir": raw.get("backend_dir", "backend") if "backend_dir" in raw else "backend",
        "scaffold": raw.get("scaffold", True),
        "exclude": list(raw.get("exclude", [])),
    }


class HostingService:
    def __init__(self):
        self.git_service = GitRepositoryService()

    @staticmethod
    def serialize_instance(inst: HostedInstance, proto_name: Optional[str] = None) -> Dict[str, Any]:
        """Maps HostedInstance model to dictionary matching HostedInstanceResponse."""
        vscode_url = VSCodeIntegrationService.generate_vscode_clone_url(inst.repository_url) if inst.repository_url else None
        vscode_open_url = VSCodeIntegrationService.generate_vscode_open_folder_url(inst.instance_path) if inst.instance_path else None
        clone_cmd = VSCodeIntegrationService.generate_git_clone_command(inst.repository_url) if inst.repository_url else None

        return {
            "id": inst.id,
            "instance_id": inst.instance_id,
            "user_id": inst.user_id,
            "prototype_id": inst.prototype_id,
            "prototype_name": proto_name or inst.app_name or inst.prototype_id,
            "app_name": inst.app_name,
            "notification_email": inst.notification_email,
            "primary_color": inst.primary_color,
            "secondary_color": inst.secondary_color,
            "logo_storage_key": inst.logo_storage_key,
            "customization_json": inst.customization_json,
            "deployment_status": inst.deployment_status or "DRAFT",
            "vercel_deployment_id": inst.vercel_deployment_id,
            "live_url": inst.live_url,
            "build_error": inst.build_error,
            "deployed_at": inst.deployed_at,
            "instance_path": inst.instance_path,
            "repository_url": inst.repository_url or "",
            "vscode_clone_url": vscode_url,
            "vscode_open_folder_url": vscode_open_url,
            "git_clone_command": clone_cmd,
            "status": inst.status,
            "created_at": inst.created_at,
            "updated_at": inst.updated_at,
        }

    def create_hosted_instance(
        self,
        db: Session,
        user: User,
        prototype_id: str,
        customization: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates a customized prototype instance:
        1. Validates prototype and branding input.
        2. Uploads logo (if provided) to Cloudflare R2 object storage.
        3. Initializes repository and sets up workspace folder.
        4. Saves instance record with full customization in DB.
        """
        prototype = db.query(Prototype).filter(Prototype.prototype_id == prototype_id).first()
        if not prototype:
            raise ValueError(f"Prototype '{prototype_id}' not found")

        source_path = Path(prototype.source_path)
        if not source_path.exists():
            raise FileNotFoundError(f"Source directory for prototype '{prototype_id}' does not exist on disk")

        # Validate branding up front
        clean_branding = BrandingService.validate(customization)
        stored_customization = BrandingService.storable(clean_branding)

        # Extract notification email
        notification_email = (
            (customization or {}).get("notification_email")
            or (customization or {}).get("notificationEmail")
            or (user.email if user else None)
        )

        instance_id = f"inst-{uuid.uuid4().hex[:10]}"
        project_name = slugify(prototype.name)
        layout = read_layout(prototype.metadata_json)

        # Handle Logo upload to Cloudflare R2
        logo_storage_key = None
        logo_raw = clean_branding.get("logo")
        if logo_raw:
            m = LOGO_DATA_URL.match(logo_raw)
            if m:
                ext = LOGO_EXT[m.group(1)]
                logo_bytes = base64.b64decode(m.group(2))
                logo_storage_key = f"instances/{instance_id}/logo.{ext}"
                try:
                    r2_service.upload_bytes(logo_bytes, logo_storage_key, f"image/{m.group(1)}")
                    logger.info(f"Uploaded instance logo to R2: {logo_storage_key}")
                except Exception as e:
                    logger.warning(f"R2 logo upload failed, continuing with fallback: {e}")

        # Setup local instance workspace directory for direct VS Code / developer cloning
        instances_base_dir = settings.GENERATED_DIR / "hosted-instances"
        instance_root = instances_base_dir / instance_id
        instance_path = instance_root / project_name

        try:
            instance_root.mkdir(parents=True, exist_ok=True)
            PrototypeCopyService.safe_copy_prototype(source_path, instance_path, layout["exclude"])
            RuntimeKitService.apply(instance_path, layout)

            # Apply branding
            BrandingService.apply(instance_path, clean_branding, layout["frontend_dir"])
            with open(instance_path / "customization.json", "w", encoding="utf-8") as f:
                json.dump(stored_customization, f, indent=2)

            # Git repository provisioning
            repo_url = self.git_service.provision_instance_repository(
                instance_id=instance_id,
                prototype_id=prototype_id,
                working_dir=instance_path,
                project_name=project_name,
                user_name=user.name,
                user_email=user.email
            )

            # Save DB record
            app_name = clean_branding.get("app_name") or prototype.name
            hosted_inst = HostedInstance(
                instance_id=instance_id,
                user_id=user.id,
                prototype_id=prototype_id,
                app_name=app_name,
                notification_email=notification_email,
                primary_color=clean_branding.get("primary_color"),
                secondary_color=clean_branding.get("secondary_color"),
                logo_storage_key=logo_storage_key,
                customization_json=json.dumps(stored_customization),
                deployment_status="DRAFT",
                instance_path=str(instance_path.resolve()),
                repository_url=repo_url,
                status="active"
            )
            db.add(hosted_inst)
            db.flush()

            cfg = Configuration(
                instance_id=hosted_inst.id,
                configuration_json=json.dumps(stored_customization)
            )
            db.add(cfg)

            db.commit()
            db.refresh(hosted_inst)

            return self.serialize_instance(hosted_inst, prototype.name)

        except Exception as e:
            db.rollback()
            if instance_root.exists():
                try:
                    shutil.rmtree(instance_root)
                except Exception as cleanup_err:
                    logger.warning(f"Failed to cleanup directory {instance_root}: {cleanup_err}")
            logger.error(f"Hosting creation failed for {instance_id}: {e}")
            raise

    def start_deployment(
        self,
        db: Session,
        background_tasks: BackgroundTasks,
        user: User,
        instance_id: str
    ) -> Dict[str, Any]:
        """
        Triggers an automated background build and deployment to Vercel.
        """
        from app.services.build_engine_service import BuildEngineService

        query = db.query(HostedInstance).filter(HostedInstance.instance_id == instance_id)
        if user.role != "admin":
            query = query.filter(HostedInstance.user_id == user.id)
        inst = query.first()

        if not inst:
            raise ValueError(f"Instance '{instance_id}' not found or access unauthorized")

        inst.deployment_status = "PENDING"
        inst.build_error = None
        db.commit()
        db.refresh(inst)

        # Trigger background execution
        background_tasks.add_task(
            BuildEngineService.execute_build_and_deploy,
            SessionLocal,
            instance_id
        )

        proto = db.query(Prototype).filter(Prototype.prototype_id == inst.prototype_id).first()
        proto_name = proto.name if proto else inst.app_name
        return self.serialize_instance(inst, proto_name)

    def redeploy_instance(
        self,
        db: Session,
        background_tasks: BackgroundTasks,
        user: User,
        instance_id: str,
        customization: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Updates instance customization if provided and triggers re-deployment.
        """
        from app.services.build_engine_service import BuildEngineService

        query = db.query(HostedInstance).filter(HostedInstance.instance_id == instance_id)
        if user.role != "admin":
            query = query.filter(HostedInstance.user_id == user.id)
        inst = query.first()

        if not inst:
            raise ValueError(f"Instance '{instance_id}' not found or access unauthorized")

        if customization:
            clean_branding = BrandingService.validate(customization)
            stored_customization = BrandingService.storable(clean_branding)

            if clean_branding.get("app_name"):
                inst.app_name = clean_branding["app_name"]
            if clean_branding.get("primary_color"):
                inst.primary_color = clean_branding["primary_color"]
            if clean_branding.get("secondary_color"):
                inst.secondary_color = clean_branding["secondary_color"]

            if clean_branding.get("logo"):
                m = LOGO_DATA_URL.match(clean_branding["logo"])
                if m:
                    ext = LOGO_EXT[m.group(1)]
                    logo_bytes = base64.b64decode(m.group(2))
                    logo_storage_key = f"instances/{instance_id}/logo.{ext}"
                    r2_service.upload_bytes(logo_bytes, logo_storage_key, f"image/{m.group(1)}")
                    inst.logo_storage_key = logo_storage_key

            inst.customization_json = json.dumps(stored_customization)

        inst.deployment_status = "PENDING"
        inst.build_error = None
        db.commit()
        db.refresh(inst)

        background_tasks.add_task(
            BuildEngineService.execute_build_and_deploy,
            SessionLocal,
            instance_id
        )

        proto = db.query(Prototype).filter(Prototype.prototype_id == inst.prototype_id).first()
        proto_name = proto.name if proto else inst.app_name
        return self.serialize_instance(inst, proto_name)

    def get_source_zip_path(self, db: Session, instance_id: str, user_id: Optional[int] = None) -> Path:
        """
        Retrieves the clean downloadable source code ZIP for the instance.
        Fetches from R2 if present, or packages on-the-fly.
        """
        from app.services.build_engine_service import BuildEngineService

        query = db.query(HostedInstance).filter(HostedInstance.instance_id == instance_id)
        if user_id is not None:
            query = query.filter(HostedInstance.user_id == user_id)
        inst = query.first()
        if not inst:
            raise ValueError(f"Instance '{instance_id}' not found")

        exports_dir = settings.EXPORTS_DIR
        exports_dir.mkdir(parents=True, exist_ok=True)
        target_zip = exports_dir / f"{instance_id}_source.zip"

        # Check local cache first
        if target_zip.exists():
            return target_zip

        # Try downloading from R2
        r2_key = f"instances/{instance_id}/source.zip"
        if r2_service.download_file(r2_key, target_zip):
            return target_zip

        # If not in R2, package from workspace or source path
        source_dir = None
        if inst.instance_path and Path(inst.instance_path).exists():
            source_dir = Path(inst.instance_path)
        else:
            proto = db.query(Prototype).filter(Prototype.prototype_id == inst.prototype_id).first()
            if proto and Path(proto.source_path).exists():
                source_dir = Path(proto.source_path)

        if not source_dir or not source_dir.exists():
            raise FileNotFoundError(f"Source files for instance {instance_id} are unavailable")

        return BuildEngineService.package_and_store_source_zip(source_dir, instance_id)

    def delete_instance(self, db: Session, instance_id: str, user_id: Optional[int] = None) -> bool:
        """
        Deletes instance record, associated files, and R2 assets.
        """
        query = db.query(HostedInstance).filter(HostedInstance.instance_id == instance_id)
        if user_id is not None:
            query = query.filter(HostedInstance.user_id == user_id)
        inst = query.first()
        if not inst:
            return False

        # Clean local workspace
        if inst.instance_path:
            inst_root = Path(inst.instance_path).parent
            if inst_root.exists() and inst_root.name.startswith("inst-"):
                try:
                    shutil.rmtree(inst_root)
                except Exception as e:
                    logger.warning(f"Error removing workspace directory: {e}")

        # Clean R2 assets
        if inst.logo_storage_key:
            r2_service.delete_object(inst.logo_storage_key)
        r2_service.delete_object(f"instances/{instance_id}/source.zip")

        db.delete(inst)
        db.commit()
        return True

    @staticmethod
    def get_user_instances(db: Session, user_id: int) -> List[Dict[str, Any]]:
        instances = db.query(HostedInstance).filter(HostedInstance.user_id == user_id).order_by(HostedInstance.created_at.desc()).all()
        result = []
        for inst in instances:
            proto = db.query(Prototype).filter(Prototype.prototype_id == inst.prototype_id).first()
            proto_name = proto.name if proto else inst.app_name or inst.prototype_id
            result.append(HostingService.serialize_instance(inst, proto_name))
        return result

    @staticmethod
    def get_instance_by_id(db: Session, instance_id: str, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        query = db.query(HostedInstance).filter(HostedInstance.instance_id == instance_id)
        if user_id is not None:
            query = query.filter(HostedInstance.user_id == user_id)
        inst = query.first()
        if not inst:
            return None

        proto = db.query(Prototype).filter(Prototype.prototype_id == inst.prototype_id).first()
        proto_name = proto.name if proto else inst.app_name or inst.prototype_id
        return HostingService.serialize_instance(inst, proto_name)

    @staticmethod
    def get_instance_source_files(db: Session, instance_id: str) -> Dict[str, Any]:
        """
        Retrieves formatted source files of the customized instance for the interactive code viewer.
        """
        inst = db.query(HostedInstance).filter(HostedInstance.instance_id == instance_id).first()
        if not inst:
            raise ValueError(f"Instance '{instance_id}' not found")

        files = []
        base_dir = None
        if inst.instance_path and Path(inst.instance_path).exists():
            base_dir = Path(inst.instance_path)
        else:
            proto = db.query(Prototype).filter(Prototype.prototype_id == inst.prototype_id).first()
            if proto and Path(proto.source_path).exists():
                base_dir = Path(proto.source_path)

        if base_dir and base_dir.exists():
            candidates = [
                ("branding.json", "json"),
                ("App.jsx", "javascript"),
                ("App.js", "javascript"),
                ("App.tsx", "typescript"),
                ("index.html", "html"),
                ("index.css", "css"),
                ("package.json", "json"),
            ]
            for file_name, lang in candidates:
                for match in base_dir.rglob(file_name):
                    if any(p in ("node_modules", "dist", ".git", ".venv") for p in match.parts):
                        continue
                    rel = match.relative_to(base_dir).as_posix()
                    if not any(f["path"] == rel for f in files):
                        try:
                            content = match.read_text(encoding="utf-8", errors="replace")
                            files.append({
                                "name": match.name,
                                "path": rel,
                                "language": lang,
                                "content": content
                            })
                        except Exception:
                            pass

        if not any(f["name"] == "branding.json" for f in files):
            branding_data = {
                "appName": inst.app_name,
                "companyName": inst.app_name,
                "primaryColor": inst.primary_color or "#E91D2B",
                "secondaryColor": inst.secondary_color or "#171A24",
                "logo": "/logo.png" if inst.logo_storage_key else None
            }
            files.insert(0, {
                "name": "branding.json",
                "path": "src/branding.json",
                "language": "json",
                "content": json.dumps(branding_data, indent=2)
            })

        return {
            "instance_id": inst.instance_id,
            "app_name": inst.app_name,
            "primary_color": inst.primary_color,
            "secondary_color": inst.secondary_color,
            "live_url": inst.live_url,
            "deployment_status": inst.deployment_status,
            "files": files
        }
