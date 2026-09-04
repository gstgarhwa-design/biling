import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AccessDeniedViewProps {
  moduleName: string;
  requiredPermission?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({ moduleName, requiredPermission }) => {
  const { currentUser, activeCompany, setActiveModule } = useApp();

  const handleReturn = () => {
    if (currentUser?.role === 'SUPER_ADMIN') {
      setActiveModule('SUPER_ADMIN');
    } else if (currentUser?.role === 'PARTNER_ADMIN') {
      setActiveModule('PARTNER_ADMIN');
    } else if (currentUser?.role === 'STAFF') {
      setActiveModule('STAFF_DASHBOARD');
    } else {
      setActiveModule('DASHBOARD');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-red-200/80 dark:border-red-900/60 shadow-xl p-8 text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-5 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-xs uppercase tracking-wider">
          Access Denied • Unauthorized Module
        </span>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2">
          Permission Restricted: {moduleName}
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Your account role (<span className="font-semibold text-slate-900 dark:text-slate-200">{currentUser?.role}</span>) does not have authorized permission to access this module in database policies.
          {requiredPermission && (
            <span className="block mt-1 text-xs text-slate-500">
              Required Permission: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">{requiredPermission}</code>
            </span>
          )}
        </p>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left text-xs space-y-1.5 mb-6">
          <div className="flex items-center justify-between text-slate-500">
            <span>Current User:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser?.name} ({currentUser?.mobile})</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Company Tenant:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{activeCompany?.name || 'Unassigned'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Security Enforcement:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Database Role Guard Active</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleReturn}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
