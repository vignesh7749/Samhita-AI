import io
import pandas as pd
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.database.session import get_db
from backend.app.models.models import Material, CPSE, Category, StandardMaterial, MaterialAttribute, MaterialMatch, AuditLog, ImportJob
from backend.app.schemas.schemas import MaterialListItem, MaterialDetail, MatchBreakdown, MaterialAttributeSchema, HarmonizedMaterialItem
from backend.app.services.ai.normalizer import MaterialNormalizer
from backend.app.services.ai.attribute_extractor import AttributeExtractor
from backend.app.services.ai.matching_engine import MatchingEngine
from backend.app.services.ai.code_generator import StandardCodeGenerator

router = APIRouter(prefix="/materials", tags=["Materials"])

@router.get("", response_model=dict)
def get_materials(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    cpse_code: Optional[str] = None,
    category_code: Optional[str] = None,
    match_status: Optional[str] = None,
    harmonization_status: Optional[str] = None,
    confidence_tier: Optional[str] = None,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db)
):
    """
    Retrieves paginated material master records with search, filters, and sorting.
    """
    query = db.query(Material).join(CPSE).join(Category).outerjoin(StandardMaterial)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Material.material_code.ilike(search_filter),
                Material.original_description.ilike(search_filter),
                Material.normalized_description.ilike(search_filter),
                Material.manufacturer.ilike(search_filter),
                Material.part_number.ilike(search_filter),
                StandardMaterial.standard_code.ilike(search_filter),
                StandardMaterial.name.ilike(search_filter)
            )
        )

    if cpse_code and cpse_code != "ALL":
        query = query.filter(CPSE.code == cpse_code)

    if category_code and category_code != "ALL":
        query = query.filter(Category.code == category_code)

    if match_status and match_status != "ALL":
        query = query.filter(Material.match_status == match_status)

    if harmonization_status and harmonization_status != "ALL":
        query = query.filter(Material.harmonization_status == harmonization_status)

    if confidence_tier and confidence_tier != "ALL":
        tier = confidence_tier.upper()
        if tier == "HIGH":
            query = query.filter(Material.confidence_score >= 90.0)
        elif tier == "MEDIUM":
            query = query.filter(Material.confidence_score >= 70.0, Material.confidence_score < 90.0)
        elif tier == "LOW":
            query = query.filter(Material.confidence_score < 70.0)

    total_count = query.count()

    # Sorting
    sort_col = getattr(Material, sort_by, Material.id)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    records = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for r in records:
        items.append({
            "id": r.id,
            "material_code": r.material_code,
            "original_description": r.original_description,
            "normalized_description": r.normalized_description,
            "cpse_code": r.cpse.code,
            "cpse_name": r.cpse.name,
            "category_code": r.category.code,
            "category_name": r.category.name,
            "uom": r.uom,
            "standard_code": r.standard_material.standard_code if r.standard_material else None,
            "standard_name": r.standard_material.name if r.standard_material else None,
            "match_status": r.match_status,
            "harmonization_status": r.harmonization_status or "HARMONIZED",
            "confidence_score": r.confidence_score or 0.0,
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }

@router.get("/{id}", response_model=MaterialDetail)
def get_material_detail(id: int, db: Session = Depends(get_db)):
    """
    Retrieves full detail of a material with normalized view, attributes,
    standard code assignment, and AI match explainability breakdown.
    """
    mat = db.query(Material).filter(Material.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material record not found.")

    # Fetch attributes
    attrs_data = None
    if mat.attributes:
        attrs_data = MaterialAttributeSchema(
            material_type=mat.attributes.material_type,
            product_type=mat.attributes.product_type,
            dimensions=mat.attributes.dimensions,
            grade=mat.attributes.grade,
            size_rating=mat.attributes.size_rating,
            capacity=mat.attributes.capacity,
            voltage=mat.attributes.voltage,
            pressure=mat.attributes.pressure,
            uom=mat.attributes.uom,
            manufacturer=mat.attributes.manufacturer,
            model=mat.attributes.model,
            extra_attributes=mat.attributes.extra_attributes_json or {}
        )
    else:
        # Extract on-the-fly
        extracted = AttributeExtractor.extract(mat.original_description)
        attrs_data = MaterialAttributeSchema(**extracted)

    # Fetch match breakdown & comparisons
    match_rec = db.query(MaterialMatch).filter(MaterialMatch.source_material_id == mat.id).first()
    attr_comparisons = None
    crit_conflicts = None
    has_crit_conflict = False

    if mat.standard_material:
        comp = MatchingEngine.compare_materials(
            desc_a=mat.original_description,
            desc_b=mat.standard_material.normalized_spec,
            category_a=mat.category.name,
            category_b=mat.category.name,
            uom_a=mat.uom,
            uom_b=mat.standard_material.base_uom
        )
        bd = comp["breakdown"]
        breakdown = MatchBreakdown(**bd)
        attr_comparisons = comp.get("attribute_comparisons")
        crit_conflicts = comp.get("critical_conflicts")
        has_crit_conflict = comp.get("has_critical_conflict", False)
    elif match_rec:
        breakdown = MatchBreakdown(
            overall_confidence=match_rec.overall_confidence,
            description_sim=match_rec.description_sim,
            dimension_sim=match_rec.dimension_sim,
            material_sim=match_rec.material_sim,
            category_sim=match_rec.category_sim,
            uom_compatibility=match_rec.uom_compatibility,
            explanation=match_rec.match_explanation
        )
    else:
        breakdown = MatchBreakdown(
            overall_confidence=0.0,
            description_sim=0.0,
            dimension_sim=0.0,
            material_sim=0.0,
            category_sim=0.0,
            uom_compatibility=0.0,
            explanation="Unmatched material record awaiting harmonization."
        )

    # Fetch cross-CPSE related materials mapped under same standard identity
    related_items = []
    if mat.standard_material and mat.standard_material.source_materials:
        for sm in mat.standard_material.source_materials:
            related_items.append(
                HarmonizedMaterialItem(
                    id=sm.id,
                    material_code=sm.material_code,
                    original_description=sm.original_description,
                    normalized_description=sm.normalized_description,
                    cpse_code=sm.cpse.code,
                    cpse_name=sm.cpse.name,
                    uom=sm.uom,
                    match_status=sm.match_status,
                    harmonization_status=sm.harmonization_status or "HARMONIZED",
                    confidence_score=sm.confidence_score or 0.0
                )
            )

    return MaterialDetail(
        id=mat.id,
        material_code=mat.material_code,
        original_description=mat.original_description,
        normalized_description=mat.normalized_description,
        cpse_id=mat.cpse.id,
        cpse_code=mat.cpse.code,
        cpse_name=mat.cpse.name,
        category_id=mat.category.id,
        category_code=mat.category.code,
        category_name=mat.category.name,
        uom=mat.uom,
        manufacturer=mat.manufacturer,
        part_number=mat.part_number,
        standard_material_id=mat.standard_material_id,
        standard_code=mat.standard_material.standard_code if mat.standard_material else None,
        standard_name=mat.standard_material.name if mat.standard_material else None,
        match_status=mat.match_status,
        harmonization_status=mat.harmonization_status or "HARMONIZED",
        confidence_score=mat.confidence_score or 0.0,
        attributes=attrs_data,
        match_breakdown=breakdown,
        attribute_comparisons=attr_comparisons,
        critical_conflicts=crit_conflicts,
        has_critical_conflict=has_crit_conflict,
        related_materials=related_items,
        created_at=mat.created_at,
        updated_at=mat.updated_at
    )

@router.post("/import", response_model=dict)
async def import_materials_file(
    file: UploadFile = File(...),
    cpse_code: str = Query(..., description="Target CPSE code (e.g. ONGC, BHEL, etc.)"),
    db: Session = Depends(get_db)
):
    """
    Bulk import pipeline for CSV / XLSX:
    Step 1: File Validation
    Step 2: Column Detection
    Step 3: Data Normalization
    Step 4: AI Matching
    Step 5: Review Results
    """
    filename = file.filename or "upload.csv"
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(
            status_code=400,
            detail="Unable to process this file. Please upload a valid CSV or XLSX file."
        )

    content = await file.read()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read file content. Please verify file format and columns. ({str(e)})"
        )

    # Column detection
    cols_map = {}
    for col in df.columns:
        col_lower = str(col).lower().strip()
        if "code" in col_lower or "material_id" in col_lower or "item_code" in col_lower:
            cols_map["code"] = col
        elif "desc" in col_lower or "specification" in col_lower or "item_name" in col_lower or "title" in col_lower:
            cols_map["desc"] = col
        elif "cat" in col_lower or "group" in col_lower:
            cols_map["category"] = col
        elif "uom" in col_lower or "unit" in col_lower:
            cols_map["uom"] = col
        elif "mfg" in col_lower or "maker" in col_lower or "manufacturer" in col_lower:
            cols_map["mfg"] = col
        elif "part" in col_lower or "model" in col_lower:
            cols_map["part"] = col

    if "desc" not in cols_map:
        raise HTTPException(
            status_code=400,
            detail="Unable to process this file. Please verify required columns. 'Description' or 'Material Description' column is required."
        )

    # Resolve CPSE
    cpse = db.query(CPSE).filter(CPSE.code == cpse_code.upper()).first()
    if not cpse:
        cpse = db.query(CPSE).first()

    # Default category fallback
    default_cat = db.query(Category).first()
    categories_all = db.query(Category).all()
    standards_all = db.query(StandardMaterial).all()

    total_records = len(df)
    normalized_count = 0
    matched_count = 0
    preview_items = []

    # Process up to 50 items for live upload demonstration
    for idx, row in df.iterrows():
        raw_desc = str(row[cols_map["desc"]]).strip()
        if not raw_desc or raw_desc.lower() == "nan":
            continue

        raw_code = str(row.get(cols_map.get("code"), f"{cpse.code}-IMP-{idx+1:04d}")).strip()
        uom = str(row.get(cols_map.get("uom"), "NOS")).strip().upper()
        mfg = str(row.get(cols_map.get("mfg"), "")).strip() if "mfg" in cols_map else None
        part = str(row.get(cols_map.get("part"), "")).strip() if "part" in cols_map else None

        # Resolve category
        cat_obj = default_cat
        if "category" in cols_map and pd.notna(row[cols_map["category"]]):
            row_cat_val = str(row[cols_map["category"]]).lower()
            for c in categories_all:
                if c.name.lower() in row_cat_val or c.code.lower() in row_cat_val:
                    cat_obj = c
                    break

        # Step 3: Data Normalization
        norm_desc = MaterialNormalizer.normalize(raw_desc)
        attrs = AttributeExtractor.extract(raw_desc)
        normalized_count += 1

        # Step 4: AI Matching against existing standard materials
        best_std = None
        best_conf = 0.0
        best_breakdown = None

        for std in standards_all:
            comp = MatchingEngine.compare_materials(
                desc_a=norm_desc,
                desc_b=std.normalized_spec,
                category_a=cat_obj.name,
                category_b=std.category.name if std.category else cat_obj.name,
                uom_a=uom,
                uom_b=std.base_uom
            )
            if comp["confidence_score"] > best_conf:
                best_conf = comp["confidence_score"]
                best_std = std
                best_breakdown = comp["breakdown"]

        if best_conf >= 75.0 and best_std:
            status = "approved" if best_conf >= 90.0 else "ai_suggested"
            matched_count += 1
        else:
            status = "needs_review"

        # Create Material record
        mat = Material(
            material_code=raw_code,
            original_description=raw_desc,
            normalized_description=norm_desc,
            cpse_id=cpse.id,
            category_id=cat_obj.id,
            uom=uom if uom != "NAN" else "NOS",
            manufacturer=mfg if mfg != "nan" else None,
            part_number=part if part != "nan" else None,
            standard_material_id=best_std.id if best_std else None,
            match_status=status,
            confidence_score=best_conf
        )
        db.add(mat)
        db.flush()

        # Add attributes
        mat_attr = MaterialAttribute(
            material_id=mat.id,
            material_type=attrs.get("material_type"),
            product_type=attrs.get("product_type"),
            dimensions=attrs.get("dimensions"),
            grade=attrs.get("grade"),
            size_rating=attrs.get("size_rating"),
            capacity=attrs.get("capacity"),
            voltage=attrs.get("voltage"),
            pressure=attrs.get("pressure"),
            uom=uom,
            manufacturer=mfg if mfg != "nan" else None,
            model=part if part != "nan" else None
        )
        db.add(mat_attr)

        if best_std and best_breakdown:
            mat_match = MaterialMatch(
                source_material_id=mat.id,
                standard_material_id=best_std.id,
                overall_confidence=best_conf,
                description_sim=best_breakdown["description_sim"],
                dimension_sim=best_breakdown["dimension_sim"],
                material_sim=best_breakdown["material_sim"],
                category_sim=best_breakdown["category_sim"],
                uom_compatibility=best_breakdown["uom_compatibility"],
                match_explanation=best_breakdown["explanation"],
                status="approved" if status == "approved" else "suggested"
            )
            db.add(mat_match)

        if len(preview_items) < 10:
            preview_items.append({
                "material_code": raw_code,
                "original_description": raw_desc,
                "normalized_description": norm_desc,
                "standard_code": best_std.standard_code if best_std else "Pending",
                "confidence_score": best_conf,
                "status": status,
                "explanation": best_breakdown["explanation"] if best_breakdown else "Awaiting human review"
            })

    # Log Job and Audit
    job = ImportJob(
        file_name=filename,
        cpse_code=cpse.code,
        total_records=total_records,
        normalized_records=normalized_count,
        matched_records=matched_count,
        status="completed"
    )
    db.add(job)

    audit = AuditLog(
        user_name="Import Pipeline Engine",
        user_role="system",
        material_code=f"BATCH-{cpse.code}",
        previous_state="Raw File",
        new_state="Harmonized",
        action="Bulk Import",
        reason=f"Processed {total_records} material items from {filename} for {cpse.name}. {matched_count} standardized."
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "file_name": filename,
        "cpse": cpse.name,
        "total_records": total_records,
        "normalized_records": normalized_count,
        "matched_records": matched_count,
        "standardization_rate": round((matched_count / max(1, total_records)) * 100, 1),
        "preview_items": preview_items,
        "steps_completed": [
            {"step": 1, "name": "File Validation", "status": "Passed (Format & Encoding verified)"},
            {"step": 2, "name": "Column Detection", "status": f"Detected columns: {list(cols_map.keys())}"},
            {"step": 3, "name": "Data Normalization", "status": f"{normalized_count} records standardized into canonical syntax"},
            {"step": 4, "name": "AI Matching", "status": f"Matched {matched_count} items with cross-CPSE standards"},
            {"step": 5, "name": "Review Results", "status": "Completed and committed to database"}
        ]
    }
