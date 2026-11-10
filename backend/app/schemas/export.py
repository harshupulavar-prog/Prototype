from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ExportResponse(BaseModel):
    id: int
    instance_id: str
    export_url: str
    status: str
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
