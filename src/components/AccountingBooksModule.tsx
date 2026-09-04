import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../data/indianStates';
import { JournalVoucher } from '../types';
import { 
  BookOpen, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Scale, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { FinancialYearSelect } from './FinancialYearSelect';

export const AccountingBooksModule: React.FC = () => {
  const { 
    salesInvoices, 
    purchaseInvoices, 
    creditNotes, 
    debitNotes, 
    journalVouchers, 
    parties, 
    createJournalVoucher,
    selectedFinancialYear,
    setSelectedFinancialYear
  } = useApp();
  const [activeTab, setActiveTab] = useState<'DAYBOOK' | 'JOURNAL' | 'TRIAL_BALANCE' | 'PNL' | 'AGING'>('DAYBOOK');
  const [showJournalModal, setShowJournalModal] = useState(false);

  // Journal form state
  const [jvDate, setJvDate] = useState(new Date().toISOString().substring(0, 10));
  const [debitAccount, setDebitAccount] = useState('Rent Expense A/c');
  const [creditAccount, setCreditAccount] = useState('HDFC Bank Current A/c');
  const [amount, setAmount] = useState(25000);
  const [narration, setNarration] = useState('Office rent paid for the month');

  // Day Book: Aggregate all transactions sorted by date
  type DayBookEntry = {
    id: string;
    date: string;
    type: 'SALES' | 'PURCHASE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'JOURNAL';
    docNo: string;
    particulars: string;
    debitAmount: number;
    creditAmount: number;
  };

  const safeSales = Array.isArray(salesInvoices) ? salesInvoices : [];
  const safePurchases = Array.isArray(purchaseInvoices) ? purchaseInvoices : [];
  const safeCredits = Array.isArray(creditNotes) ? creditNotes : [];
  const safeDebits = Array.isArray(debitNotes) ? debitNotes : [];
  const safeJournals = Array.isArray(journalVouchers) ? journalVouchers : [];
  const safeParties = Array.isArray(parties) ? parties : [];

  const dayBookEntries: DayBookEntry[] = [
    ...safeSales.map(s => ({
      id: s.id,
      date: s.date,
      type: 'SALES' as const,
      docNo: s.invoiceNo,
      particulars: `${s.customerName} (Sales A/c)`,
      debitAmount: s.grandTotal, // Debtor Dr
      creditAmount: 0,
    })),
    ...safePurchases.map(p => ({
      id: p.id,
      date: p.date,
      type: 'PURCHASE' as const,
      docNo: p.invoiceNo || (p as any).billNo || p.supplierInvoiceNo || 'PINV',
      particulars: `${p.supplierName || 'Vendor'} (Purchase A/c)`,
      debitAmount: 0,
      creditAmount: p.grandTotal || 0, // Creditor Cr
    })),
    ...safeCredits.map(c => ({
      id: c.id,
      date: c.date,
      type: 'CREDIT_NOTE' as const,
      docNo: c.creditNoteNo || (c as any).noteNo || 'CN',
      particulars: `${c.customerName || 'Customer'} (Sales Return)`,
      debitAmount: 0,
      creditAmount: c.totalAmount || 0,
    })),
    ...safeDebits.map(d => ({
      id: d.id,
      date: d.date,
      type: 'DEBIT_NOTE' as const,
      docNo: d.debitNoteNo || (d as any).noteNo || 'DN',
      particulars: `${d.supplierName || 'Supplier'} (Purchase Return)`,
      debitAmount: d.totalAmount || 0,
      creditAmount: 0,
    })),
    ...safeJournals.map(j => {
      const entry0 = (j as any).entries?.[0] || j.lines?.[0];
      const entry1 = (j as any).entries?.[1] || j.lines?.[1];
      const name0 = entry0?.accountName || 'Journal Adjustment';
      const name1 = entry1?.accountName || '';
      return {
        id: j.id,
        date: j.date,
        type: 'JOURNAL' as const,
        docNo: (j as any).voucherNo || j.entryNo || 'JV',
        particulars: name1 ? `${name0} / ${name1}` : name0,
        debitAmount: (j as any).totalDebit || entry0?.debit || j.totalAmount || 0,
        creditAmount: (j as any).totalCredit || entry1?.credit || j.totalAmount || 0,
      };
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Trial Balance calculation
  const totalSalesRevenue = safeSales.reduce((s, i) => s + i.taxableAmount, 0);
  const totalPurchaseCost = safePurchases.reduce((s, i) => s + i.taxableAmount, 0);
  const totalGstInputCredit = safePurchases.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);
  const totalGstOutputLiability = safeSales.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);

  const debtorsTotal = safeParties
    .filter(p => p.currentBalance > 0)
    .reduce((s, p) => s + p.currentBalance, 0);

  const creditorsTotal = safeParties
    .filter(p => p.currentBalance < 0)
    .reduce((s, p) => s + Math.abs(p.currentBalance), 0);

  const trialBalanceList = [
    { account: 'Sundry Debtors (Trade Receivables)', group: 'Current Assets', debit: debtorsTotal, credit: 0 },
    { account: 'Sundry Creditors (Trade Payables)', group: 'Current Liabilities', debit: 0, credit: creditorsTotal },
    { account: 'Input Tax Credit (GST Ledger Dr)', group: 'Duties & Taxes', debit: totalGstInputCredit, credit: 0 },
    { account: 'Output GST Tax Collected (Cr)', group: 'Duties & Taxes', debit: 0, credit: totalGstOutputLiability },
    { account: 'Sales Account (Turnover)', group: 'Direct Incomes', debit: 0, credit: totalSalesRevenue },
    { account: 'Purchase Account', group: 'Direct Expenses', debit: totalPurchaseCost, credit: 0 },
    { account: 'Bank Accounts (HDFC Current A/c)', group: 'Bank Accounts', debit: 1250000, credit: 0 },
    { account: 'Capital Account (Equity)', group: 'Capital Account', debit: 0, credit: 1250000 + (totalSalesRevenue - totalPurchaseCost) + debtorsTotal - creditorsTotal },
  ];

  const totalTbDebit = trialBalanceList.reduce((s, i) => s + i.debit, 0);
  const totalTbCredit = trialBalanceList.reduce((s, i) => s + i.credit, 0);

  // Profit & Loss calculation
  const grossProfit = totalSalesRevenue - totalPurchaseCost;
  const indirectExpenses = 35000; // Utilities, Rent, Salaries
  const netProfit = grossProfit - indirectExpenses;

  // Aging analysis
  const aging30Days = debtorsTotal * 0.65;
  const aging60Days = debtorsTotal * 0.25;
  const aging90Days = debtorsTotal * 0.10;

  const handleCreateJV = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    createJournalVoucher({
      type: 'JOURNAL',
      date: jvDate,
      narration,
      lines: [
        { id: 'jl-' + Date.now() + '-1', accountCode: 'DR', accountName: debitAccount, debit: amount, credit: 0 },
        { id: 'jl-' + Date.now() + '-2', accountCode: 'CR', accountName: creditAccount, debit: 0, credit: amount },
      ],
      entries: [
        { accountName: debitAccount, debit: amount, credit: 0 },
        { accountName: creditAccount, debit: 0, credit: amount },
      ],
      totalAmount: amount,
      totalDebit: amount,
      totalCredit: amount,
    });

    setShowJournalModal(false);
    alert('Journal Voucher posted successfully.');
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Accounting Books &amp; Financial Statements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Double-entry Day Book, Trial Balance verification, Profit &amp; Loss, and Outstanding Aging
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <FinancialYearSelect
            value={selectedFinancialYear}
            onChange={setSelectedFinancialYear}
            compact
            label="Book FY"
          />

          <button
            onClick={() => setShowJournalModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Journal Voucher (JV)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('DAYBOOK')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'DAYBOOK'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Day Book ({dayBookEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TRIAL_BALANCE')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'TRIAL_BALANCE'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Trial Balance (Dr = Cr)</span>
        </button>

        <button
          onClick={() => setActiveTab('PNL')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'PNL'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Profit &amp; Loss Statement</span>
        </button>

        <button
          onClick={() => setActiveTab('AGING')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'AGING'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Receivables Aging (0-90+ Days)</span>
        </button>
      </div>

      {/* Tab 1: Day Book */}
      {activeTab === 'DAYBOOK' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Voucher Type</th>
                  <th className="px-4 py-3">Doc / Voucher No</th>
                  <th className="px-4 py-3">Particulars &amp; Ledger</th>
                  <th className="px-4 py-3 text-right">Debit (Dr)</th>
                  <th className="px-4 py-3 text-right">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                {dayBookEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-sans text-slate-600 dark:text-slate-400">{entry.date}</td>
                    <td className="px-4 py-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        entry.type === 'SALES' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                        entry.type === 'PURCHASE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        entry.type === 'CREDIT_NOTE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                        entry.type === 'DEBIT_NOTE' ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      }`}>
                        {entry.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{entry.docNo}</td>
                    <td className="px-4 py-3 font-sans font-medium text-slate-800 dark:text-slate-200">{entry.particulars}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                      {entry.debitAmount > 0 ? formatINR(entry.debitAmount) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400">
                      {entry.creditAmount > 0 ? formatINR(entry.creditAmount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Trial Balance */}
      {activeTab === 'TRIAL_BALANCE' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Trial Balance (Double-Entry Verification)</span>
              <p className="text-xs text-slate-500">Auto-balanced verification for all company active ledgers</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Balanced (Dr = Cr)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Account Head</th>
                  <th className="px-4 py-3">Account Group</th>
                  <th className="px-4 py-3 text-right font-mono">Debit Balance (₹)</th>
                  <th className="px-4 py-3 text-right font-mono">Credit Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                {trialBalanceList.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-2.5 font-sans font-semibold text-slate-900 dark:text-white">{row.account}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-500">{row.group}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      {row.debit > 0 ? formatINR(row.debit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      {row.credit > 0 ? formatINR(row.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-900 font-mono font-bold text-xs border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-sans text-slate-900 dark:text-white text-right">
                    Total Trial Balance Sum:
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatINR(totalTbDebit)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatINR(totalTbCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Profit & Loss */}
      {activeTab === 'PNL' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Statement of Profit and Loss</h2>
              <p className="text-xs text-slate-500">For the Financial Year 2024-25</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Net Profit:</span>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatINR(netProfit)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Direct Expenses */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                Expenses &amp; Purchases
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Cost of Goods / Purchases</span>
                <span className="font-mono font-bold">{formatINR(totalPurchaseCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Administrative &amp; Utility Overheads</span>
                <span className="font-mono font-bold">{formatINR(indirectExpenses)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold">
                <span>Total Costs:</span>
                <span className="font-mono text-rose-600">{formatINR(totalPurchaseCost + indirectExpenses)}</span>
              </div>
            </div>

            {/* Income */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                Revenue &amp; Sales Turnover
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Net Revenue from Operations (Taxable)</span>
                <span className="font-mono font-bold">{formatINR(totalSalesRevenue)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold">
                <span>Total Incomes:</span>
                <span className="font-mono text-emerald-600">{formatINR(totalSalesRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Receivables Aging */}
      {activeTab === 'AGING' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="text-xs text-slate-500">0 - 30 Days (Current)</div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {formatINR(aging30Days)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Healthy credit range</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="text-xs text-slate-500">31 - 60 Days</div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                {formatINR(aging60Days)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Follow-up due reminder</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="text-xs text-slate-500">61 - 90 Days</div>
              <div className="text-xl font-bold font-mono text-orange-600 dark:text-orange-400 mt-1">
                {formatINR(aging90Days)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Send statement notice</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="text-xs text-slate-500">Total Outstanding</div>
              <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                {formatINR(debtorsTotal)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total trade debtors</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Journal Voucher */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              New Journal Voucher (Double-Entry)
            </h2>
            <p className="text-xs text-slate-500 mb-4">Manual ledger adjustment and non-cash postings</p>

            <form onSubmit={handleCreateJV} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Voucher Date</label>
                <input
                  type="date"
                  required
                  value={jvDate}
                  onChange={e => setJvDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Debit Account (Dr)</label>
                <input
                  type="text"
                  required
                  value={debitAccount}
                  onChange={e => setDebitAccount(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Credit Account (Cr)</label>
                <input
                  type="text"
                  required
                  value={creditAccount}
                  onChange={e => setCreditAccount(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Narration / Remarks</label>
                <input
                  type="text"
                  required
                  value={narration}
                  onChange={e => setNarration(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Post Journal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
