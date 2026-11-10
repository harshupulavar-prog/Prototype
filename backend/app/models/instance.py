from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class HostedInstance(Base):
    __tablename__ = "hosted_instances"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prototype_id = Column(String(100), nullable=False, index=True)
    instance_path = Column(String(500), nullable=False)
    repository_url = Column(String(500), nullable=False)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="instances")
    configuration = relationship("Configuration", back_populates="instance", uselist=False, cascade="all, delete-orphan")
    exports = relationship("ExportHistory", back_populates="instance", cascade="all, delete-orphan")
