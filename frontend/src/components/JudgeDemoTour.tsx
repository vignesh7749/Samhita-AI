import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';

export interface DemoStep {
  step: number;
  tab: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  narration: string;
  targetMaterialId?: number;
}

interface JudgeDemoTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, filter?: any) => void;
  onOpenMaterial?: (id: number) => void;
}

export const JudgeDemoTour: React.FC<JudgeDemoTourProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenMaterial
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);

  if (!isOpen) return null;

  const demoSteps: DemoStep[] = [
    {
      step: 1,
      tab: 'dashboard',
      title: 'Enterprise Portfolio Overview',
      subtitle: 'Five CPSEs maintain procurement records independently',
      actionLabel: 'View Dashboard',
      narration:
        'Five major CPSEs (ONGC, BHEL, NTPC, SAIL, IOCL) maintain 700 material records with disparate naming conventions and codes.'
    },
    {
      step: 2,
      tab: 'materials',
      title: 'Material Master Inspection',
      subtitle: 'Select MAT-001245 (ONGC Hex Bolt)',
      actionLabel: 'Open Material Master',
      targetMaterialId: 1,
      narration:
        'Notice how ONGC records "MAT-001245" as "HEX BOLT M10 X 50 SS". Other CPSEs have different descriptions for the identical item.'
    },
    {
      step: 3,
      tab: 'materials',
      title: 'Stage 2 AI Intelligence & Extraction',
      subtitle: '6-Layer Normalization & Conflict Engine',
      actionLabel: 'Inspect AI Explanations',
      targetMaterialId: 1,
      narration:
        'SAMHITA AI extracts technical attributes (SS304, M10 x 50mm, Hex Head) without hallucinating. It detects dimensions and distinguishes M10 from M12.'
    },
    {
      step: 4,
      tab: 'harmonization',
      title: 'Cross-CPSE Harmonization Group',
      subtitle: 'Unified Standard Identity STD-FST-00128',
      actionLabel: 'Open Harmonization',
      narration:
        'All 5 CPSEs are harmonized under a single canonical standard code "STD-FST-00128" (Stainless Steel Hex Bolt M10 x 50 mm) with 93.7% confidence.'
    },
    {
      step: 5,
      tab: 'duplicates',
      title: 'Cross-CPSE Duplicate Detection',
      subtitle: 'Identify & Merge Redundant Records Safely',
      actionLabel: 'Open Duplicate Detection',
      narration:
        'Stage 2 & 3 engines detect 118 duplicate pairs. Admins can safely merge records into a canonical identity while preserving original CPSE audit lineage.'
    },
    {
      step: 6,
      tab: 'review',
      title: 'Human-in-the-Loop Review Queue',
      subtitle: 'Approve, Reject with Reasons, or Modify',
      actionLabel: 'Open Review Queue',
      narration:
        'Reviewers validate AI recommendations. Rejections capture structured conflict categories (grade, dimension mismatch) for continuous model training.'
    },
    {
      step: 7,
      tab: 'try-ai',
      title: 'Live Interactive Matching Playground',
      subtitle: 'Compare Any Two Descriptions Instantly',
      actionLabel: 'Try AI Matching',
      narration:
        'Test live matching between ONGC and BHEL descriptions. See how identical materials match, while dimension conflicts (e.g. M10 vs M12) are correctly flagged.'
    },
    {
      step: 8,
      tab: 'analytics',
      title: 'Measurable Enterprise Impact',
      subtitle: '94.3% Potential Material Master SKU Reduction',
      actionLabel: 'View Analytics',
      narration:
        'Standardizing 700 disparate CPSE items into 40 canonical standard materials achieves 660 redundant code reductions (94.3% consolidation) and exportable reports.'
    }
  ];

  const current = demoSteps[currentStepIndex];

  const handleGoToStep = (index: number) => {
    setCurrentStepIndex(index);
    const step = demoSteps[index];
    onNavigate(step.tab);
    if (step.targetMaterialId && onOpenMaterial) {
      setTimeout(() => {
        onOpenMaterial(step.targetMaterialId!);
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < demoSteps.length - 1) {
      handleGoToStep(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      handleGoToStep(currentStepIndex - 1);
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 bg-slate-900 text-white rounded-lg shadow-xl border border-slate-700 p-2.5 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="font-bold">SIH Judge Demo</span>
          <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded font-mono">
            {current.step}/8: {current.title}
          </span>
        </div>
        <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
          <button
            onClick={() => setMinimized(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Expand Presentation Bar"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Close Demo Mode"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-in slide-in-from-bottom-3 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/80 p-4">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="font-bold uppercase tracking-wider text-[11px] text-blue-400">
              SIH Judge Presentation Tour
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400 text-[11px]">Step {current.step} of 8</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Exit Tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                STEP {current.step}
              </span>
              <h4 className="font-bold text-sm text-white">{current.title}</h4>
            </div>
            <p className="text-slate-300 text-xs font-medium leading-relaxed">
              {current.narration}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleGoToStep(currentStepIndex)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Play className="w-3 h-3" />
              <span>{current.actionLabel}</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === demoSteps.length - 1}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition"
              title="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
          {demoSteps.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => handleGoToStep(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'w-6 bg-blue-500'
                  : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Step ${s.step}: ${s.title}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
