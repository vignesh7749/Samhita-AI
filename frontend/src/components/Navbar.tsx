import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Bot,
  Play,
  Bell,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  Sun,
  Moon
} from 'lucide-react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentUser: User;
  onRoleChange: (role: 'admin' | 'reviewer' | 'viewer') => void;
  onNavigate: (tab: string) => void;
  onSearchSubmit: (query: string) => void;
  onOpenAssistant: () => void;
  onToggleJudgeTour: () => void;
  isJudgeTourActive?: boolean;
  onOpenDemoScenarios?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  onNavigate,
  onSearchSubmit,
  onOpenAssistant,
  onToggleJudgeTour,
  isJudgeTourActive = false,
  onOpenDemoScenarios
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchValue);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* LEFT: Logo & Subtitle (Section 3) */}
        <div
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0 select-none group"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-700 dark:bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs tracking-wider group-hover:bg-blue-800 dark:group-hover:bg-blue-500 transition">
            सं
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-xs sm:text-sm">
                SAMHITA AI
              </span>
              <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 px-1.5 py-0.2 rounded hidden sm:inline">
                CPSE Platform
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none hidden md:block">
              Material Standardization &amp; Harmonization
            </p>
          </div>
        </div>

        {/* MIDDLE: Compact Global Search (with AI Search Trigger) */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search or ask in natural language (e.g. 10mm SS bolt)..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-16 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
            />
            <button
              onClick={onOpenAssistant}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold px-2 py-0.5 rounded transition flex items-center gap-0.5"
              title="Open AI Natural Language Search & Assistant"
            >
              <Sparkles className="w-2.5 h-2.5 text-blue-700 dark:text-blue-300" />
              <span>AI Search</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Actions, Role & Notifications (Section 3) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Ask AI Assistant */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition shadow-2xs cursor-pointer"
            title="Ask AI Assistant about live database statistics"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">Ask AI</span>
          </button>

          {/* SIH Demo Scenario Mode (Section 14) */}
          {onOpenDemoScenarios && (
            <button
              onClick={onOpenDemoScenarios}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 transition shadow-2xs cursor-pointer"
              title="Open SIH Judge Demo Prepared Scenarios (1 to 5)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
              <span className="hidden sm:inline">SIH Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>
          )}

          {/* SIH Judge Demo Tour Shortcut */}
          <button
            onClick={onToggleJudgeTour}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer ${
              isJudgeTourActive
                ? 'bg-blue-700 dark:bg-blue-600 text-white border border-blue-800 dark:border-blue-500'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle SIH Judge Demo Guided Presentation Tour"
          >
            <Play className={`w-3 h-3 ${isJudgeTourActive ? 'fill-current text-white' : 'text-blue-700 dark:text-blue-400'}`} />
            <span className="hidden sm:inline">Tour</span>
          </button>

          {/* Quick Theme Switch Shortcut */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900 transition" />
            )}
          </button>

          {/* Notification Indicator */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition relative cursor-pointer"
              title="Governance Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-50 text-xs animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-slate-100">System Notifications</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.5 rounded font-semibold border border-blue-200/50 dark:border-blue-800/50">Live Audit</span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Cross-CPSE Sync Complete</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">40 Standard Materials updated across ONGC, BHEL, NTPC, SAIL, IOCL.</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">RBAC Security Active</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Current role enforced as {currentUser.role.toUpperCase()}.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-blue-700 dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.full_name ? currentUser.full_name[0] : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-slate-800 dark:text-slate-200 capitalize leading-tight">
                  {currentUser.role}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">RBAC</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in slide-in-from-top-2 duration-150 text-slate-900 dark:text-slate-100">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider block">
                    Active RBAC Session
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 truncate">
                    {currentUser.full_name}
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  {(['admin', 'reviewer', 'viewer'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleChange(r);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition cursor-pointer ${
                        currentUser.role === r
                          ? 'font-bold text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/70 border border-blue-200/50 dark:border-blue-800/50'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <span className="capitalize block">{r}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                          {r === 'admin'
                            ? 'Full Access & Ingestion'
                            : r === 'reviewer'
                            ? 'Approval & Merge'
                            : 'Read-Only Viewer'}
                        </span>
                      </div>
                      {currentUser.role === r && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
