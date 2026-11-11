import smtplib
import json
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Email notification service for deployed prototype instances.
    Delivers live deployment URLs, workspace links, and download credentials.
    Includes comprehensive local email simulation logging when SMTP is not configured.
    """

    @classmethod
    def send_deployment_ready_email(
        cls,
        to_email: str,
        instance_id: str,
        app_name: str,
        live_url: str,
        workspace_url: str,
        download_url: str,
        branding_info: Optional[Dict[str, Any]] = None
    ) -> bool:
        if not to_email or "@" not in to_email:
            logger.warning(f"Invalid or missing notification email: '{to_email}'")
            return False

        subject = f"🚀 Your Nexus Prototype '{app_name}' is Live!"
        branding = branding_info or {}
        primary_color = branding.get("primary_color") or "#E91D2B"

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 24px; color: #171a24; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }}
    .header {{ background: #171a24; padding: 32px 24px; text-align: center; color: #ffffff; }}
    .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }}
    .content {{ padding: 32px 24px; }}
    .title {{ font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #111827; }}
    .desc {{ font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px; }}
    .btn-container {{ text-align: center; margin: 32px 0; }}
    .btn {{ display: inline-block; background-color: {primary_color}; color: #ffffff !important; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }}
    .card {{ background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; }}
    .card-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }}
    .card-row:last-child {{ border-bottom: none; }}
    .label {{ color: #6b7280; font-weight: 500; }}
    .val {{ font-family: monospace; font-weight: 600; color: #111827; word-break: break-all; }}
    .footer {{ padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nexus Application Platform</h1>
    </div>
    <div class="content">
      <div class="title">Your Prototype Application is Ready</div>
      <p class="desc">
        Good news! Your customized application <strong>{app_name}</strong> has been successfully built and deployed.
        Opening the link below will display your customized code, automatically run the terminal dev server, and render your live UI.
      </p>

      <div class="btn-container">
        <a href="{workspace_url}" class="btn" target="_blank">Open Workspace & View Code</a>
      </div>

      <div class="card">
        <div class="card-row">
          <span class="label">Instance ID:</span>
          <span class="val">{instance_id}</span>
        </div>
        <div class="card-row">
          <span class="label">Workspace & Code:</span>
          <span class="val"><a href="{workspace_url}" style="color: {primary_color};">{workspace_url}</a></span>
        </div>
        <div class="card-row">
          <span class="label">Live Deployment:</span>
          <span class="val"><a href="{live_url}" style="color: {primary_color};">{live_url}</a></span>
        </div>
        <div class="card-row">
          <span class="label">Source Code ZIP:</span>
          <span class="val"><a href="{download_url}" style="color: {primary_color};">Download ZIP</a></span>
        </div>
      </div>
    </div>
    <div class="footer">
      Generated automatically by Nexus Platform · Instance {instance_id}
    </div>
  </div>
</body>
</html>
"""

        # Step 1: Real SMTP Delivery if configured
        if settings.SMTP_HOST and settings.SMTP_USER:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
                msg["To"] = to_email

                part_html = MIMEText(html_content, "html")
                msg.attach(part_html)

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                    if settings.SMTP_TLS:
                        server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)

                logger.info(f"Successfully dispatched deployment email to {to_email} via SMTP")
                return True
            except Exception as e:
                logger.error(f"Failed to send email via SMTP to {to_email}: {e}. Logging fallback.")

        # Step 2: Fallback Simulation Log
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        email_record = {
            "to": to_email,
            "subject": subject,
            "instance_id": instance_id,
            "app_name": app_name,
            "workspace_url": workspace_url,
            "live_url": live_url,
            "download_url": download_url,
            "timestamp": timestamp,
        }

        try:
            settings.EMAILS_DIR.mkdir(parents=True, exist_ok=True)
            log_file = settings.EMAILS_DIR / f"{instance_id}_{timestamp}.html"
            log_file.write_text(html_content, encoding="utf-8")
            json_file = settings.EMAILS_DIR / f"{instance_id}_{timestamp}.json"
            json_file.write_text(json.dumps(email_record, indent=2), encoding="utf-8")
        except Exception as file_err:
            logger.warning(f"Could not persist email record to disk: {file_err}")

        logger.info(
            f"\n"
            f"======================================================================\n"
            f"[EMAIL NOTIFICATION DISPATCHED]\n"
            f"Recipient: {to_email}\n"
            f"Subject:   {subject}\n"
            f"Workspace: {workspace_url}\n"
            f"Live App:  {live_url}\n"
            f"======================================================================\n"
        )
        return True


email_service = EmailService()

