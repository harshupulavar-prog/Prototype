import os
import logging
from pathlib import Path
from typing import Optional
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)


class R2StorageService:
    """
    Cloudflare R2 Storage Service using S3-compatible API.
    Provides private object storage for logos, assets, and source exports.
    Includes seamless local disk fallback when R2 credentials are not configured.
    """

    def __init__(self):
        self.account_id = settings.R2_ACCOUNT_ID
        self.access_key = settings.R2_ACCESS_KEY_ID
        self.secret_key = settings.R2_SECRET_ACCESS_KEY
        self.bucket_name = settings.R2_BUCKET_NAME or "nexus-prototypes"
        self.endpoint_url = settings.R2_ENDPOINT_URL
        if not self.endpoint_url and self.account_id:
            self.endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"
        self.public_url = settings.R2_PUBLIC_URL.rstrip("/") if settings.R2_PUBLIC_URL else ""

        self._client = None
        if self.is_configured():
            try:
                self._client = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint_url,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    config=Config(
                        signature_version="s3v4",
                        s3={"addressing_style": "path"},
                        retries={"max_attempts": 3, "mode": "standard"}
                    ),
                    region_name="auto"
                )
                logger.info(f"Initialized Cloudflare R2 client for bucket '{self.bucket_name}' at {self.endpoint_url}")
            except Exception as e:
                logger.warning(f"Failed to initialize boto3 R2 client: {e}. Falling back to local storage.")
                self._client = None

    def is_configured(self) -> bool:
        """Returns True if valid R2 credentials and endpoint are present."""
        return bool(self.access_key and self.secret_key and (self.endpoint_url or self.account_id))

    def upload_bytes(self, data: bytes, object_key: str, content_type: str = "application/octet-stream") -> str:
        """
        Upload raw bytes to R2 (or fallback directory).
        Returns the storage key or URL identifier.
        """
        object_key = object_key.lstrip("/")
        if self._client:
            try:
                self._client.put_object(
                    Bucket=self.bucket_name,
                    Key=object_key,
                    Body=data,
                    ContentType=content_type,
                )
                logger.info(f"Successfully uploaded {len(data)} bytes to R2: {object_key}")
                return object_key
            except Exception as e:
                logger.error(f"Failed to upload to R2 bucket '{self.bucket_name}': {e}")
                # Fall through to local fallback

        # Local storage fallback
        local_path = settings.R2_STORAGE_DIR / object_key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(data)
        logger.info(f"Saved {len(data)} bytes to local storage fallback: {local_path}")
        return object_key

    def upload_file(self, file_path: Path, object_key: str, content_type: str = "application/octet-stream") -> str:
        """
        Upload file from disk to R2 (or fallback directory).
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        data = file_path.read_bytes()
        return self.upload_bytes(data, object_key, content_type)

    def download_file(self, object_key: str, target_path: Path) -> bool:
        """
        Downloads an object from R2 (or fallback directory) to target_path on disk.
        """
        object_key = object_key.lstrip("/")
        target_path.parent.mkdir(parents=True, exist_ok=True)

        if self._client:
            try:
                self._client.download_file(self.bucket_name, object_key, str(target_path))
                logger.info(f"Downloaded R2 object '{object_key}' to {target_path}")
                return True
            except ClientError as e:
                logger.error(f"R2 download error for '{object_key}': {e}")

        # Try local fallback
        local_path = settings.R2_STORAGE_DIR / object_key
        if local_path.exists():
            import shutil
            shutil.copy2(local_path, target_path)
            logger.info(f"Retrieved from local fallback storage: {local_path} -> {target_path}")
            return True

        logger.error(f"Object '{object_key}' not found in R2 or local storage fallback")
        return False

    def get_bytes(self, object_key: str) -> Optional[bytes]:
        """
        Retrieves binary data of an object from R2 or local fallback.
        """
        object_key = object_key.lstrip("/")
        if self._client:
            try:
                response = self._client.get_object(Bucket=self.bucket_name, Key=object_key)
                return response["Body"].read()
            except Exception as e:
                logger.error(f"Failed to fetch bytes from R2 for '{object_key}': {e}")

        local_path = settings.R2_STORAGE_DIR / object_key
        if local_path.exists():
            return local_path.read_bytes()
        return None

    def generate_presigned_url(self, object_key: str, expires_in: int = 3600) -> str:
        """
        Generates a secure presigned download URL for private bucket objects.
        If local fallback is active, returns backend API download URL.
        """
        object_key = object_key.lstrip("/")
        if self.public_url:
            return f"{self.public_url}/{object_key}"

        if self._client:
            try:
                url = self._client.generate_presigned_url(
                    ClientMethod="get_object",
                    Params={"Bucket": self.bucket_name, "Key": object_key},
                    ExpiresIn=expires_in
                )
                return url
            except Exception as e:
                logger.warning(f"Could not generate presigned URL from R2 client: {e}")

        return f"{settings.BACKEND_URL}/api/hosting/storage/{object_key}"

    def delete_object(self, object_key: str) -> bool:
        """Deletes an object from R2 and local fallback."""
        object_key = object_key.lstrip("/")
        success = True
        if self._client:
            try:
                self._client.delete_object(Bucket=self.bucket_name, Key=object_key)
            except Exception as e:
                logger.error(f"Failed to delete '{object_key}' from R2: {e}")
                success = False

        local_path = settings.R2_STORAGE_DIR / object_key
        if local_path.exists():
            try:
                local_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete local fallback file: {e}")
                success = False
        return success


# Global singleton instance
r2_service = R2StorageService()

