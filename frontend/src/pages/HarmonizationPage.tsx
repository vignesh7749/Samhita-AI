import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  Search,
  Building2,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Tag,
  ArrowRight,
  Layers,
  Table,
  TrendingDown,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Boxes,
  Database,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import {
  HarmonizationGroup,
  HarmonizationMetricsResponse,
  StandardMaterialCatalogItem
} from '../types';
import { MaterialRelationshipView } from '../components/MaterialRelationshipView';

interface HarmonizationPageProps {
  onOpenMaterial: (id: number) => void;
}

const ALL_CPSES = ['ONGC', 'BHEL', 'NTPC', 'SAIL', 'IOCL'];

export const HarmonizationPage: React.FC<HarmonizationPageProps> = ({ onOpenMaterial }) => {
  const [viewMode, setViewMode] = useState<'families' | 'catalog'>('families');
  const [metrics, setMetrics] = useState<HarmonizationMetricsResponse | null>(null);
  const [groups, setGroups] = useState<HarmonizationGroup[]>([]);
  const [catalogItems, setCatalogItems] = useState<StandardMaterialCatalogItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minCpse, setMinCpse] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});
  const [showTopology, setShowTopology] = useState<Record<number, boolean>>({});

  const toggleTopology = (id: number) => {
    setShowTopology((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. Fetch Metrics
  const fetchMetrics = async () => {
    try {
      const data = await api.getHarmonizationMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  // 2. Fetch Group Families
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await api.getHarmonizationGroups(
        search.trim() || undefined,
        minCpse,
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Catalog
  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const data = await api.getUnifiedCatalog({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: catalogPage,
        pageSize: 20
      });
      setCatalogItems(data.items);
      setCatalogTotal(data.total);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (viewMode === 'families') {
      fetchGroups();
    } else {
      fetchCatalog();
    }
  }, [viewMode, minCpse, statusFilter, catalogPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === 'families') {
      fetchGroups();
    } else {
      setCatalogPage(1);
      fetchCatalog();
    }
  };

  const toggleEvidence = (id: number) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status?: string) => {
    const s = status || 'HARMONIZED';
    switch (s) {
      case 'HARMONIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Harmonized</span>
          </span>
        );
      case 'CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Candidate</span>
          </span>
        );
      case 'UNIQUE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Tag className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>Unique Standard</span>
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Conflict</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span>{s}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Cross-CPSE Harmonization &amp; Master Catalog
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Stage 3 Unified Layer
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consolidating equivalent materials across 5 CPSEs into canonical standard identities with verifiable AI matching lineage.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('families')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'families'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Material Families ({groups.length})</span>
            </button>
            <button
              onClick={() => setViewMode('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'catalog'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Unified Master Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Database KPI Metrics Banner */}
      {metrics && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Total Source Records */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Total Source Records</span>
                <Database className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {metrics.total_source_records.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Across 5 CPSE databases
              </div>
            </div>

            {/* Unique Standard Material Identities */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Standard Material Groups</span>
                <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {metrics.unique_standard_materials.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Canonical standardized identities
              </div>
            </div>

            {/* Potential SKU Reduction */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs bg-emerald-50/20 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-medium">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">Potential SKU Reduction</span>
                <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                {metrics.potential_sku_reduction_pct.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                {metrics.potential_sku_reduction_count.toLocaleString()} redundant SKUs consolidated
              </div>
            </div>

            {/* Harmonized Records */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Harmonized Records</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {metrics.harmonized_records.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
                {((metrics.harmonized_records / (metrics.total_source_records || 1)) * 100).toFixed(1)}% coverage rate
              </div>
            </div>
          </div>

          {/* CPSE Coverage Distribution Summary Bar */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
              <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Cross-CPSE Coverage Distribution:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMinCpse(5)}
                className={`px-2.5 py-1 rounded text-xs transition border flex items-center gap-1.5 ${
                  minCpse === 5
                    ? 'bg-blue-700 dark:bg-blue-600 text-white border-blue-700 dark:border-blue-600 font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>All 5 CPSEs Unified:</span>
                <span className="font-bold">{metrics.cpse_coverage_distribution['5_cpse'] || 0}</span>
              </button>

              <button
                onClick={() => setMinCpse(4)}
                className={`px-2.5 py-1 rounded text-xs transition border flex items-center gap-1.5 ${
                  minCpse === 4
                    ? 'bg-blue-700 dark:bg-blue-600 text-white border-blue-700 dark:border-blue-600 font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>4 CPSEs Unified:</span>
                <span className="font-bold">{metrics.cpse_coverage_distribution['4_cpse'] || 0}</span>
              </button>

              <button
                onClick={() => setMinCpse(3)}
                className={`px-2.5 py-1 rounded text-xs transition border flex items-center gap-1.5 ${
                  minCpse === 3
                    ? 'bg-blue-700 dark:bg-blue-600 text-white border-blue-700 dark:border-blue-600 font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>3 CPSEs Unified:</span>
                <span className="font-bold">{metrics.cpse_coverage_distribution['3_cpse'] || 0}</span>
              </button>

              {minCpse > 1 && (
                <button
                  onClick={() => setMinCpse(1)}
                  className="text-xs text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline ml-1"
                >
                  Reset filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search standard material code (e.g. STD-FST-00128), canonical title, or specification..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewMode === 'families' && (
              <select
                value={minCpse}
                onChange={(e) => setMinCpse(Number(e.target.value))}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value={1}>All Coverage (1 - 5 CPSEs)</option>
                <option value={2}>&ge; 2 CPSEs Unified</option>
                <option value={3}>&ge; 3 CPSEs Unified</option>
                <option value={4}>&ge; 4 CPSEs Unified</option>
                <option value={5}>All 5 CPSEs Unified</option>
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Harmonization States</option>
              <option value="HARMONIZED">Harmonized</option>
              <option value="CANDIDATE">Candidate</option>
              <option value="UNIQUE">Unique Standard</option>
              <option value="CONFLICT">Conflict</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md transition shadow-xs shrink-0"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* VIEW 1: MATERIAL FAMILIES CLUSTERS VIEW */}
      {viewMode === 'families' && (
        <div>
          {loading ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Aggregating cross-CPSE material families from Stage 2 intelligence...</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-xs">
              No harmonized material families found matching search or filters.
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => {
                const isEvidenceOpen = expandedEvidence[group.standard_material_id];
                const coverageList = group.cpse_coverage || [];

                return (
                  <div
                    key={group.standard_material_id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden"
                  >
                    {/* Standard Material Header Card */}
                    <div className="p-4 bg-slate-50/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-900 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded">
                            {group.standard_code}
                          </span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                            {group.category_name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Base UOM: <strong className="text-slate-800 dark:text-slate-200">{group.base_uom}</strong></span>
                          {getStatusBadge(group.harmonization_status)}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                          {group.standard_name}
                        </h3>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          Canonical Spec: <span className="text-slate-700 dark:text-slate-300">{group.normalized_spec}</span>
                        </div>
                      </div>

                      {/* Right Badges & CPSE Presence Indicators */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                        {/* CPSE Coverage Badges */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 px-1">
                            {group.cpse_count}/5 CPSEs:
                          </span>
                          <div className="flex items-center gap-1">
                            {ALL_CPSES.map((cpse) => {
                              const present = coverageList.includes(cpse);
                              return (
                                <span
                                  key={cpse}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition ${
                                    present
                                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                      : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-slate-200/60 dark:border-slate-800'
                                  }`}
                                  title={present ? `${cpse} has harmonized record` : `${cpse} not in family`}
                                >
                                  {cpse} {present && '✓'}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Confidence & Count */}
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded inline-flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{group.average_confidence}% Avg Confidence</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {group.record_count} records consolidated
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stage 2 Matching Evidence & Topology View Toggle */}
                    <div className="px-4 py-2 bg-slate-50/30 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTopology(group.standard_material_id)}
                          className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1.5 font-medium transition"
                        >
                          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Relationship Tree Topology</span>
                          {showTopology[group.standard_material_id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <button
                          onClick={() => toggleEvidence(group.standard_material_id)}
                          className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1.5 font-medium transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Technical Matching Evidence</span>
                          {isEvidenceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {group.materials.length} CPSE variations unified under canonical identity
                      </span>
                    </div>

                    {/* Relationship Tree Topology View (Sections 10 & 18) */}
                    {showTopology[group.standard_material_id] && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                        <MaterialRelationshipView
                          standardCode={group.standard_code}
                          standardName={group.standard_name}
                          records={group.materials}
                          onSelectMaterial={onOpenMaterial}
                        />
                      </div>
                    )}

                    {/* Collapsible Evidence Content */}
                    {isEvidenceOpen && (
                      <div className="p-4 bg-blue-50/20 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Stage 2 AI Technical Consistency Breakdown:</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold block">Material Type</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {group.matching_evidence?.material_type || group.canonical_attributes?.material_type || 'STAINLESS STEEL'}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold block">Product Type</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {group.matching_evidence?.product_type || group.canonical_attributes?.product_type || 'BOLT'}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold block">Dimensions</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {group.matching_evidence?.dimensions || group.canonical_attributes?.dimensions || 'M10 X 50 MM'}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold block">UOM Match</span>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              {group.base_uom} (Compatible)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Harmonized Variations List */}
                    <div className="p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
                        <GitMerge className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Source CPSE Records Grouped in this Family ({group.materials.length})</span>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden text-xs">
                        {group.materials.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => onOpenMaterial(m.id)}
                            className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition cursor-pointer group"
                          >
                            <div className="flex items-start md:items-center gap-3">
                              <span className="w-16 font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center py-1 rounded text-[11px] shrink-0">
                                {m.cpse_code}
                              </span>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {m.material_code}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">({m.uom})</span>
                                  {getStatusBadge(m.harmonization_status || 'HARMONIZED')}
                                </div>
                                <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition mt-0.5 font-mono">
                                  "{m.original_description}"
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Normalized: <span className="text-slate-700 dark:text-slate-300 font-mono">{m.normalized_description}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pl-19 md:pl-0">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                  m.confidence_score >= 90
                                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                                    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {m.confidence_score}% Match
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenMaterial(m.id);
                                }}
                                className="text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5 group-hover:translate-x-0.5 transition"
                              >
                                <span>Inspect</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: UNIFIED MASTER CATALOG VIEW (Section 10 Table) */}
      {viewMode === 'catalog' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Unified Standard Master Catalog</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative catalog of canonical material specifications with cross-CPSE procurement mapping.
              </p>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Showing {catalogItems.length} of {catalogTotal} standard items
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Loading Unified Master Catalog...</span>
            </div>
          ) : catalogItems.length === 0 ? (
            <div className="p-16 text-center text-slate-500 dark:text-slate-400 text-xs">
              No standard catalog records match the query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-3 font-semibold">Standard Code</th>
                    <th className="py-3 px-3 font-semibold">Standard Material Name</th>
                    <th className="py-3 px-3 font-semibold">Category</th>
                    <th className="py-3 px-3 font-semibold">Key Specifications</th>
                    <th className="py-3 px-3 font-semibold">Base UOM</th>
                    <th className="py-3 px-3 font-semibold">CPSE Coverage</th>
                    <th className="py-3 px-3 font-semibold">Grouped Records</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {catalogItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-blue-900 dark:text-blue-300 whitespace-nowrap">
                        {item.standard_code}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 max-w-xs">
                        {item.standard_name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {item.category_name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {item.key_specifications || 'Standard Industrial Specification'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-mono">
                        {item.base_uom}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200 mr-1">{item.cpse_count}/5</span>
                          {(item.cpse_coverage || []).map((cpse) => (
                            <span
                              key={cpse}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            >
                              {cpse}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {item.record_count} items
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(item.harmonization_status)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded text-[11px]">
                          {item.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Catalog Pagination */}
          <div className="p-3 bg-slate-50/60 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div>
              Total: <strong className="text-slate-800 dark:text-slate-200">{catalogTotal}</strong> standard materials
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={catalogPage <= 1}
                onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Previous
              </button>
              <span>Page {catalogPage}</span>
              <button
                disabled={catalogItems.length < 20 || catalogPage * 20 >= catalogTotal}
                onClick={() => setCatalogPage((p) => p + 1)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
