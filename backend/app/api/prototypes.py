import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.prototype_service import PrototypeRegistryService
from app.services.hosting_service import HostingService
from app.services.branding_service import BrandingError
from app.schemas.prototype import PrototypeResponse, PrototypeDetailResponse
from app.schemas.hosting import (
    HostedInstanceResponse,
    DeploymentStatusResponse,
    InstanceCreateRequest
)
from app.api.deps import get_current_user, get_current_user_optional
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/prototypes", tags=["Prototypes"])
hosting_service = HostingService()


# ==============================================================================
# Prototype Instance Management Endpoints (Placed before /{prototype_id})
# ==============================================================================

@router.get("/instances", response_model=List[HostedInstanceResponse])
def list_user_instances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists the authenticated user's prototype instances.
    """
    return hosting_service.get_user_instances(db=db, user_id=current_user.id)


@router.get("/instances/{instance_id}", response_model=HostedInstanceResponse)
def get_instance_details(
    instance_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Returns instance details by ID. Accessible by owner, admin, or via direct instance link.
    """
    user_id_filter = current_user.id if (current_user and current_user.role != "admin") else None
    instance = hosting_service.get_instance_by_id(db=db, instance_id=instance_id, user_id=user_id_filter)
    if not instance:
        # If not found with user filter, check if instance exists for direct link access
        instance = hosting_service.get_instance_by_id(db=db, instance_id=instance_id, user_id=None)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance '{instance_id}' not found"
        )
    return instance


@router.get("/instances/{instance_id}/files")
def get_instance_source_files(
    instance_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Returns customized source code files for the interactive in-browser code viewer.
    """
    try:
        return hosting_service.get_instance_source_files(db=db, instance_id=instance_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error fetching source files for {instance_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/instances/{instance_id}/host", response_model=HostedInstanceResponse)
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


@router.get("/instances/{instance_id}/deployment-status", response_model=DeploymentStatusResponse)
def get_instance_deployment_status(
    instance_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Returns the current build & deployment status, live URL, and any build errors.
    """
    instance = hosting_service.get_instance_by_id(db=db, instance_id=instance_id, user_id=None)
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


@router.post("/instances/{instance_id}/redeploy", response_model=HostedInstanceResponse)
def redeploy_instance(
    instance_id: str,
    background_tasks: BackgroundTasks,
    request: Optional[InstanceCreateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new deployment using updated instance configuration.
    """
    customization = None
    if request:
        customization = {
            "app_name": request.appName or request.app_name,
            "notification_email": request.notificationEmail or request.notification_email,
            "primary_color": request.primaryColor or request.primary_color,
            "secondary_color": request.secondaryColor or request.secondary_color,
            "logo": request.logo,
            "logo_storage_key": request.logo_storage_key
        }
        if request.customization:
            customization.update(request.customization)

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


@router.get("/instances/{instance_id}/download")
def download_instance_source(
    instance_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Downloads the customized source code as a clean ZIP archive.
    """
    user_id_filter = current_user.id if (current_user and current_user.role != "admin") else None
    try:
        archive_path = hosting_service.get_source_zip_path(
            db=db,
            instance_id=instance_id,
            user_id=None
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


@router.delete("/instances/{instance_id}", status_code=status.HTTP_200_OK)
def delete_instance(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes an instance, its workspace, and associated storage assets.
    """
    user_id_filter = None if current_user.role == "admin" else current_user.id
    success = hosting_service.delete_instance(db=db, instance_id=instance_id, user_id=user_id_filter)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Instance '{instance_id}' not found")
    return {"status": "success", "message": f"Instance '{instance_id}' deleted successfully"}


# ==============================================================================
# Prototype Catalog & Prototype Instance Creation
# ==============================================================================

@router.get("", response_model=List[PrototypeResponse])
def list_prototypes(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by name, description, or category"),
    db: Session = Depends(get_db)
):
    """
    Returns all registered prototype cards with tech stack, description, and metadata.
    """
    return PrototypeRegistryService.list_prototypes(db=db, category=category, search=search)


@router.post("/{prototype_id}/instances", response_model=HostedInstanceResponse, status_code=status.HTTP_201_CREATED)
def create_prototype_instance(
    prototype_id: str,
    request: Optional[InstanceCreateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a customized instance for the specified prototype.
    """
    customization = {}
    if request:
        customization = {
            "app_name": request.appName or request.app_name,
            "notification_email": request.notificationEmail or request.notification_email,
            "primary_color": request.primaryColor or request.primary_color,
            "secondary_color": request.secondaryColor or request.secondary_color,
            "logo": request.logo,
            "logo_storage_key": request.logo_storage_key
        }
        if request.customization:
            customization.update(request.customization)

    try:
        instance_data = hosting_service.create_hosted_instance(
            db=db,
            user=current_user,
            prototype_id=prototype_id,
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
            detail=f"Failed to create prototype instance: {str(e)}"
        )


@router.get("/{prototype_id}", response_model=PrototypeDetailResponse)
def get_prototype_details(
    prototype_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns detailed specifications, features, and source information for a prototype.
    """
    proto = PrototypeRegistryService.get_prototype_by_id(db=db, prototype_id=prototype_id)
    if not proto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prototype with id '{prototype_id}' not found"
        )
    return proto


@router.get("/{prototype_id}/preview")
def get_prototype_preview(
    prototype_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns preview data, screenshots, and summary information.
    """
    proto = PrototypeRegistryService.get_prototype_by_id(db=db, prototype_id=prototype_id)
    if not proto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prototype with id '{prototype_id}' not found"
        )
    return {
        "prototype_id": proto["prototype_id"],
        "name": proto["name"],
        "description": proto["description"],
        "category": proto["category"],
        "version": proto["version"],
        "technologies": proto["technologies"],
        "features": proto["features"],
        "screenshots": proto.get("screenshots", []),
        "status": "ready"
    }


@router.post("/sync", status_code=status.HTTP_200_OK)
def sync_prototypes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Scans prototypes directory on disk and registers any new or modified prototypes.
    """
    synced = PrototypeRegistryService.sync_prototypes_from_disk(db)
    return {"message": f"Successfully synced {len(synced)} prototypes", "count": len(synced)}
