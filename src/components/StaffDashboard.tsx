import React from 'react';
import { 
  Building2, 
  FileText, 
  ShoppingCart, 
  Wallet, 
  Boxes, 
  PieChart, 
  FileCheck2, 
  ShieldCheck, 
  ArrowUpRight, 
  Lock, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StaffDashboard: React.FC = () => {
  const { currentUser, activeCompany, hasPermission, setActiveModule, salesInvoices, purchaseInvoices, items } = useApp();

  const canSales = hasPermission('sales');
  const canPurchase = hasPermission('purchase');
  const canPayments = hasPermission('payments');
  const canInventory = hasPermission('inventory');
  const canGstReports = hasPermission('gstReports');
  const canAccounting = hasPermission('accounting');

  // Filter invoices for current company
  const compSales = salesInvoices.filter(s => s.companyId === activeCompany?.id);
  const compPurchases = purchaseInvoices.filter(p => p.companyId === activeCompany?.id);
  const compItems = items.filter(i => i.companyId === activeCompany?.id);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff Workspace • Role Scoped Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Assigned Entity: <strong className="text-white">{activeCompany?.name}</strong></span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-xs">GSTIN: {activeCompany?.gstin}</span>
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-xs text-slate-300 backdrop-blur-sm">
            <span className="text-slate-400 block text-[11px]">Security Authorization:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
              Database Permission Policies Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Available Authorized Workspace Modules */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span>Your Permitted Operational Modules</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs">
            Active
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sales Invoices Module */}
          <div className={`p-5 rounded-2xl border transition-all ${
            canSales 
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600' 
              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-70'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              {canSales ? (
                <button
                  onClick={() => setActiveModule('SALES')}
                  className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Sales &amp; Tax Invoices</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create and manage B2B/B2C GST tax invoices, credit notes, and print tax bills.
            </p>
            {canSales && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
                <span>Invoices on File:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{compSales.length} records</span>
              </div>
            )}
          </div>

          {/* Purchase Invoices Module */}
          <div className={`p-5 rounded-2xl border transition-all ${
            canPurchase 
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600' 
              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-70'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              {canPurchase ? (
                <button
                  onClick={() => setActiveModule('PURCHASE')}
                  className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Purchase &amp; Inward Bills</h3>
            <p className="text-xs text-slate-500 mt-1">
              Record supplier bills, inward deliveries, debit notes, and track purchase registers.
            </p>
            {canPurchase && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
                <span>Purchase Records:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{compPurchases.length} records</span>
              </div>
            )}
          </div>

          {/* Item & Inventory Master */}
          <div className={`p-5 rounded-2xl border transition-all ${
            canInventory 
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600' 
              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-70'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              {canInventory ? (
                <button
                  onClick={() => setActiveModule('ITEM_MASTER')}
                  className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Item Master &amp; Inventory</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check current stock levels, HSN/SAC codes, price lists, and unit configurations.
            </p>
            {canInventory && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
                <span>SKUs Managed:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{compItems.length} products</span>
              </div>
            )}
          </div>

          {/* GSTR Tax Reports */}
          <div className={`p-5 rounded-2xl border transition-all ${
            canGstReports 
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600' 
              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-70'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
              {canGstReports ? (
                <button
                  onClick={() => setActiveModule('GSTR_REPORTS')}
                  className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-400 font-semibold text-xs flex items-center gap-1"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">GSTR Reports &amp; Filing</h3>
            <p className="text-xs text-slate-500 mt-1">
              Prepare GSTR-1 outward summaries, verify tax breakdowns, and download JSON files.
            </p>
          </div>

          {/* Accounting & Day Book */}
          <div className={`p-5 rounded-2xl border transition-all ${
            canAccounting 
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600' 
              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-70'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              {canAccounting ? (
                <button
                  onClick={() => setActiveModule('ACCOUNTING_BOOKS')}
                  className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Day Book &amp; Ledgers</h3>
            <p className="text-xs text-slate-500 mt-1">
              Examine daily transactions, journal entries, trial balance, and account ledgers.
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Breakdown Info */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <span>Staff Security &amp; Role-Based Boundary</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your account is registered as a <strong className="text-slate-800 dark:text-slate-200">Staff Member</strong> tied exclusively to <strong className="text-slate-800 dark:text-slate-200">{activeCompany?.name}</strong>. Administrative controls such as user creation, multi-company switching, and company configuration are strictly governed by your Company Administrator.
        </p>
      </div>
    </div>
  );
};
