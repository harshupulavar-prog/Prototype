import re
import shutil
import uuid
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.prototype import Prototype
from app.models.instance import HostedInstance
from app.models.configuration import Configuration
from app.models.user import User
from app.services.git_service import GitRepositoryService
from app.services.vscode_service import VSCodeIntegrationService
from app.services.branding_service import BrandingService, BrandingError

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
    """
    Adds the 'run automatically' kit (run.py, VS Code auto-run task, .gitignore,
    run instructions) from prototypes/_runtime/ to a hosted copy.

    Layout comes from the prototype's prototype.json ("layout"):
      frontend_dir  folder holding the frontend (default "frontend")
      backend_dir   folder holding the FastAPI backend, or null if there is none
      scaffold      add the Vite/Tailwind scaffold if the prototype lacks one (default true)
    Files the prototype already ships are never overwritten.
    """
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

    def create_hosted_instance(
        self,
        db: Session,
        user: User,
        prototype_id: str,
        customization: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates an isolated hosted instance:
        1. Checks prototype exists in database/filesystem.
        2. Generates unique instance ID.
        3. Copies code to generated/hosted-instances/{instance_id}.
        4. Applies configuration file (customization.json).
        5. Initializes Git repo and commits source code.
        6. Generates VS Code link and clone command.
        7. Saves record transactionally in database.
        """
        prototype = db.query(Prototype).filter(Prototype.prototype_id == prototype_id).first()
        if not prototype:
            raise ValueError(f"Prototype '{prototype_id}' not found")

        source_path = Path(prototype.source_path)
        if not source_path.exists():
            raise FileNotFoundError(f"Source directory for prototype '{prototype_id}' does not exist on disk")

        # Validate branding up front so bad input never touches disk
        clean_branding = BrandingService.validate(customization)
        stored_customization = BrandingService.storable(clean_branding)

        # Generate unique instance ID
        instance_id = f"inst-{uuid.uuid4().hex[:10]}"
        project_name = slugify(prototype.name)
        layout = read_layout(prototype.metadata_json)
        instances_base_dir = settings.GENERATED_DIR / "hosted-instances"
        # Unique parent per instance; the folder the user opens is named after the prototype.
        instance_root = instances_base_dir / instance_id
        instance_path = instance_root / project_name

        try:
            # Step 1: Safe copy
            logger.info(f"Copying prototype {prototype_id} to {instance_path}")
            instance_root.mkdir(parents=True, exist_ok=True)
            PrototypeCopyService.safe_copy_prototype(source_path, instance_path, layout["exclude"])
            RuntimeKitService.apply(instance_path, layout)

            # Step 2: Apply branding (name, colors, logo) and record the choices
            BrandingService.apply(instance_path, clean_branding, layout["frontend_dir"])
            with open(instance_path / "customization.json", "w", encoding="utf-8") as f:
                json.dump(stored_customization, f, indent=2)

            # Step 3: Git provisioning
            logger.info(f"Provisioning Git repository for {instance_id}")
            repo_url = self.git_service.provision_instance_repository(
                instance_id=instance_id,
                prototype_id=prototype_id,
                working_dir=instance_path,
                project_name=project_name,
                user_name=user.name,
                user_email=user.email
            )

            # Step 4: Generate VS Code integration URLs
            vscode_clone_url = VSCodeIntegrationService.generate_vscode_clone_url(repo_url)
            vscode_open_folder_url = VSCodeIntegrationService.generate_vscode_open_folder_url(str(instance_path.resolve()))
            git_clone_command = VSCodeIntegrationService.generate_git_clone_command(repo_url)

            # Step 5: Save to DB
            hosted_inst = HostedInstance(
                instance_id=instance_id,
                user_id=user.id,
                prototype_id=prototype_id,
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

            return {
                "id": hosted_inst.id,
                "instance_id": hosted_inst.instance_id,
                "user_id": hosted_inst.user_id,
                "prototype_id": hosted_inst.prototype_id,
                "prototype_name": prototype.name,
                "instance_path": hosted_inst.instance_path,
                "repository_url": repo_url,
                "vscode_clone_url": vscode_clone_url,
                "vscode_open_folder_url": vscode_open_folder_url,
                "git_clone_command": git_clone_command,
                "status": hosted_inst.status,
                "created_at": hosted_inst.created_at,
                "updated_at": hosted_inst.updated_at,
            }

        except Exception as e:
            db.rollback()
            # Clean up incomplete files
            if instance_root.exists():
                try:
                    shutil.rmtree(instance_root)
                except Exception as cleanup_err:
                    logger.warning(f"Failed to cleanup directory {instance_root}: {cleanup_err}")
            logger.error(f"Hosting creation failed for {instance_id}: {e}")
            raise

    @staticmethod
    def get_user_instances(db: Session, user_id: int) -> List[Dict[str, Any]]:
        instances = db.query(HostedInstance).filter(HostedInstance.user_id == user_id).order_by(HostedInstance.created_at.desc()).all()
        result = []
        for inst in instances:
            proto = db.query(Prototype).filter(Prototype.prototype_id == inst.prototype_id).first()
            proto_name = proto.name if proto else inst.prototype_id
            vscode_url = VSCodeIntegrationService.generate_vscode_clone_url(inst.repository_url)
            vscode_open_url = VSCodeIntegrationService.generate_vscode_open_folder_url(inst.instance_path)
            clone_cmd = VSCodeIntegrationService.generate_git_clone_command(inst.repository_url)

            result.append({
                "id": inst.id,
                "instance_id": inst.instance_id,
                "user_id": inst.user_id,
                "prototype_id": inst.prototype_id,
                "prototype_name": proto_name,
                "instance_path": inst.instance_path,
                "repository_url": inst.repository_url,
                "vscode_clone_url": vscode_url,
                "vscode_open_folder_url": vscode_open_url,
                "git_clone_command": clone_cmd,
                "status": inst.status,
                "created_at": inst.created_at,
                "updated_at": inst.updated_at,
            })
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
        proto_name = proto.name if proto else inst.prototype_id
        vscode_url = VSCodeIntegrationService.generate_vscode_clone_url(inst.repository_url)
        vscode_open_url = VSCodeIntegrationService.generate_vscode_open_folder_url(inst.instance_path)
        clone_cmd = VSCodeIntegrationService.generate_git_clone_command(inst.repository_url)

        return {
            "id": inst.id,
            "instance_id": inst.instance_id,
            "user_id": inst.user_id,
            "prototype_id": inst.prototype_id,
            "prototype_name": proto_name,
            "instance_path": inst.instance_path,
            "repository_url": inst.repository_url,
            "vscode_clone_url": vscode_url,
            "vscode_open_folder_url": vscode_open_url,
            "git_clone_command": clone_cmd,
            "status": inst.status,
            "created_at": inst.created_at,
            "updated_at": inst.updated_at,
        }
