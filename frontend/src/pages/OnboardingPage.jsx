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
  Loader2
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 selection:bg-electric-500 selection:text-white">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
        {/* Header with Progress Bar */}
        <div className="bg-gradient-to-r from-primary-900 via-electric-800 to-primary-900 p-6 sm:p-8 text-white relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-tealBrand-300" />
              <span className="text-xs uppercase tracking-widest font-bold text-tealBrand-200">
                Onboarding Questionnaire
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/15">
              Step {step} of 3
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mb-1">
            {t('onboarding.title')}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            {t('onboarding.subtitle')}
          </p>

          {/* Stepper bar */}
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-tealBrand-400 transition-all duration-300 ease-out"
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
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-electric-600" />
                  {t('onboarding.step1_title')}
                </h3>
                <p className="text-xs text-gray-500">Define your primary career target and aspiration goals.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('onboarding.target_role')}
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder={t('onboarding.target_role_placeholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 text-gray-900 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('onboarding.dream_companies')}
                </label>
                <input
                  type="text"
                  value={dreamCompanies}
                  onChange={(e) => setDreamCompanies(e.target.value)}
                  placeholder={t('onboarding.dream_companies_placeholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 text-gray-900 outline-none text-sm transition-all"
                />
                <p className="text-xs text-gray-400 mt-1.5">Separate multiple companies with commas.</p>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-electric-600" />
                  {t('onboarding.step2_title')}
                </h3>
                <p className="text-xs text-gray-500">{t('onboarding.skills_label')}</p>
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
                          ? 'bg-electric-600 text-white border-electric-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-electric-400 hover:bg-electric-50/50'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {skill}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500">
                Selected: <span className="font-bold text-electric-700">{selectedSkills.length} skills</span>
              </p>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-electric-600" />
                  {t('onboarding.step3_title')}
                </h3>
                <p className="text-xs text-gray-500">Personalize your study rhythm and mentorship language.</p>
              </div>

              {/* Study Hours Slider */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">
                    {t('onboarding.hours_label')}
                  </span>
                  <span className="px-3 py-1 bg-electric-100 text-electric-800 font-extrabold text-sm rounded-lg">
                    {dailyHours} {t('onboarding.hours_suffix')}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseInt(e.target.value, 10))}
                  className="w-full accent-electric-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-semibold">
                  <span>1 Hour</span>
                  <span>4 Hours</span>
                  <span>8 Hours</span>
                </div>
              </div>

              {/* Language Selection Grid (English, Hindi, Marathi, Sanskrit) */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-electric-600" />
                  {t('onboarding.language_label')}
                </label>
                <p className="text-xs text-gray-500 mb-3">
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
                            ? 'bg-electric-50/80 border-electric-600 ring-2 ring-electric-600/30 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-xl mb-1">{lang.flag}</div>
                        <div className="font-bold text-sm text-gray-900">{lang.native}</div>
                        <div className="text-xs text-gray-500">{lang.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t('onboarding.btn_back')}
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white text-sm font-semibold shadow-md shadow-electric-600/20 transition-all ml-auto"
              >
                {t('onboarding.btn_next')} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-tealBrand-600 to-electric-600 hover:from-tealBrand-500 hover:to-electric-500 text-white text-sm font-bold shadow-lg shadow-electric-600/25 transition-all ml-auto"
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
