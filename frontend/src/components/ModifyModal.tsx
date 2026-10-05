import React, { useState } from 'react';
import { X, Edit3, CheckCircle2 } from 'lucide-react';
import { ReviewQueueItem } from '../types';

interface ModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { newStandardCode?: string; modifiedName?: string; notes: string }) => void;
  item: ReviewQueueItem | null;
}

export const ModifyModal: React.FC<ModifyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item
}) => {
  const [standardCode, setStandardCode] = useState(item?.suggested_standard_code || '');
  const [modifiedName, setModifiedName] = useState(item?.suggested_standard_name || '');
  const [notes, setNotes] = useState('Standard specification modified based on verified CPSE technical datasheet.');

  React.useEffect(() => {
    if (item) {
      setStandardCode(item.suggested_standard_code || '');
      setModifiedName(item.suggested_standard_name || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Modify Standard Material Assignment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Source CPSE Record</div>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">{item.cpse_code} — {item.material_code}</div>
            <div className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{item.original_description}</div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Standard Material Code:</label>
            <input
              type="text"
              value={standardCode}
              onChange={(e) => setStandardCode(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="e.g. STD-FST-00128"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">Assign an existing standard catalog code or allocate a new standard ID.</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Canonical Standard Material Name:</label>
            <input
              type="text"
              value={modifiedName}
              onChange={(e) => setModifiedName(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="e.g. Stainless Steel Hex Bolt M10 x 50 mm"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Reviewer Justification / Notes:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded p-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Explain the technical adjustment for governance audit trail..."
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
                newStandardCode: standardCode.trim() || undefined,
                modifiedName: modifiedName.trim() || undefined,
                notes: notes.trim()
              });
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold transition shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apply Modification</span>
          </button>
        </div>
      </div>
    </div>
  );
};
