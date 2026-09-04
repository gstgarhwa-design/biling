import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SalesInvoice, InvoiceItem, PaymentMode, PaymentStatus } from '../types';
import { formatINR, amountInWords } from '../data/indianStates';
import { 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  QrCode, 
  Truck, 
  Share2, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  CornerDownLeft,
  Lock,
  X,
  Download,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  CreditCard,
  MapPin
} from 'lucide-react';
import { isDateInFiscalPeriod, FISCAL_MONTHS } from '../utils/financialYears';
import { generateBulkSalesInvoicesPdf } from '../utils/bulkPdfExport';

interface SalesInvoiceModuleProps {
  onViewInvoice: (invoice: SalesInvoice) => void;
  onOpenEInvoice?: (invoiceId: string) => void;
  onOpenEWayBill?: (invoiceId: string) => void;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  initialEditingInvoice?: SalesInvoice | null;
  onClearEditingInvoice?: () => void;
}

export const SalesInvoiceModule: React.FC<SalesInvoiceModuleProps> = ({
  onViewInvoice,
  onOpenEInvoice,
  onOpenEWayBill,
  isCreateOpen = false,
  onCloseCreate,
  initialEditingInvoice,
  onClearEditingInvoice
}) => {
  const { 
    activeCompany, 
    salesInvoices, 
    parties, 
    items, 
    createSalesInvoice, 
    updateSalesInvoice, 
    cancelSalesInvoice, 
    duplicateSalesInvoice,
    createCreditNote,
    generateIRN,
    selectedFinancialYear,
    selectedMonth
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'POSTED' | 'E_INVOICE_PENDING' | 'E_WAY_PENDING'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(isCreateOpen);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [showAllPeriods, setShowAllPeriods] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  // Credit note return modal
  const [returningInvoice, setReturningInvoice] = useState<SalesInvoice | null>(null);
  const [returnReason, setReturnReason] = useState('Defective goods / Quality issue');

  // New Invoice Form state
  const defaultInvoiceNo = useMemo(() => {
    const prefix = activeCompany?.invoicePrefix || 'INV/25/';
    const series = (activeCompany?.invoiceNumberSeries || 100) + 1;
    return `${prefix}${String(series).padStart(4, '0')}`;
  }, [activeCompany]);

  const [invoiceNo, setInvoiceNo] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(parties.find(p => p.type !== 'SUPPLIER')?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CREDIT');
  const [notes, setNotes] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<'DRAFT' | 'POSTED'>('POSTED');

  // Party addresses
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // Dispatch details (Collapsible)
  const [showDispatchSection, setShowDispatchSection] = useState(false);
  const [dispatchAddress, setDispatchAddress] = useState('');
  const [dispatchState, setDispatchState] = useState('');
  const [dispatchStateCode, setDispatchStateCode] = useState('');

  // Transport details (Collapsible)
  const [showTransportSection, setShowTransportSection] = useState(false);
  const [transporterName, setTransporterName] = useState('');
  const [transporterId, setTransporterId] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transportMode, setTransportMode] = useState<'ROAD' | 'RAIL' | 'AIR' | 'SHIP'>('ROAD');
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  const [lrNo, setLrNo] = useState('');
  const [lrDate, setLrDate] = useState('');

  // Payment Received at invoice creation
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [bankName, setBankName] = useState('');

  const [lineItems, setLineItems] = useState<Array<{
    itemId: string;
    name: string;
    hsnSac: string;
    unit: string;
    qty: number;
    rate: number;
    discountPercent: number;
    discountAmount: number;
    gstRate: number;
  }>>([
    {
      itemId: items?.[0]?.id || '',
      name: items?.[0]?.name || '',
      hsnSac: items?.[0]?.hsnSac || '',
      unit: items?.[0]?.unit || 'PCS',
      qty: 1,
      rate: items?.[0]?.salesRate || 1000,
      discountPercent: 0,
      discountAmount: 0,
      gstRate: items?.[0]?.gstRate || 18,
    }
  ]);

  // Selected customer details
  const selectedCustomer = parties.find(p => p.id === selectedCustomerId);
  const isInterstate = selectedCustomer && activeCompany && selectedCustomer.stateCode !== activeCompany.stateCode;

  // Auto-fill customer addresses when selected customer changes
  useEffect(() => {
    if (selectedCustomer && !editingInvoice) {
      setBillingAddress(selectedCustomer.billingAddress || `${selectedCustomer.city}, ${selectedCustomer.state}`);
      setShippingAddress(selectedCustomer.shippingAddress || selectedCustomer.billingAddress || `${selectedCustomer.city}, ${selectedCustomer.state}`);
    }
  }, [selectedCustomerId, selectedCustomer, editingInvoice]);

  // Reset/Initialize modal on opening
  useEffect(() => {
    if (showCreateModal && !editingInvoice) {
      setInvoiceNo(defaultInvoiceNo);
      setPaidAmount(0);
      setPaymentRefNo('');
      setBankName(activeCompany?.bankName || '');
      if (selectedCustomer) {
        setBillingAddress(selectedCustomer.billingAddress || `${selectedCustomer.city}, ${selectedCustomer.state}`);
        setShippingAddress(selectedCustomer.shippingAddress || selectedCustomer.billingAddress || `${selectedCustomer.city}, ${selectedCustomer.state}`);
      }
      if (activeCompany) {
        setDispatchAddress(activeCompany.address || '');
        setDispatchState(activeCompany.state || '');
        setDispatchStateCode(activeCompany.stateCode || '');
      }
    }
  }, [showCreateModal, editingInvoice, defaultInvoiceNo, selectedCustomer, activeCompany]);

  // Calculate items with GST
  const calculatedItems: InvoiceItem[] = lineItems.map((item, idx) => {
    const gross = (item.qty || 0) * (item.rate || 0);
    let discount = item.discountAmount > 0 
      ? item.discountAmount 
      : (gross * (item.discountPercent || 0)) / 100;
    if (discount > gross) discount = gross;
    const taxable = Math.max(0, gross - discount);
    const taxTotal = (taxable * item.gstRate) / 100;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterstate) {
      igst = taxTotal;
    } else {
      cgst = taxTotal / 2;
      sgst = taxTotal / 2;
    }

    return {
      id: 'inv-item-' + idx,
      itemId: item.itemId,
      name: item.name,
      hsnSac: item.hsnSac,
      unit: item.unit,
      qty: item.qty,
      rate: item.rate,
      discountPercent: item.discountPercent,
      taxableValue: taxable,
      gstRate: item.gstRate,
      cgst,
      sgst,
      igst,
      cess: 0,
      total: taxable + taxTotal,
    };
  });

  const taxableAmount = calculatedItems.reduce((sum, i) => sum + i.taxableValue, 0);
  const totalCgst = calculatedItems.reduce((sum, i) => sum + i.cgst, 0);
  const totalSgst = calculatedItems.reduce((sum, i) => sum + i.sgst, 0);
  const totalIgst = calculatedItems.reduce((sum, i) => sum + i.igst, 0);
  const rawTotal = taxableAmount + totalCgst + totalSgst + totalIgst;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Number((grandTotal - rawTotal).toFixed(2));

  const handleAddLineItem = () => {
    const firstItem = items?.[0];
    if (!firstItem) return;
    setLineItems(prev => [
      ...prev,
      {
        itemId: firstItem.id,
        name: firstItem.name,
        hsnSac: firstItem.hsnSac,
        unit: firstItem.unit,
        qty: 1,
        rate: firstItem.salesRate,
        discountPercent: 0,
        discountAmount: 0,
        gstRate: firstItem.gstRate,
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, itemId: string) => {
    const found = items.find(i => i.id === itemId);
    if (!found) return;
    setLineItems(prev => prev.map((li, idx) => {
      if (idx !== index) return li;
      const gross = li.qty * found.salesRate;
      const discountAmt = Number(((gross * (li.discountPercent || 0)) / 100).toFixed(2));
      return {
        ...li,
        itemId: found.id,
        name: found.name,
        hsnSac: found.hsnSac,
        unit: found.unit,
        rate: found.salesRate,
        discountAmount: discountAmt,
        gstRate: found.gstRate,
      };
    }));
  };

  const handleQtyChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty);
    setLineItems(prev => prev.map((li, idx) => {
      if (idx !== index) return li;
      const gross = validQty * li.rate;
      const discountAmt = Number(((gross * (li.discountPercent || 0)) / 100).toFixed(2));
      return { ...li, qty: validQty, discountAmount: discountAmt };
    }));
  };

  const handleRateChange = (index: number, rate: number) => {
    const validRate = Math.max(0, rate);
    setLineItems(prev => prev.map((li, idx) => {
      if (idx !== index) return li;
      const gross = li.qty * validRate;
      const discountAmt = Number(((gross * (li.discountPercent || 0)) / 100).toFixed(2));
      return { ...li, rate: validRate, discountAmount: discountAmt };
    }));
  };

  const handleDiscountPercentChange = (index: number, pct: number) => {
    const validPct = Math.min(100, Math.max(0, pct));
    setLineItems(prev => prev.map((li, idx) => {
      if (idx !== index) return li;
      const gross = li.qty * li.rate;
      const discountAmt = Number(((gross * validPct) / 100).toFixed(2));
      return { ...li, discountPercent: validPct, discountAmount: discountAmt };
    }));
  };

  const handleDiscountAmountChange = (index: number, amt: number) => {
    setLineItems(prev => prev.map((li, idx) => {
      if (idx !== index) return li;
      const gross = li.qty * li.rate;
      const validAmt = Math.min(gross, Math.max(0, amt));
      const pct = gross > 0 ? Number(((validAmt / gross) * 100).toFixed(2)) : 0;
      return { ...li, discountAmount: validAmt, discountPercent: pct };
    }));
  };

  const handleStartEdit = (inv: SalesInvoice) => {
    // 1. BILL EDIT / UPDATE + E-INVOICE LOCK
    if (inv.irnStatus === 'GENERATED' || inv.irn) {
      alert('This bill is LOCKED because an official Government e-Invoice (IRN) has been generated. Modifying a locked bill is strictly restricted under GST law. Please issue a Credit Note or cancel the IRN first.');
      return;
    }

    setEditingInvoice(inv);
    setInvoiceNo(inv.invoiceNo);
    setSelectedCustomerId(inv.customerId);
    setInvoiceDate(inv.date);
    setDueDate(inv.dueDate);
    setPaymentTerms(inv.paymentTerms || 'Net 30 Days');
    setPaymentMode(inv.paymentMode);
    setNotes(inv.notes || '');
    setInvoiceStatus(inv.status === 'CANCELLED' ? 'DRAFT' : inv.status);
    setBillingAddress(inv.billingAddress || '');
    setShippingAddress(inv.shippingAddress || '');
    setDispatchAddress(inv.dispatchAddress || '');
    setDispatchState(inv.dispatchState || '');
    setDispatchStateCode(inv.dispatchStateCode || '');
    setTransporterName(inv.transporterName || '');
    setTransporterId(inv.transporterId || '');
    setVehicleNo(inv.vehicleNo || '');
    setTransportMode(inv.transportMode || 'ROAD');
    setDistanceKm(inv.distanceKm || '');
    setLrNo(inv.lrNo || '');
    setLrDate(inv.lrDate || '');
    setPaidAmount(inv.paidAmount || inv.paymentReceived || 0);
    setPaymentDate(inv.paymentDate || inv.date);
    setPaymentRefNo(inv.paymentRefNo || '');
    setBankName(inv.bankAccount || '');

    if (inv.dispatchAddress || inv.dispatchState) setShowDispatchSection(true);
    if (inv.transporterName || inv.vehicleNo || inv.lrNo) setShowTransportSection(true);

    if (inv.items && inv.items.length > 0) {
      setLineItems(inv.items.map(it => {
        const gross = it.qty * it.rate;
        const discountAmt = it.discountPercent ? Number(((gross * it.discountPercent) / 100).toFixed(2)) : 0;
        return {
          itemId: it.itemId,
          name: it.name,
          hsnSac: it.hsnSac,
          unit: it.unit,
          qty: it.qty,
          rate: it.rate,
          discountPercent: it.discountPercent || 0,
          discountAmount: discountAmt,
          gstRate: it.gstRate,
        };
      }));
    }

    setShowCreateModal(true);
  };

  useEffect(() => {
    if (initialEditingInvoice) {
      handleStartEdit(initialEditingInvoice);
      if (onClearEditingInvoice) {
        onClearEditingInvoice();
      }
    }
  }, [initialEditingInvoice]);

  const handleDuplicate = (inv: SalesInvoice) => {
    // 2. COPY / DUPLICATE BILL
    const duplicated = duplicateSalesInvoice(inv.id);
    if (duplicated) {
      handleStartEdit(duplicated);
    }
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    const finalPaid = Math.max(0, Number(paidAmount) || 0);
    const computedOutstanding = Math.max(0, grandTotal - finalPaid);
    const computedStatus: PaymentStatus = finalPaid >= grandTotal 
      ? 'PAID' 
      : (finalPaid > 0 ? 'PARTIAL' : (paymentMode === 'CREDIT' ? 'UNPAID' : 'PAID'));

    if (editingInvoice) {
      // Strict check: if invoice is locked, cannot update
      if (editingInvoice.irnStatus === 'GENERATED' || editingInvoice.irn) {
        alert('This bill is LOCKED because an official Government e-Invoice (IRN) has been generated. Modifying a locked bill is strictly restricted.');
        return;
      }

      const ok = updateSalesInvoice(editingInvoice.id, {
        invoiceNo: invoiceNo.trim() || editingInvoice.invoiceNo,
        date: invoiceDate,
        dueDate,
        paymentTerms,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerGstin: selectedCustomer.gstin,
        customerStateCode: selectedCustomer.stateCode,
        billingAddress: billingAddress || selectedCustomer.billingAddress || `${selectedCustomer.city}, ${selectedCustomer.state}`,
        shippingAddress: shippingAddress || billingAddress || selectedCustomer.shippingAddress || selectedCustomer.billingAddress,
        dispatchAddress: showDispatchSection || dispatchAddress ? dispatchAddress : undefined,
        dispatchState: showDispatchSection || dispatchState ? dispatchState : undefined,
        dispatchStateCode: showDispatchSection || dispatchStateCode ? dispatchStateCode : undefined,
        transporterName: showTransportSection || transporterName ? transporterName : undefined,
        transporterId: showTransportSection || transporterId ? transporterId : undefined,
        vehicleNo: showTransportSection || vehicleNo ? vehicleNo : undefined,
        transportMode: showTransportSection || transportMode ? transportMode : undefined,
        distanceKm: (showTransportSection && Number(distanceKm) > 0) ? Number(distanceKm) : undefined,
        lrNo: showTransportSection || lrNo ? lrNo : undefined,
        lrDate: showTransportSection || lrDate ? lrDate : undefined,
        items: calculatedItems,
        paymentMode,
        paymentStatus: computedStatus,
        paidAmount: finalPaid,
        paymentReceived: finalPaid,
        outstandingAmount: computedOutstanding,
        paymentDate: finalPaid > 0 ? paymentDate : undefined,
        paymentRefNo: finalPaid > 0 ? paymentRefNo : undefined,
        bankAccount: finalPaid > 0 ? bankName : undefined,
        taxableAmount,
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        cess: 0,
        roundOff,
        grandTotal,
        status: invoiceStatus,
        notes,
        terms: activeCompany?.terms || '',
      });

      if (ok) {
        alert(`Sales invoice ${editingInvoice.invoiceNo} updated successfully!`);
        setEditingInvoice(null);
        setShowCreateModal(false);
        if (onCloseCreate) onCloseCreate();
      }
      return;
    }

    createSalesInvoice({
      invoiceNo: invoiceNo.trim() || undefined,
      date: invoiceDate,
      dueDate,
      paymentTerms,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerGstin: selectedCustomer.gstin,
      customerStateCode: selectedCustomer.stateCode,
      billingAddress: billingAddress || selectedCustomer.billingAddress || `${selectedCustomer.city}, ${selectedCustomer.state}`,
      shippingAddress: shippingAddress || billingAddress || selectedCustomer.shippingAddress || selectedCustomer.billingAddress,
      dispatchAddress: showDispatchSection || dispatchAddress ? dispatchAddress : undefined,
      dispatchState: showDispatchSection || dispatchState ? dispatchState : undefined,
      dispatchStateCode: showDispatchSection || dispatchStateCode ? dispatchStateCode : undefined,
      transporterName: showTransportSection || transporterName ? transporterName : undefined,
      transporterId: showTransportSection || transporterId ? transporterId : undefined,
      vehicleNo: showTransportSection || vehicleNo ? vehicleNo : undefined,
      transportMode: showTransportSection || transportMode ? transportMode : undefined,
      distanceKm: (showTransportSection && Number(distanceKm) > 0) ? Number(distanceKm) : undefined,
      lrNo: showTransportSection || lrNo ? lrNo : undefined,
      lrDate: showTransportSection || lrDate ? lrDate : undefined,
      items: calculatedItems,
      paymentMode,
      paymentStatus: computedStatus,
      paidAmount: finalPaid,
      paymentReceived: finalPaid,
      outstandingAmount: computedOutstanding,
      paymentDate: finalPaid > 0 ? paymentDate : undefined,
      paymentRefNo: finalPaid > 0 ? paymentRefNo : undefined,
      bankAccount: finalPaid > 0 ? bankName : undefined,
      taxableAmount,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      cess: 0,
      roundOff,
      grandTotal,
      status: invoiceStatus,
      themeId: 'professional',
      notes,
      terms: activeCompany?.terms || '',
    });

    setShowCreateModal(false);
    if (onCloseCreate) onCloseCreate();
  };

  const handleReturnConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningInvoice) return;

    createCreditNote({
      originalInvoiceId: returningInvoice.id,
      originalInvoiceNo: returningInvoice.invoiceNo,
      date: new Date().toISOString().substring(0, 10),
      customerId: returningInvoice.customerId,
      customerName: returningInvoice.customerName,
      items: returningInvoice.items,
      taxableAmount: returningInvoice.taxableAmount,
      cgst: returningInvoice.cgst,
      sgst: returningInvoice.sgst,
      igst: returningInvoice.igst,
      totalAmount: returningInvoice.grandTotal,
      reason: returnReason,
    });

    alert(`Credit Note generated successfully for invoice ${returningInvoice.invoiceNo}`);
    setReturningInvoice(null);
  };

  // Filter invoices with Financial Year + Month period filtering
  const filteredInvoices = salesInvoices.filter(inv => {
    // 3. GLOBAL FILTER (FINANCIAL YEAR + MONTH)
    const matchesPeriod = isDateInFiscalPeriod(inv.date, selectedFinancialYear, selectedMonth);
    if (!matchesPeriod) return false;

    const q = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !q ||
      (inv.invoiceNo || '').toLowerCase().includes(q) ||
      (inv.customerName || '').toLowerCase().includes(q) ||
      (Boolean(inv.customerGstin) && (inv.customerGstin || '').toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'DRAFT') return inv.status === 'DRAFT';
    if (statusFilter === 'POSTED') return inv.status === 'POSTED';
    if (statusFilter === 'E_INVOICE_PENDING') return inv.customerGstin && inv.irnStatus === 'PENDING';
    if (statusFilter === 'E_WAY_PENDING') return inv.grandTotal >= 50000 && inv.ewayBillStatus === 'NOT_GENERATED';

    return true;
  });

  const selectedMonthLabel = FISCAL_MONTHS.find(m => m.key === selectedMonth)?.label || 'All Months';

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Sales Invoices</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
              {filteredInvoices.length} Invoices
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create GST tax invoices, generate government IRN / QR code, and print beautiful bills
          </p>
        </div>

        <button
          onClick={() => {
            setEditingInvoice(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Create Sales Invoice</span>
        </button>
      </div>

      {/* Bulk PDF & Selection Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (selectedInvoiceIds.length === filteredInvoices.length) {
                setSelectedInvoiceIds([]);
              } else {
                setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
              }
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200 transition-colors"
          >
            {selectedInvoiceIds.length > 0 && selectedInvoiceIds.length === filteredInvoices.length ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedInvoiceIds.length === filteredInvoices.length ? 'Deselect All' : `Select All (${filteredInvoices.length})`}
            </span>
          </button>

          {selectedInvoiceIds.length > 0 && (
            <span className="text-slate-500 font-medium">
              {selectedInvoiceIds.length} bill{selectedInvoiceIds.length > 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={selectedInvoiceIds.length === 0}
            onClick={() => {
              const selectedList = filteredInvoices.filter(i => selectedInvoiceIds.includes(i.id));
              generateBulkSalesInvoicesPdf(
                selectedList,
                activeCompany,
                `Selected_Sales_Invoices_FY${selectedFinancialYear}_${selectedMonth}`
              );
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              selectedInvoiceIds.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
            title="Download PDF of selected bills"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Selected PDF ({selectedInvoiceIds.length})</span>
          </button>

          <button
            type="button"
            disabled={filteredInvoices.length === 0}
            onClick={() => {
              generateBulkSalesInvoicesPdf(
                filteredInvoices,
                activeCompany,
                `All_Sales_Invoices_FY${selectedFinancialYear}_${selectedMonth}`
              );
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Download PDF containing all bills in current period"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Bills PDF ({filteredInvoices.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoice no, party, GSTIN..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setStatusFilter('E_INVOICE_PENDING')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === 'E_INVOICE_PENDING' ? 'bg-amber-600 text-white' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>e-Invoice Pending</span>
          </button>
          <button
            onClick={() => setStatusFilter('E_WAY_PENDING')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === 'E_WAY_PENDING' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>E-Way Bill Pending</span>
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'DRAFT' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Invoice Cards List (Responsive for Mobile & Desktop) */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
            No invoices found matching your criteria.
          </div>
        ) : (
          filteredInvoices.map(inv => (
            <div
              key={inv.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs hover:border-blue-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Invoice Main Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedInvoiceIds.includes(inv.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedInvoiceIds(prev =>
                          prev.includes(inv.id) ? prev.filter(id => id !== inv.id) : [...prev, inv.id]
                        );
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Select invoice for bulk PDF download"
                    />
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                      {inv.invoiceNo}
                    </span>
                    {inv.status === 'DRAFT' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        DRAFT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        POSTED
                      </span>
                    )}

                    {/* e-Invoice Badge */}
                    {inv.customerGstin && (
                      inv.irnStatus === 'GENERATED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                          <QrCode className="w-3 h-3" /> e-Invoiced
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> IRN Pending
                        </span>
                      )
                    )}

                    {/* E-Way Bill Badge */}
                    {inv.grandTotal >= 50000 && (
                      inv.ewayBillStatus === 'GENERATED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> EWB: {inv.ewayBillNo}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                          EWB Required (&gt;50k)
                        </span>
                      )
                    )}
                  </div>

                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {inv.customerName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    GSTIN: {inv.customerGstin || 'Unregistered / B2C'} • Date: {inv.date}
                  </div>
                </div>

                {/* Amount and Payment Status */}
                <div className="text-left sm:text-right">
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {formatINR(inv.grandTotal)}
                  </div>
                  <div className="text-[11px] font-medium flex items-center sm:justify-end gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      inv.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                      inv.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {inv.paymentStatus} ({inv.paymentMode})
                    </span>
                    <span className="text-slate-400">Taxable: {formatINR(inv.taxableAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* View / Print Bill */}
                  <button
                    onClick={() => onViewInvoice(inv)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View &amp; Print Bill</span>
                  </button>

                  {/* 1. BILL EDIT / UPDATE + E-INVOICE LOCK */}
                  {inv.irnStatus === 'GENERATED' || inv.irn ? (
                    <span
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1 border border-amber-200/70 dark:border-amber-900/50"
                      title="LOCKED: Government IRN already generated. Modification is strictly restricted under GST compliance law."
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Locked (IRN)</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(inv)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1 transition-colors"
                      title="Edit this invoice"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Edit Bill</span>
                    </button>
                  )}

                  {/* 2. COPY / DUPLICATE BILL */}
                  <button
                    onClick={() => handleDuplicate(inv)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1 border border-emerald-200/70 dark:border-emerald-900/50 transition-colors"
                    title="Duplicate this bill as a new unposted editable bill"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copy Bill</span>
                  </button>

                  {/* 1-Click e-Invoice IRN Generator */}
                  {inv.customerGstin && inv.irnStatus !== 'GENERATED' && (
                    <button
                      onClick={async () => {
                        const res = await generateIRN(inv.id);
                        alert(res.message);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Generate IRN</span>
                    </button>
                  )}

                  {/* E-Way Bill button */}
                  {inv.ewayBillStatus !== 'GENERATED' ? (
                    <button
                      onClick={() => onOpenEWayBill(inv.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>E-Way Bill</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 font-medium flex items-center gap-1"
                    >
                      <span>EWB #{inv.ewayBillNo}</span>
                    </button>
                  )}

                  {/* Sales Return / Credit Note */}
                  <button
                    onClick={() => setReturningInvoice(inv)}
                    className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>Return (CN)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* WhatsApp Share */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Invoice from ${activeCompany?.name}\nInvoice No: ${inv.invoiceNo}\nDate: ${inv.date}\nAmount: ₹${inv.grandTotal}\nPayment: ${inv.paymentStatus}\nThank you for your business!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                    title="Share on WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </a>

                  {/* Controlled Edit / Cancel */}
                  {inv.status !== 'CANCELLED' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Please enter cancellation reason:');
                        if (reason) cancelSalesInvoice(inv.id, reason);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Cancel invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Sales Invoice */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 my-auto max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {editingInvoice ? `Edit Sales Tax Invoice (${editingInvoice.invoiceNo})` : 'New GST Sales Tax Invoice'}
                </h2>
                <p className="text-xs text-slate-500">
                  Seller: {activeCompany?.name} ({activeCompany?.stateCode} - {activeCompany?.state})
                  {editingInvoice && <span className="ml-2 font-mono text-blue-600 dark:text-blue-400 font-semibold">• Editing existing bill</span>}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  setShowCreateModal(false);
                  if (onCloseCreate) onCloseCreate();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice No. *
                  </label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    placeholder={defaultInvoiceNo}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer / Party *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    required
                  >
                    {parties.filter(p => p.type !== 'SUPPLIER').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.gstin ? `(${p.gstin})` : '(B2C Consumer)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Payment Mode, Due Date, Payment Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={e => {
                      const m = e.target.value as PaymentMode;
                      setPaymentMode(m);
                      if (m !== 'CREDIT' && paidAmount === 0) {
                        setPaidAmount(grandTotal);
                      }
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    <option value="CREDIT">Credit (Accounts Receivable)</option>
                    <option value="BANK">Bank Transfer / NEFT / RTGS</option>
                    <option value="UPI">UPI / QR Payment</option>
                    <option value="CASH">Cash Counter</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={e => {
                      setPaymentTerms(e.target.value);
                      const baseDate = new Date(invoiceDate || Date.now());
                      if (e.target.value === 'Due on Receipt') {
                        setDueDate(invoiceDate);
                      } else if (e.target.value === 'Net 15 Days') {
                        setDueDate(new Date(baseDate.getTime() + 15 * 86400000).toISOString().substring(0, 10));
                      } else if (e.target.value === 'Net 30 Days') {
                        setDueDate(new Date(baseDate.getTime() + 30 * 86400000).toISOString().substring(0, 10));
                      } else if (e.target.value === 'Net 45 Days') {
                        setDueDate(new Date(baseDate.getTime() + 45 * 86400000).toISOString().substring(0, 10));
                      }
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 45 Days">Net 45 Days</option>
                    <option value="Due on Receipt">Due on Receipt / Immediate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Addresses (Billing & Shipping) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Billing Address (Bill To)</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={billingAddress}
                    onChange={e => setBillingAddress(e.target.value)}
                    placeholder="Customer billing street, city, state, pin..."
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Shipping Address (Ship To)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShippingAddress(billingAddress)}
                      className="text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      Same as Billing
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Consignee shipping destination address..."
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Collapsible Dispatch & Transport details */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDispatchSection(!showDispatchSection)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dispatch Details</span>
                    {showDispatchSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTransportSection(!showTransportSection)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Transport &amp; E-Way Bill Details</span>
                    {showTransportSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Dispatch Section Body */}
                {showDispatchSection && (
                  <div className="p-3 bg-blue-50/50 dark:bg-slate-800/60 rounded-xl border border-blue-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Dispatch From Address (Warehouse / Unit)
                      </label>
                      <input
                        type="text"
                        value={dispatchAddress}
                        onChange={e => setDispatchAddress(e.target.value)}
                        placeholder={activeCompany?.address || 'Warehouse location...'}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Dispatch State &amp; Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={dispatchState}
                          onChange={e => setDispatchState(e.target.value)}
                          placeholder="State"
                          className="w-2/3 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={dispatchStateCode}
                          onChange={e => setDispatchStateCode(e.target.value)}
                          placeholder="Code"
                          className="w-1/3 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Transport Section Body */}
                {showTransportSection && (
                  <div className="p-3 bg-indigo-50/50 dark:bg-slate-800/60 rounded-xl border border-indigo-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transporter Name</label>
                      <input
                        type="text"
                        value={transporterName}
                        onChange={e => setTransporterName(e.target.value)}
                        placeholder="e.g. VRL Logistics"
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transporter ID / GSTIN</label>
                      <input
                        type="text"
                        value={transporterId}
                        onChange={e => setTransporterId(e.target.value)}
                        placeholder="15-digit GSTIN or TRANS_ID"
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vehicle No.</label>
                      <input
                        type="text"
                        value={vehicleNo}
                        onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                        placeholder="JH03AB1234"
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transport Mode</label>
                      <select
                        value={transportMode}
                        onChange={e => setTransportMode(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      >
                        <option value="ROAD">Road (Truck/Tempo)</option>
                        <option value="RAIL">Rail (Cargo)</option>
                        <option value="AIR">Air Cargo</option>
                        <option value="SHIP">Ship / Waterway</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Approx Distance (KM)</label>
                      <input
                        type="number"
                        min="1"
                        value={distanceKm}
                        onChange={e => setDistanceKm(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 120"
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">LR / GR No.</label>
                      <input
                        type="text"
                        value={lrNo}
                        onChange={e => setLrNo(e.target.value)}
                        placeholder="Lorry Receipt No."
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">LR / GR Date</label>
                      <input
                        type="date"
                        value={lrDate}
                        onChange={e => setLrDate(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tax Type Alert */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 flex items-center justify-between">
                <div>
                  <span className="font-bold">Place of Supply: </span>
                  <span>{selectedCustomer?.state} (Code: {selectedCustomer?.stateCode})</span>
                </div>
                <div className="font-bold">
                  {isInterstate ? (
                    <span className="text-amber-600 dark:text-amber-400">Interstate Supply (IGST Applicable)</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">Intrastate Supply (CGST + SGST Applicable)</span>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 font-semibold border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>Invoice Line Items ({lineItems.length})</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2 w-44">Item / Service</th>
                        <th className="px-2 py-2">HSN/SAC</th>
                        <th className="px-2 py-2 w-16">Qty</th>
                        <th className="px-2 py-2 w-20">Rate (₹)</th>
                        <th className="px-2 py-2 w-16">Disc %</th>
                        <th className="px-2 py-2 w-20">Disc ₹</th>
                        <th className="px-2 py-2 w-14">GST %</th>
                        <th className="px-2 py-2 text-right">Taxable</th>
                        <th className="px-2 py-2 text-right">Total</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lineItems.map((li, idx) => {
                        const calculated = calculatedItems[idx];

                        return (
                          <tr key={idx}>
                            <td className="p-2">
                              <select
                                value={li.itemId}
                                onChange={e => handleItemChange(idx, e.target.value)}
                                className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                              >
                                {items.map(it => (
                                  <option key={it.id} value={it.id}>
                                    {it.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 font-mono text-slate-500">{li.hsnSac}</td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={li.qty ?? 1}
                                onChange={e => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                                className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 text-center"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={li.rate ?? 0}
                                onChange={e => handleRateChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={li.discountPercent ?? 0}
                                onChange={e => handleDiscountPercentChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 text-center font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={li.discountAmount ?? 0}
                                onChange={e => handleDiscountAmountChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 text-right font-mono"
                              />
                            </td>
                            <td className="p-2 font-mono font-bold text-center">
                              {li.gstRate}%
                            </td>
                            <td className="p-2 text-right font-mono text-slate-700 dark:text-slate-300">
                              {formatINR(calculated?.taxableValue || 0)}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatINR(calculated?.total || 0)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Received at Creation Section */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Payment Received / Settlement (Optional)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(grandTotal)}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Mark Full Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
                    >
                      Keep Unpaid / Credit
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Paid Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={paidAmount}
                      onChange={e => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Receipt Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ref / UTR / Cheque No.</label>
                    <input
                      type="text"
                      value={paymentRefNo}
                      onChange={e => setPaymentRefNo(e.target.value)}
                      placeholder="e.g. UTR12345678"
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Deposit Bank</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder={activeCompany?.bankName || 'Bank Account'}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <span>Balance Due / Outstanding: <b className="font-mono text-slate-900 dark:text-white">{formatINR(Math.max(0, grandTotal - paidAmount))}</b></span>
                  <span className={`font-semibold ${paidAmount >= grandTotal ? 'text-emerald-600' : paidAmount > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    Status: {paidAmount >= grandTotal ? 'PAID IN FULL' : paidAmount > 0 ? 'PARTIALLY PAID' : 'UNPAID'}
                  </span>
                </div>
              </div>

              {/* Totals Summary Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 max-w-sm">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Invoice Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Dispatch notes, delivery challan reference, transport details..."
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
                  />
                  <div className="text-[11px] text-slate-500 italic">
                    Amount in Words: {amountInWords(grandTotal)}
                  </div>
                </div>

                <div className="w-full sm:w-72 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Taxable Amount:</span>
                    <span className="font-mono font-semibold">{formatINR(taxableAmount)}</span>
                  </div>
                  {isInterstate ? (
                    <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                      <span>IGST:</span>
                      <span className="font-mono font-semibold">{formatINR(totalIgst)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST:</span>
                        <span className="font-mono">{formatINR(totalCgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST:</span>
                        <span className="font-mono">{formatINR(totalSgst)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Round Off:</span>
                    <span className="font-mono">{roundOff >= 0 ? `+${roundOff}` : roundOff}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{formatINR(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Status Picker & Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="invStatus"
                      checked={invoiceStatus === 'POSTED'}
                      onChange={() => setInvoiceStatus('POSTED')}
                    />
                    <span>Post Final Bill (Stock &amp; Books Deduct)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-500">
                    <input
                      type="radio"
                      name="invStatus"
                      checked={invoiceStatus === 'DRAFT'}
                      onChange={() => setInvoiceStatus('DRAFT')}
                    />
                    <span>Save as Draft (Editable)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInvoice(null);
                      setShowCreateModal(false);
                      if (onCloseCreate) onCloseCreate();
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                  >
                    {editingInvoice ? 'Update Invoice' : 'Generate Invoice'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sales Return / Credit Note */}
      {returningInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Issue Credit Note (Sales Return)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Return against original invoice: <span className="font-mono font-bold text-blue-600">{returningInvoice.invoiceNo}</span>
            </p>

            <form onSubmit={handleReturnConfirm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  readOnly
                  value={returningInvoice?.customerName || ''}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Return Amount
                </label>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 font-bold font-mono text-sm">
                  {formatINR(returningInvoice.grandTotal)}
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Stock will be restored and customer receivable ledger adjusted automatically.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Sales Return *
                </label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                >
                  <option value="Defective goods / Quality issue">Defective goods / Quality issue</option>
                  <option value="Customer order cancelled">Customer order cancelled</option>
                  <option value="Wrong item dispatched">Wrong item dispatched</option>
                  <option value="Billing calculation error / Rate difference">Rate difference / Discount adjustment</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturningInvoice(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Generate Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
