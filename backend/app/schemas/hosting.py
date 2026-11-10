from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class HostCreateRequest(BaseModel):
    prototype_id: str
    customization: Optional[Dict[str, Any]] = None


class CloneInfoResponse(BaseModel):
    instance_id: str
    repository_url: str
    vscode_clone_url: str
    vscode_open_folder_url: Optional[str] = None
    git_clone_command: str
    prototype_id: str
    prototype_name: str
    instance_path: Optional[str] = None


class HostedInstanceResponse(BaseModel):
    id: int
    instance_id: str
    user_id: int
    prototype_id: str
    prototype_name: Optional[str] = None
    instance_path: Optional[str] = None
    repository_url: str
    vscode_clone_url: Optional[str] = None
    vscode_open_folder_url: Optional[str] = None
    git_clone_command: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
