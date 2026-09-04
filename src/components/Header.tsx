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

          {/* Compact Company Switcher */}
          <div className="relative z-50">
            {canSwitchCompanies ? (
              <div>
                <button
                  onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-2xs transition-all text-left group"
                  title="Click to switch active company workspace"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px]">
                      {activeCompany?.name || 'Select Company'}
                    </span>
                    {activeCompany?.stateCode && (
                      <span className="hidden sm:inline-block text-[10px] font-mono px-1 py-0.2 rounded bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-600/60">
                        {activeCompany.stateCode}
                      </span>
                    )}
                    {availableCompanies.length > 1 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        {availableCompanies.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform duration-200 shrink-0 ${showCompanyMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Company Dropdown */}
                {showCompanyMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setShowCompanyMenu(false)} 
                    />
                    <div className="absolute left-0 mt-1.5 w-76 sm:w-84 max-h-[75vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-[100] animate-in fade-in zoom-in-95">
                      <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>{currentUser.role === 'SUPER_ADMIN' ? 'All Companies (Super Admin)' : 'Assigned Companies'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                          {availableCompanies.length} Workspaces
                        </span>
                      </div>
                      <div className="py-1 max-h-72 overflow-y-auto">
                        {availableCompanies.map(comp => {
                          const isSelected = comp.id === activeCompany?.id;
                          return (
                            <button
                              key={comp.id}
                              onClick={() => {
                                switchCompany(comp.id);
                                setShowCompanyMenu(false);
                              }}
                              className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-indigo-50/70 dark:hover:bg-slate-800/70 transition-colors ${
                                isSelected ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <div className="truncate pr-2 min-w-0">
                                <div className="truncate font-semibold flex items-center gap-1.5">
                                  <span>{comp.name}</span>
                                  {isSelected && (
                                    <span className="text-[9px] px-1 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  GSTIN: {comp.gstin} • {comp.city}, {comp.state}
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
                    {activeCompany?.name}
                  </span>
                  {activeCompany?.stateCode && (
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-600/60">
                      {activeCompany.stateCode}
                    </span>
                  )}
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
