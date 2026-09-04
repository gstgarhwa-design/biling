import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PurchaseInvoice, InvoiceItem, DebitNote, PaymentMode, PaymentStatus } from '../types';
import { formatINR, amountInWords } from '../data/indianStates';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Building2, 
  CornerDownRight, 
  Trash2, 
  X,
  FileCheck2,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  FileText,
  RotateCcw,
  CheckCircle2,
  Edit,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Copy,
  Percent,
  Check,
  CreditCard,
  Truck,
  DollarSign,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { DebitNotePrintModal } from './DebitNotePrintModal';

interface PurchaseModuleProps {
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  defaultTab?: 'BILLS' | 'RETURNS';
}

interface PurchaseLineItemState {
  id: string;
  itemId: string;
  name: string;
  category: string;
  hsnSac: string;
  unit: string;
  qty: number;
  rate: number;
  discountPercent: number;
  gstRate: number;
}

interface ExtendedPurchaseInvoice extends PurchaseInvoice {
  dueDate?: string;
  paymentMode?: PaymentMode;
  itcEligible?: boolean;
  notes?: string;
  supplierStateCode?: string;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({
  isCreateOpen = false,
  onCloseCreate,
  defaultTab = 'BILLS',
}) => {
  const { 
    activeCompany, 
    purchaseInvoices, 
    debitNotes, 
    parties, 
    items, 
    createPurchaseInvoice, 
    createDebitNote,
    deletePurchaseInvoice,
    deleteDebitNote,
    isDateInSelectedPeriod,
    selectedPeriodLabel
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'BILLS' | 'RETURNS'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form modal state (Create / Edit)
  const [showFormModal, setShowFormModal] = useState(isCreateOpen);
  const [editingInvoice, setEditingInvoice] = useState<ExtendedPurchaseInvoice | null>(null);

  // View / Print Purchase Bill Modal
  const [selectedPrintBill, setSelectedPrintBill] = useState<ExtendedPurchaseInvoice | null>(null);
  const [billQrUrl, setBillQrUrl] = useState<string>('');

  // Return modal (Debit note)
  const [returningPurchase, setReturningPurchase] = useState<PurchaseInvoice | null>(null);
  const [showDirectReturnModal, setShowDirectReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Damaged goods received from vendor');
  const [selectedPrintDebitNote, setSelectedPrintDebitNote] = useState<DebitNote | null>(null);

  // Form State: Header Section
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('UNPAID');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CREDIT');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [freight, setFreight] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [itcEligible, setItcEligible] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('Goods received in satisfactory condition.');

  // Form State: Item Grid Table
  const [lineItems, setLineItems] = useState<PurchaseLineItemState[]>([]);

  // Form State for Direct Debit Note / Purchase Return
  const [dnSupplierId, setDnSupplierId] = useState('');
  const [dnOriginalBillNo, setDnOriginalBillNo] = useState('SUP-8821');
  const [dnItemId, setDnItemId] = useState('');
  const [dnQty, setDnQty] = useState(1);
  const [dnRate, setDnRate] = useState(500);
  const [dnReason, setDnReason] = useState('Damaged goods received from vendor');

  // Set default suppliers / items once available
  useEffect(() => {
    if (!supplierId && parties.length > 0) {
      const defaultSup = parties.find(p => p.type !== 'CUSTOMER') || parties[0];
      if (defaultSup) setSupplierId(defaultSup.id);
    }
    if (!dnSupplierId && parties.length > 0) {
      const defaultSup = parties.find(p => p.type !== 'CUSTOMER') || parties[0];
      if (defaultSup) setDnSupplierId(defaultSup.id);
    }
    if (!dnItemId && items.length > 0) {
      setDnItemId(items[0].id);
      setDnRate(items[0].purchaseRate || 500);
    }
  }, [parties, items, supplierId, dnSupplierId, dnItemId]);

  // Synchronize isCreateOpen prop
  useEffect(() => {
    if (isCreateOpen) {
      handleOpenCreate();
    }
  }, [isCreateOpen]);

  // Generate QR code for viewed purchase bill
  useEffect(() => {
    if (selectedPrintBill) {
      const qrData = `PINV:${selectedPrintBill.invoiceNo}|SUPP:${selectedPrintBill.supplierName}|REF:${selectedPrintBill.supplierInvoiceNo}|VAL:${selectedPrintBill.grandTotal}|DATE:${selectedPrintBill.date}|GSTIN:${selectedPrintBill.supplierGstin || 'UNREG'}`;
      QRCode.toDataURL(qrData, { width: 110, margin: 1 })
        .then(url => setBillQrUrl(url))
        .catch(console.error);
    } else {
      setBillQrUrl('');
    }
  }, [selectedPrintBill]);

  // Selected supplier details
  const selectedSupplier = useMemo(() => {
    return parties.find(p => p.id === supplierId);
  }, [parties, supplierId]);

  // Interstate check: supplier's stateCode !== activeCompany's stateCode
  const isInterstate = useMemo(() => {
    if (!selectedSupplier || !activeCompany) return false;
    return selectedSupplier.stateCode !== activeCompany.stateCode;
  }, [selectedSupplier, activeCompany]);

  // Initialize a fresh item row
  const createDefaultLineItem = (customItemId?: string): PurchaseLineItemState => {
    const it = customItemId ? items.find(i => i.id === customItemId) : (items?.[0] || null);
    return {
      id: 'pur-row-' + Date.now() + Math.random().toString(36).substring(2, 6),
      itemId: it?.id || '',
      name: it?.name || 'Inward Goods / Raw Material',
      category: it?.category || 'General Supplies',
      hsnSac: it?.hsnSac || '84713010',
      unit: it?.unit || 'PCS',
      qty: 1,
      rate: it?.purchaseRate || 1000,
      discountPercent: 0,
      gstRate: it?.gstRate || 18,
    };
  };

  // Open Create Mode
  const handleOpenCreate = () => {
    setEditingInvoice(null);
    const defaultSup = parties.find(p => p.type !== 'CUSTOMER') || parties[0];
    setSupplierId(defaultSup?.id || '');
    setSupplierInvoiceNo(`SUP-${Math.floor(1000 + Math.random() * 9000)}`);
    setInvoiceDate(new Date().toISOString().substring(0, 10));
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
    setPaymentStatus('UNPAID');
    setPaymentMode('CREDIT');
    setPaidAmount(0);
    setFreight(0);
    setOtherCharges(0);
    setItcEligible(true);
    setNotes('Received at primary warehouse in good condition.');
    setLineItems([createDefaultLineItem()]);
    setShowFormModal(true);
  };

  // Open Update Mode with existing invoice
  const handleOpenEdit = (bill: PurchaseInvoice) => {
    const extBill = bill as ExtendedPurchaseInvoice;
    setEditingInvoice(extBill);
    setSupplierId(extBill.supplierId);
    setSupplierInvoiceNo(extBill.supplierInvoiceNo || extBill.invoiceNo);
    setInvoiceDate(extBill.date);
    setDueDate(extBill.dueDate || extBill.date);
    setPaymentStatus(extBill.paymentStatus || 'UNPAID');
    setPaymentMode(extBill.paymentMode || 'CREDIT');
    setPaidAmount(extBill.paidAmount || 0);
    setFreight(extBill.freight || 0);
    setOtherCharges(extBill.otherCharges || 0);
    setItcEligible(extBill.itcEligible ?? true);
    setNotes(extBill.notes || 'Received in good condition.');

    if (bill.items && bill.items.length > 0) {
      setLineItems(bill.items.map((it, idx) => {
        const masterItem = items.find(m => m.id === it.itemId);
        return {
          id: it.id || `pur-edit-item-${idx}`,
          itemId: it.itemId || '',
          name: it.name,
          category: masterItem?.category || 'General Supplies',
          hsnSac: it.hsnSac,
          unit: it.unit || 'PCS',
          qty: it.qty,
          rate: it.rate,
          discountPercent: it.discountPercent || 0,
          gstRate: it.gstRate || 18,
        };
      }));
    } else {
      setLineItems([createDefaultLineItem()]);
    }
    setShowFormModal(true);
  };

  // Close form modal
  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingInvoice(null);
    if (onCloseCreate) onCloseCreate();
  };

  // Item Grid Manipulation
  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, createDefaultLineItem()]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter(row => row.id !== id));
  };

  const handleUpdateLineItem = (id: string, field: keyof PurchaseLineItemState, value: any) => {
    setLineItems(prev => prev.map(row => {
      if (row.id !== id) return row;
      
      // If user selected an item from dropdown, auto-fill item details
      if (field === 'itemId') {
        const it = items.find(i => i.id === value);
        if (it) {
          return {
            ...row,
            itemId: it.id,
            name: it.name,
            category: it.category || 'General Supplies',
            hsnSac: it.hsnSac,
            unit: it.unit || 'PCS',
            rate: it.purchaseRate || row.rate,
            gstRate: it.gstRate || 18,
          };
        }
      }
      return { ...row, [field]: value };
    }));
  };

  // Calculations for Line Items & Tax Integrity
  const calculatedItems = useMemo(() => {
    return lineItems.map((row, idx) => {
      const gross = (row.qty || 0) * (row.rate || 0);
      const discountPercent = Math.max(0, Math.min(100, row.discountPercent || 0));
      const discountAmount = Number(((gross * discountPercent) / 100).toFixed(2));
      const taxableValue = Math.max(0, gross - discountAmount);
      const gstRate = row.gstRate || 0;
      const taxTotal = Number(((taxableValue * gstRate) / 100).toFixed(2));

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterstate) {
        igst = taxTotal;
      } else {
        cgst = Number((taxTotal / 2).toFixed(2));
        sgst = Number((taxTotal / 2).toFixed(2));
      }

      const total = Number((taxableValue + taxTotal).toFixed(2));

      return {
        id: row.id || `pur-calc-${idx}`,
        itemId: row.itemId,
        name: row.name,
        category: row.category,
        hsnSac: row.hsnSac,
        unit: row.unit,
        qty: row.qty,
        rate: row.rate,
        discountPercent,
        discountAmount,
        taxableValue,
        gstRate,
        cgst,
        sgst,
        igst,
        cess: 0,
        total,
      };
    });
  }, [lineItems, isInterstate]);

  // Grand Totals Summary
  const subtotalGross = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + (it.qty * it.rate), 0);
  }, [calculatedItems]);

  const totalDiscount = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + it.discountAmount, 0);
  }, [calculatedItems]);

  const totalTaxable = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + it.taxableValue, 0);
  }, [calculatedItems]);

  const totalCgst = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + it.cgst, 0);
  }, [calculatedItems]);

  const totalSgst = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + it.sgst, 0);
  }, [calculatedItems]);

  const totalIgst = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + it.igst, 0);
  }, [calculatedItems]);

  const totalTax = useMemo(() => {
    return totalCgst + totalSgst + totalIgst;
  }, [totalCgst, totalSgst, totalIgst]);

  const rawGrandTotal = useMemo(() => {
    return totalTaxable + totalTax + (freight || 0) + (otherCharges || 0);
  }, [totalTaxable, totalTax, freight, otherCharges]);

  const grandTotal = useMemo(() => {
    return Math.round(rawGrandTotal);
  }, [rawGrandTotal]);

  const roundOff = useMemo(() => {
    return Number((grandTotal - rawGrandTotal).toFixed(2));
  }, [grandTotal, rawGrandTotal]);

  // HSN-wise Tax Summary Table
  const hsnSummary = useMemo(() => {
    const map = new Map<string, {
      hsnSac: string;
      gstRate: number;
      taxable: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
    }>();

    calculatedItems.forEach(it => {
      const key = `${it.hsnSac}_${it.gstRate}`;
      const existing = map.get(key) || {
        hsnSac: it.hsnSac,
        gstRate: it.gstRate,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
      };

      existing.taxable += it.taxableValue;
      existing.cgst += it.cgst;
      existing.sgst += it.sgst;
      existing.igst += it.igst;
      existing.totalTax += (it.cgst + it.sgst + it.igst);

      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [calculatedItems]);

  // Form Submit Handler: Supports both Create and Update
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert('Please select a valid supplier/vendor.');
      return;
    }
    if (calculatedItems.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    const payloadItems: InvoiceItem[] = calculatedItems.map(it => ({
      id: it.id,
      itemId: it.itemId,
      name: it.name,
      hsnSac: it.hsnSac,
      unit: it.unit,
      qty: it.qty,
      rate: it.rate,
      discountPercent: it.discountPercent,
      taxableValue: it.taxableValue,
      gstRate: it.gstRate,
      cgst: it.cgst,
      sgst: it.sgst,
      igst: it.igst,
      cess: 0,
      total: it.total,
    }));

    const purchasePayload = {
      supplierInvoiceNo: supplierInvoiceNo.trim() || `SUP-${Date.now().toString().slice(-4)}`,
      date: invoiceDate,
      dueDate,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierGstin: selectedSupplier.gstin || '',
      supplierStateCode: selectedSupplier.stateCode || '',
      items: payloadItems,
      paymentMode,
      paymentStatus,
      paidAmount: paymentStatus === 'PAID' ? grandTotal : paidAmount,
      taxableAmount: totalTaxable,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      freight: freight || 0,
      otherCharges: otherCharges || 0,
      roundOff,
      grandTotal,
      status: 'POSTED' as const,
      itcEligible,
      itcClaimed: itcEligible,
      notes,
    };

    // If Updating: Remove old entry first to maintain data integrity, then re-create
    if (editingInvoice) {
      deletePurchaseInvoice(editingInvoice.id);
    }

    // Create / Save Purchase Bill
    createPurchaseInvoice(purchasePayload);

    handleCloseForm();
  };

  // Direct return calculations
  const dnSupplier = parties.find(p => p.id === dnSupplierId);
  const dnItem = items.find(i => i.id === dnItemId);
  const isDnInterstate = dnSupplier && activeCompany && dnSupplier.stateCode !== activeCompany.stateCode;
  const dnTaxable = dnQty * dnRate;
  const dnGstRate = dnItem?.gstRate || 18;
  const dnTaxTotal = (dnTaxable * dnGstRate) / 100;
  const dnCgst = isDnInterstate ? 0 : dnTaxTotal / 2;
  const dnSgst = isDnInterstate ? 0 : dnTaxTotal / 2;
  const dnIgst = isDnInterstate ? dnTaxTotal : 0;
  const dnGrandTotal = Math.round(dnTaxable + dnTaxTotal);

  // Submit return from existing purchase bill
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningPurchase) return;

    const newDn = createDebitNote({
      originalInvoiceId: returningPurchase.id,
      originalSupplierInvoiceNo: returningPurchase.supplierInvoiceNo || returningPurchase.invoiceNo,
      date: new Date().toISOString().substring(0, 10),
      supplierId: returningPurchase.supplierId,
      supplierName: returningPurchase.supplierName,
      supplierGstin: returningPurchase.supplierGstin,
      items: returningPurchase.items,
      taxableAmount: returningPurchase.taxableAmount,
      cgst: returningPurchase.cgst,
      sgst: returningPurchase.sgst,
      igst: returningPurchase.igst,
      totalAmount: returningPurchase.grandTotal,
      reason: returnReason,
    });

    setReturningPurchase(null);
    setSelectedPrintDebitNote(newDn);
  };

  // Submit direct debit note
  const handleDirectReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dnSupplier || !dnItem) return;

    const lineItem: InvoiceItem = {
      id: 'dn-item-' + Date.now(),
      itemId: dnItem.id,
      name: dnItem.name,
      hsnSac: dnItem.hsnSac,
      unit: dnItem.unit,
      qty: dnQty,
      rate: dnRate,
      discountPercent: 0,
      taxableValue: dnTaxable,
      gstRate: dnGstRate,
      cgst: dnCgst,
      sgst: dnSgst,
      igst: dnIgst,
      cess: 0,
      total: dnGrandTotal,
    };

    const newDn = createDebitNote({
      originalInvoiceId: 'direct',
      originalSupplierInvoiceNo: dnOriginalBillNo,
      date: new Date().toISOString().substring(0, 10),
      supplierId: dnSupplier.id,
      supplierName: dnSupplier.name,
      supplierGstin: dnSupplier.gstin,
      items: [lineItem],
      taxableAmount: dnTaxable,
      cgst: dnCgst,
      sgst: dnSgst,
      igst: dnIgst,
      totalAmount: dnGrandTotal,
      reason: dnReason,
    });

    setShowDirectReturnModal(false);
    setSelectedPrintDebitNote(newDn);
  };

  // Export Purchase Invoices to Excel
  const handleExportPurchasesExcel = () => {
    const rows = [
      ['PURCHASE REGISTER (INWARD SUPPLIES)'],
      ['Company:', activeCompany?.name || '', 'GSTIN:', activeCompany?.gstin || ''],
      [''],
      ['Internal Bill No', 'Vendor Name', 'Vendor GSTIN', 'Supplier Bill Ref', 'Date', 'Due Date', 'Taxable Val (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Amount (₹)', 'ITC Status']
    ];

    purchaseInvoices.forEach(rawP => {
      const p = rawP as ExtendedPurchaseInvoice;
      rows.push([
        p.invoiceNo,
        p.supplierName,
        p.supplierGstin || 'Unregistered',
        p.supplierInvoiceNo,
        p.date,
        p.dueDate || p.date,
        p.taxableAmount,
        p.cgst,
        p.sgst,
        p.igst,
        p.grandTotal,
        p.itcEligible ? 'Eligible' : 'Ineligible'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase_Register');
    XLSX.writeFile(wb, `Purchase_Register_${activeCompany?.gstin || 'co'}.xlsx`);
  };

  // Export Debit Notes to Excel
  const handleExportDebitNotesExcel = () => {
    const rows = [
      ['PURCHASE RETURN / DEBIT NOTE REGISTER'],
      ['Company:', activeCompany?.name || '', 'GSTIN:', activeCompany?.gstin || ''],
      [''],
      ['Debit Note No', 'Date', 'Supplier Name', 'Supplier GSTIN', 'Against Bill Ref', 'Taxable Val (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Debit (₹)', 'Reason for Return']
    ];

    debitNotes.forEach(dn => {
      rows.push([
        dn.debitNoteNo,
        dn.date,
        dn.supplierName,
        dn.supplierGstin || 'Unregistered',
        dn.originalSupplierInvoiceNo,
        dn.taxableAmount,
        dn.cgst,
        dn.sgst,
        dn.igst,
        dn.totalAmount,
        dn.reason
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Debit_Notes_Returns');
    XLSX.writeFile(wb, `Purchase_Returns_Debit_Notes_${activeCompany?.gstin || 'co'}.xlsx`);
  };

  const q = (searchQuery || '').trim().toLowerCase();
  const filteredInvoices = purchaseInvoices.filter(p => {
    if (!isDateInSelectedPeriod(p.date)) return false;
    const billNum = (p.invoiceNo || '').toLowerCase();
    const supName = (p.supplierName || '').toLowerCase();
    const supInv = (p.supplierInvoiceNo || '').toLowerCase();
    return !q || billNum.includes(q) || supName.includes(q) || supInv.includes(q);
  });

  const filteredDebitNotes = debitNotes.filter(dn => {
    if (!isDateInSelectedPeriod(dn.date)) return false;
    const num = (dn.debitNoteNo || '').toLowerCase();
    const sup = (dn.supplierName || '').toLowerCase();
    const ref = (dn.originalSupplierInvoiceNo || '').toLowerCase();
    return !q || num.includes(q) || sup.includes(q) || ref.includes(q);
  });

  // Calculate high-level metrics for dashboard header
  const totalInwardValue = filteredInvoices.reduce((s, p) => s + p.grandTotal, 0);
  const totalItcAvailable = filteredInvoices.reduce((s, p) => s + (p.cgst + p.sgst + p.igst), 0);
  const totalUnpaidLiability = filteredInvoices
    .filter(p => p.paymentStatus !== 'PAID')
    .reduce((s, p) => s + (p.grandTotal - (p.paidAmount || 0)), 0);

  return (
    <div id="purchase-module-root" className="space-y-6 pb-24 lg:pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Top Header Card */}
      <div id="purchase-header-banner" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Purchase &amp; Inward Invoices
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                {selectedPeriodLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Record inward supplier bills, track HSN-wise tax deductions, monitor Input Tax Credit (ITC), and issue debit notes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'BILLS' ? (
              <>
                <button
                  id="purchase-export-excel-btn"
                  onClick={handleExportPurchasesExcel}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Register</span>
                </button>
                <button
                  id="purchase-create-new-btn"
                  onClick={handleOpenCreate}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Record Purchase Bill</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id="purchase-export-dn-excel-btn"
                  onClick={handleExportDebitNotesExcel}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Returns</span>
                </button>
                <button
                  id="purchase-issue-dn-btn"
                  onClick={() => setShowDirectReturnModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Issue Debit Note</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Statistical Summary Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inward Purchases ({filteredInvoices.length})</div>
            <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {formatINR(totalInwardValue)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Eligible Input Tax Credit (3B)</div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
              {formatINR(totalItcAvailable)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Vendor Dues</div>
            <div className="text-base sm:text-lg font-bold font-mono text-amber-700 dark:text-amber-300 mt-0.5">
              {formatINR(totalUnpaidLiability)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-6 text-xs font-bold">
          <button
            id="tab-purchase-bills"
            onClick={() => setActiveTab('BILLS')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'BILLS'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Inward Purchase Bills ({purchaseInvoices.length})</span>
          </button>

          <button
            id="tab-purchase-returns"
            onClick={() => setActiveTab('RETURNS')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'RETURNS'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Purchase Returns / Debit Notes ({debitNotes.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="purchase-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'BILLS' ? "Search vendor, bill no, GSTIN..." : "Search supplier, debit note ref..."}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Tab 1: Purchase Bills Table */}
      {activeTab === 'BILLS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table id="purchase-invoices-table" className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Bill Identification</th>
                  <th className="px-4 py-3.5">Vendor &amp; GST Details</th>
                  <th className="px-4 py-3.5">Dates &amp; Payment</th>
                  <th className="px-4 py-3.5 text-right">Taxable Value</th>
                  <th className="px-4 py-3.5 text-right">GST ITC Amount</th>
                  <th className="px-4 py-3.5 text-right">Total Payable</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.map(rawBill => {
                  const bill = rawBill as ExtendedPurchaseInvoice;
                  const itcTotal = (bill.cgst || 0) + (bill.sgst || 0) + (bill.igst || 0);
                  const isPaid = bill.paymentStatus === 'PAID';
                  const isPartial = bill.paymentStatus === 'PARTIAL';
                  
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">{bill.invoiceNo}</div>
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          Ref: #{bill.supplierInvoiceNo || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{bill.supplierName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>GSTIN: {bill.supplierGstin || 'Unregistered'}</span>
                          {bill.supplierStateCode && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              State: {bill.supplierStateCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">Bill: {bill.date}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Due: {bill.dueDate || bill.date}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {formatINR(bill.taxableAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatINR(itcTotal)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatINR(bill.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col gap-1 items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isPartial 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {bill.paymentStatus || 'UNPAID'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            ITC 3B Eligible
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View & Print Button */}
                          <button
                            onClick={() => setSelectedPrintBill(bill)}
                            className="p-2 border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                            title="View / Print Purchase Voucher"
                            aria-label="View or Print Purchase Voucher"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit / Update Button */}
                          <button
                            onClick={() => handleOpenEdit(bill)}
                            className="p-2 border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                            title="Update / Edit Purchase Bill"
                            aria-label="Edit Purchase Bill"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Return (Debit Note) Button */}
                          <button
                            onClick={() => setReturningPurchase(bill)}
                            className="p-2 border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                            title="Issue Purchase Return (Debit Note)"
                            aria-label="Issue Purchase Return"
                          >
                            <CornerDownRight className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently delete purchase invoice ${bill.invoiceNo} (Ref: ${bill.supplierInvoiceNo})?`)) {
                                deletePurchaseInvoice(bill.id);
                              }
                            }}
                            className="p-2 border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                            title="Delete purchase bill"
                            aria-label="Delete Purchase Bill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300">No purchase bills found</div>
                        <p className="text-xs text-slate-400">
                          Record your first inward invoice or adjust your search / period filter above.
                        </p>
                        <button
                          onClick={handleOpenCreate}
                          className="mt-2 px-4 py-2 min-h-[40px] rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Record Purchase Bill</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Purchase Returns (Debit Notes) Table */}
      {activeTab === 'RETURNS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table id="debit-notes-table" className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Debit Note No</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Supplier Name &amp; GSTIN</th>
                  <th className="px-4 py-3.5">Against Bill Ref</th>
                  <th className="px-4 py-3.5 text-right">Taxable Val</th>
                  <th className="px-4 py-3.5 text-right">GST Reversed</th>
                  <th className="px-4 py-3.5 text-right">Debit Note Total</th>
                  <th className="px-4 py-3.5">Reason</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDebitNotes.map(dn => (
                  <tr key={dn.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {dn.debitNoteNo}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{dn.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{dn.supplierName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{dn.supplierGstin || 'Unregistered'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {dn.originalSupplierInvoiceNo || 'Direct Entry'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatINR(dn.taxableAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                      {formatINR((dn.cgst || 0) + (dn.sgst || 0) + (dn.igst || 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(dn.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {dn.reason}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPrintDebitNote(dn)}
                          className="px-2.5 py-1.5 min-h-[34px] rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors cursor-pointer shadow-2xs"
                          title="Print Debit Note"
                          aria-label="Print Debit Note"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete debit note ${dn.debitNoteNo}?`)) {
                              deleteDebitNote(dn.id);
                            }
                          }}
                          className="p-1.5 border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="Delete debit note"
                          aria-label="Delete debit note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDebitNotes.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      <RotateCcw className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      No purchase returns or debit notes recorded in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXPANSIVE ACCOUNTING-GRADE PURCHASE ENTRY & UPDATE MODAL / WORKSPACE      */}
      {/* ========================================================================= */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] my-auto">
            
            {/* Modal Top Header Bar */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`p-2.5 rounded-2xl ${
                  editingInvoice 
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {editingInvoice ? <Edit className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {editingInvoice ? 'Update Purchase Invoice' : 'Record Inward Purchase Bill'}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      editingInvoice 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {editingInvoice ? `Editing: ${editingInvoice.invoiceNo}` : 'New Bill Entry'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editingInvoice 
                      ? 'Modify supplier billing credentials, item lines, tax rates, or purchase discounts.'
                      : 'Capture vendor tax invoice details, match HSN codes, and account for inward GST credit.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSavePurchase} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">

              {/* 1. HEADER SECTION: Supplier & Invoice Credentials */}
              <div id="purchase-form-header-section" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Supplier Selection & GST Details Card */}
                <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span>Vendor / Supplier Information</span>
                    </span>
                    {selectedSupplier && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isInterstate 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {isInterstate ? 'Interstate Supply (IGST)' : 'Intrastate Supply (CGST + SGST)'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Supplier / Vendor *
                    </label>
                    <select
                      id="purchase-supplier-select"
                      value={supplierId}
                      onChange={e => setSupplierId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      required
                    >
                      {parties.filter(p => p.type !== 'CUSTOMER').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.city || p.state} ({p.gstin || 'Unregistered'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supplier Details Preview Bar */}
                  {selectedSupplier && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Vendor GSTIN:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {selectedSupplier.gstin || 'Unregistered'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">State &amp; Code:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedSupplier.stateCode ? `${selectedSupplier.stateCode} - ${selectedSupplier.state}` : selectedSupplier.state}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">PAN Number:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {selectedSupplier.pan || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Contact Mobile:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {selectedSupplier.mobile || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bill Credentials Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Bill Reference &amp; Dates</span>
                  </span>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier's Invoice / Bill No *
                    </label>
                    <input
                      id="purchase-supplier-invoice-no"
                      type="text"
                      required
                      value={supplierInvoiceNo}
                      onChange={e => setSupplierInvoiceNo(e.target.value)}
                      placeholder="e.g. INV-9901"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bill Date *
                      </label>
                      <input
                        id="purchase-invoice-date"
                        type="date"
                        required
                        value={invoiceDate}
                        onChange={e => setInvoiceDate(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Due Date
                      </label>
                      <input
                        id="purchase-due-date"
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. ITEM GRID / TABLE */}
              <div id="purchase-form-item-grid" className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span>Item Master &amp; Taxable Inward Grid</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Add goods/services with individual HSN codes, discounts, and GST rates.
                    </p>
                  </div>

                  <button
                    id="purchase-add-row-btn"
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-500/30"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Add Line Item</span>
                  </button>
                </div>

                {/* Accounting-Grade Data Grid Table */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-2.5 py-3 text-center w-10">#</th>
                          <th className="px-3 py-3 min-w-[200px]">Product / Service Description</th>
                          <th className="px-3 py-3 min-w-[110px]">Category</th>
                          <th className="px-3 py-3 w-28">HSN / SAC</th>
                          <th className="px-2.5 py-3 w-20 text-center">Qty</th>
                          <th className="px-2.5 py-3 w-20">Unit</th>
                          <th className="px-3 py-3 w-28 text-right">Rate (₹)</th>
                          <th className="px-2.5 py-3 w-24 text-center">Disc (%)</th>
                          <th className="px-2.5 py-3 w-24 text-center">GST Rate</th>
                          <th className="px-3 py-3 w-28 text-right">Tax Amt (₹)</th>
                          <th className="px-3 py-3 w-32 text-right">Net Total (₹)</th>
                          <th className="px-2.5 py-3 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {calculatedItems.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Row Index */}
                            <td className="px-2.5 py-2.5 text-center font-mono text-slate-400 font-bold">
                              {idx + 1}
                            </td>

                            {/* Product / Service Name (Select or Input) */}
                            <td className="px-3 py-2.5 space-y-1">
                              <select
                                value={row.itemId}
                                onChange={e => handleUpdateLineItem(row.id, 'itemId', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                              >
                                {items.map(it => (
                                  <option key={it.id} value={it.id}>
                                    {it.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={row.name}
                                onChange={e => handleUpdateLineItem(row.id, 'name', e.target.value)}
                                placeholder="Custom Description / Variant"
                                className="w-full px-2 py-1 rounded border border-slate-200/80 dark:border-slate-700 bg-transparent text-[11px] text-slate-600 dark:text-slate-300"
                              />
                            </td>

                            {/* Category */}
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                value={row.category || 'General'}
                                onChange={e => handleUpdateLineItem(row.id, 'category', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-700 dark:text-slate-300 font-medium"
                              />
                            </td>

                            {/* HSN / SAC */}
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                value={row.hsnSac}
                                onChange={e => handleUpdateLineItem(row.id, 'hsnSac', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white font-semibold text-center"
                              />
                            </td>

                            {/* Quantity */}
                            <td className="px-2.5 py-2.5">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={row.qty}
                                onChange={e => handleUpdateLineItem(row.id, 'qty', parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-center font-bold text-slate-900 dark:text-white"
                              />
                            </td>

                            {/* Unit */}
                            <td className="px-2.5 py-2.5">
                              <select
                                value={row.unit}
                                onChange={e => handleUpdateLineItem(row.id, 'unit', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 text-center"
                              >
                                <option value="PCS">PCS</option>
                                <option value="KGS">KGS</option>
                                <option value="BOX">BOX</option>
                                <option value="MTR">MTR</option>
                                <option value="NOS">NOS</option>
                                <option value="LTR">LTR</option>
                                <option value="JOB">JOB</option>
                              </select>
                            </td>

                            {/* Rate (Purchase Price) */}
                            <td className="px-3 py-2.5">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.rate}
                                onChange={e => handleUpdateLineItem(row.id, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-right font-bold text-slate-900 dark:text-white"
                              />
                            </td>

                            {/* Discount (%) */}
                            <td className="px-2.5 py-2.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="any"
                                value={row.discountPercent}
                                onChange={e => handleUpdateLineItem(row.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-center text-slate-700 dark:text-slate-300"
                              />
                            </td>

                            {/* GST Rate (%) */}
                            <td className="px-2.5 py-2.5">
                              <select
                                value={row.gstRate}
                                onChange={e => handleUpdateLineItem(row.id, 'gstRate', parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white text-center"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>

                            {/* Tax Amount */}
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatINR(row.cgst + row.sgst + row.igst)}
                            </td>

                            {/* Net Total */}
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatINR(row.total)}
                            </td>

                            {/* Action: Delete */}
                            <td className="px-2.5 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(row.id)}
                                disabled={calculatedItems.length <= 1}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                                title="Remove line item"
                                aria-label="Remove line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 3. SUMMARY / FOOTER SECTION: Breakdown & Calculations */}
              <div id="purchase-form-summary-section" className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                
                {/* Left Column (7 cols): HSN Tax Breakdown & Notes */}
                <div className="lg:col-span-7 space-y-4">
                  {/* HSN Tax Breakdown Table */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-emerald-600" />
                      <span>HSN-Wise Tax Breakdown (ITC Reconciliation)</span>
                    </span>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead className="text-slate-500 border-b border-slate-200 dark:border-slate-700 font-semibold">
                          <tr>
                            <th className="py-1.5">HSN/SAC</th>
                            <th className="py-1.5 text-right">Taxable Val (₹)</th>
                            <th className="py-1.5 text-center">GST %</th>
                            {isInterstate ? (
                              <th className="py-1.5 text-right">IGST (₹)</th>
                            ) : (
                              <>
                                <th className="py-1.5 text-right">CGST (₹)</th>
                                <th className="py-1.5 text-right">SGST (₹)</th>
                              </>
                            )}
                            <th className="py-1.5 text-right">Tax Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {hsnSummary.map(hs => (
                            <tr key={`${hs.hsnSac}_${hs.gstRate}`}>
                              <td className="py-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">{hs.hsnSac}</td>
                              <td className="py-1.5 text-right font-mono text-slate-700 dark:text-slate-300">{formatINR(hs.taxable)}</td>
                              <td className="py-1.5 text-center font-bold text-slate-800 dark:text-slate-200">{hs.gstRate}%</td>
                              {isInterstate ? (
                                <td className="py-1.5 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatINR(hs.igst)}</td>
                              ) : (
                                <>
                                  <td className="py-1.5 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatINR(hs.cgst)}</td>
                                  <td className="py-1.5 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatINR(hs.sgst)}</td>
                                </>
                              )}
                              <td className="py-1.5 text-right font-mono font-bold text-slate-900 dark:text-white">{formatINR(hs.totalTax)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment & Terms row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Status</label>
                      <select
                        value={paymentStatus}
                        onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-xs"
                      >
                        <option value="UNPAID">UNPAID (On Credit)</option>
                        <option value="PAID">PAID (Full Settlement)</option>
                        <option value="PARTIAL">PARTIAL PAYMENT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-xs"
                      >
                        <option value="CREDIT">CREDIT (Accounts Payable)</option>
                        <option value="BANK">BANK (NEFT / RTGS / IMPS)</option>
                        <option value="CASH">CASH</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes & ITC Eligibility */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={itcEligible}
                        onChange={e => setItcEligible(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Eligible for Input Tax Credit (ITC) under GSTR-3B Table 4(A)(5)
                      </span>
                    </label>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Inward Warehouse Notes</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="e.g. Received at warehouse gate #2, verified by stores"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column (5 cols): Detailed Financial Summary Card */}
                <div className="lg:col-span-5">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3.5">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block pb-1 border-b border-slate-200 dark:border-slate-700">
                      Summary &amp; Final Payable Calculation
                    </span>

                    <div className="space-y-2 text-xs">
                      {/* Subtotal (Gross) */}
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Gross Subtotal:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatINR(subtotalGross)}</span>
                      </div>

                      {/* Total Discount */}
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Total Purchase Discount:</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          - {formatINR(totalDiscount)}
                        </span>
                      </div>

                      {/* Net Taxable Amount */}
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>Net Taxable Value:</span>
                        <span className="font-mono font-bold">{formatINR(totalTaxable)}</span>
                      </div>

                      {/* Tax Breakdown */}
                      {isInterstate ? (
                        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                          <span>Integrated GST (IGST):</span>
                          <span className="font-mono">{formatINR(totalIgst)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                            <span>Central GST (CGST):</span>
                            <span className="font-mono">{formatINR(totalCgst)}</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                            <span>State GST (SGST):</span>
                            <span className="font-mono">{formatINR(totalSgst)}</span>
                          </div>
                        </>
                      )}

                      {/* Freight & Other Charges Inputs */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-slate-500 block mb-0.5">Freight / Delivery (₹):</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={freight}
                            onChange={e => setFreight(parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-right"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">Other Charges (₹):</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={otherCharges}
                            onChange={e => setOtherCharges(parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-right"
                          />
                        </div>
                      </div>

                      {/* Round-off Adjustment */}
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Round-off Adjustment:</span>
                        <span className="font-mono">{roundOff >= 0 ? `+${roundOff}` : roundOff}</span>
                      </div>

                      {/* Final Payable Amount */}
                      <div className="pt-3 border-t-2 border-slate-300 dark:border-slate-700 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Total Payable Amount:
                          </span>
                          <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                            {formatINR(grandTotal)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 italic text-right leading-tight">
                          {amountInWords(grandTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">
                  {editingInvoice ? (
                    <span className="text-amber-600 font-semibold">
                      * Updating will overwrite previous invoice records and adjust inventory stock movements.
                    </span>
                  ) : (
                    <span>* Posting this purchase bill will automatically increase current item inventory stocks.</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="purchase-save-btn"
                    type="submit"
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      editingInvoice 
                        ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingInvoice ? 'Update Purchase Invoice' : 'Post Purchase Bill'}</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROFESSIONAL GST PURCHASE BILL VOUCHER PRINT & PDF MODAL                  */}
      {/* ========================================================================= */}
      {selectedPrintBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
            
            {/* Top Bar for View Modal (Hidden on Print) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Purchase Invoice Voucher
                </span>
                <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {selectedPrintBill.invoiceNo}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  (Vendor Ref: #{selectedPrintBill.supplierInvoiceNo})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const bill = selectedPrintBill;
                    setSelectedPrintBill(null);
                    handleOpenEdit(bill);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-600" />
                  <span>Edit Bill</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setSelectedPrintBill(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Document Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 print:p-4 print:text-black">
              
              {/* Document Title Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 dark:border-slate-600 pb-4">
                <div>
                  <div className="text-xs uppercase tracking-widest font-black text-amber-600 dark:text-amber-400">
                    TAX INVOICE (INWARD VENDOR SUPPLY)
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {activeCompany?.name || 'PURCHASE VOUCHER'}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeCompany?.address}, {activeCompany?.city}, {activeCompany?.state} - {activeCompany?.pin}
                  </p>
                  <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                    GSTIN: {activeCompany?.gstin} • PAN: {activeCompany?.pan}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end">
                  {billQrUrl && (
                    <img src={billQrUrl} alt="Voucher QR Code" className="w-20 h-20 border border-slate-200 p-0.5 rounded-lg mb-1" />
                  )}
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    VOUCHER: {selectedPrintBill.invoiceNo}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    VENDOR REF: #{selectedPrintBill.supplierInvoiceNo}
                  </div>
                </div>
              </div>

              {/* Vendor & Invoice Metadata Columns */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">SUPPLIER / VENDOR DETAILS:</span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedPrintBill.supplierName}</div>
                  <div className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">GSTIN: {selectedPrintBill.supplierGstin || 'Unregistered'}</div>
                  <div className="text-slate-500 mt-0.5">State Code: {selectedPrintBill.supplierStateCode || 'N/A'}</div>
                </div>
                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-500">Invoice Date: </span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{selectedPrintBill.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Payment Due Date: </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedPrintBill.dueDate || selectedPrintBill.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Payment Status: </span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{selectedPrintBill.paymentStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ITC Status: </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedPrintBill.itcEligible ? 'Eligible for ITC (3B)' : 'Ineligible'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-2.5 text-center w-10">#</th>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">HSN</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">Taxable</th>
                      <th className="p-2.5 text-center">GST</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedPrintBill.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{it.name}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{it.hsnSac}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{it.qty} {it.unit}</td>
                        <td className="p-2.5 text-right font-mono">{formatINR(it.rate)}</td>
                        <td className="p-2.5 text-right font-mono">{formatINR(it.taxableValue)}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">{it.gstRate}%</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">{formatINR(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax & Total Summary */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2">
                <div className="space-y-1 text-xs max-w-sm">
                  <div className="font-bold text-slate-800 dark:text-slate-200">Amount in Words:</div>
                  <div className="text-slate-600 dark:text-slate-400 italic leading-relaxed">
                    {amountInWords(selectedPrintBill.grandTotal)}
                  </div>
                  {selectedPrintBill.notes && (
                    <div className="pt-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Notes: </span>
                      {selectedPrintBill.notes}
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-72 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatINR(selectedPrintBill.taxableAmount)}</span>
                  </div>
                  {selectedPrintBill.cgst > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>Central GST (CGST):</span>
                      <span className="font-mono">{formatINR(selectedPrintBill.cgst)}</span>
                    </div>
                  )}
                  {selectedPrintBill.sgst > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>State GST (SGST):</span>
                      <span className="font-mono">{formatINR(selectedPrintBill.sgst)}</span>
                    </div>
                  )}
                  {selectedPrintBill.igst > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>Integrated GST (IGST):</span>
                      <span className="font-mono">{formatINR(selectedPrintBill.igst)}</span>
                    </div>
                  )}
                  {selectedPrintBill.freight > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Freight &amp; Delivery:</span>
                      <span className="font-mono">{formatINR(selectedPrintBill.freight)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">{formatINR(selectedPrintBill.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Authorized Signature Box */}
              <div className="pt-8 mt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <div>Goods received and verified by Stores Department</div>
                  <div className="text-[10px] text-slate-400">Generated on {new Date().toLocaleDateString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800 dark:text-slate-200">For {activeCompany?.name || 'Company'}</div>
                  <div className="mt-8 border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                    Authorized Purchasing Officer
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modal: Debit Note / Purchase Return (From Existing Bill) */}
      {returningPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">
                  Issue Debit Note (Purchase Return)
                </h2>
                <p className="text-xs text-slate-500">Against bill #{returningPurchase.supplierInvoiceNo || returningPurchase.invoiceNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setReturningPurchase(null)}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                title="Close modal"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                >
                  <option value="Damaged goods received from vendor">Damaged goods received from vendor</option>
                  <option value="Quality defect / Not as per purchase order">Quality defect / Not as per purchase order</option>
                  <option value="Rate difference / Excess billing by vendor">Rate difference / Excess billing by vendor</option>
                  <option value="Expired / Nearing shelf-life">Expired / Nearing shelf-life</option>
                  <option value="Defective unit returned under warranty">Defective unit returned under warranty</option>
                </select>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 font-bold font-mono">
                Debit Note Total Value: {formatINR(returningPurchase.grandTotal)}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturningPurchase(null)}
                  className="px-4 py-2 min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 min-h-[40px] rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CornerDownRight className="w-4 h-4" />
                  <span>Confirm &amp; Issue Debit Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Debit Note (Without Bill) */}
      {showDirectReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Issue Direct Debit Note (Purchase Return)</h2>
              <button
                type="button"
                onClick={() => setShowDirectReturnModal(false)}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                title="Close modal"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vendor / Supplier *</label>
                <select
                  value={dnSupplierId}
                  onChange={e => setDnSupplierId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  required
                >
                  {parties.filter(p => p.type !== 'CUSTOMER').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gstin || 'Unregistered'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Original Supplier Bill / Invoice Ref *</label>
                <input
                  type="text"
                  required
                  value={dnOriginalBillNo}
                  onChange={e => setDnOriginalBillNo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  placeholder="e.g. INV-88219"
                />
              </div>

              {/* Item selection */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Returned Item Details</div>
                <div>
                  <select
                    value={dnItemId}
                    onChange={e => {
                      setDnItemId(e.target.value);
                      const it = items.find(i => i.id === e.target.value);
                      if (it) setDnRate(it.purchaseRate || 500);
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    {items.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.name} (HSN: {it.hsnSac})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Return Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={dnQty}
                      onChange={e => setDnQty(parseInt(e.target.value) || 1)}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={dnRate}
                      onChange={e => setDnRate(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-right"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm">
                  <span>Debit Value (with {dnGstRate}% GST):</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">{formatINR(dnGrandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Return</label>
                <select
                  value={dnReason}
                  onChange={e => setDnReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                >
                  <option value="Damaged goods received from vendor">Damaged goods received from vendor</option>
                  <option value="Quality defect / Not as per purchase order">Quality defect / Not as per purchase order</option>
                  <option value="Rate difference / Excess billing by vendor">Rate difference / Excess billing by vendor</option>
                  <option value="Expired / Nearing shelf-life">Expired / Nearing shelf-life</option>
                  <option value="Defective unit returned under warranty">Defective unit returned under warranty</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDirectReturnModal(false)}
                  className="px-4 py-2 min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 min-h-[40px] rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CornerDownRight className="w-4 h-4" />
                  <span>Issue Debit Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View / Print Debit Note */}
      {selectedPrintDebitNote && (
        <DebitNotePrintModal
          debitNote={selectedPrintDebitNote}
          onClose={() => setSelectedPrintDebitNote(null)}
        />
      )}

    </div>
  );
};
