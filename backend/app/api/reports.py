"""
SAMHITA AI - Enterprise Reporting & Data Export API Router (Section 18)
Provides clean CSV and spreadsheet-compatible export endpoints for:
- Standard Material Catalog
- Cross-CPSE Harmonization Results
- Duplicate Detection Records
- Human Review & Feedback Decisions
- CPSE Portfolio Summary
- Governance Audit Trail
"""
import io
import csv
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import (
    StandardMaterial, Material, CPSE, Category, MaterialGroup,
    DuplicateRelationship, ReviewDecision, HumanFeedback, AuditLog
)

router = APIRouter(prefix="/reports", tags=["Enterprise Reporting & Data Export"])


@router.get("/standard-catalog/export")
def export_standard_catalog(db: Session = Depends(get_db)):
    """
    Exports the Unified Standard Material Catalog as CSV.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Standard Code", "Canonical Name", "Category", "Normalized Specification",
        "Base UOM", "Status", "Confidence (%)", "Linked CPSEs", "Total Linked Records"
    ])

    stds = db.query(StandardMaterial).order_by(StandardMaterial.standard_code.asc()).all()
    for s in stds:
        members = db.query(Material).filter(Material.standard_material_id == s.id).all()
        cpses = sorted(list(set(m.cpse.code for m in members if m.cpse)))
        cat_name = s.category.name if s.category else ""
        writer.writerow([
            s.standard_code,
            s.name,
            cat_name,
            s.normalized_spec,
            s.base_uom,
            s.harmonization_status,
            round(s.group_confidence, 1) if s.group_confidence else 0.0,
            "; ".join(cpses),
            len(members)
        ])

    csv_data = output.getvalue()
    filename = f"samhita_standard_catalog_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/harmonization/export")
def export_harmonization_results(db: Session = Depends(get_db)):
    """
    Exports cross-CPSE material harmonization mapping records as CSV.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Standard Code", "Canonical Name", "CPSE", "CPSE Material Code",
        "Original Description", "Normalized Description", "UOM", "Match Status",
        "Confidence (%)", "Harmonization Status"
    ])

    materials = db.query(Material).join(Material.cpse).order_by(Material.standard_material_id.asc(), Material.id.asc()).all()
    for m in materials:
        std_code = m.standard_material.standard_code if m.standard_material else "UNASSIGNED"
        std_name = m.standard_material.name if m.standard_material else "Unassigned Material"
        cpse_code = m.cpse.code if m.cpse else ""
        writer.writerow([
            std_code,
            std_name,
            cpse_code,
            m.material_code,
            m.original_description,
            m.normalized_description,
            m.uom,
            m.match_status,
            round(m.confidence_score, 1),
            m.harmonization_status
        ])

    csv_data = output.getvalue()
    filename = f"samhita_harmonization_mapping_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/duplicates/export")
def export_duplicates(db: Session = Depends(get_db)):
    """
    Exports detected cross-CPSE duplicate pairs as CSV.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Relationship ID", "CPSE A", "Material Code A", "Description A",
        "CPSE B", "Material Code B", "Description B",
        "Relationship Type", "Confidence (%)", "Status", "Decision Notes"
    ])

    dupes = db.query(DuplicateRelationship).order_by(DuplicateRelationship.id.asc()).all()
    for d in dupes:
        mat_a = db.query(Material).filter(Material.id == d.material_a_id).first()
        mat_b = db.query(Material).filter(Material.id == d.material_b_id).first()
        cpse_a = mat_a.cpse.code if mat_a and mat_a.cpse else ""
        code_a = mat_a.material_code if mat_a else ""
        desc_a = mat_a.original_description if mat_a else ""
        cpse_b = mat_b.cpse.code if mat_b and mat_b.cpse else ""
        code_b = mat_b.material_code if mat_b else ""
        desc_b = mat_b.original_description if mat_b else ""

        writer.writerow([
            d.id,
            cpse_a,
            code_a,
            desc_a,
            cpse_b,
            code_b,
            desc_b,
            d.relationship_type,
            round(d.confidence, 1),
            d.status,
            d.decision_notes or ""
        ])

    csv_data = output.getvalue()
    filename = f"samhita_duplicate_records_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reviews/export")
def export_reviews(db: Session = Depends(get_db)):
    """
    Exports human validation decisions and feedback logs as CSV.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Feedback ID", "Material Code", "Original Description", "Original Standard Code",
        "Human Assigned Code", "Decision", "Reason Category", "Reason Notes",
        "Reviewer Name", "Reviewer Role", "Timestamp"
    ])

    feedback_records = db.query(HumanFeedback).order_by(HumanFeedback.id.desc()).all()
    for fb in feedback_records:
        writer.writerow([
            fb.id,
            fb.material_code,
            fb.original_description,
            fb.original_standard_code or "N/A",
            fb.human_standard_code or "N/A",
            fb.decision,
            fb.reason_category or "",
            fb.reason_notes or "",
            fb.reviewer_name,
            fb.reviewer_role,
            fb.created_at.isoformat() if fb.created_at else ""
        ])

    csv_data = output.getvalue()
    filename = f"samhita_human_reviews_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/cpse-summary/export")
def export_cpse_summary(db: Session = Depends(get_db)):
    """
    Exports CPSE inventory harmonization summary metrics as CSV.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "CPSE Code", "Enterprise Name", "Sector", "Total Materials",
        "Harmonized Count", "Harmonization Rate (%)", "Candidate Count", "Sector Focus"
    ])

    cpses = db.query(CPSE).order_by(CPSE.code.asc()).all()
    for c in cpses:
        total = db.query(Material).filter(Material.cpse_id == c.id).count()
        harm = db.query(Material).filter(Material.cpse_id == c.id, Material.harmonization_status == "HARMONIZED").count()
        cand = db.query(Material).filter(Material.cpse_id == c.id, Material.harmonization_status == "CANDIDATE").count()
        rate = round((harm / total * 100), 1) if total > 0 else 0.0

        writer.writerow([
            c.code,
            c.name,
            c.sector,
            total,
            harm,
            rate,
            cand,
            c.sector
        ])

    csv_data = output.getvalue()
    filename = f"samhita_cpse_summary_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/audit/export")
def export_audit_trail(db: Session = Depends(get_db)):
    """
    Exports enterprise governance audit trail as CSV.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Audit ID", "Timestamp", "User Name", "User Role",
        "Material Code", "Action", "Previous State", "New State", "Reason"
    ])

    audits = db.query(AuditLog).order_by(AuditLog.id.desc()).all()
    for a in audits:
        writer.writerow([
            a.id,
            a.timestamp.isoformat() if a.timestamp else "",
            a.user_name,
            a.user_role,
            a.material_code,
            a.action,
            a.previous_state,
            a.new_state,
            a.reason or ""
        ])

    csv_data = output.getvalue()
    filename = f"samhita_audit_trail_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
