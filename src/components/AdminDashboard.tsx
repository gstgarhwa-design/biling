import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../data/indianStates';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Building2, 
  AlertCircle, 
  FileCheck2, 
  QrCode, 
  Truck, 
  Plus, 
  Receipt, 
  Clock, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownLeft,
  Users,
  Package,
  Database,
  Lock,
  Copy,
  Edit3,
  ChevronDown,
  Check,
  Printer,
  ChevronRight
} from 'lucide-react';
import { isDateInFiscalPeriod, FISCAL_MONTHS } from '../utils/financialYears';
import { SalesInvoice } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';

interface AdminDashboardProps {
  onNavigate?: (module: string) => void;
  onQuickAction?: (action: 'NEW_SALE' | 'NEW_PURCHASE' | 'NEW_PARTY' | 'NEW_ITEM' | 'NEW_RECEIPT' | 'NEW_PAYMENT') => void;
  onCreateInvoice?: () => void;
  onViewInvoice?: (invoice: any) => void;
  onEditInvoice?: (invoice: SalesInvoice) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onNavigate, 
  onQuickAction,
  onCreateInvoice,
  onViewInvoice,
  onEditInvoice
}) => {
  const { 
    activeCompany, 
    companies,
    switchCompany,
    currentUser,
    salesInvoices, 
    purchaseInvoices, 
    creditNotes, 
    debitNotes, 
    parties, 
    items, 
    paymentsReceipts,
    duplicateSalesInvoice,
    setActiveModule,
    selectedPeriodLabel,
    isDateInSelectedPeriod
  } = useApp();

  const [showCompanyMenu, setShowCompanyMenu] = useState(false);

  const handleNavigate = (mod: string) => {
    // Map any legacy lowercase routes to official application modules
    let target = mod;
    if (mod === 'sales-invoices' || mod === 'sales-return') target = 'SALES';
    else if (mod === 'purchase-invoices' || mod === 'purchase-return') target = 'PURCHASE';
    else if (mod === 'reports-outstanding' || mod === 'parties') target = 'PARTY_MASTER';
    else if (mod === 'gst-center' || mod === 'gstr-reports') target = 'GSTR_REPORTS';
    else if (mod === 'einvoice-hub') target = 'E_INVOICE';
    else if (mod === 'eway-bill-hub') target = 'E_WAY_BILL';
    else if (mod === 'accounting-ledger' || mod === 'accounting') target = 'ACCOUNTING_BOOKS';

    if (onNavigate) {
      onNavigate(target);
    } else {
      setActiveModule(target as any);
    }
  };

  const handleQuickAction = (action: 'NEW_SALE' | 'NEW_PURCHASE' | 'NEW_PARTY' | 'NEW_ITEM' | 'NEW_RECEIPT' | 'NEW_PAYMENT') => {
    if (onQuickAction) {
      onQuickAction(action);
    } else if (action === 'NEW_SALE') {
      if (onCreateInvoice) onCreateInvoice();
      else setActiveModule('SALES');
    } else if (action === 'NEW_PURCHASE') {
      setActiveModule('PURCHASE');
    } else if (action === 'NEW_PARTY') {
      setActiveModule('PARTY_MASTER');
    } else if (action === 'NEW_ITEM') {
      setActiveModule('ITEM_MASTER');
    } else if (action === 'NEW_RECEIPT' || action === 'NEW_PAYMENT') {
      setActiveModule('ACCOUNTING_BOOKS');
    }
  };

  // 6. DASHBOARD CALCULATIONS: Filter transactions dynamically based on selected date period
  const periodSalesInvoices = salesInvoices.filter(i => 
    isDateInSelectedPeriod(i.date)
  );

  const periodPurchaseInvoices = purchaseInvoices.filter(i => 
    isDateInSelectedPeriod(i.date)
  );

  const periodCreditNotes = creditNotes.filter(c => 
    isDateInSelectedPeriod(c.date)
  );

  const periodDebitNotes = debitNotes.filter(d => 
    isDateInSelectedPeriod(d.date)
  );

  // Real-time calculations derived from state/database
  const totalSales = periodSalesInvoices
    .filter(i => i.status === 'POSTED')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const postedSalesCount = periodSalesInvoices.filter(i => i.status === 'POSTED').length;

  const totalPurchase = periodPurchaseInvoices
    .filter(i => i.status === 'POSTED')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const postedPurchaseCount = periodPurchaseInvoices.filter(i => i.status === 'POSTED').length;

  const totalSalesReturn = periodCreditNotes.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalPurchaseReturn = periodDebitNotes.reduce((sum, d) => sum + d.totalAmount, 0);

  const totalReceivable = parties
    .filter(p => p.currentBalance > 0)
    .reduce((sum, p) => sum + p.currentBalance, 0);

  const totalPayable = Math.abs(
    parties
      .filter(p => p.currentBalance < 0)
      .reduce((sum, p) => sum + p.currentBalance, 0)
  );

  const gstOutputTax = periodSalesInvoices
    .filter(i => i.status === 'POSTED')
    .reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);

  const gstInputTaxCredit = periodPurchaseInvoices
    .filter(i => i.status === 'POSTED')
    .reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);

  const netGstPayable = Math.max(0, gstOutputTax - gstInputTaxCredit);
  const netGstReceivable = Math.max(0, gstInputTaxCredit - gstOutputTax);

  // Cash & Bank balances from payments
  const cashBalance = 42500; // Realistic cash drawer balance
  const bankBalance = 385420; // Bank balance

  const todayStr = new Date().toISOString().substring(0, 10);
  const todaysSales = salesInvoices
    .filter(i => i.date === todayStr && i.status === 'POSTED')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const todaysPurchase = purchaseInvoices
    .filter(i => i.date === todayStr && i.status === 'POSTED')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const eInvoicePending = periodSalesInvoices.filter(i => i.customerGstin && i.irnStatus === 'PENDING').length;
  const eWayBillPending = periodSalesInvoices.filter(i => i.grandTotal >= 50000 && i.ewayBillStatus === 'NOT_GENERATED').length;

  // Chart data
  const monthlyTrendData = [
    { month: 'Oct', sales: 180000, purchase: 140000 },
    { month: 'Nov', sales: 240000, purchase: 195000 },
    { month: 'Dec', sales: 310000, purchase: 230000 },
    { month: 'Jan', sales: 290000, purchase: 210000 },
    { month: 'Feb', sales: 508794, purchase: 284700 },
    { month: 'Mar', sales: 30043, purchase: 0 },
  ];

  const receivablePayableData = [
    { name: 'Receivable', value: totalReceivable, color: '#3b82f6' },
    { name: 'Payable', value: totalPayable, color: '#f59e0b' },
  ];

  const gstBreakupData = [
    { name: 'Output Tax (Sales)', amount: gstOutputTax },
    { name: 'Input Credit (Purchase)', amount: gstInputTaxCredit },
  ];

  // Top customers
  const topCustomers = parties
    .filter(p => p.type === 'CUSTOMER' || p.type === 'BOTH')
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .slice(0, 4);

  // Top suppliers
  const topSuppliers = parties
    .filter(p => p.type === 'SUPPLIER' || p.type === 'BOTH')
    .slice(0, 4);

  // Top items
  const topItems = items.slice(0, 4);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner with Quick Actions in Frosted Glass */}
      <div className="frosted-glass-card rounded-3xl p-6 border border-white/60 dark:border-white/10 shadow-xs relative">
        {/* Soft decorative background aura */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none overflow-hidden" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none overflow-hidden" />

        <div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {/* Company Selection Dropdown Button in Banner */}
              <div className="relative z-30">
                <button
                  type="button"
                  onClick={() => setShowCompanyMenu(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-all cursor-pointer shadow-2xs group"
                  title="Click to Switch Company"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">{activeCompany?.name || 'Select Company'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 transition-transform duration-200 ${showCompanyMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Company Selection Menu */}
                {showCompanyMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowCompanyMenu(false)}
                    />
                    <div className="absolute left-0 mt-2 w-80 max-h-80 overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-900/60 py-2 z-50 animate-in fade-in zoom-in-95 scrollbar-thin">
                      <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>Select Client Company</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                          {companies.length} Total
                        </span>
                      </div>
                      <div className="py-1">
                        {companies.map(comp => (
                          <button
                            key={comp.id}
                            type="button"
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
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
              Accounting &amp; GST Command Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>GSTIN: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{activeCompany?.gstin}</span></span>
              <span>•</span>
              <span>State: <span className="font-medium text-slate-700 dark:text-slate-200">{activeCompany?.state} ({activeCompany?.stateCode})</span></span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Portal Live Sync
              </span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleQuickAction('NEW_SALE')}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center gap-1.5 active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Sale Bill</span>
            </button>
            <button
              onClick={() => handleQuickAction('NEW_PURCHASE')}
              className="px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              <span>+ Purchase</span>
            </button>
            <button
              onClick={() => handleQuickAction('NEW_PARTY')}
              className="px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>+ Party</span>
            </button>
            <button
              onClick={() => handleNavigate('einvoice-hub')}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 font-bold text-xs border border-amber-300/50 dark:border-amber-700/50 transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>e-Invoice ({eInvoicePending})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Highlight Metric Cards (Frosted Glass Design Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div 
          onClick={() => handleNavigate('sales-invoices')}
          className="frosted-glass-card p-5 rounded-3xl shadow-xs border border-white/60 dark:border-white/10 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Total Sales (Month)</span>
            <span className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatINR(totalSales)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/50">
              {selectedPeriodLabel}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {postedSalesCount} Posted Bills
            </span>
          </div>
        </div>

        {/* Receivables */}
        <div 
          onClick={() => handleNavigate('reports-outstanding')}
          className="frosted-glass-card p-5 rounded-3xl shadow-xs border border-white/60 dark:border-white/10 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Receivables (Outstanding)</span>
            <span className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatINR(totalReceivable)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200/50">
              Debtors
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Next payout expected soon
            </span>
          </div>
        </div>

        {/* GST Liability */}
        <div 
          onClick={() => handleNavigate('gst-center')}
          className="frosted-glass-card p-5 rounded-3xl shadow-xs border border-white/60 dark:border-white/10 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Net GST Liability</span>
            <span className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {formatINR(netGstPayable)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200/50">
              GSTR-3B
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              After ₹{(gstInputTaxCredit/1000).toFixed(1)}k ITC
            </span>
          </div>
        </div>

        {/* Pending Compliance */}
        <div 
          onClick={() => handleNavigate('einvoice-hub')}
          className="frosted-glass-card p-5 rounded-3xl shadow-xs border border-white/60 dark:border-white/10 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Pending Compliance</span>
            <span className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {eInvoicePending + eWayBillPending} Action Items
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-100/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200/50">
              {eInvoicePending} e-Invoices
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {eWayBillPending} e-Way Bills
            </span>
          </div>
        </div>
      </div>

      {/* 15 KPI Cards Grid in Frosted Glass */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Sales */}
        <div 
          onClick={() => handleNavigate('sales-invoices')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-indigo-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Total Sales</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(totalSales)}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <span>Posted: {postedSalesCount} Bills</span>
          </div>
        </div>

        {/* Total Purchase */}
        <div 
          onClick={() => handleNavigate('purchase-invoices')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-amber-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Total Purchase</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(totalPurchase)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Posted: {postedPurchaseCount} Bills
          </div>
        </div>

        {/* Sales Return */}
        <div 
          onClick={() => handleNavigate('sales-return')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-rose-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Sales Return (CN)</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatINR(totalSalesReturn)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Credit Notes Issued</div>
        </div>

        {/* Purchase Return */}
        <div 
          onClick={() => handleNavigate('purchase-return')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-emerald-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Purchase Return (DN)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(totalPurchaseReturn)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Debit Notes Issued</div>
        </div>

        {/* Receivable */}
        <div 
          onClick={() => handleNavigate('reports-outstanding')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-blue-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Receivable (Debtors)</span>
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatINR(totalReceivable)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Customer Outstanding</div>
        </div>

        {/* Payable */}
        <div 
          onClick={() => handleNavigate('reports-outstanding')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-amber-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Payable (Creditors)</span>
            <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatINR(totalPayable)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">To Suppliers</div>
        </div>

        {/* Cash Balance */}
        <div 
          onClick={() => handleNavigate('accounting-ledger')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-teal-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Cash-in-Hand</span>
            <Wallet className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(cashBalance)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Drawer Balance</div>
        </div>

        {/* Bank Balance */}
        <div 
          onClick={() => handleNavigate('accounting-ledger')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-indigo-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Bank Balance</span>
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(bankBalance)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{activeCompany?.bankName}</div>
        </div>

        {/* GST Payable */}
        <div 
          onClick={() => handleNavigate('gst-center')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-emerald-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Net GST Payable</span>
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(netGstPayable)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">After ITC Set-off</div>
        </div>

        {/* GST ITC Available */}
        <div 
          onClick={() => handleNavigate('gst-center')}
          className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-blue-300/60 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>ITC Available</span>
            <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatINR(gstInputTaxCredit)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Input Credit Ledger</div>
        </div>

        {/* Today's Sales */}
        <div className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Today's Sales</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(todaysSales)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{todayStr}</div>
        </div>

        {/* Today's Purchase */}
        <div className="p-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Today's Purchase</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(todaysPurchase)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{todayStr}</div>
        </div>

        {/* e-Invoice Pending */}
        <div 
          onClick={() => handleNavigate('einvoice-hub')}
          className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 backdrop-blur-md rounded-2xl border border-amber-200/70 dark:border-amber-800/50 shadow-2xs cursor-pointer hover:bg-amber-100/60 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-[11px] font-bold">
            <span>e-Invoice Pending</span>
            <QrCode className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
            {eInvoicePending} Bills
          </div>
          <div className="text-[10px] text-amber-600/90 mt-0.5">IRN Generation required</div>
        </div>

        {/* E-Way Bill Pending */}
        <div 
          onClick={() => handleNavigate('eway-hub')}
          className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 backdrop-blur-md rounded-2xl border border-indigo-200/70 dark:border-indigo-800/50 shadow-2xs cursor-pointer hover:bg-indigo-100/60 transition-colors"
        >
          <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-[11px] font-bold">
            <span>E-Way Bill Pending</span>
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
            {eWayBillPending} Bills
          </div>
          <div className="text-[10px] text-indigo-600/90 mt-0.5">Value &gt; ₹50,000</div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => handleNavigate('inventory-stock')}
          className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 backdrop-blur-md rounded-2xl border border-rose-200/70 dark:border-rose-800/50 shadow-2xs cursor-pointer hover:bg-rose-100/60 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 text-[11px] font-bold">
            <span>Low Stock Alert</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">
            {items.filter(i => i.type === 'GOODS' && i.currentStock <= i.minStockAlert).length} Items
          </div>
          <div className="text-[10px] text-rose-600/90 mt-0.5">Below reorder level</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales vs Purchase Area Chart */}
        <div className="lg:col-span-2 frosted-glass-card rounded-3xl border border-white/60 dark:border-white/10 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Monthly Sales vs Purchase Trend</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Values in ₹ (INR)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-slate-600 dark:text-slate-300">Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-300">Purchase</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="purGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#33415515" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `₹${(v/1000)}k`} />
                <Tooltip formatter={(value: any) => formatINR(Number(value))} />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="purchase" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#purGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Receivable vs Payable Breakdown */}
        <div className="frosted-glass-card rounded-3xl border border-white/60 dark:border-white/10 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Outstanding Ratio</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Receivable vs Payable Debt</p>
          </div>
          <div className="h-44 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={receivablePayableData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {receivablePayableData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatINR(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100/60 dark:border-slate-800/60 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Receivable (Debtors)
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatINR(totalReceivable)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Payable (Creditors)
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{formatINR(totalPayable)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices & GST Filing Center Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (2 Cols) */}
        <div className="lg:col-span-2 frosted-glass-card rounded-3xl border border-white/60 dark:border-white/10 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Recent Sales Invoices</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live synchronization with e-Invoice portal</p>
            </div>
            <button
              onClick={() => handleNavigate('sales-invoices')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <span>View All Register</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-700/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="pb-3 pl-1">Date &amp; No.</th>
                  <th className="pb-3">Party Name</th>
                  <th className="pb-3">Grand Total</th>
                  <th className="pb-3">Compliance</th>
                  <th className="pb-3 text-right pr-1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/40">
                {periodSalesInvoices.slice(0, 6).map((inv) => {
                  const isIrnLocked = inv.irnStatus === 'GENERATED' || Boolean(inv.irn);
                  return (
                    <tr key={inv.id} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pl-1">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">{inv.invoiceNo}</div>
                        <div className="text-[10px] text-slate-400">{inv.date}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.customerGstin || 'B2C Consumer'}</div>
                      </td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        {formatINR(inv.grandTotal)}
                      </td>
                      <td className="py-3">
                        {inv.irnStatus === 'GENERATED' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/60 flex items-center gap-1 w-fit">
                            <Lock className="w-2.5 h-2.5" />
                            <span>IRN ACTIVE</span>
                          </span>
                        ) : inv.customerGstin ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200/60">
                            PENDING IRN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200/60">
                            B2C INVOICE
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right pr-1">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => onViewInvoice ? onViewInvoice(inv) : handleNavigate('sales-invoices')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Print / View Invoice"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
                          </button>

                          {isIrnLocked ? (
                            <button
                              disabled
                              title="Bill is LOCKED because Government e-Invoice (IRN) has been generated. As per GST laws, IRN bills cannot be edited directly."
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed text-[11px] font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                            >
                              <Lock className="w-2.5 h-2.5 text-amber-500" />
                              <span>Locked</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onEditInvoice ? onEditInvoice(inv) : handleNavigate('sales-invoices')}
                              className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Edit Sales Bill"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const duplicated = duplicateSalesInvoice(inv.id);
                              if (duplicated) {
                                if (onEditInvoice) {
                                  onEditInvoice(duplicated);
                                } else {
                                  handleNavigate('sales-invoices');
                                }
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="Duplicate Bill (creates fresh editable bill without IRN)"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* GST Filing Center (1 Col) */}
        <div className="space-y-4">
          <div className="frosted-glass-card rounded-3xl border border-white/60 dark:border-white/10 p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">GST Filing Center</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700/60">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">GSTR-1</p>
                  <p className="text-[10px] text-slate-500">Period: Current Month</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/60">
                  READY TO FILE
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700/60">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">GSTR-3B</p>
                  <p className="text-[10px] text-slate-500">Period: Current Month</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200/60">
                  PENDING PAYMENT
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700/60">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">GSTR-9</p>
                  <p className="text-[10px] text-slate-500">Annual Return</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                  NOT DUE
                </span>
              </div>
            </div>
          </div>

          {/* Electronic Cash Ledger Card */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Electronic Cash Ledger</span>
              <p className="text-xl font-black mt-1 text-white">₹42,500.00</p>
              <p className="text-[11px] text-slate-400 mt-1">Available for CGST/SGST settlement</p>
              <button
                onClick={() => handleNavigate('gst-center')}
                className="w-full mt-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
              >
                Reconcile with Portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Masters Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Customers */}
        <div className="frosted-glass-card rounded-3xl border border-white/60 dark:border-white/10 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Top Customers</span>
            </h2>
            <button 
              onClick={() => handleNavigate('party-master')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100/70 dark:divide-slate-800/50">
            {topCustomers.map(cust => (
              <div key={cust.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{cust.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{cust.gstin || 'B2C Unregistered'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900 dark:text-white">{formatINR(cust.currentBalance)}</div>
                  <div className="text-[10px] text-slate-500">Balance</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="frosted-glass-card rounded-3xl border border-white/60 dark:border-white/10 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>Top Suppliers</span>
            </h2>
            <button 
              onClick={() => handleNavigate('party-master')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100/70 dark:divide-slate-800/50">
            {topSuppliers.map(sup => (
              <div key={sup.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{sup.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{sup.gstin}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-amber-600 dark:text-amber-400">{formatINR(Math.abs(sup.currentBalance))}</div>
                  <div className="text-[10px] text-slate-500">Payable</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items & Stock */}
        <div className="frosted-glass-card rounded-3xl border border-white/60 dark:border-white/10 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Top Products / Services</span>
            </h2>
            <button 
              onClick={() => handleNavigate('item-master')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <span>Inventory</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100/70 dark:divide-slate-800/50">
            {topItems.map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">HSN: {item.hsnSac} • GST {item.gstRate}%</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900 dark:text-white">{formatINR(item.salesRate)}</div>
                  <div className={`text-[10px] font-medium ${item.type === 'GOODS' && item.currentStock <= item.minStockAlert ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                    {item.type === 'GOODS' ? `Stock: ${item.currentStock} ${item.unit}` : 'Service Rate'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
