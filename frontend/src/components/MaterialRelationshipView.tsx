import React from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowDown,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { HarmonizedMaterialItem } from '../types';

interface MaterialRelationshipViewProps {
  standardCode: string;
  standardName: string;
  records: HarmonizedMaterialItem[];
  activeMaterialId?: number;
  onSelectMaterial?: (id: number) => void;
}

export const MaterialRelationshipView: React.FC<MaterialRelationshipViewProps> = ({
  standardCode,
  standardName,
  records,
  activeMaterialId,
  onSelectMaterial
}) => {
  // If no related records exist, show clean fallback
  if (!records || records.length === 0) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-500 dark:text-slate-400 text-center">
        No cross-CPSE related materials linked under this standard identity.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Approved</span>
          </span>
        );
      case 'ai_suggested':
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-2.5 h-2.5" />
            <span>AI Match</span>
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-2.5 h-2.5" />
            <span>In Review</span>
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  const cpseColors: Record<string, string> = {
    ONGC: 'border-orange-300 dark:border-orange-800 bg-orange-50/60 dark:bg-orange-950/50 text-orange-900 dark:text-orange-200',
    BHEL: 'border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200',
    NTPC: 'border-teal-300 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200',
    SAIL: 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200',
    IOCL: 'border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200'
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-900/50 shadow-xs space-y-4 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Cross-CPSE Material Relationship Topology
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          {records.length} CPSE Records Mapped
        </span>
      </div>

      {/* TOP NODE: STANDARD CANONICAL MATERIAL */}
      <div className="flex flex-col items-center">
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 rounded-lg p-3 shadow-sm text-center max-w-md w-full">
          <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-blue-700 dark:text-blue-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Standard Material Identity
          </div>
          <div className="font-mono font-bold text-sm text-blue-900 dark:text-blue-200 mt-0.5">
            {standardCode}
          </div>
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
            {standardName}
          </div>
        </div>

        {/* Desktop Tree Trunk Stem */}
        <div className="hidden sm:block w-0.5 h-4 bg-slate-300 dark:bg-slate-700"></div>

        {/* Desktop Horizontal Connector Bar */}
        <div className="hidden sm:flex relative w-full max-w-2xl items-center justify-center">
          <div className="w-full h-0.5 bg-slate-300 dark:bg-slate-700"></div>
          {/* Center branch node */}
          <div className="absolute w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 -top-[3px]"></div>
        </div>

        {/* Mobile Down Arrow */}
        <div className="flex sm:hidden flex-col items-center my-2 text-slate-400 dark:text-slate-500">
          <ArrowDown className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-bounce" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Harmonized CPSE Records</span>
        </div>
      </div>

      {/* MOBILE LIST VIEW (< sm screens) */}
      <div className="block sm:hidden space-y-2">
        {records.map((rec) => {
          const isCurrent = activeMaterialId === rec.id;
          const cpseStyle = cpseColors[rec.cpse_code] || 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';

          return (
            <div
              key={rec.id}
              onClick={() => onSelectMaterial && onSelectMaterial(rec.id)}
              className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                isCurrent
                  ? 'border-blue-600 dark:border-blue-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${cpseStyle}`}>
                  {rec.cpse_code}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {Math.round(rec.confidence_score)}% AI Match
                  </span>
                  {getStatusBadge(rec.match_status)}
                </div>
              </div>

              <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                {rec.material_code}
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-1">
                {rec.original_description}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP BRANCH NODES (>= sm screens) */}
      <div className="hidden sm:block overflow-x-auto pb-2">
        <div className="flex items-start justify-center gap-2.5 min-w-[500px] pt-2">
          {records.map((rec) => {
            const isCurrent = activeMaterialId === rec.id;
            const cpseStyle = cpseColors[rec.cpse_code] || 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';

            return (
              <div
                key={rec.id}
                onClick={() => onSelectMaterial && onSelectMaterial(rec.id)}
                className={`relative flex-1 min-w-[130px] max-w-[180px] p-2.5 rounded-lg border text-left transition-all duration-150 ${
                  isCurrent
                    ? 'border-blue-600 dark:border-blue-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-2xs cursor-pointer'
                }`}
              >
                {/* Branch line from horizontal bar */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-slate-300 dark:bg-slate-700"></div>

                {/* CPSE Tag */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${cpseStyle}`}
                  >
                    {rec.cpse_code}
                  </span>
                  {getStatusBadge(rec.match_status)}
                </div>

                {/* Material Code */}
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                  {rec.material_code}
                </div>

                {/* Description */}
                <div
                  className="text-[11px] text-slate-600 dark:text-slate-400 font-mono line-clamp-2 mt-1 leading-snug"
                  title={rec.original_description}
                >
                  {rec.original_description}
                </div>

                {/* Confidence */}
                <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Confidence:</span>
                  <span
                    className={`font-mono font-bold ${
                      rec.confidence_score >= 90
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : rec.confidence_score >= 70
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {Math.round(rec.confidence_score)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
