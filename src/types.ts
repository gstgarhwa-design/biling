export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

export interface GranularPermissions {
  sales: boolean;
  purchase: boolean;
  payments: boolean;
  inventory: boolean;
  gstReports: boolean;
  einvoice: boolean;
  accounting: boolean;
  settings: boolean;
}

export interface AdminCompanyPermission {
  id: string;
  adminId: string;
  adminMobile: string;
  adminName: string;
  companyId: string;
  companyName: string;
  role: 'ADMIN' | 'STAFF';
  permissions: GranularPermissions;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface StaffPermissions {
  canSalesCreate: boolean;
  canSalesView: boolean;
  canSalesDelete: boolean;
  canPurchaseCreate: boolean;
  canPurchaseView: boolean;
  canPaymentEntry: boolean;
  canInventoryView: boolean;
  canInventoryEdit: boolean;
  canGSTReportView: boolean;
  canEInvoiceGenerate: boolean;
  canAuditLogView: boolean;
}

export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
export type ItemType = 'GOODS' | 'SERVICE';


export interface User {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  companyId?: string; // Admin and Staff are strictly bound to 1 company
  assignedAdminId?: string; // Staff is assigned to an Admin
  permissions: GranularPermissions;
  active: boolean;
  createdAt: string;
}

export type GSTRegistrationType = 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED' | 'SEZ' | 'EXPORT' | 'CONSUMER';

export interface Company {
  id: string;
  name: string;
  legalName: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pin: string;
  mobile: string;
  email: string;
  pan: string;
  gstin: string;
  gstType: GSTRegistrationType;
  financialYear: string;
  invoicePrefix: string;
  invoiceNumberSeries: number;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  upiId: string;
  logoUrl?: string;
  signatureUrl?: string;
  terms: string;
  active: boolean;
  subscriptionPlan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  planValidTill: string;
}

export interface Party {
  id: string;
  companyId: string;
  name: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  mobile: string;
  email: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  state: string;
  stateCode: string;
  pin: string;
  pan: string;
  gstin: string;
  gstRegType: GSTRegistrationType;
  creditLimit: number;
  creditDays: number;
  openingBalance: number; // positive = receivable (Dr), negative = payable (Cr)
  currentBalance: number;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
  contactPerson: string;
  createdAt: string;
}

export interface Item {
  id: string;
  companyId: string;
  type: 'GOODS' | 'SERVICE';
  name: string;
  hsnSac: string;
  description: string;
  unit: string; // PCS, KGS, BOX, MTR, NOS, LTR, HRS, MONTH
  gstRate: number; // 0, 5, 12, 18, 28
  cess: number;
  purchaseRate: number;
  salesRate: number;
  mrp: number;
  openingStock: number;
  currentStock: number;
  minStockAlert: number;
  warehouse: string;
  category?: string;
}

export interface InvoiceItem {
  id: string;
  itemId: string;
  name: string;
  hsnSac: string;
  unit: string;
  qty: number;
  rate: number;
  discountPercent: number;
  discountAmount?: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
}

export type InvoiceStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type EInvoiceStatus = 'NOT_APPLICABLE' | 'PENDING' | 'GENERATED' | 'CANCELLED';
export type EWayBillStatus = 'NOT_GENERATED' | 'GENERATED' | 'CANCELLED';
export type PaymentMode = 'CASH' | 'BANK' | 'UPI' | 'CREDIT' | 'SPLIT';
export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';
export type InvoiceThemeId = 'professional' | 'classic' | 'modern' | 'compact' | 'gstdetailed' | 'thermal';

export interface SalesInvoice {
  id: string;
  companyId: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerGstin: string;
  customerStateCode: string;
  billingAddress: string;
  shippingAddress: string;
  items: InvoiceItem[];
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  roundOff: number;
  grandTotal: number;
  status: InvoiceStatus;
  
  // Invoice Details & Terms
  financialYear?: string;
  paymentTerms?: string;
  customerPan?: string;
  customerContact?: string;
  customerState?: string;

  // Dispatch Information
  dispatchFrom?: string;
  dispatchAddress?: string;
  dispatchState?: string;
  dispatchStateCode?: string;
  dispatchDate?: string;

  // Transport Information
  transporterName?: string;
  transporterGstin?: string;
  transporterId?: string;
  vehicleNo?: string;
  transportMode?: string;
  distanceKm?: number;
  lrGrNo?: string;
  lrGrDate?: string;
  lrNo?: string;
  lrDate?: string;

  // Payment Received Information
  paymentReceived?: number;
  paymentDate?: string;
  paymentRefNo?: string;
  bankAccount?: string;
  outstandingAmount?: number;

  // e-Invoice fields
  irnStatus: EInvoiceStatus;
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  signedQrCode?: string;
  irnCancelledReason?: string;
  
  // E-Way Bill fields
  ewayBillStatus: EWayBillStatus;
  ewayBillNo?: string;
  ewayBillDate?: string;
  ewayBillValidUntil?: string;
  ewayBillVehicleNo?: string;
  ewayBillDistance?: number;
  ewayBillTransporter?: string;
  ewayBillTransportMode?: string;
  
  themeId: InvoiceThemeId;
  notes?: string;
  terms?: string;
  createdAt: string;
  createdBy: string;
}

export interface CreditNote {
  id: string;
  companyId: string;
  creditNoteNo: string;
  originalInvoiceId: string;
  originalInvoiceNo: string;
  date: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  items: InvoiceItem[];
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface PurchaseInvoice {
  id: string;
  companyId: string;
  invoiceNo: string;
  supplierInvoiceNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  items: InvoiceItem[];
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  freight: number;
  otherCharges: number;
  roundOff: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  status: 'POSTED' | 'CANCELLED';
  createdAt: string;
  createdBy: string;
}

export interface DebitNote {
  id: string;
  companyId: string;
  debitNoteNo: string;
  originalInvoiceId: string;
  originalSupplierInvoiceNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  supplierGstin?: string;
  items: InvoiceItem[];
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface PaymentReceipt {
  id: string;
  companyId: string;
  voucherNo: string;
  type: 'RECEIPT' | 'PAYMENT';
  date: string;
  partyId: string;
  partyName: string;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  amount: number;
  paymentMode: 'CASH' | 'BANK' | 'UPI' | 'CHEQUE';
  referenceNo?: string; // Cheque / UTR / Transaction ID
  chequeDate?: string;
  bankName?: string;
  allocatedInvoiceId?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  companyId: string;
  entryNo: string;
  type: 'JOURNAL' | 'CONTRA';
  date: string;
  narration: string;
  lines: JournalEntryLine[];
  totalAmount: number;
  createdAt: string;
  createdBy: string;
}

export type JournalVoucher = JournalEntry;


export interface StockMovement {
  id: string;
  companyId: string;
  date: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  qty: number;
  rate: number;
  reference: string;
  warehouse: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  companyId?: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'GENERATE_IRN' | 'CANCEL_IRN' | 'GENERATE_EWAY' | 'PERMISSION_CHANGE';
  module: string;
  details: string;
  ip: string;
}

export interface GSTApiConfig {
  provider: 'NIC_SANDBOX' | 'CLEAR_TAX' | 'MASTERS_INDIA' | 'TAX_PRO';
  clientId: string;
  clientSecret: string;
  username: string;
  gstin: string;
  isLive: boolean;
  autoEInvoiceAbove5Cr: boolean;
  autoEWayBillAbove50K: boolean;
}
