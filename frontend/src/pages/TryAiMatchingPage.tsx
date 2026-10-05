import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  ShieldCheck,
  Building2,
  Layers,
  RefreshCw,
  Cpu,
  Check,
  AlertOctagon,
  HelpCircle,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { CompareResponse, AttributeComparisonItem } from '../types';
import { AiDecisionCard } from '../components/AiDecisionCard';

export const TryAiMatchingPage: React.FC = () => {
  const [descA, setDescA] = useState('HEX BOLT M10 X 50 SS');
  const [descB, setDescB] = useState('SS HEXAGONAL BOLT 10MM X 50MM');
  const [category, setCategory] = useState('Fasteners');
  const [uomA, setUomA] = useState('NOS');
  const [uomB, setUomB] = useState('NUMBERS');

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stage 2 Benchmark Presets with Deterministic Outcomes
  const presets = [
    {
      label: '1. Format Normalization (SS Bolt)',
      badge: 'MATCH',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      category: 'Fasteners',
      a: 'HEX BOLT M10 X 50 SS',
      b: 'SS HEXAGONAL BOLT 10MM X 50MM',
      uomA: 'NOS',
      uomB: 'NUMBERS'
    },
    {
      label: '2. Cable Synonyms & Units (Cu Cable)',
      badge: 'MATCH',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      category: 'Cables & Wires',
      a: 'CU CABLE 4 CORE 10 SQMM',
      b: 'COPPER CABLE 4 CORE 10 MM2',
      uomA: 'MTR',
      uomB: 'METERS'
    },
    {
      label: '3. Dimension Conflict (M10 vs M12)',
      badge: 'CONFLICT',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
      category: 'Fasteners',
      a: 'SS HEX BOLT M10 X 50',
      b: 'SS HEX BOLT M12 X 50',
      uomA: 'NOS',
      uomB: 'NOS'
    },
    {
      label: '4. Metallurgy Conflict (MS vs SS)',
      badge: 'CONFLICT',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
      category: 'Fasteners',
      a: 'MS BOLT M10 X 50',
      b: 'SS BOLT M10 X 50',
      uomA: 'NOS',
      uomB: 'NOS'
    },
    {
      label: '5. Incompatible Product (Bearing vs Housing)',
      badge: 'DO NOT MATCH',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      category: 'Bearings',
      a: 'BALL BEARING 6205',
      b: 'BEARING HOUSING 6205',
      uomA: 'NOS',
      uomB: 'NOS'
    },
    {
      label: '6. Bearings (6205 2RS SKF)',
      badge: 'MATCH',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      category: 'Bearings',
      a: 'BEARING BALL 6205',
      b: 'BALL BEARING 6205 2RS SKF',
      uomA: 'NOS',
      uomB: 'NOS'
    },
    {
      label: '7. Gate Valve Class 150',
      badge: 'MATCH',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      category: 'Valves',
      a: 'GATE VLV 2" CL150 WCB',
      b: '2 INCH CLASS 150 CAST STEEL GATE VALVE',
      uomA: 'NOS',
      uomB: 'NUMBERS'
    },
    {
      label: '8. Induction Motor 15HP',
      badge: 'MATCH',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      category: 'Electric Motors',
      a: 'IND MTR 15HP 415V 1440RPM',
      b: '15 HP 415 VOLT SQUIRREL CAGE INDUCTION MOTOR',
      uomA: 'NOS',
      uomB: 'NOS'
    }
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setDescA(p.a);
    setDescB(p.b);
    setCategory(p.category);
    setUomA(p.uomA);
    setUomB(p.uomB);
    setResult(null);
    setError(null);
  };

  const handleCompare = async () => {
    if (!descA.trim() || !descB.trim()) {
      setError('Please provide descriptions for both materials.');
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingStep(1);

    // Multi-step loading progression for transparent SIH evaluation
    setTimeout(() => setLoadingStep(2), 200);
    setTimeout(() => setLoadingStep(3), 400);

    try {
      const data = await api.compareMaterials({
        description_a: descA,
        description_b: descB,
        category,
        uom_a: uomA,
        uom_b: uomB
      });
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 550);
    } catch (err: any) {
      setError(err.message || 'Comparison failed');
      setLoading(false);
    }
  };

  // Run initial comparison on mount for instant visual delight
  useEffect(() => {
    handleCompare();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>MATCH — EQUIVALENT</span>
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>REVIEW RECOMMENDED</span>
          </span>
        );
      case 'TECHNICAL CONFLICT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
            <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>CRITICAL TECHNICAL CONFLICT</span>
          </span>
        );
      case 'DO NOT MATCH':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <XCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>DO NOT MATCH — DISTINCT</span>
          </span>
        );
    }
  };

  const renderAttributeStatus = (status: AttributeComparisonItem['status'], isCritical: boolean) => {
    switch (status) {
      case 'MATCH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Match
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Conflict {isCritical && <span className="text-[10px] text-rose-600 dark:text-rose-400 underline decoration-rose-400">Critical</span>}
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Review
          </span>
        );
      case 'NOT_SPECIFIED':
      default:
        return (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Not Specified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Material Intelligence &amp; Technical Matching Engine
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
            Stage 2 Active
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deterministic technical specification matching with dimension normalization, metallurgy exclusivity, product type validation, and multi-factor weighted scoring.
        </p>
      </div>

      {/* Preset Chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            1-Click SIH Benchmark Presets (Section 17):
          </label>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Select any test case to evaluate AI intelligence</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {presets.map((p) => {
            const isSelected = descA === p.a && descB === p.b;
            return (
              <button
                key={p.label}
                onClick={() => handleApplyPreset(p)}
                className={`p-2.5 text-left rounded-lg border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-600 ring-1 ring-blue-600 dark:bg-blue-950/40 dark:border-blue-500 dark:ring-blue-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/60 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 line-clamp-1">{p.label}</div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400">{p.category}</span>
                  <span className={`px-1.5 py-0.5 rounded border font-semibold ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Material A */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              CPSE-A Procurement Description
            </span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Source Entity (e.g. ONGC / SAIL)</span>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Raw Procurement Description:
            </label>
            <textarea
              rows={3}
              value={descA}
              onChange={(e) => setDescA(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-blue-500"
              placeholder="e.g. HEX BOLT M10 X 50 SS"
            />
          </div>

          {result?.normalized_a && (
            <div className="bg-blue-50/50 p-2 rounded border border-blue-100 text-[11px] dark:bg-blue-950/30 dark:border-blue-900/50">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Normalized Canonical Form:</span>
              <span className="font-mono text-blue-900 dark:text-blue-300 font-medium">{result.normalized_a}</span>
            </div>
          )}

          <div className="flex gap-2 text-xs">
            <div className="flex-1">
              <label className="text-[11px] text-slate-400 dark:text-slate-500 block mb-1">UOM</label>
              <input
                type="text"
                value={uomA}
                onChange={(e) => setUomA(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-slate-400 dark:text-slate-500 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
              >
                <option value="Fasteners">Fasteners</option>
                <option value="Bearings">Bearings</option>
                <option value="Valves">Valves</option>
                <option value="Electrical Components">Electrical Components</option>
                <option value="Cables & Wires">Cables &amp; Wires</option>
                <option value="Electric Motors">Electric Motors</option>
                <option value="Pumps & Spares">Pumps &amp; Spares</option>
                <option value="Pipes & Fittings">Pipes &amp; Fittings</option>
                <option value="Gaskets & Seals">Gaskets &amp; Seals</option>
                <option value="General Mechanical">General Mechanical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Material B */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              CPSE-B Procurement Description
            </span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Target Entity (e.g. BHEL / NTPC)</span>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Raw Procurement Description:
            </label>
            <textarea
              rows={3}
              value={descB}
              onChange={(e) => setDescB(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-blue-500"
              placeholder="e.g. SS HEXAGONAL BOLT 10MM X 50MM"
            />
          </div>

          {result?.normalized_b && (
            <div className="bg-indigo-50/50 p-2 rounded border border-indigo-100 text-[11px] dark:bg-indigo-950/30 dark:border-indigo-900/50">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Normalized Canonical Form:</span>
              <span className="font-mono text-indigo-900 dark:text-indigo-300 font-medium">{result.normalized_b}</span>
            </div>
          )}

          <div className="flex gap-2 text-xs">
            <div className="flex-1">
              <label className="text-[11px] text-slate-400 dark:text-slate-500 block mb-1">UOM</label>
              <input
                type="text"
                value={uomB}
                onChange={(e) => setUomB(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-slate-400 dark:text-slate-500 block mb-1">Target Evaluation</label>
              <div className="text-xs text-slate-600 p-1.5 bg-slate-100 rounded dark:bg-slate-800 dark:text-slate-300">
                Cross-CPSE Harmonization
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Action Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={handleCompare}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md transition shadow-md disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                {loadingStep === 1
                  ? 'Canonicalizing syntactic expressions & units...'
                  : loadingStep === 2
                  ? 'Extracting category-aware technical attributes...'
                  : 'Evaluating conflict rules & multi-factor weights...'}
              </span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4" />
              <span>Execute Intelligent Comparison</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Section 7, 8, 9: AI Decision Card with Explainable Evidence & Why Not a Match */}
          <AiDecisionCard
            status={result.match_status}
            confidenceScore={result.confidence_score}
            standardCode={result.suggested_standard_code}
            standardName={result.suggested_standard_name}
            breakdown={result.breakdown}
            criticalConflicts={result.critical_conflicts}
            attributeComparisons={result.attribute_comparisons}
            explanation={result.breakdown?.explanation || result.verdict}
            materialAName="Material A"
            materialBName="Material B"
          />

          <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-6">
          {/* Top Verdict Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Matching Evaluation
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {getStatusBadge(result.match_status)}
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {result.verdict}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 text-right">
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 block uppercase font-medium">Confidence Score</span>
                <span
                  className={`text-2xl font-black ${
                    result.confidence_score >= 90
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : result.confidence_score >= 70
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {result.confidence_score}%
                </span>
              </div>

              <div className="pl-4 border-l border-slate-200 dark:border-slate-800 text-left">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Harmonized Standard Identity
                </span>
                <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                  {result.suggested_standard_code}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {result.suggested_standard_name}
                </span>
              </div>
            </div>
          </div>

          {/* CRITICAL CONFLICT WARNING BANNER */}
          {(result.has_critical_conflict || result.match_status === 'TECHNICAL CONFLICT' || result.match_status === 'DO NOT MATCH') && (
            <div className={`p-4 rounded-lg border ${
              result.match_status === 'TECHNICAL CONFLICT'
                ? 'bg-rose-50/80 border-rose-300 text-rose-950 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200'
                : 'bg-slate-50 border-slate-300 text-slate-900 dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <AlertOctagon className={`w-5 h-5 shrink-0 mt-0.5 ${
                  result.match_status === 'TECHNICAL CONFLICT' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                }`} />
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-sm">
                    {result.match_status === 'TECHNICAL CONFLICT'
                      ? 'Critical Engineering Conflict Detected — False Harmonization Prevented'
                      : 'Distinct Material Classification — Do Not Harmonize'}
                  </div>
                  <p className="leading-relaxed opacity-90">
                    High text similarity or shared category cannot override conflicting physical specifications.
                    The AI matching engine has enforced hard rejection rules to safeguard enterprise inventory integrity.
                  </p>
                  {result.critical_conflicts && result.critical_conflicts.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-900/60 space-y-1">
                      {result.critical_conflicts.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="font-bold text-rose-800 dark:text-rose-300">• {c.attribute}:</span>
                          <span>Record A: <strong className="text-slate-900 dark:text-white">{c.value_a}</strong> vs Record B: <strong className="text-slate-900 dark:text-white">{c.value_b}</strong></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Structured Parameter-by-Parameter Attribute Comparison Table (✓/⚠/✕) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Technical Attribute Comparison Matrix
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Match</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Review</span>
                <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-rose-500 dark:text-rose-400" /> Conflict</span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 dark:bg-slate-950/60 dark:text-slate-400 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                    <th className="p-2.5 w-1/4">Technical Attribute</th>
                    <th className="p-2.5 w-1/4 text-blue-900 bg-blue-50/40 dark:text-blue-300 dark:bg-blue-950/30">Record A (CPSE-A)</th>
                    <th className="p-2.5 w-1/4 text-indigo-900 bg-indigo-50/40 dark:text-indigo-300 dark:bg-indigo-950/30">Record B (CPSE-B)</th>
                    <th className="p-2.5 w-1/4">Parity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.attribute_comparisons && result.attribute_comparisons.length > 0 ? (
                    result.attribute_comparisons.map((item, idx) => (
                      <tr key={idx} className={item.status === 'CONFLICT' ? 'bg-rose-50/30 dark:bg-rose-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}>
                        <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          {item.attribute}
                          {item.is_critical && (
                            <span className="text-[9px] font-semibold uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                              Critical
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          {item.value_a}
                        </td>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          {item.value_b}
                        </td>
                        <td className="p-2.5">
                          {renderAttributeStatus(item.status, item.is_critical)}
                          {item.notes && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{item.notes}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 dark:text-slate-500">
                        No technical attributes extracted for comparison.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Explainable Multi-Factor Scoring Breakdown (6 Configurable Weights) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                6-Factor Weighted Equivalence Model
              </h3>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Section 7 &amp; 16 Architecture</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs mb-4">
              {/* Factor 1: Technical Attributes (35%) */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Tech Parity</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">35%</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {result.breakdown.tech_attr_sim ?? result.breakdown.dimension_sim}%
                </span>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${result.breakdown.tech_attr_sim ?? result.breakdown.dimension_sim}%` }}
                  ></div>
                </div>
              </div>

              {/* Factor 2: Description Similarity (25%) */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Description</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">25%</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {result.breakdown.description_sim}%
                </span>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${result.breakdown.description_sim}%` }}
                  ></div>
                </div>
              </div>

              {/* Factor 3: Semantic TF-IDF (20%) */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Semantic</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">20%</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {result.breakdown.semantic_sim ?? result.breakdown.material_sim}%
                </span>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${result.breakdown.semantic_sim ?? result.breakdown.material_sim}%` }}
                  ></div>
                </div>
              </div>

              {/* Factor 4: Category Compatibility (10%) */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Category</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">10%</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {result.breakdown.category_sim}%
                </span>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-purple-600"
                    style={{ width: `${result.breakdown.category_sim}%` }}
                  ></div>
                </div>
              </div>

              {/* Factor 5: UOM Compatibility (5%) */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">UOM Parity</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">5%</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {result.breakdown.uom_compatibility}%
                </span>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-teal-600"
                    style={{ width: `${result.breakdown.uom_compatibility}%` }}
                  ></div>
                </div>
              </div>

              {/* Factor 6: Manufacturer / Part (5%) */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="font-semibold">Mfg / Part</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">5%</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {result.breakdown.mfg_part_sim ?? 85.0}%
                </span>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-cyan-600"
                    style={{ width: `${result.breakdown.mfg_part_sim ?? 85.0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Explainable AI Rationale & Final Recommendation */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  AI Engineering Rationale &amp; Harmonization Recommendation:
                </span>
                {result.recommendation && (
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    result.recommendation === 'HARMONIZE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                      : result.recommendation === 'REVIEW RECOMMENDED'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                  }`}>
                    {result.recommendation}
                  </span>
                )}
              </div>
              <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line font-mono text-[11px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                {result.breakdown.explanation}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
