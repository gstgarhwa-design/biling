import React from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  ArrowUpRight, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  Briefcase, 
  Lock, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PartnerAdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    activeCompany, 
    companies, 
    switchCompany, 
    setActiveModule, 
    getAuthorizedCompaniesForUser,
    salesInvoices,
    purchaseInvoices,
    users
  } = useApp();

  const authorizedCompanies = getAuthorizedCompaniesForUser(currentUser);

  // Aggregate metrics across authorized partner companies
  const partnerCompanyIds = new Set(authorizedCompanies.map(c => c.id));
  const partnerSales = salesInvoices.filter(s => partnerCompanyIds.has(s.companyId));
  const partnerPurchases = purchaseInvoices.filter(p => partnerCompanyIds.has(p.companyId));
  const partnerStaff = users.filter(u => u.companyId && partnerCompanyIds.has(u.companyId) && u.role === 'STAFF');

  const totalSalesAmount = partnerSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalPurchasesAmount = partnerPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-3">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Partner Admin Portal • Multi-Company Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
              <span>Authorized Scope:</span>
              <strong className="text-purple-300">{authorizedCompanies.length} Partner Entities Assigned</strong>
              <span className="text-slate-500">•</span>
              <span>Currently Viewing: <strong className="text-white">{activeCompany?.name}</strong></span>
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-xs text-slate-300 backdrop-blur-sm">
            <span className="text-slate-400 block text-[11px]">Strict Partner Scope:</span>
            <span className="text-purple-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
              Isolated Multi-Tenant Security
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Across Partner Scope */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Assigned Entities</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {authorizedCompanies.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Authorized corporate entities</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Consolidated Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{totalSalesAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{partnerSales.length} total tax invoices</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Consolidated Purchases</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ₹{totalPurchasesAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{partnerPurchases.length} total inward bills</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Staff in Scope</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {partnerStaff.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across assigned entities</p>
        </div>
      </div>

      {/* Assigned Companies Switcher Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-500" />
          <span>Your Assigned Partner Companies (Scope Enforced)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authorizedCompanies.map((comp) => {
            const isActive = comp.id === activeCompany?.id;
            const compSalesCount = salesInvoices.filter(s => s.companyId === comp.id).length;
            const compStaffCount = users.filter(u => u.companyId === comp.id).length;

            return (
              <div 
                key={comp.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive 
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20 shadow-md' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    {comp.name.slice(0, 2).toUpperCase()}
                  </div>
                  {isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Scope
                    </span>
                  ) : (
                    <button
                      onClick={() => switchCompany(comp.id)}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 hover:text-purple-600 font-semibold text-xs transition-colors"
                    >
                      Switch To
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {comp.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-1">GSTIN: {comp.gstin}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <span className="block text-[11px] text-slate-400">Invoices</span>
                    <strong className="text-slate-700 dark:text-slate-300">{compSalesCount}</strong>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Staff Members</span>
                    <strong className="text-slate-700 dark:text-slate-300">{compStaffCount}</strong>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-3 pt-3 border-t border-purple-200/60 dark:border-purple-900/60 flex items-center justify-between">
                    <button
                      onClick={() => setActiveModule('DASHBOARD')}
                      className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <span>Open Operations</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveModule('STAFF_MGMT')}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Manage Staff
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Scope Notice */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-purple-500 shrink-0" />
        <div>
          <strong className="text-slate-900 dark:text-slate-200 font-semibold">Strict Scope Isolation Enforced: </strong>
          As a Partner Admin, you are granted access exclusively to your explicitly assigned companies ({authorizedCompanies.map(c => c.name).join(', ')}). Other companies on the platform are inaccessible per database multi-tenant isolation rules.
        </div>
      </div>
    </div>
  );
};
