"""
SAMHITA AI - Intelligent Data Ingestion & Data Quality Service
Performs column detection, file validation, quality reporting, and AI ingestion pipeline.
"""
import io
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models.models import (
    Material, MaterialAttribute, MaterialMatch, StandardMaterial,
    CPSE, Category, ImportJob, AuditLog
)
from backend.app.services.ai.normalizer import MaterialNormalizer
from backend.app.services.ai.attribute_extractor import AttributeExtractor
from backend.app.services.ai.matching_engine import MatchingEngine
from backend.app.services.harmonization_service import HarmonizationService


def utc_now():
    return datetime.now(timezone.utc)


COLUMN_SYNONYMS = {
    "code": [
        "material code", "material_code", "mat code", "item code",
        "sku", "code", "material_id", "item_id", "mat_code"
    ],
    "desc": [
        "description", "material description", "material_description",
        "item description", "product description", "item_name", "desc",
        "specification", "item_desc", "material desc", "title"
    ],
    "category": [
        "category", "material category", "group", "cat",
        "category_name", "category_code", "item_category"
    ],
    "uom": [
        "uom", "unit", "unit of measurement", "unit_of_measure",
        "measurement_unit", "base_uom", "units"
    ],
    "mfg": [
        "manufacturer", "mfg", "maker", "brand", "vendor",
        "make", "mfg_name"
    ],
    "part": [
        "part number", "part_number", "part_no", "model",
        "model_number", "cat_no", "part_id"
    ]
}


class DataQualityService:
    """
    Intelligent data validation, column detection, quality assessment, and ingestion service.
    """

    @classmethod
    def detect_columns(cls, columns: List[str]) -> Tuple[Dict[str, str], List[str]]:
        """
        Fuzzy column detection mapping file headers to canonical attributes.
        Returns: (detected_map, missing_critical_columns)
        """
        detected: Dict[str, str] = {}
        cleaned_headers = {str(c).strip().lower(): c for c in columns}

        for canonical_key, synonyms in COLUMN_SYNONYMS.items():
            for syn in synonyms:
                if syn in cleaned_headers:
                    detected[canonical_key] = cleaned_headers[syn]
                    break
            # Substring match fallback
            if canonical_key not in detected:
                for clean_h, original_h in cleaned_headers.items():
                    if any(syn in clean_h for syn in synonyms):
                        detected[canonical_key] = original_h
                        break

        # Add convenient enterprise aliases
        if "code" in detected:
            detected["material_code"] = detected["code"]
        if "desc" in detected:
            detected["description"] = detected["desc"]
        if "mfg" in detected:
            detected["manufacturer"] = detected["mfg"]
        if "part" in detected:
            detected["part_number"] = detected["part"]

        missing: List[str] = []
        if "desc" not in detected:
            missing.append("Material Description")

        return detected, missing

    @classmethod
    def inspect_and_validate(
        cls,
        df: pd.DataFrame,
        cols_map: Dict[str, str],
        target_cpse: str
    ) -> Dict[str, Any]:
        """
        Generates Section 5 Data Quality Report from DataFrame without mutating DB.
        """
        total_rows = int(len(df))
        if total_rows == 0:
            return {
                "total_rows": 0,
                "valid_rows": 0,
                "invalid_rows": 0,
                "duplicate_rows": 0,
                "missing_descriptions": 0,
                "missing_codes": 0,
                "detected_columns": dict(cols_map),
                "potential_issues": ["Uploaded file contains 0 data rows."],
                "can_import": False
            }

        desc_col = cols_map.get("desc") or cols_map.get("description")
        code_col = cols_map.get("code") or cols_map.get("material_code")

        missing_desc = 0
        missing_code = 0
        potential_issues: List[str] = []

        # Check missing descriptions
        if desc_col and desc_col in df.columns:
            missing_desc = int(df[desc_col].isna().sum() + (df[desc_col].astype(str).str.strip() == "").sum())
        else:
            missing_desc = int(total_rows)
            potential_issues.append("Required column 'Material Description' is missing.")

        # Check missing codes
        if code_col and code_col in df.columns:
            missing_code = int(df[code_col].isna().sum() + (df[code_col].astype(str).str.strip() == "").sum())
        else:
            missing_code = int(total_rows)

        # Check duplicate rows
        subset_cols = [c for c in [desc_col, code_col] if c and c in df.columns]
        if subset_cols:
            duplicate_rows = int(df.duplicated(subset=subset_cols, keep=False).sum() // 2)
        else:
            duplicate_rows = int(df.duplicated().sum())

        valid_rows = int(max(0, total_rows - missing_desc))
        invalid_rows = int(missing_desc)

        if missing_desc > 0:
            potential_issues.append(f"{missing_desc} rows missing descriptions will be skipped.")
        if duplicate_rows > 0:
            potential_issues.append(f"{duplicate_rows} duplicate record variations detected in source file.")
        if missing_code > 0:
            potential_issues.append(f"{missing_code} rows missing material code will be auto-assigned {target_cpse} codes.")

        return {
            "total_rows": int(total_rows),
            "valid_rows": int(valid_rows),
            "invalid_rows": int(invalid_rows),
            "duplicate_rows": int(duplicate_rows),
            "missing_descriptions": int(missing_desc),
            "missing_codes": int(missing_code),
            "detected_columns": dict(cols_map),
            "potential_issues": potential_issues,
            "can_import": bool(valid_rows > 0)
        }

    @classmethod
    def process_import(
        cls,
        db: Session,
        df: pd.DataFrame,
        cols_map: Dict[str, str],
        cpse_code: str,
        file_name: str,
        uploaded_by: str = "Admin User"
    ) -> Dict[str, Any]:
        """
        Executes end-to-end data ingestion with Stage 2 normalization, attribute extraction,
        catalog matching, and Stage 3 harmonization sync.
        """
        # 1. Resolve CPSE
        cpse = db.query(CPSE).filter(CPSE.code == cpse_code.upper()).first()
        if not cpse:
            cpse = db.query(CPSE).first()

        # 2. Quality assessment
        quality_rep = cls.inspect_and_validate(df, cols_map, cpse.code)

        # 3. Create ImportJob record
        job = ImportJob(
            file_name=file_name,
            cpse_code=cpse.code,
            uploaded_by=uploaded_by,
            total_records=quality_rep["total_rows"],
            valid_records=quality_rep["valid_rows"],
            invalid_records=quality_rep["invalid_rows"],
            duplicate_rows=quality_rep["duplicate_rows"],
            missing_desc_rows=quality_rep["missing_descriptions"],
            missing_code_rows=quality_rep["missing_codes"],
            status="processing",
            quality_report_json=quality_rep
        )
        db.add(job)
        db.flush()

        desc_col = cols_map.get("desc")
        code_col = cols_map.get("code")
        uom_col = cols_map.get("uom")
        cat_col = cols_map.get("category")
        mfg_col = cols_map.get("mfg")
        part_col = cols_map.get("part")

        default_cat = db.query(Category).first()
        categories_all = db.query(Category).all()
        standards_all = db.query(StandardMaterial).all()

        successful = 0
        failed = 0
        matched = 0
        preview_items = []

        for idx, row in df.iterrows():
            raw_desc = str(row[desc_col]).strip() if desc_col and pd.notna(row.get(desc_col)) else ""
            if not raw_desc or raw_desc.lower() in ["nan", "none", "null"]:
                failed += 1
                continue

            raw_code = str(row[code_col]).strip() if code_col and pd.notna(row.get(code_col)) else f"{cpse.code}-IMP-{job.id}-{idx+1:04d}"
            uom = str(row[uom_col]).strip().upper() if uom_col and pd.notna(row.get(uom_col)) else "NOS"
            mfg = str(row[mfg_col]).strip() if mfg_col and pd.notna(row.get(mfg_col)) else None
            part = str(row[part_col]).strip() if part_col and pd.notna(row.get(part_col)) else None

            # Category resolution
            cat_obj = default_cat
            if cat_col and pd.notna(row.get(cat_col)):
                val_c = str(row[cat_col]).lower()
                for c in categories_all:
                    if c.name.lower() in val_c or c.code.lower() in val_c:
                        cat_obj = c
                        break

            # Stage 2 Normalization & Attribute Extraction (Frozen)
            norm_desc = MaterialNormalizer.normalize(raw_desc)
            attrs = AttributeExtractor.extract(raw_desc, category_hint=cat_obj.name)

            # Match against existing standard materials
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
                    best_breakdown = comp.get("breakdown")

            if best_conf >= 85.0 and best_std:
                match_status = "approved" if best_conf >= 92.0 else "ai_suggested"
                harm_status = "HARMONIZED"
                matched += 1
            elif best_conf >= 60.0 and best_std:
                match_status = "needs_review"
                harm_status = "CANDIDATE"
            else:
                match_status = "needs_review"
                harm_status = "UNIQUE"

            mat = Material(
                material_code=raw_code,
                original_description=raw_desc,
                normalized_description=norm_desc,
                cpse_id=cpse.id,
                category_id=cat_obj.id,
                uom=uom if uom != "NAN" else "NOS",
                manufacturer=mfg if mfg and mfg.lower() != "nan" else None,
                part_number=part if part and part.lower() != "nan" else None,
                standard_material_id=best_std.id if best_std and best_conf >= 60.0 else None,
                match_status=match_status,
                harmonization_status=harm_status,
                confidence_score=round(best_conf, 1)
            )
            db.add(mat)
            db.flush()

            # Structured attributes
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
                manufacturer=mfg if mfg and mfg.lower() != "nan" else None,
                model=part if part and part.lower() != "nan" else None
            )
            db.add(mat_attr)

            if best_std and best_breakdown:
                mat_match = MaterialMatch(
                    source_material_id=mat.id,
                    standard_material_id=best_std.id,
                    overall_confidence=best_conf,
                    description_sim=best_breakdown.get("description_sim", 0.0),
                    dimension_sim=best_breakdown.get("dimension_sim", 0.0),
                    material_sim=best_breakdown.get("material_sim", 0.0),
                    category_sim=best_breakdown.get("category_sim", 0.0),
                    uom_compatibility=best_breakdown.get("uom_compatibility", 0.0),
                    match_explanation=best_breakdown.get("explanation", "Stage 2 multi-factor alignment."),
                    status="approved" if match_status == "approved" else "suggested"
                )
                db.add(mat_match)

            successful += 1
            if len(preview_items) < 10:
                preview_items.append({
                    "material_code": raw_code,
                    "original_description": raw_desc,
                    "normalized_description": norm_desc,
                    "standard_code": best_std.standard_code if best_std and best_conf >= 60.0 else "Pending",
                    "standard_name": best_std.name if best_std and best_conf >= 60.0 else "Awaiting Review",
                    "confidence_score": round(best_conf, 1),
                    "status": match_status,
                    "harmonization_status": harm_status
                })

        # Update Job
        job.successful_records = successful
        job.failed_records = failed
        job.normalized_records = successful
        job.matched_records = matched
        job.completed_at = utc_now()
        job.status = "completed" if failed == 0 else "completed_with_issues"

        # Audit Log
        audit = AuditLog(
            user_name=uploaded_by,
            user_role="admin",
            material_code=f"Batch Import ({cpse.code})",
            previous_state="File Staging",
            new_state=f"{successful} Ingested",
            action="Bulk Ingest Materials",
            reason=f"Uploaded {file_name}: {successful} records ingested, {matched} matched to standard master."
        )
        db.add(audit)
        db.commit()

        # Sync Harmonization Groups
        HarmonizationService.sync_material_groups(db)

        return {
            "status": "success",
            "job_id": job.id,
            "file_name": file_name,
            "cpse": cpse.code,
            "total_records": quality_rep["total_rows"],
            "successful_records": successful,
            "failed_records": failed,
            "normalized_records": successful,
            "matched_records": matched,
            "standardization_rate": round((matched / successful * 100), 1) if successful > 0 else 0.0,
            "quality_report": quality_rep,
            "preview_items": preview_items
        }
