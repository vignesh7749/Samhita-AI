"""
SAMHITA AI - Ingestion & Data Quality Management Router
Handles CSV/XLSX validation, column mapping inspection, job execution, and history tracking.
"""
import io
import pandas as pd
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import ImportJob, CPSE
from backend.app.services.data_quality_service import DataQualityService
from backend.app.auth.rbac import require_role

router = APIRouter(prefix="/import", tags=["Data Operations & Quality"])


@router.post("/validate")
async def validate_import_file(
    file: UploadFile = File(...),
    cpse_code: str = Query("ONGC", description="Target CPSE code (e.g. ONGC, BHEL, etc.)"),
    db: Session = Depends(get_db)
):
    """
    Step 1 & 2: Validates file, detects columns, and returns a detailed Section 5 Data Quality Report.
    Does not insert records into the database.
    """
    filename = file.filename or "upload.csv"
    ext = filename.split(".")[-1].lower()
    if ext not in ["csv", "xlsx", "xls"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a valid CSV (.csv) or Excel (.xlsx, .xls) file."
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is completely empty (0 bytes)."
        )

    try:
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to parse spreadsheet. Verify file encoding and format. ({str(e)})"
        )

    detected_cols, missing_req = DataQualityService.detect_columns(list(df.columns))
    report = DataQualityService.inspect_and_validate(df, detected_cols, cpse_code)

    return {
        "file_name": filename,
        "cpse_code": cpse_code,
        "total_columns": len(df.columns),
        "detected_columns": detected_cols,
        "missing_required_columns": missing_req,
        **report,
        "quality_report": report,
        "sample_rows": df.head(5).fillna("").to_dict(orient="records")
    }


@router.post("/upload")
async def execute_import_upload(
    file: UploadFile = File(...),
    cpse_code: str = Query(..., description="Target CPSE code (e.g. ONGC, BHEL, etc.)"),
    reviewer_name: str = Query("Admin User", description="Name of administrator performing upload"),
    current_role: str = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Executes full ingestion pipeline. Requires ADMIN role.
    """
    filename = file.filename or "upload.csv"
    ext = filename.split(".")[-1].lower()
    if ext not in ["csv", "xlsx", "xls"]:
        raise HTTPException(status_code=400, detail="Invalid format. Supported: .csv, .xlsx")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File read error: {str(e)}")

    detected_cols, _ = DataQualityService.detect_columns(list(df.columns))
    if "desc" not in detected_cols:
        raise HTTPException(
            status_code=400,
            detail="Missing required column 'Material Description' or equivalent."
        )

    res = DataQualityService.process_import(
        db=db,
        df=df,
        cols_map=detected_cols,
        cpse_code=cpse_code,
        file_name=filename,
        uploaded_by=reviewer_name
    )
    return res


@router.get("/jobs")
def get_import_jobs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns history of import jobs with Section 6 tracking metrics.
    """
    jobs = db.query(ImportJob).order_by(desc(ImportJob.created_at)).limit(limit).all()
    results = []
    for j in jobs:
        results.append({
            "id": j.id,
            "file_name": j.file_name,
            "cpse_code": j.cpse_code,
            "uploaded_by": j.uploaded_by,
            "total_records": j.total_records,
            "valid_records": j.valid_records,
            "invalid_records": j.invalid_records,
            "duplicate_rows": j.duplicate_rows,
            "successful_records": j.successful_records,
            "failed_records": j.failed_records,
            "matched_records": j.matched_records,
            "status": j.status,
            "quality_report": j.quality_report_json or {},
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None
        })
    return results
