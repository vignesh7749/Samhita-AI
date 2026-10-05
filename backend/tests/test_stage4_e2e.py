"""
SAMHITA AI - Stage 4 Comprehensive End-to-End Automated Test Suite
Validates:
1. Ingestion & Pre-flight Data Quality Inspection (Section 5, 6)
2. Human-in-the-Loop Validation, Structured Rejections, and Feedback Trail (Section 7, 8, 9, 10, 11)
3. Role-Based Access Control (RBAC) Backend Authorization (Section 19, 20)
4. AI Natural Language Material Search (Section 15, 16)
5. Strictly Grounded Enterprise AI Assistant (Section 17)
6. Enterprise CSV Report Generation (Section 18)
"""
import io
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.models import Material, StandardMaterial, DuplicateRelationship, HumanFeedback, ImportJob

client = TestClient(app)


def test_import_validation_and_quality_report():
    """
    Tests Section 5 Pre-flight Data Quality Inspection with column auto-detection.
    """
    csv_data = (
        "item_code,item_description,organization,product_family,unit_of_measure,vendor,part_no\n"
        "TEST-BOLT-01,HEX BOLT M10 X 50 SS 304,ONGC,Fasteners,NOS,Unbrako,UB-101\n"
        "TEST-BRG-02,BALL BEARING 6205 2RS,BHEL,Bearings,NOS,SKF,6205\n"
        "TEST-INVALID-03,,NTPC,Fasteners,NOS,,\n"  # Missing description
    ).encode("utf-8")

    files = {"file": ("test_catalog.csv", io.BytesIO(csv_data), "text/csv")}
    response = client.post("/api/import/validate", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 3
    assert data["valid_rows"] == 2
    assert data["invalid_rows"] == 1
    assert data["missing_descriptions"] == 1
    assert "material_code" in data["detected_columns"]
    assert "description" in data["detected_columns"]
    assert len(data["potential_issues"]) > 0


def test_rbac_import_authorization():
    """
    Tests Section 19 & 20 RBAC:
    - Viewers MUST receive HTTP 403 on import.
    - Admins are permitted.
    """
    csv_data = (
        "material_code,description,category,uom\n"
        "RBAC-TEST-01,HEX BOLT M10 X 50 SS,Fasteners,NOS\n"
    ).encode("utf-8")

    files = {"file": ("rbac_test.csv", io.BytesIO(csv_data), "text/csv")}
    
    # 1. Viewer attempt -> HTTP 403
    res_viewer = client.post(
        "/api/import/upload?cpse_code=ONGC",
        files=files,
        headers={"X-User-Role": "viewer"}
    )
    assert res_viewer.status_code == 403
    assert "Access Denied" in res_viewer.json()["detail"]

    # 2. Admin attempt -> HTTP 200
    files_admin = {"file": ("rbac_test.csv", io.BytesIO(csv_data), "text/csv")}
    res_admin = client.post(
        "/api/import/upload?cpse_code=ONGC",
        files=files_admin,
        headers={"X-User-Role": "admin"}
    )
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert data["status"] in ["success", "completed", "completed_with_issues"]
    assert data["successful_records"] >= 1


def test_import_job_tracking():
    """
    Tests Section 6 Import Job History logging.
    """
    response = client.get("/api/import/jobs")
    assert response.status_code == 200
    jobs = response.json()
    assert isinstance(jobs, list)
    if jobs:
        first_job = jobs[0]
        assert "file_name" in first_job
        assert "cpse_code" in first_job
        assert "status" in first_job
        assert "uploaded_by" in first_job


def test_human_review_workflow_and_feedback():
    """
    Tests Section 7, 8, 9, 10, 11 Review Decisions (Approve, Reject with Structured Reason, Modify)
    and verification of Human Feedback database logging.
    """
    db = SessionLocal()
    # Find a test candidate or create a temporary record
    mat = db.query(Material).first()
    mat_id = mat.id
    db.close()

    # 1. Reviewer approves material
    res_approve = client.post(
        f"/api/review/decision/{mat_id}",
        json={
            "decision": "approved",
            "reviewer_name": "Test Reviewer",
            "notes": "Verified against engineering standard"
        },
        headers={"X-User-Role": "reviewer"}
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["decision"] == "approved"

    # 2. Reviewer rejects material with structured category
    res_reject = client.post(
        f"/api/review/decision/{mat_id}",
        json={
            "decision": "rejected",
            "rejection_category": "Dimension / Sizing Mismatch",
            "rejection_reason": "Bolt length is 50mm whereas standard requires 60mm.",
            "notes": "Dimension mismatch",
            "reviewer_name": "Test Reviewer"
        },
        headers={"X-User-Role": "reviewer"}
    )
    assert res_reject.status_code == 200
    assert res_reject.json()["decision"] == "rejected"

    # 3. Viewer attempts review -> HTTP 403
    res_viewer = client.post(
        f"/api/review/decision/{mat_id}",
        json={"decision": "approved"},
        headers={"X-User-Role": "viewer"}
    )
    assert res_viewer.status_code == 403

    # 4. Verify Human Feedback trail (Section 11)
    res_fb = client.get("/api/review/feedback?limit=10")
    assert res_fb.status_code == 200
    feedbacks = res_fb.json()
    assert len(feedbacks) >= 1
    found_rejection = any(f["reason_category"] == "Dimension / Sizing Mismatch" for f in feedbacks)
    assert found_rejection


def test_natural_language_search():
    """
    Tests Section 15 & 16 Natural Language Search Grounding.
    """
    # 1. Fastener dimension query
    res1 = client.get("/api/search/nl?q=Find 10mm stainless steel bolts")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["total_matches"] > 0
    top_result = data1["results"][0]
    assert "STD-FST-00128" in [r["standard_code"] for r in data1["results"]]
    assert top_result["relevance_score"] >= 60.0

    # 2. Specific Bearing Rating query
    res2 = client.get("/api/search/nl?q=Find bearing 6205")
    assert res2.status_code == 200
    data2 = res2.json()
    assert any("6205" in r["name"] for r in data2["results"])

    # 3. Direct Standard Code query
    res3 = client.get("/api/search/nl?q=STD-FST-00128")
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["total_matches"] >= 1
    assert data3["results"][0]["standard_code"] == "STD-FST-00128"
    assert data3["results"][0]["relevance_score"] > 95.0


def test_strictly_grounded_ai_assistant():
    """
    Tests Section 17 Enterprise AI Assistant.
    Must query real database stats and return 'Insufficient data available.' on ungrounded queries.
    """
    # 1. Harmonization Count
    res1 = client.post("/api/assistant/ask", json={"question": "How many materials are harmonized?"})
    assert res1.status_code == 200
    ans1 = res1.json()
    assert ans1["grounded"] is True
    assert "harmonized" in ans1["answer"].lower()
    assert "total_materials" in ans1["key_metrics"]

    # 2. Duplicate CPSE Ranking
    res2 = client.post("/api/assistant/ask", json={"question": "Which CPSE has the most potential duplicates?"})
    assert res2.status_code == 200
    ans2 = res2.json()
    assert ans2["grounded"] is True
    assert len(ans2["data_table"]) > 0

    # 3. Standard Material CPSE Usage
    res3 = client.post("/api/assistant/ask", json={"question": "Show me all CPSEs using STD-FST-00128"})
    assert res3.status_code == 200
    ans3 = res3.json()
    assert ans3["grounded"] is True
    assert "STD-FST-00128" in ans3["answer"]
    assert len(ans3["data_table"]) > 0

    # 4. Potential SKU Reduction Rate
    res4 = client.post("/api/assistant/ask", json={"question": "What is the SKU reduction rate?"})
    assert res4.status_code == 200
    ans4 = res4.json()
    assert ans4["grounded"] is True
    assert "potential_sku_reduction" in ans4["key_metrics"]

    # 5. Strictly Grounded Fallback: Insufficient data available
    res5 = client.post("/api/assistant/ask", json={"question": "What is the weather in Delhi?"})
    assert res5.status_code == 200
    ans5 = res5.json()
    assert ans5["grounded"] is False
    assert "Insufficient data available." in ans5["answer"]


def test_enterprise_report_exports():
    """
    Tests Section 18 CSV Report Generation.
    """
    endpoints = [
        "/api/reports/standard-catalog/export",
        "/api/reports/harmonization/export",
        "/api/reports/duplicates/export",
        "/api/reports/reviews/export",
        "/api/reports/cpse-summary/export",
        "/api/reports/audit/export"
    ]

    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        assert len(res.text) > 0
        assert "\n" in res.text  # Valid multi-line CSV
