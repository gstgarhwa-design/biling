import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  LogOut, 
  Menu, 
  ChevronDown, 
  Check
} from 'lucide-react';
import { DateSelectionControl } from './DateSelectionControl';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeModule: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeModule }) => {
  const { 
    currentUser, 
    activeCompany, 
    companies, 
    switchCompany, 
    logout,
    getAuthorizedCompaniesForUser
  } = useApp();

  const [showCompanyMenu, setShowCompanyMenu] = useState(false);

  if (!currentUser) return null;

  const userAuthorizedCompanies = getAuthorizedCompaniesForUser(currentUser);
  const availableCompanies = currentUser.role === 'SUPER_ADMIN' ? companies : userAuthorizedCompanies;
  const canSwitchCompanies = currentUser.role === 'SUPER_ADMIN' || userAuthorizedCompanies.length > 1;

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Mobile hamburger & Active Company Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
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
                  className="flex items-center gap-2 p-1.5 px-3.5 rounded-full sm:rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 shadow-2xs transition-all text-left group"
                >
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform" />
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

                {/* Company Dropdown */}
                {showCompanyMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setShowCompanyMenu(false)} 
                    />
                    <div className="absolute left-0 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-[100] animate-in fade-in zoom-in-95">
                      <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>{currentUser.role === 'SUPER_ADMIN' ? 'Select Company (Super Admin)' : 'Switch Company'}</span>
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
                            className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors ${
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
              <div className="flex items-center gap-2 p-1.5 px-3.5 rounded-full sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
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

        {/* Right: Date Selection & Logged In User Profile */}
        <div className="flex items-center gap-3">
          {/* Unified Date Selection Control (Financial Year, Month, Custom Date) */}
          <DateSelectionControl />

          {/* Logged in User Profile (Strictly showing only the authenticated user) */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm border border-indigo-500/20">
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
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
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
