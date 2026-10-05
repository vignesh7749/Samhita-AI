import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { MatchBreakdown, CriticalConflictItem, AttributeComparisonItem } from '../types';

export interface AiDecisionCardProps {
  status: 'EQUIVALENT' | 'POTENTIAL' | 'CONFLICT' | 'NOT_EQUIVALENT' | string;
  confidenceScore: number;
  standardCode?: string | null;
  standardName?: string | null;
  evidencePoints?: string[];
  breakdown?: MatchBreakdown | null;
  criticalConflicts?: CriticalConflictItem[] | null;
  attributeComparisons?: AttributeComparisonItem[] | null;
  explanation?: string;
  materialAName?: string;
  materialBName?: string;
  compact?: boolean;
}

export const AiDecisionCard: React.FC<AiDecisionCardProps> = ({
  status,
  confidenceScore,
  standardCode,
  standardName,
  evidencePoints,
  breakdown,
  criticalConflicts,
  attributeComparisons,
  explanation,
  materialAName = 'Material A',
  materialBName = 'Material B',
  compact = false
}) => {
  const [showEvidence, setShowEvidence] = useState(false);

  // Normalize status into one of 4 standardized states
  const isConflict =
    status === 'CONFLICT' ||
    status === 'TECHNICAL CONFLICT' ||
    (criticalConflicts && criticalConflicts.length > 0);
  const isNotEquivalent =
    status === 'DO NOT MATCH' ||
    status === 'NOT_EQUIVALENT' ||
    (!isConflict && confidenceScore < 70);
  const isPotential =
    !isConflict &&
    !isNotEquivalent &&
    (status === 'POTENTIAL' || status === 'POTENTIAL MATCH' || (confidenceScore >= 70 && confidenceScore < 85));
  const isEquivalent =
    !isConflict &&
    !isNotEquivalent &&
    !isPotential &&
    (status === 'EQUIVALENT' || status === 'MATCH' || status === 'IDENTICAL' || confidenceScore >= 85);

  // Status visual themes
  const getTheme = () => {
    if (isConflict) {
      return {
        badge: '✕ TECHNICAL CONFLICT',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        cardBorder: 'border-rose-300 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20',
        icon: AlertOctagon,
        iconColor: 'text-rose-600 dark:text-rose-400',
        headerText: 'text-rose-900 dark:text-rose-200',
        summaryColor: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/50 dark:border-rose-800'
      };
    }
    if (isNotEquivalent) {
      return {
        badge: '✕ NOT EQUIVALENT',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        cardBorder: 'border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50',
        icon: XCircle,
        iconColor: 'text-slate-600 dark:text-slate-400',
        headerText: 'text-slate-900 dark:text-slate-100',
        summaryColor: 'text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700'
      };
    }
    if (isPotential) {
      return {
        badge: '⚠ POTENTIAL MATCH (REQUIRES HUMAN REVIEW)',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        cardBorder: 'border-amber-300 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20',
        icon: AlertTriangle,
        iconColor: 'text-amber-600 dark:text-amber-400',
        headerText: 'text-amber-900 dark:text-amber-200',
        summaryColor: 'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-800'
      };
    }
    return {
      badge: '✓ EQUIVALENT MATERIAL',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      cardBorder: 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      headerText: 'text-emerald-950 dark:text-emerald-200',
      summaryColor: 'text-emerald-800 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800'
    };
  };

  const theme = getTheme();
  const StatusIcon = theme.icon;

  // Build default evidence points if none provided
  const derivedEvidencePoints: string[] = evidencePoints || [];
  if (derivedEvidencePoints.length === 0 && breakdown) {
    if (breakdown.material_sim >= 85) derivedEvidencePoints.push('Same metallurgy / material class');
    if (breakdown.dimension_sim >= 90) derivedEvidencePoints.push('Matching critical physical dimensions');
    if (breakdown.category_sim >= 90) derivedEvidencePoints.push('Same product family & taxonomy');
    if (breakdown.uom_compatibility >= 90) derivedEvidencePoints.push('Compatible unit of measurement');
  }

  return (
    <div
      className={`border rounded-xl transition-all duration-200 ${
        theme.cardBorder
      } ${compact ? 'p-3.5' : 'p-5'} shadow-xs`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            AI Decision
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Confidence</span>
          <span
            className={`font-black text-sm font-mono px-2 py-0.5 rounded border ${
              confidenceScore >= 85
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : confidenceScore >= 70
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {Math.round(confidenceScore)}%
          </span>
        </div>
      </div>

      {/* Main Verdict Line */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 shrink-0 ${theme.iconColor}`} />
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100">
            {theme.badge}
          </span>
        </div>
      </div>

      {/* "WHY NOT A MATCH?" BLOCK (Section 9 Requirement) */}
      {(isConflict || (isNotEquivalent && criticalConflicts && criticalConflicts.length > 0)) && (
        <div className="mt-3 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider text-[11px]">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Primary Technical Conflict</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            {criticalConflicts && criticalConflicts.length > 0 ? (
              criticalConflicts.map((c, i) => (
                <div key={i} className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-rose-200 dark:border-rose-900/40">
                  <div className="font-bold text-rose-800 dark:text-rose-300 capitalize">
                    {c.attribute} differs:
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mt-0.5">
                    <span>{materialAName}: <strong className="text-slate-900 dark:text-slate-100">{String(c.value_a)}</strong></span>
                    <span className="text-slate-400 dark:text-slate-500">vs</span>
                    <span>{materialBName}: <strong className="text-slate-900 dark:text-slate-100">{String(c.value_b)}</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-rose-200 dark:border-rose-900/40 text-slate-800 dark:text-slate-200">
                Critical technical specification differs between records.
              </div>
            )}
          </div>

          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed pt-1">
            Because the critical technical dimension or metallurgy differs, these materials should not be harmonized automatically.
          </p>
        </div>
      )}

      {/* Evidence Checklist (Section 7) */}
      {isEquivalent && derivedEvidencePoints.length > 0 && (
        <div className="mt-3 bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Matching Evidence
          </div>
          {derivedEvidencePoints.map((point, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>{point}</span>
            </div>
          ))}
        </div>
      )}

      {/* Standard Identity */}
      {standardCode && (
        <div className="mt-3 p-3 bg-white/90 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-900/40 rounded-lg flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
              Standard Identity
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
              {standardName || 'Canonical Material Group'}
            </span>
          </div>
          <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
            {standardCode}
          </span>
        </div>
      )}

      {/* View Evidence Toggle & Modal/Panel (Section 8) */}
      <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-md transition"
        >
          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{showEvidence ? 'Hide Evidence' : 'View Evidence'}</span>
          {showEvidence ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {explanation && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 italic max-w-xs truncate hidden sm:inline">
            "{explanation}"
          </span>
        )}
      </div>

      {/* EXPLAINABLE AI EVIDENCE PANEL (Section 8 Requirement) */}
      {showEvidence && (
        <div className="mt-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-800 shadow-xs space-y-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Detailed Multi-Layer Similarity Evidence
            </span>
            <span className="font-mono text-blue-700 dark:text-blue-400">Final: {Math.round(confidenceScore)}%</span>
          </div>

          <div className="space-y-2 text-[11px]">
            {breakdown ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Description Similarity</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{breakdown.description_sim}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${breakdown.description_sim}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Dimension Similarity</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{breakdown.dimension_sim}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${breakdown.dimension_sim}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Material Similarity</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{breakdown.material_sim}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${breakdown.material_sim}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Product Type</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{breakdown.category_sim}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${breakdown.category_sim}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">UOM Compatibility</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{breakdown.uom_compatibility}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${breakdown.uom_compatibility}%` }} />
                </div>
              </>
            ) : (
              <div className="text-slate-500 dark:text-slate-400 py-1">Standard attribute comparisons verified.</div>
            )}
          </div>

          {/* Natural Language Explanation */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] mb-0.5">
              Explainable AI Justification:
            </span>
            <p className="italic text-xs leading-relaxed">
              "{explanation || (isEquivalent
                ? 'Both records describe identical product specifications with matching critical dimensions and compatible units of measurement.'
                : isConflict
                ? 'Records share textual similarities but have irreconcilable technical conflicts that prevent automated merging.'
                : 'Records differ in primary physical specifications or taxonomy.')}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
