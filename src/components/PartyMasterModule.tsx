import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Party, PartyType } from '../types';
import { formatINR, INDIAN_STATES } from '../data/indianStates';
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Share2, 
  Edit3, 
  Trash2,
  FileText,
  X,
  Printer,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { isDateInFiscalPeriod, FISCAL_MONTHS } from '../utils/financialYears';

interface PartyMasterModuleProps {
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const PartyMasterModule: React.FC<PartyMasterModuleProps> = ({
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const { 
    parties, 
    createParty, 
    updateParty,
    salesInvoices,
    purchaseInvoices,
    creditNotes,
    debitNotes,
    selectedFinancialYear,
    selectedMonth
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');
  const [showAddModal, setShowAddModal] = useState(isCreateOpen);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [viewingPartyTransactions, setViewingPartyTransactions] = useState<Party | null>(null);

  const selectedMonthLabel = FISCAL_MONTHS.find(m => m.key === selectedMonth)?.label || 'All Months';

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: PartyType;
    mobile: string;
    email: string;
    gstin: string;
    pan: string;
    state: string;
    stateCode: string;
    city: string;
    pincode: string;
    billingAddress: string;
    shippingAddress: string;
    openingBalance: number;
    creditPeriodDays: number;
    creditLimit: number;
  }>({
    name: '',
    type: 'CUSTOMER',
    mobile: '',
    email: '',
    gstin: '',
    pan: '',
    state: 'Maharashtra',
    stateCode: '27',
    city: 'Mumbai',
    pincode: '400001',
    billingAddress: '',
    shippingAddress: '',
    openingBalance: 0,
    creditPeriodDays: 30,
    creditLimit: 200000,
  });

  const handleGSTINChange = (val: string) => {
    const cleanGst = val.toUpperCase().trim();
    let pan = '';
    let stateCode = formData.stateCode;
    let state = formData.state;

    if (cleanGst.length >= 2) {
      stateCode = cleanGst.substring(0, 2);
      const foundState = INDIAN_STATES.find(s => s.code === stateCode);
      if (foundState) state = foundState.name;
    }
    if (cleanGst.length >= 12) {
      pan = cleanGst.substring(2, 12);
    }

    setFormData(prev => ({
      ...prev,
      gstin: cleanGst,
      pan,
      stateCode,
      state,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Party name is mandatory');
      return;
    }

    if (editingParty) {
      updateParty(editingParty.id, formData);
      setEditingParty(null);
    } else {
      createParty({
        ...formData,
        currentBalance: formData.openingBalance,
      });
    }

    setShowAddModal(false);
    if (onCloseCreate) onCloseCreate();

    // Reset
    setFormData({
      name: '',
      type: 'CUSTOMER',
      mobile: '',
      email: '',
      gstin: '',
      pan: '',
      state: 'Maharashtra',
      stateCode: '27',
      city: 'Mumbai',
      pincode: '400001',
      billingAddress: '',
      shippingAddress: '',
      openingBalance: 0,
      creditPeriodDays: 30,
      creditLimit: 200000,
    });
  };

  const filteredParties = parties.filter(p => {
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.mobile || '').toLowerCase().includes(q) ||
      (Boolean(p.gstin) && (p.gstin || '').toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (filterType === 'CUSTOMER') return p.type === 'CUSTOMER' || p.type === 'BOTH';
    if (filterType === 'SUPPLIER') return p.type === 'SUPPLIER' || p.type === 'BOTH';
    return true;
  });

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Party Master Directory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
              {parties.length} Accounts
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customers and Suppliers with GSTIN validation, automatic PAN extraction, and ledger balances
          </p>
        </div>

        <button
          onClick={() => {
            setEditingParty(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Add New Party</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, mobile, or GSTIN..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Parties
          </button>
          <button
            onClick={() => setFilterType('CUSTOMER')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'CUSTOMER' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Customers Only
          </button>
          <button
            onClick={() => setFilterType('SUPPLIER')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'SUPPLIER' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Suppliers Only
          </button>
        </div>
      </div>

      {/* Party Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.map(party => (
          <div
            key={party.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{party.name}</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      party.type === 'CUSTOMER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                      party.type === 'SUPPLIER' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {party.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                    <span>GSTIN: {party.gstin || 'Unregistered / B2C'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingParty(party);
                    setFormData({
                      name: party.name || '',
                      type: party.type || 'CUSTOMER',
                      mobile: party.mobile || '',
                      email: party.email || '',
                      gstin: party.gstin || '',
                      pan: party.pan || '',
                      state: party.state || 'Maharashtra',
                      stateCode: party.stateCode || '27',
                      city: party.city || '',
                      pincode: party.pincode || '',
                      billingAddress: party.billingAddress || '',
                      shippingAddress: party.shippingAddress || '',
                      openingBalance: party.openingBalance ?? 0,
                      creditPeriodDays: party.creditPeriodDays ?? 30,
                      creditLimit: party.creditLimit ?? 200000,
                    });
                    setShowAddModal(true);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>+91 {party.mobile || '—'}</span>
                </div>
                {party.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{party.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{party.city}, {party.state} ({party.stateCode})</span>
                </div>
              </div>
            </div>

            {/* Bottom Balance & Ledger */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setViewingPartyTransactions(party)}
                className="text-left group/btn p-1 -m-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                title="Click to view all bills and transactions for this party in selected period"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 block font-semibold group-hover/btn:text-blue-600 transition-colors">Ledger Balance</span>
                  <FileText className="w-3 h-3 text-slate-400 group-hover/btn:text-blue-600 transition-colors" />
                </div>
                <span className={`font-bold font-mono text-sm ${
                  party.currentBalance > 0 ? 'text-blue-600 dark:text-blue-400' :
                  party.currentBalance < 0 ? 'text-amber-600 dark:text-amber-400' :
                  'text-slate-500'
                }`}>
                  {formatINR(Math.abs(party.currentBalance))} {party.currentBalance > 0 ? 'Dr (Receivable)' : party.currentBalance < 0 ? 'Cr (Payable)' : 'Settled'}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 block underline mt-0.5">
                  View Transactions →
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewingPartyTransactions(party)}
                  className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  title="View bills in selected FY/Month"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bills</span>
                </button>

                <a
                  href={`https://wa.me/91${party.mobile}?text=${encodeURIComponent(
                    `Hello ${party.name},\nYour current outstanding ledger balance with us is ${formatINR(Math.abs(party.currentBalance))}.\nKindly review and clear due payment.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                  title="Send Ledger Statement via WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add/Edit Party */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingParty ? 'Edit Party Account' : 'Create New Customer / Supplier'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  if (onCloseCreate) onCloseCreate();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Party / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apex Engineering Works"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Party Type</label>
                  <select
                    value={formData.type || 'CUSTOMER'}
                    onChange={e => setFormData({ ...formData, type: e.target.value as PartyType })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    <option value="CUSTOMER">Customer (Debtor)</option>
                    <option value="SUPPLIER">Supplier (Creditor)</option>
                    <option value="BOTH">Both (Customer &amp; Supplier)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN (15 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gstin || ''}
                    onChange={e => handleGSTINChange(e.target.value)}
                    placeholder="27AABCA1234A1Z5"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PAN (Auto-extracted)
                  </label>
                  <input
                    type="text"
                    value={formData.pan || ''}
                    onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="Auto PAN"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State &amp; Code
                  </label>
                  <select
                    value={formData.stateCode || '27'}
                    onChange={e => {
                      const code = e.target.value;
                      const st = INDIAN_STATES.find(s => s.code === code);
                      setFormData({ ...formData, stateCode: code, state: st ? st.name : '' });
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    {INDIAN_STATES.map(st => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile || ''}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    placeholder="10-digit mobile"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="accounts@apex.com"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={formData.openingBalance ?? 0}
                    onChange={e => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.creditLimit ?? 0}
                    onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Credit Period (Days)</label>
                  <input
                    type="number"
                    value={formData.creditPeriodDays ?? 30}
                    onChange={e => setFormData({ ...formData, creditPeriodDays: parseInt(e.target.value) || 30 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={formData.billingAddress || ''}
                  onChange={e => setFormData({ ...formData, billingAddress: e.target.value, shippingAddress: formData.shippingAddress || e.target.value })}
                  placeholder="Plot No, Industrial Area, Street..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (onCloseCreate) onCloseCreate();
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Party Transaction Details (Filtered strictly by selected FY & Month) */}
      {viewingPartyTransactions && (() => {
        const party = viewingPartyTransactions;
        const partySales = salesInvoices.filter(i => 
          (i.customerId === party.id || (i.customerName && i.customerName.toLowerCase() === party.name.toLowerCase())) &&
          isDateInFiscalPeriod(i.date, selectedFinancialYear, selectedMonth)
        );
        const partyPurchases = purchaseInvoices.filter(i => 
          (i.supplierId === party.id || (i.supplierName && i.supplierName.toLowerCase() === party.name.toLowerCase())) &&
          isDateInFiscalPeriod(i.date, selectedFinancialYear, selectedMonth)
        );
        const partyCredits = creditNotes.filter(i => 
          (i.customerId === party.id || (i.customerName && i.customerName.toLowerCase() === party.name.toLowerCase())) &&
          isDateInFiscalPeriod(i.date, selectedFinancialYear, selectedMonth)
        );
        const partyDebits = debitNotes.filter(i => 
          (i.supplierId === party.id || (i.supplierName && i.supplierName.toLowerCase() === party.name.toLowerCase())) &&
          isDateInFiscalPeriod(i.date, selectedFinancialYear, selectedMonth)
        );

        // Combined unified transaction list
        const txList = [
          ...partySales.map(s => ({
            id: s.id,
            date: s.date,
            type: 'SALES' as const,
            typeLabel: 'Sales Invoice',
            badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
            voucherNo: s.invoiceNo,
            taxable: s.taxableAmount,
            tax: s.cgst + s.sgst + s.igst,
            total: s.grandTotal,
            status: s.status,
            irn: s.irn
          })),
          ...partyPurchases.map(p => ({
            id: p.id,
            date: p.date,
            type: 'PURCHASE' as const,
            typeLabel: 'Purchase Bill',
            badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
            voucherNo: p.supplierInvoiceNo || p.invoiceNo,
            taxable: p.taxableAmount,
            tax: p.cgst + p.sgst + p.igst,
            total: p.grandTotal,
            status: p.status,
            irn: undefined
          })),
          ...partyCredits.map(c => ({
            id: c.id,
            date: c.date,
            type: 'CREDIT_NOTE' as const,
            typeLabel: 'Credit Note',
            badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
            voucherNo: c.creditNoteNo,
            taxable: c.taxableAmount,
            tax: c.cgst + c.sgst + c.igst,
            total: c.totalAmount,
            status: 'POSTED',
            irn: undefined
          })),
          ...partyDebits.map(d => ({
            id: d.id,
            date: d.date,
            type: 'DEBIT_NOTE' as const,
            typeLabel: 'Debit Note',
            badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
            voucherNo: d.debitNoteNo,
            taxable: d.taxableAmount,
            tax: d.cgst + d.sgst + d.igst,
            total: d.totalAmount,
            status: 'POSTED',
            irn: undefined
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalTaxable = txList.reduce((acc, t) => acc + t.taxable, 0);
        const totalTax = txList.reduce((acc, t) => acc + t.tax, 0);
        const totalAmount = txList.reduce((acc, t) => acc + t.total, 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 my-auto print:border-none print:shadow-none">
              
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {party.name}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      party.type === 'CUSTOMER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                      party.type === 'SUPPLIER' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {party.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                    <span>GSTIN: {party.gstin || 'Unregistered'}</span>
                    <span>•</span>
                    <span>State: {party.state} ({party.stateCode})</span>
                    <span>•</span>
                    <span className="font-sans font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                      Filtered: FY {selectedFinancialYear} • {selectedMonthLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Statement</span>
                  </button>
                  <button
                    onClick={() => setViewingPartyTransactions(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Total Bills in Period</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {txList.length}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Total Taxable Value</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {formatINR(totalTaxable)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Total GST Amount</span>
                  <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {formatINR(totalTax)}
                  </span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 block font-semibold">Total Bill Amount</span>
                  <span className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300">
                    {formatINR(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Bill / Voucher #</th>
                      <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                      <th className="py-2.5 px-3 text-right">GST (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {txList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                          No transactions found for {party.name} in FY {selectedFinancialYear} ({selectedMonthLabel}).
                        </td>
                      </tr>
                    ) : (
                      txList.map(tx => (
                        <tr key={`${tx.type}-${tx.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{tx.date}</td>
                          <td className="py-2 px-3 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.badgeClass}`}>
                              {tx.typeLabel}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                            {tx.voucherNo}
                            {tx.irn && (
                              <span className="block text-[9px] text-emerald-600 font-sans">e-Invoice IRN Active</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">{formatINR(tx.taxable)}</td>
                          <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-400">{formatINR(tx.tax)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{formatINR(tx.total)}</td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 text-xs">
                <span className="text-slate-500">
                  Current Master Ledger Balance: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatINR(Math.abs(party.currentBalance))} {party.currentBalance > 0 ? 'Dr' : 'Cr'}</strong>
                </span>
                <button
                  onClick={() => setViewingPartyTransactions(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
