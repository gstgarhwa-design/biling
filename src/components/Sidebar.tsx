import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  ShoppingCart,
  Boxes,
  BookOpen,
  FileCheck2,
  QrCode,
  Truck,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Shield,
  Building,
  Users,
  CreditCard,
  Receipt,
  FileText,
  AlertCircle,
  Database,
  Check
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  isOpen,
  onClose,
}) => {
  const { 
    currentUser, 
    hasPermission, 
    salesInvoices, 
    activeCompany, 
    companies,
    switchCompany,
    selectedFinancialYear, 
    setIsSupabaseModalOpen 
  } = useApp();

  const [showCompanyPicker, setShowCompanyPicker] = useState(false);

  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    masters: false,
    sales: true,
    purchase: false,
    inventory: false,
    accounting: false,
    gst: true,
    einvoice: true,
    eway: false,
    reports: false,
    settings: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const pendingIrnCount = salesInvoices.filter(i => i.customerGstin && i.irnStatus === 'PENDING').length;
  const pendingEwayCount = salesInvoices.filter(i => i.grandTotal >= 50000 && i.ewayBillStatus === 'NOT_GENERATED').length;

  const handleSelect = (module: string) => {
    // Map specific sub-actions to canonical modules
    let target = module;
    if (module === 'dashboard') target = 'DASHBOARD';
    else if (module === 'super-admin') target = 'SUPER_ADMIN';
    else if (['sales-invoices', 'sales-return', 'payment-receipts'].includes(module)) target = 'SALES';
    else if (['purchase-invoices', 'purchase-return', 'supplier-payments'].includes(module)) target = 'PURCHASE';
    else if (['party-master'].includes(module)) target = 'PARTY_MASTER';
    else if (['party-reports', 'reports-party', 'party-ledger'].includes(module)) target = 'PARTY_REPORTS';
    else if (['advanced-reports', 'reports-advanced', 'reports-item', 'reports-category', 'reports-hsn'].includes(module)) target = 'ADVANCED_REPORTS';
    else if (['item-master', 'stock-summary', 'stock-adjustment', 'stock-godown', 'inventory-stock', 'stock-ledger'].includes(module)) target = 'ITEM_MASTER';
    else if (['gst-center', 'gst-gstr1', 'gst-gstr3b', 'gst-gstr2b', 'gst-itc-ledger', 'reports-sales', 'reports-purchase', 'reports-outstanding', 'gst-json'].includes(module)) target = 'GSTR_REPORTS';
    else if (['einvoice-hub', 'einvoice-generate', 'einvoice-bulk', 'einvoice-cancelled'].includes(module)) target = 'E_INVOICE';
    else if (['eway-hub', 'eway-generate', 'eway-active', 'eway-consolidated'].includes(module)) target = 'E_WAY_BILL';
    else if (['accounting-daybook', 'accounting-journal', 'accounting-ledger', 'accounting-final', 'chart-of-accounts'].includes(module)) target = 'ACCOUNTING_BOOKS';
    else if (['settings-staff'].includes(module)) target = 'STAFF_MGMT';
    else if (['settings-audit-logs'].includes(module)) target = 'AUDIT_TRAIL';
    else if (['company-settings', 'settings-gst-api', 'settings-invoice-themes'].includes(module)) target = 'SETTINGS';

    setActiveModule(target);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isCurrentActive = (key: string) => {
    if (key === 'dashboard' && (activeModule === 'DASHBOARD' || activeModule === 'dashboard')) return true;
    if (key === 'super-admin' && (activeModule === 'SUPER_ADMIN' || activeModule === 'super-admin')) return true;
    if (key === 'sales' && activeModule === 'SALES') return true;
    if (key === 'purchase' && activeModule === 'PURCHASE') return true;
    if (key === 'party-master' && activeModule === 'PARTY_MASTER') return true;
    if (key === 'party-reports' && activeModule === 'PARTY_REPORTS') return true;
    if (key === 'advanced-reports' && activeModule === 'ADVANCED_REPORTS') return true;
    if (key === 'item-master' && activeModule === 'ITEM_MASTER') return true;
    if (key === 'gst' && activeModule === 'GSTR_REPORTS') return true;
    if (key === 'einvoice' && activeModule === 'E_INVOICE') return true;
    if (key === 'eway' && activeModule === 'E_WAY_BILL') return true;
    if (key === 'accounting' && activeModule === 'ACCOUNTING_BOOKS') return true;
    if (key === 'staff' && activeModule === 'STAFF_MGMT') return true;
    if (key === 'audit' && activeModule === 'AUDIT_TRAIL') return true;
    if (key === 'settings' && activeModule === 'SETTINGS') return true;
    return false;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-20 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-20 lg:z-10 h-screen w-64 bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl text-slate-700 dark:text-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } border-r border-slate-200/50 dark:border-slate-800/50 shadow-xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-950/30 backdrop-blur-md shrink-0">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25 shrink-0">
            A
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              AccuGST Pro
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold truncate">
              Enterprise Edition
            </span>
          </div>
        </div>

        {/* Navigation items list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-xs scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {/* Super Admin exclusive dashboard */}
          {currentUser?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => handleSelect('super-admin')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                isCurrentActive('super-admin')
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-semibold'
                  : 'text-purple-700 dark:text-purple-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4" />
                <span>Super Admin Panel</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200 font-bold">
                Master
              </span>
            </button>
          )}

          {/* Regular Dashboard */}
          <button
            onClick={() => handleSelect('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all ${
              isCurrentActive('dashboard')
                ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-600" />
            <span className="text-sm">Dashboard</span>
          </button>

          {/* Operational Group */}
          <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Operational
          </div>

          {/* 1. Masters Section */}
          <div>
            <button
              onClick={() => toggleSection('masters')}
              className="w-full flex items-center justify-between px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-xl transition-colors font-medium text-sm"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Masters</span>
              </div>
              {openSections.masters ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {openSections.masters && (
              <div className="ml-5 pl-2 border-l border-slate-200/70 dark:border-slate-800 mt-1 space-y-1">
                <button
                  onClick={() => handleSelect('party-master')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs ${
                    activeModule === 'PARTY_MASTER' ? 'text-indigo-600 font-bold bg-white/70 dark:bg-slate-800/70' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Parties (Customers &amp; Suppliers)
                </button>
                <button
                  onClick={() => handleSelect('item-master')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs ${
                    activeModule === 'ITEM_MASTER' ? 'text-indigo-600 font-bold bg-white/70 dark:bg-slate-800/70' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Items (Goods &amp; Services / HSN)
                </button>
                <button
                  onClick={() => handleSelect('company-settings')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Company Profile &amp; QR
                </button>
              </div>
            )}
          </div>

          {/* 2. Sales Section */}
          {hasPermission('sales') && (
            <div>
              <button
                onClick={() => toggleSection('sales')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                  isCurrentActive('sales')
                    ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Sales &amp; Invoicing</span>
                </div>
                {openSections.sales ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
              {openSections.sales && (
                <div className="ml-5 pl-2 border-l border-slate-200/70 dark:border-slate-800 mt-1 space-y-1">
                  <button
                    onClick={() => handleSelect('sales-invoices')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs ${
                      activeModule === 'SALES' ? 'text-indigo-600 font-bold bg-white/70 dark:bg-slate-800/70' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Tax Invoices &amp; Billing
                  </button>
                  <button
                    onClick={() => handleSelect('sales-return')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    Credit Note (Returns)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Purchase Section */}
          {hasPermission('purchase') && (
            <div>
              <button
                onClick={() => toggleSection('purchase')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                  isCurrentActive('purchase')
                    ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                  <span>Purchases</span>
                </div>
                {openSections.purchase ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
              {openSections.purchase && (
                <div className="ml-5 pl-2 border-l border-slate-200/70 dark:border-slate-800 mt-1 space-y-1">
                  <button
                    onClick={() => handleSelect('purchase-invoices')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs ${
                      activeModule === 'PURCHASE' ? 'text-indigo-600 font-bold bg-white/70 dark:bg-slate-800/70' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Purchase Bills (Inward)
                  </button>
                  <button
                    onClick={() => handleSelect('purchase-return')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-between"
                  >
                    <span>Debit Notes (Return)</span>
                    <span className="text-[9px] font-bold px-1 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">DN</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Compliance Group */}
          <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Compliance
          </div>

          {/* 4. GST Center */}
          {hasPermission('gstReports') && (
            <button
              onClick={() => handleSelect('gst-center')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                isCurrentActive('gst')
                  ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>GST Returns (GSTR-1 &amp; 3B)</span>
              </div>
            </button>
          )}

          {/* 5. e-Invoice Module */}
          {hasPermission('einvoice') && (
            <button
              onClick={() => handleSelect('einvoice-hub')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                isCurrentActive('einvoice')
                  ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-cyan-600" />
                <span>e-Invoice / IRN</span>
              </div>
              {pendingIrnCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                  {pendingIrnCount}
                </span>
              )}
            </button>
          )}

          {/* 6. E-Way Bill Module */}
          {hasPermission('sales') && (
            <button
              onClick={() => handleSelect('eway-hub')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                isCurrentActive('eway')
                  ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>E-Way Bill Hub</span>
              </div>
              {pendingEwayCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold">
                  {pendingEwayCount}
                </span>
              )}
            </button>
          )}

          {/* Finance Group */}
          <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Finance
          </div>

          {/* 7. Core Accounting Module */}
          {hasPermission('accounting') && (
            <button
              onClick={() => handleSelect('accounting-daybook')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                isCurrentActive('accounting')
                  ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-violet-600" />
                <span>Trial Balance / P&amp;L</span>
              </div>
            </button>
          )}

          {/* Reports & Business Intelligence Group */}
          <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Reports &amp; Intelligence
          </div>

          <button
            onClick={() => handleSelect('party-reports')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
              isCurrentActive('party-reports')
                ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
              <span>Party-Wise Ledger</span>
            </div>
          </button>

          <button
            onClick={() => handleSelect('advanced-reports')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
              isCurrentActive('advanced-reports')
                ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Advanced Reports</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              Item/HSN
            </span>
          </button>

          {/* 8. Staff RBAC */}
          {currentUser?.role !== 'STAFF' && (
            <button
              onClick={() => handleSelect('settings-staff')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                isCurrentActive('staff')
                  ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Staff &amp; Permissions</span>
              </div>
            </button>
          )}

          {/* 9. Audit Log */}
          <button
            onClick={() => handleSelect('settings-audit-logs')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
              isCurrentActive('audit')
                ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Audit Trail (MCA)</span>
            </div>
          </button>

          {/* 10. Settings */}
          {hasPermission('settings') && (
            <button
              onClick={() => handleSelect('company-settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                isCurrentActive('settings')
                  ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>GST / IRP Gateway</span>
              </div>
            </button>
          )}

          {/* 11. Supabase PostgreSQL Cloud Database */}
          <button
            onClick={() => {
              setIsSupabaseModalOpen(true);
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-semibold text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Supabase DB</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-bold text-emerald-600">CONNECTED</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </button>
        </div>

        {/* Bottom Current Entity Card from Frosted Glass Theme */}
        <div className="p-4 shrink-0 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-slate-950/20 backdrop-blur-md relative">
          <button
            type="button"
            onClick={() => setShowCompanyPicker(prev => !prev)}
            className="w-full text-left bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all cursor-pointer group"
            title="Click to Switch Entity"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Current Entity</p>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform duration-200 ${showCompanyPicker ? 'rotate-180' : ''}`} />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {activeCompany?.name || 'Select Company'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Active • FY {selectedFinancialYear}</span>
              </span>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">Switch ▾</span>
            </p>
          </button>

          {/* Quick Company Picker Dropup */}
          {showCompanyPicker && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowCompanyPicker(false)} 
              />
              <div className="absolute bottom-full left-4 right-4 mb-2 max-h-64 overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-900/80 py-2 z-40 scrollbar-thin animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Switch Company ({companies.length})
                </div>
                {companies.map(comp => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => {
                      switchCompany(comp.id);
                      setShowCompanyPicker(false);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-indigo-50/80 dark:hover:bg-slate-800/80 transition-colors ${
                      comp.id === activeCompany?.id ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="truncate font-semibold">{comp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{comp.gstin}</div>
                    </div>
                    {comp.id === activeCompany?.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
