import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminDashboard } from './components/AdminDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { SalesInvoiceModule } from './components/SalesInvoiceModule';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { EInvoiceHub } from './components/EInvoiceHub';
import { EWayBillHub } from './components/EWayBillHub';
import { GSTRReportsModule } from './components/GSTRReportsModule';
import { PartyMasterModule } from './components/PartyMasterModule';
import { ItemMasterModule } from './components/ItemMasterModule';
import { PurchaseModule } from './components/PurchaseModule';
import { StaffManagementModule } from './components/StaffManagementModule';
import { AccountingBooksModule } from './components/AccountingBooksModule';
import { AuditTrailModule } from './components/AuditTrailModule';
import { GstSettingsModule } from './components/GstSettingsModule';
import { PartyWiseReportModule } from './components/PartyWiseReportModule';
import { AdvancedReportsModule } from './components/AdvancedReportsModule';
import { LoginModal } from './components/LoginModal';
import { SupabaseModal } from './components/SupabaseModal';
import { SalesInvoice } from './types';

const MainLayout: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    isSidebarOpen, 
    setIsSidebarOpen, 
    currentUser, 
    isLoginModalOpen, 
    setIsLoginModalOpen,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen
  } = useApp();
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<SalesInvoice | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<SalesInvoice | null>(null);

  // Quick modals state triggered from Mobile Nav Speed-Dial
  const [quickCreateInvoice, setQuickCreateInvoice] = useState(false);
  const [quickCreateParty, setQuickCreateParty] = useState(false);
  const [quickCreateItem, setQuickCreateItem] = useState(false);
  const [quickCreatePurchase, setQuickCreatePurchase] = useState(false);

  // Render the current active module
  const renderActiveModule = () => {
    switch (activeModule) {
      case 'DASHBOARD':
        if (currentUser?.role === 'SUPER_ADMIN') {
          return <SuperAdminDashboard />;
        }
        return (
          <AdminDashboard
            onCreateInvoice={() => setQuickCreateInvoice(true)}
            onViewInvoice={(inv) => setSelectedInvoiceForPrint(inv)}
            onEditInvoice={(inv) => {
              setInvoiceToEdit(inv);
              setActiveModule('SALES');
            }}
          />
        );

      case 'SUPER_ADMIN':
        return <SuperAdminDashboard />;

      case 'SALES':
        return (
          <SalesInvoiceModule
            isCreateOpen={quickCreateInvoice}
            onCloseCreate={() => setQuickCreateInvoice(false)}
            onViewInvoice={(inv) => setSelectedInvoiceForPrint(inv)}
            initialEditingInvoice={invoiceToEdit}
            onClearEditingInvoice={() => setInvoiceToEdit(null)}
          />
        );

      case 'PURCHASE':
        return (
          <PurchaseModule
            isCreateOpen={quickCreatePurchase}
            onCloseCreate={() => setQuickCreatePurchase(false)}
          />
        );

      case 'PARTY_MASTER':
        return (
          <PartyMasterModule
            isCreateOpen={quickCreateParty}
            onCloseCreate={() => setQuickCreateParty(false)}
          />
        );

      case 'ITEM_MASTER':
        return (
          <ItemMasterModule
            isCreateOpen={quickCreateItem}
            onCloseCreate={() => setQuickCreateItem(false)}
          />
        );

      case 'GSTR_REPORTS':
        return <GSTRReportsModule />;

      case 'E_INVOICE':
        return (
          <EInvoiceHub
            onViewInvoice={(inv) => setSelectedInvoiceForPrint(inv)}
          />
        );

      case 'E_WAY_BILL':
        return (
          <EWayBillHub
            onViewInvoice={(inv) => setSelectedInvoiceForPrint(inv)}
          />
        );

      case 'ACCOUNTING_BOOKS':
        return <AccountingBooksModule />;

      case 'STAFF_MGMT':
        return <StaffManagementModule />;

      case 'AUDIT_TRAIL':
        return <AuditTrailModule />;

      case 'PARTY_REPORTS':
        return <PartyWiseReportModule />;

      case 'ADVANCED_REPORTS':
        return <AdvancedReportsModule />;

      case 'SETTINGS':
        return <GstSettingsModule />;

      default:
        return (
          <AdminDashboard
            onCreateInvoice={() => setQuickCreateInvoice(true)}
            onViewInvoice={(inv) => setSelectedInvoiceForPrint(inv)}
          />
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 frosted-bg flex flex-col font-sans transition-colors duration-200 selection:bg-indigo-500/20">
      {/* Top Navigation Header */}
      <div className="shrink-0 relative z-40">
        <Header 
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          activeModule={activeModule}
        />
      </div>

      {/* Main Structural Body: Sidebar is fixed in height, only main scrolls */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Desktop Collapsible Sidebar (Locked & Fixed behind header) */}
        <Sidebar 
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Center Work Area (Only this area scrolls) */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="max-w-7xl mx-auto">
            {renderActiveModule()}
          </div>
        </main>
      </div>

      {/* Mobile-first Floating Bottom Nav with Speed Dial */}
      <MobileBottomNav
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onOpenMobileMenu={() => setIsSidebarOpen(true)}
        onQuickAction={(action) => {
          if (action === 'NEW_SALE') {
            setActiveModule('SALES');
            setQuickCreateInvoice(true);
          } else if (action === 'NEW_PURCHASE') {
            setActiveModule('PURCHASE');
            setQuickCreatePurchase(true);
          } else if (action === 'NEW_PARTY') {
            setActiveModule('PARTY_MASTER');
            setQuickCreateParty(true);
          } else if (action === 'NEW_ITEM') {
            setActiveModule('ITEM_MASTER');
            setQuickCreateItem(true);
          }
        }}
      />

      {/* Professional Tax Invoice Print Preview with IRN & UPI QR Modal */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {/* Mobile Number + OTP Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Supabase PostgreSQL Database Connection & Status Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
