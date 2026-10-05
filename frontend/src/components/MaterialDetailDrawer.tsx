import React from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Building2,
  Tag,
  ShieldCheck,
  Check,
  XCircle,
  Edit3,
  ArrowRight,
  AlertOctagon,
  Percent,
  Sliders
} from 'lucide-react';
import { MaterialDetail } from '../types';
import { AiDecisionCard } from './AiDecisionCard';
import { MaterialRelationshipView } from './MaterialRelationshipView';

interface MaterialDetailDrawerProps {
  material: MaterialDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onModify?: (material: MaterialDetail) => void;
  userRole?: string;
}

export const MaterialDetailDrawer: React.FC<MaterialDetailDrawerProps> = ({
  material,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onModify,
  userRole = 'viewer'
}) => {
  if (!isOpen || !material) return null;

  const canEdit = userRole === 'admin' || userRole === 'reviewer';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Human Approved</span>
          </span>
        );
      case 'ai_suggested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>AI Suggested</span>
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Needs Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span>Raw Catalog Item</span>
          </span>
        );
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80';
    if (score >= 75) return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/80';
    return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                {material.material_code}
              </span>
              {getStatusBadge(material.match_status)}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
              Material Specification &amp; Harmonization Detail
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area with Section Dividers (Section 6) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* SECTION 1: SOURCE INFORMATION */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                1. Source Procurement Information
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {material.cpse_code}
              </span>
            </div>

            <div>
              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">
                Original Description
              </span>
              <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-1 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-xs">
                {material.original_description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Enterprise</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{material.cpse_name}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Material Code</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{material.material_code}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Manufacturer</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{material.manufacturer || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Part Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{material.part_number || '—'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: NORMALIZED INFORMATION */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/60 dark:bg-slate-900/50 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                2. Normalized Standard Representation
              </span>
              <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded font-semibold border border-blue-200 dark:border-blue-800">
                Acronyms Expanded
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">
                Normalized Specification
              </span>
              <div className="font-mono font-medium text-blue-950 dark:text-blue-200 mt-1 bg-white dark:bg-slate-950 p-2.5 rounded border border-blue-100 dark:border-blue-900/40 shadow-2xs text-xs">
                {material.normalized_description}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{material.category_name}</span>
              </div>
              <div className="bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Base UOM</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">{material.uom}</span>
              </div>
              <div className="bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Harmonization</span>
                <span className="font-bold text-blue-700 dark:text-blue-400 block mt-0.5">{material.harmonization_status || 'HARMONIZED'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: TECHNICAL ATTRIBUTES */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              3. Extracted Technical Attributes
            </span>

            {material.attributes ? (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {material.attributes.material_type && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Material Metallurgy</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{material.attributes.material_type}</span>
                  </div>
                )}
                {material.attributes.product_type && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Product Class</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{material.attributes.product_type}</span>
                  </div>
                )}
                {material.attributes.dimensions && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Dimensions</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{material.attributes.dimensions}</span>
                  </div>
                )}
                {material.attributes.grade && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Grade / Rating</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{material.attributes.grade}</span>
                  </div>
                )}
                {material.attributes.size_rating && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Size / Designation</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{material.attributes.size_rating}</span>
                  </div>
                )}
                {material.attributes.voltage && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Voltage / Pressure</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{material.attributes.voltage}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 dark:text-slate-500 italic py-2">No structured technical attributes detected.</div>
            )}
          </div>

          {/* SECTION 4: AI DECISION & EXPLAINABLE EVIDENCE (Sections 7, 8, 9) */}
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              4. AI Harmonization Analysis &amp; Reasoning
            </span>
            <AiDecisionCard
              status={
                material.match_status === 'approved'
                  ? 'EQUIVALENT'
                  : material.match_status === 'rejected'
                  ? 'NOT_EQUIVALENT'
                  : material.has_critical_conflict
                  ? 'CONFLICT'
                  : material.confidence_score >= 85
                  ? 'EQUIVALENT'
                  : 'POTENTIAL'
              }
              confidenceScore={material.confidence_score}
              standardCode={material.standard_code}
              standardName={material.standard_name}
              breakdown={material.match_breakdown}
              criticalConflicts={material.critical_conflicts}
              attributeComparisons={material.attribute_comparisons}
              explanation={material.match_breakdown?.explanation}
            />
          </div>

          {/* SECTION 4.5: CROSS-CPSE RELATIONSHIP TOPOLOGY (Section 10) */}
          {material.standard_code && material.related_materials && material.related_materials.length > 0 && (
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Cross-CPSE Harmonization Group Topology
              </span>
              <MaterialRelationshipView
                standardCode={material.standard_code}
                standardName={material.standard_name || 'Standard Canonical Group'}
                records={material.related_materials}
                activeMaterialId={material.id}
              />
            </div>
          )}
        </div>

        {/* SECTION 5: ACTIONS (Section 6) */}
        {canEdit && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition min-h-[38px]"
            >
              Close
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {material.match_status !== 'rejected' && onReject && (
                <button
                  onClick={() => onReject(material.id)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-md transition min-h-[38px]"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              )}

              {onModify && (
                <button
                  onClick={() => onModify(material)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md transition min-h-[38px]"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Modify</span>
                </button>
              )}

              {material.match_status !== 'approved' && onApprove && (
                <button
                  onClick={() => onApprove(material.id)}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-md transition shadow-xs min-h-[38px]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Match</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
