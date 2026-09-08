import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import {
  Briefcase,
  Building2,
  Code2,
  Clock,
  Globe2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  GraduationCap,
  Phone,
  BookOpen,
  Mail
} from 'lucide-react';

const COMMON_SKILLS = [
  'Python', 'Java', 'C++', 'JavaScript', 'TypeScript',
  'React', 'Node.js', 'SQL', 'MongoDB', 'Data Structures & Algorithms',
  'System Design', 'Machine Learning', 'Cloud / AWS', 'Git & GitHub',
  'DevOps / Docker', 'Cybersecurity', 'Communication Skills'
];

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [targetRole, setTargetRole] = useState(user?.target_role || 'Software Engineer');
  const [dreamCompanies, setDreamCompanies] = useState(user?.dream_companies || 'Google, Microsoft, TCS, Infosys');
  const [universityName, setUniversityName] = useState(user?.university_name || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [availableMinutes, setAvailableMinutes] = useState(user?.available_study_minutes || 57);
  const [selectedSkills, setSelectedSkills] = useState(
    user?.current_skills ? user.current_skills.split(',').map(s => s.trim()) : ['Python', 'SQL', 'Data Structures & Algorithms']
  );
  const [dailyHours, setDailyHours] = useState(user?.daily_study_hours || 2);
  const [preferredLang, setPreferredLang] = useState(user?.preferred_language || language || 'en');

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleLanguageChange = (code) => {
    setPreferredLang(code);
    changeLanguage(code);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        target_role: targetRole,
        dream_companies: dreamCompanies,
        university_name: universityName,
        branch: branch,
        phone_number: phoneNumber,
        available_study_minutes: availableMinutes,
        current_skills: selectedSkills,
        daily_study_hours: dailyHours,
        preferred_language: preferredLang
      });
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to save profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 selection:bg-[#3B82F6] selection:text-white">
      <div className="max-w-2xl w-full bg-[#111827] rounded-3xl border border-[#1E293B] shadow-2xl overflow-hidden">
        {/* Header with Progress Bar */}
        <div className="bg-gradient-to-r from-[#111827] via-[#172033] to-[#0B1220] border-b border-[#1E293B] p-6 sm:p-8 text-[#F8FAFC] relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#06B6D4]" />
              <span className="text-xs uppercase tracking-widest font-bold text-[#06B6D4]">
                Onboarding Questionnaire
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#172033] text-[#F8FAFC] border border-[#1E293B]">
              Step {step} of 3
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mb-1 text-[#F8FAFC]">
            {t('onboarding.title')}
          </h2>
          <p className="text-[#94A3B8] text-xs sm:text-sm">
            {t('onboarding.subtitle')}
          </p>

          {/* Stepper bar */}
          <div className="w-full bg-[#0B1220] h-1.5 rounded-full mt-6 overflow-hidden border border-[#1E293B]">
            <div
              className="h-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] transition-all duration-300 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC] mb-1 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#3B82F6]" />
                  {t('onboarding.step1_title')}
                </h3>
                <p className="text-xs text-[#94A3B8]">Define your primary career target, college background, and contact info.</p>
                {user?.email && (
                  <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#172033] border border-[#3B82F6]/30 text-xs text-[#06B6D4]">
                    <Mail className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Agent notifications linked to: <strong className="text-[#F8FAFC] font-semibold">{user.email}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  {t('onboarding.target_role')}
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder={t('onboarding.target_role_placeholder')}
                  className="w-full px-4 py-3 rounded-xl border border-[#1E293B] bg-[#172033] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#F8FAFC] outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                  {t('onboarding.dream_companies')}
                </label>
                <input
                  type="text"
                  value={dreamCompanies}
                  onChange={(e) => setDreamCompanies(e.target.value)}
                  placeholder={t('onboarding.dream_companies_placeholder')}
                  className="w-full px-4 py-3 rounded-xl border border-[#1E293B] bg-[#172033] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#F8FAFC] outline-none text-sm transition-all"
                />
                <p className="text-xs text-[#94A3B8] mt-1.5">Separate multiple companies with commas.</p>
              </div>

              {/* College, Branch, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#1E293B]">
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
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC] mb-1 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-[#3B82F6]" />
                  {t('onboarding.step2_title')}
                </h3>
                <p className="text-xs text-[#94A3B8]">{t('onboarding.skills_label')}</p>
              </div>

              <div className="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto pr-1">
                {COMMON_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-sm'
                          : 'bg-[#172033] text-[#94A3B8] border-[#1E293B] hover:text-[#F8FAFC] hover:border-[#3B82F6]/40'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {skill}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[#94A3B8]">
                Selected: <span className="font-bold text-[#06B6D4]">{selectedSkills.length} skills</span>
              </p>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC] mb-1 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#3B82F6]" />
                  {t('onboarding.step3_title')}
                </h3>
                <p className="text-xs text-[#94A3B8]">Personalize your study rhythm and mentorship language.</p>
              </div>

              {/* Study Hours & Flexible Availability */}
              <div className="bg-[#0B1220] p-5 rounded-2xl border border-[#1E293B] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#F8FAFC]">
                    {t('onboarding.study_minutes_label')}
                  </span>
                  <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/30 text-[#3B82F6] font-extrabold text-sm rounded-lg">
                    {availableMinutes} Minutes ({Math.round((availableMinutes / 60) * 10) / 10} hrs)
                  </span>
                </div>

                {/* Flexible availability buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[30, 45, 57, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setAvailableMinutes(mins);
                        setDailyHours(Math.max(1, Math.round(mins / 60)));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        availableMinutes === mins
                          ? 'bg-[#3B82F6] text-white shadow-sm ring-2 ring-[#3B82F6]/30'
                          : 'bg-[#172033] text-[#94A3B8] border border-[#1E293B] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {mins} min {mins === 57 && '⚡ (Optimal)'}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
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
                  <div className="flex justify-between text-[11px] text-[#94A3B8] font-semibold mt-1">
                    <span>15 min</span>
                    <span>57 min (Recommended)</span>
                    <span>4 hours (240 min)</span>
                  </div>
                </div>
              </div>

              {/* Language Selection Grid */}
              <div>
                <label className="block text-sm font-bold text-[#F8FAFC] mb-1.5 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-[#3B82F6]" />
                  {t('onboarding.language_label')}
                </label>
                <p className="text-xs text-[#94A3B8] mb-3">
                  {t('onboarding.language_hint')}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = preferredLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[#172033] border-[#3B82F6] ring-2 ring-[#3B82F6]/30 shadow-sm'
                            : 'bg-[#0B1220] border-[#1E293B] hover:bg-[#172033]'
                        }`}
                      >
                        <div className="text-xl mb-1">{lang.flag}</div>
                        <div className="font-bold text-sm text-[#F8FAFC]">{lang.native}</div>
                        <div className="text-xs text-[#94A3B8]">{lang.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1E293B]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172033] text-sm font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t('onboarding.btn_back')}
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold shadow-md shadow-[#3B82F6]/20 transition-all ml-auto"
              >
                {t('onboarding.btn_next')} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 text-white text-sm font-bold shadow-lg shadow-[#3B82F6]/25 transition-all ml-auto"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {t('onboarding.btn_complete')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
