import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.hosting import (
    HostCreateRequest,
    HostedInstanceResponse,
    CloneInfoResponse
)
from app.services.hosting_service import HostingService
from app.services.branding_service import BrandingError
from app.services.vscode_service import VSCodeIntegrationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/hosting", tags=["Hosting"])
hosting_service = HostingService()


@router.post("/create", response_model=HostedInstanceResponse, status_code=status.HTTP_201_CREATED)
def create_instance(
    request: HostCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates an independent hosted instance of a prototype:
    - Copies source code cleanly to generated/hosted-instances/{instance_id}
    - Provisions a private Git repository for that specific instance
    - Generates unique URL and VS Code clone links
    """
    try:
        instance_data = hosting_service.create_hosted_instance(
            db=db,
            user=current_user,
            prototype_id=request.prototype_id,
            customization=request.customization
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
    Directly opens the isolated instance folder inside Visual Studio Code
    using the system's local 'code' CLI.
    """
    import subprocess
    from pathlib import Path

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
        import shutil
        resolved_path = str(Path(inst_path).resolve())
        code_bin = shutil.which("code") or "code"
        # Explicit quoted string for Windows cmd.exe execution with new window flag (-n)
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
