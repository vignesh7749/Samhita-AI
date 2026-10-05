import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Layers,
  Copy,
  CheckCircle2,
  Building2,
  Sparkles,
  ShieldCheck,
  Percent,
  Download,
  FileSpreadsheet,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { DashboardStats } from '../types';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsPageProps {
  stats: DashboardStats | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ stats }) => {
  const { isDark, tokens } = useTheme();
  if (!stats) return null;

  const totalSKUs = stats.total_materials || 700;
  const canonicalSKUs = stats.total_standard_codes || 40;
  const potentialReductionCount = Math.max(0, totalSKUs - canonicalSKUs);
  const potentialReductionPct = ((potentialReductionCount / totalSKUs) * 100).toFixed(1);

  const cpseChartData = stats.cpse_distribution.map((c) => ({
    name: c.cpse_code,
    total: c.total_materials,
    standardized: c.standardized_materials,
    pending: c.pending_review
  }));

  const categoryChartData = stats.category_distribution.map((cat) => ({
    name: cat.category_name,
    total: cat.total,
    standardized: cat.standardized,
    rate: cat.rate
  }));

  const tierChartData = [
    { name: 'High (≥90%)', value: stats.confidence_tiers.high, color: '#059669' },
    { name: 'Medium (75-89%)', value: stats.confidence_tiers.medium, color: '#3b82f6' },
    { name: 'Review (<75%)', value: stats.confidence_tiers.needs_review, color: '#f59e0b' }
  ];

  const handleExport = (type: 'catalog' | 'harmonization' | 'duplicates' | 'reviews' | 'cpse' | 'audit') => {
    const url = api.getReportExportUrl(type);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Enterprise Standardization &amp; Harmonization Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Executive metrics demonstrating cross-CPSE duplicate elimination, inventory compression, and catalog unification.
          </p>
        </div>

        {/* Export Dropdown / Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('catalog')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Export Standard Catalog</span>
          </button>
        </div>
      </div>

      {/* Hero Standardization Impact KPI: Section 13 */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3 border border-blue-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 rounded-md border border-blue-400/30 text-blue-300">
              <TrendingDown className="w-5 h-5" />
            </span>
            <span className="font-bold text-sm tracking-tight">
              Potential Material Master Reduction
            </span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
            Validated Enterprise Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div>
            <span className="text-[11px] text-slate-300 block">Total Disparate CPSE SKUs</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{totalSKUs.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">Across ONGC, BHEL, NTPC, SAIL, IOCL</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-300 block">Canonical Standard Materials</span>
            <span className="text-2xl font-black text-blue-300 mt-0.5 block">{canonicalSKUs.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">Harmonized standard catalog identities</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-300 block">Redundant Codes Consolidated</span>
            <span className="text-2xl font-black text-amber-300 mt-0.5 block">-{potentialReductionCount.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">Eliminated duplicate SKU overhead</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-300 block">Potential SKU Reduction Rate</span>
            <span className="text-2xl font-black text-emerald-300 mt-0.5 block">{potentialReductionPct}%</span>
            <span className="text-[10px] text-slate-400">Procurement consolidation factor</span>
          </div>
        </div>
      </div>

      {/* 8 Metric KPI Cards (Section 12 & 18) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Total Material Records
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
            {stats.total_materials.toLocaleString()}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Unique Standard Materials
          </span>
          <span className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1 block">
            {stats.total_standard_codes.toLocaleString()}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Potential Duplicates
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
            {stats.potential_duplicates.toLocaleString()}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Standardization Rate
          </span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
            {stats.standardization_rate}%
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Participating CPSEs
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
            {stats.total_cpses} Enterprises
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Average AI Confidence
          </span>
          <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-1 block">
            {stats.avg_confidence}%
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Human Approval Rate
          </span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
            {stats.human_approval_rate}%
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Pending Human Review
          </span>
          <span className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1 block">
            {stats.pending_review} Items
          </span>
        </div>
      </div>

      {/* Charts Section with Dynamic Theme Support (Section 19) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Materials by CPSE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs min-w-0">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Material Ingestion &amp; Standardization by CPSE
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Comparison of total records vs. unified standard codes per enterprise
            </p>
          </div>

          <div className="h-64 mt-4 text-xs">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={cpseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tokens.chartGrid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: tokens.chartText }} stroke={tokens.chartGrid} />
                <YAxis tick={{ fontSize: 11, fill: tokens.chartText }} stroke={tokens.chartGrid} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tokens.chartTooltipBg,
                    border: `1px solid ${tokens.chartTooltipBorder}`,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: tokens.textPrimary,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  itemStyle={{ color: tokens.textPrimary }}
                  labelStyle={{ color: tokens.textPrimary, fontWeight: 'bold' }}
                />
                <Bar dataKey="total" fill={isDark ? '#64748b' : '#94a3b8'} name="Total Materials" radius={[4, 4, 0, 0]} />
                <Bar dataKey="standardized" fill={isDark ? '#10b981' : '#059669'} name="Standardized" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Confidence Tier Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs flex flex-col justify-between min-w-0">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              AI Confidence Score Segmentation
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Distribution across High, Medium, and Review threshold tiers
            </p>
          </div>

          <div className="h-48 mt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={tierChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {tierChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tokens.chartTooltipBg,
                    border: `1px solid ${tokens.chartTooltipBorder}`,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: tokens.textPrimary,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  itemStyle={{ color: tokens.textPrimary }}
                  labelStyle={{ color: tokens.textPrimary, fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
            {tierChartData.map((t) => (
              <div key={t.name} className="text-center">
                <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: t.color }}></span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t.value}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CPSE Breakdown Table (Section 12: CPSE Coverage) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
          CPSE Procurement Portfolio &amp; Harmonization Coverage
        </h3>

        <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <th className="p-2.5">Enterprise</th>
                <th className="p-2.5">Sector</th>
                <th className="p-2.5">Total SKUs</th>
                <th className="p-2.5">Harmonized SKUs</th>
                <th className="p-2.5">Harmonization Rate</th>
                <th className="p-2.5">Duplicate Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.cpse_distribution.map((c) => (
                <tr key={c.cpse_code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{c.cpse_code} — {c.cpse_name}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{c.sector}</td>
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-medium">{c.total_materials}</td>
                  <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">{c.standardized_materials}</td>
                  <td className="p-2.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">{c.standardization_rate}%</span>
                    <span className="inline-block w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden align-middle">
                      <span className="block h-full bg-emerald-600 dark:bg-emerald-500" style={{ width: `${c.standardization_rate}%` }} />
                    </span>
                  </td>
                  <td className="p-2.5 font-medium text-amber-700 dark:text-amber-400">{c.duplicate_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 18: ONE-CLICK ENTERPRISE REPORTING EXPORT CENTER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-3">
        <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Section 18 — Enterprise Governance Reporting &amp; Data Exports
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Download production-ready CSV exports for executive presentation, inter-CPSE procurement audits, and compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => handleExport('catalog')}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/40 text-left transition flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Standard Material Catalog</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">40 canonical groups with UOM &amp; specifications</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('harmonization')}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/40 text-left transition flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Harmonization Mapping Matrix</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">700 CPSE items mapped to standard codes</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('duplicates')}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/40 text-left transition flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Duplicate Detection Records</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">118 cross-CPSE candidate pairs with similarity</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('reviews')}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/40 text-left transition flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Human Reviews &amp; Feedback</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Human validation trail and structured conflict reasons</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('cpse')}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-800 group-hover:text-white transition">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">CPSE Executive Summary</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Standardization &amp; duplicate rates per enterprise</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('audit')}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-800 group-hover:text-white transition">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Governance Audit Trail</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Full immutable lifecycle event history log</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
