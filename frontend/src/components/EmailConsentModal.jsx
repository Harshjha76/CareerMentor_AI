import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Loader2,
  ExternalLink,
  X
} from 'lucide-react';

export default function EmailConsentModal({ isOpen, onClose, onGranted }) {
  const { user, updateUserLocal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleGrantConsent = async () => {
    setLoading(true);
    try {
      const res = await api.email.grantConsent();
      setResult(res);
      if (updateUserLocal) {
        updateUserLocal({ email_notifications_enabled: true, email_consent_granted_at: new Date().toISOString() });
      }
      if (onGranted) {
        onGranted(res);
      }
    } catch (err) {
      alert('Failed to grant email access: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[#111827] rounded-3xl border border-[#1E293B] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-[#F8FAFC] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-xl hover:bg-[#172033] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto border border-[#10B981]/30">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC]">
            Enable AI Email Consistency Guardian
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Let CareerMentor AI send you personalized goal kickoff strategies, roadmap tasks, and recovery nudges when you're off-track.
          </p>
        </div>

        {/* Send-Only Guarantee Box */}
        <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#3B82F6]/30 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#06B6D4] font-bold">
            <Lock className="w-4 h-4" />
            <span>🔒 Safe & Send-Only Privacy Guarantee</span>
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            CareerMentor AI <strong className="text-[#F8FAFC]">only sends</strong> study check-ins, goal updates, and streak notifications to <strong className="text-[#06B6D4]">{user?.email || 'your email'}</strong>. We <strong className="text-[#F8FAFC]">NEVER</strong> read, scan, access, or modify your personal emails.
          </p>
        </div>

        {/* What You Receive */}
        <div className="space-y-2">
          <div className="text-xs uppercase font-bold text-[#94A3B8] tracking-wider">What the AI Agent Delivers:</div>
          <div className="grid grid-cols-1 gap-2 text-xs text-[#E2E8F0]">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#172033]/60 border border-[#1E293B]">
              <Sparkles className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>Personalized welcome email with your target role strategy</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#172033]/60 border border-[#1E293B]">
              <Sparkles className="w-4 h-4 text-[#3B82F6] shrink-0" />
              <span>Goal & study plan confirmation whenever you lock in milestones</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#172033]/60 border border-[#1E293B]">
              <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span>15-minute quick win recovery alert if you miss study days</span>
            </div>
          </div>
        </div>

        {/* Result Preview if already clicked */}
        {result && (
          <div className="p-4 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 space-y-2 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-[#10B981] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Welcome email dispatched successfully!</span>
            </div>
            {result.emailResult?.previewUrl && (
              <div className="pt-2 flex justify-between items-center">
                <span className="text-[#94A3B8]">Live Browser Preview:</span>
                <a
                  href={result.emailResult.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#3B82F6] text-white font-bold"
                >
                  <span>Open Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#1E293B] text-xs font-semibold text-[#94A3B8] hover:bg-[#172033]"
          >
            {result ? 'Close' : 'Maybe Later'}
          </button>

          {!result ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleGrantConsent}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold text-xs shadow-lg shadow-[#10B981]/25 flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Allow Email Access & Get AI Welcome ⚡</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
