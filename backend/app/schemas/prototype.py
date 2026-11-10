from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class PrototypeBase(BaseModel):
    prototype_id: str
    name: str
    description: Optional[str] = None
    category: str
    version: str = "1.0.0"


class PrototypeMetadata(BaseModel):
    id: str
    name: str
    description: str
    category: str
    version: str
    technologies: List[str] = []
    features: List[str] = []
    entry_point: Optional[str] = "frontend"
    thumbnail: Optional[str] = None
    screenshots: List[str] = []


class PrototypeResponse(PrototypeBase):
    id: int
    technologies: List[str] = []
    features: List[str] = []
    thumbnail: Optional[str] = None
    screenshots: List[str] = []
    # Which branding inputs the hosting dialog should offer for this prototype
    branding_fields: List[str] = ["app_name", "logo", "primary_color", "secondary_color"]
    created_at: datetime

    class Config:
        from_attributes = True


class PrototypeDetailResponse(PrototypeResponse):
    source_path: str
    metadata: Dict[str, Any] = {}
