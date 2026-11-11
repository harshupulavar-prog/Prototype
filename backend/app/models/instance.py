from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class HostedInstance(Base):
    __tablename__ = "hosted_instances"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prototype_id = Column(String(100), nullable=False, index=True)
    
    # Branding and metadata
    app_name = Column(String(150), nullable=True)
    notification_email = Column(String(255), nullable=True)
    primary_color = Column(String(50), nullable=True)
    secondary_color = Column(String(50), nullable=True)
    logo_storage_key = Column(String(500), nullable=True)
    customization_json = Column(Text, nullable=True)

    # Deployment and hosting state
    deployment_status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, PENDING, BUILDING, UPLOADING, DEPLOYING, READY, FAILED
    vercel_deployment_id = Column(String(200), nullable=True)
    live_url = Column(String(500), nullable=True)
    build_error = Column(Text, nullable=True)
    deployed_at = Column(DateTime, nullable=True)

    # Legacy / local workspace references
    instance_path = Column(String(500), nullable=True)
    repository_url = Column(String(500), nullable=True)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="instances")
    configuration = relationship("Configuration", back_populates="instance", uselist=False, cascade="all, delete-orphan")
    exports = relationship("ExportHistory", back_populates="instance", cascade="all, delete-orphan")
