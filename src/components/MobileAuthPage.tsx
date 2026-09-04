import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  KeyRound, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Phone, 
  Lock, 
  Clock, 
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizeMobile } from '../lib/supabase';
import { UserRole } from '../types';

export const MobileAuthPage: React.FC = () => {
  const { requestOtp, verifyOtp } = useApp();
  
  // State
  const [mobile, setMobile] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isResendActive, setIsResendActive] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState<'NONE' | 'NOT_REGISTERED' | 'INACTIVE' | 'INVALID_OTP' | 'EXPIRED'>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false);
  const [loginSuccessRole, setLoginSuccessRole] = useState<UserRole | null>(null);

  // References for OTP digit focus management
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendActive(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= 10) {
      setMobile(raw);
      setErrorMsg('');
      setErrorType('NONE');
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeMobile(mobile);
    if (!clean || clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      setErrorType('NOT_REGISTERED');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setErrorType('NONE');

    // Simulate standard network dispatch time
    setTimeout(() => {
      const result = requestOtp(clean);
      setIsSubmitting(false);

      if (!result.success) {
        if (result.status === 'NOT_REGISTERED') {
          setErrorType('NOT_REGISTERED');
          setErrorMsg('Mobile number is not registered. Please contact your administrator.');
        } else if (result.status === 'INACTIVE') {
          setErrorType('INACTIVE');
          setErrorMsg('Your account is deactivated. Please contact your administrator.');
        } else {
          setErrorMsg(result.message);
        }
        return;
      }

      // Successful OTP dispatch
      setMaskedMobile(result.maskedMobile || `+91 ****** ${clean.slice(-4)}`);
      setDemoOtpHint(result.otp || '123456');
      setStep('OTP');
      setCountdown(30);
      setIsResendActive(false);
      setOtpDigits(['', '', '', '', '', '']);

      // Focus on first OTP input
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 100);
    }, 400);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErrorMsg('');
    setErrorType('NONE');

    if (char && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      digitRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP');
      setErrorType('INVALID_OTP');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      const result = verifyOtp(mobile, fullOtp);
      setIsSubmitting(false);

      if (!result.success) {
        setErrorType('INVALID_OTP');
        setErrorMsg(result.message || 'Invalid OTP. Please check and try again.');
        return;
      }

      // Success: Automatic role detected
      if (result.role) {
        setLoginSuccessRole(result.role);
      }
    }, 500);
  };

  const handleResend = () => {
    if (!isResendActive) return;
    const clean = normalizeMobile(mobile);
    const result = requestOtp(clean);
    if (result.success) {
      setDemoOtpHint(result.otp || '123456');
      setCountdown(30);
      setIsResendActive(false);
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setErrorType('NONE');
      digitRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans">
      {/* Dynamic ambient lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar Brand */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-base block">GST Accounting &amp; Tax ERP</span>
            <span className="text-[11px] text-slate-400 font-medium">Enterprise e-Invoice &amp; Role-Based Multi-Company Gateway</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Database RLS Active
          </span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-4">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle card glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />

          {/* Success Overlay after OTP verification */}
          {loginSuccessRole && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Identity Verified!</h3>
              <p className="text-sm text-slate-400 mb-4">
                Automatic Role Detection Applied:
              </p>
              <div className="px-4 py-2 rounded-xl bg-indigo-950/80 border border-indigo-700/80 text-indigo-300 font-mono font-bold text-sm tracking-wide mb-3">
                ROLE: {loginSuccessRole}
              </div>
              <p className="text-xs text-slate-500">Redirecting to authorized dashboard...</p>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400 mx-auto flex items-center justify-center mb-3 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Login with Mobile Number
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Enter your registered 10-digit mobile number to access your company ERP dashboard.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMsg}</p>
                {errorType === 'NOT_REGISTERED' && (
                  <button
                    type="button"
                    onClick={() => setIsContactAdminOpen(true)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Contact Administrator for Access &rarr;
                  </button>
                )}
                {errorType === 'INACTIVE' && (
                  <button
                    type="button"
                    onClick={() => setIsContactAdminOpen(true)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                  >
                    Request Account Reactivation &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: MOBILE INPUT */}
          {step === 'MOBILE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1.5 text-slate-400 text-sm font-medium border-r border-slate-700 pr-2 pointer-events-none">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    id="mobile_login_input"
                    value={mobile}
                    onChange={handleMobileChange}
                    placeholder="Enter 10-digit mobile"
                    maxLength={10}
                    className="w-full pl-20 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all tracking-wider"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                  <span>Enter 10 digits without prefix (+91 or 0)</span>
                  <span className="font-mono">{mobile.length}/10</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={mobile.length !== 10 || isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with Database...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 block">OTP Sent to Registered Number:</span>
                <span className="text-base font-bold text-indigo-400 tracking-wider font-mono">
                  {maskedMobile}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('MOBILE');
                    setErrorMsg('');
                  }}
                  className="block mx-auto text-[11px] text-slate-400 hover:text-white underline mt-1"
                >
                  Change Mobile Number
                </button>
              </div>

              {/* Demo Hint Banner for Testing Ease */}
              {demoOtpHint && (
                <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/50 text-[11px] text-indigo-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Verification Code:</span>
                    <strong className="font-mono text-xs bg-indigo-900/80 px-2 py-0.5 rounded text-white tracking-widest">{demoOtpHint}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = demoOtpHint.split('').slice(0, 6);
                      setOtpDigits(digits);
                    }}
                    className="px-2 py-0.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex justify-between gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (digitRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 sm:w-12 h-12 text-center text-lg font-bold text-white bg-slate-800/90 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>Valid for 5 mins</span>
                  </span>
                  {isResendActive ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="text-slate-500 font-mono">
                      Resend in {countdown}s
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={otpDigits.join('').length !== 6 || isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Role &amp; Access...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Verify OTP &amp; Enter Dashboard</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security Assurance footer */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Multi-tenant Isolation • Encrypted Session Token</span>
            </p>
          </div>
        </div>
      </main>

      {/* Contact Administrator Modal */}
      {isContactAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Contact Administrator</h3>
            <p className="text-xs text-slate-400 mb-4">
              To request an account or reactivate your existing profile, please contact your organization administrator with your official details.
            </p>

            <div className="space-y-2.5 text-xs bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 mb-5">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>support@gstaccounting-erp.in</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+91 1800-456-7890 (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Central Admin Desk • IT Security Office</span>
              </div>
            </div>

            <button
              onClick={() => setIsContactAdminOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
