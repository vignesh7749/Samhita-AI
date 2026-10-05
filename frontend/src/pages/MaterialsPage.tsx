import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { MaterialListItem } from '../types';

interface MaterialsPageProps {
  onOpenMaterial: (id: number) => void;
  initialFilter?: {
    search?: string;
    cpseCode?: string;
    categoryCode?: string;
    matchStatus?: string;
    confidenceTier?: string;
  };
}

export const MaterialsPage: React.FC<MaterialsPageProps> = ({
  onOpenMaterial,
  initialFilter
}) => {
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialFilter?.search || '');
  const [cpseFilter, setCpseFilter] = useState(initialFilter?.cpseCode || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState(initialFilter?.categoryCode || 'ALL');
  const [statusFilter, setStatusFilter] = useState(initialFilter?.matchStatus || 'ALL');
  const [harmonizationFilter, setHarmonizationFilter] = useState('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState(initialFilter?.confidenceTier || 'ALL');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await api.getMaterials({
        page,
        pageSize,
        search: search.trim() || undefined,
        cpseCode: cpseFilter,
        categoryCode: categoryFilter,
        matchStatus: statusFilter,
        harmonizationStatus: harmonizationFilter !== 'ALL' ? harmonizationFilter : undefined,
        confidenceTier: confidenceFilter !== 'ALL' ? confidenceFilter : undefined,
        sortBy,
        sortOrder
      });
      setMaterials(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [page, pageSize, cpseFilter, categoryFilter, statusFilter, harmonizationFilter, confidenceFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMaterials();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Approved</span>
          </span>
        );
      case 'ai_suggested':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>AI Matched</span>
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Needs Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span>Raw</span>
          </span>
        );
    }
  };

  const getHarmonizationBadge = (status?: string) => {
    const s = status || 'HARMONIZED';
    switch (s) {
      case 'HARMONIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            <CheckCircle className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
            <span>Harmonized</span>
          </span>
        );
      case 'CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
            <Sparkles className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
            <span>Candidate</span>
          </span>
        );
      case 'UNIQUE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
            <span>Unique</span>
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
            <XCircle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
            <span>Conflict</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span>{s}</span>
          </span>
        );
    }
  };

  const getConfidencePill = (conf: number) => {
    if (conf >= 90) {
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
          {conf}%
        </span>
      );
    }
    if (conf >= 75) {
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
          {conf}%
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        {conf > 0 ? `${conf}%` : '—'}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Material Master Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized repository of CPSE materials with AI standardization mappings.
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-semibold text-slate-900 dark:text-white">{total.toLocaleString()}</span> materials
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by material code, description, manufacturer, part #, standard code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md transition shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* CPSE Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block mb-1">CPSE Enterprise</label>
            <select
              value={cpseFilter}
              onChange={(e) => {
                setCpseFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All CPSEs (5)</option>
              <option value="ONGC">ONGC</option>
              <option value="BHEL">BHEL</option>
              <option value="NTPC">NTPC</option>
              <option value="SAIL">SAIL</option>
              <option value="IOCL">IOCL</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Categories (10)</option>
              <option value="FST">Fasteners</option>
              <option value="BRG">Bearings</option>
              <option value="VLV">Valves</option>
              <option value="ELE">Electrical Components</option>
              <option value="CBL">Cables &amp; Wires</option>
              <option value="MTR">Electric Motors</option>
              <option value="PMP">Pumps &amp; Spares</option>
              <option value="SFT">Safety Equipment</option>
              <option value="TLS">Industrial Tools</option>
              <option value="MCH">Mechanical Spares</option>
            </select>
          </div>

          {/* Match Status */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block mb-1">Match Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="ai_suggested">AI Matched</option>
              <option value="needs_review">Needs Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Harmonization Status (Stage 3) */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block mb-1">Harmonization Status</label>
            <select
              value={harmonizationFilter}
              onChange={(e) => {
                setHarmonizationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Harmonization</option>
              <option value="HARMONIZED">Harmonized</option>
              <option value="CANDIDATE">Candidate</option>
              <option value="UNIQUE">Unique Standard</option>
              <option value="CONFLICT">Conflict</option>
            </select>
          </div>

          {/* AI Confidence Tier Filter (Section 11) */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block mb-1">AI Confidence</label>
            <select
              value={confidenceFilter}
              onChange={(e) => {
                setConfidenceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Confidence (100%)</option>
              <option value="HIGH">High (≥ 90%)</option>
              <option value="MEDIUM">Medium (70–89%)</option>
              <option value="LOW">Needs Review (&lt; 70%)</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCpseFilter('ALL');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
                setHarmonizationFilter('ALL');
                setConfidenceFilter('ALL');
                setPage(1);
              }}
              className="w-full flex items-center justify-center gap-1 py-1.5 px-3 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table & Mobile Cards Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        {/* MOBILE CARD VIEW (< md screens) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Querying catalog records...</span>
              </div>
            </div>
          ) : materials.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">No materials found</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try changing your filters or search query.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setCpseFilter('ALL');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                  setHarmonizationFilter('ALL');
                  setConfidenceFilter('ALL');
                  setPage(1);
                }}
                className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-md transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            materials.map((m) => (
              <div
                key={m.id}
                onClick={() => onOpenMaterial(m.id)}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer space-y-2 select-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[11px] bg-slate-900 dark:bg-blue-600 text-white px-2 py-0.5 rounded">
                      {m.cpse_code}
                    </span>
                    <span className="font-mono font-bold text-xs text-blue-900 dark:text-blue-300">
                      {m.material_code}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {m.category_name}
                    </span>
                  </div>
                  {getConfidencePill(m.confidence_score)}
                </div>

                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  {m.original_description}
                </div>

                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  NLP: {m.normalized_description}
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {m.standard_code ? (
                      <span className="font-mono text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
                        {m.standard_code}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">Unmapped</span>
                    )}
                    {getHarmonizationBadge(m.harmonization_status)}
                    {getStatusBadge(m.match_status)}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMaterial(m.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 active:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-md transition min-h-[36px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Material Code</th>
                <th className="py-3 px-4">Material Description</th>
                <th className="py-3 px-4">CPSE</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">UOM</th>
                <th className="py-3 px-4">Standard Code</th>
                <th className="py-3 px-4">Harmonization</th>
                <th className="py-3 px-4">Match Status</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Querying catalog records...</span>
                    </div>
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">No materials found</div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                        Try changing your filters or search query.
                      </p>
                      <button
                        onClick={() => {
                          setSearch('');
                          setCpseFilter('ALL');
                          setCategoryFilter('ALL');
                          setStatusFilter('ALL');
                          setHarmonizationFilter('ALL');
                          setConfidenceFilter('ALL');
                          setPage(1);
                        }}
                        className="mt-2 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-md transition"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => onOpenMaterial(m.id)}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {m.material_code}
                    </td>
                    <td className="py-3 px-4 max-w-xs md:max-w-md">
                      <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition line-clamp-1">
                        {m.original_description}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        NLP: {m.normalized_description}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {m.cpse_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {m.category_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {m.uom}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-700 dark:text-blue-400 font-semibold whitespace-nowrap">
                      {m.standard_code ? (
                        <span className="bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-800/60 px-2 py-0.5 rounded">
                          {m.standard_code}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-normal">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getHarmonizationBadge(m.harmonization_status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(m.match_status)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getConfidencePill(m.confidence_score)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMaterial(m.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            Page <span className="font-semibold text-slate-900 dark:text-white">{page}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span> ({total} items)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-800 dark:text-slate-200">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
