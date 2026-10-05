import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Search,
  MessageSquare,
  Bot,
  Building2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { NLSearchResponse, AssistantAnswerResponse } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMaterial?: (id: number) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateToMaterial
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'assistant'>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('Find 10mm stainless steel bolts');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<NLSearchResponse | null>(null);

  // Assistant state
  const [question, setQuestion] = useState('How many materials are harmonized?');
  const [asking, setAsking] = useState(false);
  const [assistantResult, setAssistantResult] = useState<AssistantAnswerResponse | null>(null);

  if (!isOpen) return null;

  const sampleSearchQueries = [
    'Find 10mm stainless steel bolts',
    'Show copper cables used by ONGC',
    'Find bearing 6205',
    'Materials shared by BHEL and NTPC',
    'STD-FST-00128'
  ];

  const sampleAssistantQuestions = [
    'How many materials are harmonized?',
    'Which CPSE has the most potential duplicates?',
    'Show me all CPSEs using STD-FST-00128',
    'What is the SKU reduction rate?',
    'What materials have low confidence?',
    'Which categories have the highest duplicate rate?'
  ];

  const handleExecuteSearch = async (queryToRun?: string) => {
    const q = queryToRun || searchQuery;
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await api.naturalLanguageSearch(q.trim());
      setSearchResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleExecuteQuestion = async (qToRun?: string) => {
    const q = qToRun || question;
    if (!q.trim()) return;
    setAsking(true);
    try {
      const res = await api.askAssistant(q.trim());
      setAssistantResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">SAMHITA AI Intelligence Suite</h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded border border-blue-400/30 font-medium">Stage 4 Verified</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Natural Language Catalog Search &amp; Strictly Grounded Enterprise Assistant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'search'
                ? 'border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>AI Material Search (Natural Language)</span>
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'assistant'
                ? 'border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Enterprise Database Assistant (Grounded Q&amp;A)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: AI MATERIAL SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Natural Language Query:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
                      placeholder="e.g. Find 10mm stainless steel bolts, Show copper cables used by ONGC..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs font-medium"
                    />
                  </div>
                  <button
                    onClick={() => handleExecuteSearch()}
                    disabled={searching}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{searching ? 'Analyzing...' : 'Search'}</span>
                  </button>
                </div>

                {/* Query Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mr-1">Try Samples:</span>
                  {sampleSearchQueries.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setSearchQuery(q);
                        handleExecuteSearch(q);
                      }}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 transition font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results Display */}
              {searchResult && (
                <div className="space-y-3 pt-2">
                  {/* Query Analysis Card */}
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 block">Stage 2 AI Query Intelligence</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">Normalized: "{searchResult.parsed_query.normalized || searchQuery}"</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {searchResult.parsed_query.detected_cpses && searchResult.parsed_query.detected_cpses.length > 0 && (
                        <span className="text-[10px] bg-slate-900 dark:bg-slate-800 text-white px-2 py-0.5 rounded font-mono font-semibold">
                          Target CPSE: {searchResult.parsed_query.detected_cpses.join(', ')}
                        </span>
                      )}
                      {searchResult.parsed_query.attributes && Object.entries(searchResult.parsed_query.attributes).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded font-medium border border-blue-200 dark:border-blue-800">
                          {k}: {String(v)}
                        </span>
                      ))}
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold border border-emerald-200 dark:border-emerald-800">
                        {searchResult.total_matches} standard match(es)
                      </span>
                    </div>
                  </div>

                  {/* Results List */}
                  <div className="space-y-2.5">
                    {searchResult.results.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                        No standard catalog materials matched this natural language query.
                      </div>
                    ) : (
                      searchResult.results.map((r) => (
                        <div key={r.standard_code} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg transition shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                  {r.standard_code}
                                </span>
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{r.name}</h4>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                                  {r.category} &bull; {r.base_uom}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                                Spec: {r.normalized_spec}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Relevance</span>
                              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{r.relevance_score}%</span>
                            </div>
                          </div>

                          {/* Match Rationale */}
                          <div className="text-[11px] bg-slate-50 dark:bg-slate-950 p-2 rounded text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 mr-1">AI Rationale:</span>
                            {r.match_rationale}
                          </div>

                          {/* Cross-CPSE Lineage */}
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                              Linked Records Across {r.total_cpse_count} CPSEs ({r.cpse_list.join(', ')})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {r.cpse_records.map((rec) => (
                                <div
                                  key={rec.material_id}
                                  onClick={() => onNavigateToMaterial && onNavigateToMaterial(rec.material_id)}
                                  className="p-1.5 rounded bg-slate-50/80 dark:bg-slate-950/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] cursor-pointer transition"
                                >
                                  <div className="truncate mr-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 mr-1.5">{rec.cpse_code}</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-400 mr-1">[{rec.material_code}]</span>
                                    <span className="text-slate-600 dark:text-slate-400">{rec.original_description}</span>
                                  </div>
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">{rec.confidence_score}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENTERPRISE DATABASE ASSISTANT */}
          {activeTab === 'assistant' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Ask Enterprise Database Question:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleExecuteQuestion()}
                      placeholder="e.g. How many materials are harmonized? What is the SKU reduction rate?..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs font-medium"
                    />
                  </div>
                  <button
                    onClick={() => handleExecuteQuestion()}
                    disabled={asking}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>{asking ? 'Auditing DB...' : 'Ask Assistant'}</span>
                  </button>
                </div>

                {/* Question Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mr-1">Frequently Asked:</span>
                  {sampleAssistantQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setQuestion(q);
                        handleExecuteQuestion(q);
                      }}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 transition font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assistant Answer Box */}
              {assistantResult && (
                <div className="space-y-3 pt-2">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">Verified Database Audit Response</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{assistantResult.source}</span>
                      </div>
                    </div>

                    <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium">
                      {assistantResult.answer}
                    </p>

                    {/* Metric Badges if provided */}
                    {assistantResult.key_metrics && Object.keys(assistantResult.key_metrics).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {Object.entries(assistantResult.key_metrics).map(([k, v]) => (
                          <div key={k} className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block truncate">
                              {k.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block mt-0.5 truncate">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Data Table if provided */}
                    {assistantResult.data_table && assistantResult.data_table.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                          Detailed Audit Breakdown
                        </span>
                        <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-white dark:bg-slate-900">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                                {Object.keys(assistantResult.data_table[0]).map((h) => (
                                  <th key={h} className="p-2">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {assistantResult.data_table.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  {Object.values(row).map((val: any, cIdx) => (
                                    <td key={cIdx} className="p-2 text-slate-700 dark:text-slate-300">
                                      {String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Strict Zero-Hallucination Policy: All responses calculated from live inventory records.</span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
