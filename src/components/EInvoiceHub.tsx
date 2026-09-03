import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../data/indianStates';
import { SalesInvoice } from '../types';
import { 
  QrCode, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Search, 
  Eye, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

interface EInvoiceHubProps {
  onViewInvoice: (invoice: SalesInvoice) => void;
}

export const EInvoiceHub: React.FC<EInvoiceHubProps> = ({ onViewInvoice }) => {
  const { salesInvoices, generateIRN, cancelIRN, gstConfig } = useApp();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'GENERATED' | 'CANCELLED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Invoices eligible for B2B e-Invoice (Customer has GSTIN)
  const b2bInvoices = salesInvoices.filter(i => !!i.customerGstin);

  const pendingList = b2bInvoices.filter(i => i.irnStatus === 'PENDING' || !i.irnStatus);
  const generatedList = b2bInvoices.filter(i => i.irnStatus === 'GENERATED');
  const cancelledList = b2bInvoices.filter(i => i.irnStatus === 'CANCELLED');

  const q = (searchQuery || '').trim().toLowerCase();
  const displayedList = (
    activeTab === 'PENDING' ? pendingList :
    activeTab === 'GENERATED' ? generatedList : cancelledList
  ).filter(i => 
    !q ||
    (i.invoiceNo || '').toLowerCase().includes(q) ||
    (i.customerName || '').toLowerCase().includes(q) ||
    (Boolean(i.customerGstin) && (i.customerGstin || '').toLowerCase().includes(q))
  );

  const handleGenerate = async (invoiceId: string) => {
    setIsProcessing(invoiceId);
    try {
      const res = await generateIRN(invoiceId);
      alert(res.message);
    } catch (err: any) {
      alert('Error generating IRN: ' + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleBulkGenerate = async () => {
    if (pendingList.length === 0) {
      alert('No pending e-Invoices to generate.');
      return;
    }
    const confirm = window.confirm(`Generate IRN for ${pendingList.length} pending B2B invoices?`);
    if (!confirm) return;

    for (const inv of pendingList) {
      await generateIRN(inv.id);
    }
    alert(`Successfully processed ${pendingList.length} e-Invoices with IRP Gateway.`);
  };

  const handleCancel = async (invoiceId: string) => {
    const reason = prompt('Please enter cancellation reason for IRP (e.g., Order Cancelled / Data Entry Mistake):');
    if (!reason) return;
    const res = await cancelIRN(invoiceId, reason);
    alert(res.message);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-900 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>NIC / IRP e-Invoice Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">e-Invoice Management Center</h1>
          <p className="text-xs text-cyan-100/80 mt-0.5">
            Real-time IRN Generation, Signed QR Code validation, and Government Portal synchronization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkGenerate}
            disabled={pendingList.length === 0}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Bulk Generate ({pendingList.length})</span>
          </button>
        </div>
      </div>

      {/* Gateway Status Badge */}
      <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-900 dark:text-white">
            IRP Connector Gateway: <span className="font-mono text-cyan-600 dark:text-cyan-400">{gstConfig.provider}</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>Client ID: <b className="font-mono text-slate-700 dark:text-slate-300">{gstConfig.clientId}</b></span>
          <span>Standard: <b className="text-slate-700 dark:text-slate-300">JSON Schema v1.03</b></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending IRN ({pendingList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('GENERATED')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'GENERATED'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Generated IRN ({generatedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'CANCELLED'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Cancelled ({cancelledList.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-64 hidden sm:block">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoice or party..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>
      </div>

      {/* Invoice List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Invoice Details</th>
                <th className="px-4 py-3">Recipient GSTIN &amp; State</th>
                <th className="px-4 py-3 text-right">Invoice Value</th>
                <th className="px-4 py-3">IRN &amp; Ack Details</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No records found under this tab.
                  </td>
                </tr>
              ) : (
                displayedList.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">{inv.invoiceNo}</div>
                      <div className="text-[10px] text-slate-400">Date: {inv.date}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.customerName}</div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {inv.customerGstin} • State: {inv.customerStateCode}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(inv.grandTotal)}
                      <div className="text-[10px] font-normal text-slate-400">
                        Tax: {formatINR(inv.cgst + inv.sgst + inv.igst)}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-[10px]">
                      {inv.irn ? (
                        <div>
                          <div className="truncate w-40 text-slate-700 dark:text-slate-300 font-bold" title={inv.irn}>
                            IRN: {inv.irn}
                          </div>
                          <div className="text-slate-400">Ack: {inv.ackNo} • {inv.ackDate?.substring(0, 10)}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">IRN Not Yet Requested</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {inv.irnStatus === 'GENERATED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> IRN Active
                        </span>
                      ) : inv.irnStatus === 'CANCELLED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.irnStatus !== 'GENERATED' && inv.irnStatus !== 'CANCELLED' && (
                          <button
                            onClick={() => handleGenerate(inv.id)}
                            disabled={isProcessing === inv.id}
                            className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-colors disabled:opacity-50"
                          >
                            {isProcessing === inv.id ? 'Connecting IRP...' : 'Generate IRN'}
                          </button>
                        )}

                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1 text-slate-600 hover:text-blue-600 rounded"
                          title="View and Print Bill"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {inv.irnStatus === 'GENERATED' && (
                          <button
                            onClick={() => handleCancel(inv.id)}
                            className="text-[10px] text-rose-600 hover:underline font-semibold"
                          >
                            Cancel IRN
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
