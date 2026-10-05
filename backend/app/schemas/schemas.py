from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# CPSE Schemas
class CPSEResponse(BaseModel):
    id: int
    code: str
    name: str
    sector: str
    location: Optional[str] = None
    logo_icon: str
    material_count: Optional[int] = 0
    standardized_count: Optional[int] = 0
    pending_count: Optional[int] = 0
    duplicate_rate: Optional[float] = 0.0

    class Config:
        from_attributes = True

# Category Schemas
class CategoryResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Attribute Schemas
class MaterialAttributeSchema(BaseModel):
    material_type: Optional[str] = None
    product_type: Optional[str] = None
    dimensions: Optional[str] = None
    grade: Optional[str] = None
    size_rating: Optional[str] = None
    capacity: Optional[str] = None
    voltage: Optional[str] = None
    pressure: Optional[str] = None
    uom: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    extra_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)

# Match Explanation & Breakdown
class MatchBreakdown(BaseModel):
    overall_confidence: float
    description_sim: float
    dimension_sim: float
    material_sim: float
    category_sim: float
    uom_compatibility: float
    tech_attr_sim: Optional[float] = None
    semantic_sim: Optional[float] = None
    mfg_part_sim: Optional[float] = None
    explanation: str

class AttributeComparisonItem(BaseModel):
    attribute: str
    value_a: Any
    value_b: Any
    status: str  # MATCH, REVIEW, CONFLICT, NOT_SPECIFIED
    is_critical: bool = False
    notes: Optional[str] = None

class CriticalConflictItem(BaseModel):
    attribute: str
    value_a: Any
    value_b: Any
    reason: str

# Standard Material Schemas
class StandardMaterialBase(BaseModel):
    id: int
    standard_code: str
    name: str
    normalized_spec: str
    base_uom: str
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

# Material Schemas
class MaterialListItem(BaseModel):
    id: int
    material_code: str
    original_description: str
    normalized_description: str
    cpse_code: str
    cpse_name: str
    category_code: str
    category_name: str
    uom: str
    standard_code: Optional[str] = None
    standard_name: Optional[str] = None
    match_status: str
    harmonization_status: Optional[str] = "HARMONIZED"
    confidence_score: float

# Harmonization Group Schemas
class HarmonizedMaterialItem(BaseModel):
    id: int
    material_code: str
    original_description: str
    normalized_description: str
    cpse_code: str
    cpse_name: str
    uom: str
    match_status: str
    harmonization_status: str = "HARMONIZED"
    confidence_score: float

class MaterialDetail(BaseModel):
    id: int
    material_code: str
    original_description: str
    normalized_description: str
    cpse_id: int
    cpse_code: str
    cpse_name: str
    category_id: int
    category_code: str
    category_name: str
    uom: str
    manufacturer: Optional[str] = None
    part_number: Optional[str] = None
    standard_material_id: Optional[int] = None
    standard_code: Optional[str] = None
    standard_name: Optional[str] = None
    match_status: str
    harmonization_status: Optional[str] = "HARMONIZED"
    confidence_score: float
    attributes: Optional[MaterialAttributeSchema] = None
    match_breakdown: Optional[MatchBreakdown] = None
    attribute_comparisons: Optional[List[AttributeComparisonItem]] = None
    critical_conflicts: Optional[List[CriticalConflictItem]] = None
    has_critical_conflict: Optional[bool] = False
    related_materials: Optional[List[HarmonizedMaterialItem]] = None
    created_at: datetime
    updated_at: datetime

class HarmonizationGroup(BaseModel):
    standard_material_id: int
    standard_code: str
    standard_name: str
    normalized_spec: str
    category_name: str
    base_uom: str
    average_confidence: float
    record_count: int
    cpse_count: int
    harmonization_status: str = "HARMONIZED"
    cpse_coverage: List[str] = Field(default_factory=list)
    matching_evidence: Optional[Dict[str, Any]] = None
    canonical_attributes: Optional[Dict[str, Any]] = None
    materials: List[HarmonizedMaterialItem] = Field(default_factory=list)

class StandardMaterialCatalogItem(BaseModel):
    id: int
    standard_code: str
    standard_name: str
    category_name: str
    material_type: Optional[str] = None
    product_type: Optional[str] = None
    key_specifications: Optional[str] = None
    cpse_count: int
    record_count: int
    harmonization_status: str = "HARMONIZED"
    confidence: float
    base_uom: str
    cpse_coverage: List[str] = Field(default_factory=list)

class HarmonizationMetricsResponse(BaseModel):
    total_source_records: int
    unique_standard_materials: int
    harmonized_records: int
    candidate_materials: int
    potential_duplicates: int
    confirmed_duplicates: int
    unique_materials: int
    potential_sku_reduction_count: int
    potential_sku_reduction_pct: float
    cpse_coverage_distribution: Dict[str, int]

# Review Schemas
class ReviewQueueItem(BaseModel):
    match_id: Optional[int] = None
    material_id: int
    material_code: str
    original_description: str
    normalized_description: str
    cpse_code: str
    category_name: str
    suggested_standard_id: Optional[int] = None
    suggested_standard_code: Optional[str] = None
    suggested_standard_name: Optional[str] = None
    confidence: float
    reason: str
    dimension_sim: float
    material_sim: float

class ReviewDecisionRequest(BaseModel):
    decision: str  # approved, rejected, modified
    new_standard_code: Optional[str] = None
    modified_name: Optional[str] = None
    rejection_category: Optional[str] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    reviewer_name: Optional[str] = "Admin Reviewer"

class HumanFeedbackItem(BaseModel):
    id: int
    material_id: int
    material_code: str
    original_description: str
    original_standard_code: Optional[str] = None
    human_standard_code: Optional[str] = None
    decision: str
    reason_category: Optional[str] = None
    reason_notes: Optional[str] = None
    reviewer_name: str
    reviewer_role: str
    created_at: datetime

# Compare / Demo Playground Schemas
class CompareRequest(BaseModel):
    description_a: str
    description_b: str
    category: Optional[str] = "General"
    uom_a: Optional[str] = "NOS"
    uom_b: Optional[str] = "NOS"

class ExtractedAttributesComparison(BaseModel):
    material: Optional[str] = None
    product_type: Optional[str] = None
    dimensions: Optional[str] = None
    grade: Optional[str] = None
    size: Optional[str] = None

class CompareResponse(BaseModel):
    is_equivalent: bool
    verdict: str  # Equivalent, Likely Equivalent, Distinct Materials
    match_status: str  # MATCH, REVIEW, TECHNICAL CONFLICT, DO NOT MATCH
    confidence_score: float
    recommendation: Optional[str] = None
    normalized_a: Optional[str] = None
    normalized_b: Optional[str] = None
    attributes_a: Dict[str, Any]
    attributes_b: Dict[str, Any]
    attribute_comparisons: List[AttributeComparisonItem] = Field(default_factory=list)
    critical_conflicts: List[CriticalConflictItem] = Field(default_factory=list)
    has_critical_conflict: bool = False
    conflict_summary: Optional[str] = None
    breakdown: MatchBreakdown
    suggested_standard_code: str
    suggested_standard_name: str

# Duplicate Detection
class DuplicatePair(BaseModel):
    id: Optional[int] = None
    material_a_id: int
    material_a_code: str
    material_a_desc: str
    material_a_norm: Optional[str] = None
    material_a_cpse: str
    material_b_id: int
    material_b_code: str
    material_b_desc: str
    material_b_norm: Optional[str] = None
    material_b_cpse: str
    relationship_type: str = "potential_duplicate"  # exact_duplicate, near_duplicate, potential_duplicate, non_duplicate
    similarity_score: float
    category: str
    status: str = "pending"  # pending, merged, kept_separate, reviewed
    decision: Optional[str] = None
    explanation: str
    standard_code: Optional[str] = None

class DuplicateActionRequest(BaseModel):
    decision: str  # MERGE, KEEP_SEPARATE, REVIEW
    reviewer_name: Optional[str] = "Admin User"
    notes: Optional[str] = None

class AssignMaterialRequest(BaseModel):
    standard_material_id: Optional[int] = None
    create_new_standard: bool = False
    standard_code: Optional[str] = None
    standard_name: Optional[str] = None
    reviewer_name: Optional[str] = "Admin User"
    notes: Optional[str] = None

# Audit Log Schemas
class AuditLogItem(BaseModel):
    id: int
    timestamp: datetime
    user_name: str
    user_role: str
    material_code: str
    previous_state: str
    new_state: str
    action: str
    reason: Optional[str] = None

# Analytics Schemas
class DashboardStats(BaseModel):
    total_materials: int
    standardized_materials: int
    potential_duplicates: int
    pending_review: int
    standardization_rate: float
    total_cpses: int
    total_standard_codes: int
    avg_confidence: float
    human_approval_rate: float
    category_distribution: List[Dict[str, Any]]
    cpse_distribution: List[Dict[str, Any]]
    confidence_tiers: Dict[str, int]
    recent_matches: List[Dict[str, Any]]
    recent_audits: List[AuditLogItem]

# Search & AI Assistant Schemas (Stage 4 - Section 15, 16, 17)
class AssistantQuestionRequest(BaseModel):
    question: str

class AssistantAnswerResponse(BaseModel):
    question: str
    intent: str
    answer: str
    key_metrics: Dict[str, Any] = {}
    data_table: List[Dict[str, Any]] = []
    grounded: bool = True
    source: str = "SAMHITA AI Live Database Audit"

class NLSearchResponse(BaseModel):
    query: str
    parsed_query: Dict[str, Any] = {}
    total_matches: int = 0
    results: List[Dict[str, Any]] = []
