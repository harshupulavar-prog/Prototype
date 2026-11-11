"""
End-to-End Test Suite for Prototype Customization, Build, Hosting, and Deployment Automation.
"""
import sys
import os
import json
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, engine, run_migrations
from app.models.user import User
from app.models.instance import HostedInstance
from app.services.r2_storage_service import r2_service
from app.services.build_engine_service import BuildEngineService


def run_tests():
    print("=" * 70)
    print("1. RUNNING DATABASE SCHEMA MIGRATION CHECK")
    print("=" * 70)
    run_migrations()
    with engine.connect() as conn:
        if engine.dialect.name == "sqlite":
            res = conn.exec_driver_sql("PRAGMA table_info(hosted_instances);")
            cols = [r[1] for r in res.fetchall()]
        else:
            cols = []
    print("Columns in hosted_instances:", cols)
    required_cols = [
        "app_name", "primary_color", "secondary_color", "logo_storage_key",
        "customization_json", "deployment_status", "vercel_deployment_id",
        "live_url", "build_error", "deployed_at"
    ]
    for c in required_cols:
        assert c in cols, f"Missing column: {c}"
    print("Database columns validated successfully!")

    print("\n" + "=" * 70)
    print("2. TESTING CLOUDFLARE R2 STORAGE INTEGRATION & FALLBACK")
    print("=" * 70)
    test_key = "tests/test_logo.png"
    sample_data = b"\x89PNG\r\n\x1a\nTestPngData123456"
    uploaded_key = r2_service.upload_bytes(sample_data, test_key, "image/png")
    assert uploaded_key == test_key
    fetched_bytes = r2_service.get_bytes(test_key)
    assert fetched_bytes == sample_data
    presigned = r2_service.generate_presigned_url(test_key)
    print(f"R2 Upload & retrieval passed! Presigned/fallback URL: {presigned}")

    print("\n" + "=" * 70)
    print("3. TESTING FASTAPI REST API ENDPOINTS")
    print("=" * 70)
    client = TestClient(app)

    # Login demo user to get JWT token
    login_res = client.post("/api/auth/login", json={"email": "demo@prototypehub.io", "password": "password123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Authenticated as demo@prototypehub.io")

    # 3.1 POST /api/prototypes/{prototype_id}/instances
    print("\nTesting: POST /api/prototypes/crm/instances")
    create_payload = {
        "appName": "Acme High-Growth CRM",
        "notificationEmail": "user.developer@acme.com",
        "primaryColor": "#E91D2B",
        "secondaryColor": "#171A24",
        "customization": {
            "tier": "enterprise",
            "leadScoring": True
        }
    }
    create_res = client.post("/api/prototypes/crm/instances", json=create_payload, headers=headers)
    assert create_res.status_code == 201, f"Create instance failed: {create_res.text}"
    inst_data = create_res.json()
    instance_id = inst_data["instance_id"]
    print(f"Instance created successfully! ID: {instance_id}")
    assert inst_data["app_name"] == "Acme High-Growth CRM"
    assert inst_data["notification_email"] == "user.developer@acme.com"
    assert inst_data["primary_color"] == "#E91D2B"
    assert inst_data["deployment_status"] == "DRAFT"

    # 3.2 GET /api/prototypes/instances
    print("\nTesting: GET /api/prototypes/instances")
    list_res = client.get("/api/prototypes/instances", headers=headers)
    assert list_res.status_code == 200
    instances_list = list_res.json()
    assert any(i["instance_id"] == instance_id for i in instances_list)
    print(f"Found {len(instances_list)} instance(s) for user.")

    # 3.3 GET /api/prototypes/instances/{instance_id}
    print(f"\nTesting: GET /api/prototypes/instances/{instance_id}")
    detail_res = client.get(f"/api/prototypes/instances/{instance_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["instance_id"] == instance_id
    print("Instance details retrieved successfully.")

    # 3.4 POST /api/prototypes/instances/{instance_id}/host
    print(f"\nTesting: POST /api/prototypes/instances/{instance_id}/host")
    host_res = client.post(f"/api/prototypes/instances/{instance_id}/host", headers=headers)
    assert host_res.status_code == 200
    assert host_res.json()["deployment_status"] in ("PENDING", "BUILDING", "READY")
    print("Host workflow triggered! Status is PENDING/BUILDING.")

    # 3.5 GET /api/prototypes/instances/{instance_id}/deployment-status
    print(f"\nTesting: GET /api/prototypes/instances/{instance_id}/deployment-status")
    status_res = client.get(f"/api/prototypes/instances/{instance_id}/deployment-status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    print("Deployment status response:", status_data)

    # 3.6 Trigger synchronous build test directly to verify build engine output
    print("\nTesting: BuildEngineService isolated build pipeline...")
    build_result = BuildEngineService.execute_build_and_deploy(SessionLocal, instance_id)
    print("Build engine result:", build_result)
    assert build_result["status"] == "READY", f"Build failed: {build_result}"
    print(f"Build engine succeeded! Live URL: {build_result['live_url']}")

    # Check updated status via API
    status_res2 = client.get(f"/api/prototypes/instances/{instance_id}/deployment-status", headers=headers)
    assert status_res2.status_code == 200
    assert status_res2.json()["deployment_status"] == "READY"
    assert status_res2.json()["live_url"] is not None
    print("API confirmed status is READY with live_url!")

    # Verify Email Dispatch
    from app.core.config import settings
    email_files = list(settings.EMAILS_DIR.glob(f"{instance_id}_*.html"))
    assert len(email_files) > 0, "Email notification file was not generated"
    print(f"Verified deployment notification email generated at: {email_files[0]}")

    # Verify Public Instance Access without Auth (simulating opening link from email)
    print(f"\nTesting: Public Link Access without Auth for: {instance_id}")
    public_res = client.get(f"/api/prototypes/instances/{instance_id}")
    assert public_res.status_code == 200
    assert public_res.json()["instance_id"] == instance_id
    print("Direct email link opens instance details successfully without auth!")

    # Verify Source Code Files for Code Viewer
    print(f"\nTesting: GET /api/prototypes/instances/{instance_id}/files")
    files_res = client.get(f"/api/prototypes/instances/{instance_id}/files")
    assert files_res.status_code == 200
    files_data = files_res.json()
    assert len(files_data["files"]) > 0
    file_names = [f["name"] for f in files_data["files"]]
    print("Files retrieved for code viewer:", file_names)
    assert "branding.json" in file_names
    print("Verified branding.json exists in files for interactive code viewer!")

    # 3.7 GET /api/prototypes/instances/{instance_id}/download
    print(f"\nTesting: GET /api/prototypes/instances/{instance_id}/download")
    dl_res = client.get(f"/api/prototypes/instances/{instance_id}/download", headers=headers)
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/zip"
    assert len(dl_res.content) > 500
    print(f"Source ZIP downloaded successfully! Size: {len(dl_res.content)} bytes.")

    # 3.8 POST /api/prototypes/instances/{instance_id}/redeploy
    print(f"\nTesting: POST /api/prototypes/instances/{instance_id}/redeploy")
    redeploy_payload = {
        "appName": "Acme CRM Pro Edition",
        "primaryColor": "#059669"
    }
    redeploy_res = client.post(f"/api/prototypes/instances/{instance_id}/redeploy", json=redeploy_payload, headers=headers)
    assert redeploy_res.status_code == 200
    assert redeploy_res.json()["deployment_status"] in ("PENDING", "BUILDING", "READY")
    print("Redeploy endpoint triggered successfully.")

    # 3.9 DELETE /api/prototypes/instances/{instance_id}
    print(f"\nTesting: DELETE /api/prototypes/instances/{instance_id}")
    del_res = client.delete(f"/api/prototypes/instances/{instance_id}", headers=headers)
    assert del_res.status_code == 200
    print(f"Instance {instance_id} deleted successfully.")

    # Verify deleted
    verify_del = client.get(f"/api/prototypes/instances/{instance_id}", headers=headers)
    assert verify_del.status_code == 404
    print("Verified instance is 404 Not Found after deletion.")

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
