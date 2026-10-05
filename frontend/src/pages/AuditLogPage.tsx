import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        page,
        pageSize: 25,
        search: search.trim() || undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined
      });
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'User', 'Role', 'Material Code', 'Previous State', 'New State', 'Action', 'Reason'];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toISOString(),
      `"${l.user_name}"`,
      l.user_role,
      l.material_code,
      l.previous_state,
      l.new_state,
      `"${l.action}"`,
      `"${l.reason || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SAMHITA_Audit_Trail_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Enterprise Compliance Audit Trail
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
              Immutable Log
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete traceability of AI harmonization decisions, human reviewer approvals, rejections, and batch ingestions.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md transition shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xs flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search material code, user name, action, or technical justification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900"
          />
        </form>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:w-48"
        >
          <option value="ALL">All Recorded Actions</option>
          <option value="Approve">Approvals</option>
          <option value="Reject">Rejections</option>
          <option value="Modify">Modifications</option>
          <option value="Import">Data Imports</option>
        </select>
      </div>

      {/* Audit Table & Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        {/* MOBILE CARDS VIEW (< md) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Retrieving compliance records...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              No audit records found matching criteria.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 text-[10px]">
                    {log.action}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-blue-900 dark:text-blue-300">
                    {log.material_code}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    {log.user_name} <span className="text-slate-400 dark:text-slate-500 font-normal">({log.user_role})</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">State:</span>
                  <span className="text-slate-600 dark:text-slate-300">{log.previous_state}</span>
                  <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{log.new_state}</span>
                </div>

                {log.reason && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-blue-50/40 dark:bg-blue-950/30 p-2 rounded border border-blue-100/60 dark:border-blue-900/50">
                    "{log.reason}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User &amp; Role</th>
                <th className="py-3 px-4">Material Code</th>
                <th className="py-3 px-4">State Transition</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Recorded Reason / Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrieving compliance records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{log.user_name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{log.user_role}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {log.material_code}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">{log.previous_state}</span>
                        <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{log.new_state}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md text-[11px]">
                      {log.reason ? `"${log.reason}"` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="py-3 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            Page <span className="font-semibold text-slate-900 dark:text-slate-100">{page}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span> ({total} logs)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
