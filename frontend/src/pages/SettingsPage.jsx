import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const { t, language, changeLanguage } = useLanguage();

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
  const [testingReminder, setTestingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);

  const handleSave = async (e) => {
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

  const handleTestReminder = async () => {
    setTestingReminder(true);
    try {
      const res = await api.reminders.sendTest();
      setReminderResult(res);
      setTimeout(() => setReminderResult(null), 8000);
    } catch (err) {
      alert('Error triggering reminder: ' + err.message);
    } finally {
      setTestingReminder(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
          <Settings className="w-8 h-8 text-[#3B82F6]" />
          {t('settings.title')}
        </h1>
        <p className="text-[#94A3B8] text-sm mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-8">
        {/* Profile Info */}
        <div>
          <h2 className="text-base font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#3B82F6]" />
            {t('settings.profile_section')}
          </h2>

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
                Google Authenticated Session
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Form */}
        <form onSubmit={handleSave} className="space-y-6 pt-4 border-t border-[#1E293B]">
          <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#06B6D4]" />
            {t('settings.pref_section')}
          </h2>

          {/* Name & Notification Email */}
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
                Autonomous Agent Notification Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#06B6D4] outline-none"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Your AI agent delivers 2-hour check-ins and study reminders to this address.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                {t('onboarding.target_role')}
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
                {t('onboarding.dream_companies')}
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
              Current Skills
            </label>
            <input
              type="text"
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
              placeholder="e.g. Python, SQL, React, Node.js"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
            />
          </div>

          {/* Academic & Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-[#1E293B]">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#3B82F6]" />
                {t('onboarding.university_name')}
              </label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                placeholder={t('onboarding.university_placeholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#3B82F6]" />
                {t('onboarding.branch')}
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder={t('onboarding.branch_placeholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#06B6D4]" />
                {t('onboarding.phone_number')}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('onboarding.phone_placeholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
              />
            </div>
          </div>

          {/* Daily Study Hours & Flexible Availability */}
          <div className="bg-[#0B1220] p-4 rounded-2xl border border-[#1E293B] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#3B82F6]" /> {t('onboarding.study_minutes_label')}
              </span>
              <span className="text-[#06B6D4] font-black">{availableMinutes} min/session ({dailyHours} hrs/day)</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[30, 45, 57, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setAvailableMinutes(mins);
                    setDailyHours(Math.max(1, Math.round(mins / 60)));
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    availableMinutes === mins
                      ? 'bg-[#3B82F6] text-white shadow-sm'
                      : 'bg-[#172033] text-[#94A3B8] border border-[#1E293B] hover:text-[#F8FAFC]'
                  }`}
                >
                  {mins} min {mins === 57 && '⚡ (Optimal)'}
                </button>
              ))}
            </div>

            <input
              type="range"
              min="15"
              max="240"
              step="5"
              value={availableMinutes}
              onChange={(e) => {
                const m = parseInt(e.target.value, 10);
                setAvailableMinutes(m);
                setDailyHours(Math.max(1, Math.round(m / 60)));
              }}
              className="w-full accent-[#3B82F6] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#94A3B8] font-semibold">
              <span>15 min</span>
              <span>57 min (Recommended)</span>
              <span>240 min</span>
            </div>
          </div>

          {/* Language Selector in Settings */}
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-2 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-[#3B82F6]" />
              {t('settings.current_language')} (Strictly 4 Supported)
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
                <CheckCircle2 className="w-4 h-4" /> Preferences saved successfully!
              </span>
            ) : <div />}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-[#3B82F6]/25 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('settings.save_btn')}
            </button>
          </div>
        </form>

        {/* Daily Reminder System Section */}
        <div className="pt-6 border-t border-[#1E293B] space-y-4">
          <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#06B6D4]" />
            {t('settings.reminder_section')}
          </h2>

          <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">
                  {t('settings.reminder_email_label')}
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  Target destination: <strong className="text-[#F8FAFC]">{user?.email}</strong>
                </p>
              </div>

              <button
                type="button"
                disabled={testingReminder}
                onClick={handleTestReminder}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-sm transition-all"
              >
                {testingReminder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                {t('settings.test_reminder_btn')}
              </button>
            </div>

            {reminderResult && (
              <div className="mt-3 p-3 rounded-xl bg-[#172033] border border-[#06B6D4]/30 text-xs text-[#F8FAFC] animate-in fade-in">
                <div className="font-bold text-[#06B6D4] mb-1">
                  ✓ Localized notification generated for [{reminderResult.language}]:
                </div>
                <div className="font-semibold text-[#F8FAFC]">Subject: {reminderResult.subject}</div>
                <div className="text-[#94A3B8] mt-1 italic">"{reminderResult.body}"</div>
              </div>
            )}
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-6 border-t border-[#1E293B] flex justify-end">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
