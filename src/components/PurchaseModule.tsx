import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PurchaseInvoice, InvoiceItem, DebitNote } from '../types';
import { formatINR } from '../data/indianStates';
import * as XLSX from 'xlsx';
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
  CheckCircle2
} from 'lucide-react';
import { DebitNotePrintModal } from './DebitNotePrintModal';

interface PurchaseModuleProps {
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  defaultTab?: 'BILLS' | 'RETURNS';
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
  const [showCreateModal, setShowCreateModal] = useState(isCreateOpen);

  // Return modal
  const [returningPurchase, setReturningPurchase] = useState<PurchaseInvoice | null>(null);
  const [showDirectReturnModal, setShowDirectReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Damaged goods received from vendor');
  const [selectedPrintDebitNote, setSelectedPrintDebitNote] = useState<DebitNote | null>(null);

  // Form State for Purchase Bill
  const [supplierId, setSupplierId] = useState(parties.find(p => p.type !== 'CUSTOMER')?.id || parties?.[0]?.id || '');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState(`SUP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [selectedItemId, setSelectedItemId] = useState(items?.[0]?.id || '');
  const [qty, setQty] = useState(10);
  const [rate, setRate] = useState(items?.[0]?.purchaseRate || 500);

  // Form State for Direct Debit Note / Purchase Return
  const [dnSupplierId, setDnSupplierId] = useState(parties.find(p => p.type !== 'CUSTOMER')?.id || parties?.[0]?.id || '');
  const [dnOriginalBillNo, setDnOriginalBillNo] = useState('SUP-8821');
  const [dnItemId, setDnItemId] = useState(items?.[0]?.id || '');
  const [dnQty, setDnQty] = useState(1);
  const [dnRate, setDnRate] = useState(items?.[0]?.purchaseRate || 500);
  const [dnReason, setDnReason] = useState('Damaged goods received from vendor');

  const selectedSupplier = parties.find(p => p.id === supplierId);
  const selectedItem = items.find(i => i.id === selectedItemId);
  const isInterstate = selectedSupplier && activeCompany && selectedSupplier.stateCode !== activeCompany.stateCode;

  const taxableValue = qty * rate;
  const gstRate = selectedItem?.gstRate || 18;
  const taxTotal = (taxableValue * gstRate) / 100;
  const cgst = isInterstate ? 0 : taxTotal / 2;
  const sgst = isInterstate ? 0 : taxTotal / 2;
  const igst = isInterstate ? taxTotal : 0;
  const grandTotal = Math.round(taxableValue + taxTotal);

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

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !selectedItem) return;

    const lineItem: InvoiceItem = {
      id: 'pur-item-' + Date.now(),
      itemId: selectedItem.id,
      name: selectedItem.name,
      hsnSac: selectedItem.hsnSac,
      unit: selectedItem.unit,
      qty,
      rate,
      discountPercent: 0,
      taxableValue,
      gstRate,
      cgst,
      sgst,
      igst,
      cess: 0,
      total: grandTotal,
    };

    createPurchaseInvoice({
      supplierInvoiceNo,
      date: invoiceDate,
      dueDate,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierGstin: selectedSupplier.gstin,
      supplierStateCode: selectedSupplier.stateCode,
      items: [lineItem],
      paymentMode: 'CREDIT',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      taxableAmount: taxableValue,
      cgst,
      sgst,
      igst,
      cess: 0,
      roundOff: grandTotal - (taxableValue + taxTotal),
      grandTotal,
      status: 'POSTED',
      itcEligible: true,
      itcClaimed: true,
      notes: 'Received in good condition at main warehouse.',
    });

    setShowCreateModal(false);
    if (onCloseCreate) onCloseCreate();
  };

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

    purchaseInvoices.forEach(p => {
      rows.push([
        p.invoiceNo,
        p.supplierName,
        p.supplierGstin || 'Unregistered',
        p.supplierInvoiceNo,
        p.date,
        p.dueDate,
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

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>Purchases &amp; Purchase Returns (Debit Notes)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
              {selectedPeriodLabel}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log inward vendor bills, issue official GST purchase return debit notes, and cross-reconcile ITC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'BILLS' ? (
            <>
              <button
                onClick={handleExportPurchasesExcel}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Record Purchase Bill</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleExportDebitNotesExcel}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Returns Excel</span>
              </button>
              <button
                onClick={() => setShowDirectReturnModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>+ Issue Debit Note (Return)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('BILLS')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'BILLS'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Inward Purchase Bills ({purchaseInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RETURNS')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'RETURNS'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Purchase Returns / Debit Notes ({debitNotes.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'BILLS' ? "Search vendor, bill no..." : "Search supplier, debit note no..."}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
        />
      </div>

      {/* Tab 1: Purchase Bills Table */}
      {activeTab === 'BILLS' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Internal Bill No</th>
                  <th className="px-4 py-3">Vendor &amp; Supplier Ref</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Taxable Value</th>
                  <th className="px-4 py-3 text-right">GST ITC Credit</th>
                  <th className="px-4 py-3 text-right">Total Bill Value</th>
                  <th className="px-4 py-3 text-center">ITC Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredInvoices.map(bill => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {bill.invoiceNo || bill.supplierInvoiceNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{bill.supplierName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Ref: #{bill.supplierInvoiceNo} • {bill.supplierGstin || 'Unreg'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{bill.date}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">{formatINR(bill.taxableAmount)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatINR(bill.cgst + bill.sgst + bill.igst)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(bill.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3" /> Eligible (3B)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReturningPurchase(bill)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>Return (DN)</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to permanently delete purchase bill ${bill.invoiceNo || bill.supplierInvoiceNo}?`)) {
                              deletePurchaseInvoice(bill.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                          title="Delete purchase bill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No purchase bills found matching your search.
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Debit Note No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Supplier Name &amp; GSTIN</th>
                  <th className="px-4 py-3">Against Bill Ref</th>
                  <th className="px-4 py-3 text-right">Taxable Val</th>
                  <th className="px-4 py-3 text-right">GST Reversed</th>
                  <th className="px-4 py-3 text-right">Debit Note Total</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredDebitNotes.map(dn => (
                  <tr key={dn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {dn.debitNoteNo}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{dn.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{dn.supplierName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{dn.supplierGstin || 'Unregistered'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {dn.originalSupplierInvoiceNo || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatINR(dn.taxableAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                      {formatINR(dn.cgst + dn.sgst + dn.igst)}
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
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print DN</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete debit note ${dn.debitNoteNo}?`)) {
                              deleteDebitNote(dn.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                          title="Delete debit note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDebitNotes.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No purchase returns or debit notes recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Purchase Bill */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Record Purchase Bill (Inward)</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier / Vendor *</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  required
                >
                  {parties.filter(p => p.type !== 'CUSTOMER').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gstin || 'Unregistered'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier's Bill No *</label>
                  <input
                    type="text"
                    required
                    value={supplierInvoiceNo}
                    onChange={e => setSupplierInvoiceNo(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bill Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Item selection */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Purchased Item Line</div>
                <div>
                  <select
                    value={selectedItemId}
                    onChange={e => {
                      setSelectedItemId(e.target.value);
                      const it = items.find(i => i.id === e.target.value);
                      if (it) setRate(it.purchaseRate || 500);
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    {items.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.name} (HSN: {it.hsnSac}) - Rate: ₹{it.purchaseRate}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={e => setQty(parseInt(e.target.value) || 1)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Unit Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={rate}
                      onChange={e => setRate(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-right"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm">
                  <span>Grand Total (with {gstRate}% GST):</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Post Purchase Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Debit Note / Purchase Return (From Bill) */}
      {returningPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Issue Debit Note (Purchase Return)
            </h2>
            <p className="text-xs text-slate-500 mb-4">Against bill #{returningPurchase.supplierInvoiceNo || returningPurchase.invoiceNo}</p>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                >
                  <option value="Damaged goods received from vendor">Damaged goods received from vendor</option>
                  <option value="Quality defect / Not as per purchase order">Quality defect / Not as per purchase order</option>
                  <option value="Rate difference / Excess billing by vendor">Rate difference / Excess billing by vendor</option>
                  <option value="Expired / Nearing shelf-life">Expired / Nearing shelf-life</option>
                  <option value="Defective unit returned under warranty">Defective unit returned under warranty</option>
                </select>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 font-bold font-mono">
                Debit Note Total Value: {formatINR(returningPurchase.grandTotal)}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturningPurchase(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirm &amp; Generate Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Debit Note (Without Bill) */}
      {showDirectReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Issue Direct Debit Note (Purchase Return)</h2>
              <button onClick={() => setShowDirectReturnModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vendor / Supplier *</label>
                <select
                  value={dnSupplierId}
                  onChange={e => setDnSupplierId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
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
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
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
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
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
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={dnRate}
                      onChange={e => setDnRate(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-right"
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
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                >
                  <option value="Damaged goods received from vendor">Damaged goods received from vendor</option>
                  <option value="Quality defect / Not as per purchase order">Quality defect / Not as per purchase order</option>
                  <option value="Rate difference / Excess billing by vendor">Rate difference / Excess billing by vendor</option>
                  <option value="Expired / Nearing shelf-life">Expired / Nearing shelf-life</option>
                  <option value="Defective unit returned under warranty">Defective unit returned under warranty</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDirectReturnModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Issue Debit Note
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
