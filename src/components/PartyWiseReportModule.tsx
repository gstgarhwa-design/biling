import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../data/indianStates';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  Phone, 
  Mail, 
  FileSpreadsheet,
  Filter,
  Layers,
  ChevronRight,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import { generatePartyStatementPdf, generatePartyOutstandingPdf } from '../utils/partyPdfExport';

interface LedgerEntry {
  date: string;
  voucherType: 'SALES' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  voucherNo: string;
  particulars: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export const PartyWiseReportModule: React.FC = () => {
  const { 
    activeCompany, 
    parties, 
    salesInvoices, 
    purchaseInvoices, 
    paymentsReceipts, 
    creditNotes, 
    debitNotes,
    selectedFinancialYear,
    selectedMonth 
  } = useApp();

  // Selected party
  const [selectedPartyId, setSelectedPartyId] = useState<string>(parties?.[0]?.id || '');
  
  // Date filters (defaults to current FY or current month)
  const [startDate, setStartDate] = useState<string>('2024-04-01');
  const [endDate, setEndDate] = useState<string>('2025-03-31');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');
  const [activeViewTab, setActiveViewTab] = useState<'LEDGER' | 'OUTSTANDING'>('LEDGER');

  // Synchronize date range with global FY & Month selection
  useEffect(() => {
    const parts = selectedFinancialYear.split('-');
    const startYear = parseInt(parts[0], 10);
    if (!isNaN(startYear)) {
      if (selectedMonth === 'ALL') {
        setStartDate(`${startYear}-04-01`);
        setEndDate(`${startYear + 1}-03-31`);
      } else {
        const mNum = parseInt(selectedMonth, 10);
        const y = mNum >= 4 ? startYear : startYear + 1;
        const mm = String(mNum).padStart(2, '0');
        const lastDay = new Date(y, mNum, 0).getDate();
        setStartDate(`${y}-${mm}-01`);
        setEndDate(`${y}-${mm}-${String(lastDay).padStart(2, '0')}`);
      }
    }
  }, [selectedFinancialYear, selectedMonth]);

  const selectedParty = parties.find(p => p.id === selectedPartyId) || parties[0];

  // Quick preset ranges
  const applyPreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FULL_FY') => {
    const parts = selectedFinancialYear.split('-');
    const startYear = parseInt(parts[0], 10) || 2024;
    const nextYear = startYear + 1;

    if (preset === 'THIS_MONTH') {
      setStartDate('2025-02-01');
      setEndDate('2025-02-28');
    } else if (preset === 'LAST_MONTH') {
      setStartDate('2025-01-01');
      setEndDate('2025-01-31');
    } else if (preset === 'Q3') {
      setStartDate(`${startYear}-10-01`);
      setEndDate(`${startYear}-12-31`);
    } else if (preset === 'FULL_FY') {
      setStartDate(`${startYear}-04-01`);
      setEndDate(`${nextYear}-03-31`);
    }
  };

  // Filter parties by type & search
  const visibleParties = parties.filter(p => {
    if (partyTypeFilter !== 'ALL' && p.type !== partyTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.gstin && p.gstin.toLowerCase().includes(q)) || (p.city && p.city.toLowerCase().includes(q));
    }
    return true;
  });

  // Calculate Party Ledger Entries
  const { ledgerEntries, openingBalance, closingBalance, totalDebit, totalCredit } = useMemo(() => {
    if (!selectedParty) return { ledgerEntries: [], openingBalance: 0, closingBalance: 0, totalDebit: 0, totalCredit: 0 };

    const rawEntries: { date: string; voucherType: LedgerEntry['voucherType']; voucherNo: string; particulars: string; debit: number; credit: number }[] = [];

    // 1. Sales Invoices (Debit to Customer)
    salesInvoices
      .filter(inv => inv.customerId === selectedParty.id)
      .forEach(inv => {
        rawEntries.push({
          date: inv.date,
          voucherType: 'SALES',
          voucherNo: inv.invoiceNo,
          particulars: `Tax Invoice - ${inv.items.map(i => i.name).slice(0, 2).join(', ')}`,
          debit: inv.grandTotal,
          credit: 0,
        });
      });

    // 2. Purchase Bills (Credit to Supplier)
    purchaseInvoices
      .filter(pur => pur.supplierId === selectedParty.id)
      .forEach(pur => {
        rawEntries.push({
          date: pur.date,
          voucherType: 'PURCHASE',
          voucherNo: pur.supplierInvoiceNo || pur.invoiceNo,
          particulars: `Purchase Inward Bill #${pur.supplierInvoiceNo}`,
          debit: 0,
          credit: pur.grandTotal,
        });
      });

    // 3. Credit Notes (Credit to Customer, reduces receivable)
    creditNotes
      .filter(cn => cn.customerId === selectedParty.id)
      .forEach(cn => {
        rawEntries.push({
          date: cn.date,
          voucherType: 'CREDIT_NOTE',
          voucherNo: cn.creditNoteNo,
          particulars: `Credit Note against Inv #${cn.originalInvoiceNo} (${cn.reason})`,
          debit: 0,
          credit: cn.totalAmount,
        });
      });

    // 4. Debit Notes / Purchase Returns (Debit to Supplier, reduces payable)
    debitNotes
      .filter(dn => dn.supplierId === selectedParty.id)
      .forEach(dn => {
        rawEntries.push({
          date: dn.date,
          voucherType: 'DEBIT_NOTE',
          voucherNo: dn.debitNoteNo,
          particulars: `Debit Note against Bill #${dn.originalSupplierInvoiceNo} (${dn.reason})`,
          debit: dn.totalAmount,
          credit: 0,
        });
      });

    // 5. Payments & Receipts
    paymentsReceipts
      .filter(pay => pay.partyId === selectedParty.id)
      .forEach(pay => {
        if (pay.type === 'RECEIPT') {
          // Receipt from customer -> Credit customer
          rawEntries.push({
            date: pay.date,
            voucherType: 'RECEIPT',
            voucherNo: pay.voucherNo,
            particulars: `Receipt (${pay.paymentMode}) ref: ${pay.referenceNo || 'Direct'}`,
            debit: 0,
            credit: pay.amount,
          });
        } else {
          // Payment to supplier -> Debit supplier
          rawEntries.push({
            date: pay.date,
            voucherType: 'PAYMENT',
            voucherNo: pay.voucherNo,
            particulars: `Payment (${pay.paymentMode}) ref: ${pay.referenceNo || 'Direct'}`,
            debit: pay.amount,
            credit: 0,
          });
        }
      });

    // Sort by date ascending
    rawEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate opening balance before startDate
    let opBal = selectedParty.openingBalance || 0;
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate + 'T23:59:59').getTime();

    const periodEntries: typeof rawEntries = [];

    rawEntries.forEach(item => {
      const itemTime = new Date(item.date).getTime();
      if (itemTime < startTimestamp) {
        // adjust opening balance
        opBal += (item.debit - item.credit);
      } else if (itemTime <= endTimestamp) {
        periodEntries.push(item);
      }
    });

    let running = opBal;
    let sumDebit = 0;
    let sumCredit = 0;

    const formattedLedger: LedgerEntry[] = periodEntries.map(entry => {
      running += (entry.debit - entry.credit);
      sumDebit += entry.debit;
      sumCredit += entry.credit;
      return {
        ...entry,
        runningBalance: running,
      };
    });

    return {
      ledgerEntries: formattedLedger,
      openingBalance: opBal,
      closingBalance: running,
      totalDebit: sumDebit,
      totalCredit: sumCredit,
    };
  }, [selectedParty, salesInvoices, purchaseInvoices, creditNotes, debitNotes, paymentsReceipts, startDate, endDate]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!selectedParty) return;

    const rows: (string | number)[][] = [
      ['PARTY STATEMENT & TRANSACTION LEDGER'],
      ['Company:', activeCompany?.name || 'My Company', 'GSTIN:', activeCompany?.gstin || ''],
      ['Party Name:', selectedParty.name, 'Type:', selectedParty.type],
      ['Party GSTIN:', selectedParty.gstin || 'Unregistered', 'Phone:', selectedParty.phone || selectedParty.mobile || ''],
      ['Period From:', startDate, 'To:', endDate],
      [''],
      ['Opening Balance as on ' + startDate, '', '', '', '', openingBalance >= 0 ? `${formatINR(openingBalance)} Dr` : `${formatINR(Math.abs(openingBalance))} Cr`],
      [''],
      ['Date', 'Voucher Type', 'Voucher / Bill No', 'Particulars / Details', 'Debit (₹)', 'Credit (₹)', 'Net Balance (₹)']
    ];

    ledgerEntries.forEach(e => {
      rows.push([
        e.date,
        e.voucherType,
        e.voucherNo,
        e.particulars,
        e.debit || '',
        e.credit || '',
        e.runningBalance >= 0 ? `${formatINR(e.runningBalance)} Dr` : `${formatINR(Math.abs(e.runningBalance))} Cr`
      ]);
    });

    rows.push(['']);
    rows.push(['TOTALS / CLOSING', '', '', `Total Transactions: ${ledgerEntries.length}`, totalDebit, totalCredit, closingBalance >= 0 ? `${formatINR(closingBalance)} Dr` : `${formatINR(Math.abs(closingBalance))} Cr`]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Party_Ledger');
    XLSX.writeFile(wb, `Party_Ledger_${selectedParty.name.replace(/[^a-zA-Z0-9]/g, '_')}_${startDate}_to_${endDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Pending Invoices for Outstanding Analysis
  const pendingInvoices = useMemo(() => {
    if (!selectedParty) return [];
    return salesInvoices.filter(inv => {
      if (inv.customerId !== selectedParty.id) return false;
      if (inv.status === 'CANCELLED') return false;
      const paid = inv.paidAmount || inv.paymentReceived || 0;
      return (inv.grandTotal - paid) > 0;
    });
  }, [selectedParty, salesInvoices]);

  const ageingSummary = useMemo(() => {
    const asOnTime = new Date(endDate).getTime();
    let b0_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let b90Plus = 0;
    let totalPending = 0;

    pendingInvoices.forEach(inv => {
      const paid = inv.paidAmount || inv.paymentReceived || 0;
      const pending = inv.grandTotal - paid;
      totalPending += pending;

      const invTime = new Date(inv.date).getTime();
      const ageDays = Math.max(0, Math.floor((asOnTime - invTime) / (1000 * 60 * 60 * 24)));

      if (ageDays <= 30) b0_30 += pending;
      else if (ageDays <= 60) b31_60 += pending;
      else if (ageDays <= 90) b61_90 += pending;
      else b90Plus += pending;
    });

    return { b0_30, b31_60, b61_90, b90Plus, totalPending };
  }, [pendingInvoices, endDate]);

  const handleGenerateStatementPdf = () => {
    if (!selectedParty) return;
    generatePartyStatementPdf({
      party: selectedParty,
      company: activeCompany,
      startDate,
      endDate,
      openingBalance,
      closingBalance,
      totalDebit,
      totalCredit,
      entries: ledgerEntries
    });
  };

  const handleGenerateOutstandingPdf = () => {
    if (!selectedParty) return;
    generatePartyOutstandingPdf({
      party: selectedParty,
      company: activeCompany,
      invoices: salesInvoices,
      asOnDate: endDate
    });
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Top Banner (Hidden on Print) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Party Wise Ledger &amp; Custom Date Export</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">Party Statement &amp; Outstanding Analysis</h1>
          <p className="text-xs text-indigo-100/80 mt-0.5">
            Detailed ledger statement with opening/closing balances, payments, credit notes, debit notes, PDF &amp; Excel export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateStatementPdf}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            title="Download Statement PDF for selected party"
          >
            <Download className="w-4 h-4" />
            <span>Statement PDF</span>
          </button>
          <button
            onClick={handleGenerateOutstandingPdf}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            title="Download Outstanding Analysis PDF for selected party"
          >
            <FileText className="w-4 h-4" />
            <span>Outstanding PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filter & Date Range Bar (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden text-xs">
        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Date Range:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">From</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs"
            />
            <span className="text-slate-400">To</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs"
            />
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyPreset('THIS_MONTH')}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-medium text-[11px]"
            >
              This Month
            </button>
            <button
              onClick={() => applyPreset('LAST_MONTH')}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-medium text-[11px]"
            >
              Last Month
            </button>
            <button
              onClick={() => applyPreset('Q3')}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-medium text-[11px]"
            >
              Q3 FY25
            </button>
            <button
              onClick={() => applyPreset('FULL_FY')}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-medium text-[11px]"
            >
              Full FY {selectedFinancialYear}
            </button>
          </div>
        </div>

        {/* Party Filter Type */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Show:</span>
          <div className="flex p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              onClick={() => setPartyTypeFilter('ALL')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${partyTypeFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              All Parties
            </button>
            <button
              onClick={() => setPartyTypeFilter('CUSTOMER')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${partyTypeFilter === 'CUSTOMER' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Customers
            </button>
            <button
              onClick={() => setPartyTypeFilter('SUPPLIER')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${partyTypeFilter === 'SUPPLIER' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Suppliers
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Party Selector Sidebar + Ledger Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Column: Party List Picker (Hidden on Print) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-3 space-y-3 print:hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search party by name, GSTIN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
            />
          </div>

          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 pr-1">
            {visibleParties.map(p => {
              const isSelected = p.id === selectedPartyId;
              const isCustomer = p.type === 'CUSTOMER';
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPartyId(p.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all my-0.5 flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold truncate max-w-[150px]">{p.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isCustomer ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {p.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">{p.gstin || 'Unregistered'}</span>
                    <span className={`font-mono font-bold ${p.currentBalance >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600'}`}>
                      {formatINR(Math.abs(p.currentBalance))} {p.currentBalance >= 0 ? 'Dr' : 'Cr'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 3 Columns: Active Party Profile & Statement */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Printable Header Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {selectedParty?.type} LEDGER
                  </span>
                  <span className="text-xs text-slate-500">Period: {startDate} to {endDate}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {selectedParty?.name}
                </h2>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span><b>GSTIN:</b> <span className="font-mono">{selectedParty?.gstin || 'Unregistered'}</span></span>
                  <span><b>PAN:</b> <span className="font-mono">{selectedParty?.pan || 'N/A'}</span></span>
                  <span><b>State:</b> {selectedParty?.state} ({selectedParty?.stateCode})</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                  <span><b>Address:</b> {selectedParty?.billingAddress || selectedParty?.address || 'N/A'}</span>
                  <span><b>Phone:</b> {selectedParty?.phone || selectedParty?.mobile || 'N/A'}</span>
                  <span><b>Email:</b> {selectedParty?.email || 'N/A'}</span>
                </div>
              </div>

              {/* Company Logo in Print */}
              <div className="text-right sm:border-l sm:pl-4 border-slate-200 dark:border-slate-700">
                {activeCompany?.logoUrl && (
                  <img src={activeCompany.logoUrl} alt="Logo" className="h-10 w-auto max-w-[130px] object-contain ml-auto mb-1" />
                )}
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeCompany?.name}</div>
                <div className="text-[11px] font-mono text-slate-500">{activeCompany?.gstin}</div>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[11px]">Opening Balance</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                  {formatINR(Math.abs(openingBalance))} {openingBalance >= 0 ? 'Dr' : 'Cr'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Total Debit (Dr)</span>
                <span className="text-sm font-bold font-mono text-emerald-800 dark:text-emerald-300">
                  {formatINR(totalDebit)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <span className="text-blue-700 dark:text-blue-400 block text-[11px]">Total Credit (Cr)</span>
                <span className="text-sm font-bold font-mono text-blue-800 dark:text-blue-300">
                  {formatINR(totalCredit)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <span className="text-indigo-700 dark:text-indigo-400 block text-[11px]">Closing Balance</span>
                <span className="text-sm font-bold font-mono text-indigo-900 dark:text-indigo-200">
                  {formatINR(Math.abs(closingBalance))} {closingBalance >= 0 ? 'Dr' : 'Cr'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Selection: Detailed Ledger vs Outstanding Analysis */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-1 print:hidden">
            <button
              onClick={() => setActiveViewTab('LEDGER')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewTab === 'LEDGER'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Detailed Ledger Statement</span>
            </button>
            <button
              onClick={() => setActiveViewTab('OUTSTANDING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewTab === 'OUTSTANDING'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Outstanding &amp; Ageing Analysis ({pendingInvoices.length})</span>
            </button>
          </div>

          {activeViewTab === 'LEDGER' ? (
            /* Statement Table */
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Detailed Ledger Account ({ledgerEntries.length} entries)
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Showing {startDate} to {endDate}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Voucher Type</th>
                      <th className="px-3.5 py-2.5">Ref No</th>
                      <th className="px-4 py-2.5">Particulars</th>
                      <th className="px-3.5 py-2.5 text-right">Debit (₹)</th>
                      <th className="px-3.5 py-2.5 text-right">Credit (₹)</th>
                      <th className="px-3.5 py-2.5 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-50/70 dark:bg-slate-900/40 font-medium text-slate-600 dark:text-slate-400">
                      <td className="px-3.5 py-2 font-mono">{startDate}</td>
                      <td className="px-3 py-2 font-semibold text-slate-500">OPENING</td>
                      <td className="px-3.5 py-2 font-mono">-</td>
                      <td className="px-4 py-2 italic">Opening Balance b/f</td>
                      <td className="px-3.5 py-2 text-right font-mono">{openingBalance > 0 ? formatINR(openingBalance) : '-'}</td>
                      <td className="px-3.5 py-2 text-right font-mono">{openingBalance < 0 ? formatINR(Math.abs(openingBalance)) : '-'}</td>
                      <td className="px-3.5 py-2 text-right font-mono font-bold">
                        {formatINR(Math.abs(openingBalance))} {openingBalance >= 0 ? 'Dr' : 'Cr'}
                      </td>
                    </tr>

                    {ledgerEntries.map((e, idx) => {
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                          <td className="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-400">{e.date}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              e.voucherType === 'SALES' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                              e.voucherType === 'PURCHASE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              e.voucherType === 'RECEIPT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              e.voucherType === 'PAYMENT' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                              e.voucherType === 'DEBIT_NOTE' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                              'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                            }`}>
                              {e.voucherType}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {e.voucherNo}
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                            {e.particulars}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {e.debit ? formatINR(e.debit) : '-'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {e.credit ? formatINR(e.credit) : '-'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatINR(Math.abs(e.runningBalance))} {e.runningBalance >= 0 ? 'Dr' : 'Cr'}
                          </td>
                        </tr>
                      );
                    })}

                    {ledgerEntries.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No transactions recorded for this party within {startDate} to {endDate}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right text-slate-800 dark:text-slate-200">
                        Totals / Closing Balance:
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                        {formatINR(totalDebit)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-blue-700 dark:text-blue-400">
                        {formatINR(totalCredit)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-indigo-700 dark:text-indigo-300">
                        {formatINR(Math.abs(closingBalance))} {closingBalance >= 0 ? 'Dr' : 'Cr'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* Outstanding & Ageing Analysis View */
            <div className="space-y-4">
              {/* Ageing Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">0 - 30 Days</span>
                  <span className="text-base font-bold font-mono text-emerald-800 dark:text-emerald-300 mt-1 block">
                    {formatINR(ageingSummary.b0_30)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 block">31 - 60 Days</span>
                  <span className="text-base font-bold font-mono text-blue-800 dark:text-blue-300 mt-1 block">
                    {formatINR(ageingSummary.b31_60)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">61 - 90 Days</span>
                  <span className="text-base font-bold font-mono text-amber-800 dark:text-amber-300 mt-1 block">
                    {formatINR(ageingSummary.b61_90)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">&gt; 90 Days (Overdue)</span>
                  <span className="text-base font-bold font-mono text-rose-800 dark:text-rose-300 mt-1 block">
                    {formatINR(ageingSummary.b90Plus)}
                  </span>
                </div>
              </div>

              {/* Bill by Bill Pending Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Bill-by-Bill Outstanding Analysis ({pendingInvoices.length} pending bills)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Total Pending: {formatINR(ageingSummary.totalPending)}
                    </span>
                  </div>
                  <button
                    onClick={handleGenerateOutstandingPdf}
                    className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Outstanding PDF</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                      <tr>
                        <th className="px-3.5 py-2.5">Invoice No</th>
                        <th className="px-3 py-2.5">Bill Date</th>
                        <th className="px-3 py-2.5">Due Date</th>
                        <th className="px-2.5 py-2.5 text-center">Age</th>
                        <th className="px-3.5 py-2.5 text-right">Bill Total (₹)</th>
                        <th className="px-3.5 py-2.5 text-right">Paid (₹)</th>
                        <th className="px-3.5 py-2.5 text-right">Pending Balance (₹)</th>
                        <th className="px-3 py-2.5 text-center">Overdue Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
                      {pendingInvoices.map(inv => {
                        const paid = inv.paidAmount || inv.paymentReceived || 0;
                        const pending = inv.grandTotal - paid;
                        const asOnTime = new Date(endDate).getTime();
                        const invTime = new Date(inv.date).getTime();
                        const ageDays = Math.max(0, Math.floor((asOnTime - invTime) / (1000 * 60 * 60 * 24)));
                        const dueTime = new Date(inv.dueDate || inv.date).getTime();
                        const overdueDays = Math.max(0, Math.floor((asOnTime - dueTime) / (1000 * 60 * 60 * 24)));

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                            <td className="px-3.5 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {inv.invoiceNo}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">{inv.date}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">{inv.dueDate || 'Immediate'}</td>
                            <td className="px-2.5 py-2.5 text-center font-mono text-slate-500">{ageDays}d</td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {formatINR(inv.grandTotal)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono text-emerald-600">
                              {formatINR(paid)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                              {formatINR(pending)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {overdueDays > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  {overdueDays}d Overdue
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Current
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {pendingInvoices.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                            🎉 No pending unpaid bills for this party! All invoices are fully settled.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {pendingInvoices.length > 0 && (
                      <tfoot className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-right text-slate-800 dark:text-slate-200">
                            Total Outstanding:
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono text-slate-800 dark:text-slate-200">
                            {formatINR(pendingInvoices.reduce((s, i) => s + i.grandTotal, 0))}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono text-emerald-600">
                            {formatINR(pendingInvoices.reduce((s, i) => s + (i.paidAmount || i.paymentReceived || 0), 0))}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono text-rose-600 dark:text-rose-400">
                            {formatINR(ageingSummary.totalPending)}
                          </td>
                          <td className="px-3 py-3"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
