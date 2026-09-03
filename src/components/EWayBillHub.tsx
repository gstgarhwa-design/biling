import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../data/indianStates';
import { SalesInvoice } from '../types';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MapPin, 
  Navigation, 
  Edit3, 
  Search, 
  ExternalLink,
  Plus
} from 'lucide-react';

interface EWayBillHubProps {
  onViewInvoice: (invoice: SalesInvoice) => void;
  targetInvoiceId?: string;
}

export const EWayBillHub: React.FC<EWayBillHubProps> = ({ onViewInvoice, targetInvoiceId }) => {
  const { salesInvoices, generateEWayBill } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(!!targetInvoiceId);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(targetInvoiceId || '');

  // Form states for E-Way Bill Generation
  const [transporterName, setTransporterName] = useState('V-Trans Logistics');
  const [transporterId, setTransporterId] = useState('27AABCV1234F1Z1');
  const [transportDocNo, setTransportDocNo] = useState('LR-98421');
  const [transportMode, setTransportMode] = useState<'ROAD' | 'RAIL' | 'AIR' | 'SHIP'>('ROAD');
  const [vehicleNo, setVehicleNo] = useState('MH12AB1234');
  const [approxDistanceKm, setApproxDistanceKm] = useState(140);

  // Invoices over 50k or goods consignment
  const ewayEligibleInvoices = salesInvoices.filter(i => i.grandTotal >= 50000 || i.ewayBillStatus === 'GENERATED');

  const generatedCount = ewayEligibleInvoices.filter(i => i.ewayBillStatus === 'GENERATED').length;
  const pendingCount = ewayEligibleInvoices.filter(i => i.ewayBillStatus !== 'GENERATED').length;

  const handleCreateEWayBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert('Please select an invoice');
      return;
    }
    if (!vehicleNo && transportMode === 'ROAD') {
      alert('Vehicle Number is required for road transport');
      return;
    }

    const res = generateEWayBill(selectedInvoiceId, {
      transporterName,
      transporterId,
      transportMode,
      transportDocNo,
      vehicleNo: vehicleNo.toUpperCase(),
      approxDistanceKm,
    });

    alert(res.message);
    setShowGenerateModal(false);
  };

  const q = (searchQuery || '').trim().toLowerCase();
  const filteredInvoices = ewayEligibleInvoices.filter(inv => 
    !q ||
    (inv.invoiceNo || '').toLowerCase().includes(q) ||
    (inv.customerName || '').toLowerCase().includes(q) ||
    (Boolean(inv.ewayBillNo) && (inv.ewayBillNo || '').toLowerCase().includes(q))
  );

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <Truck className="w-4 h-4 text-indigo-400" />
            <span>National E-Way Bill System (eWayBill2)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">E-Way Bill Center (Part A &amp; Part B)</h1>
          <p className="text-xs text-indigo-200 mt-0.5">
            Mandatory for inter-state &amp; intra-state consignments of goods exceeding ₹50,000 value
          </p>
        </div>

        <button
          onClick={() => {
            const firstPending = ewayEligibleInvoices.find(i => i.ewayBillStatus !== 'GENERATED');
            if (firstPending) setSelectedInvoiceId(firstPending.id);
            setShowGenerateModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generate E-Way Bill</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-xs text-slate-500">Active Generated E-Way Bills</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {generatedCount} Bills
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            Part A + Part B verified
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-xs text-slate-500">Consignments &gt; ₹50,000 Pending</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {pendingCount} Pending
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Requires vehicle and transporter assignment
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-xs text-slate-500">Government Validity Rule</div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2">
            1 Day per 200 KM distance (Normal Cargo)
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Cancel window within 24 hrs of generation
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by invoice no, party, or E-Way Bill No..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
        />
      </div>

      {/* Table of Bills */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Invoice Details</th>
                <th className="px-4 py-3">Recipient &amp; Destination</th>
                <th className="px-4 py-3 text-right">Consignment Value</th>
                <th className="px-4 py-3">E-Way Bill Number</th>
                <th className="px-4 py-3">Transport &amp; Vehicle</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No consignments over ₹50,000 threshold found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">{inv.invoiceNo}</div>
                      <div className="text-[10px] text-slate-400">{inv.date}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-500">{inv.shippingAddress}</div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(inv.grandTotal)}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      {inv.ewayBillNo ? (
                        <div>
                          <div className="font-bold text-indigo-600 dark:text-indigo-400">{inv.ewayBillNo}</div>
                          <div className="text-[10px] text-slate-400">Gen: {inv.ewayBillDate}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Generated</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      {inv.vehicleNo ? (
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{inv.vehicleNo}</span>
                          <span className="text-[10px] text-slate-500 block">{inv.transporterName || 'Self Transport'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {inv.ewayBillStatus === 'GENERATED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid EWB
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending &gt; 50k
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {inv.ewayBillStatus !== 'GENERATED' ? (
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(inv.id);
                            setShowGenerateModal(true);
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-2xs"
                        >
                          Generate
                        </button>
                      ) : (
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Print Slip
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Generate E-Way Bill */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Generate E-Way Bill (Part A &amp; Part B)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter Transporter ID and Vehicle Number for road movement
            </p>

            <form onSubmit={handleCreateEWayBill} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Sales Tax Invoice *
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={e => setSelectedInvoiceId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  required
                >
                  <option value="">-- Choose Invoice --</option>
                  {salesInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} - {inv.customerName} ({formatINR(inv.grandTotal)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transport Mode
                  </label>
                  <select
                    value={transportMode}
                    onChange={e => setTransportMode(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    <option value="ROAD">1 - Road</option>
                    <option value="RAIL">2 - Rail</option>
                    <option value="AIR">3 - Air</option>
                    <option value="SHIP">4 - Ship</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approx Distance (in KM) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={approxDistanceKm}
                    onChange={e => setApproxDistanceKm(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Number (Part B) *
                  </label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                    placeholder="e.g. MH12DE9876"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transporter Doc / LR No
                  </label>
                  <input
                    type="text"
                    value={transportDocNo}
                    onChange={e => setTransportDocNo(e.target.value)}
                    placeholder="e.g. LR-40192"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transporter Name
                  </label>
                  <input
                    type="text"
                    value={transporterName}
                    onChange={e => setTransporterName(e.target.value)}
                    placeholder="e.g. V-Trans Logistics Ltd"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transporter GSTIN / ID
                  </label>
                  <input
                    type="text"
                    value={transporterId}
                    onChange={e => setTransporterId(e.target.value.toUpperCase())}
                    placeholder="15-digit GSTIN or TRANSID"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Confirm &amp; Generate EWB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
