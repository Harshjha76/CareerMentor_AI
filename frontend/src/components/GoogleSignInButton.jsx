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
  AlertCircle
} from 'lucide-react';

export default function GoogleSignInButton({ fullWidth = false }) {
  const { loginWithEmail, loginWithDemo, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleMockGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const mockGoogleToken = 'mock_google_id_token_' + Date.now();
      const user = await loginWithGoogle(mockGoogleToken);
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

  return (
    <div className={`bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-7 shadow-2xl space-y-5 text-left ${fullWidth ? 'w-full max-w-xl mx-auto' : 'w-full'}`}>
      {/* Email Input Form */}
      <form onSubmit={handleEmailLogin} className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#3B82F6]" />
            Your Email Address (For Direct Agent Alerts)
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. yourname@gmail.com"
              disabled={loading}
              required
              className="w-full bg-[#0B1220] border border-[#1E293B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#06B6D4]" />
            Your Full Name (Optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Harsh Jha"
            disabled={loading}
            className="w-full bg-[#0B1220] border border-[#1E293B] focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/20 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
          />
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Autonomous Agent Alert Value Proposition Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#172033] border border-[#3B82F6]/30 text-xs text-[#94A3B8]">
          <BellRing className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5 animate-pulse" />
          <span>
            <strong className="text-[#F8FAFC] font-semibold">Autonomous Agent Delivery:</strong> 2-hour study reminders, learning check-ins, and career milestones will be dispatched directly to this email address.
          </span>
        </div>

        {/* Primary Continue Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:from-[#2563EB] hover:to-[#0891B2] text-white text-sm font-bold shadow-lg shadow-[#3B82F6]/25 hover:shadow-xl active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Continue with Email & Activate Agent</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Modern Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-[#1E293B] w-full"></div>
        <span className="bg-[#111827] px-3 text-[11px] font-bold text-[#64748B] tracking-wider uppercase shrink-0">
          Or Quick Access
        </span>
        <div className="border-t border-[#1E293B] w-full"></div>
      </div>

      {/* Alternative Social / Demo Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Google Sign In */}
        <button
          type="button"
          disabled={loading}
          onClick={handleMockGoogleLogin}
          className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#0B1220] border border-[#1E293B] hover:border-[#3B82F6]/50 text-[#F8FAFC] hover:bg-[#172033] text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          <span>Sign In with Google</span>
        </button>

        {/* Demo Account Access */}
        <button
          type="button"
          disabled={loading}
          onClick={handleDemoLogin}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#172033] border border-[#1E293B] hover:border-[#06B6D4]/50 text-[#06B6D4] hover:bg-[#1e2d47] text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
          <span>Explore Demo Account</span>
        </button>
      </div>
    </div>
  );
}
