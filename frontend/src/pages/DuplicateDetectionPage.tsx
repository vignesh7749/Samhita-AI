import React, { useState, useEffect } from 'react';
import {
  Copy,
  AlertTriangle,
  GitMerge,
  Split,
  Eye,
  CheckCircle2,
  Building2,
  ChevronRight,
  Filter,
  Sparkles,
  ShieldCheck,
  XCircle,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { DuplicatePair, User } from '../types';

interface DuplicateDetectionPageProps {
  onOpenMaterial: (id: number) => void;
  currentUser: User;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const DuplicateDetectionPage: React.FC<DuplicateDetectionPageProps> = ({
  onOpenMaterial,
  currentUser,
  onShowToast
}) => {
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Filters
  const [minSim, setMinSim] = useState(70);
  const [relationshipFilter, setRelationshipFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Merge modal state
  const [mergeModalPair, setMergeModalPair] = useState<DuplicatePair | null>(null);
  const [mergeNotes, setMergeNotes] = useState('');

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'reviewer';

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const data = await api.getDuplicates({
        minSimilarity: minSim,
        relationshipType: relationshipFilter !== 'ALL' ? relationshipFilter : undefined,
        status: statusFilter,
        limit: 100
      });
      setDuplicates(data);
    } catch (err) {
      console.error(err);
      onShowToast('Error', 'Failed to load duplicate detection candidates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [minSim, relationshipFilter, statusFilter]);

  const handleOpenMergeModal = (pair: DuplicatePair) => {
    if (!canEdit) {
      onShowToast('Read Only', 'Viewer role cannot merge records.', 'error');
      return;
    }
    setMergeModalPair(pair);
    setMergeNotes(`Consolidating cross-CPSE duplicate materials under canonical identity.`);
  };

  const handleConfirmMerge = async () => {
    if (!mergeModalPair || !mergeModalPair.id) return;
    setActionLoadingId(mergeModalPair.id);
    try {
      await api.mergeDuplicate(mergeModalPair.id, {
        reviewerName: currentUser.full_name,
        notes: mergeNotes.trim() || undefined
      });

      onShowToast(
        'Merged to Canonical Standard Identity',
        `Consolidated ${mergeModalPair.material_a_code} (${mergeModalPair.material_a_cpse}) and ${mergeModalPair.material_b_code} (${mergeModalPair.material_b_cpse}) without deleting original source records.`,
        'success'
      );

      setMergeModalPair(null);
      // Refresh
      fetchDuplicates();
    } catch (err: any) {
      onShowToast('Merge Failed', err.message || 'Unable to merge records', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleKeepSeparate = async (pair: DuplicatePair) => {
    if (!canEdit) {
      onShowToast('Read Only', 'Viewer role cannot perform actions.', 'error');
      return;
    }
    if (!pair.id) return;

    setActionLoadingId(pair.id);
    try {
      await api.keepSeparateDuplicate(pair.id, {
        reviewerName: currentUser.full_name,
        notes: 'Flagged as distinct materials in procurement catalog'
      });

      onShowToast(
        'Flagged as Distinct Materials',
        `Marked ${pair.material_a_code} and ${pair.material_b_code} to prevent unintended automatic regrouping.`,
        'info'
      );

      // Refresh
      fetchDuplicates();
    } catch (err: any) {
      onShowToast('Action Failed', err.message || 'Unable to separate records', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRelationshipBadge = (type?: string) => {
    switch (type) {
      case 'exact_duplicate':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Exact Duplicate</span>
          </span>
        );
      case 'near_duplicate':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/80 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Near Duplicate</span>
          </span>
        );
      case 'potential_duplicate':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Potential Duplicate</span>
          </span>
        );
      case 'non_duplicate':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
            <Split className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>Distinct Materials</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {type || 'Candidate'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Cross-CPSE Duplicate Detection &amp; Resolution
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Stage 3 Deduplication
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Classifying redundant catalog items across CPSEs with non-destructive merge and audit-logged separation.
          </p>
        </div>

        {/* Tier Count Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Similarity:</span>
          <select
            value={minSim}
            onChange={(e) => setMinSim(Number(e.target.value))}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value={90}>&ge; 90% (Exact & High)</option>
            <option value={80}>&ge; 80% (High Affinity)</option>
            <option value={70}>&ge; 70% (Broader Scan)</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setRelationshipFilter('ALL')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              relationshipFilter === 'ALL'
                ? 'bg-blue-700 dark:bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Relationships
          </button>
          <button
            onClick={() => setRelationshipFilter('exact_duplicate')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              relationshipFilter === 'exact_duplicate'
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            Exact Duplicates
          </button>
          <button
            onClick={() => setRelationshipFilter('near_duplicate')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              relationshipFilter === 'near_duplicate'
                ? 'bg-blue-700 dark:bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800'
            }`}
          >
            Near Duplicates
          </button>
          <button
            onClick={() => setRelationshipFilter('potential_duplicate')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              relationshipFilter === 'potential_duplicate'
                ? 'bg-amber-700 dark:bg-amber-600 text-white font-semibold shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800'
            }`}
          >
            Potential Duplicates
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="pending">Pending Action</option>
            <option value="merged">Merged to Standard</option>
            <option value="kept_separate">Kept Separate</option>
            <option value="ALL">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Duplicate Pairs List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">Scanning catalog for cross-enterprise duplicate pairs...</span>
        </div>
      ) : duplicates.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-xs">
          No duplicate candidates found matching the selected relationship and status criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {duplicates.map((pair, idx) => {
            const isActionLoading = actionLoadingId === pair.id;
            const isMerged = pair.status === 'merged';
            const isKeptSeparate = pair.status === 'kept_separate';

            return (
              <div
                key={pair.id || `${pair.material_a_id}-${pair.material_b_id}-${idx}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs"
              >
                {/* Top Bar of Pair */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {getRelationshipBadge(pair.relationship_type)}
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {pair.similarity_score}% Stage 2 Similarity
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Category: <strong className="text-slate-800 dark:text-slate-200">{pair.category}</strong>
                    </span>

                    {isMerged && (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                        ✓ Merged
                      </span>
                    )}
                    {isKeptSeparate && (
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded">
                        Kept Separate
                      </span>
                    )}
                  </div>

                  {canEdit && !isMerged && !isKeptSeparate && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleOpenMergeModal(pair)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 rounded transition shadow-xs min-h-[36px]"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Merge Records</span>
                      </button>
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleKeepSeparate(pair)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded transition border border-slate-200 dark:border-slate-700 min-h-[36px]"
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Keep Separate</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                  {/* Material A */}
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 rounded-md border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {pair.material_a_cpse}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400 font-bold">{pair.material_a_code}</span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs">
                      "{pair.material_a_desc}"
                    </div>
                    {pair.material_a_norm && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Normalized: <span className="text-slate-700 dark:text-slate-300 font-mono">{pair.material_a_norm}</span>
                      </div>
                    )}
                    <button
                      onClick={() => onOpenMaterial(pair.material_a_id)}
                      className="mt-2 text-[11px] text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-0.5"
                    >
                      <span>Inspect Record</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Material B */}
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 rounded-md border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {pair.material_b_cpse}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400 font-bold">{pair.material_b_code}</span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs">
                      "{pair.material_b_desc}"
                    </div>
                    {pair.material_b_norm && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Normalized: <span className="text-slate-700 dark:text-slate-300 font-mono">{pair.material_b_norm}</span>
                      </div>
                    )}
                    <button
                      onClick={() => onOpenMaterial(pair.material_b_id)}
                      className="mt-2 text-[11px] text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-0.5"
                    >
                      <span>Inspect Record</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">AI Stage 2 Reasoning:</strong> {pair.explanation}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Merge Confirmation Modal (Section 15 Non-Destructive Assurance) */}
      {mergeModalPair && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <GitMerge className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Non-Destructive Record Consolidation
              </h3>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                You are consolidating 2 cross-CPSE duplicate materials under a common canonical standard material identity:
              </p>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{mergeModalPair.material_a_cpse}:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{mergeModalPair.material_a_code}</span>
                </div>
                <div className="italic text-slate-700 dark:text-slate-300">"{mergeModalPair.material_a_desc}"</div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-1.5 mt-1.5 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{mergeModalPair.material_b_cpse}:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{mergeModalPair.material_b_code}</span>
                </div>
                <div className="italic text-slate-700 dark:text-slate-300">"{mergeModalPair.material_b_desc}"</div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded text-[11px] text-emerald-800 dark:text-emerald-300">
                <strong>Non-Destructive Guarantee (Section 15):</strong> Neither record will be deleted. Both CPSE material codes and original descriptions remain intact in the database while linking to the standardized identity.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Audit Log Review Notes:
              </label>
              <input
                type="text"
                value={mergeNotes}
                onChange={(e) => setMergeNotes(e.target.value)}
                placeholder="Reason or justification for merge..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setMergeModalPair(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded"
              >
                Cancel
              </button>
              <button
                disabled={actionLoadingId !== null}
                onClick={handleConfirmMerge}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded transition shadow-xs disabled:opacity-50"
              >
                Confirm &amp; Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
