import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  MessageSquare,
  RefreshCw,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { ReviewQueueItem, User, HumanFeedbackItem } from '../types';
import { RejectModal } from '../components/RejectModal';
import { ModifyModal } from '../components/ModifyModal';

interface ReviewQueuePageProps {
  onOpenMaterial: (id: number) => void;
  currentUser: User;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({
  onOpenMaterial,
  currentUser,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'feedback'>('queue');

  // Queue state
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [rejectingItem, setRejectingItem] = useState<ReviewQueueItem | null>(null);
  const [modifyingItem, setModifyingItem] = useState<ReviewQueueItem | null>(null);

  // Feedback history state
  const [feedbacks, setFeedbacks] = useState<HumanFeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const canReview = currentUser.role === 'admin' || currentUser.role === 'reviewer';

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getReviewQueue(page, 20);
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      onShowToast('Error', 'Failed to load review queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const data = await api.getHumanFeedback(50);
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue();
    } else {
      fetchFeedback();
    }
  }, [page, activeTab]);

  const handleApprove = async (item: ReviewQueueItem) => {
    if (!canReview) {
      onShowToast('Access Denied', 'Viewer role is read-only. Switch to Admin or Reviewer.', 'error');
      return;
    }
    try {
      await api.submitReviewDecision(item.material_id, 'approved', {
        notes: 'Technical parameters and standard mapping approved by human reviewer.',
        reviewerName: currentUser.full_name
      });
      onShowToast('Approved', `Material ${item.material_code} standard mapping confirmed and logged to feedback!`, 'success');
      setItems((prev) => prev.filter((i) => i.material_id !== item.material_id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err: any) {
      onShowToast('Error', err.message || 'Failed to approve', 'error');
    }
  };

  const handleRejectConfirm = async (payload: { category: string; reason: string }) => {
    if (!rejectingItem) return;
    try {
      await api.submitReviewDecision(rejectingItem.material_id, 'rejected', {
        rejectionCategory: payload.category,
        rejectionReason: payload.reason,
        notes: payload.reason,
        reviewerName: currentUser.full_name
      });
      onShowToast('Rejected', `Material ${rejectingItem.material_code} marked as conflict. Feedback recorded.`, 'info');
      setItems((prev) => prev.filter((i) => i.material_id !== rejectingItem.material_id));
      setTotal((t) => Math.max(0, t - 1));
      setRejectingItem(null);
    } catch (err: any) {
      onShowToast('Error', err.message || 'Failed to reject', 'error');
    }
  };

  const handleModifyConfirm = async (payload: { newStandardCode?: string; modifiedName?: string; notes: string }) => {
    if (!modifyingItem) return;
    try {
      await api.submitReviewDecision(modifyingItem.material_id, 'modified', {
        newStandardCode: payload.newStandardCode,
        modifiedName: payload.modifiedName,
        notes: payload.notes,
        reviewerName: currentUser.full_name
      });
      onShowToast('Modified & Re-Harmonized', `Standard material assignment updated for ${modifyingItem.material_code}.`, 'success');
      setItems((prev) => prev.filter((i) => i.material_id !== modifyingItem.material_id));
      setTotal((t) => Math.max(0, t - 1));
      setModifyingItem(null);
    } catch (err: any) {
      onShowToast('Error', err.message || 'Failed to modify', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Human-in-the-Loop Review Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Validate, reject with structured reason categories, or modify AI harmonization recommendations.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'queue'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Pending Queue ({total})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1 ${
              activeTab === 'feedback'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Human Feedback Loop</span>
          </button>
        </div>
      </div>

      {/* Access Banner */}
      {!canReview && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-md text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Read-Only Mode:</strong> Your current role is <span className="font-semibold uppercase text-amber-900 dark:text-amber-200">{currentUser.role}</span>. Review actions (Approve, Reject, Modify) are restricted to Reviewers and Admins.
            </span>
          </div>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 underline font-semibold">Switch role in top bar to test</span>
        </div>
      )}

      {/* TAB 1: PENDING QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500">Loading pending reviews...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Queue is Clear</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                All AI-suggested cross-CPSE material harmonizations have been reviewed or automatically verified!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.material_id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg p-4 shadow-xs transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs bg-slate-900 dark:bg-slate-800 text-white px-2 py-0.5 rounded">
                          {item.cpse_code}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                          {item.material_code}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {item.category_name}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {item.original_description}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Normalized: {item.normalized_description}
                      </div>
                    </div>

                    {/* Confidence Score Pill */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">AI Match Confidence</span>
                      <span className="text-base font-extrabold text-blue-700 dark:text-blue-400">{item.confidence}%</span>
                    </div>
                  </div>

                  {/* Suggested Standard Mapping */}
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                        Suggested Canonical Standard Material
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-blue-900 dark:text-blue-200">
                          {item.suggested_standard_code || 'STD-AUTO-GEN'}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">
                          {item.suggested_standard_name || 'Standard Industrial Material'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Rationale: {item.reason}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 border-t sm:border-t-0 sm:border-l border-blue-200 dark:border-blue-800 pt-2 sm:pt-0 sm:pl-3">
                      <div>
                        <span>Dimension: </span>
                        <strong className="text-slate-800 dark:text-slate-200">{item.dimension_sim}%</strong>
                      </div>
                      <div>
                        <span>Material: </span>
                        <strong className="text-slate-800 dark:text-slate-200">{item.material_sim}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onOpenMaterial(item.material_id)}
                      className="text-xs text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center gap-1 min-h-[36px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Stage 2 Attributes</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
                      <button
                        onClick={() => setModifyingItem(item)}
                        disabled={!canReview}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded transition disabled:opacity-40 flex items-center gap-1 min-h-[38px]"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Modify</span>
                      </button>

                      <button
                        onClick={() => setRejectingItem(item)}
                        disabled={!canReview}
                        className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded transition disabled:opacity-40 flex items-center gap-1 min-h-[38px]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApprove(item)}
                        disabled={!canReview}
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded transition disabled:opacity-40 shadow-xs flex items-center gap-1 min-h-[38px]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Match</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Page {page} of {totalPages} ({total} pending reviews)</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HUMAN FEEDBACK DATABASE (Section 11) */}
      {activeTab === 'feedback' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Continuous Learning Feedback Trail (Section 11)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable record of human approvals, rejections with structured reasons, and modifications for model alignment.
              </p>
            </div>

            <button
              onClick={fetchFeedback}
              disabled={loadingFeedback}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingFeedback ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {loadingFeedback ? (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">Loading feedback records...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">No human feedback decisions recorded yet.</div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Material Code</th>
                    <th className="p-2.5">Original Description</th>
                    <th className="p-2.5">Decision</th>
                    <th className="p-2.5">Conflict Category</th>
                    <th className="p-2.5">Reviewer</th>
                    <th className="p-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {feedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono text-slate-400 dark:text-slate-500">#{fb.id}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">{fb.material_code}</td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">{fb.original_description}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          fb.decision === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : fb.decision === 'modified'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}>
                          {fb.decision}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 font-medium">
                        {fb.reason_category || '—'}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        {fb.reviewer_name} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({fb.reviewer_role})</span>
                      </td>
                      <td className="p-2.5 text-slate-400 dark:text-slate-500 text-[11px]">
                        {new Date(fb.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <RejectModal
        isOpen={!!rejectingItem}
        onClose={() => setRejectingItem(null)}
        onSubmit={handleRejectConfirm}
        materialCode={rejectingItem?.material_code}
      />

      {/* Modify Modal */}
      <ModifyModal
        isOpen={!!modifyingItem}
        onClose={() => setModifyingItem(null)}
        onSubmit={handleModifyConfirm}
        item={modifyingItem}
      />
    </div>
  );
};
