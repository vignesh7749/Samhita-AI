from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.schemas import (
    HarmonizationGroup, HarmonizationMetricsResponse,
    StandardMaterialCatalogItem, AssignMaterialRequest
)
from backend.app.services.harmonization_service import HarmonizationService

router = APIRouter(prefix="/harmonization", tags=["Cross-CPSE Harmonization"])

@router.get("/metrics", response_model=HarmonizationMetricsResponse)
def get_harmonization_metrics(db: Session = Depends(get_db)):
    """
    Returns real database metrics on cross-CPSE harmonization and potential SKU reduction (Section 18 & 19).
    """
    return HarmonizationService.get_harmonization_metrics(db)

@router.get("/groups", response_model=List[HarmonizationGroup])
def get_harmonization_groups(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    cpse_code: Optional[str] = None,
    status: Optional[str] = None,
    min_cpse_count: int = Query(1, ge=1, le=5),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns standardized material families with all equivalent cross-CPSE material records grouped together.
    Includes CPSE coverage, Stage 2 matching evidence, and canonical attributes.
    """
    return HarmonizationService.get_harmonization_groups(
        db=db,
        search=search,
        category_id=category_id,
        cpse_code=cpse_code,
        status=status,
        min_cpse_count=min_cpse_count,
        page=page,
        page_size=limit
    )

@router.get("/groups/{id}", response_model=HarmonizationGroup)
def get_harmonization_group_by_id(id: int, db: Session = Depends(get_db)):
    """
    Retrieves full detail for a single material family cluster by standard material ID (Section 11 & 16).
    """
    group = HarmonizationService.get_group_by_id(db, id)
    if not group:
        raise HTTPException(status_code=404, detail="Material family group not found.")
    return group

@router.get("/catalog", response_model=Dict[str, Any])
def get_unified_catalog(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Unified Standard Material Master Catalog (Section 10).
    Displays Standard Code, Title, Category, Metallurgy, Key Specs, CPSE Count, Records, Status, and Confidence.
    """
    return HarmonizationService.get_unified_catalog(
        db=db,
        search=search,
        category_id=category_id,
        status=status,
        page=page,
        page_size=page_size
    )

@router.post("/materials/{id}/assign")
def assign_material_to_group(
    id: int,
    payload: AssignMaterialRequest,
    db: Session = Depends(get_db)
):
    """
    Assigns a material to an existing or newly generated standard material identity.
    """
    try:
        return HarmonizationService.assign_material_to_group(
            db=db,
            material_id=id,
            standard_material_id=payload.standard_material_id,
            create_new=payload.create_new_standard,
            std_code=payload.standard_code,
            std_name=payload.standard_name,
            reviewer_name=payload.reviewer_name or "Admin User",
            notes=payload.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
