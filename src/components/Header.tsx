import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  ChevronDown, 
  Layers, 
  Sparkles,
  ArrowRightLeft,
  Bell,
  Check,
  Database
} from 'lucide-react';
import { FinancialYearSelect } from './FinancialYearSelect';
import { MonthSelect } from './MonthSelect';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeModule: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeModule }) => {
  const { 
    currentUser, 
    activeCompany, 
    companies, 
    users, 
    switchCompany, 
    quickLogin, 
    logout,
    selectedFinancialYear,
    setSelectedFinancialYear,
    selectedMonth,
    setSelectedMonth,
    setIsSupabaseModalOpen,
    supabaseConnected,
    getAuthorizedCompaniesForUser
  } = useApp();

  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!currentUser) return null;

  const userAuthorizedCompanies = getAuthorizedCompaniesForUser(currentUser);
  const canSwitchCompanies = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || userAuthorizedCompanies.length > 1;
  const availableCompanies = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' ? companies : userAuthorizedCompanies;

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left: Mobile hamburger & Active Company Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/60 backdrop-blur-md transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Company Details */}
          <div className="relative z-50">
            {canSwitchCompanies ? (
              <div>
                <button
                  onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                  className="flex items-center gap-2 p-1.5 px-3.5 rounded-full sm:rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all text-left group"
                >
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {activeCompany?.name || 'Select Company'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 transition-transform duration-200 ${showCompanyMenu ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      GSTIN: {activeCompany?.gstin} • State: {activeCompany?.stateCode}
                    </div>
                  </div>
                </button>

                {/* Company Dropdown (Always in front: z-[100]) */}
                {showCompanyMenu && (
                  <>
                    {/* Click outside to close backdrop */}
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setShowCompanyMenu(false)} 
                    />
                    <div className="absolute left-0 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-900/60 py-2 z-[100] animate-in fade-in zoom-in-95 scrollbar-thin">
                      <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>{currentUser.role === 'SUPER_ADMIN' ? 'Select Company (Super Admin)' : 'Switch Company (Admin)'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                          {availableCompanies.length} Entities
                        </span>
                      </div>
                      <div className="py-1">
                        {availableCompanies.map(comp => (
                          <button
                            key={comp.id}
                            onClick={() => {
                              switchCompany(comp.id);
                              setShowCompanyMenu(false);
                            }}
                            className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-indigo-50/80 dark:hover:bg-slate-800/80 transition-colors ${
                              comp.id === activeCompany?.id ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="font-semibold truncate">{comp.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{comp.gstin} • {comp.city}, {comp.state}</div>
                            </div>
                            {comp.id === activeCompany?.id && (
                              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Strictly locked to their single assigned company
              <div className="flex items-center gap-2 p-1.5 px-3.5 rounded-full sm:rounded-xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-2xs">
                <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                <div>
                  <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {activeCompany?.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    GSTIN: {activeCompany?.gstin} • State: {activeCompany?.stateCode}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: 50 FY Selector, Supabase Badge, Role Switcher & User Profile */}
        <div className="flex items-center gap-2">
          {/* 50 Financial Years Selector */}
          <FinancialYearSelect
            value={selectedFinancialYear}
            onChange={setSelectedFinancialYear}
            className="hidden sm:inline-block"
          />

          {/* 12 Fiscal Months Selector */}
          <MonthSelect
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="hidden md:inline-block"
          />

          {/* Supabase Database Status Badge */}
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300/70 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100/90 dark:hover:bg-emerald-900/50 shadow-2xs transition-all"
            title="Supabase Database Connected (pqzpcrwdduxclstqfdsz) - Click to manage"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden md:inline font-mono text-[11px]">pqzpcrwdduxclstqfdsz</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </button>

          {/* Quick Demo Role Switcher button */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md hover:bg-white/80 dark:hover:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-200 shadow-2xs transition-colors"
              title="Switch user role for preview testing"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline font-medium">Switch User</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 dark:border-white/10 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Role Profile
                </div>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      quickLogin(u.id);
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-white/60 dark:hover:bg-slate-800/60 ${
                      u.id === currentUser.id ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 font-semibold' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{u.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {u.mobile}
                      </div>
                    </div>
                    {u.id === currentUser.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200/60 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/25 border border-white/60">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  currentUser.role === 'SUPER_ADMIN' ? 'bg-purple-500' :
                  currentUser.role === 'ADMIN' ? 'bg-indigo-500' : 'bg-amber-500'
                }`} />
                {currentUser.role.replace('_', ' ')}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors ml-1"
              title="Logout from session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
