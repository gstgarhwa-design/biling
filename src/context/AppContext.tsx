import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Company,
  Party,
  Item,
  SalesInvoice,
  PurchaseInvoice,
  CreditNote,
  DebitNote,
  PaymentReceipt,
  JournalEntry,
  StockMovement,
  AuditLog,
  GSTApiConfig,
  GranularPermissions,
  UserRole,
  AdminCompanyPermission,
  PaymentStatus,
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_PARTIES,
  INITIAL_ITEMS,
  INITIAL_SALES_INVOICES,
  INITIAL_PURCHASE_INVOICES,
  INITIAL_PAYMENTS_RECEIPTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_AUDIT_LOGS,
  DEFAULT_GST_API_CONFIG,
  INITIAL_CREDIT_NOTES,
  INITIAL_DEBIT_NOTES,
  INITIAL_ADMIN_COMPANY_PERMISSIONS,
} from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  activeCompany: Company | null;
  companies: Company[];
  users: User[];
  parties: Party[];
  items: Item[];
  salesInvoices: SalesInvoice[];
  purchaseInvoices: PurchaseInvoice[];
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
  paymentsReceipts: PaymentReceipt[];
  journalEntries: JournalEntry[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  gstConfig: GSTApiConfig;

  // Multi-Company Admin Permissions
  adminCompanyPermissions: AdminCompanyPermission[];
  assignAdminCompanyPermission: (data: Omit<AdminCompanyPermission, 'id' | 'createdAt' | 'updatedAt'>) => AdminCompanyPermission;
  updateAdminCompanyPermission: (id: string, data: Partial<AdminCompanyPermission>) => void;
  removeAdminCompanyPermission: (id: string) => void;
  toggleAdminCompanyPermissionStatus: (id: string) => void;
  getAuthorizedCompaniesForUser: (user: User | null) => Company[];
  getAuthorizedCompaniesForMobile: (mobile: string) => Company[];
  
  // Navigation & UI State
  activeModule: string;
  setActiveModule: (module: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;

  // Auth & Session
  loginWithOtp: (mobile: string, otp: string, selectedCompanyId?: string) => boolean;
  quickLogin: (userId: string) => void;
  logout: () => void;
  hasPermission: (module: keyof GranularPermissions) => boolean;
  
  // Company & Multi-tenant Switching
  switchCompany: (companyId: string) => void;
  createCompany: (company: Omit<Company, 'id'>) => Company;
  updateCompany: (companyId: string, data: Partial<Company>) => void;
  
  // User Management
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  updateUserPermissions: (userId: string, perms: GranularPermissions) => void;
  toggleUserActive: (userId: string) => void;
  
  // Party Master
  addParty: (party: Omit<Party, 'id' | 'companyId' | 'currentBalance' | 'createdAt'>) => Party;
  updateParty: (partyId: string, data: Partial<Party>) => void;
  
  // Item Master
  addItem: (item: Omit<Item, 'id' | 'companyId' | 'currentStock'>) => Item;
  updateItem: (itemId: string, data: Partial<Item>) => void;
  
  // Sales Invoices & Returns
  createSalesInvoice: (invoiceData: Omit<SalesInvoice, 'id' | 'companyId' | 'createdAt' | 'createdBy' | 'irnStatus' | 'ewayBillStatus'> & { invoiceNo?: string }) => SalesInvoice;
  updateSalesInvoice: (invoiceId: string, data: Partial<SalesInvoice>) => boolean;
  cancelSalesInvoice: (invoiceId: string, reason: string) => boolean;
  duplicateSalesInvoice: (invoiceId: string) => SalesInvoice | null;
  createCreditNote: (cnData: Omit<CreditNote, 'id' | 'companyId' | 'creditNoteNo' | 'createdAt' | 'createdBy'>) => CreditNote;
  
  // e-Invoice & E-Way Bill
  generateIRN: (invoiceId: string) => Promise<{ success: boolean; irn?: string; message: string }>;
  cancelIRN: (invoiceId: string, reasonCode: string, reason: string) => Promise<{ success: boolean; message: string }>;
  generateEWayBill: (invoiceId: string, transportData: { vehicleNo: string; distance: number; transporter: string; transportMode: string }) => Promise<{ success: boolean; ewbNo?: string; message: string }>;
  
  // Purchase Invoices & Returns
  createPurchaseInvoice: (data: Omit<PurchaseInvoice, 'id' | 'companyId' | 'invoiceNo' | 'createdAt' | 'createdBy'>) => PurchaseInvoice;
  createDebitNote: (data: Omit<DebitNote, 'id' | 'companyId' | 'debitNoteNo' | 'createdAt' | 'createdBy'>) => DebitNote;
  
  // Payments & Receipts
  recordPaymentReceipt: (data: Omit<PaymentReceipt, 'id' | 'companyId' | 'voucherNo' | 'createdAt' | 'createdBy'>) => PaymentReceipt;
  
  // Accounting & Stock
  recordJournalEntry: (entry: Omit<JournalEntry, 'id' | 'companyId' | 'entryNo' | 'createdAt' | 'createdBy'>) => JournalEntry;
  createJournalVoucher: (data: any) => JournalEntry;
  journalVouchers: JournalEntry[];
  recordStockAdjustment: (itemId: string, newQty: number, reason: string) => void;
  adjustStock: (itemId: string, newQty: number, reason: string) => void;
  createParty: (party: any) => Party;
  createItem: (item: any) => Item;
  
  // System Config & Audit
  updateGSTConfig: (data: Partial<GSTApiConfig>) => void;
  updateGstConfig: (data: any) => void;
  addAuditLog: (action: AuditLog['action'], module: string, details: string) => void;
  exportGSTR1JSON: () => string;

  // 50 Financial Year & Fiscal Month Filter State
  selectedFinancialYear: string;
  setSelectedFinancialYear: (fy: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  // Supabase Database Connection State
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  supabaseConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'gst_erp_users_v1',
  COMPANIES: 'gst_erp_companies_v1',
  PARTIES: 'gst_erp_parties_v1',
  ITEMS: 'gst_erp_items_v1',
  SALES: 'gst_erp_sales_v1',
  PURCHASES: 'gst_erp_purchases_v1',
  CREDIT_NOTES: 'gst_erp_credit_notes_v1',
  DEBIT_NOTES: 'gst_erp_debit_notes_v1',
  PAYMENTS: 'gst_erp_payments_v1',
  JOURNAL: 'gst_erp_journal_v1',
  STOCK: 'gst_erp_stock_v1',
  AUDIT: 'gst_erp_audit_v1',
  GST_CFG: 'gst_erp_gst_cfg_v1',
  CURRENT_USER_ID: 'gst_erp_current_user_id_v1',
  ACTIVE_COMPANY_ID: 'gst_erp_active_company_id_v1',
  SELECTED_FY: 'gst_erp_selected_fy_v1',
  SELECTED_MONTH: 'gst_erp_selected_month_v1',
  ADMIN_COMPANY_PERMISSIONS: 'gst_erp_admin_company_perms_v1',
};

function loadStorage<T>(key: string, defaultVal: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed !== null && parsed !== undefined) return parsed;
    }
  } catch (e) {
    console.error('Failed to load storage for key:', key, e);
  }
  return defaultVal;
}

function saveStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save storage for key:', key, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => loadStorage(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [companies, setCompanies] = useState<Company[]>(() => loadStorage(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES));
  const [parties, setParties] = useState<Party[]>(() => loadStorage(STORAGE_KEYS.PARTIES, INITIAL_PARTIES));
  const [items, setItems] = useState<Item[]>(() => loadStorage(STORAGE_KEYS.ITEMS, INITIAL_ITEMS));
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(() => loadStorage(STORAGE_KEYS.SALES, INITIAL_SALES_INVOICES));
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => loadStorage(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASE_INVOICES));
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => loadStorage(STORAGE_KEYS.CREDIT_NOTES, INITIAL_CREDIT_NOTES));
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>(() => loadStorage(STORAGE_KEYS.DEBIT_NOTES, INITIAL_DEBIT_NOTES));
  const [paymentsReceipts, setPaymentsReceipts] = useState<PaymentReceipt[]>(() => loadStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS_RECEIPTS));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => loadStorage(STORAGE_KEYS.JOURNAL, INITIAL_JOURNAL_ENTRIES));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadStorage(STORAGE_KEYS.STOCK, INITIAL_STOCK_MOVEMENTS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStorage(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS));
  const [gstConfig, setGstConfig] = useState<GSTApiConfig>(() => loadStorage(STORAGE_KEYS.GST_CFG, DEFAULT_GST_API_CONFIG));
  const [adminCompanyPermissions, setAdminCompanyPermissions] = useState<AdminCompanyPermission[]>(() => 
    loadStorage(STORAGE_KEYS.ADMIN_COMPANY_PERMISSIONS, INITIAL_ADMIN_COMPANY_PERMISSIONS)
  );

  // Current session
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return loadStorage(STORAGE_KEYS.CURRENT_USER_ID, 'user-admin-1'); // Default to Admin Company A
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    return loadStorage(STORAGE_KEYS.ACTIVE_COMPANY_ID, 'comp-1');
  });

  const [activeModule, setActiveModule] = useState<string>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>(() => {
    return loadStorage<string>(STORAGE_KEYS.SELECTED_FY, '2024-25');
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return loadStorage<string>(STORAGE_KEYS.SELECTED_MONTH, 'ALL');
  });

  const currentUser = users.find(u => u.id === currentUserId) || null;

  // Multi-Company authorization helper
  const getAuthorizedCompaniesForUser = (user: User | null): Company[] => {
    if (!user) return [];
    if (user.role === 'SUPER_ADMIN') {
      return companies.filter(c => c.active);
    }
    
    // Find all active permissions for this user (by mobile or id)
    const activePerms = adminCompanyPermissions.filter(p => 
      (p.adminMobile === user.mobile || p.adminId === user.id) && p.status === 'ACTIVE'
    );
    const permittedCompIds = new Set(activePerms.map(p => p.companyId));
    if (user.companyId) {
      permittedCompIds.add(user.companyId);
    }
    
    const authorized = companies.filter(c => permittedCompIds.has(c.id) && c.active);
    return authorized.length > 0 ? authorized : (companies[0] ? [companies[0]] : []);
  };

  const getAuthorizedCompaniesForMobile = (mobile: string): Company[] => {
    const cleanMobile = mobile.trim();
    const matchedUser = users.find(u => u.mobile === cleanMobile);
    if (matchedUser?.role === 'SUPER_ADMIN') {
      return companies.filter(c => c.active);
    }
    const activePerms = adminCompanyPermissions.filter(p => p.adminMobile === cleanMobile && p.status === 'ACTIVE');
    const permittedCompIds = new Set(activePerms.map(p => p.companyId));
    if (matchedUser?.companyId) {
      permittedCompIds.add(matchedUser.companyId);
    }
    return companies.filter(c => permittedCompIds.has(c.id) && c.active);
  };

  // Strict multi-tenant isolation:
  // - SUPER_ADMIN: Can access any company (activeCompanyId).
  // - ADMIN: Can switch between ANY company they have authorized permission for.
  // - STAFF: Bound to their assigned company.
  const authorizedCompanies = getAuthorizedCompaniesForUser(currentUser);
  const isCurrentActiveAuthorized = authorizedCompanies.some(c => c.id === activeCompanyId);
  const effectiveCompanyId = currentUser?.role === 'SUPER_ADMIN' 
    ? activeCompanyId 
    : (isCurrentActiveAuthorized ? activeCompanyId : (authorizedCompanies[0]?.id || currentUser?.companyId || 'comp-1'));

  const activeCompany = (companies || []).find(c => c.id === effectiveCompanyId) || companies?.[0] || null;

  // Save changes to localStorage
  useEffect(() => { saveStorage(STORAGE_KEYS.USERS, users); }, [users]);
  useEffect(() => { saveStorage(STORAGE_KEYS.COMPANIES, companies); }, [companies]);
  useEffect(() => { saveStorage(STORAGE_KEYS.PARTIES, parties); }, [parties]);
  useEffect(() => { saveStorage(STORAGE_KEYS.ITEMS, items); }, [items]);
  useEffect(() => { saveStorage(STORAGE_KEYS.SALES, salesInvoices); }, [salesInvoices]);
  useEffect(() => { saveStorage(STORAGE_KEYS.PURCHASES, purchaseInvoices); }, [purchaseInvoices]);
  useEffect(() => { saveStorage(STORAGE_KEYS.CREDIT_NOTES, creditNotes); }, [creditNotes]);
  useEffect(() => { saveStorage(STORAGE_KEYS.DEBIT_NOTES, debitNotes); }, [debitNotes]);
  useEffect(() => { saveStorage(STORAGE_KEYS.PAYMENTS, paymentsReceipts); }, [paymentsReceipts]);
  useEffect(() => { saveStorage(STORAGE_KEYS.JOURNAL, journalEntries); }, [journalEntries]);
  useEffect(() => { saveStorage(STORAGE_KEYS.STOCK, stockMovements); }, [stockMovements]);
  useEffect(() => { saveStorage(STORAGE_KEYS.AUDIT, auditLogs); }, [auditLogs]);
  useEffect(() => { saveStorage(STORAGE_KEYS.GST_CFG, gstConfig); }, [gstConfig]);
  useEffect(() => { saveStorage(STORAGE_KEYS.ADMIN_COMPANY_PERMISSIONS, adminCompanyPermissions); }, [adminCompanyPermissions]);
  useEffect(() => { saveStorage(STORAGE_KEYS.CURRENT_USER_ID, currentUserId); }, [currentUserId]);
  useEffect(() => { saveStorage(STORAGE_KEYS.ACTIVE_COMPANY_ID, activeCompanyId); }, [activeCompanyId]);
  useEffect(() => { saveStorage(STORAGE_KEYS.SELECTED_FY, selectedFinancialYear); }, [selectedFinancialYear]);
  useEffect(() => { saveStorage(STORAGE_KEYS.SELECTED_MONTH, selectedMonth); }, [selectedMonth]);

  const addAuditLog = (action: AuditLog['action'], module: string, details: string) => {
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany?.id,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'STAFF',
      action,
      module,
      details,
      ip: '103.15.' + Math.floor(Math.random() * 200) + '.' + Math.floor(Math.random() * 200),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const hasPermission = (module: keyof GranularPermissions): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // Check specific permission record for active company
    const activePerm = adminCompanyPermissions.find(p => 
      (p.adminMobile === currentUser.mobile || p.adminId === currentUser.id) && 
      p.companyId === effectiveCompanyId &&
      p.status === 'ACTIVE'
    );
    if (activePerm) {
      return !!activePerm.permissions[module];
    }

    if (currentUser.role === 'ADMIN') return true;
    return !!currentUser.permissions[module];
  };

  const loginWithOtp = (mobile: string, otp: string, selectedCompanyId?: string): boolean => {
    const cleanMobile = mobile.trim();
    // Look up user by mobile
    const user = users.find(u => u.mobile === cleanMobile);
    if (user && user.active) {
      const authorized = getAuthorizedCompaniesForMobile(cleanMobile);
      if (user.role !== 'SUPER_ADMIN' && authorized.length === 0) {
        return false;
      }

      setCurrentUserId(user.id);
      if (selectedCompanyId && authorized.some(c => c.id === selectedCompanyId)) {
        setActiveCompanyId(selectedCompanyId);
      } else if (authorized.length > 0) {
        setActiveCompanyId(authorized[0].id);
      } else if (user.companyId) {
        setActiveCompanyId(user.companyId);
      }
      addAuditLog('LOGIN', 'Security', `User ${user.name} logged in via mobile OTP (${cleanMobile})`);
      return true;
    }
    return false;
  };

  const quickLogin = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(user.id);
      const authorized = getAuthorizedCompaniesForUser(user);
      if (authorized.length > 0) {
        setActiveCompanyId(authorized[0].id);
      } else if (user.companyId) {
        setActiveCompanyId(user.companyId);
      }
      addAuditLog('LOGIN', 'Security', `Fast Switch to ${user.name} (${user.role})`);
    }
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('LOGOUT', 'Security', `User ${currentUser.name} logged out`);
    }
    setCurrentUserId('');
  };

  const switchCompany = (companyId: string) => {
    if (!currentUser) return;
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
      setActiveCompanyId(companyId);
      const comp = companies.find(c => c.id === companyId);
      addAuditLog('UPDATE', 'Company Switcher', `${currentUser.role} ${currentUser.name} switched view to company: ${comp?.name}`);
      return;
    }

    // Check if the current user is authorized for this company
    const authorized = getAuthorizedCompaniesForUser(currentUser);
    const isAuthorized = authorized.some(c => c.id === companyId);
    if (isAuthorized) {
      setActiveCompanyId(companyId);
      const comp = companies.find(c => c.id === companyId);
      addAuditLog('UPDATE', 'Company Switcher', `Staff ${currentUser.name} switched view to authorized company: ${comp?.name}`);
    } else {
      alert('Security Alert: You do not have authorized permission to access this company data.');
      addAuditLog('PERMISSION_CHANGE', 'Authorization', `Blocked unauthorized attempt by ${currentUser.name} to access company ID: ${companyId}`);
    }
  };

  const assignAdminCompanyPermission = (data: Omit<AdminCompanyPermission, 'id' | 'createdAt' | 'updatedAt'>): AdminCompanyPermission => {
    const existing = adminCompanyPermissions.find(p => p.adminMobile === data.adminMobile && p.companyId === data.companyId);
    if (existing) {
      const updated: AdminCompanyPermission = {
        ...existing,
        role: data.role,
        permissions: data.permissions,
        status: data.status,
        updatedAt: new Date().toISOString().substring(0, 10),
      };
      setAdminCompanyPermissions(prev => prev.map(p => p.id === existing.id ? updated : p));
      addAuditLog('UPDATE', 'Permissions', `Updated company access for ${data.adminName} (${data.companyName})`);
      return updated;
    }

    const newPerm: AdminCompanyPermission = {
      ...data,
      id: 'perm-' + Date.now(),
      createdAt: new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10),
    };
    setAdminCompanyPermissions(prev => [newPerm, ...prev]);
    addAuditLog('CREATE', 'Permissions', `Assigned ${data.companyName} access to ${data.adminName} (${data.adminMobile})`);
    return newPerm;
  };

  const updateAdminCompanyPermission = (id: string, data: Partial<AdminCompanyPermission>) => {
    setAdminCompanyPermissions(prev => prev.map(p => p.id === id ? {
      ...p,
      ...data,
      updatedAt: new Date().toISOString().substring(0, 10),
    } : p));
    addAuditLog('UPDATE', 'Permissions', `Updated admin company permission ID: ${id}`);
  };

  const removeAdminCompanyPermission = (id: string) => {
    const existing = adminCompanyPermissions.find(p => p.id === id);
    setAdminCompanyPermissions(prev => prev.filter(p => p.id !== id));
    addAuditLog('DELETE', 'Permissions', `Removed company access: ${existing?.companyName} for ${existing?.adminName}`);
  };

  const toggleAdminCompanyPermissionStatus = (id: string) => {
    setAdminCompanyPermissions(prev => prev.map(p => p.id === id ? {
      ...p,
      status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      updatedAt: new Date().toISOString().substring(0, 10),
    } : p));
  };

  const createCompany = (companyData: Omit<Company, 'id'>): Company => {
    const id = 'comp-' + (companies.length + 1);
    const newCompany: Company = { ...companyData, id };
    setCompanies(prev => [...prev, newCompany]);
    addAuditLog('CREATE', 'Company Master', `Created new company: ${newCompany.name} (GSTIN: ${newCompany.gstin})`);
    return newCompany;
  };

  const updateCompany = (companyId: string, data: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, ...data } : c));
    addAuditLog('UPDATE', 'Company Master', `Updated company profile details for company ID: ${companyId}`);
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const id = 'user-' + Date.now();
    const newUser: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('CREATE', 'User Management', `Created user ${newUser.name} with role ${newUser.role}`);
    return newUser;
  };

  const updateUserPermissions = (userId: string, perms: GranularPermissions) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: perms } : u));
    addAuditLog('PERMISSION_CHANGE', 'Staff Permissions', `Updated permissions for user ID: ${userId}`);
  };

  const toggleUserActive = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u));
    addAuditLog('UPDATE', 'User Management', `Toggled active status for user ID: ${userId}`);
  };

  const addParty = (partyData: Omit<Party, 'id' | 'companyId' | 'currentBalance' | 'createdAt'>): Party => {
    const id = 'party-' + Date.now();
    const newParty: Party = {
      ...partyData,
      id,
      companyId: activeCompany?.id || 'comp-1',
      currentBalance: partyData.openingBalance || 0,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setParties(prev => [...prev, newParty]);
    addAuditLog('CREATE', 'Party Master', `Added party: ${newParty.name} (${newParty.type})`);
    return newParty;
  };

  const updateParty = (partyId: string, data: Partial<Party>) => {
    setParties(prev => prev.map(p => p.id === partyId ? { ...p, ...data } : p));
    addAuditLog('UPDATE', 'Party Master', `Updated party details for ID: ${partyId}`);
  };

  const addItem = (itemData: Omit<Item, 'id' | 'companyId' | 'currentStock'>): Item => {
    const id = 'item-' + Date.now();
    const newItem: Item = {
      ...itemData,
      id,
      companyId: activeCompany?.id || 'comp-1',
      currentStock: itemData.openingStock || 0,
    };
    setItems(prev => [...prev, newItem]);
    addAuditLog('CREATE', 'Item Master', `Added ${newItem.type}: ${newItem.name} (${newItem.hsnSac})`);
    return newItem;
  };

  const updateItem = (itemId: string, data: Partial<Item>) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...data } : i));
    addAuditLog('UPDATE', 'Item Master', `Updated item details for ID: ${itemId}`);
  };

  const createSalesInvoice = (
    invoiceData: Omit<SalesInvoice, 'id' | 'companyId' | 'createdAt' | 'createdBy' | 'irnStatus' | 'ewayBillStatus'> & { invoiceNo?: string }
  ): SalesInvoice => {
    const currentPrefix = activeCompany?.invoicePrefix || 'INV/25/';
    const nextSeries = (activeCompany?.invoiceNumberSeries || 100) + 1;
    const defaultInvoiceNo = `${currentPrefix}${String(nextSeries).padStart(4, '0')}`;
    const invoiceNo = invoiceData.invoiceNo?.trim() || defaultInvoiceNo;

    // Update company series counter if auto series was utilized
    if (activeCompany && (!invoiceData.invoiceNo || invoiceData.invoiceNo.trim() === defaultInvoiceNo)) {
      updateCompany(activeCompany.id, { invoiceNumberSeries: nextSeries });
    }

    const id = 'inv-' + Date.now();
    const paidReceived = invoiceData.paymentReceived ?? invoiceData.paidAmount ?? 0;
    const computedOutstanding = Math.max(0, invoiceData.grandTotal - paidReceived);
    const computedPaymentStatus: PaymentStatus = paidReceived >= invoiceData.grandTotal 
      ? 'PAID' 
      : (paidReceived > 0 ? 'PARTIAL' : (invoiceData.paymentMode === 'CREDIT' ? 'UNPAID' : 'PAID'));

    const newInvoice: SalesInvoice = {
      ...invoiceData,
      id,
      companyId: activeCompany?.id || 'comp-1',
      invoiceNo,
      paidAmount: paidReceived,
      paymentReceived: paidReceived,
      paymentStatus: computedPaymentStatus,
      outstandingAmount: computedOutstanding,
      irnStatus: invoiceData.customerGstin ? 'PENDING' : 'NOT_APPLICABLE',
      ewayBillStatus: 'NOT_GENERATED',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdBy: currentUser?.name || 'Admin',
    };

    setSalesInvoices(prev => [newInvoice, ...prev]);

    // Record Payment Receipt Voucher if payment received upfront
    if (newInvoice.status === 'POSTED' && paidReceived > 0) {
      const receiptVoucher: PaymentReceipt = {
        id: 'rec-' + Date.now(),
        companyId: activeCompany?.id || 'comp-1',
        voucherNo: 'REC/' + Date.now().toString().slice(-6),
        date: newInvoice.paymentDate || newInvoice.date,
        type: 'RECEIPT',
        partyId: newInvoice.customerId,
        partyName: newInvoice.customerName,
        partyType: 'CUSTOMER',
        amount: paidReceived,
        paymentMode: (newInvoice.paymentMode === 'CREDIT' || newInvoice.paymentMode === 'SPLIT') ? 'CASH' : newInvoice.paymentMode,
        referenceNo: newInvoice.paymentRefNo || `Bill ${invoiceNo}`,
        allocatedInvoiceId: id,
        notes: `Upfront payment received against Sales Invoice ${invoiceNo}`,
        bankName: newInvoice.bankAccount || activeCompany?.bankName || 'Main Bank',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        createdBy: currentUser?.name || 'Admin',
      };
      setPaymentsReceipts(prev => [receiptVoucher, ...prev]);
    }

    // Update stock levels for goods
    if (newInvoice.status === 'POSTED') {
      newInvoice.items.forEach(invItem => {
        const matchingItem = items.find(i => i.id === invItem.itemId);
        if (matchingItem && matchingItem.type === 'GOODS') {
          setItems(prev => prev.map(i => i.id === invItem.itemId ? {
            ...i,
            currentStock: Math.max(0, i.currentStock - invItem.qty),
          } : i));

          // Log stock movement
          const newMovement: StockMovement = {
            id: 'stk-' + Date.now() + Math.random(),
            companyId: activeCompany?.id || 'comp-1',
            date: newInvoice.date,
            itemId: invItem.itemId,
            itemName: invItem.name,
            type: 'OUT',
            qty: invItem.qty,
            rate: invItem.rate,
            reference: `${invoiceNo} (${newInvoice.customerName})`,
            warehouse: matchingItem.warehouse,
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
          setStockMovements(prev => [newMovement, ...prev]);
        }
      });

      // Update party ledger / balance if unpaid or partial
      const balanceImpact = computedOutstanding;
      if (balanceImpact > 0) {
        setParties(prev => prev.map(p => p.id === newInvoice.customerId ? {
          ...p,
          currentBalance: p.currentBalance + balanceImpact,
        } : p));
      }
    }

    addAuditLog('CREATE', 'Sales Invoice', `Created invoice ${invoiceNo} for ${newInvoice.customerName} (₹${newInvoice.grandTotal.toLocaleString('en-IN')})`);
    return newInvoice;
  };

  const updateSalesInvoice = (invoiceId: string, data: Partial<SalesInvoice>): boolean => {
    const existing = salesInvoices.find(inv => inv.id === invoiceId);
    if (!existing) return false;

    // Strict e-Invoice IRN Lock:
    // If bill has an official Government IRN generated, editing is strictly locked!
    if (existing.irnStatus === 'GENERATED' || existing.irn) {
      alert('This bill is LOCKED because an official Government e-Invoice (IRN) has been generated. Modifying a locked bill is strictly restricted under GST compliance rules. Please issue a Credit Note or cancel the IRN first.');
      return false;
    }

    setSalesInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, ...data } : inv));
    addAuditLog('UPDATE', 'Sales Invoice', `Edited invoice ${existing.invoiceNo}. Status: ${data.status || existing.status}`);
    return true;
  };

  const duplicateSalesInvoice = (invoiceId: string): SalesInvoice | null => {
    const existing = salesInvoices.find(inv => inv.id === invoiceId);
    if (!existing) return null;

    const currentPrefix = activeCompany?.invoicePrefix || 'APX/25/';
    const nextSeries = (activeCompany?.invoiceNumberSeries || 100) + 1;
    const invoiceNo = `${currentPrefix}${String(nextSeries).padStart(4, '0')}`;

    if (activeCompany) {
      updateCompany(activeCompany.id, { invoiceNumberSeries: nextSeries });
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const duplicated: SalesInvoice = {
      ...existing,
      id: 'inv-' + Date.now(),
      invoiceNo,
      date: todayStr,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      status: 'DRAFT', // Fresh unposted, fully editable state
      irnStatus: existing.customerGstin ? 'PENDING' : 'NOT_APPLICABLE',
      irn: undefined,
      ackNo: undefined,
      ackDate: undefined,
      signedQrCode: undefined,
      ewayBillStatus: 'NOT_GENERATED',
      ewayBillNo: undefined,
      ewayBillDate: undefined,
      ewayBillValidUntil: undefined,
      ewayBillVehicleNo: undefined,
      ewayBillDistance: undefined,
      ewayBillTransporter: undefined,
      ewayBillTransportMode: undefined,
      paidAmount: 0,
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdBy: currentUser?.name || 'Admin',
      notes: existing.notes ? `${existing.notes} (Duplicated from ${existing.invoiceNo})` : `Duplicated from ${existing.invoiceNo}`,
    };

    setSalesInvoices(prev => [duplicated, ...prev]);
    addAuditLog('CREATE', 'Sales Invoice', `Duplicated bill from ${existing.invoiceNo} as new bill ${duplicated.invoiceNo}`);
    return duplicated;
  };

  const cancelSalesInvoice = (invoiceId: string, reason: string): boolean => {
    const existing = salesInvoices.find(inv => inv.id === invoiceId);
    if (!existing) return false;

    if (existing.irnStatus === 'GENERATED') {
      alert('Please cancel the Government IRN (e-Invoice) first before cancelling the sales invoice.');
      return false;
    }

    setSalesInvoices(prev => prev.map(inv => inv.id === invoiceId ? {
      ...inv,
      status: 'CANCELLED',
      notes: (inv.notes ? inv.notes + ' | ' : '') + `Cancelled: ${reason}`,
    } : inv));

    // Reverse stock movements if it was posted
    if (existing.status === 'POSTED') {
      existing.items.forEach(invItem => {
        setItems(prev => prev.map(i => i.id === invItem.itemId ? {
          ...i,
          currentStock: i.currentStock + invItem.qty,
        } : i));
      });

      // Reverse party balance
      const balanceImpact = existing.grandTotal - (existing.paidAmount || 0);
      if (balanceImpact > 0) {
        setParties(prev => prev.map(p => p.id === existing.customerId ? {
          ...p,
          currentBalance: Math.max(0, p.currentBalance - balanceImpact),
        } : p));
      }
    }

    addAuditLog('DELETE', 'Sales Invoice', `Cancelled invoice ${existing.invoiceNo}. Reason: ${reason}`);
    return true;
  };

  const createCreditNote = (
    cnData: Omit<CreditNote, 'id' | 'companyId' | 'creditNoteNo' | 'createdAt' | 'createdBy'>
  ): CreditNote => {
    const creditNoteNo = `CN/${activeCompany?.financialYear?.substring(2, 4) || '25'}/${String(creditNotes.length + 1).padStart(4, '0')}`;
    const newCn: CreditNote = {
      ...cnData,
      id: 'cn-' + Date.now(),
      companyId: activeCompany?.id || 'comp-1',
      creditNoteNo,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdBy: currentUser?.name || 'Admin',
    };

    setCreditNotes(prev => [newCn, ...prev]);

    // Restore stock for returned goods
    newCn.items.forEach(item => {
      setItems(prev => prev.map(i => i.id === item.itemId ? {
        ...i,
        currentStock: i.currentStock + item.qty,
      } : i));
    });

    // Reduce customer receivable
    setParties(prev => prev.map(p => p.id === newCn.customerId ? {
      ...p,
      currentBalance: p.currentBalance - newCn.totalAmount,
    } : p));

    addAuditLog('CREATE', 'Sales Return', `Generated Credit Note ${creditNoteNo} against Invoice ${newCn.originalInvoiceNo} (₹${newCn.totalAmount})`);
    return newCn;
  };

  const generateIRN = async (invoiceId: string): Promise<{ success: boolean; irn?: string; message: string }> => {
    const inv = salesInvoices.find(i => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice not found' };

    if (!inv.customerGstin) {
      return { success: false, message: 'Customer GSTIN is mandatory for B2B e-Invoice generation' };
    }

    // Simulate NIC IRP e-Invoice API hash generation
    const mockHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const mockAckNo = '1125' + Math.floor(10000000 + Math.random() * 90000000);
    const now = new Date();
    const ackDate = now.toISOString().replace('T', ' ').substring(0, 19);
    const qrPayload = `https://einvoice1.gst.gov.in/qr?irn=${mockHash}&seller=${activeCompany?.gstin}&buyer=${inv.customerGstin}&docNo=${encodeURIComponent(inv.invoiceNo)}&docDt=${inv.date}&totAmt=${inv.grandTotal}`;

    setSalesInvoices(prev => prev.map(i => i.id === invoiceId ? {
      ...i,
      irnStatus: 'GENERATED',
      irn: mockHash,
      ackNo: mockAckNo,
      ackDate,
      signedQrCode: qrPayload,
    } : i));

    addAuditLog('GENERATE_IRN', 'e-Invoice', `IRN Generated successfully for Invoice ${inv.invoiceNo} (Ack No: ${mockAckNo})`);
    return { success: true, irn: mockHash, message: `IRN ${mockHash.substring(0, 16)}... generated successfully` };
  };

  const cancelIRN = async (invoiceId: string, reasonCode: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const inv = salesInvoices.find(i => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice not found' };

    setSalesInvoices(prev => prev.map(i => i.id === invoiceId ? {
      ...i,
      irnStatus: 'CANCELLED',
      irnCancelledReason: `Code ${reasonCode}: ${reason}`,
    } : i));

    addAuditLog('CANCEL_IRN', 'e-Invoice', `IRN Cancelled for Invoice ${inv.invoiceNo}. Reason: ${reason}`);
    return { success: true, message: `IRN cancelled successfully for invoice ${inv.invoiceNo}` };
  };

  const generateEWayBill = async (
    invoiceId: string,
    transportData: { vehicleNo: string; distance: number; transporter: string; transportMode: string }
  ): Promise<{ success: boolean; ewbNo?: string; message: string }> => {
    const inv = salesInvoices.find(i => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice not found' };

    const ewbNo = (activeCompany?.stateCode || '27') + '10' + Math.floor(10000000 + Math.random() * 90000000);
    const today = new Date();
    const validUntil = new Date(today.getTime() + Math.max(1, Math.ceil(transportData.distance / 200)) * 24 * 60 * 60 * 1000);

    setSalesInvoices(prev => prev.map(i => i.id === invoiceId ? {
      ...i,
      ewayBillStatus: 'GENERATED',
      ewayBillNo: ewbNo,
      ewayBillDate: today.toISOString().substring(0, 10),
      ewayBillValidUntil: validUntil.toISOString().substring(0, 10) + ' 23:59',
      ewayBillVehicleNo: (transportData.vehicleNo || '').toUpperCase(),
      ewayBillDistance: transportData.distance,
      ewayBillTransporter: transportData.transporter,
      ewayBillTransportMode: transportData.transportMode,
    } : i));

    addAuditLog('GENERATE_EWAY', 'E-Way Bill', `Generated E-Way Bill ${ewbNo} for invoice ${inv.invoiceNo} (Vehicle: ${transportData.vehicleNo})`);
    return { success: true, ewbNo, message: `E-Way Bill ${ewbNo} generated successfully` };
  };

  const createPurchaseInvoice = (
    data: Omit<PurchaseInvoice, 'id' | 'companyId' | 'invoiceNo' | 'createdAt' | 'createdBy'>
  ): PurchaseInvoice => {
    const invoiceNo = `PINV/25/${String(purchaseInvoices.length + 1).padStart(4, '0')}`;
    const newPurchase: PurchaseInvoice = {
      ...data,
      id: 'pur-' + Date.now(),
      companyId: activeCompany?.id || 'comp-1',
      invoiceNo,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdBy: currentUser?.name || 'Admin',
    };

    setPurchaseInvoices(prev => [newPurchase, ...prev]);

    // Increase stock for purchase items
    newPurchase.items.forEach(purItem => {
      setItems(prev => prev.map(i => i.id === purItem.itemId ? {
        ...i,
        currentStock: i.currentStock + purItem.qty,
      } : i));

      // Stock movement entry
      const newMovement: StockMovement = {
        id: 'stk-' + Date.now() + Math.random(),
        companyId: activeCompany?.id || 'comp-1',
        date: newPurchase.date,
        itemId: purItem.itemId,
        itemName: purItem.name,
        type: 'IN',
        qty: purItem.qty,
        rate: purItem.rate,
        reference: `${invoiceNo} (${newPurchase.supplierName})`,
        warehouse: 'Main Godown (Andheri)',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      setStockMovements(prev => [newMovement, ...prev]);
    });

    // Update supplier payable balance if not fully paid
    const unpaid = newPurchase.grandTotal - (newPurchase.paidAmount || 0);
    if (unpaid > 0) {
      setParties(prev => prev.map(p => p.id === newPurchase.supplierId ? {
        ...p,
        currentBalance: p.currentBalance - unpaid, // Negative balance = payable
      } : p));
    }

    addAuditLog('CREATE', 'Purchase', `Recorded Purchase ${invoiceNo} from ${newPurchase.supplierName} (₹${newPurchase.grandTotal})`);
    return newPurchase;
  };

  const createDebitNote = (
    data: Omit<DebitNote, 'id' | 'companyId' | 'debitNoteNo' | 'createdAt' | 'createdBy'>
  ): DebitNote => {
    const debitNoteNo = `DN/25/${String(debitNotes.length + 1).padStart(4, '0')}`;
    const supplierParty = parties.find(p => p.id === data.supplierId);
    const taxableAmount = data.taxableAmount ?? data.items.reduce((acc, it) => acc + (it.taxableValue || 0), 0);
    const cgst = data.cgst ?? data.items.reduce((acc, it) => acc + (it.cgst || 0), 0);
    const sgst = data.sgst ?? data.items.reduce((acc, it) => acc + (it.sgst || 0), 0);
    const igst = data.igst ?? data.items.reduce((acc, it) => acc + (it.igst || 0), 0);

    const newDn: DebitNote = {
      ...data,
      id: 'dn-' + Date.now(),
      companyId: activeCompany?.id || 'comp-1',
      debitNoteNo,
      supplierGstin: data.supplierGstin || supplierParty?.gstin || '',
      taxableAmount,
      cgst,
      sgst,
      igst,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdBy: currentUser?.name || 'Admin',
    };

    setDebitNotes(prev => [newDn, ...prev]);

    // Reduce stock for returned items
    newDn.items.forEach(item => {
      setItems(prev => prev.map(i => i.id === item.itemId ? {
        ...i,
        currentStock: Math.max(0, i.currentStock - item.qty),
      } : i));
    });

    // Reduce supplier payable balance
    setParties(prev => prev.map(p => p.id === newDn.supplierId ? {
      ...p,
      currentBalance: p.currentBalance + newDn.totalAmount,
    } : p));

    addAuditLog('CREATE', 'Purchase Return', `Issued Debit Note ${debitNoteNo} to ${newDn.supplierName} (₹${newDn.totalAmount})`);
    return newDn;
  };

  const recordPaymentReceipt = (
    data: Omit<PaymentReceipt, 'id' | 'companyId' | 'voucherNo' | 'createdAt' | 'createdBy'>
  ): PaymentReceipt => {
    const prefix = data.type === 'RECEIPT' ? 'REC/25/' : 'PAY/25/';
    const voucherNo = `${prefix}${String(paymentsReceipts.length + 1).padStart(4, '0')}`;
    const newVoucher: PaymentReceipt = {
      ...data,
      id: 'vch-' + Date.now(),
      companyId: activeCompany?.id || 'comp-1',
      voucherNo,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdBy: currentUser?.name || 'Admin',
    };

    setPaymentsReceipts(prev => [newVoucher, ...prev]);

    // Update Party Current Balance
    if (data.type === 'RECEIPT') {
      // Customer paid us -> decrease customer receivable
      setParties(prev => prev.map(p => p.id === data.partyId ? {
        ...p,
        currentBalance: p.currentBalance - data.amount,
      } : p));
      // If linked to invoice, update paidAmount
      if (data.allocatedInvoiceId) {
        setSalesInvoices(prev => prev.map(inv => {
          if (inv.id === data.allocatedInvoiceId) {
            const newPaid = inv.paidAmount + data.amount;
            return {
              ...inv,
              paidAmount: newPaid,
              paymentStatus: newPaid >= inv.grandTotal ? 'PAID' : 'PARTIAL',
            };
          }
          return inv;
        }));
      }
    } else {
      // Supplier payment -> decrease supplier payable (make currentBalance less negative)
      setParties(prev => prev.map(p => p.id === data.partyId ? {
        ...p,
        currentBalance: p.currentBalance + data.amount,
      } : p));
    }

    addAuditLog('CREATE', data.type === 'RECEIPT' ? 'Customer Receipt' : 'Supplier Payment', `Recorded ${newVoucher.voucherNo} for ${newVoucher.partyName} (₹${newVoucher.amount})`);
    return newVoucher;
  };

  const recordJournalEntry = (
    entry: Omit<JournalEntry, 'id' | 'companyId' | 'entryNo' | 'createdAt' | 'createdBy'>
  ): JournalEntry => {
    const entryNo = `${entry.type === 'CONTRA' ? 'CONTRA' : 'JV'}/25/${String(journalEntries.length + 1).padStart(4, '0')}`;
    const newEntry: JournalEntry = {
      ...entry,
      id: 'jrn-' + Date.now(),
      companyId: activeCompany?.id || 'comp-1',
      entryNo,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdBy: currentUser?.name || 'Admin',
    };

    setJournalEntries(prev => [newEntry, ...prev]);
    addAuditLog('CREATE', 'Journal / Contra', `Recorded ${newEntry.entryNo} of ₹${newEntry.totalAmount}`);
    return newEntry;
  };

  const recordStockAdjustment = (itemId: string, newQty: number, reason: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const diff = newQty - item.currentStock;
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, currentStock: newQty } : i));

    const newMovement: StockMovement = {
      id: 'stk-' + Date.now(),
      companyId: activeCompany?.id || 'comp-1',
      date: new Date().toISOString().substring(0, 10),
      itemId,
      itemName: item.name,
      type: 'ADJUSTMENT',
      qty: Math.abs(diff),
      rate: item.purchaseRate,
      reference: `Physical verification adjustment (${diff > 0 ? '+' : ''}${diff}): ${reason}`,
      warehouse: item.warehouse,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setStockMovements(prev => [newMovement, ...prev]);
    addAuditLog('UPDATE', 'Stock Adjustment', `Adjusted stock for ${item.name} from ${item.currentStock} to ${newQty}. Reason: ${reason}`);
  };

  const updateGSTConfig = (data: Partial<GSTApiConfig>) => {
    setGstConfig(prev => ({ ...prev, ...data }));
    addAuditLog('UPDATE', 'GST API Config', 'Updated GST / e-Invoice API configuration settings');
  };

  // Filtered views based on tenant isolation:
  // If Super Admin, they see the activeCompany's records (or all when inspecting).
  // If Admin or Staff, they ONLY see their company's records!
  const targetCompanyId = activeCompany?.id || 'comp-1';

  const tenantParties = parties.filter(p => p.companyId === targetCompanyId);
  const tenantItems = items.filter(i => i.companyId === targetCompanyId);
  const tenantSalesInvoices = salesInvoices.filter(i => i.companyId === targetCompanyId);
  const tenantPurchaseInvoices = purchaseInvoices.filter(i => i.companyId === targetCompanyId);
  const tenantCreditNotes = creditNotes.filter(i => i.companyId === targetCompanyId);
  const tenantDebitNotes = debitNotes.filter(i => i.companyId === targetCompanyId);
  const tenantPaymentsReceipts = paymentsReceipts.filter(i => i.companyId === targetCompanyId);
  const tenantJournalEntries = journalEntries.filter(i => i.companyId === targetCompanyId);
  const tenantStockMovements = stockMovements.filter(i => i.companyId === targetCompanyId);
  const tenantAuditLogs = currentUser?.role === 'SUPER_ADMIN'
    ? auditLogs
    : auditLogs.filter(l => l.companyId === targetCompanyId);

  const exportGSTR1JSON = (): string => {
    const b2b = tenantSalesInvoices
      .filter(i => i.customerGstin && i.status !== 'CANCELLED')
      .map(inv => ({
        ctin: inv.customerGstin,
        inv: [{
          inum: inv.invoiceNo,
          idt: inv.date,
          val: inv.grandTotal,
          pos: inv.customerStateCode,
          rchrg: 'N',
          inv_typ: 'R',
          itms: inv.items.map((item, idx) => ({
            num: idx + 1,
            itm_det: {
              txval: item.taxableValue,
              rt: item.gstRate,
              iamt: item.igst,
              camt: item.cgst,
              samt: item.sgst,
              csamt: item.cess,
            }
          }))
        }]
      }));

    return JSON.stringify({
      gstin: activeCompany?.gstin || '',
      fp: '122024',
      b2b,
    }, null, 2);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeCompany,
        companies,
        users,
        parties: tenantParties,
        items: tenantItems,
        salesInvoices: tenantSalesInvoices,
        purchaseInvoices: tenantPurchaseInvoices,
        creditNotes: tenantCreditNotes,
        debitNotes: tenantDebitNotes,
        paymentsReceipts: tenantPaymentsReceipts,
        journalEntries: tenantJournalEntries,
        journalVouchers: tenantJournalEntries,
        stockMovements: tenantStockMovements,
        auditLogs: tenantAuditLogs,
        gstConfig,
        adminCompanyPermissions,
        assignAdminCompanyPermission,
        updateAdminCompanyPermission,
        removeAdminCompanyPermission,
        toggleAdminCompanyPermissionStatus,
        getAuthorizedCompaniesForUser,
        getAuthorizedCompaniesForMobile,
        activeModule,
        setActiveModule,
        isSidebarOpen,
        setIsSidebarOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginWithOtp,
        quickLogin,
        logout,
        hasPermission,
        switchCompany,
        createCompany,
        updateCompany,
        createUser,
        updateUserPermissions,
        toggleUserActive,
        addParty,
        createParty: (p) => addParty(p),
        updateParty,
        addItem,
        createItem: (i) => addItem(i),
        updateItem,
        createSalesInvoice,
        updateSalesInvoice,
        cancelSalesInvoice,
        duplicateSalesInvoice,
        createCreditNote,
        generateIRN,
        cancelIRN,
        generateEWayBill,
        createPurchaseInvoice,
        createDebitNote,
        recordPaymentReceipt,
        recordJournalEntry,
        createJournalVoucher: (j) => recordJournalEntry(j),
        recordStockAdjustment,
        adjustStock: (itemId, newQty, reason) => recordStockAdjustment(itemId, newQty, reason),
        updateGSTConfig,
        updateGstConfig: (cfg) => updateGSTConfig(cfg),
        addAuditLog,
        exportGSTR1JSON,
        selectedFinancialYear,
        setSelectedFinancialYear,
        selectedMonth,
        setSelectedMonth,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        supabaseConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );

};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
