from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.schemas import DuplicatePair, DuplicateActionRequest
from backend.app.services.harmonization_service import HarmonizationService
from backend.app.auth.rbac import require_role

router = APIRouter(prefix="/duplicates", tags=["Duplicate Detection & Merging"])

@router.get("", response_model=List[DuplicatePair])
def get_duplicates(
    min_similarity: float = Query(70.0, ge=40.0, le=100.0),
    relationship_type: Optional[str] = Query(None, description="exact_duplicate, near_duplicate, potential_duplicate, non_duplicate"),
    status: Optional[str] = Query("pending", description="pending, merged, kept_separate, conflict, ALL"),
    category_name: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieves cross-CPSE duplicate pairs classified by Stage 2 evidence (Section 12, 13).
    """
    return HarmonizationService.get_duplicates(
        db=db,
        min_similarity=min_similarity,
        relationship_type=relationship_type,
        status=status,
        category_name=category_name,
        limit=limit
    )

@router.get("/{id}", response_model=DuplicatePair)
def get_duplicate_detail(id: int, db: Session = Depends(get_db)):
    """
    Retrieves details for a specific duplicate candidate pair.
    """
    dupes = HarmonizationService.get_duplicates(db=db, status="ALL", limit=500)
    for d in dupes:
        if d.id == id:
            return d
    raise HTTPException(status_code=404, detail=f"Duplicate pair with ID {id} not found.")

@router.post("/{id}/merge", dependencies=[Depends(require_role(["admin", "reviewer"]))])
def merge_duplicate(
    id: int,
    payload: DuplicateActionRequest,
    db: Session = Depends(get_db)
):
    """
    Executes safe, non-destructive merge of duplicate records into a common canonical standard material identity (Section 14 & 15).
    Preserves all original CPSE codes and records while linking them to the standardized identity.
    """
    try:
        return HarmonizationService.merge_duplicate(
            db=db,
            duplicate_id=id,
            reviewer_name=payload.reviewer_name or "Admin User",
            notes=payload.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{id}/keep-separate", dependencies=[Depends(require_role(["admin", "reviewer"]))])
def keep_separate_duplicate(
    id: int,
    payload: DuplicateActionRequest,
    db: Session = Depends(get_db)
):
    """
    Explicitly flags the records as distinct materials in procurement catalog to prevent accidental regrouping (Section 14).
    """
    try:
        return HarmonizationService.keep_separate_duplicate(
            db=db,
            duplicate_id=id,
            reviewer_name=payload.reviewer_name or "Admin User",
            notes=payload.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
