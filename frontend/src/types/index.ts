export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'reviewer' | 'viewer';
}

export interface CPSE {
  id: number;
  code: string;
  name: string;
  sector: string;
  location?: string;
  logo_icon: string;
  material_count: number;
  standardized_count: number;
  pending_count: number;
  duplicate_rate: number;
}

export interface MaterialListItem {
  id: number;
  material_code: string;
  original_description: string;
  normalized_description: string;
  cpse_code: string;
  cpse_name: string;
  category_code: string;
  category_name: string;
  uom: string;
  standard_code?: string | null;
  standard_name?: string | null;
  match_status: 'approved' | 'ai_suggested' | 'needs_review' | 'rejected' | 'raw';
  harmonization_status?: 'HARMONIZED' | 'CANDIDATE' | 'UNIQUE' | 'CONFLICT' | 'UNREVIEWED' | string;
  confidence_score: number;
}

export interface MaterialAttributeData {
  material_type?: string | null;
  product_type?: string | null;
  dimensions?: string | null;
  grade?: string | null;
  size_rating?: string | null;
  capacity?: string | null;
  voltage?: string | null;
  pressure?: string | null;
  uom?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  extra_attributes?: Record<string, any>;
}

export interface MatchBreakdown {
  overall_confidence: number;
  description_sim: number;
  dimension_sim: number;
  material_sim: number;
  category_sim: number;
  uom_compatibility: number;
  tech_attr_sim?: number;
  semantic_sim?: number;
  mfg_part_sim?: number;
  explanation: string;
}

export interface AttributeComparisonItem {
  attribute: string;
  value_a: any;
  value_b: any;
  status: 'MATCH' | 'REVIEW' | 'CONFLICT' | 'NOT_SPECIFIED';
  is_critical: boolean;
  notes?: string;
}

export interface CriticalConflictItem {
  attribute: string;
  value_a: any;
  value_b: any;
  reason: string;
}

export interface MaterialDetail {
  id: number;
  material_code: string;
  original_description: string;
  normalized_description: string;
  cpse_id: number;
  cpse_code: string;
  cpse_name: string;
  category_id: number;
  category_code: string;
  category_name: string;
  uom: string;
  manufacturer?: string | null;
  part_number?: string | null;
  standard_material_id?: number | null;
  standard_code?: string | null;
  standard_name?: string | null;
  match_status: 'approved' | 'ai_suggested' | 'needs_review' | 'rejected' | 'raw';
  harmonization_status?: 'HARMONIZED' | 'CANDIDATE' | 'UNIQUE' | 'CONFLICT' | 'UNREVIEWED' | string;
  confidence_score: number;
  attributes?: MaterialAttributeData;
  match_breakdown?: MatchBreakdown;
  attribute_comparisons?: AttributeComparisonItem[] | null;
  critical_conflicts?: CriticalConflictItem[] | null;
  has_critical_conflict?: boolean;
  related_materials?: HarmonizedMaterialItem[];
  created_at: string;
  updated_at: string;
}

export interface HarmonizedMaterialItem {
  id: number;
  material_code: string;
  original_description: string;
  normalized_description: string;
  cpse_code: string;
  cpse_name: string;
  uom: string;
  match_status: string;
  harmonization_status?: string;
  confidence_score: number;
}

export interface HarmonizationGroup {
  standard_material_id: number;
  standard_code: string;
  standard_name: string;
  normalized_spec: string;
  category_name: string;
  base_uom: string;
  average_confidence: number;
  record_count: number;
  cpse_count: number;
  harmonization_status?: string;
  cpse_coverage?: string[];
  matching_evidence?: Record<string, any>;
  canonical_attributes?: Record<string, any>;
  materials: HarmonizedMaterialItem[];
}

export interface StandardMaterialCatalogItem {
  id: number;
  standard_code: string;
  standard_name: string;
  category_name: string;
  material_type?: string | null;
  product_type?: string | null;
  key_specifications?: string | null;
  cpse_count: number;
  record_count: number;
  harmonization_status: string;
  confidence: number;
  base_uom: string;
  cpse_coverage: string[];
}

export interface HarmonizationMetricsResponse {
  total_source_records: number;
  unique_standard_materials: number;
  harmonized_records: number;
  candidate_materials: number;
  potential_duplicates: number;
  confirmed_duplicates: number;
  unique_materials: number;
  potential_sku_reduction_count: number;
  potential_sku_reduction_pct: number;
  cpse_coverage_distribution: Record<string, number>;
}

export interface ReviewQueueItem {
  match_id?: number;
  material_id: number;
  material_code: string;
  original_description: string;
  normalized_description: string;
  cpse_code: string;
  category_name: string;
  suggested_standard_id?: number;
  suggested_standard_code?: string;
  suggested_standard_name?: string;
  confidence: number;
  reason: string;
  dimension_sim: number;
  material_sim: number;
}

export interface DuplicatePair {
  id?: number;
  material_a_id: number;
  material_a_code: string;
  material_a_desc: string;
  material_a_norm?: string;
  material_a_cpse: string;
  material_b_id: number;
  material_b_code: string;
  material_b_desc: string;
  material_b_norm?: string;
  material_b_cpse: string;
  relationship_type?: 'exact_duplicate' | 'near_duplicate' | 'potential_duplicate' | 'non_duplicate' | string;
  similarity_score: number;
  category: string;
  status: string;
  decision?: string;
  explanation: string;
  standard_code?: string;
}

export interface CompareResponse {
  is_equivalent: boolean;
  verdict: string;
  match_status: 'MATCH' | 'REVIEW' | 'TECHNICAL CONFLICT' | 'DO NOT MATCH';
  confidence_score: number;
  recommendation?: string;
  normalized_a?: string;
  normalized_b?: string;
  attributes_a: MaterialAttributeData;
  attributes_b: MaterialAttributeData;
  attribute_comparisons: AttributeComparisonItem[];
  critical_conflicts: CriticalConflictItem[];
  has_critical_conflict: boolean;
  conflict_summary?: string | null;
  breakdown: MatchBreakdown;
  suggested_standard_code: string;
  suggested_standard_name: string;
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  user_name: string;
  user_role: string;
  material_code: string;
  previous_state: string;
  new_state: string;
  action: string;
  reason?: string;
}

export interface DashboardStats {
  total_materials: number;
  standardized_materials: number;
  potential_duplicates: number;
  pending_review: number;
  standardization_rate: number;
  total_cpses: number;
  total_standard_codes: number;
  avg_confidence: number;
  human_approval_rate: number;
  category_distribution: {
    category_code: string;
    category_name: string;
    total: number;
    standardized: number;
    rate: number;
  }[];
  cpse_distribution: {
    cpse_code: string;
    cpse_name: string;
    sector: string;
    total_materials: number;
    standardized_materials: number;
    pending_review: number;
    standardization_rate: number;
    duplicate_rate: number;
  }[];
  confidence_tiers: {
    high: number;
    medium: number;
    needs_review: number;
  };
  recent_matches: {
    id: number;
    material_code: string;
    original_description: string;
    cpse_code: string;
    standard_code: string;
    standard_name: string;
    confidence_score: number;
    status: string;
  }[];
  recent_audits: AuditLogItem[];
}

// Stage 4 Types: Data Operations, Human Feedback, AI Search & Assistant
export interface DataQualityReport {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  missing_descriptions: number;
  missing_codes: number;
  detected_columns: Record<string, string | null>;
  potential_issues: string[];
  sample_preview: Record<string, any>[];
  can_import: boolean;
}

export interface ImportJobItem {
  id: number;
  file_name: string;
  cpse_code: string;
  uploaded_by: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_rows: number;
  normalized_records: number;
  matched_records: number;
  successful_records: number;
  failed_records: number;
  status: string;
  quality_report?: Record<string, any>;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface HumanFeedbackItem {
  id: number;
  material_id: number;
  material_code: string;
  original_description: string;
  original_standard_code?: string | null;
  human_standard_code?: string | null;
  decision: 'approved' | 'rejected' | 'modified';
  reason_category?: string | null;
  reason_notes?: string | null;
  reviewer_name: string;
  reviewer_role: string;
  created_at: string;
}

export interface AssistantAnswerResponse {
  question: string;
  intent: string;
  answer: string;
  key_metrics: Record<string, any>;
  data_table: Record<string, any>[];
  grounded: boolean;
  source: string;
}

export interface NLSearchResultItem {
  standard_material_id: number;
  standard_code: string;
  name: string;
  normalized_spec: string;
  category: string;
  base_uom: string;
  harmonization_status: string;
  group_confidence: number;
  relevance_score: number;
  match_rationale: string;
  matched_attributes: Record<string, string>;
  total_cpse_count: number;
  cpse_list: string[];
  cpse_records: {
    material_id: number;
    material_code: string;
    cpse_code: string;
    original_description: string;
    uom: string;
    match_status: string;
    confidence_score: number;
  }[];
}

export interface NLSearchResponse {
  query: string;
  parsed_query: {
    normalized?: string;
    attributes?: Record<string, string>;
    detected_cpses?: string[];
    is_shared_query?: boolean;
    confidence_filter?: string | null;
  };
  total_matches: number;
  results: NLSearchResultItem[];
}
