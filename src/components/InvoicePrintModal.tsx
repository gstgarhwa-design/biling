import React, { useState, useEffect } from 'react';
import { SalesInvoice } from '../types';
import { useApp } from '../context/AppContext';
import { formatINR, amountInWords } from '../data/indianStates';
import QRCode from 'qrcode';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Building2, 
  Smartphone,
  Sliders,
  Check,
  FileText
} from 'lucide-react';

export type PrintTheme = 'SAMPLE_TRADER' | 'SAMPLE_CONSULTANT' | 'STANDARD' | 'PROFESSIONAL' | 'GENERAL' | 'MODERN' | 'CUSTOM' | 'THERMAL';

interface CustomPrintConfig {
  copyTitle: string;
  invoiceTitle: string;
  showLogo: boolean;
  showBankDetails: boolean;
  showUpiQr: boolean;
  showIrnQr: boolean;
  showTerms: boolean;
  showSignatureBox: boolean;
  accentColor: string; // hex
  customTerms: string;
  declarationText: string;
}

interface InvoicePrintModalProps {
  invoice: SalesInvoice;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  const { activeCompany } = useApp();
  const [printTheme, setPrintTheme] = useState<PrintTheme>('SAMPLE_TRADER');
  const [signedQrUrl, setSignedQrUrl] = useState<string>('');
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [showCustomSettings, setShowCustomSettings] = useState<boolean>(true);

  // Computed values for reference invoice templates
  const totalQty = invoice.items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  const totalTaxAmount = (invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0) + (invoice.cess || 0);
  const paidAmount = invoice.paidAmount ?? invoice.paymentReceived ?? (invoice.paymentStatus === 'PAID' ? invoice.grandTotal : 0);
  const balanceAmount = Math.max(0, invoice.grandTotal - paidAmount);

  // Group items by HSN for HSN summary table (Sample 2)
  interface HsnTaxRow {
    hsnSac: string;
    taxableValue: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  }

  const hsnMap: Record<string, HsnTaxRow> = {};
  for (const it of invoice.items) {
    const key = `${it.hsnSac || 'OTHER'}_${it.gstRate}`;
    if (!hsnMap[key]) {
      hsnMap[key] = {
        hsnSac: it.hsnSac || '-',
        taxableValue: 0,
        gstRate: it.gstRate,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
      };
    }
    hsnMap[key].taxableValue += it.taxableValue || 0;
    hsnMap[key].cgst += it.cgst || 0;
    hsnMap[key].sgst += it.sgst || 0;
    hsnMap[key].igst += it.igst || 0;
    hsnMap[key].totalTax += (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0);
  }
  const hsnSummary: HsnTaxRow[] = Object.values(hsnMap);

  // Advanced customization state
  const [customConfig, setCustomConfig] = useState<CustomPrintConfig>({
    copyTitle: 'Original for Recipient',
    invoiceTitle: 'TAX INVOICE',
    showLogo: true,
    showBankDetails: true,
    showUpiQr: true,
    showIrnQr: true,
    showTerms: true,
    showSignatureBox: true,
    accentColor: '#1e3a8a', // classic navy
    customTerms: invoice.terms || activeCompany?.terms || '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is not made within due date.\n3. Subject to jurisdiction of local courts.',
    declarationText: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'
  });

  useEffect(() => {
    // Generate e-Invoice Signed QR if available
    const irnData = invoice.signedQrCode || `IRN:${invoice.irn || 'NOT_GEN'}|GSTIN:${invoice.customerGstin}|AMT:${invoice.grandTotal}|DATE:${invoice.date}`;
    QRCode.toDataURL(irnData, { width: 140, margin: 1 })
      .then(url => setSignedQrUrl(url))
      .catch(console.error);

    // Generate UPI Payment QR Code
    if (activeCompany?.upiId) {
      const upiString = `upi://pay?pa=${activeCompany.upiId}&pn=${encodeURIComponent(activeCompany.name)}&am=${invoice.grandTotal}&cu=INR&tn=Invoice_${invoice.invoiceNo}`;
      QRCode.toDataURL(upiString, { width: 120, margin: 1 })
        .then(url => setUpiQrUrl(url))
        .catch(console.error);
    }
  }, [invoice, activeCompany]);

  const handlePrint = () => {
    window.print();
  };

  const accentColors = [
    { name: 'Navy Blue', hex: '#1e3a8a' },
    { name: 'Charcoal', hex: '#1e293b' },
    { name: 'Royal Indigo', hex: '#4338ca' },
    { name: 'Forest Emerald', hex: '#065f46' },
    { name: 'Deep Crimson', hex: '#991b1b' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:m-0">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-xs text-slate-700 dark:text-slate-200">Invoice Style:</span>
            <div className="flex flex-wrap rounded-xl border border-slate-300 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-900 text-xs">
              <button
                onClick={() => setPrintTheme('SAMPLE_TRADER')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                  printTheme === 'SAMPLE_TRADER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Sample 1: Maa Sharda Traders</span>
              </button>
              <button
                onClick={() => setPrintTheme('SAMPLE_CONSULTANT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                  printTheme === 'SAMPLE_CONSULTANT' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Sample 2: Naiyer Iqbal (CA Grid)</span>
              </button>
              <button
                onClick={() => setPrintTheme('STANDARD')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                  printTheme === 'STANDARD' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setPrintTheme('PROFESSIONAL')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                  printTheme === 'PROFESSIONAL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Professional
              </button>
              <button
                onClick={() => setPrintTheme('GENERAL')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                  printTheme === 'GENERAL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setPrintTheme('MODERN')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                  printTheme === 'MODERN' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Modern
              </button>
              <button
                onClick={() => setPrintTheme('CUSTOM')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  printTheme === 'CUSTOM' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Custom</span>
              </button>
              <button
                onClick={() => setPrintTheme('THERMAL')}
                className={`px-2 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  printTheme === 'THERMAL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>POS</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CUSTOMIZE / ADVANCED SETTINGS PANEL (Shown when CUSTOM theme is selected) */}
        {printTheme === 'CUSTOM' && (
          <div className="p-4 bg-indigo-50/60 dark:bg-slate-800 border-b border-indigo-100 dark:border-slate-700 text-xs print:hidden">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 text-xs">
                <Sliders className="w-4 h-4" />
                <span>Live Invoice Customizer (Logo, Details, T&amp;C, Colors, Copies)</span>
              </span>
              <button 
                onClick={() => setShowCustomSettings(!showCustomSettings)}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                {showCustomSettings ? 'Collapse Controls' : 'Expand Controls'}
              </button>
            </div>

            {showCustomSettings && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Copy Type */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Copy</label>
                  <select 
                    value={customConfig.copyTitle}
                    onChange={(e) => setCustomConfig({ ...customConfig, copyTitle: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Original for Recipient">Original for Recipient</option>
                    <option value="Duplicate for Transporter">Duplicate for Transporter</option>
                    <option value="Triplicate for Supplier">Triplicate for Supplier</option>
                    <option value="Office Copy">Office Copy</option>
                    <option value="Customer Copy">Customer Copy</option>
                  </select>
                </div>

                {/* Header Title */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Title</label>
                  <input 
                    type="text"
                    value={customConfig.invoiceTitle}
                    onChange={(e) => setCustomConfig({ ...customConfig, invoiceTitle: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Theme Accent Color</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    {accentColors.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCustomConfig({ ...customConfig, accentColor: c.hex })}
                        className="w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center"
                        style={{ 
                          backgroundColor: c.hex, 
                          borderColor: customConfig.accentColor === c.hex ? '#fff' : 'transparent',
                          boxShadow: customConfig.accentColor === c.hex ? '0 0 0 2px #4f46e5' : 'none'
                        }}
                        title={c.name}
                      >
                        {customConfig.accentColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility Toggles */}
                <div className="space-y-1">
                  <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Element Visibility</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={customConfig.showLogo}
                        onChange={(e) => setCustomConfig({ ...customConfig, showLogo: e.target.checked })}
                      />
                      <span>Logo</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={customConfig.showBankDetails}
                        onChange={(e) => setCustomConfig({ ...customConfig, showBankDetails: e.target.checked })}
                      />
                      <span>Bank Info</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={customConfig.showUpiQr}
                        onChange={(e) => setCustomConfig({ ...customConfig, showUpiQr: e.target.checked })}
                      />
                      <span>UPI QR</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={customConfig.showIrnQr}
                        onChange={(e) => setCustomConfig({ ...customConfig, showIrnQr: e.target.checked })}
                      />
                      <span>IRN QR</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={customConfig.showTerms}
                        onChange={(e) => setCustomConfig({ ...customConfig, showTerms: e.target.checked })}
                      />
                      <span>T&amp;C</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={customConfig.showSignatureBox}
                        onChange={(e) => setCustomConfig({ ...customConfig, showSignatureBox: e.target.checked })}
                      />
                      <span>Signature</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invoice Preview Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/50 print:bg-white print:p-0">
          
          {/* ========================================================
              SAMPLE 1: MAA SHARDA TRADERS (Exact PDF Sample Replica)
             ======================================================== */}
          {printTheme === 'SAMPLE_TRADER' && (
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 text-slate-900 shadow-md border border-slate-300 print:shadow-none print:border-none print:p-4 text-xs font-sans">
              {/* Header Grid */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
                {/* Seller Info */}
                <div className="space-y-0.5 text-xs text-slate-900">
                  <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900 leading-tight">
                    {activeCompany?.legalName || activeCompany?.name || 'M/S MAA SHARDA TRADERS'}
                  </h1>
                  <div className="text-[11px] text-slate-700 leading-tight uppercase font-medium max-w-sm">
                    {activeCompany?.address || 'WARD NO 19, MAIN ROAD TANDWA, NEAR GOVT MIDDLE SCHOOL, TANDWA'}, {activeCompany?.city || 'Garhwa'}, {activeCompany?.state || 'Jharkhand'}, {activeCompany?.pin || '822114'}
                  </div>
                  <div className="pt-1 text-[11px]">
                    <span className="font-bold">GSTIN : </span>
                    <span className="font-mono font-bold text-slate-900">{activeCompany?.gstin || '20DAQPK6637G1ZL'}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold">Mobile : </span>
                    <span>{activeCompany?.mobile || '7739445555'}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold">PAN Number : </span>
                    <span className="font-mono">{activeCompany?.pan || 'DAQPK6637G'}</span>
                  </div>
                </div>

                {/* Tax Invoice & Metadata */}
                <div className="text-right space-y-1 sm:min-w-[240px]">
                  <div className="text-lg sm:text-xl font-black tracking-wider uppercase text-slate-900">
                    TAX INVOICE
                  </div>
                  <div>
                    <span className="inline-block border border-slate-400 text-slate-600 font-semibold px-2 py-0.5 text-[10px] rounded uppercase tracking-wider">
                      ORIGINAL FOR RECIPIENT
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono space-y-1">
                    <div className="flex justify-between sm:justify-end gap-2">
                      <span className="font-sans font-medium text-slate-700">Invoice No.</span>
                      <span>:</span>
                      <span className="font-bold text-slate-900 min-w-[110px] text-right">{invoice.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between sm:justify-end gap-2">
                      <span className="font-sans font-medium text-slate-700">Invoice Date</span>
                      <span>:</span>
                      <span className="font-bold text-slate-900 min-w-[110px] text-right">{invoice.date}</span>
                    </div>
                    <div className="flex justify-between sm:justify-end gap-2">
                      <span className="font-sans font-medium text-slate-700">E-way Bill No.</span>
                      <span>:</span>
                      <span className="font-bold text-slate-900 min-w-[110px] text-right">{invoice.ewayBillNo || (invoice as any).eWayBillNo || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BILL TO & SHIP TO Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 text-xs">
                {/* BILL TO */}
                <div className="space-y-1">
                  <div className="bg-slate-100 font-bold px-3 py-1 text-xs text-slate-900 uppercase inline-block rounded-xs">
                    BILL TO
                  </div>
                  <div className="font-bold text-xs uppercase text-slate-900 mt-1">
                    {invoice.customerName}
                  </div>
                  <div className="text-[11px] text-slate-700 leading-snug">
                    {invoice.billingAddress}
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold">Mobile : </span>
                    <span>{invoice.customerContact || 'N/A'}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold">GSTIN : </span>
                    <span className="font-mono font-bold text-slate-900">{invoice.customerGstin || 'Unregistered'}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold">PAN Number : </span>
                    <span className="font-mono">{invoice.customerPan || (invoice.customerGstin && invoice.customerGstin.length >= 12 ? invoice.customerGstin.slice(2, 12) : 'N/A')}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold">Place of Supply : </span>
                    <span>{invoice.customerState || 'Jharkhand'}</span>
                  </div>
                </div>

                {/* SHIP TO */}
                <div className="space-y-1">
                  <div className="bg-slate-100 font-bold px-3 py-1 text-xs text-slate-900 uppercase inline-block rounded-xs">
                    SHIP TO
                  </div>
                  <div className="font-bold text-xs uppercase text-slate-900 mt-1">
                    {invoice.customerName}
                  </div>
                  <div className="text-[11px] text-slate-700 leading-snug">
                    {invoice.shippingAddress || invoice.billingAddress}
                  </div>
                  {invoice.transportName && (
                    <div className="text-[11px] pt-1">
                      <span className="font-bold">Transport : </span>
                      <span>{invoice.transportName} {invoice.vehicleNo ? `(${invoice.vehicleNo})` : ''}</span>
                    </div>
                  )}
                  {invoice.lrNo && (
                    <div className="text-[11px]">
                      <span className="font-bold">LR / GR No : </span>
                      <span className="font-mono">{invoice.lrNo}</span>
                      {invoice.lrDate ? ` dt. ${invoice.lrDate}` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto my-3">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-900 font-bold text-[11px] uppercase tracking-wider border-y border-slate-300">
                    <tr>
                      <th className="p-2 text-center w-12">S.NO.</th>
                      <th className="p-2">ITEMS</th>
                      <th className="p-2 text-center w-20">HSN</th>
                      <th className="p-2 text-center w-24">QTY.</th>
                      <th className="p-2 text-right w-20">RATE</th>
                      <th className="p-2 text-right w-24">TAX</th>
                      <th className="p-2 text-right w-28">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {invoice.items.map((it, idx) => {
                      const itemTax = (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0);
                      return (
                        <tr key={idx}>
                          <td className="p-2 text-center font-sans text-slate-700">{idx + 1}</td>
                          <td className="p-2 font-sans font-bold text-slate-900 uppercase">{it.name}</td>
                          <td className="p-2 text-center text-slate-700">{it.hsnSac || '-'}</td>
                          <td className="p-2 text-center font-bold text-slate-900">{it.qty} {it.unit}</td>
                          <td className="p-2 text-right">{it.rate.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            <div>{itemTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px] text-slate-500 font-sans">({it.gstRate}%)</div>
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {it.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 text-xs border-y border-slate-300">
                      <td colSpan={3} className="p-2 uppercase font-black">SUBTOTAL</td>
                      <td className="p-2 text-center">{totalQty}</td>
                      <td className="p-2"></td>
                      <td className="p-2 text-right font-mono">₹ {totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right font-mono">₹ {invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Terms & Totals Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4 text-xs">
                {/* Terms and Conditions */}
                <div className="space-y-1.5">
                  <div className="font-bold uppercase text-xs text-slate-900 tracking-wider">
                    TERMS AND CONDITIONS
                  </div>
                  <ol className="text-[11px] text-slate-700 space-y-1 list-decimal list-inside">
                    <li>Goods once sold will not be taken back or exchanged</li>
                    <li>All disputes are subject to {activeCompany?.city || 'GARHWA'} {activeCompany?.state || 'JHARKHAND'} jurisdiction only</li>
                  </ol>

                  {/* Bank Details */}
                  {activeCompany?.bankAccountNo && (
                    <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] font-mono">
                      <div className="font-sans font-bold text-slate-800 uppercase mb-1">Bank Payment Details</div>
                      <div>Bank: {activeCompany.bankName}</div>
                      <div>A/C: {activeCompany.bankAccountNo}</div>
                      <div>IFSC: {activeCompany.bankIfsc}</div>
                      <div>Branch: {activeCompany.bankBranch || activeCompany.city}</div>
                    </div>
                  )}
                </div>

                {/* Amount Totals */}
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-700">Taxable Amount</span>
                    <span>₹ {invoice.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {invoice.igst > 0 ? (
                    <div className="flex justify-between py-0.5">
                      <span className="font-sans text-slate-700">IGST</span>
                      <span>₹ {invoice.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between py-0.5">
                        <span className="font-sans text-slate-700">CGST</span>
                        <span>₹ {invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="font-sans text-slate-700">SGST</span>
                        <span>₹ {invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  {invoice.roundOff !== 0 && (
                    <div className="flex justify-between py-0.5 text-slate-500">
                      <span className="font-sans">Round Off</span>
                      <span>{invoice.roundOff >= 0 ? `+${invoice.roundOff.toFixed(2)}` : invoice.roundOff.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-t border-b-2 border-slate-900 font-bold text-sm">
                    <span className="font-sans">Total Amount</span>
                    <span className="text-slate-900">₹ {invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-0.5 pt-1">
                    <span className="font-sans text-slate-700">Received Amount</span>
                    <span>₹ {paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-700">Balance</span>
                    <span className="font-bold text-slate-900">₹ {balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Total in words */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-900 uppercase">Total Amount (in words)</div>
                <div className="text-xs text-slate-800 font-medium mt-0.5 max-w-lg mx-auto">
                  {amountInWords(invoice.grandTotal)}
                </div>
              </div>

              {/* Signatory footer */}
              <div className="mt-6 pt-3 flex justify-between items-end border-t border-slate-200">
                <div className="text-[10px] text-slate-500 italic">
                  This is a computer generated invoice.
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 font-semibold">For {activeCompany?.name || 'M/S MAA SHARDA TRADERS'}</div>
                  <div className="h-10"></div>
                  <div className="text-[11px] font-bold text-slate-800 border-t border-slate-400 pt-1">Authorized Signatory</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SAMPLE 2: NAIYER IQBAL (CA / Consultant Grid Layout)
             ======================================================== */}
          {printTheme === 'SAMPLE_CONSULTANT' && (
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 text-slate-900 shadow-md border-2 border-slate-900 print:shadow-none print:border-2 print:border-slate-900 print:p-4 text-xs font-sans">
              {/* Top Bar with Badge */}
              <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
                <span className="font-black uppercase tracking-wider text-xs">TAX INVOICE</span>
                <span className="border border-slate-400 text-slate-600 px-2 py-0.5 text-[10px] rounded uppercase font-semibold">
                  ORIGINAL FOR RECIPIENT
                </span>
              </div>

              {/* Supplier & Invoice No Grid */}
              <div className="grid grid-cols-[1fr_180px] border-b-2 border-slate-900">
                {/* Left Firm Details */}
                <div className="p-3 border-r-2 border-slate-900 flex items-start gap-3">
                  {/* CA Consultant Emblem / Logo */}
                  <div className="shrink-0 border-2 border-blue-900 text-blue-900 p-1.5 rounded text-center leading-none">
                    <div className="text-lg font-black tracking-tighter">CA</div>
                    <div className="text-[7px] font-bold uppercase tracking-wider mt-0.5">Consultant</div>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div className="text-sm font-black text-blue-950 uppercase">
                      {activeCompany?.legalName || activeCompany?.name || 'NAIYER IQBAL'}
                    </div>
                    <div className="text-slate-700 leading-tight">
                      {activeCompany?.address || 'Vill- jhaluwa po kalyanpur ps Garhwa Pin 822114 Jharkhand, Garhwa, Jharkhand, 822114'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                      <div>
                        <b>GSTIN:</b><br />
                        {activeCompany?.gstin || '20CTCPA1422K1ZH'}
                      </div>
                      <div>
                        <b>Mobile:</b><br />
                        {activeCompany?.mobile || '8228069899'}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono">
                      <b>PAN Number:</b> {activeCompany?.pan || 'AGVPI3114L'}
                    </div>
                    <div className="text-[10px]">
                      <b>Email:</b> {activeCompany?.email || 'naiyeriqbal1@gmail.com'}
                    </div>
                  </div>
                </div>

                {/* Right: Invoice No & Date */}
                <div className="divide-y-2 divide-slate-900 flex flex-col justify-around text-center">
                  <div className="p-2">
                    <div className="text-[10px] font-bold uppercase text-slate-600">Invoice No.</div>
                    <div className="text-base font-black font-mono mt-0.5">{invoice.invoiceNo}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-[10px] font-bold uppercase text-slate-600">Invoice Date</div>
                    <div className="text-xs font-bold font-mono mt-0.5">{invoice.date}</div>
                  </div>
                </div>
              </div>

              {/* BILL TO Box */}
              <div className="p-3 border-b-2 border-slate-900 space-y-1 text-xs">
                <div className="font-black text-[11px] uppercase tracking-wider text-slate-800">BILL TO</div>
                <div className="font-bold text-sm uppercase text-slate-900">{invoice.customerName}</div>
                <div className="text-[11px] text-slate-700 leading-snug">Address: {invoice.billingAddress}</div>
                <div className="flex flex-wrap items-center justify-between text-[11px] pt-0.5 font-mono">
                  <span><b>GSTIN:</b> {invoice.customerGstin || 'Unregistered'}</span>
                  <span><b>Place of Supply:</b> {invoice.customerState || 'Jharkhand'}</span>
                </div>
                <div className="text-[11px] font-mono">
                  <b>PAN Number:</b> {invoice.customerPan || (invoice.customerGstin && invoice.customerGstin.length >= 12 ? invoice.customerGstin.slice(2, 12) : 'N/A')}
                </div>
              </div>

              {/* Grid Items Table with Intra-table Tax Rows */}
              <table className="w-full text-xs text-left border-b-2 border-slate-900">
                <thead className="bg-slate-50 text-slate-900 font-bold border-b-2 border-slate-900 uppercase text-[11px]">
                  <tr>
                    <th className="p-2 text-center w-12 border-r-2 border-slate-900">S.NO.</th>
                    <th className="p-2 border-r-2 border-slate-900">SERVICES / ITEMS</th>
                    <th className="p-2 text-center w-28 border-r-2 border-slate-900">QTY.</th>
                    <th className="p-2 text-right w-24 border-r-2 border-slate-900">RATE</th>
                    <th className="p-2 text-right w-28">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono text-xs">
                  {invoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-center font-sans border-r-2 border-slate-900">{idx + 1}</td>
                      <td className="p-2 font-sans font-bold text-slate-900 uppercase border-r-2 border-slate-900">
                        <div>{it.name}</div>
                        {it.hsnSac && <div className="text-[10px] text-slate-500 font-mono font-normal">HSN/SAC: {it.hsnSac}</div>}
                      </td>
                      <td className="p-2 text-center border-r-2 border-slate-900 uppercase">{it.qty} {it.unit}</td>
                      <td className="p-2 text-right border-r-2 border-slate-900">{it.rate.toFixed(2)}</td>
                      <td className="p-2 text-right font-bold text-slate-900">{it.taxableValue.toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Intra-table Tax Rows */}
                  {invoice.igst > 0 ? (
                    <tr className="text-slate-800">
                      <td className="p-2 border-r-2 border-slate-900"></td>
                      <td className="p-2 font-sans font-bold border-r-2 border-slate-900">IGST</td>
                      <td className="p-2 text-center border-r-2 border-slate-900">-</td>
                      <td className="p-2 text-center border-r-2 border-slate-900">-</td>
                      <td className="p-2 text-right font-bold">₹ {invoice.igst.toFixed(2)}</td>
                    </tr>
                  ) : (
                    <>
                      <tr className="text-slate-800">
                        <td className="p-2 border-r-2 border-slate-900"></td>
                        <td className="p-2 font-sans font-bold border-r-2 border-slate-900">CGST @9%</td>
                        <td className="p-2 text-center border-r-2 border-slate-900">-</td>
                        <td className="p-2 text-center border-r-2 border-slate-900">-</td>
                        <td className="p-2 text-right font-bold">₹ {invoice.cgst.toFixed(2)}</td>
                      </tr>
                      <tr className="text-slate-800">
                        <td className="p-2 border-r-2 border-slate-900"></td>
                        <td className="p-2 font-sans font-bold border-r-2 border-slate-900">SGST @9%</td>
                        <td className="p-2 text-center border-r-2 border-slate-900">-</td>
                        <td className="p-2 text-center border-r-2 border-slate-900">-</td>
                        <td className="p-2 text-right font-bold">₹ {invoice.sgst.toFixed(2)}</td>
                      </tr>
                    </>
                  )}

                  {/* Soft lavender/purple highlighted TOTAL row (Exact match to sample 2) */}
                  <tr className="bg-purple-100/70 font-bold border-t-2 border-b-2 border-slate-900 text-slate-900">
                    <td colSpan={2} className="p-2 uppercase font-black text-right border-r-2 border-slate-900">TOTAL</td>
                    <td className="p-2 text-center border-r-2 border-slate-900">{totalQty}</td>
                    <td className="p-2 border-r-2 border-slate-900"></td>
                    <td className="p-2 text-right font-mono text-sm">₹ {invoice.grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Dedicated HSN/SAC Tax Summary Table (Exact match to Sample 2) */}
              <div className="p-3 border-b-2 border-slate-900">
                <table className="w-full text-xs text-left border border-slate-900 font-mono">
                  <thead className="bg-slate-100 font-bold text-[10px] text-slate-900 border-b border-slate-900 uppercase">
                    <tr>
                      <th rowSpan={2} className="p-1.5 border-r border-slate-900 text-center">HSN/SAC</th>
                      <th rowSpan={2} className="p-1.5 border-r border-slate-900 text-right">Taxable Value</th>
                      <th colSpan={2} className="p-1 border-r border-slate-900 text-center">CGST</th>
                      <th colSpan={2} className="p-1 border-r border-slate-900 text-center">SGST</th>
                      <th rowSpan={2} className="p-1.5 text-right">Total Tax Amount</th>
                    </tr>
                    <tr className="border-t border-slate-900 text-[9px]">
                      <th className="p-1 border-r border-slate-900 text-center">Rate</th>
                      <th className="p-1 border-r border-slate-900 text-right">Amount</th>
                      <th className="p-1 border-r border-slate-900 text-center">Rate</th>
                      <th className="p-1 border-r border-slate-900 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-[11px]">
                    {hsnSummary.map((h, i) => (
                      <tr key={i}>
                        <td className="p-1.5 border-r border-slate-900 text-center">{h.hsnSac}</td>
                        <td className="p-1.5 border-r border-slate-900 text-right">{h.taxableValue.toFixed(2)}</td>
                        <td className="p-1 border-r border-slate-900 text-center">{h.gstRate / 2}%</td>
                        <td className="p-1 border-r border-slate-900 text-right">{h.cgst.toFixed(2)}</td>
                        <td className="p-1 border-r border-slate-900 text-center">{h.gstRate / 2}%</td>
                        <td className="p-1 border-r border-slate-900 text-right">{h.sgst.toFixed(2)}</td>
                        <td className="p-1.5 text-right font-bold">₹ {h.totalTax.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-900 font-bold bg-slate-50 text-[11px]">
                    <tr>
                      <td className="p-1.5 border-r border-slate-900 text-center uppercase">Total</td>
                      <td className="p-1.5 border-r border-slate-900 text-right">{invoice.taxableAmount.toFixed(2)}</td>
                      <td className="p-1 border-r border-slate-900"></td>
                      <td className="p-1 border-r border-slate-900 text-right">{invoice.cgst.toFixed(2)}</td>
                      <td className="p-1 border-r border-slate-900"></td>
                      <td className="p-1 border-r border-slate-900 text-right">{invoice.sgst.toFixed(2)}</td>
                      <td className="p-1.5 text-right">₹ {totalTaxAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Words & Terms & Signatory */}
              <div className="p-3 border-b-2 border-slate-900">
                <div className="font-bold text-xs">Total Amount (in words)</div>
                <div className="text-xs text-slate-800 font-medium mt-0.5">{amountInWords(invoice.grandTotal)}</div>
              </div>

              <div className="p-3 flex justify-between items-end">
                <div>
                  <div className="font-bold text-[11px] uppercase">Terms and Conditions</div>
                  <ol className="text-[10px] text-slate-700 space-y-0.5 list-decimal list-inside mt-0.5">
                    <li>Goods once sold will not be taken back or exchanged</li>
                    <li>All disputes are subject to [{activeCompany?.city || 'GARHWA'}] jurisdiction only</li>
                  </ol>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-medium">For {activeCompany?.name || 'NAIYER IQBAL'}</div>
                  <div className="h-10"></div>
                  <div className="text-[10px] font-bold border-t border-slate-400 pt-1">Authorized Signatory</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STYLE 1: STANDARD (Traditional Indian Boxed GST Layout)
             ======================================================== */}
          {printTheme === 'STANDARD' && (
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 text-slate-900 shadow-md border border-slate-800 print:shadow-none print:border print:border-slate-800 print:p-4 text-xs font-sans">
              {/* Header Title */}
              <div className="text-center pb-2 border-b border-slate-800">
                <div className="text-lg font-bold uppercase tracking-wider">TAX INVOICE</div>
                <div className="text-[11px] text-slate-600 font-semibold">(Issued under Rule 46 of the Central Goods and Services Tax Rules, 2017)</div>
                <div className="text-[10px] text-slate-500 italic mt-0.5">Original for Recipient</div>
              </div>

              {/* Seller & Invoice Meta Grid */}
              <div className="grid grid-cols-2 border-b border-slate-800">
                {/* Left: Seller Details */}
                <div className="p-3 border-r border-slate-800 space-y-1">
                  <div className="text-xs text-slate-500 font-bold uppercase">Details of Supplier (Seller):</div>
                  <div className="text-sm font-bold text-slate-900 uppercase">{activeCompany?.legalName || activeCompany?.name}</div>
                  <div className="text-slate-700">{activeCompany?.address}, {activeCompany?.city}, {activeCompany?.state} - {activeCompany?.pin}</div>
                  <div className="font-mono text-xs"><b>GSTIN:</b> {activeCompany?.gstin}</div>
                  <div className="font-mono text-xs"><b>PAN:</b> {activeCompany?.pan} | <b>State Code:</b> {activeCompany?.stateCode}</div>
                  <div>Tel: +91 {activeCompany?.mobile} | Email: {activeCompany?.email || 'N/A'}</div>
                </div>

                {/* Right: Invoice Reference Meta */}
                <div className="p-3 space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="font-sans font-semibold text-slate-700">Invoice No:</span>
                    <span className="font-bold text-slate-900">{invoice.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-700">Invoice Date:</span>
                    <span>{invoice.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-700">Due Date:</span>
                    <span>{invoice.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-700">Place of Supply:</span>
                    <span>{invoice.customerStateCode} ({invoice.customerStateCode === activeCompany?.stateCode ? 'Intra-State' : 'Inter-State'})</span>
                  </div>
                  {invoice.ewayBillNo && (
                    <div className="flex justify-between text-indigo-800 font-bold">
                      <span className="font-sans">E-Way Bill:</span>
                      <span>{invoice.ewayBillNo}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-700">Payment Terms:</span>
                    <span className="font-sans">{invoice.paymentMode}</span>
                  </div>
                </div>
              </div>

              {/* e-Invoice IRN Banner (if applicable) */}
              {invoice.irnStatus === 'GENERATED' && (
                <div className="p-2 border-b border-slate-800 bg-slate-50 flex items-center justify-between text-xs">
                  <div className="font-mono text-[10px] space-y-0.5">
                    <div><b>IRN:</b> <span className="font-normal">{invoice.irn}</span></div>
                    <div><b>Ack No:</b> {invoice.ackNo} &nbsp;|&nbsp; <b>Ack Date:</b> {invoice.ackDate}</div>
                  </div>
                  {signedQrUrl && (
                    <img src={signedQrUrl} alt="IRN QR" className="w-14 h-14 border border-slate-300 p-0.5 bg-white" />
                  )}
                </div>
              )}

              {/* Buyer / Recipient Details */}
              <div className="p-3 border-b border-slate-800 bg-slate-50/50">
                <div className="text-xs text-slate-500 font-bold uppercase">Details of Receiver (Billed To):</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{invoice.customerName}</div>
                <div className="text-slate-700 mt-0.5">{invoice.billingAddress}</div>
                <div className="font-mono text-xs mt-1">
                  <b>GSTIN/UIN:</b> {invoice.customerGstin || 'Unregistered / Consumer'} &nbsp;|&nbsp; 
                  <b>State Code:</b> {invoice.customerStateCode}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse border-b border-slate-800">
                <thead className="bg-slate-100 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-2 border-r border-slate-800 text-center w-8">#</th>
                    <th className="p-2 border-r border-slate-800">Description of Goods</th>
                    <th className="p-2 border-r border-slate-800 font-mono text-center">HSN/SAC</th>
                    <th className="p-2 border-r border-slate-800 text-center">Qty</th>
                    <th className="p-2 border-r border-slate-800 text-right">Rate (₹)</th>
                    <th className="p-2 border-r border-slate-800 text-right">Taxable (₹)</th>
                    {invoice.igst > 0 ? (
                      <th className="p-2 border-r border-slate-800 text-right">IGST</th>
                    ) : (
                      <>
                        <th className="p-2 border-r border-slate-800 text-right">CGST</th>
                        <th className="p-2 border-r border-slate-800 text-right">SGST</th>
                      </>
                    )}
                    <th className="p-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono">
                  {invoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border-r border-slate-800 text-center font-sans">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-800 font-sans font-semibold text-slate-900">{it.name}</td>
                      <td className="p-2 border-r border-slate-800 text-center text-slate-600">{it.hsnSac}</td>
                      <td className="p-2 border-r border-slate-800 text-center">{it.qty} {it.unit}</td>
                      <td className="p-2 border-r border-slate-800 text-right">{it.rate.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-800 text-right">{it.taxableValue.toFixed(2)}</td>
                      {invoice.igst > 0 ? (
                        <td className="p-2 border-r border-slate-800 text-right">{it.igst.toFixed(2)} ({it.gstRate}%)</td>
                      ) : (
                        <>
                          <td className="p-2 border-r border-slate-800 text-right">{it.cgst.toFixed(2)} ({it.gstRate/2}%)</td>
                          <td className="p-2 border-r border-slate-800 text-right">{it.sgst.toFixed(2)} ({it.gstRate/2}%)</td>
                        </>
                      )}
                      <td className="p-2 text-right font-bold text-slate-900">{it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculations and Bank Info */}
              <div className="grid grid-cols-2 border-b border-slate-800">
                {/* Left: Bank Info */}
                <div className="p-3 border-r border-slate-800 space-y-2">
                  <div className="text-xs font-bold uppercase text-slate-700">Bank Details for NEFT / RTGS:</div>
                  <div className="font-mono text-xs space-y-0.5 text-slate-800">
                    <div>Bank: <span className="font-bold">{activeCompany?.bankName}</span></div>
                    <div>A/c No: <span className="font-bold">{activeCompany?.accountNo}</span></div>
                    <div>IFSC: <span className="font-bold">{activeCompany?.ifsc}</span></div>
                    <div>Branch: {activeCompany?.branch}</div>
                  </div>
                  {upiQrUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <img src={upiQrUrl} alt="UPI QR" className="w-14 h-14 border border-slate-300 p-0.5" />
                      <div className="text-[10px] text-slate-600">
                        <span className="font-bold block text-slate-800">Scan UPI to Pay</span>
                        <span className="font-mono">{activeCompany?.upiId}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Tax Breakdown Summary */}
                <div className="p-3 space-y-1 font-mono text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">Total Taxable Value:</span>
                    <span className="font-bold">₹{invoice.taxableAmount.toFixed(2)}</span>
                  </div>
                  {invoice.igst > 0 ? (
                    <div className="flex justify-between py-0.5">
                      <span className="font-sans text-slate-600">Integrated GST (IGST):</span>
                      <span>₹{invoice.igst.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between py-0.5">
                        <span className="font-sans text-slate-600">Central Tax (CGST):</span>
                        <span>₹{invoice.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="font-sans text-slate-600">State Tax (SGST):</span>
                        <span>₹{invoice.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">Round Off:</span>
                    <span>{invoice.roundOff >= 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-800 font-bold text-sm text-slate-900">
                    <span className="font-sans">Total Invoice Amount:</span>
                    <span>₹{invoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Amount in words */}
              <div className="p-2.5 border-b border-slate-800 bg-slate-50 font-sans">
                <span className="font-bold text-slate-800">Amount Chargeable (in words): </span>
                <span className="italic font-medium">{amountInWords(invoice.grandTotal)}</span>
              </div>

              {/* Footer: Terms & Signatory */}
              <div className="grid grid-cols-2 p-3 gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-[10px] uppercase text-slate-600">Terms &amp; Conditions:</div>
                  <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
                    {invoice.terms || activeCompany?.terms || 'Subject to local jurisdiction. E.&O.E.'}
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between h-24">
                  <div className="font-bold text-xs">For {activeCompany?.legalName || activeCompany?.name}</div>
                  <div className="text-[10px] text-slate-500 font-sans">Authorised Signatory</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STYLE 2: PROFESSIONAL (Corporate Navy Minimalist Layout)
             ======================================================== */}
          {printTheme === 'PROFESSIONAL' && (
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 text-slate-900 shadow-lg print:shadow-none print:p-0 border border-slate-200">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-slate-800 gap-4">
                <div className="flex items-start gap-3">
                  {activeCompany?.logoUrl && (
                    <img
                      src={activeCompany.logoUrl}
                      alt="Logo"
                      className="h-14 w-auto max-w-[100px] object-contain rounded border border-slate-200 p-0.5"
                    />
                  )}
                  <div>
                    <div className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                      {activeCompany?.legalName || activeCompany?.name}
                    </div>
                    <div className="text-xs text-slate-600 max-w-sm mt-0.5">
                      {activeCompany?.address}, {activeCompany?.city}, {activeCompany?.state} - {activeCompany?.pin}
                    </div>
                    <div className="text-xs text-slate-800 font-mono mt-1">
                      <b>GSTIN:</b> {activeCompany?.gstin} &nbsp;|&nbsp; <b>PAN:</b> {activeCompany?.pan}
                    </div>
                    <div className="text-xs text-slate-600">
                      State: {activeCompany?.state} (Code: {activeCompany?.stateCode}) &nbsp;|&nbsp; Tel: +91 {activeCompany?.mobile}
                      {activeCompany?.email && ` | Email: ${activeCompany.email}`}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-sm tracking-wider uppercase rounded">
                    TAX INVOICE
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    (Under Section 31 of GST Act)
                  </div>
                  {invoice.irnStatus === 'GENERATED' && (
                    <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Govt. e-Invoice Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* e-Invoice IRN & QR Section (If Generated) */}
              {invoice.irnStatus === 'GENERATED' && (
                <div className="my-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 font-mono text-[10px] max-w-lg">
                    <div className="font-bold text-slate-700">IRN: <span className="font-normal">{invoice.irn}</span></div>
                    <div>Ack No: <span className="font-bold">{invoice.ackNo}</span> &nbsp;|&nbsp; Ack Date: <span>{invoice.ackDate}</span></div>
                  </div>
                  {signedQrUrl && (
                    <div className="text-center">
                      <img src={signedQrUrl} alt="IRP Signed QR" className="w-16 h-16 border p-0.5 bg-white rounded" />
                      <div className="text-[8px] font-mono text-slate-400">IRP Signed QR</div>
                    </div>
                  )}
                </div>
              )}

              {/* Bill Meta + Customer Details */}
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                    Details of Receiver (Billed To):
                  </div>
                  <div className="font-bold text-sm text-slate-900">{invoice.customerName}</div>
                  <div className="text-slate-600">{invoice.billingAddress}</div>
                  <div className="font-mono">
                    <b>GSTIN:</b> {invoice.customerGstin || 'Unregistered / B2C'}
                  </div>
                  <div>
                    <b>State:</b> {invoice.customerStateCode} &nbsp;|&nbsp; <b>Place of Supply:</b> {invoice.customerStateCode}
                  </div>
                </div>

                <div className="space-y-1 sm:text-right font-mono text-xs">
                  <div>
                    <span className="font-sans text-slate-500">Invoice No: </span>
                    <span className="font-bold text-slate-900">{invoice.invoiceNo}</span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-500">Invoice Date: </span>
                    <span>{invoice.date}</span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-500">Due Date: </span>
                    <span>{invoice.dueDate}</span>
                  </div>
                  {invoice.ewayBillNo && (
                    <div className="text-indigo-700 font-bold">
                      <span className="font-sans text-slate-500">E-Way Bill No: </span>
                      <span>{invoice.ewayBillNo}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-sans text-slate-500">Payment Terms: </span>
                    <span className="font-sans font-bold">{invoice.paymentMode}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="my-3 overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-8 text-center">#</th>
                      <th className="p-2">Description of Goods / Services</th>
                      <th className="p-2 font-mono">HSN/SAC</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Taxable</th>
                      {invoice.igst > 0 ? (
                        <th className="p-2 text-right">IGST</th>
                      ) : (
                        <>
                          <th className="p-2 text-right">CGST</th>
                          <th className="p-2 text-right">SGST</th>
                        </>
                      )}
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {invoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-center text-slate-400 font-sans">{idx + 1}</td>
                        <td className="p-2 font-sans font-semibold text-slate-900">{it.name}</td>
                        <td className="p-2 text-slate-600">{it.hsnSac}</td>
                        <td className="p-2 text-center">{it.qty} {it.unit}</td>
                        <td className="p-2 text-right">₹{it.rate.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{it.taxableValue.toFixed(2)}</td>
                        {invoice.igst > 0 ? (
                          <td className="p-2 text-right">₹{it.igst.toFixed(2)} ({it.gstRate}%)</td>
                        ) : (
                          <>
                            <td className="p-2 text-right">₹{it.cgst.toFixed(2)} ({it.gstRate / 2}%)</td>
                            <td className="p-2 text-right">₹{it.sgst.toFixed(2)} ({it.gstRate / 2}%)</td>
                          </>
                        )}
                        <td className="p-2 text-right font-bold text-slate-900">₹{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary Grid */}
              <div className="grid grid-cols-2 gap-4 py-2 text-xs">
                <div className="space-y-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-bold text-[11px] text-slate-700 uppercase">Bank Payment Details</div>
                    <div className="mt-1 space-y-0.5 text-[11px] font-mono">
                      <div>Bank Name: <span className="font-bold">{activeCompany?.bankName}</span></div>
                      <div>A/C No: <span className="font-bold">{activeCompany?.accountNo}</span></div>
                      <div>IFSC Code: <span className="font-bold">{activeCompany?.ifsc}</span></div>
                      <div>Branch: {activeCompany?.branch}</div>
                    </div>
                  </div>

                  {upiQrUrl && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <img src={upiQrUrl} alt="UPI QR" className="w-16 h-16 border rounded bg-white p-0.5" />
                      <div className="text-[10px]">
                        <div className="font-bold text-slate-800">Scan &amp; Pay via UPI</div>
                        <div className="text-slate-500 font-mono">{activeCompany?.upiId}</div>
                        <div className="text-emerald-700 font-semibold mt-0.5">Zero convenience fee</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-sans text-slate-600">Total Taxable Value:</span>
                    <span className="font-bold">₹{invoice.taxableAmount.toFixed(2)}</span>
                  </div>
                  {invoice.igst > 0 ? (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-sans text-slate-600">Integrated GST (IGST):</span>
                      <span className="font-bold">₹{invoice.igst.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="font-sans text-slate-600">Central GST (CGST):</span>
                        <span>₹{invoice.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="font-sans text-slate-600">State GST (SGST):</span>
                        <span>₹{invoice.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-sans text-slate-500">Round Off:</span>
                    <span>{invoice.roundOff >= 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-slate-800 text-sm font-bold">
                    <span className="font-sans">Invoice Total (INR):</span>
                    <span className="text-blue-700">₹{invoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                <span className="font-bold text-slate-700">Total Amount in Words: </span>
                <span className="font-medium italic">{amountInWords(invoice.grandTotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Terms &amp; Conditions:</div>
                  <div className="text-[10px] text-slate-600 whitespace-pre-line mt-1">
                    {invoice.terms || activeCompany?.terms}
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between h-20">
                  <div className="font-bold text-xs text-slate-800">For {activeCompany?.name}</div>
                  <div className="text-[10px] text-slate-400 font-sans">Authorized Signatory</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STYLE 3: GENERAL (Clean, Ink-saving, Universally Compatible)
             ======================================================== */}
          {printTheme === 'GENERAL' && (
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 text-slate-900 shadow-md border border-slate-300 print:shadow-none print:border-none print:p-0 text-xs font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h1 className="text-xl font-bold uppercase text-slate-900">{activeCompany?.name}</h1>
                  <p className="text-xs text-slate-600">{activeCompany?.address}, {activeCompany?.city} - {activeCompany?.pin}</p>
                  <p className="text-xs font-mono">GSTIN: {activeCompany?.gstin} | State Code: {activeCompany?.stateCode}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-base font-black tracking-wider uppercase border border-slate-900 px-3 py-1">TAX INVOICE</h2>
                  <p className="text-[11px] font-mono mt-1 font-bold">No: {invoice.invoiceNo}</p>
                  <p className="text-[11px] font-mono">Date: {invoice.date}</p>
                </div>
              </div>

              <div className="my-3 p-3 border border-slate-200 rounded grid grid-cols-2 gap-4">
                <div>
                  <div className="font-bold text-slate-600 uppercase text-[10px]">Customer Details:</div>
                  <div className="font-bold text-sm text-slate-900">{invoice.customerName}</div>
                  <div className="text-slate-600">{invoice.billingAddress}</div>
                  <div className="font-mono">GSTIN: {invoice.customerGstin || 'Unregistered'}</div>
                </div>
                <div className="text-right font-mono space-y-0.5">
                  <div>Due Date: {invoice.dueDate}</div>
                  <div>Payment Mode: {invoice.paymentMode}</div>
                  <div>Place of Supply: {invoice.customerStateCode}</div>
                </div>
              </div>

              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                  <tr>
                    <th className="p-2 text-center w-8">#</th>
                    <th className="p-2">Item Description</th>
                    <th className="p-2 text-center font-mono">HSN</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Taxable</th>
                    <th className="p-2 text-right">GST</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {invoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-center font-sans">{idx + 1}</td>
                      <td className="p-2 font-sans font-medium">{it.name}</td>
                      <td className="p-2 text-center text-slate-600">{it.hsnSac}</td>
                      <td className="p-2 text-center">{it.qty} {it.unit}</td>
                      <td className="p-2 text-right">₹{it.rate.toFixed(2)}</td>
                      <td className="p-2 text-right">₹{it.taxableValue.toFixed(2)}</td>
                      <td className="p-2 text-right">₹{(it.cgst + it.sgst + it.igst).toFixed(2)}</td>
                      <td className="p-2 text-right font-bold">₹{it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex justify-between items-start gap-4">
                <div className="space-y-1 max-w-sm">
                  <div className="font-bold text-slate-700">Bank Details:</div>
                  <div className="font-mono text-slate-600 text-[11px]">
                    {activeCompany?.bankName} | A/C: {activeCompany?.accountNo} | IFSC: {activeCompany?.ifsc}
                  </div>
                  <div className="text-[10px] text-slate-500 italic mt-2">
                    {invoice.terms || activeCompany?.terms || 'Standard payment terms apply.'}
                  </div>
                </div>

                <div className="w-64 font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-sans">Taxable:</span>
                    <span>₹{invoice.taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">Total Tax:</span>
                    <span>₹{(invoice.cgst + invoice.sgst + invoice.igst).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t-2 border-slate-900 font-bold text-sm">
                    <span className="font-sans">Grand Total:</span>
                    <span>₹{invoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-end">
                <div className="text-slate-600 italic">
                  Amount in words: {amountInWords(invoice.grandTotal)}
                </div>
                <div className="text-right">
                  <div className="font-bold">For {activeCompany?.name}</div>
                  <div className="mt-8 text-[10px] text-slate-400">Authorised Signatory</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STYLE 4: MODERN (Contemporary Sleek Design with Accent Borders)
             ======================================================== */}
          {printTheme === 'MODERN' && (
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 text-slate-900 shadow-xl print:shadow-none print:p-0 rounded-2xl border-2 border-indigo-900 text-xs">
              <div className="flex justify-between items-start pb-4 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  {activeCompany?.logoUrl ? (
                    <img src={activeCompany.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl">
                      {activeCompany?.name?.substring(0, 2).toUpperCase() || 'TP'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-black text-indigo-950 uppercase">{activeCompany?.name}</h1>
                    <p className="text-slate-500 text-[11px]">{activeCompany?.address}, {activeCompany?.city}</p>
                    <p className="font-mono text-indigo-700 font-semibold text-[11px]">GSTIN: {activeCompany?.gstin}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold rounded-full text-xs uppercase tracking-wide">
                    TAX INVOICE
                  </span>
                  <div className="mt-2 font-mono text-xs">
                    <div className="font-bold text-slate-900">#{invoice.invoiceNo}</div>
                    <div className="text-slate-500">{invoice.date}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b border-indigo-50">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{invoice.customerName}</div>
                  <div className="text-slate-600 text-[11px]">{invoice.billingAddress}</div>
                  <div className="font-mono text-[11px] text-slate-700 mt-1 font-semibold">
                    GSTIN: {invoice.customerGstin || 'B2C / Unregistered'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-right flex flex-col justify-between">
                  <div className="text-slate-600">
                    <span className="font-sans text-slate-400 text-[10px] uppercase block">Due Date</span>
                    <span className="font-bold text-slate-900">{invoice.dueDate}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-sans text-slate-400 text-[10px] uppercase block">Mode of Payment</span>
                    <span className="font-bold text-indigo-700">{invoice.paymentMode}</span>
                  </div>
                </div>
              </div>

              <table className="w-full my-4 text-xs text-left">
                <thead className="bg-indigo-50/70 text-indigo-950 font-bold">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Item</th>
                    <th className="p-2.5 text-center font-mono">HSN</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Rate</th>
                    <th className="p-2.5 text-right">Taxable</th>
                    <th className="p-2.5 text-right">GST</th>
                    <th className="p-2.5 text-right rounded-r-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {invoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-sans font-semibold text-slate-900">{it.name}</td>
                      <td className="p-2.5 text-center text-slate-500">{it.hsnSac}</td>
                      <td className="p-2.5 text-center">{it.qty} {it.unit}</td>
                      <td className="p-2.5 text-right">₹{it.rate.toFixed(2)}</td>
                      <td className="p-2.5 text-right">₹{it.taxableValue.toFixed(2)}</td>
                      <td className="p-2.5 text-right">₹{(it.cgst + it.sgst + it.igst).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-indigo-950">₹{it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <div className="font-bold text-indigo-900 text-xs">Direct UPI Payment</div>
                    {upiQrUrl && (
                      <div className="flex items-center gap-2.5 mt-2">
                        <img src={upiQrUrl} alt="UPI" className="w-14 h-14 bg-white p-1 rounded-lg border border-indigo-200" />
                        <div className="text-[10px] text-indigo-800">
                          <span className="font-mono block font-bold">{activeCompany?.upiId}</span>
                          <span>Zero transaction charges</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between py-1 text-slate-600">
                    <span className="font-sans">Taxable Value:</span>
                    <span>₹{invoice.taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span className="font-sans">Total GST:</span>
                    <span>₹{(invoice.cgst + invoice.sgst + invoice.igst).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-indigo-900 font-bold text-sm text-indigo-950">
                    <span className="font-sans">Grand Total:</span>
                    <span>₹{invoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-end text-xs">
                <div className="text-[11px] text-slate-500 italic max-w-sm">
                  Amount in words: {amountInWords(invoice.grandTotal)}
                </div>
                <div className="text-right">
                  <div className="font-bold text-indigo-950">For {activeCompany?.name}</div>
                  <div className="text-[10px] text-slate-400 mt-6">Authorized Signatory</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STYLE 5: CUSTOMIZE / ADVANCED (Fully Configurable A4 Layout)
             ======================================================== */}
          {printTheme === 'CUSTOM' && (
            <div 
              className="max-w-3xl mx-auto bg-white p-6 sm:p-8 text-slate-900 shadow-xl print:shadow-none print:p-0 text-xs border"
              style={{ borderColor: customConfig.accentColor }}
            >
              {/* Top Banner with Custom Accent Color */}
              <div 
                className="flex items-start justify-between pb-4 border-b-2 gap-4"
                style={{ borderColor: customConfig.accentColor }}
              >
                <div className="flex items-start gap-3">
                  {customConfig.showLogo && activeCompany?.logoUrl && (
                    <img 
                      src={activeCompany.logoUrl} 
                      alt="Logo" 
                      className="h-14 w-auto max-w-[110px] object-contain rounded border border-slate-200 p-0.5" 
                    />
                  )}
                  <div>
                    <h1 
                      className="text-xl font-black uppercase tracking-tight"
                      style={{ color: customConfig.accentColor }}
                    >
                      {activeCompany?.legalName || activeCompany?.name}
                    </h1>
                    <div className="text-slate-600 text-xs mt-0.5">
                      {activeCompany?.address}, {activeCompany?.city}, {activeCompany?.state} - {activeCompany?.pin}
                    </div>
                    <div className="text-xs font-mono mt-1 text-slate-800">
                      <b>GSTIN:</b> {activeCompany?.gstin} | <b>PAN:</b> {activeCompany?.pan}
                    </div>
                    <div className="text-xs text-slate-600">
                      Tel: +91 {activeCompany?.mobile} | Email: {activeCompany?.email}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div 
                    className="inline-block px-3 py-1 text-white font-bold text-sm tracking-wider uppercase rounded shadow-xs"
                    style={{ backgroundColor: customConfig.accentColor }}
                  >
                    {customConfig.invoiceTitle || 'TAX INVOICE'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">
                    {customConfig.copyTitle}
                  </div>
                  {customConfig.showIrnQr && invoice.irnStatus === 'GENERATED' && (
                    <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified e-Invoice</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional e-Invoice IRN Strip */}
              {customConfig.showIrnQr && invoice.irnStatus === 'GENERATED' && (
                <div className="my-2.5 p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                  <div className="font-mono text-[10px] space-y-0.5">
                    <div><b>IRN:</b> <span className="font-normal">{invoice.irn}</span></div>
                    <div><b>Ack No:</b> {invoice.ackNo} | <b>Ack Date:</b> {invoice.ackDate}</div>
                  </div>
                  {signedQrUrl && (
                    <img src={signedQrUrl} alt="IRN" className="w-12 h-12 bg-white border p-0.5" />
                  )}
                </div>
              )}

              {/* Bill & Receiver Meta */}
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Receiver (Billed To):</div>
                  <div className="font-bold text-sm text-slate-900">{invoice.customerName}</div>
                  <div className="text-slate-600">{invoice.billingAddress}</div>
                  <div className="font-mono">
                    <b>GSTIN:</b> {invoice.customerGstin || 'Unregistered / B2C'}
                  </div>
                  <div>
                    <b>State Code:</b> {invoice.customerStateCode}
                  </div>
                </div>

                <div className="space-y-1 text-right font-mono text-xs">
                  <div>
                    <span className="font-sans text-slate-500">Invoice No: </span>
                    <span className="font-bold text-slate-900">{invoice.invoiceNo}</span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-500">Invoice Date: </span>
                    <span>{invoice.date}</span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-500">Due Date: </span>
                    <span>{invoice.dueDate}</span>
                  </div>
                  <div>
                    <span className="font-sans text-slate-500">Payment Mode: </span>
                    <span className="font-bold font-sans">{invoice.paymentMode}</span>
                  </div>
                </div>
              </div>

              {/* Custom Item Table */}
              <div className="my-3 overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead 
                    className="text-white font-bold"
                    style={{ backgroundColor: customConfig.accentColor }}
                  >
                    <tr>
                      <th className="p-2 w-8 text-center">#</th>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-center font-mono">HSN/SAC</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Taxable</th>
                      <th className="p-2 text-right">GST</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {invoice.items.map((it, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : ''}>
                        <td className="p-2 text-center font-sans text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-sans font-semibold text-slate-900">{it.name}</td>
                        <td className="p-2 text-center text-slate-600">{it.hsnSac}</td>
                        <td className="p-2 text-center">{it.qty} {it.unit}</td>
                        <td className="p-2 text-right">₹{it.rate.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{it.taxableValue.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{(it.cgst + it.sgst + it.igst).toFixed(2)} ({it.gstRate}%)</td>
                        <td className="p-2 text-right font-bold text-slate-900">₹{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary & Optional Bank / UPI */}
              <div className="grid grid-cols-2 gap-4 py-2 text-xs">
                <div className="space-y-3">
                  {customConfig.showBankDetails && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="font-bold text-[11px] uppercase text-slate-700">Bank Payment Details</div>
                      <div className="mt-1 font-mono text-[11px] space-y-0.5">
                        <div>Bank: <span className="font-bold">{activeCompany?.bankName}</span></div>
                        <div>A/C: <span className="font-bold">{activeCompany?.accountNo}</span></div>
                        <div>IFSC: <span className="font-bold">{activeCompany?.ifsc}</span></div>
                        <div>Branch: {activeCompany?.branch}</div>
                      </div>
                    </div>
                  )}

                  {customConfig.showUpiQr && upiQrUrl && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <img src={upiQrUrl} alt="UPI QR" className="w-14 h-14 border rounded bg-white p-0.5" />
                      <div className="text-[10px]">
                        <div className="font-bold text-slate-800">Scan &amp; Pay via UPI</div>
                        <div className="text-slate-500 font-mono">{activeCompany?.upiId}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-sans text-slate-600">Taxable Value:</span>
                    <span className="font-bold">₹{invoice.taxableAmount.toFixed(2)}</span>
                  </div>
                  {invoice.igst > 0 ? (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-sans text-slate-600">IGST:</span>
                      <span>₹{invoice.igst.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="font-sans text-slate-600">CGST:</span>
                        <span>₹{invoice.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="font-sans text-slate-600">SGST:</span>
                        <span>₹{invoice.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-sans text-slate-500">Round Off:</span>
                    <span>{invoice.roundOff >= 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                  </div>
                  <div 
                    className="flex justify-between py-2 border-t-2 font-bold text-sm"
                    style={{ borderColor: customConfig.accentColor }}
                  >
                    <span className="font-sans">Grand Total:</span>
                    <span style={{ color: customConfig.accentColor }}>₹{invoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Amount in words */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                <span className="font-bold text-slate-700">Amount in Words: </span>
                <span className="font-medium italic">{amountInWords(invoice.grandTotal)}</span>
              </div>

              {/* Terms & Signatory */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200 text-xs">
                <div>
                  {customConfig.showTerms && (
                    <>
                      <div className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Terms &amp; Conditions:</div>
                      <div className="text-[10px] text-slate-600 whitespace-pre-line mt-1">
                        {customConfig.customTerms}
                      </div>
                    </>
                  )}
                  <div className="text-[9px] text-slate-400 italic mt-2">
                    {customConfig.declarationText}
                  </div>
                </div>

                {customConfig.showSignatureBox && (
                  <div className="text-right flex flex-col justify-between h-20">
                    <div className="font-bold text-xs text-slate-800">For {activeCompany?.name}</div>
                    <div className="text-[10px] text-slate-400 font-sans">Authorized Signatory</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              STYLE 6: THERMAL 80mm (POS Thermal Receipt)
             ======================================================== */}
          {printTheme === 'THERMAL' && (
            <div className="max-w-xs mx-auto bg-white p-4 font-mono text-[11px] text-slate-900 border border-slate-200 shadow-md print:border-none print:shadow-none print:p-1">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-bold text-sm">{activeCompany?.name}</div>
                <div className="text-[10px]">{activeCompany?.address}, {activeCompany?.city}</div>
                <div className="text-[10px]">GSTIN: {activeCompany?.gstin}</div>
                <div className="text-[10px]">Tel: +91 {activeCompany?.mobile}</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 text-[10px]">
                <div><b>TAX INVOICE</b></div>
                <div>Inv No: {invoice.invoiceNo}</div>
                <div>Date: {invoice.date}</div>
                <div>Customer: {invoice.customerName}</div>
                <div>GSTIN: {invoice.customerGstin || 'B2C'}</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold pb-1 text-[10px]">
                  <span>Item</span>
                  <span>Qty x Rate</span>
                  <span>Total</span>
                </div>
                {invoice.items.map((it, idx) => (
                  <div key={idx} className="text-[10px] py-0.5">
                    <div className="font-semibold">{it.name}</div>
                    <div className="flex justify-between text-slate-600">
                      <span>{it.qty} {it.unit} x ₹{it.rate}</span>
                      <span>₹{it.total}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Taxable:</span>
                  <span>₹{invoice.taxableAmount.toFixed(2)}</span>
                </div>
                {invoice.cgst > 0 && (
                  <div className="flex justify-between">
                    <span>CGST + SGST:</span>
                    <span>₹{(invoice.cgst + invoice.sgst).toFixed(2)}</span>
                  </div>
                )}
                {invoice.igst > 0 && (
                  <div className="flex justify-between">
                    <span>IGST:</span>
                    <span>₹{invoice.igst.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                  <span>GRAND TOTAL:</span>
                  <span>₹{invoice.grandTotal}</span>
                </div>
              </div>

              {upiQrUrl && (
                <div className="py-2 text-center border-b border-dashed border-slate-300">
                  <div className="text-[9px] font-bold">SCAN TO PAY (UPI)</div>
                  <img src={upiQrUrl} alt="UPI QR" className="mx-auto w-24 h-24 mt-1" />
                  <div className="text-[9px]">{activeCompany?.upiId}</div>
                </div>
              )}

              <div className="pt-2 text-center text-[9px] text-slate-500">
                Thank you for your visit!<br />
                Powered by TallyPro GST ERP
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
