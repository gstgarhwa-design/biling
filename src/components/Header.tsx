import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  LogOut, 
  Menu, 
  ChevronDown, 
  Check,
  Users
} from 'lucide-react';
import { DateSelectionControl } from './DateSelectionControl';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeModule: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { 
    currentUser, 
    activeCompany, 
    users,
    switchUser,
    getSwitchableUsersForCurrentUser,
    setIsLoginModalOpen,
    logout
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!currentUser) return null;

  const roleConfigs = [
    { key: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    { key: 'PARTNER_ADMIN', label: 'Partner Admin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    { key: 'ADMIN', label: 'Admin', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
    { key: 'STAFF', label: 'Staff', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Left: Mobile hamburger & Quick Switch Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Actions: Switch User */}
          <div className="flex items-center gap-1.5 text-xs shrink-0 relative">
            {/* Switch User Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-slate-200/80 dark:border-slate-700/80 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="Switch authorized user profile or login"
              >
                <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">Switch User</span>
                <span className="sm:hidden">User</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

                {/* Switch User Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setShowUserMenu(false)} 
                    />
                    <div className="absolute left-0 mt-1.5 w-80 sm:w-92 max-h-[80vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-[100] animate-in fade-in zoom-in-95">
                      {/* Active User Context Banner */}
                      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Logged-in User</div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="truncate pr-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate block">{currentUser.name}</span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Mob: {currentUser.mobile}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                            currentUser.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                            currentUser.role === 'PARTNER_ADMIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                            currentUser.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {currentUser.role.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* QUICK ROLE SWITCH CARDS: Super Admin, Partner, Admin, Staff */}
                      <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center justify-between">
                          <span>Quick Switch By Role</span>
                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                            ALL ACCESS
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {roleConfigs.map(r => {
                            const roleUser = users.find(u => u.role === r.key && u.active);
                            const isCurrentRole = currentUser.role === r.key;
                            return (
                              <button
                                key={r.key}
                                disabled={isCurrentRole || !roleUser}
                                onClick={() => {
                                  if (roleUser) {
                                    switchUser(roleUser.id);
                                    setShowUserMenu(false);
                                  }
                                }}
                                className={`px-2.5 py-2 rounded-xl text-left border transition-all ${
                                  isCurrentRole 
                                    ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-xs' 
                                    : 'hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] ' + r.color
                                } ${!roleUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold truncate">{r.label}</span>
                                  {isCurrentRole ? (
                                    <span className="text-[9px] font-extrabold uppercase px-1 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">Active</span>
                                  ) : (
                                    <span className="text-[10px] font-mono opacity-60">⇄</span>
                                  )}
                                </div>
                                <div className="text-[10px] opacity-75 truncate mt-0.5 font-medium">
                                  {roleUser ? roleUser.name : 'No user'}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ALL REGISTERED USERS LIST */}
                      <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>All System Profiles</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                          {users.filter(u => u.active).length} Accounts
                        </span>
                      </div>

                      <div className="py-1 max-h-56 overflow-y-auto divide-y divide-slate-100/60 dark:divide-slate-800/60">
                        {users.filter(u => u.active).map(u => {
                          const isCurrent = u.id === currentUser.id;
                          const roleConf = roleConfigs.find(r => r.key === u.role);
                          return (
                            <div
                              key={u.id}
                              className={`px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                                isCurrent ? 'bg-indigo-50/50 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div className="truncate pr-2 min-w-0">
                                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  <span className="truncate font-bold">{u.name}</span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border shrink-0 ${roleConf?.color || 'bg-slate-100 text-slate-700'}`}>
                                    {roleConf?.label || u.role}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Mob: {u.mobile}
                                </div>
                              </div>

                              {isCurrent ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 shrink-0">
                                  Active
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    switchUser(u.id);
                                    setShowUserMenu(false);
                                  }}
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all shrink-0 active:scale-95"
                                >
                                  Switch
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Login as Different User Option */}
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setIsLoginModalOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200/50 dark:border-indigo-800/50"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Login as Different Mobile (OTP)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CENTER: BOLD AND ATTRACTIVE ACTIVE COMPANY FULL NAME */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4 min-w-0 max-w-xl lg:max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 max-w-full">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 hidden sm:inline-block drop-shadow-2xs" />
              <h1 
                className="font-black text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-slate-900 dark:text-white tracking-tight uppercase truncate drop-shadow-2xs text-center" 
                title={activeCompany?.name}
              >
                {activeCompany?.name || 'No Company Selected'}
              </h1>
              {activeCompany?.stateCode && (
                <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0 shadow-2xs">
                  {activeCompany.stateCode}
                </span>
              )}
            </div>

            {/* Sub-line with ACTIVE COMPANY indicator, GSTIN & City/State */}
            {activeCompany && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate max-w-full">
                <span className="font-black uppercase tracking-wider text-[9px] sm:text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/80 shrink-0">
                  Active Company
                </span>
                {activeCompany.gstin && (
                  <span className="hidden md:inline font-mono">
                    GSTIN: <strong className="text-slate-800 dark:text-slate-200 font-bold">{activeCompany.gstin}</strong>
                  </span>
                )}
                {activeCompany.city && (
                  <span className="hidden lg:inline truncate text-slate-400 font-normal">
                    • {activeCompany.city}, {activeCompany.state}
                  </span>
                )}
              </div>
            )}
          </div>

        {/* Right: Custom Date Calendar & Logged In User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Custom Date Calendar Control (With FY and Month Selection) */}
          <DateSelectionControl compact={true} />

          {/* Logged in User Profile */}
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
              className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl bg-slate-100/70 hover:bg-red-50 dark:bg-slate-800/70 dark:hover:bg-red-950/40 border border-slate-200/80 hover:border-red-200 dark:border-slate-700/80 dark:hover:border-red-900/60 transition-all ml-1 cursor-pointer shadow-2xs"
              title="Logout from session"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
