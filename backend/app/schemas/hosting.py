from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class HostCreateRequest(BaseModel):
    prototype_id: Optional[str] = None
    customization: Optional[Dict[str, Any]] = None
    notification_email: Optional[str] = None
    notificationEmail: Optional[str] = None
    # Support top-level attributes as well
    app_name: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    logo: Optional[str] = None


class InstanceCreateRequest(BaseModel):
    appName: Optional[str] = None
    app_name: Optional[str] = None
    notificationEmail: Optional[str] = None
    notification_email: Optional[str] = None
    primaryColor: Optional[str] = None
    primary_color: Optional[str] = None
    secondaryColor: Optional[str] = None
    secondary_color: Optional[str] = None
    logo: Optional[str] = None
    logo_storage_key: Optional[str] = None
    customization: Optional[Dict[str, Any]] = None


class CloneInfoResponse(BaseModel):
    instance_id: str
    repository_url: Optional[str] = None
    vscode_clone_url: Optional[str] = None
    vscode_open_folder_url: Optional[str] = None
    git_clone_command: Optional[str] = None
    prototype_id: str
    prototype_name: str
    instance_path: Optional[str] = None


class DeploymentStatusResponse(BaseModel):
    instance_id: str
    deployment_status: str
    live_url: Optional[str] = None
    vercel_deployment_id: Optional[str] = None
    build_error: Optional[str] = None
    deployed_at: Optional[datetime] = None
    updated_at: datetime


class HostedInstanceResponse(BaseModel):
    id: int
    instance_id: str
    user_id: int
    prototype_id: str
    prototype_name: Optional[str] = None
    instance_path: Optional[str] = None
    repository_url: Optional[str] = None
    vscode_clone_url: Optional[str] = None
    vscode_open_folder_url: Optional[str] = None
    git_clone_command: Optional[str] = None
    
    # Customization & Branding
    app_name: Optional[str] = None
    notification_email: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    logo_storage_key: Optional[str] = None
    customization_json: Optional[str] = None

    # Deployment fields
    deployment_status: str = "DRAFT"
    vercel_deployment_id: Optional[str] = None
    live_url: Optional[str] = None
    build_error: Optional[str] = None
    deployed_at: Optional[datetime] = None

    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
