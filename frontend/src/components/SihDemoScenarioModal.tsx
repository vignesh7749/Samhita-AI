import React from 'react';
import {
  X,
  Sparkles,
  GitMerge,
  AlertOctagon,
  Copy,
  Tag,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface SihDemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioId: number) => void;
}

export const SihDemoScenarioModal: React.FC<SihDemoScenarioModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      id: 1,
      title: 'Scenario 1: Same Material Across Five CPSEs',
      subtitle: 'SS Hex Bolt M10 × 50 mm (STD-FST-00128)',
      tag: 'Harmonization',
      tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: GitMerge,
      iconColor: 'text-emerald-600',
      description:
        'Demonstrates 5 disparate CPSE descriptions (ONGC, BHEL, NTPC, SAIL, IOCL) unified under one standardized identity with 96% AI confidence.',
      actionLabel: 'View 5-CPSE Harmonization Family'
    },
    {
      id: 2,
      title: 'Scenario 2: Similar Description but Technical Conflict',
      subtitle: 'Fastener Diameter Conflict (M10 vs M12)',
      tag: 'Conflict Protection',
      tagColor: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: AlertOctagon,
      iconColor: 'text-rose-600',
      description:
        'Demonstrates how high textual similarity is overridden by critical engineering dimension mismatch. Explains "Why Not a Match?".',
      actionLabel: 'Test Live Conflict Simulation'
    },
    {
      id: 3,
      title: 'Scenario 3: Cross-CPSE Duplicate Detection',
      subtitle: 'Redundant Inventory SKU Identification',
      tag: 'Duplicate Elimination',
      tagColor: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: Copy,
      iconColor: 'text-blue-600',
      description:
        'Demonstrates detection of identical items across enterprise silos and safe non-destructive merging under a canonical standard code.',
      actionLabel: 'Inspect Duplicate Detection Table'
    },
    {
      id: 4,
      title: 'Scenario 4: Unique Specialized CPSE Material',
      subtitle: 'Single-CPSE High-Specification Equipment',
      tag: 'Unique Master',
      tagColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: Tag,
      iconColor: 'text-indigo-600',
      description:
        'Demonstrates that unique specialized parts retain their integrity without forced false harmonization, receiving distinct standard codes.',
      actionLabel: 'Inspect Unique Specialized Parts'
    },
    {
      id: 5,
      title: 'Scenario 5: Low-Confidence AI Suggestion',
      subtitle: 'Human-in-the-Loop Review & Audit Trail',
      tag: 'Human Review',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-600',
      description:
        'Demonstrates borderline similarity (65–74%) safely routed to human technical officers for approval, rejection, or specification modification.',
      actionLabel: 'Open Reviewer Validation Queue'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                SIH Judge Presentation
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
              Select Demo Scenario
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Launch real, pre-configured database evaluation workflows in one click.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios List */}
        <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto space-y-3">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc.id);
                  onClose();
                }}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-950 group-hover:shadow-xs border border-slate-200 dark:border-slate-700 transition shrink-0 mt-0.5">
                    <Icon className={`w-5 h-5 ${sc.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition">
                        {sc.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${sc.tagColor}`}
                      >
                        {sc.tag}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {sc.subtitle}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {sc.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectScenario(sc.id);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 group-hover:bg-blue-600 group-hover:text-white rounded-md transition shrink-0 self-end sm:self-center"
                >
                  <span>Launch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>All scenarios are verified against live Postgres/SQLite records.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
