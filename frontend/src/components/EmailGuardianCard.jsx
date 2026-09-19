import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Mail,
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Lock,
  Zap,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function EmailGuardianCard({ onEmailSent = null, compact = false }) {
  const { user } = useAuth();
  const [emailEnabled, setEmailEnabled] = useState(user?.email_notifications_enabled !== false);
  const [updatingPermission, setUpdatingPermission] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [permissionMsg, setPermissionMsg] = useState(null);

  const handleTogglePermission = async () => {
    setUpdatingPermission(true);
    setPermissionMsg(null);
    try {
      const nextState = !emailEnabled;
      const res = await api.reminders.updateEmailPermission(nextState);
      setEmailEnabled(nextState);
      setPermissionMsg(res.message || (nextState ? 'Email guardian enabled.' : 'Email guardian paused.'));
      setTimeout(() => setPermissionMsg(null), 4000);
    } catch (err) {
      console.error('Failed to toggle email permission:', err);
      alert('Error updating email permission: ' + err.message);
    } finally {
      setUpdatingPermission(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.reminders.sendInconsistencyNudge();
      setTestResult(res);
      if (onEmailSent) {
        onEmailSent(res);
      }
    } catch (err) {
      console.error('Failed to dispatch test email:', err);
      alert('Error dispatching test email: ' + err.message);
    } finally {
      setSendingTest(false);
    }
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-[#111C30] to-[#17243B] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">AI Email Consistency Guardian</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                emailEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {emailEnabled ? '🟢 Active (Send-Only)' : '⚪ Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sends motivational check-ins to <strong className="text-slate-200">{user?.email || 'your email'}</strong> when goals are missed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleTogglePermission}
            disabled={updatingPermission}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              emailEnabled
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
          >
            {updatingPermission ? 'Updating...' : emailEnabled ? 'Pause Email Alerts' : 'Allow Email Access'}
          </button>

          <button
            onClick={handleSendTestEmail}
            disabled={sendingTest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
          >
            {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>Test Email</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#111C30] via-[#15233C] to-[#0E182A] border border-slate-800/90 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
      {/* Header & Device Sync Flow */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Autonomous Email Guardian & Mobile Sync
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">
            Stay Accountable Across Laptop & Mobile 📱 💻
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Planning on your laptop but on the move with your phone? When you miss study streaks or fall behind on target milestones, CareerPilot AI autonomously composes a personalized, senior-mentor check-in email with immediate actionable steps and direct links to your roadmap.
          </p>
        </div>

        {/* Status Badge & Access Toggle */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 shrink-0 lg:w-72">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Access Status:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold ${
              emailEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${emailEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {emailEnabled ? 'Active (Send-Only)' : 'Access Disabled'}
            </span>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800 pt-2 font-mono truncate">
            Target: <span className="text-slate-200">{user?.email || 'Student Email'}</span>
          </div>

          <button
            onClick={handleTogglePermission}
            disabled={updatingPermission}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              emailEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30'
            }`}
          >
            {updatingPermission ? 'Updating Permissions...' : emailEnabled ? 'Pause Email Guardian' : '✅ Allow AI to Send Emails'}
          </button>
        </div>
      </div>

      {/* Permission message alert */}
      {permissionMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{permissionMsg}</span>
        </div>
      )}

      {/* Privacy Guarantee Banner (Addressing User Requirement) */}
      <div className="bg-slate-900/80 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>🔒 Safe & Send-Only Access Guarantee</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono">Zero Inbox Access</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            CareerPilot AI <strong>only has permission to send</strong> motivational study alerts and direct goal action links to your inbox. We <strong>NEVER</strong> read, scan, search, or alter your personal emails or account messages.
          </p>
        </div>
      </div>

      {/* Device Automation Infographic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Laptop className="w-4 h-4" />
          </div>
          <h5 className="text-xs font-bold text-white">1. Plan & Code on Laptop</h5>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Set your study schedule, roadmap tasks, and internship prep milestones during your laptop deep-work sessions.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h5 className="text-xs font-bold text-white">2. Autonomous AI Detection</h5>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            If you miss a study milestone for &gt;24 hours, the AI Accountability Engine diagnoses the bottleneck.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <h5 className="text-xs font-bold text-white">3. Direct Nudge on Mobile</h5>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Receive a warm, real-feel email on your phone with a 15-minute quick win and direct 1-click links.
          </p>
        </div>
      </div>

      {/* Action Footer: Test Email Dispatch */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Integrated with standard SMTP, Gmail & Resend API</span>
        </div>

        <button
          onClick={handleSendTestEmail}
          disabled={sendingTest || !emailEnabled}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 disabled:opacity-40 transition-all"
        >
          {sendingTest ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching Real-Feel AI Email...
            </>
          ) : (
            <>
              <Mail className="w-3.5 h-3.5" /> Send AI Inconsistency Nudge Email Now ⚡
            </>
          )}
        </button>
      </div>

      {/* Test Email Dispatch Live Preview */}
      {testResult && (
        <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Email Successfully Dispatched to {testResult.recipient}</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {new Date(testResult.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* If Ethereal test account returned live web preview link */}
          {testResult.emailResult?.previewUrl && (
            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg flex items-center justify-between">
              <span className="text-xs text-blue-300 font-mono">
                🔗 Live Web Email Preview Generated:
              </span>
              <a
                href={testResult.emailResult.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
              >
                <span>View Email in Browser</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {testResult.nudge && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2 text-xs font-mono text-slate-300">
              <div className="font-bold text-white">Subject: {testResult.nudge.subject}</div>
              <p className="text-amber-400">⚠️ {testResult.nudge.inconsistency_diagnosis}</p>
              <p className="text-slate-300">{testResult.nudge.motivation_message}</p>
              <p className="text-emerald-400 font-bold">⚡ Quick Action Step: {testResult.nudge.quick_action_step}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
