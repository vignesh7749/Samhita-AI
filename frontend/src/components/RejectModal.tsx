import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { category: string; reason: string }) => void;
  materialCode?: string;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  materialCode
}) => {
  const structuredCategories = [
    { label: 'Technical Specification Conflict', desc: 'Critical conflict in dimensions, ratings, or grades' },
    { label: 'Different Material Grade', desc: 'e.g. SS316 vs SS304 or Carbon Steel vs Stainless' },
    { label: 'Dimension / Sizing Mismatch', desc: 'e.g. M10 vs M12 or 50mm vs 60mm length' },
    { label: 'Incompatible Product Class', desc: 'e.g. Hex Bolt vs Hex Nut or Ball vs Roller Bearing' },
    { label: 'Different Application / Rating', desc: 'e.g. Class 150 vs Class 300 pressure ratings' },
    { label: 'Other Procurement Discrepancy', desc: 'Packaging, obsolete specification, or distinct vendor code' }
  ];

  const [selectedCategory, setSelectedCategory] = useState(structuredCategories[0].label);
  const [reasonNotes, setReasonNotes] = useState('Critical technical conflict identified between source CPSE description and suggested standard material.');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Reject AI Match Suggestion</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Provide structured rejection rationale for material <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{materialCode}</span>.
            This feedback is immutably logged to the Audit Trail and directly trains the AI continuous learning engine.
          </p>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Structured Conflict Category (Section 9):</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {structuredCategories.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setSelectedCategory(c.label)}
                  className={`w-full text-left px-3 py-2 rounded border text-xs transition ${
                    selectedCategory === c.label
                      ? 'border-rose-600 dark:border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{c.label}</span>
                    {selectedCategory === c.label && <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Selected</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Detailed Technical Justification:</label>
            <textarea
              rows={2}
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded p-2 text-xs focus:ring-1 focus:ring-rose-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Specify the exact technical reason for rejection..."
            />
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSubmit({
                category: selectedCategory,
                reason: reasonNotes.trim()
              });
              onClose();
            }}
            className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-semibold transition shadow-xs"
          >
            Confirm Rejection &amp; Log Feedback
          </button>
        </div>
      </div>
    </div>
  );
};
