import React from 'react';
import {
  LayoutDashboard,
  Layers,
  GitMerge,
  Clock,
  Sparkles,
  UploadCloud,
  Building2,
  BarChart3,
  FileText,
  Copy,
  ShieldCheck
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingReviewCount?: number;
  currentUser: User;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount = 0,
  currentUser
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Material Master', icon: Layers },
    { id: 'harmonization', label: 'Harmonization', icon: GitMerge },
    {
      id: 'review',
      label: 'Review Queue',
      icon: Clock,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined
    },
    { id: 'duplicates', label: 'Duplicate Detection', icon: Copy },
    { id: 'try-ai', label: 'Try AI Matching', icon: Sparkles, highlight: true },
    { id: 'import', label: 'Import Data', icon: UploadCloud },
    { id: 'cpse', label: 'CPSE Directory', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none min-h-[calc(100vh-4rem)]">
      {/* Navigation links */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              } ${item.highlight && !isActive ? 'text-blue-600 bg-blue-50/40 hover:bg-blue-50' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-blue-700' : item.highlight ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile card */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {currentUser.full_name ? currentUser.full_name[0] : 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-slate-800 truncate">
              {currentUser.full_name}
            </div>
            <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>{currentUser.role} Role</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
