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
        name = (c.get("app_name") or c.get("appName") or "").strip()
        if len(name) > MAX_NAME_LEN:
            raise BrandingError(f"App name must be at most {MAX_NAME_LEN} characters")
        out: Dict[str, Any] = {"app_name": name, "appName": name}

        primary = c.get("primary_color") or c.get("primaryColor")
        if primary:
            if not HEX_COLOR.match(primary):
                raise BrandingError("primary_color must be a hex color like #2563EB")
            out["primary_color"] = primary
            out["primaryColor"] = primary

        secondary = c.get("secondary_color") or c.get("secondaryColor")
        if secondary:
            if not HEX_COLOR.match(secondary):
                raise BrandingError("secondary_color must be a hex color like #2563EB")
            out["secondary_color"] = secondary
            out["secondaryColor"] = secondary

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

        logo_key = c.get("logo_storage_key") or c.get("logoStorageKey")
        if logo_key:
            out["logo_storage_key"] = logo_key

        return out

    @staticmethod
    def storable(clean: Dict[str, Any]) -> Dict[str, Any]:
        """Customization safe to persist in the DB / customization.json (no base64 blob)."""
        data = {k: v for k, v in clean.items() if k != "logo"}
        data["has_logo"] = "logo" in clean or "logo_storage_key" in clean
        return data

    @staticmethod
    def apply(instance_dir: Path, clean: Dict[str, Any], frontend_dir: str = "frontend"):
        frontend = instance_dir / frontend_dir
        if not frontend.exists() and (instance_dir / "app").exists():
            frontend = instance_dir / "app"

        app_name = clean.get("app_name") or clean.get("appName") or ""
        primary_color = clean.get("primary_color") or clean.get("primaryColor") or ""
        secondary_color = clean.get("secondary_color") or clean.get("secondaryColor") or ""

        branding: Dict[str, Any] = {
            "appName": app_name,
            "companyName": app_name,
            "primaryColor": primary_color,
            "secondaryColor": secondary_color,
        }

        # Handle Logo from base64 data URL or R2 storage key
        logo = clean.get("logo")
        logo_key = clean.get("logo_storage_key") or clean.get("logoStorageKey")

        if logo:
            m = LOGO_DATA_URL.match(logo)
            if m:
                ext = LOGO_EXT[m.group(1)]
                public_dir = frontend / "public"
                public_dir.mkdir(parents=True, exist_ok=True)
                (public_dir / f"logo.{ext}").write_bytes(base64.b64decode(m.group(2)))
                branding["logo"] = f"/logo.{ext}"
        elif logo_key:
            from app.services.r2_storage_service import r2_service
            raw_bytes = r2_service.get_bytes(logo_key)
            if raw_bytes:
                ext = "png"
                if logo_key.endswith(".jpg") or logo_key.endswith(".jpeg"):
                    ext = "jpg"
                elif logo_key.endswith(".webp"):
                    ext = "webp"
                elif logo_key.endswith(".svg"):
                    ext = "svg"
                public_dir = frontend / "public"
                public_dir.mkdir(parents=True, exist_ok=True)
                (public_dir / f"logo.{ext}").write_bytes(raw_bytes)
                branding["logo"] = f"/logo.{ext}"

        src = frontend / "src"
        src.mkdir(parents=True, exist_ok=True)
        (src / "branding.json").write_text(json.dumps(branding, indent=2), encoding="utf-8")

        # Inject title and CSS variables into index.html
        index = frontend / "index.html"
        if index.exists():
            html = index.read_text(encoding="utf-8")
            if app_name:
                safe = app_name.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                html = re.sub(r"<title>.*?</title>", f"<title>{safe}</title>", html, count=1)

            # Inject CSS custom properties for dynamic theming
            css_vars = []
            if primary_color:
                css_vars.append(f"--color-primary: {primary_color}; --primary: {primary_color};")
            if secondary_color:
                css_vars.append(f"--color-secondary: {secondary_color}; --secondary: {secondary_color};")
            if css_vars:
                style_tag = f'<style id="nexus-branding">:root {{ {" ".join(css_vars)} }}</style>'
                if '</head>' in html:
                    html = html.replace('</head>', f'  {style_tag}\n</head>')
            index.write_text(html, encoding="utf-8")
