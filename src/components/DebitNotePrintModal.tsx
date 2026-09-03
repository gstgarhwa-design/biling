import React, { useState, useEffect } from 'react';
import { DebitNote } from '../types';
import { useApp } from '../context/AppContext';
import { formatINR, amountInWords } from '../data/indianStates';
import QRCode from 'qrcode';
import { 
  Printer, 
  X, 
  Building2, 
  Share2, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface DebitNotePrintModalProps {
  debitNote: DebitNote;
  onClose: () => void;
}

export const DebitNotePrintModal: React.FC<DebitNotePrintModalProps> = ({ debitNote, onClose }) => {
  const { activeCompany } = useApp();
  const [docQrUrl, setDocQrUrl] = useState<string>('');

  useEffect(() => {
    const qrData = `DN:${debitNote.debitNoteNo}|SUPP:${debitNote.supplierName}|VAL:${debitNote.totalAmount}|DATE:${debitNote.date}|GSTIN:${debitNote.supplierGstin || 'UNREG'}`;
    QRCode.toDataURL(qrData, { width: 110, margin: 1 })
      .then(url => setDocQrUrl(url))
      .catch(console.error);
  }, [debitNote]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
              Purchase Return / Debit Note Voucher
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {debitNote.debitNoteNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Debit Note</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-slate-900 print:p-0 font-sans">
          <div className="border border-slate-300 rounded-xl p-6 print:border-none print:p-0 space-y-5">
            
            {/* Header: Company Profile + Title */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
              <div className="space-y-1">
                {activeCompany?.logoUrl && (
                  <img src={activeCompany.logoUrl} alt="Company Logo" className="h-12 w-auto max-w-[160px] object-contain mb-2" />
                )}
                <h1 className="text-xl font-black tracking-tight text-slate-900">{activeCompany?.legalName || activeCompany?.name}</h1>
                <p className="text-xs text-slate-600 max-w-md">
                  {activeCompany?.address}, {activeCompany?.city}, {activeCompany?.state} - {activeCompany?.pin}
                </p>
                <div className="text-xs text-slate-700 font-mono">
                  <b>GSTIN:</b> {activeCompany?.gstin} &nbsp;|&nbsp; <b>PAN:</b> {activeCompany?.pan}
                </div>
                <div className="text-xs text-slate-600">
                  <b>Email:</b> {activeCompany?.email || 'N/A'} &nbsp;|&nbsp; <b>Phone:</b> +91 {activeCompany?.mobile || 'N/A'}
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="px-3.5 py-1.5 bg-amber-600 text-white font-bold text-sm tracking-wider uppercase rounded shadow-xs">
                  DEBIT NOTE / PURCHASE RETURN
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  (Under Section 34 of GST Act, 2017)
                </div>
                {docQrUrl && (
                  <img src={docQrUrl} alt="Document QR" className="w-20 h-20 mt-2 border p-1 rounded bg-white" />
                )}
              </div>
            </div>

            {/* Note & Supplier Details Grid */}
            <div className="grid grid-cols-2 gap-4 py-3 bg-slate-50 rounded-lg p-3 text-xs border border-slate-200">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  DEBITED TO (VENDOR / SUPPLIER):
                </div>
                <div className="font-bold text-sm text-slate-900">{debitNote.supplierName}</div>
                <div className="font-mono text-slate-700">
                  <b>Supplier GSTIN:</b> {debitNote.supplierGstin || 'Unregistered'}
                </div>
              </div>

              <div className="space-y-1 text-right sm:text-left sm:pl-8 sm:border-l border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  VOUCHER DETAILS:
                </div>
                <div className="font-mono"><b>Debit Note No:</b> <span className="font-bold text-indigo-700">{debitNote.debitNoteNo}</span></div>
                <div><b>Date:</b> {debitNote.date}</div>
                <div className="font-mono"><b>Against Purchase Bill Ref:</b> {debitNote.originalSupplierInvoiceNo || 'N/A'}</div>
                <div><b>Place of Supply:</b> {activeCompany?.stateCode} - {activeCompany?.state}</div>
              </div>
            </div>

            {/* Reason for Return Notice */}
            <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-bold text-amber-900">Reason for Purchase Return: </span>
                <span className="text-amber-800">{debitNote.reason || 'Goods returned due to quality deviation / damage'}</span>
              </div>
            </div>

            {/* Item Table */}
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center w-10 border-r border-slate-200">#</th>
                  <th className="p-2.5 border-r border-slate-200">Description of Goods Returned</th>
                  <th className="p-2.5 text-center border-r border-slate-200">HSN/SAC</th>
                  <th className="p-2.5 text-center border-r border-slate-200">Qty</th>
                  <th className="p-2.5 text-right border-r border-slate-200">Rate (₹)</th>
                  <th className="p-2.5 text-right border-r border-slate-200">Taxable Val (₹)</th>
                  <th className="p-2.5 text-center border-r border-slate-200">GST %</th>
                  <th className="p-2.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {debitNote.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                    <td className="p-2.5 font-medium border-r border-slate-200">{it.name}</td>
                    <td className="p-2.5 text-center font-mono border-r border-slate-200">{it.hsnSac || '8471'}</td>
                    <td className="p-2.5 text-center font-bold border-r border-slate-200">{it.qty} {it.unit || 'PCS'}</td>
                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{formatINR(it.rate)}</td>
                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{formatINR(it.taxableValue)}</td>
                    <td className="p-2.5 text-center font-mono border-r border-slate-200">{it.gstRate || 18}%</td>
                    <td className="p-2.5 text-right font-bold font-mono">{formatINR(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations & Summary Grid */}
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <div className="text-xs">
                  <div className="font-bold text-slate-500 uppercase text-[10px]">Total Amount in Words:</div>
                  <div className="font-semibold text-slate-800 italic mt-0.5 capitalize">
                    INR {amountInWords(debitNote.totalAmount)} Only
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">Declaration & Statutory Note:</div>
                  <p>1. We confirm that the above goods have been returned to the supplier or value reduced.</p>
                  <p>2. Corresponding Input Tax Credit (ITC) has been reversed under Table 4(B) of Form GSTR-3B.</p>
                </div>
              </div>

              {/* Tax Calculations */}
              <div className="space-y-1.5 text-xs text-right">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Total Taxable Value:</span>
                  <span className="font-mono font-semibold">{formatINR(debitNote.taxableAmount)}</span>
                </div>
                {debitNote.cgst > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Central Tax (CGST):</span>
                    <span className="font-mono font-semibold">{formatINR(debitNote.cgst)}</span>
                  </div>
                )}
                {debitNote.sgst > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">State/UT Tax (SGST):</span>
                    <span className="font-mono font-semibold">{formatINR(debitNote.sgst)}</span>
                  </div>
                )}
                {debitNote.igst > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Integrated Tax (IGST):</span>
                    <span className="font-mono font-semibold">{formatINR(debitNote.igst)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-950">
                  <span>TOTAL DEBIT AMOUNT:</span>
                  <span className="font-mono text-base text-amber-700">{formatINR(debitNote.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-10 flex justify-between items-end border-t border-slate-200 text-xs text-slate-600">
              <div className="text-center">
                <div className="h-10"></div>
                <div className="pt-1 border-t border-slate-300 font-semibold">Receiver's Acknowledgement &amp; Stamp</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-slate-900 mb-8">For {activeCompany?.name}</div>
                <div className="pt-1 border-t border-slate-300 font-semibold">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
