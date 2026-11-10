from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.export import ExportHistory
from app.schemas.export import ExportResponse
from app.services.export_service import ExportService
from app.core.config import settings

router = APIRouter(prefix="/export", tags=["Export"])


@router.post("/{instance_id}", response_model=ExportResponse)
def create_export(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        export_rec = ExportService.create_instance_export(
            db=db,
            user_id=current_user.id,
            instance_id=instance_id
        )
        return export_rec
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{export_id}", response_model=ExportResponse)
def get_export_status(
    export_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ExportHistory).filter(ExportHistory.id == export_id)
    if current_user.role != "admin":
        query = query.filter(ExportHistory.user_id == current_user.id)
    record = query.first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export not found")
    return record


@router.get("/download/{file_name}")
def download_export_archive(
    file_name: str
):
    exports_dir = settings.GENERATED_DIR / "exports"
    file_path = exports_dir / file_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export file not found")
    return FileResponse(
        path=str(file_path),
        filename=file_name,
        media_type="application/zip"
    )
