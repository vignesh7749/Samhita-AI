import React from 'react';
import {
  TrendingDown,
  Layers,
  Sparkles,
  ArrowDown,
  Building2,
  CheckCircle2,
  Cpu,
  GitMerge,
  ShieldCheck
} from 'lucide-react';

interface ImpactSimulatorProps {
  sourceMaterials: number;
  standardMaterials: number;
  cpseCount?: number;
  compact?: boolean;
}

export const ImpactSimulator: React.FC<ImpactSimulatorProps> = ({
  sourceMaterials,
  standardMaterials,
  cpseCount = 5,
  compact = false
}) => {
  const potentialReduction = Math.max(0, sourceMaterials - standardMaterials);
  const potentialReductionRate =
    sourceMaterials > 0
      ? ((potentialReduction / sourceMaterials) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Standardization Impact Simulator
          </span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
            Potential Material Master Reduction
          </h3>
        </div>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full w-fit">
          Ground Truth Live Telemetry
        </span>
      </div>

      {/* 4 Metric Cards (Section 12 Requirement) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
        {/* Card 1: Source Materials */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
            Source Materials
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {sourceMaterials.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Across {cpseCount} CPSE Catalogs
          </span>
        </div>

        {/* Card 2: Standard Materials */}
        <div className="bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg p-3">
          <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider block">
            Standard Materials
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-200 mt-1 font-mono">
            {standardMaterials.toLocaleString()}
          </div>
          <span className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5 block">
            Canonical Unified SKUs
          </span>
        </div>

        {/* Card 3: Potential Reduction */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-3">
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider block">
            Potential Reduction
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1 font-mono">
            {potentialReduction.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">
            Redundant Multi-CPSE SKUs
          </span>
        </div>

        {/* Card 4: Potential Reduction Rate */}
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 rounded-lg p-3">
          <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider block">
            Potential Reduction Rate
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1 font-mono">
            {potentialReductionRate}%
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5 block">
            Catalog Footprint Compression
          </span>
        </div>
      </div>

      {/* BEFORE -> AFTER MINIMAL VISUALIZATION (Section 13 Requirement) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3 text-center sm:text-left">
          End-to-End Enterprise Harmonization Pipeline
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-center">
          {/* BEFORE BOX */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
            <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              BEFORE
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-2 font-mono">
              {sourceMaterials} Source Records
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Disjointed taxonomies across {cpseCount} CPSEs
            </p>
          </div>

          {/* MIDDLE TRANSFORMATION PILLARS */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 rounded-lg flex flex-col items-center justify-center">
            <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600 text-white flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              SAMHITA AI
            </span>
            <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] font-bold text-blue-900 dark:text-blue-200">
              <span className="bg-white/90 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/60">AI Matching</span>
              <span className="bg-white/90 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/60">Normalization</span>
              <span className="bg-white/90 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/60">Tech Validation</span>
              <span className="bg-white/90 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/60">Harmonization</span>
            </div>
          </div>

          {/* AFTER BOX */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/80 rounded-lg">
            <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
              AFTER
            </span>
            <div className="text-base font-bold text-emerald-950 dark:text-emerald-200 mt-2 font-mono">
              {standardMaterials} Standard Identities
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium mt-1">
              Harmonized national material master
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
