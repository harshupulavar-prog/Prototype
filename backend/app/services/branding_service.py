import base64
import binascii
import json
import re
from pathlib import Path
from typing import Any, Dict, Optional

HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
LOGO_DATA_URL = re.compile(r"^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$")
MAX_LOGO_BYTES = 1024 * 1024  # 1 MB
MAX_NAME_LEN = 60
LOGO_EXT = {"png": "png", "jpeg": "jpg", "webp": "webp"}


class BrandingError(ValueError):
    """Raised when the submitted customization is invalid (maps to HTTP 422)."""


class BrandingService:
    """
    Applies user branding (app name, colors, logo) to a hosted prototype copy.

    Writes:
      frontend/src/branding.json   -> read by the prototype's App.jsx
      frontend/public/logo.<ext>   -> served by Vite at /logo.<ext>
      frontend/index.html <title>  -> app name
    """

    @staticmethod
    def validate(customization: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        c = customization or {}
        name = (c.get("app_name") or "").strip()
        if len(name) > MAX_NAME_LEN:
            raise BrandingError(f"App name must be at most {MAX_NAME_LEN} characters")
        out: Dict[str, Any] = {"app_name": name}

        for key in ("primary_color", "secondary_color"):
            val = c.get(key)
            if val:
                if not HEX_COLOR.match(val):
                    raise BrandingError(f"{key} must be a hex color like #2563EB")
                out[key] = val
        logo = c.get("logo")
        if logo:
            m = LOGO_DATA_URL.match(logo)
            if not m:
                raise BrandingError("Logo must be a PNG, JPEG or WebP image")
            try:
                raw = base64.b64decode(m.group(2), validate=True)
            except (binascii.Error, ValueError):
                raise BrandingError("Logo image data is corrupt")
            if len(raw) > MAX_LOGO_BYTES:
                raise BrandingError("Logo must be 1 MB or smaller")
            out["logo"] = logo
        return out

    @staticmethod
    def storable(clean: Dict[str, Any]) -> Dict[str, Any]:
        """Customization safe to persist in the DB / customization.json (no base64 blob)."""
        data = {k: v for k, v in clean.items() if k != "logo"}
        data["has_logo"] = "logo" in clean
        return data

    @staticmethod
    def apply(instance_dir: Path, clean: Dict[str, Any], frontend_dir: str = "frontend"):
        frontend = instance_dir / frontend_dir
        branding: Dict[str, Any] = {}
        if clean.get("app_name"):
            branding["companyName"] = clean["app_name"]
        if clean.get("primary_color"):
            branding["primaryColor"] = clean["primary_color"]
        if clean.get("secondary_color"):
            branding["secondaryColor"] = clean["secondary_color"]

        logo = clean.get("logo")
        if logo:
            m = LOGO_DATA_URL.match(logo)
            ext = LOGO_EXT[m.group(1)]
            public_dir = frontend / "public"
            public_dir.mkdir(parents=True, exist_ok=True)
            (public_dir / f"logo.{ext}").write_bytes(base64.b64decode(m.group(2)))
            branding["logo"] = f"/logo.{ext}"

        src = frontend / "src"
        src.mkdir(parents=True, exist_ok=True)
        (src / "branding.json").write_text(json.dumps(branding, indent=2), encoding="utf-8")

        index = frontend / "index.html"
        if clean.get("app_name") and index.exists():
            html = index.read_text(encoding="utf-8")
            safe = (clean["app_name"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            index.write_text(re.sub(r"<title>.*?</title>", f"<title>{safe}</title>", html, count=1), encoding="utf-8")
