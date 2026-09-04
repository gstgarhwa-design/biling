import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../data/indianStates';
import { 
  FileCheck2, 
  Download, 
  FileText, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Calendar,
  ChevronDown,
  FileSpreadsheet,
  Printer,
  FileCode2
} from 'lucide-react';
import { FinancialYearSelect } from './FinancialYearSelect';
import { isDateInFiscalPeriod, FISCAL_MONTHS } from '../utils/financialYears';
import { 
  exportGstr1GovtJson, 
  exportGstr1GovtExcel, 
  exportGstr3bGovtJson, 
  exportGstr3bGovtExcel, 
  exportGstr2bGovtExcel,
  exportComprehensiveBusinessJson,
  exportComprehensiveBusinessExcel
} from '../utils/govGstExports';

export const GSTRReportsModule: React.FC = () => {
  const { 
    activeCompany, 
    salesInvoices, 
    purchaseInvoices, 
    creditNotes, 
    debitNotes, 
    paymentsReceipts,
    parties,
    selectedPeriodLabel,
    isDateInSelectedPeriod
  } = useApp();
  const [activeReportTab, setActiveReportTab] = useState<'GSTR1' | 'GSTR3B' | 'ITC_RECON' | 'HSN_SUMMARY'>('GSTR1');
  const [returnPeriod, setReturnPeriod] = useState('022025'); // Feb 2025

  // 1. & 2. FILTERED BY ACTIVE PERIOD (FY / Month / Custom)
  const periodSalesInvoices = (salesInvoices || []).filter(i => isDateInSelectedPeriod(i.date));
  const periodPurchaseInvoices = (purchaseInvoices || []).filter(i => isDateInSelectedPeriod(i.date));
  const periodCreditNotes = (creditNotes || []).filter(i => isDateInSelectedPeriod(i.date));
  const periodDebitNotes = (debitNotes || []).filter(i => isDateInSelectedPeriod(i.date));
  const periodPaymentsReceipts = (paymentsReceipts || []).filter(pr => isDateInSelectedPeriod(pr.date));

  // GSTR-1 Breakup:
  // 1. Table 4: B2B Invoices
  const b2bInvoices = periodSalesInvoices.filter(i => !!i.customerGstin && i.status === 'POSTED');
  const b2bTaxable = b2bInvoices.reduce((s, i) => s + i.taxableAmount, 0);
  const b2bTax = b2bInvoices.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);

  // 2. Table 7: B2C Small
  const b2cInvoices = periodSalesInvoices.filter(i => !i.customerGstin && i.status === 'POSTED');
  const b2cTaxable = b2cInvoices.reduce((s, i) => s + i.taxableAmount, 0);
  const b2cTax = b2cInvoices.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);

  // 3. Table 9B: Credit Notes
  const cdTaxable = periodCreditNotes.reduce((s, c) => s + c.taxableAmount, 0);
  const cdTax = periodCreditNotes.reduce((s, c) => s + (c.cgst + c.sgst + c.igst), 0);

  // GSTR-3B Calculations:
  const totalOutwardTaxable = b2bTaxable + b2cTaxable - cdTaxable;
  const totalOutputCgst = periodSalesInvoices.filter(i => i.status === 'POSTED').reduce((s, i) => s + i.cgst, 0);
  const totalOutputSgst = periodSalesInvoices.filter(i => i.status === 'POSTED').reduce((s, i) => s + i.sgst, 0);
  const totalOutputIgst = periodSalesInvoices.filter(i => i.status === 'POSTED').reduce((s, i) => s + i.igst, 0);

  const eligibleItcCgst = periodPurchaseInvoices.filter(i => i.status === 'POSTED').reduce((s, i) => s + i.cgst, 0);
  const eligibleItcSgst = periodPurchaseInvoices.filter(i => i.status === 'POSTED').reduce((s, i) => s + i.sgst, 0);
  const eligibleItcIgst = periodPurchaseInvoices.filter(i => i.status === 'POSTED').reduce((s, i) => s + i.igst, 0);

  const netPayableCgst = Math.max(0, totalOutputCgst - eligibleItcCgst);
  const netPayableSgst = Math.max(0, totalOutputSgst - eligibleItcSgst);
  const netPayableIgst = Math.max(0, totalOutputIgst - eligibleItcIgst);
  const totalNetGstPayable = netPayableCgst + netPayableSgst + netPayableIgst;

  // HSN Breakdown
  const hsnMap: Record<string, { hsn: string; desc: string; qty: number; uqc: string; taxable: number; igst: number; cgst: number; sgst: number }> = {};

  periodSalesInvoices.filter(i => i.status === 'POSTED').forEach(inv => {
    inv.items.forEach(it => {
      if (!hsnMap[it.hsnSac]) {
        hsnMap[it.hsnSac] = {
          hsn: it.hsnSac,
          desc: it.name,
          qty: 0,
          uqc: it.unit,
          taxable: 0,
          igst: 0,
          cgst: 0,
          sgst: 0,
        };
      }
      hsnMap[it.hsnSac].qty += it.qty;
      hsnMap[it.hsnSac].taxable += it.taxableValue;
      hsnMap[it.hsnSac].igst += it.igst;
      hsnMap[it.hsnSac].cgst += it.cgst;
      hsnMap[it.hsnSac].sgst += it.sgst;
    });
  });

  const hsnList = Object.values(hsnMap);

  // Government GST Return Export Handlers (Real DB Data for selected FY/Month)
  const handleExportGstr1Json = () => {
    exportGstr1GovtJson(activeCompany, returnPeriod, periodSalesInvoices, periodCreditNotes);
  };

  const handleExportGstr1Excel = () => {
    exportGstr1GovtExcel(activeCompany, returnPeriod, periodSalesInvoices, periodCreditNotes);
  };

  const handleExportGstr3bJson = () => {
    exportGstr3bGovtJson(activeCompany, returnPeriod, periodSalesInvoices, periodPurchaseInvoices, periodCreditNotes, periodDebitNotes);
  };

  const handleExportGstr3bExcel = () => {
    exportGstr3bGovtExcel(activeCompany, returnPeriod, periodSalesInvoices, periodPurchaseInvoices, periodCreditNotes, periodDebitNotes);
  };

  const handleExportGstr2bExcel = () => {
    exportGstr2bGovtExcel(activeCompany, returnPeriod, periodPurchaseInvoices, periodDebitNotes);
  };

  const handleExportBusinessJson = () => {
    exportComprehensiveBusinessJson(
      activeCompany,
      selectedPeriodLabel.replace(/[^a-zA-Z0-9]/g, '_'),
      periodSalesInvoices,
      periodPurchaseInvoices,
      periodCreditNotes,
      periodDebitNotes,
      parties,
      periodPaymentsReceipts
    );
  };

  const handleExportBusinessExcel = () => {
    exportComprehensiveBusinessExcel(
      activeCompany,
      selectedPeriodLabel.replace(/[^a-zA-Z0-9]/g, '_'),
      periodSalesInvoices,
      periodPurchaseInvoices,
      periodCreditNotes,
      periodDebitNotes,
      parties,
      periodPaymentsReceipts
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>GST Compliance &amp; Return Filing Suite</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">GSTR-1, GSTR-3B &amp; ITC Center</h1>
          <p className="text-xs text-emerald-100/80 mt-0.5">
            Auto-compiled returns from registered sales, debit/credit notes, and input tax credit ledgers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeReportTab === 'GSTR1' && (
            <>
              <button
                onClick={handleExportGstr1Json}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                title="Download official JSON file for direct upload to GST Common Portal"
              >
                <FileCode2 className="w-4 h-4" />
                <span>Govt GSTR-1 JSON</span>
              </button>
              <button
                onClick={handleExportGstr1Excel}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                title="Download official multi-sheet Excel matching GST Offline Tool template"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Govt GSTR-1 Excel</span>
              </button>
            </>
          )}

          {activeReportTab === 'GSTR3B' && (
            <>
              <button
                onClick={handleExportGstr3bJson}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                title="Download official GSTR-3B JSON for GST portal upload"
              >
                <FileCode2 className="w-4 h-4" />
                <span>Govt GSTR-3B JSON</span>
              </button>
              <button
                onClick={handleExportGstr3bExcel}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                title="Download Form GSTR-3B Return Summary (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Govt GSTR-3B Excel</span>
              </button>
            </>
          )}

          {activeReportTab === 'ITC_RECON' && (
            <button
              onClick={handleExportGstr2bExcel}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
              title="Download GSTR-2B Statement & Inward ITC Register (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export GSTR-2B (.xlsx)</span>
            </button>
          )}

          {activeReportTab === 'HSN_SUMMARY' && (
            <button
              onClick={handleExportGstr1Excel}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export HSN Excel</span>
            </button>
          )}

          {/* 1. & 2. Comprehensive Business JSON & Excel Exports */}
          <button
            onClick={handleExportBusinessJson}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            title="Download complete business data JSON for selected Financial Year & Month"
          >
            <Download className="w-4 h-4" />
            <span>Export Business JSON</span>
          </button>
          <button
            onClick={handleExportBusinessExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            title="Download comprehensive multi-sheet Excel report (Sales, Purchases, Credit Notes, ITC, Payables)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Business Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* Tax Period & Active FY Info */}
      <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Tax Period:</span>
            <select
              value={returnPeriod || '022025'}
              onChange={e => setReturnPeriod(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold"
            >
              <option value="022025">February 2025 (Monthly)</option>
              <option value="012025">January 2025 (Monthly)</option>
              <option value="122024">December 2024 (Monthly)</option>
              <option value="Q32025">Q3 FY 2024-25 (QRMP)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Active Period Info */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Period Filter:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
              {selectedPeriodLabel}
            </span>
          </div>
        </div>

        <div className="text-slate-500">
          Entity GSTIN: <span className="font-mono font-bold text-slate-900 dark:text-white">{activeCompany?.gstin}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveReportTab('GSTR1')}
          className={`pb-3 border-b-2 transition-colors ${
            activeReportTab === 'GSTR1'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          GSTR-1 Outward Supplies
        </button>
        <button
          onClick={() => setActiveReportTab('GSTR3B')}
          className={`pb-3 border-b-2 transition-colors ${
            activeReportTab === 'GSTR3B'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          GSTR-3B Summary &amp; Payment
        </button>
        <button
          onClick={() => setActiveReportTab('HSN_SUMMARY')}
          className={`pb-3 border-b-2 transition-colors ${
            activeReportTab === 'HSN_SUMMARY'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Table 12: HSN Summary ({hsnList.length})
        </button>
        <button
          onClick={() => setActiveReportTab('ITC_RECON')}
          className={`pb-3 border-b-2 transition-colors ${
            activeReportTab === 'ITC_RECON'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          GSTR-2B ITC Reconciliation
        </button>
      </div>

      {/* Tab 1: GSTR-1 Outward Supplies */}
      {activeReportTab === 'GSTR1' && (
        <div className="space-y-4">
          {/* Table 4: B2B Invoices Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  4A, 4B, 6B, 6C - B2B Invoices
                </span>
                <p className="text-xs text-slate-500">Taxable outward supplies made to registered persons</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Total Taxable: </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{formatINR(b2bTaxable)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2">Invoice No</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Recipient GSTIN</th>
                    <th className="px-3 py-2">Recipient Name</th>
                    <th className="px-3 py-2 text-right">Invoice Value</th>
                    <th className="px-3 py-2 text-right">Taxable Value</th>
                    <th className="px-3 py-2 text-right">IGST</th>
                    <th className="px-3 py-2 text-right">CGST</th>
                    <th className="px-3 py-2 text-right">SGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                  {b2bInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 text-center text-slate-400 font-sans">
                        No B2B invoices recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    b2bInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{inv.invoiceNo}</td>
                        <td className="px-3 py-2 text-slate-500 font-sans">{inv.date}</td>
                        <td className="px-3 py-2 font-semibold text-blue-600 dark:text-blue-400">{inv.customerGstin}</td>
                        <td className="px-3 py-2 font-sans text-slate-800 dark:text-slate-200">{inv.customerName}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">{formatINR(inv.grandTotal)}</td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">{formatINR(inv.taxableAmount)}</td>
                        <td className="px-3 py-2 text-right text-indigo-600 dark:text-indigo-400">{formatINR(inv.igst)}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{formatINR(inv.cgst)}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{formatINR(inv.sgst)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 7: B2C Small Invoices Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Table 7 - B2C (Others / Small)
                </span>
                <p className="text-xs text-slate-500">Supplies made to consumers and unregistered persons</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Taxable Value: </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{formatINR(b2cTaxable)}</span>
              </div>
            </div>

            <div className="p-4 text-xs text-slate-600 dark:text-slate-300">
              Total B2C Invoices: <b>{b2cInvoices.length}</b> &nbsp;|&nbsp; 
              Total Taxable Value: <b>{formatINR(b2cTaxable)}</b> &nbsp;|&nbsp; 
              Total Tax Collected: <b>{formatINR(b2cTax)}</b>
            </div>
          </div>

          {/* Table 9B: Credit / Debit Notes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Table 9B - Credit / Debit Notes (Registered)
                </span>
                <p className="text-xs text-slate-500">Returns and rate difference adjustments</p>
              </div>
              <div className="text-right font-mono font-bold text-rose-600">
                Total CN Amount: {formatINR(cdTaxable)}
              </div>
            </div>

            <div className="p-4 text-xs text-slate-600 dark:text-slate-300">
              Credit Notes Issued: <b>{creditNotes.length}</b> &nbsp;|&nbsp; 
              Tax Adjusted: <b>{formatINR(cdTax)}</b>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GSTR-3B Summary & Tax Computation */}
      {activeReportTab === 'GSTR3B' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              3.1 Outward Supplies and Inward Supplies Liable to Reverse Charge
            </h2>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-3">Nature of Supplies</th>
                    <th className="p-3 text-right">Total Taxable Value</th>
                    <th className="p-3 text-right">Integrated Tax (IGST)</th>
                    <th className="p-3 text-right">Central Tax (CGST)</th>
                    <th className="p-3 text-right">State Tax (SGST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono">
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">
                      (a) Outward taxable supplies (other than zero rated, nil and exempted)
                    </td>
                    <td className="p-3 text-right font-bold">{formatINR(totalOutwardTaxable)}</td>
                    <td className="p-3 text-right">{formatINR(totalOutputIgst)}</td>
                    <td className="p-3 text-right">{formatINR(totalOutputCgst)}</td>
                    <td className="p-3 text-right">{formatINR(totalOutputSgst)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Eligible ITC */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              4. Eligible Input Tax Credit (ITC)
            </h2>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-3">Details</th>
                    <th className="p-3 text-right">Integrated Tax</th>
                    <th className="p-3 text-right">Central Tax</th>
                    <th className="p-3 text-right">State Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono">
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">
                      (A)(5) All other ITC (Inward supplies from registered persons)
                    </td>
                    <td className="p-3 text-right">{formatINR(eligibleItcIgst)}</td>
                    <td className="p-3 text-right">{formatINR(eligibleItcCgst)}</td>
                    <td className="p-3 text-right">{formatINR(eligibleItcSgst)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Payment of Tax (Challan) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  6.1 Payment of Tax (Net Liability after ITC Set-Off)
                </h2>
                <p className="text-xs text-slate-500">Calculated according to Section 49 set-off rules</p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500">Total Net Cash Payable: </span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatINR(totalNetGstPayable)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 font-sans">IGST Cash Liability</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatINR(netPayableIgst)}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 font-sans">CGST Cash Liability</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{formatINR(netPayableCgst)}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 font-sans">SGST Cash Liability</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{formatINR(netPayableSgst)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Table 12 HSN Summary */}
      {activeReportTab === 'HSN_SUMMARY' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Table 12 - HSN-wise Summary of Outward Supplies
              </span>
              <p className="text-xs text-slate-500">Government mandatory 6/8 digit HSN code summary</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2 font-mono">HSN/SAC</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-center font-mono">UQC</th>
                  <th className="px-3 py-2 text-center font-mono">Total Qty</th>
                  <th className="px-3 py-2 text-right font-mono">Total Taxable Value</th>
                  <th className="px-3 py-2 text-right font-mono">IGST</th>
                  <th className="px-3 py-2 text-right font-mono">CGST</th>
                  <th className="px-3 py-2 text-right font-mono">SGST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                {hsnList.map(h => (
                  <tr key={h.hsn} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{h.hsn}</td>
                    <td className="px-3 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">{h.desc}</td>
                    <td className="px-3 py-2 text-center text-slate-500">{h.uqc}</td>
                    <td className="px-3 py-2 text-center font-bold">{h.qty}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">{formatINR(h.taxable)}</td>
                    <td className="px-3 py-2 text-right text-indigo-600 dark:text-indigo-400">{formatINR(h.igst)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{formatINR(h.cgst)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{formatINR(h.sgst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: GSTR-2B ITC Reconciliation */}
      {activeReportTab === 'ITC_RECON' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                GSTR-2B Input Tax Credit (ITC) Auto-Reconciliation
              </h2>
              <p className="text-xs text-slate-500">
                Matches purchase books with GSTR-2B auto-drafted by suppliers on GST portal
              </p>
            </div>

            <button
              onClick={() => alert('GSTR-2B data successfully synced from GST Portal.')}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Fetch Portal 2B</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Matched in 2B (Eligible)</span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                {formatINR(eligibleItcCgst + eligibleItcSgst + eligibleItcIgst)}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">100% Tax credit verified</div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Missing in 2B (Supplier Delay)</span>
              </div>
              <div className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                ₹0.00
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">All vendor invoices matched</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-700 dark:text-slate-300 font-bold">
                Compliance Status
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                Rule 36(4) Compliant
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Ready for GSTR-3B Auto-population</div>
            </div>
          </div>

          {/* GSTR-2B Statement Table */}
          <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                GSTR-2B Inward Supplies Statement (B2B &amp; Debit Notes)
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                {purchaseInvoices.length} Bills • {debitNotes.length} Debit Notes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Supplier GSTIN</th>
                    <th className="px-3 py-2.5">Supplier Legal Name</th>
                    <th className="px-3 py-2.5">Doc Type</th>
                    <th className="px-3 py-2.5">Invoice / Ref No</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5 text-right">Taxable Val (₹)</th>
                    <th className="px-3 py-2.5 text-right">IGST (₹)</th>
                    <th className="px-3 py-2.5 text-right">CGST (₹)</th>
                    <th className="px-3 py-2.5 text-right">SGST (₹)</th>
                    <th className="px-3 py-2.5 text-center">2B Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                  {purchaseInvoices.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-bold">{p.supplierGstin || 'Unregistered'}</td>
                      <td className="px-3 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">{p.supplierName}</td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-sans font-bold">
                          INV
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{p.supplierInvoiceNo || p.invoiceNo}</td>
                      <td className="px-3 py-2 text-slate-500">{p.date}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-800 dark:text-slate-200">{formatINR(p.taxableAmount)}</td>
                      <td className="px-3 py-2 text-right text-indigo-600 dark:text-indigo-400">{formatINR(p.igst)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{formatINR(p.cgst)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{formatINR(p.sgst)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Auto-Drafted
                        </span>
                      </td>
                    </tr>
                  ))}

                  {debitNotes.map((dn) => (
                    <tr key={dn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 bg-rose-50/30 dark:bg-rose-950/20">
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-bold">{dn.supplierGstin || 'Unregistered'}</td>
                      <td className="px-3 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">{dn.supplierName}</td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-sans font-bold">
                          DEBIT NOTE
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-rose-700 dark:text-rose-400">{dn.debitNoteNo}</td>
                      <td className="px-3 py-2 text-slate-500">{dn.date}</td>
                      <td className="px-3 py-2 text-right font-bold text-rose-700 dark:text-rose-400">(-) {formatINR(dn.taxableAmount)}</td>
                      <td className="px-3 py-2 text-right text-rose-600">(-) {formatINR(dn.igst)}</td>
                      <td className="px-3 py-2 text-right text-rose-600">(-) {formatINR(dn.cgst)}</td>
                      <td className="px-3 py-2 text-right text-rose-600">(-) {formatINR(dn.sgst)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          Reversed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
