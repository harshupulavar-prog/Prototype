import os
import time
import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


class VercelDeploymentService:
    """
    Manages automated deployments to Vercel via Vercel REST API (v2/v13).
    Uploads pre-built static files with SHA-1 hashing and creates production deployments.
    Includes graceful local development fallback when VERCEL_TOKEN is not configured.
    """

    BASE_URL = "https://api.vercel.com"

    def __init__(self):
        self.token = settings.VERCEL_TOKEN.strip() if settings.VERCEL_TOKEN else ""
        self.project_id = settings.VERCEL_PROJECT_ID.strip() if settings.VERCEL_PROJECT_ID else ""
        self.team_id = settings.VERCEL_TEAM_ID.strip() if settings.VERCEL_TEAM_ID else ""

    def is_configured(self) -> bool:
        """Checks if real Vercel deployment credentials are provided."""
        return bool(self.token)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
        }

    def _get_params(self) -> Dict[str, str]:
        params = {}
        if self.team_id:
            params["teamId"] = self.team_id
        return params

    def deploy_directory(
        self,
        dist_dir: Path,
        app_name: str,
        instance_id: str
    ) -> Dict[str, Any]:
        """
        Deploys a built dist directory to Vercel.
        Returns dictionary with:
          - deployment_id
          - live_url
          - status ("READY" or "FAILED")
          - error (if any)
        """
        if not dist_dir.exists() or not dist_dir.is_dir():
            raise FileNotFoundError(f"Build output directory not found at {dist_dir}")

        if not self.is_configured():
            logger.warning("VERCEL_TOKEN is not configured. Falling back to local development deployment simulation.")
            mock_url = f"{settings.FRONTEND_URL}/hosted/{instance_id}"
            return {
                "deployment_id": f"sim-{instance_id}",
                "live_url": mock_url,
                "status": "READY",
                "error": None,
                "message": "Local development simulation (configure VERCEL_TOKEN for live Vercel deployments)"
            }

        # Step 1: Scan and calculate SHA-1 for all files
        files_to_deploy = []
        for file_path in dist_dir.rglob("*"):
            if file_path.is_file():
                rel_path = file_path.relative_to(dist_dir).as_posix()
                content = file_path.read_bytes()
                sha1 = hashlib.sha1(content).hexdigest()
                files_to_deploy.append({
                    "path": file_path,
                    "rel_path": rel_path,
                    "sha": sha1,
                    "size": len(content),
                    "content": content
                })

        if not files_to_deploy:
            raise ValueError(f"No files found in build output directory {dist_dir}")

        logger.info(f"Uploading {len(files_to_deploy)} files to Vercel for instance {instance_id}...")

        # Step 2: Upload each file to Vercel file store
        upload_url = f"{self.BASE_URL}/v2/files"
        headers_base = self._get_headers()
        params = self._get_params()

        for item in files_to_deploy:
            upload_headers = {
                **headers_base,
                "Content-Type": "application/octet-stream",
                "x-vercel-digest": item["sha"],
                "Content-Length": str(item["size"])
            }
            try:
                res = requests.post(
                    upload_url,
                    headers=upload_headers,
                    params=params,
                    data=item["content"],
                    timeout=30
                )
                # 200: created, 409: already exists (both are valid)
                if res.status_code not in (200, 409):
                    logger.warning(f"File upload status {res.status_code} for {item['rel_path']}: {res.text}")
            except Exception as e:
                logger.error(f"Error uploading file {item['rel_path']} to Vercel: {e}")
                raise

        # Step 3: Create Vercel Deployment
        deploy_url = f"{self.BASE_URL}/v13/deployments"
        project_name = self.project_id or f"nexus-{instance_id.lower()}"
        payload = {
            "name": project_name,
            "project": self.project_id if self.project_id else None,
            "target": "production",
            "files": [
                {
                    "file": item["rel_path"],
                    "sha": item["sha"],
                    "size": item["size"]
                }
                for item in files_to_deploy
            ],
            "projectSettings": {
                "framework": None  # Static prebuilt deployment
            }
        }
        # Clean None values
        if not payload.get("project"):
            payload.pop("project", None)

        deploy_headers = {
            **headers_base,
            "Content-Type": "application/json"
        }

        logger.info(f"Initiating Vercel deployment with project '{project_name}'...")
        res = requests.post(deploy_url, headers=deploy_headers, params=params, json=payload, timeout=30)
        if res.status_code not in (200, 201):
            err_msg = f"Vercel deployment failed with code {res.status_code}: {res.text}"
            logger.error(err_msg)
            return {
                "deployment_id": None,
                "live_url": None,
                "status": "FAILED",
                "error": err_msg
            }

        data = res.json()
        deployment_id = data.get("id")
        initial_url = data.get("url")
        raw_status = data.get("readyState", "BUILDING")

        logger.info(f"Deployment created: ID {deployment_id}, readyState: {raw_status}")

        # Step 4: Poll status until READY or ERROR
        poll_url = f"{self.BASE_URL}/v13/deployments/{deployment_id}"
        max_attempts = 45  # ~90 seconds max
        attempt = 0
        live_url = f"https://{initial_url}" if initial_url else None

        while attempt < max_attempts:
            if raw_status == "READY":
                break
            if raw_status in ("ERROR", "CANCELED"):
                return {
                    "deployment_id": deployment_id,
                    "live_url": live_url,
                    "status": "FAILED",
                    "error": f"Vercel deployment status ended in {raw_status}"
                }

            time.sleep(2)
            attempt += 1
            try:
                poll_res = requests.get(poll_url, headers=headers_base, params=params, timeout=15)
                if poll_res.status_code == 200:
                    poll_data = poll_res.json()
                    raw_status = poll_data.get("readyState", raw_status)
                    if poll_data.get("url"):
                        live_url = f"https://{poll_data['url']}"
            except Exception as e:
                logger.warning(f"Polling error on attempt {attempt}: {e}")

        final_status = "READY" if raw_status == "READY" else "READY" if live_url else "FAILED"
        return {
            "deployment_id": deployment_id,
            "live_url": live_url,
            "status": final_status,
            "error": None if final_status == "READY" else f"Timed out waiting for READY state (current: {raw_status})"
        }


vercel_service = VercelDeploymentService()

