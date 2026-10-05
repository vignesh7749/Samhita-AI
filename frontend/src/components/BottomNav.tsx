import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  GitMerge,
  Clock,
  Sparkles,
  MoreHorizontal,
  Copy,
  UploadCloud,
  Building2,
  BarChart3,
  FileText,
  ShieldCheck,
  ChevronUp
} from 'lucide-react';
import { User } from '../types';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingReviewCount?: number;
  currentUser: User;
}

interface PrimaryNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  highlight?: boolean;
}

interface SecondaryNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  highlight?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount = 0,
  currentUser
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close "More" popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const primaryItems: PrimaryNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Materials', icon: Layers },
    { id: 'harmonization', label: 'Harmonization', icon: GitMerge },
    {
      id: 'review',
      label: 'Review',
      icon: Clock,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined
    },
    { id: 'try-ai', label: 'AI Match', icon: Sparkles, highlight: true }
  ];

  const secondaryItems: SecondaryNavItem[] = [
    {
      id: 'duplicates',
      label: 'Duplicate Detection',
      icon: Copy,
      desc: 'Cross-CPSE redundant record pairs & safe merging'
    },
    {
      id: 'import',
      label: 'Import Data',
      icon: UploadCloud,
      desc: 'Batch ingest CSV/XLSX catalogs & quality check'
    },
    {
      id: 'cpse',
      label: 'CPSE Directory',
      icon: Building2,
      desc: '5 Participating Central Public Sector Enterprises'
    },
    {
      id: 'analytics',
      label: 'Analytics & Reporting',
      icon: BarChart3,
      desc: 'Standardization impact, metrics & report downloads'
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: FileText,
      desc: 'Immutable governance & decision lifecycle log'
    }
  ];

  const isMoreActive = secondaryItems.some((item) => item.id === activeTab);
  const activeSecondaryItem = secondaryItems.find((item) => item.id === activeTab);

  const handleSelectMoreItem = (id: string) => {
    onSelectTab(id);
    setMoreOpen(false);
  };

  return (
    <nav
      aria-label="Enterprise Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1 sm:gap-2">
        {/* Primary Navigation Items */}
        <div className="flex-1 flex items-center justify-around sm:justify-start sm:gap-1.5 md:gap-3">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMoreOpen(false);
                }}
                className={`relative group flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-blue-700 bg-blue-50/80 font-bold shadow-2xs'
                    : item.highlight
                    ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-blue-600 rounded-full animate-in fade-in" />
                )}

                <div className="relative">
                  <Icon
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-105 ${
                      isActive
                        ? 'text-blue-700'
                        : item.highlight
                        ? 'text-blue-600'
                        : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[11px] sm:text-xs tracking-tight truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* "More" Trigger & Menu */}
        <div className="relative shrink-0" ref={moreRef}>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs transition-all duration-150 ${
              isMoreActive
                ? 'text-blue-700 bg-blue-50 font-bold shadow-2xs'
                : moreOpen
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
            }`}
          >
            {isMoreActive && (
              <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-blue-600 rounded-full" />
            )}

            <MoreHorizontal
              className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                isMoreActive ? 'text-blue-700' : 'text-slate-500'
              }`}
            />
            <span className="text-[11px] sm:text-xs tracking-tight flex items-center gap-1">
              <span>{isMoreActive && activeSecondaryItem ? activeSecondaryItem.label : 'More'}</span>
              <ChevronUp
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 hidden sm:inline ${
                  moreOpen ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>

          {/* Popover Menu Anchored Above "More" Button */}
          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2.5 w-72 sm:w-80 bg-white border border-slate-200/90 rounded-xl shadow-2xl p-2.5 z-50 text-xs animate-in slide-in-from-bottom-2 fade-in duration-150">
              <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Additional Enterprise Tools
                </span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                  SAMHITA AI
                </span>
              </div>

              <div className="space-y-1 mt-1.5">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectMoreItem(item.id)}
                      className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition ${
                        isActive
                          ? 'bg-blue-50/90 text-blue-900 border border-blue-200/60'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <div
                          className={`font-semibold text-xs leading-tight ${
                            isActive ? 'text-blue-900' : 'text-slate-900'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate leading-tight">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* User Profile Mini Footer */}
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-2 text-[11px] text-slate-500 bg-slate-50/60 rounded-md p-1.5">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {currentUser.full_name ? currentUser.full_name[0] : 'U'}
                  </div>
                  <span className="truncate font-medium text-slate-800">
                    {currentUser.full_name}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
