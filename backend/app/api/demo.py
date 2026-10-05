from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import User, Category, StandardMaterial
from backend.app.schemas.schemas import CompareRequest, CompareResponse, UserResponse
from backend.app.services.ai.matching_engine import MatchingEngine
from backend.app.services.ai.code_generator import StandardCodeGenerator

router = APIRouter(prefix="/demo", tags=["Demo Playground & Auth"])

# Preset demo pairs for instantaneous SIH presentation
PRESET_PAIRS = [
    {
        "title": "1. Format Normalization (SS Hex Bolt)",
        "category": "Fasteners",
        "desc_a": "HEX BOLT M10 X 50 SS",
        "desc_b": "SS HEXAGONAL BOLT 10MM X 50MM",
        "uom_a": "NOS",
        "uom_b": "NUMBERS",
        "expected": "MATCH"
    },
    {
        "title": "2. Synonyms & Units (Armoured Cable)",
        "category": "Cables & Wires",
        "desc_a": "CU CABLE 4 CORE 10 SQMM",
        "desc_b": "COPPER CABLE 4 CORE 10 MM2",
        "uom_a": "MTR",
        "uom_b": "METERS",
        "expected": "MATCH"
    },
    {
        "title": "3. Dimension Conflict (M10 vs M12)",
        "category": "Fasteners",
        "desc_a": "SS HEX BOLT M10 X 50",
        "desc_b": "SS HEX BOLT M12 X 50",
        "uom_a": "NOS",
        "uom_b": "NOS",
        "expected": "TECHNICAL CONFLICT"
    },
    {
        "title": "4. Metallurgy Conflict (MS vs SS)",
        "category": "Fasteners",
        "desc_a": "MS BOLT M10 X 50",
        "desc_b": "SS BOLT M10 X 50",
        "uom_a": "NOS",
        "uom_b": "NOS",
        "expected": "TECHNICAL CONFLICT"
    },
    {
        "title": "5. Product Incompatibility (Bearing vs Housing)",
        "category": "Bearings",
        "desc_a": "BALL BEARING 6205",
        "desc_b": "BEARING HOUSING 6205",
        "uom_a": "NOS",
        "uom_b": "NOS",
        "expected": "DO NOT MATCH"
    },
    {
        "title": "6. Deep Groove Ball Bearings (SKF / 2RS)",
        "category": "Bearings",
        "desc_a": "BEARING BALL 6205",
        "desc_b": "BALL BEARING 6205 2RS SKF",
        "uom_a": "NOS",
        "uom_b": "NOS",
        "expected": "MATCH"
    },
    {
        "title": "7. Cast Steel Gate Valves (Class 150)",
        "category": "Valves",
        "desc_a": "GATE VLV 2\" CL150 WCB",
        "desc_b": "2 INCH CLASS 150 CAST STEEL GATE VALVE",
        "uom_a": "NOS",
        "uom_b": "NOS",
        "expected": "MATCH"
    },
    {
        "title": "8. Heavy Induction Motors (15 HP 415V)",
        "category": "Electric Motors",
        "desc_a": "IND MTR 15HP 415V 1440RPM",
        "desc_b": "15 HP 415 VOLT SQUIRREL CAGE INDUCTION MOTOR",
        "uom_a": "NOS",
        "uom_b": "NOS",
        "expected": "MATCH"
    },
]

@router.get("/presets")
def get_preset_comparisons():
    """Returns curated demonstration pairs showcasing cross-CPSE semantic harmonization."""
    return PRESET_PAIRS

@router.post("/compare", response_model=CompareResponse)
def compare_materials_live(payload: CompareRequest, db: Session = Depends(get_db)):
    """
    Live interactive material comparison engine.
    Runs 6-layer matching, attribute extraction, and explainable AI breakdown.
    """
    if not payload.description_a.strip() or not payload.description_b.strip():
        raise HTTPException(status_code=400, detail="Both material descriptions must be provided.")

    match_result = MatchingEngine.compare_materials(
        desc_a=payload.description_a,
        desc_b=payload.description_b,
        category_a=payload.category,
        category_b=payload.category,
        uom_a=payload.uom_a,
        uom_b=payload.uom_b
    )

    attrs_a = match_result["attributes_a"]
    attrs_b = match_result["attributes_b"]

    # Generate canonical standardized identity
    p_type = attrs_a.get("product_type") or attrs_b.get("product_type") or "Standard Item"
    m_type = attrs_a.get("material_type") or attrs_b.get("material_type") or "Specification"
    dim = attrs_a.get("dimensions") or attrs_b.get("dimensions")
    grade = attrs_a.get("grade") or attrs_b.get("grade")

    std_title = StandardCodeGenerator.generate_standard_title(p_type, m_type, dim, grade)
    std_code = StandardCodeGenerator.generate_code(payload.category[:3].upper() if payload.category else "GEN", 128)

    return CompareResponse(
        is_equivalent=match_result["is_equivalent"],
        verdict=match_result["verdict"],
        match_status=match_result["match_status"],
        confidence_score=match_result["confidence_score"],
        recommendation=match_result.get("recommendation"),
        normalized_a=match_result.get("normalized_a"),
        normalized_b=match_result.get("normalized_b"),
        attributes_a=attrs_a,
        attributes_b=attrs_b,
        attribute_comparisons=match_result.get("attribute_comparisons", []),
        critical_conflicts=match_result.get("critical_conflicts", []),
        has_critical_conflict=match_result.get("has_critical_conflict", False),
        conflict_summary=match_result.get("conflict_summary"),
        breakdown=match_result["breakdown"],
        suggested_standard_code=std_code,
        suggested_standard_name=std_title
    )

@router.post("/auth/demo-login")
def demo_login(role: str = "admin", db: Session = Depends(get_db)):
    """
    Zero-friction demo login for SIH presentation.
    Supports Admin, Reviewer, and Viewer roles.
    """
    role_clean = role.lower().strip()
    if role_clean not in ["admin", "reviewer", "viewer"]:
        role_clean = "admin"

    user = db.query(User).filter(User.role == role_clean).first()
    if not user:
        user = db.query(User).first()

    return {
        "access_token": f"samhita-demo-token-{role_clean}",
        "token_type": "bearer",
        "user": {
            "id": user.id if user else 1,
            "username": user.username if user else "admin",
            "email": user.email if user else "admin@samhita.gov.in",
            "full_name": user.full_name if user else "Dr. Rajesh Sharma (Chief Technical Officer)",
            "role": role_clean
        }
    }
