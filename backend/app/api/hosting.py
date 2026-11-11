import logging
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.hosting import (
    HostCreateRequest,
    HostedInstanceResponse,
    DeploymentStatusResponse,
    CloneInfoResponse
)
from app.services.hosting_service import HostingService
from app.services.branding_service import BrandingError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/hosting", tags=["Hosting"])
hosting_service = HostingService()


@router.post("/create", response_model=HostedInstanceResponse, status_code=status.HTTP_201_CREATED)
def create_instance(
    request: HostCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates an independent hosted instance of a prototype and triggers its hosting build.
    """
    try:
        customization = request.customization or {}
        if request.app_name:
            customization["app_name"] = request.app_name
        if request.primary_color:
            customization["primary_color"] = request.primary_color
        if request.secondary_color:
            customization["secondary_color"] = request.secondary_color
        if request.logo:
            customization["logo"] = request.logo

        instance_data = hosting_service.create_hosted_instance(
            db=db,
            user=current_user,
            prototype_id=request.prototype_id,
            customization=customization
        )
        return instance_data
    except BrandingError as be:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(be))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error creating instance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create hosted instance: {str(e)}"
        )


@router.get("/my-instances", response_model=List[HostedInstanceResponse])
def get_my_instances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all hosted instances owned by the current authenticated user.
    """
    return hosting_service.get_user_instances(db=db, user_id=current_user.id)


@router.get("/storage/{file_path:path}")
def get_storage_fallback_file(file_path: str):
    """
    Serves files from local storage fallback when Cloudflare R2 is running locally.
    """
    local_file = settings.R2_STORAGE_DIR / file_path
    if not local_file.exists() or not local_file.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage object not found")
    return FileResponse(path=str(local_file))


@router.get("/{instance_id}", response_model=HostedInstanceResponse)
def get_instance_details(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns details of a specific hosted instance if owned by user (or if admin).
    """
    user_id_filter = None if current_user.role == "admin" else current_user.id
    instance = hosting_service.get_instance_by_id(db=db, instance_id=instance_id, user_id=user_id_filter)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance '{instance_id}' not found or access unauthorized"
        )
    return instance


@router.get("/{instance_id}/files")
def get_instance_files(
    instance_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns source code files for the interactive in-browser code viewer.
    """
    try:
        return hosting_service.get_instance_source_files(db=db, instance_id=instance_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error getting files: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{instance_id}/host", response_model=HostedInstanceResponse)
def host_instance(
    instance_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Starts the automated build and deployment process for the instance.
    """
    try:
        return hosting_service.start_deployment(
            db=db,
            background_tasks=background_tasks,
            user=current_user,
            instance_id=instance_id
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to start hosting for {instance_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{instance_id}/deployment-status", response_model=DeploymentStatusResponse)
def get_instance_deployment_status(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the current build & deployment status, live URL, and build errors.
    """
    user_id_filter = None if current_user.role == "admin" else current_user.id
    instance = hosting_service.get_instance_by_id(db=db, instance_id=instance_id, user_id=user_id_filter)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance '{instance_id}' not found"
        )
    return {
        "instance_id": instance["instance_id"],
        "deployment_status": instance.get("deployment_status", "DRAFT"),
        "live_url": instance.get("live_url"),
        "vercel_deployment_id": instance.get("vercel_deployment_id"),
        "build_error": instance.get("build_error"),
        "deployed_at": instance.get("deployed_at"),
        "updated_at": instance["updated_at"]
    }


@router.post("/{instance_id}/redeploy", response_model=HostedInstanceResponse)
def redeploy_instance(
    instance_id: str,
    background_tasks: BackgroundTasks,
    request: Optional[HostCreateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers re-deployment of an instance with optional updated configuration.
    """
    customization = None
    if request:
        customization = request.customization or {}
        if request.app_name:
            customization["app_name"] = request.app_name
        if request.primary_color:
            customization["primary_color"] = request.primary_color
        if request.secondary_color:
            customization["secondary_color"] = request.secondary_color
        if request.logo:
            customization["logo"] = request.logo

    try:
        return hosting_service.redeploy_instance(
            db=db,
            background_tasks=background_tasks,
            user=current_user,
            instance_id=instance_id,
            customization=customization
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to redeploy instance {instance_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{instance_id}/download")
def download_instance_source(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Downloads the customized source code as a clean ZIP.
    """
    user_id_filter = None if current_user.role == "admin" else current_user.id
    try:
        archive_path = hosting_service.get_source_zip_path(
            db=db,
            instance_id=instance_id,
            user_id=user_id_filter
        )
        return FileResponse(
            path=str(archive_path),
            filename=f"{instance_id}_source.zip",
            media_type="application/zip"
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to download source for {instance_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{instance_id}/repository")
def get_instance_repository(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns repository metadata and status for the hosted instance.
    """
    user_id_filter = None if current_user.role == "admin" else current_user.id
    instance = hosting_service.get_instance_by_id(db=db, instance_id=instance_id, user_id=user_id_filter)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance '{instance_id}' not found"
        )

    return {
        "instance_id": instance["instance_id"],
        "repository_url": instance["repository_url"],
        "status": instance["status"],
        "provider": "git",
        "branch": "main"
    }


@router.get("/{instance_id}/clone-info", response_model=CloneInfoResponse)
def get_instance_clone_info(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns clone information including the VS Code URI handler link and fallback git clone command.
    """
    user_id_filter = None if current_user.role == "admin" else current_user.id
    instance = hosting_service.get_instance_by_id(db=db, instance_id=instance_id, user_id=user_id_filter)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance '{instance_id}' not found"
        )

    return {
        "instance_id": instance["instance_id"],
        "repository_url": instance["repository_url"],
        "vscode_clone_url": instance["vscode_clone_url"],
        "vscode_open_folder_url": instance.get("vscode_open_folder_url"),
        "git_clone_command": instance["git_clone_command"],
        "prototype_id": instance["prototype_id"],
        "prototype_name": instance["prototype_name"],
        "instance_path": instance.get("instance_path")
    }


@router.post("/{instance_id}/open-in-vscode")
def open_in_vscode_directly(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Directly opens the isolated instance folder inside Visual Studio Code.
    """
    import subprocess
    import shutil

    user_id_filter = None if current_user.role == "admin" else current_user.id
    instance = hosting_service.get_instance_by_id(db=db, instance_id=instance_id, user_id=user_id_filter)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance '{instance_id}' not found"
        )

    inst_path = instance.get("instance_path")
    if not inst_path or not Path(inst_path).exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instance directory not found on disk"
        )

    try:
        resolved_path = str(Path(inst_path).resolve())
        code_bin = shutil.which("code") or "code"
        cmd_str = f'"{code_bin}" -n "{resolved_path}"'
        logger.info(f"Executing VS Code launch: {cmd_str}")
        subprocess.Popen(cmd_str, shell=True)
        return {
            "status": "success",
            "message": f"Opened workspace {instance_id} in VS Code",
            "path": resolved_path
        }
    except Exception as e:
        logger.error(f"Failed to launch VS Code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not open VS Code: {str(e)}"
        )
