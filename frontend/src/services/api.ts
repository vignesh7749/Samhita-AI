import {
  DashboardStats,
  MaterialListItem,
  MaterialDetail,
  HarmonizationGroup,
  HarmonizationMetricsResponse,
  StandardMaterialCatalogItem,
  ReviewQueueItem,
  DuplicatePair,
  CompareResponse,
  AuditLogItem,
  CPSE,
  User,
  DataQualityReport,
  ImportJobItem,
  HumanFeedbackItem,
  AssistantAnswerResponse,
  NLSearchResponse
} from '../types';

const API_BASE = '/api';

let activeUserRole: string = 'admin';

export const setApiUserRole = (role: string) => {
  activeUserRole = role.toLowerCase();
};

const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers || {});
  if (!headers.has('X-User-Role')) {
    headers.set('X-User-Role', activeUserRole);
  }
  return fetch(url, { ...init, headers });
};

export const api = {
  setUserRole(role: string) {
    setApiUserRole(role);
  },

  getUserRole(): string {
    return activeUserRole;
  },

  // Health
  async checkHealth() {
    const res = await authFetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  // Auth / Demo Login
  async demoLogin(role: string = 'admin'): Promise<{ user: User; access_token: string }> {
    setApiUserRole(role);
    const res = await authFetch(`${API_BASE}/demo/auth/demo-login?role=${role}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Demo login failed');
    return res.json();
  },

  // Dashboard & Analytics
  async getDashboard(): Promise<DashboardStats> {
    const res = await authFetch(`${API_BASE}/analytics/dashboard`);
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  // Materials Master
  async getMaterials(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    cpseCode?: string;
    categoryCode?: string;
    matchStatus?: string;
    harmonizationStatus?: string;
    confidenceTier?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ items: MaterialListItem[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('page_size', params.pageSize.toString());
    if (params.search) query.append('search', params.search);
    if (params.cpseCode) query.append('cpse_code', params.cpseCode);
    if (params.categoryCode) query.append('category_code', params.categoryCode);
    if (params.matchStatus) query.append('match_status', params.matchStatus);
    if (params.harmonizationStatus) query.append('harmonization_status', params.harmonizationStatus);
    if (params.confidenceTier) query.append('confidence_tier', params.confidenceTier);
    if (params.sortBy) query.append('sort_by', params.sortBy);
    if (params.sortOrder) query.append('sort_order', params.sortOrder);

    const res = await authFetch(`${API_BASE}/materials?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load materials catalog');
    return res.json();
  },

  async getMaterialDetail(id: number): Promise<MaterialDetail> {
    const res = await authFetch(`${API_BASE}/materials/${id}`);
    if (!res.ok) throw new Error('Failed to load material detail');
    return res.json();
  },

  // Harmonization (Stage 3)
  async getHarmonizationMetrics(): Promise<HarmonizationMetricsResponse> {
    const res = await authFetch(`${API_BASE}/harmonization/metrics`);
    if (!res.ok) throw new Error('Failed to load harmonization metrics');
    return res.json();
  },

  async getHarmonizationGroups(
    searchOrParams?: string | { search?: string; categoryCode?: string; status?: string; minCpseCoverage?: number; page?: number; pageSize?: number },
    minCpseCoverage?: number,
    status?: string
  ): Promise<HarmonizationGroup[]> {
    const query = new URLSearchParams();
    if (typeof searchOrParams === 'object' && searchOrParams !== null) {
      if (searchOrParams.search) query.append('search', searchOrParams.search);
      if (searchOrParams.categoryCode && searchOrParams.categoryCode !== 'ALL') query.append('category_code', searchOrParams.categoryCode);
      if (searchOrParams.status && searchOrParams.status !== 'ALL') query.append('status', searchOrParams.status);
      if (searchOrParams.minCpseCoverage) query.append('min_cpse_coverage', searchOrParams.minCpseCoverage.toString());
      if (searchOrParams.page) query.append('page', searchOrParams.page.toString());
      if (searchOrParams.pageSize) query.append('page_size', searchOrParams.pageSize.toString());
    } else {
      if (searchOrParams) query.append('search', searchOrParams);
      if (minCpseCoverage) query.append('min_cpse_coverage', minCpseCoverage.toString());
      if (status && status !== 'ALL') query.append('status', status);
    }

    const res = await authFetch(`${API_BASE}/harmonization/groups?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load harmonization groups');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.groups || []);
  },

  async getHarmonizationGroupDetail(id: number): Promise<HarmonizationGroup> {
    const res = await authFetch(`${API_BASE}/harmonization/groups/${id}`);
    if (!res.ok) throw new Error('Failed to load harmonization group detail');
    return res.json();
  },

  async getStandardCatalog(params?: {
    search?: string;
    categoryId?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: StandardMaterialCatalogItem[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.categoryId) query.append('category_id', params.categoryId.toString());
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('page_size', params.pageSize.toString());

    const res = await authFetch(`${API_BASE}/harmonization/catalog?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load standard material catalog');
    return res.json();
  },

  async getUnifiedCatalog(params?: {
    search?: string;
    categoryId?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: StandardMaterialCatalogItem[]; total: number; page: number; totalPages: number }> {
    return this.getStandardCatalog(params);
  },

  async assignMaterialToStandard(
    materialId: number,
    payload: {
      standardMaterialId?: number;
      createNewStandard?: boolean;
      standardCode?: string;
      standardName?: string;
      reviewerName?: string;
      notes?: string;
    }
  ) {
    const res = await authFetch(`${API_BASE}/harmonization/materials/${materialId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        standard_material_id: payload.standardMaterialId,
        create_new_standard: payload.createNewStandard || false,
        standard_code: payload.standardCode,
        standard_name: payload.standardName,
        reviewer_name: payload.reviewerName || 'Admin User',
        notes: payload.notes
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to assign standard material identity');
    }
    return res.json();
  },

  // Review Queue & Human Feedback
  async getReviewQueue(page: number = 1, pageSize: number = 20): Promise<{ items: ReviewQueueItem[]; total: number; totalPages: number }> {
    const res = await authFetch(`${API_BASE}/review/queue?page=${page}&page_size=${pageSize}`);
    if (!res.ok) throw new Error('Failed to load review queue');
    return res.json();
  },

  async submitReviewDecision(
    materialId: number,
    decision: 'approved' | 'rejected' | 'modified',
    payload: {
      rejectionCategory?: string;
      rejectionReason?: string;
      notes?: string;
      newStandardCode?: string;
      modifiedName?: string;
      reviewerName?: string;
    }
  ) {
    const res = await authFetch(`${API_BASE}/review/decision/${materialId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        rejection_category: payload.rejectionCategory,
        rejection_reason: payload.rejectionReason,
        notes: payload.notes,
        new_standard_code: payload.newStandardCode,
        modified_name: payload.modifiedName,
        reviewer_name: payload.reviewerName
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit review decision');
    }
    return res.json();
  },

  async getHumanFeedback(limit: number = 50): Promise<HumanFeedbackItem[]> {
    const res = await authFetch(`${API_BASE}/review/feedback?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load human feedback logs');
    return res.json();
  },

  // Duplicate Detection & Non-destructive Merging
  async getDuplicates(params?: {
    minSimilarity?: number;
    relationshipType?: string;
    status?: string;
    categoryName?: string;
    limit?: number;
  }): Promise<DuplicatePair[]> {
    const query = new URLSearchParams();
    if (params?.minSimilarity !== undefined) query.append('min_similarity', params.minSimilarity.toString());
    if (params?.relationshipType && params.relationshipType !== 'ALL') query.append('relationship_type', params.relationshipType);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.categoryName && params.categoryName !== 'ALL') query.append('category_name', params.categoryName);
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await authFetch(`${API_BASE}/duplicates?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load duplicate candidates');
    return res.json();
  },

  async mergeDuplicate(
    duplicateId: number,
    payload?: { reviewerName?: string; notes?: string }
  ) {
    const res = await authFetch(`${API_BASE}/duplicates/${duplicateId}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'MERGE',
        reviewer_name: payload?.reviewerName || 'Admin User',
        notes: payload?.notes || 'Merged to common standard material identity'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to merge duplicate records');
    }
    return res.json();
  },

  async keepSeparateDuplicate(
    duplicateId: number,
    payload?: { reviewerName?: string; notes?: string }
  ) {
    const res = await authFetch(`${API_BASE}/duplicates/${duplicateId}/keep-separate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'KEEP_SEPARATE',
        reviewer_name: payload?.reviewerName || 'Admin User',
        notes: payload?.notes || 'Confirmed distinct materials by reviewer'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to separate records');
    }
    return res.json();
  },

  // Live Playground & Demo
  async getPresets(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/demo/presets`);
    if (!res.ok) throw new Error('Failed to load preset comparisons');
    return res.json();
  },

  async compareMaterials(payload: {
    description_a: string;
    description_b: string;
    category?: string;
    uom_a?: string;
    uom_b?: string;
  }): Promise<CompareResponse> {
    const res = await authFetch(`${API_BASE}/demo/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Comparison calculation failed');
    }
    return res.json();
  },

  // Stage 4: Intelligent Data Operations & Validation
  async validateImportFile(file: File): Promise<DataQualityReport> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await authFetch(`${API_BASE}/import/validate`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to validate uploaded file structure');
    }
    return res.json();
  },

  async executeImportUpload(file: File, cpseCode: string, uploadedBy?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const query = new URLSearchParams({
      cpse_code: cpseCode,
      uploaded_by: uploadedBy || 'Admin User'
    });

    const res = await authFetch(`${API_BASE}/import/upload?${query.toString()}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to execute material import');
    }
    return res.json();
  },

  async getImportJobs(): Promise<ImportJobItem[]> {
    const res = await authFetch(`${API_BASE}/import/jobs`);
    if (!res.ok) throw new Error('Failed to load import job history');
    return res.json();
  },

  // Stage 4: AI Material Search & Enterprise Assistant
  async naturalLanguageSearch(query: string, limit: number = 15): Promise<NLSearchResponse> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    const res = await authFetch(`${API_BASE}/search/nl?${params.toString()}`);
    if (!res.ok) throw new Error('Search query failed');
    return res.json();
  },

  async askAssistant(question: string): Promise<AssistantAnswerResponse> {
    const res = await authFetch(`${API_BASE}/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if (!res.ok) throw new Error('Failed to query enterprise AI assistant');
    return res.json();
  },

  // Stage 4: Enterprise Reporting URLs
  getReportExportUrl(reportType: 'catalog' | 'harmonization' | 'duplicates' | 'reviews' | 'cpse' | 'audit'): string {
    switch (reportType) {
      case 'catalog':
        return `${API_BASE}/reports/standard-catalog/export`;
      case 'harmonization':
        return `${API_BASE}/reports/harmonization/export`;
      case 'duplicates':
        return `${API_BASE}/reports/duplicates/export`;
      case 'reviews':
        return `${API_BASE}/reports/reviews/export`;
      case 'cpse':
        return `${API_BASE}/reports/cpse-summary/export`;
      case 'audit':
        return `${API_BASE}/reports/audit/export`;
      default:
        return `${API_BASE}/reports/standard-catalog/export`;
    }
  },

  // Legacy Bulk Upload alias
  async importMaterials(file: File, cpseCode: string) {
    return this.executeImportUpload(file, cpseCode);
  },

  // CPSEs
  async getCpses(): Promise<CPSE[]> {
    const res = await authFetch(`${API_BASE}/cpse`);
    if (!res.ok) throw new Error('Failed to load CPSE directory');
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(params: { page?: number; pageSize?: number; search?: string; action?: string }): Promise<{
    items: AuditLogItem[];
    total: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('page_size', params.pageSize.toString());
    if (params.search) query.append('search', params.search);
    if (params.action) query.append('action', params.action);

    const res = await authFetch(`${API_BASE}/audit-logs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load audit trail');
    return res.json();
  }
};
