import os
import sys
import shutil
import subprocess
import tempfile
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.instance import HostedInstance
from app.models.prototype import Prototype
from app.services.branding_service import BrandingService
from app.services.r2_storage_service import r2_service
from app.services.vercel_service import vercel_service
from app.services.email_service import email_service
from app.services.hosting_service import PrototypeCopyService, RuntimeKitService, read_layout

logger = logging.getLogger(__name__)


class BuildError(Exception):
    """Raised when an automated build fails."""
    pass


class BuildEngineService:
    """
    Automated Build & Deployment Engine.
    Executes in isolated temporary directories without mutating original prototype templates.
    Handles dependency installation, build bundling, Vercel deployment, and R2 artifact storage.
    """

    @classmethod
    def execute_build_and_deploy(
        cls,
        db_factory,
        instance_id: str,
    ) -> Dict[str, Any]:
        """
        Background task entry point for building and hosting an instance.
        Uses db_factory (SessionLocal) to open a fresh DB session for the background thread.
        """
        db: Session = db_factory()
        try:
            inst = db.query(HostedInstance).filter(HostedInstance.instance_id == instance_id).first()
            if not inst:
                logger.error(f"Cannot run build: Instance '{instance_id}' not found in database.")
                return {"status": "FAILED", "error": "Instance not found"}

            inst.deployment_status = "BUILDING"
            inst.build_error = None
            db.commit()

            proto = db.query(Prototype).filter(Prototype.prototype_id == inst.prototype_id).first()
            if not proto:
                inst.deployment_status = "FAILED"
                inst.build_error = f"Prototype '{inst.prototype_id}' metadata not found."
                db.commit()
                return {"status": "FAILED", "error": inst.build_error}

            source_path = Path(proto.source_path)
            if not source_path.exists():
                inst.deployment_status = "FAILED"
                inst.build_error = f"Prototype source directory '{source_path}' does not exist on disk."
                db.commit()
                return {"status": "FAILED", "error": inst.build_error}

            # Run build in isolated temporary folder
            result = cls._run_isolated_build_pipeline(inst=inst, proto=proto, source_path=source_path)

            if result["status"] == "READY":
                inst.deployment_status = "READY"
                inst.live_url = result["live_url"]
                inst.vercel_deployment_id = result.get("deployment_id")
                inst.build_error = None
                inst.deployed_at = datetime.now(timezone.utc)
                db.commit()

                # Dispatch deployment notification email
                recipient_email = inst.notification_email or (inst.user.email if inst.user else None)
                if recipient_email:
                    workspace_url = f"{settings.FRONTEND_URL}/hosted/{inst.instance_id}"
                    download_url = f"{settings.BACKEND_URL}/api/prototypes/instances/{inst.instance_id}/download"
                    try:
                        email_service.send_deployment_ready_email(
                            to_email=recipient_email,
                            instance_id=inst.instance_id,
                            app_name=inst.app_name or proto.name,
                            live_url=inst.live_url or workspace_url,
                            workspace_url=workspace_url,
                            download_url=download_url,
                            branding_info={
                                "primary_color": inst.primary_color,
                                "secondary_color": inst.secondary_color
                            }
                        )
                    except Exception as mail_err:
                        logger.warning(f"Could not deliver deployment email: {mail_err}")
            else:
                inst.deployment_status = "FAILED"
                inst.build_error = result.get("error", "Unknown build error")
                db.commit()
            return result

        except Exception as e:
            logger.error(f"Fatal error during build pipeline for {instance_id}: {e}", exc_info=True)
            try:
                inst = db.query(HostedInstance).filter(HostedInstance.instance_id == instance_id).first()
                if inst:
                    inst.deployment_status = "FAILED"
                    inst.build_error = str(e)
                    db.commit()
            except Exception:
                pass
            return {"status": "FAILED", "error": str(e)}
        finally:
            db.close()

    @classmethod
    def _run_isolated_build_pipeline(
        cls,
        inst: HostedInstance,
        proto: Prototype,
        source_path: Path
    ) -> Dict[str, Any]:
        """
        Executes the build pipeline inside an ephemeral temporary directory.
        """
        layout = read_layout(proto.metadata_json)
        app_name = inst.app_name or proto.name

        with tempfile.TemporaryDirectory(prefix=f"nexus-build-{inst.instance_id}-") as temp_dir_str:
            temp_dir = Path(temp_dir_str)
            logger.info(f"Created isolated build directory: {temp_dir}")

            # 1. Copy source code safely into temp dir
            PrototypeCopyService.safe_copy_prototype(source_path, temp_dir, layout.get("exclude"))
            RuntimeKitService.apply(temp_dir, layout)

            # 2. Inject branding configuration
            clean_branding = {
                "app_name": app_name,
                "primary_color": inst.primary_color,
                "secondary_color": inst.secondary_color,
                "logo_storage_key": inst.logo_storage_key,
            }
            BrandingService.apply(temp_dir, clean_branding, layout["frontend_dir"])

            # 3. Create clean downloadable source code ZIP archive and store in R2
            cls.package_and_store_source_zip(temp_dir, inst.instance_id)

            # 4. Resolve frontend directory for building
            frontend_dir = temp_dir / layout["frontend_dir"]
            if not frontend_dir.exists() and (temp_dir / "app").exists():
                frontend_dir = temp_dir / "app"
            elif not frontend_dir.exists():
                frontend_dir = temp_dir

            logger.info(f"Frontend directory identified at: {frontend_dir}")

            # 5. Check if pre-built distribution directory already exists (e.g. built-website)
            candidate_dist = None
            if (frontend_dir / "dist").exists() and (frontend_dir / "dist" / "index.html").exists():
                candidate_dist = frontend_dir / "dist"
            elif (temp_dir / "built-website").exists() and (temp_dir / "built-website" / "index.html").exists():
                candidate_dist = temp_dir / "built-website"

            # 6. Execute npm build if package.json exists
            package_json = frontend_dir / "package.json"
            if package_json.exists():
                build_dist = cls._execute_npm_build(frontend_dir)
                if build_dist and build_dist.exists() and (build_dist / "index.html").exists():
                    candidate_dist = build_dist

            if not candidate_dist or not (candidate_dist / "index.html").exists():
                raise BuildError(f"Build output validation failed: 'index.html' not found in build directory.")

            logger.info(f"Build output validated successfully at {candidate_dist}")

            # 7. Upload to Vercel
            logger.info(f"Deploying build artifacts to Vercel for {inst.instance_id}...")
            deploy_result = vercel_service.deploy_directory(
                dist_dir=candidate_dist,
                app_name=app_name,
                instance_id=inst.instance_id
            )

            return deploy_result

    @classmethod
    def _execute_npm_build(cls, frontend_dir: Path) -> Path:
        """
        Executes npm install and npm run build inside the isolated frontend directory.
        """
        lock_file = frontend_dir / "package-lock.json"
        is_windows = sys.platform == "win32"
        npm_cmd = "npm.cmd" if is_windows else "npm"

        # Check if npm binary is found
        npm_bin = shutil.which(npm_cmd) or shutil.which("npm") or "npm"

        # 1. Install dependencies
        install_args = [npm_bin, "ci"] if lock_file.exists() else [npm_bin, "install", "--prefer-offline", "--no-audit"]
        logger.info(f"Running: {' '.join(install_args)} in {frontend_dir}")
        try:
            res_install = subprocess.run(
                install_args,
                cwd=str(frontend_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=240,
                shell=is_windows
            )
            if res_install.returncode != 0:
                logger.warning(f"npm install returned non-zero code {res_install.returncode}: {res_install.stderr[:500]}")
                # If ci failed, retry with install
                if "ci" in install_args:
                    logger.info("Retrying with 'npm install'...")
                    res_install = subprocess.run(
                        [npm_bin, "install", "--no-audit"],
                        cwd=str(frontend_dir),
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        timeout=240,
                        shell=is_windows
                    )
        except subprocess.TimeoutExpired:
            raise BuildError("Dependency installation timed out after 240 seconds.")
        except Exception as e:
            logger.warning(f"npm install error: {e}")

        # 2. Run build
        build_args = [npm_bin, "run", "build"]
        logger.info(f"Running: {' '.join(build_args)} in {frontend_dir}")
        try:
            res_build = subprocess.run(
                build_args,
                cwd=str(frontend_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=180,
                shell=is_windows
            )
            if res_build.returncode != 0:
                error_log = res_build.stderr or res_build.stdout or f"Build exited with code {res_build.returncode}"
                logger.error(f"Build failed:\n{error_log}")
                raise BuildError(f"npm run build failed: {error_log[-800:]}")
        except subprocess.TimeoutExpired:
            raise BuildError("npm run build timed out after 180 seconds.")

        dist_dir = frontend_dir / "dist"
        return dist_dir

    @classmethod
    def package_and_store_source_zip(cls, source_tree: Path, instance_id: str) -> Path:
        """
        Creates a clean ZIP archive of the customized source code
        (excluding node_modules, dist, .env, .git) and uploads to R2.
        """
        exports_dir = settings.EXPORTS_DIR
        exports_dir.mkdir(parents=True, exist_ok=True)
        zip_base = exports_dir / f"{instance_id}_source"

        # Temporary clean staging directory for ZIP
        with tempfile.TemporaryDirectory(prefix="zip-stage-") as stage_str:
            stage_dir = Path(stage_str)
            PrototypeCopyService.safe_copy_prototype(source_tree, stage_dir)
            archive_path = Path(shutil.make_archive(
                base_name=str(zip_base),
                format="zip",
                root_dir=str(stage_dir)
            ))

        # Upload to R2 under instances/{instance_id}/source.zip
        try:
            r2_key = f"instances/{instance_id}/source.zip"
            r2_service.upload_file(archive_path, r2_key, "application/zip")
            logger.info(f"Uploaded customized source ZIP to R2: {r2_key}")
        except Exception as e:
            logger.warning(f"Could not upload source zip to R2: {e}")

        return archive_path

