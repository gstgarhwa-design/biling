import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Building2, 
  CreditCard, 
  QrCode, 
  Key, 
  FileText, 
  Database, 
  Save, 
  Check,
  ShieldCheck,
  Smartphone,
  Mail,
  Phone,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  MapPin
} from 'lucide-react';

export const GstSettingsModule: React.FC = () => {
  const { activeCompany, gstConfig, updateCompany, updateGstConfig } = useApp();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Company profile form
  const [name, setName] = useState(activeCompany?.name || '');
  const [legalName, setLegalName] = useState(activeCompany?.legalName || activeCompany?.name || '');
  const [tradeName, setTradeName] = useState((activeCompany as any)?.tradeName || activeCompany?.name || '');
  const [gstin, setGstin] = useState(activeCompany?.gstin || '');
  const [pan, setPan] = useState(activeCompany?.pan || '');
  const [address, setAddress] = useState(activeCompany?.address || '');
  const [city, setCity] = useState(activeCompany?.city || 'Mumbai');
  const [state, setState] = useState(activeCompany?.state || 'Maharashtra');
  const [stateCode, setStateCode] = useState(activeCompany?.stateCode || '27');
  const [pin, setPin] = useState(activeCompany?.pin || '400069');
  
  // Mobile, Email, Logo
  const [mobile, setMobile] = useState(activeCompany?.mobile || '');
  const [email, setEmail] = useState(activeCompany?.email || '');
  const [logoUrl, setLogoUrl] = useState(activeCompany?.logoUrl || '');
  const [invoicePrefix, setInvoicePrefix] = useState(activeCompany?.invoicePrefix || 'APX/25/');

  // Bank & UPI
  const [bankName, setBankName] = useState((activeCompany as any)?.bankDetails?.bankName || activeCompany?.bankName || 'HDFC Bank Ltd');
  const [accountNumber, setAccountNumber] = useState((activeCompany as any)?.bankDetails?.accountNumber || activeCompany?.accountNo || '50200049281920');
  const [ifsc, setIfsc] = useState((activeCompany as any)?.bankDetails?.ifsc || activeCompany?.ifsc || 'HDFC0000128');
  const [branch, setBranch] = useState((activeCompany as any)?.bankDetails?.branch || activeCompany?.branch || 'Andheri East, Mumbai');
  const [upiId, setUpiId] = useState((activeCompany as any)?.bankDetails?.upiId || (activeCompany as any)?.upiId || 'apexinfo@hdfcbank');

  // GST / IRP Credentials
  const [isSandbox, setIsSandbox] = useState<boolean>(Boolean((gstConfig as any)?.isSandbox ?? !gstConfig?.isLive));
  const [provider, setProvider] = useState<string>(gstConfig?.provider || 'NIC_SANDBOX');
  const [clientId, setClientId] = useState<string>(gstConfig?.clientId || '');
  const [clientSecret, setClientSecret] = useState<string>(gstConfig?.clientSecret || '');
  const [ewbThreshold, setEwbThreshold] = useState<number>((gstConfig as any)?.ewbThreshold ?? 50000);
  const [einvoiceThreshold, setEinvoiceThreshold] = useState<number>((gstConfig as any)?.einvoiceThreshold ?? 50000000);

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCompany) {
      updateCompany(activeCompany.id, {
        name,
        legalName,
        tradeName,
        gstin,
        pan,
        address,
        city,
        state,
        stateCode,
        pin,
        mobile,
        email,
        logoUrl,
        invoicePrefix,
        bankName,
        accountNo: accountNumber,
        ifsc,
        branch,
        upiId,
      } as any);
    }

    updateGstConfig({
      isSandbox,
      provider,
      clientId,
      clientSecret,
      ewbThreshold,
      einvoiceThreshold,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Company Profile, Branding &amp; GST Gateway</span>
            {savedSuccess && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Changes Saved Successfully!
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure company logo, official email, phone, bank QR for instant UPI payments, and NIC IRP API credentials
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Profile, Logo & Contact Details */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Company Branding, Logo &amp; Statutory Identity
            </h2>
          </div>

          {/* Logo Upload Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="text-center p-2">
                      <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
                      <span className="text-[9px] text-slate-400 block mt-0.5">No Logo</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">Company Invoice Logo</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Printed on tax invoices, debit notes, payment receipts, and dispatch slips. Max 2MB (PNG, JPG, SVG).
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct URL input */}
              <div className="w-full sm:w-72 text-xs">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Or paste Logo Image URL:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl.startsWith('data:') ? '' : logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Contact Details: Mobile & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Company Mobile / Phone Number *</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 font-bold text-slate-400 font-mono text-xs">+91</div>
                <input
                  type="tel"
                  required
                  placeholder="9820123456"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-11 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs font-bold"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Printed on invoice header and SMS dispatch alerts</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Official Business Email Address *</span>
              </label>
              <input
                type="email"
                required
                placeholder="billing@apexinfotech.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Target address for automated invoice PDFs &amp; e-mailers</span>
            </div>
          </div>

          {/* Legal Names & GSTIN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Company Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Legal Entity Name (As on GST Portal)
              </label>
              <input
                type="text"
                value={legalName}
                onChange={e => setLegalName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN (15 Digits) *
              </label>
              <input
                type="text"
                required
                value={gstin}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setGstin(val);
                  if (val.length >= 2) setStateCode(val.substring(0, 2));
                  if (val.length >= 12) setPan(val.substring(2, 12));
                }}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono uppercase font-bold"
              />
            </div>
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Principal Place of Business
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Town
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PIN Code
              </label>
              <input
                type="text"
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                State &amp; 2-digit State Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  value={stateCode}
                  onChange={e => setStateCode(e.target.value)}
                  className="w-16 p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Income Tax PAN (10 Digits)
              </label>
              <input
                type="text"
                value={pan}
                onChange={e => setPan(e.target.value.toUpperCase())}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Number Series Prefix
              </label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={e => setInvoicePrefix(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bank Details & UPI Dynamic QR */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Bank Account &amp; Dynamic UPI QR Code (B2C &amp; B2B Payment)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={ifsc}
                onChange={e => setIfsc(e.target.value.toUpperCase())}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch Location
              </label>
              <input
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                UPI ID (VPA for Printed QR)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="e.g. apexinfo@hdfcbank"
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: IRP & E-Way Bill Integration */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                NIC / IRP e-Invoice &amp; E-Way Bill API Gateway Settings
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Environment:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isSandbox ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isSandbox ? 'Sandbox / Testing IRP' : 'Production NIC'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSP / IRP Provider
              </label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              >
                <option value="NIC Official IRP (National Informatics Centre)">NIC Official IRP (Govt)</option>
                <option value="ClearTax GSP Connector">ClearTax GSP Connector</option>
                <option value="Karvy GSP Direct">Karvy GSP Direct</option>
                <option value="Masters India GSP">Masters India GSP</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                API Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                API Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={e => setClientSecret(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-Way Bill Generation Limit (₹)
              </label>
              <input
                type="number"
                value={ewbThreshold ?? 50000}
                onChange={e => setEwbThreshold(parseFloat(e.target.value) || 50000)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Government statutory limit is ₹50,000</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                e-Invoice Annual Turnover Threshold (₹)
              </label>
              <input
                type="number"
                value={einvoiceThreshold ?? 50000000}
                onChange={e => setEinvoiceThreshold(parseFloat(e.target.value) || 50000000)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Mandatory for entities &gt; ₹5 Crore aggregate turnover</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
