import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Settings,
  User,
  Globe2,
  Mail,
  Save,
  CheckCircle2,
  Loader2,
  LogOut,
  Sparkles,
  GraduationCap,
  BookOpen,
  Phone,
  Clock,
  ShieldCheck,
  Lock,
  Zap,
  ExternalLink,
  RefreshCw,
  Bell,
  Sliders
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const { t, language, changeLanguage } = useLanguage();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'email'

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [dreamCompanies, setDreamCompanies] = useState(user?.dream_companies || '');
  const [currentSkills, setCurrentSkills] = useState(user?.current_skills || '');
  const [universityName, setUniversityName] = useState(user?.university_name || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [availableMinutes, setAvailableMinutes] = useState(user?.available_study_minutes || 57);
  const [dailyHours, setDailyHours] = useState(user?.daily_study_hours || 2);
  const [selectedLang, setSelectedLang] = useState(user?.preferred_language || language || 'en');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Email Automation Settings State
  const [emailPrefs, setEmailPrefs] = useState({
    consent_granted: true,
    welcome_enabled: true,
    goal_enabled: true,
    reminder_enabled: true,
    progress_enabled: true
  });
  const [emailHistory, setEmailHistory] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [testActionLoading, setTestActionLoading] = useState(null);
  const [testActionResult, setTestActionResult] = useState(null);

  useEffect(() => {
    async function loadEmailData() {
      setLoadingPrefs(true);
      try {
        const [prefsRes, historyRes] = await Promise.all([
          api.email.getPreferences(),
          api.email.getHistory()
        ]);
        if (prefsRes.preferences) {
          setEmailPrefs({
            consent_granted: prefsRes.preferences.consent_granted !== false,
            welcome_enabled: prefsRes.preferences.welcome_enabled !== false,
            goal_enabled: prefsRes.preferences.goal_enabled !== false,
            reminder_enabled: prefsRes.preferences.reminder_enabled !== false,
            progress_enabled: prefsRes.preferences.progress_enabled !== false
          });
        }
        if (historyRes.history) {
          setEmailHistory(historyRes.history);
        }
      } catch (err) {
        console.warn('Notice loading email data:', err.message);
      } finally {
        setLoadingPrefs(false);
      }
    }
    loadEmailData();
  }, []);

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        email,
        target_role: targetRole,
        dream_companies: dreamCompanies,
        current_skills: currentSkills,
        university_name: universityName,
        branch: branch,
        phone_number: phoneNumber,
        available_study_minutes: availableMinutes,
        daily_study_hours: dailyHours,
        preferred_language: selectedLang
      });
      changeLanguage(selectedLang);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Error updating preferences: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePref = async (key) => {
    const updated = {
      ...emailPrefs,
      [key]: !emailPrefs[key]
    };
    setEmailPrefs(updated);
    setSavingPrefs(true);
    try {
      await api.email.updatePreferences(updated);
    } catch (err) {
      alert('Failed to save email preference: ' + err.message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleTriggerTest = async (type) => {
    setTestActionLoading(type);
    setTestActionResult(null);
    try {
      let res;
      if (type === 'welcome') res = await api.email.triggerWelcome();
      else if (type === 'goal') res = await api.email.triggerGoal({ goal_description: 'Master High-Availability Systems & System Design' });
      else if (type === 'inactivity') res = await api.email.triggerInactivity();
      else if (type === 'scheduler') res = await api.email.triggerScheduler();

      setTestActionResult({ type, res });
      
      // Refresh history
      const historyRes = await api.email.getHistory();
      if (historyRes.history) setEmailHistory(historyRes.history);
    } catch (err) {
      alert(`Error triggering ${type} email: ${err.message}`);
    } finally {
      setTestActionLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Settings className="w-8 h-8 text-[#3B82F6]" />
            Settings & Autonomous Agent Config
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Manage your student profile, career targets, and autonomous email accountability guardian
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#111827] border border-[#1E293B] rounded-2xl p-1.5 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-[#3B82F6] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <User className="w-4 h-4" />
            Profile & Career
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'email'
                ? 'bg-[#10B981] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email Automation
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in">
          {/* Profile Header Card */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={user?.name}
              className="w-16 h-16 rounded-full border-2 border-[#3B82F6]/50 object-cover"
            />
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-extrabold text-lg text-[#F8FAFC]">{user?.name}</div>
              <div className="text-xs text-[#94A3B8]">{user?.email}</div>
              <div className="text-[11px] font-semibold text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-md inline-block border border-[#10B981]/30">
                Connected & Verified
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-6 pt-2">
            <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#06B6D4]" />
              Career Preferences & Targets
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#06B6D4]" />
                  Notification Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#06B6D4] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  Target Engineering Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  Dream Companies
                </label>
                <input
                  type="text"
                  value={dreamCompanies}
                  onChange={(e) => setDreamCompanies(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                Current Skills (Overview)
              </label>
              <input
                type="text"
                value={currentSkills}
                onChange={(e) => setCurrentSkills(e.target.value)}
                placeholder="e.g. Java, Python, SQL, React, Node.js"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
              />
            </div>

            {/* Academic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-[#1E293B]">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#3B82F6]" />
                  University / College Name
                </label>
                <input
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Branch / Specialization
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
                />
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-2 flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-[#3B82F6]" />
                Preferred Agent Language
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SUPPORTED_LANGUAGES.map((l) => {
                  const isSelected = selectedLang === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setSelectedLang(l.code)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-[#172033] border-[#3B82F6] ring-2 ring-[#3B82F6]/30'
                          : 'bg-[#0B1220] border-[#1E293B] hover:bg-[#172033]'
                      }`}
                    >
                      <span className="text-xl block mb-1">{l.flag}</span>
                      <span className="font-bold text-sm text-[#F8FAFC] block">{l.native}</span>
                      <span className="text-[11px] text-[#94A3B8]">{l.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4">
              {savedSuccess ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
                  <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
                </span>
              ) : <div />}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-[#3B82F6]/25 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Safe Send-Only Privacy Banner */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#F8FAFC]">🔒 Safe & Send-Only Email Permission Guarantee</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-mono text-[10px]">Zero Inbox Access</span>
                </div>
                <p className="text-[#94A3B8] leading-relaxed">
                  CareerMentor AI strictly operates with <strong className="text-[#F8FAFC]">send-only access</strong>. We use your notification email (<strong className="text-[#06B6D4]">{user?.email}</strong>) solely to send you motivational study reminders, goal kickoffs, and streak recovery alerts. We never read, scan, or modify your personal emails.
                </p>
              </div>
            </div>

            {/* Master Consent Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
              <div className="space-y-0.5">
                <div className="text-sm font-extrabold text-[#F8FAFC]">Master Email Automation Switch</div>
                <div className="text-xs text-[#94A3B8]">Enable or pause all automated AI mentor notifications</div>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePref('consent_granted')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  emailPrefs.consent_granted
                    ? 'bg-[#10B981] text-white shadow-md shadow-[#10B981]/25'
                    : 'bg-[#1E293B] text-[#94A3B8]'
                }`}
              >
                {emailPrefs.consent_granted ? '🟢 Active & Allowed' : '⚪ Paused'}
              </button>
            </div>
          </div>

          {/* Granular Preference Category Toggles */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#3B82F6]" />
              Granular AI Email Triggers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Welcome */}
              <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC]">Welcome & Onboarding Emails</h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">AI greeting with your 3 key action steps</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('welcome_enabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${emailPrefs.welcome_enabled ? 'bg-[#10B981]' : 'bg-[#1E293B]'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white block absolute top-1 transition-transform ${emailPrefs.welcome_enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* 2. Goal Kickoff */}
              <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC]">Goal & Roadmap Kickoffs</h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Milestone confirmation & execution strategy</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('goal_enabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${emailPrefs.goal_enabled ? 'bg-[#10B981]' : 'bg-[#1E293B]'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white block absolute top-1 transition-transform ${emailPrefs.goal_enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* 3. Inactivity Reminders */}
              <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC]">Inactivity & Streak Recovery</h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Autonomous recovery alerts with 15-min quick win</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('reminder_enabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${emailPrefs.reminder_enabled ? 'bg-[#10B981]' : 'bg-[#1E293B]'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white block absolute top-1 transition-transform ${emailPrefs.reminder_enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* 4. Progress Celebrations */}
              <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC]">Progress & Milestone Updates</h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Celebrations when key milestones are completed</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('progress_enabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${emailPrefs.progress_enabled ? 'bg-[#10B981]' : 'bg-[#1E293B]'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white block absolute top-1 transition-transform ${emailPrefs.progress_enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 1-Click AI Test Trigger Hub */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#F59E0B]" />
              Test Automated Email Workflows (Instant AI Dispatch)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                disabled={testActionLoading !== null}
                onClick={() => handleTriggerTest('welcome')}
                className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] hover:border-[#3B82F6]/50 text-left space-y-2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3B82F6]">1. Welcome Email</span>
                  {testActionLoading === 'welcome' && <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />}
                </div>
                <p className="text-[11px] text-[#94A3B8]">Dispatches the AI onboarding greeting with target role blueprint.</p>
                <span className="inline-block text-[10px] font-bold text-[#3B82F6]">⚡ Send Test Welcome</span>
              </button>

              <button
                type="button"
                disabled={testActionLoading !== null}
                onClick={() => handleTriggerTest('goal')}
                className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] hover:border-[#10B981]/50 text-left space-y-2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#10B981]">2. Goal Confirmation</span>
                  {testActionLoading === 'goal' && <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />}
                </div>
                <p className="text-[11px] text-[#94A3B8]">Dispatches a goal kickoff strategy with actionable subtasks.</p>
                <span className="inline-block text-[10px] font-bold text-[#10B981]">⚡ Send Test Goal Email</span>
              </button>

              <button
                type="button"
                disabled={testActionLoading !== null}
                onClick={() => handleTriggerTest('inactivity')}
                className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] hover:border-[#F59E0B]/50 text-left space-y-2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F59E0B]">3. Inactivity Alert</span>
                  {testActionLoading === 'inactivity' && <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />}
                </div>
                <p className="text-[11px] text-[#94A3B8]">Dispatches an AI recovery nudge with a 15-minute quick win.</p>
                <span className="inline-block text-[10px] font-bold text-[#F59E0B]">⚡ Send Test Recovery</span>
              </button>
            </div>

            {/* Test Action Banner */}
            {testActionResult && (
              <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#10B981]/40 space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#10B981] font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{testActionResult.res.message || 'Email successfully generated and sent!'}</span>
                  </div>
                  <span className="text-[#94A3B8] font-mono text-[10px]">To: {user?.email}</span>
                </div>

                {testActionResult.res.emailResult?.previewUrl && (
                  <div className="p-3 bg-[#172033] border border-[#3B82F6]/30 rounded-xl flex items-center justify-between mt-2">
                    <span className="text-[#3B82F6] font-mono text-xs">🔗 Live Web Browser Preview Link:</span>
                    <a
                      href={testActionResult.res.emailResult.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold"
                    >
                      <span>Open Preview</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Delivery Audit & History Table */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#06B6D4]" />
                Recent Automated Email History & Audit Log
              </h3>
              <span className="text-xs text-[#94A3B8]">{emailHistory.length} recorded dispatches</span>
            </div>

            {emailHistory.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8] text-xs italic">
                No emails recorded yet. Trigger a test email above or create a goal to see live entries.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#E2E8F0]">
                  <thead className="border-b border-[#1E293B] text-[#94A3B8] uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]/60">
                    {emailHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-[#172033]/40 transition-colors">
                        <td className="py-3 px-3 font-semibold uppercase text-[10px] text-[#06B6D4]">
                          {item.email_type || 'Notification'}
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate text-[#F8FAFC]">
                          {item.subject}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'delivered'
                              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                              : 'bg-[#3B82F6]/20 text-[#3B82F6]'
                          }`}>
                            {item.status || 'delivered'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#94A3B8] whitespace-nowrap text-[11px]">
                          {new Date(item.sent_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {item.preview_url ? (
                            <a
                              href={item.preview_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3B82F6] hover:underline"
                            >
                              <span>Preview</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[#64748B] text-[10px]">Direct Inbox</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sign Out Button */}
      <div className="pt-6 border-t border-[#1E293B] flex justify-end">
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
