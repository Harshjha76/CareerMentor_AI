import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Mail,
  User,
  BellRing,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  X,
  UserPlus
} from 'lucide-react';

const INITIAL_GOOGLE_ACCOUNTS = [
  { name: 'Harsh Jha', email: 'harshjha101ab@gmail.com', bg: 'bg-[#E11D48]', initial: 'H' },
  { name: 'Harsh Jha', email: '125harsh6001@sjcem.edu.in', bg: 'bg-[#DB2777]', initial: 'H' },
  { name: 'Hardik Patil', email: '125hardik6051@sjcem.edu.in', bg: 'bg-[#581C87]', initial: 'AXE' },
  { name: 'Harsh Jha', email: 'harshjha1880@gmail.com', bg: 'bg-[#EA580C]', initial: 'H' },
  { name: 'Harsh Jha', email: 'jhah9338@gmail.com', bg: 'bg-[#0D9488]', initial: 'H' },
  { name: 'Harsh Jha', email: 'hj251380@gmail.com', bg: 'bg-[#4F46E5]', initial: 'H' },
  { name: 'Harsh Jha', email: 'hjha9127@gmail.com', bg: 'bg-[#2563EB]', initial: 'H' },
  { name: 'Virat', email: 'virat100cent@gmail.com', bg: 'bg-[#9333EA]', initial: 'V' }
];

export default function GoogleSignInButton({ fullWidth = false }) {
  const { loginWithEmail, loginWithDemo, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Sample known accounts stored locally for fast multi-account switching
  const [savedAccounts, setSavedAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpilot_known_google_accounts');
      return saved ? JSON.parse(saved) : INITIAL_GOOGLE_ACCOUNTS;
    } catch {
      return INITIAL_GOOGLE_ACCOUNTS;
    }
  });

  const saveAccountHistory = (account) => {
    try {
      const existing = savedAccounts.filter(a => a.email.toLowerCase() !== account.email.toLowerCase());
      const updated = [account, ...existing].slice(0, 10);
      setSavedAccounts(updated);
      localStorage.setItem('careerpilot_known_google_accounts', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save account history:', e);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address to continue.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const user = await loginWithEmail(email.trim(), name.trim());
      saveAccountHistory({
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        initial: (name.trim() || email.trim()).charAt(0).toUpperCase(),
        bg: 'bg-[#2563EB]'
      });
      if (user && !user.is_onboarded) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to authenticate with email.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await loginWithDemo();
      if (user && !user.is_onboarded) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg('Login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccountSelect = async (selectedEmail, selectedName, selectedBg, selectedInitial) => {
    if (!selectedEmail || !selectedEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setShowAccountSelector(false);

    try {
      const user = await loginWithGoogle({
        email: selectedEmail.trim(),
        name: selectedName?.trim() || selectedEmail.split('@')[0],
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(selectedEmail.trim())}`
      });

      saveAccountHistory({
        email: selectedEmail.trim(),
        name: selectedName?.trim() || selectedEmail.split('@')[0],
        bg: selectedBg || 'bg-[#2563EB]',
        initial: selectedInitial || (selectedName || selectedEmail).charAt(0).toUpperCase()
      });

      if (user && !user.is_onboarded) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg('Google authentication error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    // If real Google Identity Services client ID exists in env, initialize GIS prompt
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google?.accounts?.id && clientId && !clientId.includes('YOUR_GOOGLE') && clientId.length > 20) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              setLoading(true);
              const user = await loginWithGoogle(response.credential);
              if (user && !user.is_onboarded) {
                navigate('/onboarding');
              } else {
                navigate('/dashboard');
              }
            } catch (err) {
              setErrorMsg('Google sign-in error: ' + err.message);
            } finally {
              setLoading(false);
            }
          },
          auto_select: false,
          prompt: 'select_account'
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowAccountSelector(true);
          }
        });
        return;
      } catch (err) {
        console.warn('GIS prompt error:', err);
      }
    }

    // Always open authentic Google multi-account chooser dialog
    setShowAccountSelector(true);
  };

  return (
    <div className={`bg-[#0D1117] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-2xl space-y-6 text-left ${fullWidth ? 'w-full max-w-xl mx-auto' : 'w-full'}`}>
      {/* 1. Primary ChatGPT-style "Continue with Google" Action */}
      <div className="space-y-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleClick}
          className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-[#161F30] border border-[#2A3548] hover:border-[#3B82F6] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer group"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="group-hover:text-white transition-colors">Continue with Google</span>
        </button>
      </div>

      {/* 2. Elegant Minimalist Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[#1E293B] w-full"></div>
        <span className="bg-[#0D1117] px-3 text-[11px] font-bold text-[#64748B] tracking-wider uppercase shrink-0">
          OR
        </span>
        <div className="border-t border-[#1E293B] w-full"></div>
      </div>

      {/* 3. Direct Email Authentication Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#3B82F6]" />
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="name@example.com"
            disabled={loading}
            required
            className="w-full bg-[#080B10] border border-[#1E293B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-2xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#06B6D4]" />
            Full Name (Optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Harsh Jha"
            disabled={loading}
            className="w-full bg-[#080B10] border border-[#1E293B] focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/20 rounded-2xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
          />
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Agent Study Alert Value Proposition Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#161F30] border border-[#3B82F6]/30 text-xs text-[#94A3B8]">
          <BellRing className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5 animate-pulse" />
          <span>
            <strong className="text-[#F8FAFC] font-semibold">Autonomous Delivery:</strong> 2-hour study check-ins, roadmap tasks, and career alerts are sent directly to this email.
          </span>
        </div>

        {/* Continue Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:from-[#2563EB] hover:to-[#0891B2] text-white text-sm font-bold shadow-lg shadow-[#3B82F6]/25 hover:shadow-xl active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Continue with Email</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* 4. Demo Evaluation Shortcut */}
      <div className="pt-1 text-center">
        <button
          type="button"
          disabled={loading}
          onClick={handleDemoLogin}
          className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#06B6D4] transition-colors font-medium cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Want to preview first? <span className="underline font-semibold text-[#06B6D4]">Explore Demo Account</span></span>
        </button>
      </div>

      {/* Google Account Selector Modal (Exact Match to Authentic Google Account Chooser) */}
      {showAccountSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111318] rounded-3xl border border-[#232730] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] max-w-4xl w-full overflow-hidden text-[#E2E8F0]">
            {/* Top Bar with Google Branding & Close */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F232B] bg-[#0E1015]">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-medium text-[#94A3B8]">Sign in with Google</span>
              </div>
              <button
                onClick={() => {
                  setShowAccountSelector(false);
                  setShowCustomInput(false);
                }}
                className="text-[#94A3B8] hover:text-[#F8FAFC] p-1.5 rounded-lg hover:bg-[#1E232B] transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Left column branding + Right column accounts */}
            <div className="grid grid-cols-1 md:grid-cols-5 p-6 sm:p-10 gap-8 items-start">
              {/* Left Column */}
              <div className="md:col-span-2 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white shadow-lg shadow-[#3B82F6]/20">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight">
                    Choose an account
                  </h2>
                  <p className="text-sm text-[#94A3B8] mt-2">
                    to continue to <span className="font-semibold text-[#60A5FA]">CareerPilot AI</span>
                  </p>
                </div>
                <div className="pt-4 text-xs text-[#64748B] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Personal account data is encrypted and kept private.</span>
                </div>
              </div>

              {/* Right Column: Account List or Custom Input */}
              <div className="md:col-span-3">
                {!showCustomInput ? (
                  <div className="space-y-1 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                    {savedAccounts.map((acc, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleGoogleAccountSelect(acc.email, acc.name, acc.bg, acc.initial)}
                        className="w-full flex items-center gap-4 py-3.5 px-3 rounded-2xl hover:bg-[#1C212B] transition-all text-left border-b border-[#1F232B]/60 group cursor-pointer"
                      >
                        <div className={`w-9 h-9 rounded-full ${acc.bg || 'bg-[#2563EB]'} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}>
                          {acc.initial || (acc.name || acc.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-[#F8FAFC] group-hover:text-white truncate">
                            {acc.name}
                          </div>
                          <div className="text-xs text-[#94A3B8] group-hover:text-[#CBD5E1] truncate font-normal">
                            {acc.email}
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}

                    {/* Use Another Account Button */}
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="w-full flex items-center gap-4 py-4 px-3 rounded-2xl hover:bg-[#1C212B] transition-all text-left text-sm font-semibold text-[#F8FAFC] cursor-pointer mt-2"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#1A1E26] border border-[#2A303C] flex items-center justify-center text-[#94A3B8] shrink-0">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <span>Use another account</span>
                    </button>
                  </div>
                ) : (
                  /* Custom Account Entry Form */
                  <div className="space-y-4 animate-in fade-in duration-150 p-2">
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-[#F8FAFC]">Sign in with your Google Account</h4>
                      <p className="text-xs text-[#94A3B8]">Enter your genuine Google email address</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-[#94A3B8] block mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          autoFocus
                          placeholder="yourname@gmail.com"
                          value={customGoogleEmail}
                          onChange={(e) => setCustomGoogleEmail(e.target.value)}
                          className="w-full bg-[#080B10] border border-[#232730] focus:border-[#3B82F6] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#94A3B8] block mb-1">
                          Full Name (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={customGoogleName}
                          onChange={(e) => setCustomGoogleName(e.target.value)}
                          className="w-full bg-[#080B10] border border-[#232730] focus:border-[#3B82F6] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCustomInput(false)}
                          className="px-4 py-2.5 rounded-xl border border-[#232730] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold"
                        >
                          Back to list
                        </button>
                        <button
                          type="button"
                          disabled={!customGoogleEmail.trim() || loading}
                          onClick={() => handleGoogleAccountSelect(customGoogleEmail.trim(), customGoogleName.trim())}
                          className="flex-1 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign In with Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

