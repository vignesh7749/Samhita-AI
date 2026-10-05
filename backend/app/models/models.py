from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="reviewer", nullable=False)  # admin, reviewer, viewer
    created_at = Column(DateTime, default=utc_now)

    reviews = relationship("ReviewDecision", back_populates="reviewer")

class CPSE(Base):
    __tablename__ = "cpses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # ONGC, BHEL, NTPC, SAIL, IOCL
    name = Column(String(150), nullable=False)
    sector = Column(String(100), nullable=False)
    location = Column(String(100), nullable=True)
    logo_icon = Column(String(50), default="Building2")
    created_at = Column(DateTime, default=utc_now)

    materials = relationship("Material", back_populates="cpse")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)  # FST, BRG, VLV, etc.
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    materials = relationship("Material", back_populates="category")
    standard_materials = relationship("StandardMaterial", back_populates="category")

class StandardMaterial(Base):
    __tablename__ = "standard_materials"

    id = Column(Integer, primary_key=True, index=True)
    standard_code = Column(String(50), unique=True, index=True, nullable=False)  # STD-FST-00128
    name = Column(String(255), nullable=False)
    normalized_spec = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    base_uom = Column(String(20), default="NOS", nullable=False)
    specifications_json = Column(JSON, default=dict)
    canonical_attributes = Column(JSON, default=dict)
    harmonization_status = Column(String(30), default="HARMONIZED")  # HARMONIZED, CANDIDATE, UNIQUE, CONFLICT, UNREVIEWED
    group_confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    category = relationship("Category", back_populates="standard_materials")
    mapped_materials = relationship("Material", back_populates="standard_material")
    group = relationship("MaterialGroup", back_populates="standard_material", uselist=False, cascade="all, delete-orphan")

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String(60), index=True, nullable=False)
    original_description = Column(Text, nullable=False)
    normalized_description = Column(Text, nullable=False)
    cpse_id = Column(Integer, ForeignKey("cpses.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    uom = Column(String(30), default="NOS", nullable=False)
    manufacturer = Column(String(100), nullable=True)
    part_number = Column(String(100), nullable=True)
    
    standard_material_id = Column(Integer, ForeignKey("standard_materials.id"), nullable=True)
    match_status = Column(String(30), default="raw", index=True)  # Stage 2 match: raw, ai_suggested, approved, rejected, needs_review
    harmonization_status = Column(String(30), default="HARMONIZED", index=True)  # Stage 3 status: HARMONIZED, CANDIDATE, UNIQUE, CONFLICT, UNREVIEWED
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    cpse = relationship("CPSE", back_populates="materials")
    category = relationship("Category", back_populates="materials")
    standard_material = relationship("StandardMaterial", back_populates="mapped_materials")
    attributes = relationship("MaterialAttribute", back_populates="material", uselist=False, cascade="all, delete-orphan")
    matches = relationship("MaterialMatch", foreign_keys="MaterialMatch.source_material_id", back_populates="source_material")
    reviews = relationship("ReviewDecision", back_populates="material")

class MaterialAttribute(Base):
    __tablename__ = "material_attributes"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), unique=True, nullable=False)
    material_type = Column(String(100), nullable=True)  # Stainless Steel, Mild Steel, etc.
    product_type = Column(String(100), nullable=True)   # Hex Bolt, Ball Bearing, etc.
    dimensions = Column(String(100), nullable=True)     # M10 x 50, 10mm x 50mm, etc.
    grade = Column(String(80), nullable=True)          # SS304, Class 150, 8.8
    size_rating = Column(String(80), nullable=True)    # 6205, DN50, 15 HP
    capacity = Column(String(80), nullable=True)
    voltage = Column(String(50), nullable=True)
    pressure = Column(String(50), nullable=True)
    uom = Column(String(30), nullable=True)
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    extra_attributes_json = Column(JSON, default=dict)

    material = relationship("Material", back_populates="attributes")

class MaterialMatch(Base):
    __tablename__ = "material_matches"

    id = Column(Integer, primary_key=True, index=True)
    source_material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    target_material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    standard_material_id = Column(Integer, ForeignKey("standard_materials.id"), nullable=True)
    
    overall_confidence = Column(Float, nullable=False)
    description_sim = Column(Float, default=0.0)
    dimension_sim = Column(Float, default=0.0)
    material_sim = Column(Float, default=0.0)
    category_sim = Column(Float, default=0.0)
    uom_compatibility = Column(Float, default=0.0)
    
    match_explanation = Column(Text, nullable=False)
    status = Column(String(30), default="suggested")  # suggested, approved, rejected
    created_at = Column(DateTime, default=utc_now)

    source_material = relationship("Material", foreign_keys=[source_material_id], back_populates="matches")
    standard_material = relationship("StandardMaterial")

class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    standard_material_id = Column(Integer, ForeignKey("standard_materials.id"), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_name = Column(String(100), default="Admin User")
    decision = Column(String(30), nullable=False)  # approved, rejected, modified
    rejection_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    material = relationship("Material", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    user_name = Column(String(100), nullable=False)
    user_role = Column(String(50), nullable=False)
    material_code = Column(String(60), nullable=False)
    previous_state = Column(String(50), nullable=False)
    new_state = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)

class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    cpse_code = Column(String(50), nullable=False)
    uploaded_by = Column(String(100), default="Admin User")
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    duplicate_rows = Column(Integer, default=0)
    missing_desc_rows = Column(Integer, default=0)
    missing_code_rows = Column(Integer, default=0)
    normalized_records = Column(Integer, default=0)
    matched_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    status = Column(String(30), default="pending")  # pending, processing, completed, completed_with_issues, failed
    quality_report_json = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

class HumanFeedback(Base):
    __tablename__ = "human_feedback"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    material_code = Column(String(60), nullable=False)
    original_description = Column(Text, nullable=False)
    original_standard_code = Column(String(50), nullable=True)
    human_standard_code = Column(String(50), nullable=True)
    decision = Column(String(30), nullable=False)  # approved, rejected, modified
    reason_category = Column(String(100), nullable=True)
    reason_notes = Column(Text, nullable=True)
    reviewer_name = Column(String(100), default="Admin User")
    reviewer_role = Column(String(50), default="reviewer")
    created_at = Column(DateTime, default=utc_now, index=True)

    material = relationship("Material")

class MaterialGroup(Base):
    __tablename__ = "material_groups"

    id = Column(Integer, primary_key=True, index=True)
    standard_material_id = Column(Integer, ForeignKey("standard_materials.id"), unique=True, nullable=False)
    group_confidence = Column(Float, default=0.0)
    harmonization_status = Column(String(30), default="HARMONIZED", index=True)  # HARMONIZED, CANDIDATE, UNIQUE, CONFLICT, UNREVIEWED
    explanation = Column(Text, nullable=True)
    matching_evidence_json = Column(JSON, default=dict)
    cpse_coverage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    standard_material = relationship("StandardMaterial", back_populates="group")
    members = relationship("MaterialGroupMember", back_populates="group", cascade="all, delete-orphan")

class MaterialGroupMember(Base):
    __tablename__ = "material_group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("material_groups.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    source_cpse = Column(String(50), nullable=False)
    membership_confidence = Column(Float, default=0.0)
    harmonization_status = Column(String(30), default="HARMONIZED")
    created_at = Column(DateTime, default=utc_now)

    group = relationship("MaterialGroup", back_populates="members")
    material = relationship("Material")

class DuplicateRelationship(Base):
    __tablename__ = "duplicate_relationships"

    id = Column(Integer, primary_key=True, index=True)
    material_a_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    material_b_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # exact_duplicate, near_duplicate, potential_duplicate, non_duplicate
    confidence = Column(Float, nullable=False)
    status = Column(String(30), default="pending", index=True)  # pending, merged, kept_separate, reviewed
    decision = Column(String(30), nullable=True)  # MERGE, KEEP_SEPARATE, REVIEW
    explanation = Column(Text, nullable=False)
    decision_notes = Column(Text, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    decided_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    material_a = relationship("Material", foreign_keys=[material_a_id])
    material_b = relationship("Material", foreign_keys=[material_b_id])

