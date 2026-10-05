import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.app.database.session import engine, Base, SessionLocal, get_db
from backend.app.models.models import Material, StandardMaterial
from backend.app.services.data_seeder import seed_database
from backend.app.api.materials import router as materials_router
from backend.app.api.harmonization import router as harmonization_router
from backend.app.api.review import router as review_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.audit import router as audit_router
from backend.app.api.cpse import router as cpse_router
from backend.app.api.demo import router as demo_router
from backend.app.api.duplicates import router as duplicates_router
from backend.app.api.import_ops import router as import_ops_router
from backend.app.api.search import router as search_router
from backend.app.api.reports import router as reports_router
from backend.app.services.harmonization_service import HarmonizationService
from sqlalchemy import text

def run_db_migrations(target_engine):
    with target_engine.connect() as conn:
        try:
            # Check materials columns
            res = conn.execute(text("PRAGMA table_info(materials)")).fetchall()
            cols = [r[1] for r in res]
            if "harmonization_status" not in cols:
                conn.execute(text("ALTER TABLE materials ADD COLUMN harmonization_status VARCHAR(30) DEFAULT 'HARMONIZED'"))
            
            # Check standard_materials columns
            res_std = conn.execute(text("PRAGMA table_info(standard_materials)")).fetchall()
            cols_std = [r[1] for r in res_std]
            if "canonical_attributes" not in cols_std:
                conn.execute(text("ALTER TABLE standard_materials ADD COLUMN canonical_attributes JSON DEFAULT '{}'"))
            if "harmonization_status" not in cols_std:
                conn.execute(text("ALTER TABLE standard_materials ADD COLUMN harmonization_status VARCHAR(30) DEFAULT 'HARMONIZED'"))
            if "group_confidence" not in cols_std:
                conn.execute(text("ALTER TABLE standard_materials ADD COLUMN group_confidence FLOAT DEFAULT 0.0"))
            if "updated_at" not in cols_std:
                conn.execute(text("ALTER TABLE standard_materials ADD COLUMN updated_at DATETIME"))

            # Check import_jobs columns
            res_imp = conn.execute(text("PRAGMA table_info(import_jobs)")).fetchall()
            cols_imp = [r[1] for r in res_imp]
            if cols_imp:
                if "uploaded_by" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN uploaded_by VARCHAR(100) DEFAULT 'Admin User'"))
                if "valid_records" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN valid_records INTEGER DEFAULT 0"))
                if "invalid_records" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN invalid_records INTEGER DEFAULT 0"))
                if "duplicate_rows" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN duplicate_rows INTEGER DEFAULT 0"))
                if "missing_desc_rows" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN missing_desc_rows INTEGER DEFAULT 0"))
                if "missing_code_rows" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN missing_code_rows INTEGER DEFAULT 0"))
                if "successful_records" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN successful_records INTEGER DEFAULT 0"))
                if "failed_records" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN failed_records INTEGER DEFAULT 0"))
                if "quality_report_json" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN quality_report_json JSON DEFAULT '{}'"))
                if "completed_at" not in cols_imp:
                    conn.execute(text("ALTER TABLE import_jobs ADD COLUMN completed_at DATETIME"))

            conn.commit()
        except Exception as e:
            print(f"Migration check: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Tables & Migrations
    run_db_migrations(engine)
    Base.metadata.create_all(bind=engine)
    
    # 2. Check and seed database automatically for immediate out-of-the-box demo
    db = SessionLocal()
    try:
        count = db.query(Material).count()
        if count < 500:
            print(f"Current materials count ({count}) < 500. Automatically seeding demo dataset...")
            seed_database(db)
        else:
            print(f"Database verified with {count} material records ready.")

        # 3. Synchronize Stage 3 Material Groups and Duplicate Relationships
        HarmonizationService.sync_material_groups(db)
        HarmonizationService.scan_and_seed_duplicates(db)
    except Exception as e:
        print(f"Database sync warning: {e}")
    finally:
        db.close()
    
    yield

app = FastAPI(
    title="SAMHITA AI - Material Standardization & Harmonization Platform",
    description="Enterprise Government-grade AI Platform for cross-CPSE material code harmonization, deduplication, and explainable catalog standardizations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(materials_router, prefix="/api")
app.include_router(harmonization_router, prefix="/api")
app.include_router(duplicates_router, prefix="/api")
app.include_router(review_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(cpse_router, prefix="/api")
app.include_router(demo_router, prefix="/api")
app.include_router(import_ops_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

@app.get("/api/standard-materials")
def get_standard_materials_alias(
    search: str = None,
    category_id: int = None,
    status: str = None,
    page: int = 1,
    page_size: int = 25,
    db: Session = Depends(get_db)
):
    return HarmonizationService.get_unified_catalog(db, search, category_id, status, page, page_size)

@app.get("/api/standard-materials/{code}")
def get_standard_material_by_code(code: str, db: Session = Depends(get_db)):
    std = db.query(StandardMaterial).filter(StandardMaterial.standard_code == code).first()
    if not std:
        raise HTTPException(status_code=404, detail="Standard material code not found.")
    return HarmonizationService.get_group_by_id(db, std.id)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SAMHITA AI Core Engine",
        "version": "1.0.0",
        "ai_engine": "6-Layer Hybrid Normalization & Matcher",
        "database": "Active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
