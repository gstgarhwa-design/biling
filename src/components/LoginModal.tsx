import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Smartphone, KeyRound, CheckCircle2, UserCheck, Building2, AlertCircle } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { currentUser, loginWithOtp, quickLogin, users, companies, getAuthorizedCompaniesForMobile, adminCompanyPermissions } = useApp();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'OTP' | 'SELECT_COMPANY'>('MOBILE');
  const [authorizedCompanies, setAuthorizedCompanies] = useState<typeof companies>([]);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');

  if (currentUser) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    // Generate simulated 6-digit OTP
    const mockOtp = '123456';
    setGeneratedOtp(mockOtp);
    setOtp(mockOtp); // Auto-fill for convenience
    setStep('OTP');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== generatedOtp && otp !== '123456') {
      setError('Invalid OTP. Please enter ' + generatedOtp);
      return;
    }

    const matchedUser = users.find(u => u.mobile === mobile.trim());
    if (!matchedUser || !matchedUser.active) {
      setError('No active user account found with this mobile number in this database.');
      return;
    }

    const authorized = getAuthorizedCompaniesForMobile(mobile.trim());
    if (matchedUser.role !== 'SUPER_ADMIN' && authorized.length === 0) {
      setError('No authorized companies assigned to this mobile number.');
      return;
    }

    // If multi-company admin with > 1 authorized companies, show company selector
    if (matchedUser.role !== 'SUPER_ADMIN' && authorized.length > 1) {
      setAuthorizedCompanies(authorized);
      setStep('SELECT_COMPANY');
      setError('');
      return;
    }

    // Single company or Super Admin
    const success = loginWithOtp(mobile, otp, authorized[0]?.id);
    if (!success) {
      setError('Authentication failed. Please verify credentials.');
    }
  };

  const handleSelectCompanyLogin = (companyId: string) => {
    const success = loginWithOtp(mobile, otp, companyId);
    if (!success) {
      setError('Could not access selected company. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg frosted-glass-card rounded-3xl shadow-2xl border border-white/60 dark:border-white/10 p-6 md:p-8 relative overflow-hidden">
        {/* Soft background aura */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-3">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            GST Accounting &amp; e-Invoice ERP
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Secure Multi-Company OTP Login • Role-Based Access Control
          </p>
        </div>

        {/* OTP Input Form */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 dark:border-slate-700/60 shadow-xs mb-6 relative z-10">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'MOBILE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Mobile Number (OTP Verification)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="text-sm font-semibold text-slate-500">+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile || ''}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit mobile"
                    className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-slate-300/80 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-98"
              >
                <Smartphone className="w-4 h-4" />
                Get OTP via SMS
              </button>
            </form>
          ) : step === 'OTP' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>OTP sent to +91 {mobile}</span>
                <button
                  type="button"
                  onClick={() => { setStep('MOBILE'); setError(''); }}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Change Number
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Enter 6-Digit OTP
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp || ''}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300/80 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white text-base tracking-widest font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Demo Auto-fill OTP: <span className="font-mono font-bold">123456</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                Verify OTP &amp; Proceed
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Multiple Companies Authorized</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">Select the company workspace you want to log into:</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep('MOBILE'); setError(''); }}
                  className="text-xs text-slate-400 hover:text-indigo-600 hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {authorizedCompanies.map(comp => {
                  const perm = adminCompanyPermissions.find(p => p.adminMobile === mobile.trim() && p.companyId === comp.id);
                  return (
                    <div
                      key={comp.id}
                      onClick={() => handleSelectCompanyLogin(comp.id)}
                      className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-slate-800/80 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/50 cursor-pointer transition-all duration-150 hover:shadow-md hover:border-indigo-400 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">
                              {comp.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              GSTIN: {comp.gstin} • {comp.state} ({comp.stateCode})
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                          {perm?.role || 'ADMIN'}
                        </span>
                      </div>
                      
                      {perm?.permissions && (
                        <div className="mt-2.5 pt-2 border-t border-indigo-100/60 dark:border-slate-700/60 flex flex-wrap gap-1">
                          {Object.entries(perm.permissions).filter(([_, v]) => v).map(([k]) => (
                            <span key={k} className="text-[10px] font-medium px-1.5 py-0.5 bg-white/80 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 capitalize">
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Fast Profile Switcher for Evaluation */}
        <div className="relative z-10">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200/60 dark:border-slate-700/60"></div>
            <span className="flex-shrink mx-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Or 1-Click Fast Test Profiles
            </span>
            <div className="flex-grow border-t border-slate-200/60 dark:border-slate-700/60"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            {/* Super Admin */}
            <button
              type="button"
              onClick={() => quickLogin('user-super')}
              className="p-3 text-left rounded-2xl border border-purple-200/70 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/20 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-purple-600 text-white">
                  Super Admin
                </span>
                <UserCheck className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-xs mt-1.5">
                Rajesh Sharma
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                All Companies &amp; Global Overview
              </div>
            </button>

            {/* Admin Company A */}
            <button
              type="button"
              onClick={() => quickLogin('user-admin-1')}
              className="p-3 text-left rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-600 text-white">
                  Admin (Comp A)
                </span>
                <Building2 className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-xs mt-1.5">
                Vikram Mehta
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Apex Infotech Pvt Ltd (MH)
              </div>
            </button>

            {/* Admin Company B */}
            <button
              type="button"
              onClick={() => quickLogin('user-admin-2')}
              className="p-3 text-left rounded-2xl border border-emerald-200/70 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-600 text-white">
                  Admin (Comp B)
                </span>
                <Building2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-xs mt-1.5">
                Amit Patel
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Bharat Logistics &amp; Traders (GJ)
              </div>
            </button>

            {/* Staff A1 */}
            <button
              type="button"
              onClick={() => quickLogin('user-staff-1')}
              className="p-3 text-left rounded-2xl border border-amber-200/70 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-600 text-white">
                  Staff (Sales/Billing)
                </span>
                <UserCheck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-xs mt-1.5">
                Priya Verma
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Apex Infotech • Sales &amp; e-Invoice
              </div>
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-400">
          Strict Multi-Tenant Isolation • GST Ready • Indian Accounting Standards
        </div>
      </div>
    </div>
  );
};
