import React, { useState, useEffect } from 'react';
import {
  Building2,
  Flame,
  Zap,
  Factory,
  Layers,
  Fuel,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { CPSE } from '../types';

interface CpseDirectoryPageProps {
  onNavigateToMaterials: (cpseCode: string) => void;
}

export const CpseDirectoryPage: React.FC<CpseDirectoryPageProps> = ({ onNavigateToMaterials }) => {
  const [cpses, setCpses] = useState<CPSE[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCpses = async () => {
      try {
        const data = await api.getCpses();
        setCpses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCpses();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-amber-600" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-blue-600" />;
      case 'Factory':
        return <Factory className="w-5 h-5 text-indigo-600" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-slate-700" />;
      case 'Fuel':
        return <Fuel className="w-5 h-5 text-rose-600" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Participating CPSE Enterprises
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Harmonization status across Central Public Sector Enterprises participating in the SAMHITA consortium.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">Loading enterprise telemetry...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cpses.map((c) => {
            const stdRate =
              c.material_count > 0
                ? Math.round((c.standardized_count / c.material_count) * 100)
                : 0;

            return (
              <div
                key={c.code}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                        {getIcon(c.logo_icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.code}</span>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            &bull; {c.sector}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                          {c.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
                    HQ / Cluster: <span className="text-slate-600 dark:text-slate-300 font-medium">{c.location || 'India'}</span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Total Materials</span>
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {c.material_count.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-2.5 rounded border border-emerald-100 dark:border-emerald-900/50">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">Standardized</span>
                      <span className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                        {c.standardized_count.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-blue-50/50 dark:bg-blue-950/40 p-2.5 rounded border border-blue-100 dark:border-blue-900/50">
                      <span className="text-[11px] text-blue-700 dark:text-blue-400 block">Pending Review</span>
                      <span className="text-base font-bold text-blue-800 dark:text-blue-300">
                        {c.pending_count.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-amber-50/50 dark:bg-amber-950/40 p-2.5 rounded border border-amber-100 dark:border-amber-900/50">
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 block">Duplicate Rate</span>
                      <span className="text-base font-bold text-amber-800 dark:text-amber-300">
                        {c.duplicate_rate}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3.5">
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Standardization Coverage</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{stdRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${stdRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => onNavigateToMaterials(c.code)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                  >
                    <span>View {c.code} Catalog</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
