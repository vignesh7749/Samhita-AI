import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Building2,
  Layers,
  ChevronRight
} from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'reviewer' | 'viewer') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@samhita.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'reviewer' | 'viewer'>('admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-700 text-white font-bold text-2xl shadow-sm mb-3">
          सं
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          SAMHITA AI
        </h2>
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 tracking-wider uppercase mt-0.5">
          AI-Powered Material Standardization &amp; Harmonization Platform
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Government of India &bull; Central Public Sector Enterprises (CPSE) Consortium
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-md border border-slate-200 dark:border-slate-800 rounded-xl sm:px-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900"
                  placeholder="name@cpse.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Demonstration Access Role
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['admin', 'reviewer', 'viewer'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`py-2 px-1 rounded-md border text-center font-medium capitalize transition ${
                      selectedRole === r
                        ? 'border-blue-700 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-200 font-bold shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none transition"
            >
              <span>Sign In to Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Login (Section 26 Requirement) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-center mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                SIH Hackathon Quick Access
              </span>
            </div>
            <button
              onClick={() => onLogin('admin')}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 text-xs font-bold transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>1-Click Demo Login (Admin CTO)</span>
            </button>
          </div>
        </div>

        {/* Enterprise Notice */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 space-y-1">
          <div>Protected by National Enterprise Identity &amp; Role-Based Access Control</div>
          <div>Participating CPSEs: ONGC &bull; BHEL &bull; NTPC &bull; SAIL &bull; IOCL</div>
        </div>
      </div>
    </div>
  );
};
