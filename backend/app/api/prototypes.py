from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.prototype_service import PrototypeRegistryService
from app.schemas.prototype import PrototypeResponse, PrototypeDetailResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/prototypes", tags=["Prototypes"])


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
