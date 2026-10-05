import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  GitMerge,
  Copy,
  ClipboardCheck,
  Ellipsis,
  Sparkles,
  UploadCloud,
  Building2,
  FileText,
  ChartNoAxesCombined,
  Sun,
  Moon
} from 'lucide-react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';

interface FloatingPillNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingReviewCount?: number;
  currentUser: User;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  hideOnMobile?: boolean;
}

export const FloatingPillNav: React.FC<FloatingPillNavProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount = 0,
  currentUser
}) => {
  const { theme, setTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close More menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
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
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Primary navigation items (Expandable in place on hover)
  const primaryItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Materials', icon: Database },
    { id: 'harmonization', label: 'Harmonize', icon: GitMerge },
    { id: 'duplicates', label: 'Duplicates', icon: Copy, hideOnMobile: true },
    {
      id: 'review',
      label: 'Review',
      icon: ClipboardCheck,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined
    }
  ];

  // Secondary items in More menu (Opens ABOVE the dock)
  const secondaryItems = [
    {
      id: 'analytics',
      label: 'Analytics & Reporting',
      icon: ChartNoAxesCombined,
      desc: 'Standardization impact & report exports'
    },
    {
      id: 'import',
      label: 'Import Data',
      icon: UploadCloud,
      desc: 'CSV / XLSX batch catalog ingestion'
    },
    {
      id: 'cpse',
      label: 'CPSE Directory',
      icon: Building2,
      desc: '5 Central Public Sector Enterprises'
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: FileText,
      desc: 'Immutable governance & decision lifecycle'
    },
    {
      id: 'try-ai',
      label: 'Try AI Matching',
      icon: Sparkles,
      desc: 'Interactive dual-material conflict simulation',
      highlight: true
    },
    {
      id: 'duplicates',
      label: 'Duplicates Detection',
      icon: Copy,
      desc: 'Redundant cross-CPSE items and merging',
      mobileOnly: true
    }
  ];

  // Determine if active tab belongs to the secondary / More group
  const isMoreActive =
    activeTab === 'analytics' ||
    activeTab === 'import' ||
    activeTab === 'cpse' ||
    activeTab === 'audit' ||
    activeTab === 'try-ai';

  const handleItemClick = (id: string) => {
    // Check if device is a touch-only device
    const isTouchOnly =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (isTouchOnly && hoveredId !== id && activeTab !== id) {
      // First tap expands the item to reveal the label on mobile
      setHoveredId(id);
      return;
    }

    // Normal desktop click or second tap on mobile performs navigation
    onSelectTab(id);
    setHoveredId(null);
    setMoreOpen(false);
  };

  const handleToggleMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMoreOpen((prev) => !prev);
    setHoveredId(null);
  };

  const handleSelectSecondary = (id: string) => {
    onSelectTab(id);
    setMoreOpen(false);
    setHoveredId(null);
  };

  return (
    <nav
      aria-label="Floating Bottom Dock Navigation"
      className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none"
      style={{ bottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
    >
      {/* Outer Floating Pill Dock Container */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full border border-slate-200/90 dark:border-slate-800/90 shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)] p-1.5 flex items-center gap-1 sm:gap-1.5 transition-all duration-200">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHovered = hoveredId === item.id;
          // Item expands horizontally if it is the active page OR hovered
          const isExpanded = isActive || isHovered;

          return (
            <div
              key={item.id}
              className={`relative ${item.hideOnMobile ? 'hidden sm:block' : 'block'}`}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Expandable Navigation Pill Button (No floating tooltips) */}
              <button
                onClick={() => handleItemClick(item.id)}
                aria-label={item.label}
                title={item.label}
                className={`relative flex items-center rounded-full transition-all duration-200 ease-out cursor-pointer select-none overflow-hidden h-9 sm:h-10 px-2.5 sm:px-3 active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs ring-1 ring-slate-800 dark:ring-blue-500 font-semibold'
                    : isHovered
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
              >
                {/* Icon */}
                <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />

                {/* Horizontal Label Expansion (Smoothly reveals label beside icon) */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-out flex items-center ${
                    isExpanded
                      ? 'max-w-36 opacity-100 ml-1.5 sm:ml-2'
                      : 'max-w-0 opacity-0 ml-0'
                  }`}
                >
                  <span className="whitespace-nowrap text-xs tracking-tight">
                    {item.label}
                  </span>
                </div>

                {/* Badge for Pending Reviews */}
                {item.badge !== undefined && (
                  <span
                    className={`${
                      isExpanded
                        ? 'ml-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full'
                        : 'absolute -top-0.5 -right-0.5 text-[9px] font-bold min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center'
                    } ${
                      isActive ? 'bg-amber-400 text-slate-950 font-black' : 'bg-amber-500 text-white'
                    } shadow-xs shrink-0 transition-all duration-200`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* More Menu Trigger Button (⋮) */}
        <div
          className="relative"
          ref={moreRef}
          onMouseEnter={() => setHoveredId('more')}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* More Button: Expands horizontally on hover */}
          <button
            onClick={handleToggleMore}
            aria-label="More Navigation Items"
            aria-expanded={moreOpen}
            className={`relative flex items-center rounded-full transition-all duration-200 ease-out cursor-pointer select-none overflow-hidden h-9 sm:h-10 px-2.5 sm:px-3 active:scale-95 ${
              isMoreActive || moreOpen
                ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs ring-1 ring-slate-800 dark:ring-blue-500 font-semibold'
                : hoveredId === 'more'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
            }`}
          >
            <Ellipsis className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />

            {/* Horizontal expansion for More label */}
            <div
              className={`overflow-hidden transition-all duration-200 ease-out flex items-center ${
                hoveredId === 'more' || isMoreActive || moreOpen
                  ? 'max-w-20 opacity-100 ml-1.5 sm:ml-2'
                  : 'max-w-0 opacity-0 ml-0'
              }`}
            >
              <span className="whitespace-nowrap text-xs tracking-tight">
                More
              </span>
            </div>

            {/* Active Indicator Dot on More Button when collapsed */}
            {isMoreActive && hoveredId !== 'more' && !moreOpen && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </button>

          {/* More Menu Popover (Opens ABOVE dock) */}
          {moreOpen && (
            <div
              role="menu"
              aria-label="Secondary Modules Menu"
              className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-72 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800/90 p-2 text-xs space-y-1 animate-popover z-50 text-slate-900 dark:text-slate-100"
            >
              {/* Header */}
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Enterprise Modules</span>
                <span className="font-mono text-slate-400 dark:text-slate-500">{currentUser.role.toUpperCase()}</span>
              </div>

              {/* Items List */}
              <div className="space-y-0.5 pt-1">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSecondary(item.id);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors duration-150 cursor-pointer ${
                        item.mobileOnly ? 'sm:hidden' : ''
                      } ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold border border-blue-200/80 dark:border-blue-800/80 shadow-2xs'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : item.highlight
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold truncate text-xs">{item.label}</span>
                          {item.highlight && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shrink-0">
                              SIMULATOR
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Theme Switch Section (Section 6 Requirements) */}
              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span>Theme Appearance</span>
                  <span className="font-mono text-[9px] text-blue-600 dark:text-blue-400">
                    {theme.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('light');
                    }}
                    aria-label="Switch to light mode"
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span>Light Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme('dark');
                    }}
                    aria-label="Switch to dark mode"
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900 text-white shadow-xs border border-slate-700 ring-1 ring-slate-700'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Caret pointing down toward the More button */}
              <div className="absolute -bottom-1.5 right-4 sm:left-1/2 sm:-translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-r border-b border-slate-200 dark:border-slate-800 pointer-events-none" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default FloatingPillNav;
