from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import (
    Material, StandardMaterial, MaterialMatch, ReviewDecision, AuditLog, CPSE, Category, HumanFeedback
)
from backend.app.schemas.schemas import ReviewQueueItem, ReviewDecisionRequest, DuplicatePair, HumanFeedbackItem
from backend.app.services.ai.matching_engine import MatchingEngine
from backend.app.services.ai.similarity import SimilarityEngine
from backend.app.services.harmonization_service import HarmonizationService
from backend.app.auth.rbac import require_role

router = APIRouter(prefix="/review", tags=["Review & Human-in-the-Loop"])

@router.get("/queue", response_model=dict)
def get_review_queue(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns materials in 'needs_review' or 'ai_suggested' status awaiting human decision.
    """
    query = (
        db.query(Material)
        .join(CPSE)
        .join(Category)
        .outerjoin(StandardMaterial)
        .filter(Material.match_status.in_(["needs_review", "ai_suggested"]))
        .order_by(Material.confidence_score.asc())
    )

    total = query.count()
    records = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for m in records:
        match_rec = db.query(MaterialMatch).filter(MaterialMatch.source_material_id == m.id).first()
        reason = match_rec.match_explanation if match_rec else (
            f"AI identified potential alignment with {m.standard_material.name if m.standard_material else 'standard catalog'}. Human confirmation required."
        )
        dim_sim = match_rec.dimension_sim if match_rec else 85.0
        mat_sim = match_rec.material_sim if match_rec else 85.0

        items.append(ReviewQueueItem(
            match_id=match_rec.id if match_rec else None,
            material_id=m.id,
            material_code=m.material_code,
            original_description=m.original_description,
            normalized_description=m.normalized_description,
            cpse_code=m.cpse.code,
            category_name=m.category.name,
            suggested_standard_id=m.standard_material_id,
            suggested_standard_code=m.standard_material.standard_code if m.standard_material else None,
            suggested_standard_name=m.standard_material.name if m.standard_material else None,
            confidence=m.confidence_score or 0.0,
            reason=reason,
            dimension_sim=dim_sim,
            material_sim=mat_sim
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

@router.post("/decision/{material_id}")
def submit_review_decision(
    material_id: int,
    payload: ReviewDecisionRequest,
    current_role: str = Depends(require_role(["admin", "reviewer"])),
    db: Session = Depends(get_db)
):
    """
    Submits human approval, rejection, or modification.
    Requires ADMIN or REVIEWER role.
    Updates material status, records ReviewDecision, HumanFeedback, and writes immutable AuditLog entry.
    """
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found.")

    prev_state = mat.match_status
    decision = payload.decision.lower().strip()
    orig_std_code = mat.standard_material.standard_code if mat.standard_material else None
    human_std_code = orig_std_code

    if decision == "approved":
        new_state = "approved"
        mat.match_status = "approved"
        mat.harmonization_status = "HARMONIZED"
        action_name = "Approve AI Suggestion"
        reason = payload.notes or "Technical parameters, attributes and UOM verified by human reviewer."
        reason_cat = payload.rejection_category or "Human Verified Standard"

    elif decision == "rejected":
        new_state = "rejected"
        mat.match_status = "rejected"
        mat.harmonization_status = "CONFLICT"
        mat.standard_material_id = None
        human_std_code = None
        action_name = "Reject AI Suggestion"
        reason = payload.notes or payload.rejection_reason or "Mismatch in specification parameters or grade."
        reason_cat = payload.rejection_category or payload.rejection_reason or "Technical Specification Mismatch"

    elif decision == "modified":
        new_state = "approved"
        mat.match_status = "approved"
        mat.harmonization_status = "HARMONIZED"
        action_name = "Modify Standard Mapping"
        if payload.new_standard_code:
            std = db.query(StandardMaterial).filter(StandardMaterial.standard_code == payload.new_standard_code.strip()).first()
            if std:
                mat.standard_material_id = std.id
                human_std_code = std.standard_code
        reason = payload.notes or f"Manually re-assigned standard identity to {human_std_code}."
        reason_cat = payload.rejection_category or "Re-assigned Canonical Identity"
    else:
        raise HTTPException(status_code=400, detail="Invalid decision. Choose approved, rejected, or modified.")

    # Record ReviewDecision
    review = ReviewDecision(
        material_id=mat.id,
        standard_material_id=mat.standard_material_id,
        reviewer_name=payload.reviewer_name or "Expert Reviewer",
        decision=decision,
        rejection_reason=payload.rejection_reason or reason_cat,
        notes=payload.notes
    )
    db.add(review)

    # Record Structured Human Feedback (Section 11)
    feedback = HumanFeedback(
        material_id=mat.id,
        material_code=mat.material_code,
        original_description=mat.original_description,
        original_standard_code=orig_std_code,
        human_standard_code=human_std_code,
        decision=decision,
        reason_category=reason_cat,
        reason_notes=payload.notes or reason,
        reviewer_name=payload.reviewer_name or "Expert Reviewer",
        reviewer_role=current_role
    )
    db.add(feedback)

    # Record Immutable AuditLog
    audit = AuditLog(
        user_name=payload.reviewer_name or "Expert Reviewer",
        user_role=current_role,
        material_code=mat.material_code,
        previous_state=prev_state.replace("_", " ").title(),
        new_state=new_state.replace("_", " ").title(),
        action=action_name,
        reason=reason
    )
    db.add(audit)

    # Update MaterialMatch status
    match_rec = db.query(MaterialMatch).filter(MaterialMatch.source_material_id == mat.id).first()
    if match_rec:
        match_rec.status = "approved" if decision in ["approved", "modified"] else "rejected"

    db.commit()

    # Synchronize group coverage
    HarmonizationService.sync_material_groups(db)

    return {
        "status": "success",
        "material_id": mat.id,
        "material_code": mat.material_code,
        "new_status": mat.match_status,
        "harmonization_status": mat.harmonization_status,
        "decision": decision,
        "message": f"Successfully updated {mat.material_code} to {new_state}."
    }

@router.get("/feedback", response_model=List[HumanFeedbackItem])
def get_human_feedback(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Retrieves structured human feedback dataset for model improvement oversight (Section 11).
    """
    return db.query(HumanFeedback).order_by(desc(HumanFeedback.created_at)).limit(limit).all()

@router.get("/duplicates", response_model=List[DuplicatePair])
def get_duplicates(
    min_similarity: float = Query(85.0, ge=50.0, le=100.0),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Detects potential duplicate and equivalent materials across different CPSEs.
    """
    # Fetch sample materials grouped by standard material or category to compute duplicate pairs
    materials = (
        db.query(Material)
        .join(CPSE)
        .join(Category)
        .filter(Material.standard_material_id.isnot(None))
        .order_by(Material.standard_material_id, Material.id)
        .limit(200)
        .all()
    )

    duplicate_pairs = []
    # Group by standard_material_id
    by_std = {}
    for m in materials:
        by_std.setdefault(m.standard_material_id, []).append(m)

    for std_id, group in by_std.items():
        if len(group) < 2:
            continue
        # Compare pairs across different CPSEs
        for i in range(len(group)):
            for j in range(i + 1, min(i + 3, len(group))):
                m_a = group[i]
                m_b = group[j]
                if m_a.cpse_id == m_b.cpse_id:
                    continue  # prioritize cross-CPSE duplicates

                fuzzy_score = SimilarityEngine.calculate_fuzzy_scores(
                    m_a.normalized_description, m_b.normalized_description
                )["average_fuzzy"] * 100.0

                sim = round(max(fuzzy_score, (m_a.confidence_score + m_b.confidence_score) / 2.0), 1)

                if sim >= min_similarity:
                    duplicate_pairs.append(DuplicatePair(
                        material_a_id=m_a.id,
                        material_a_code=m_a.material_code,
                        material_a_desc=m_a.original_description,
                        material_a_cpse=m_a.cpse.code,
                        material_b_id=m_b.id,
                        material_b_code=m_b.material_code,
                        material_b_desc=m_b.original_description,
                        material_b_cpse=m_b.cpse.code,
                        similarity_score=sim,
                        category=m_a.category.name,
                        status="Potential Duplicate",
                        explanation=f"Identified {sim}% technical similarity across {m_a.cpse.code} and {m_b.cpse.code}. Shared standard: {m_a.standard_material.standard_code}."
                    ))

                if len(duplicate_pairs) >= limit:
                    break
            if len(duplicate_pairs) >= limit:
                break

    return duplicate_pairs
