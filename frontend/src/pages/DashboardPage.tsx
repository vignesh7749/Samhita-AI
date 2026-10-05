import React from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  GitMerge,
  UploadCloud,
  ChevronRight
} from 'lucide-react';
import { DashboardStats, User } from '../types';
import { ImpactSimulator } from '../components/ImpactSimulator';

interface DashboardPageProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (tab: string, filter?: any) => void;
  onOpenMaterial: (id: number) => void;
  onApproveMatch?: (id: number) => void;
  currentUser: User;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  loading,
  onNavigate,
  onOpenMaterial,
  onApproveMatch,
  currentUser
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium">Loading platform metrics &amp; harmonization status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time status of cross-CPSE material master standardization and deduplication.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('try-ai')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md transition shadow-xs min-h-[38px] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try AI Matching</span>
          </button>
          <button
            onClick={() => onNavigate('import')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition min-h-[38px] cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Import Data</span>
          </button>
        </div>
      </div>

      {/* Top 5 Key Metric Cards (Section 6 Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Materials */}
        <div
          onClick={() => onNavigate('materials')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Materials</span>
            <Layers className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {stats.total_materials.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>Across {stats.total_cpses} CPSEs</span>
          </div>
        </div>

        {/* Standardized */}
        <div
          onClick={() => onNavigate('materials', { matchStatus: 'approved' })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Standardized</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
            {stats.standardized_materials.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            {stats.standardization_rate}% Rate
          </div>
        </div>

        {/* Potential Duplicates */}
        <div
          onClick={() => onNavigate('duplicates')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Potential Duplicates</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {stats.potential_duplicates.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Redundant SKU candidates
          </div>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => onNavigate('review')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 tracking-tight">
            {stats.pending_review.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Requires human check
          </div>
        </div>

        {/* Standardization Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg AI Confidence</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {stats.avg_confidence}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.human_approval_rate}% Human approval
          </div>
        </div>
      </div>

      {/* Standardization Impact Simulator & Before-After Visualization (Sections 12 & 13) */}
      <ImpactSimulator
        sourceMaterials={stats.total_materials}
        standardMaterials={stats.total_standard_codes || 510}
        cpseCount={stats.total_cpses || 5}
      />

      {/* Progress & Confidence Tiers Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              National Harmonization Progress
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Harmonization across Oil &amp; Gas, Power, Steel, and Heavy Engineering CPSEs
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-800/80">
            {stats.standardization_rate}% Harmonized
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${stats.standardization_rate}%` }}
            title={`Standardized: ${stats.standardization_rate}%`}
          ></div>
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{
              width: `${((stats.pending_review / stats.total_materials) * 100).toFixed(1)}%`
            }}
            title="Needs Review"
          ></div>
        </div>

        {/* Tiers Legend */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 shrink-0"></span>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">High Confidence (&ge;90%): </span>
              <span className="text-slate-500 dark:text-slate-400">{stats.confidence_tiers.high} materials</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0"></span>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Medium Confidence (75-89%): </span>
              <span className="text-slate-500 dark:text-slate-400">{stats.confidence_tiers.medium} materials</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Needs Review (&lt;75%): </span>
              <span className="text-slate-500 dark:text-slate-400">{stats.confidence_tiers.needs_review} materials</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent AI Matches & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Matches */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Recent AI Harmonization Matches
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically mapped to standardized identities
              </p>
            </div>
            <button
              onClick={() => onNavigate('materials')}
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            {stats.recent_matches.slice(0, 5).map((m) => (
              <div
                key={m.id}
                onClick={() => onOpenMaterial(m.id)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 px-2 rounded cursor-pointer transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {m.material_code}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {m.cpse_code}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate mt-0.5">
                    {m.original_description}
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-400 font-mono mt-0.5">
                    &rarr; {m.standard_code}: {m.standard_name}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${
                      m.confidence_score >= 90
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80'
                        : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80'
                    }`}
                  >
                    {m.confidence_score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit / Human Decisions Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Verified Decision Audit Log
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Human-in-the-loop decisions and compliance record
              </p>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Audit Trail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            {stats.recent_audits.slice(0, 5).map((a) => (
              <div key={a.id} className="py-3 px-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{a.user_name}</span>
                  <span>{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{a.material_code}</span>
                  <span className="text-slate-400 dark:text-slate-600">&bull;</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">{a.action}</span>
                </div>
                {a.reason && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 italic">
                    "{a.reason}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
