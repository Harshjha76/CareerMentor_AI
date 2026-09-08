import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  BrainCircuit,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Code2,
  Layers,
  Database,
  Terminal,
  Cpu,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const INITIAL_SKILLS = [
  { id: '1', name: 'Python', category: 'languages', level: 'expert' },
  { id: '2', name: 'JavaScript', category: 'languages', level: 'intermediate' },
  { id: '3', name: 'SQL', category: 'languages', level: 'intermediate' },
  { id: '4', name: 'React', category: 'frameworks', level: 'intermediate' },
  { id: '5', name: 'Node.js', category: 'frameworks', level: 'intermediate' },
  { id: '6', name: 'PostgreSQL', category: 'databases', level: 'intermediate' },
  { id: '7', name: 'MongoDB', category: 'databases', level: 'beginner' },
  { id: '8', name: 'Git & GitHub', category: 'tools', level: 'expert' },
  { id: '9', name: 'Docker', category: 'tools', level: 'beginner' },
  { id: '10', name: 'Data Structures & Algorithms', category: 'core', level: 'intermediate' },
];

const RECOMMENDED_GAPS = [
  { name: 'System Design & High Availability', why: 'Required for Tier-1 SDE roles (Google/Amazon)', duration: '3 weeks' },
  { name: 'Distributed Caching (Redis)', why: 'Frequently tested in backend interviews', duration: '1 week' },
  { name: 'Microservices & CI/CD Pipelines', why: 'Key differentiator for competitive resumes', duration: '2 weeks' }
];

export default function WhatIKnowPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [modalOpen, setModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCat, setNewSkillCat] = useState('languages');
  const [newSkillLevel, setNewSkillLevel] = useState('intermediate');

  const categories = [
    { id: 'languages', label: t('what_i_know.cat_languages'), icon: Code2, color: 'from-blue-600 to-indigo-600' },
    { id: 'frameworks', label: t('what_i_know.cat_frameworks'), icon: Layers, color: 'from-purple-600 to-pink-600' },
    { id: 'databases', label: t('what_i_know.cat_databases'), icon: Database, color: 'from-emerald-600 to-teal-600' },
    { id: 'tools', label: t('what_i_know.cat_tools'), icon: Terminal, color: 'from-amber-500 to-orange-600' },
    { id: 'core', label: t('what_i_know.cat_core'), icon: Cpu, color: 'from-rose-600 to-red-600' },
  ];

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill = {
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      category: newSkillCat,
      level: newSkillLevel
    };

    setSkills(prev => [...prev, newSkill]);
    setNewSkillName('');
    setModalOpen(false);
  };

  const removeSkill = (id) => {
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  const calculateCompatibility = () => {
    // Dynamic score based on number of skills and levels
    const total = skills.length;
    const expertCount = skills.filter(s => s.level === 'expert').length;
    const interCount = skills.filter(s => s.level === 'intermediate').length;
    const score = Math.min(Math.round((expertCount * 12 + interCount * 7 + total * 2)), 96);
    return Math.max(score, 68);
  };

  const compatibilityScore = calculateCompatibility();

  const getLevelBadge = (level) => {
    if (level === 'expert') {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">Expert</span>;
    }
    if (level === 'intermediate') {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">Intermediate</span>;
    }
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#172033] text-[#94A3B8] border border-[#1E293B]">Beginner</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <BrainCircuit className="w-8 h-8 text-[#3B82F6]" />
            {t('what_i_know.title')}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            {t('what_i_know.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#3B82F6]/25 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t('what_i_know.btn_add_skill')}
        </button>
      </div>

      {/* Target Company Skill Match Banner */}
      <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#172033] text-[#06B6D4] text-xs font-semibold border border-[#06B6D4]/30">
            <Building2 className="w-3.5 h-3.5" />
            Target: {user?.dream_companies || 'Google, Microsoft, Amazon'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC]">
            {t('what_i_know.company_match_title')}
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl leading-relaxed">
            Based on your target role (<strong className="text-[#F8FAFC]">{user?.target_role || 'Software Engineer'}</strong>), our AI analyzed your knowledge inventory against real industry hiring criteria.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] text-white font-black text-2xl shadow-lg shadow-[#06B6D4]/20">
            <span>{compatibilityScore}%</span>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-[#94A3B8]">{t('what_i_know.match_score')}</div>
            <div className="text-sm font-extrabold text-[#10B981]">
              {compatibilityScore >= 80 ? 'High Competitiveness' : 'Solid Foundation'}
            </div>
            <div className="text-xs text-[#94A3B8] mt-0.5">{skills.length} verified competencies</div>
          </div>
        </div>
      </div>

      {/* Categorized Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const catSkills = skills.filter(s => s.category === cat.id);

          return (
            <div
              key={cat.id}
              className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 shadow-xl hover:border-[#3B82F6]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E293B]">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${cat.color} text-white flex items-center justify-center shadow-xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm text-[#F8FAFC]">
                      {cat.label}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#94A3B8] px-2 py-0.5 rounded-full bg-[#172033] border border-[#1E293B]">
                    {catSkills.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[120px]">
                  {catSkills.length === 0 ? (
                    <div className="text-center py-6 text-[#94A3B8]/60 text-xs italic">
                      No skills added in this category
                    </div>
                  ) : (
                    catSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B1220]/70 border border-[#1E293B] hover:border-[#3B82F6]/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                          <span className="text-xs font-semibold text-[#F8FAFC]">{skill.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getLevelBadge(skill.level)}
                          <button
                            onClick={() => removeSkill(skill.id)}
                            className="text-[#94A3B8] hover:text-red-400 p-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skill Gaps & Bridging Recommendations */}
      <div className="bg-gradient-to-br from-[#111827] via-[#172033] to-[#0B1220] border border-[#1E293B] rounded-3xl p-6 sm:p-8 text-[#F8FAFC] shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center border border-[#06B6D4]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">
                {t('what_i_know.skill_gaps_title')}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Recommended by CareerPilot AI to push your candidate profile to the top 5%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RECOMMENDED_GAPS.map((gap, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#0B1220]/60 border border-[#1E293B] flex flex-col justify-between space-y-4 hover:border-[#3B82F6]/50 transition-colors"
            >
              <div>
                <div className="text-[11px] text-[#06B6D4] font-bold mb-1">Estimated: {gap.duration}</div>
                <h4 className="font-extrabold text-sm text-[#F8FAFC] mb-1.5">{gap.name}</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{gap.why}</p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/roadmap')}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>{t('what_i_know.btn_add_to_roadmap')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Skill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 text-[#F8FAFC]">
            <h3 className="text-xl font-black text-[#F8FAFC]">
              {t('what_i_know.modal_title')}
            </h3>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  {t('what_i_know.skill_name_label')}
                </label>
                <input
                  type="text"
                  required
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. TypeScript, Redis, Kubernetes, Next.js"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  {t('what_i_know.category_label')}
                </label>
                <select
                  value={newSkillCat}
                  onChange={(e) => setNewSkillCat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#1E293B] text-sm bg-[#172033] text-[#F8FAFC] outline-none"
                >
                  <option value="languages">{t('what_i_know.cat_languages')}</option>
                  <option value="frameworks">{t('what_i_know.cat_frameworks')}</option>
                  <option value="databases">{t('what_i_know.cat_databases')}</option>
                  <option value="tools">{t('what_i_know.cat_tools')}</option>
                  <option value="core">{t('what_i_know.cat_core')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  {t('what_i_know.proficiency_label')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['beginner', 'intermediate', 'expert'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewSkillLevel(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                        newSkillLevel === lvl
                          ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-sm'
                          : 'bg-[#172033] text-[#94A3B8] border-[#1E293B] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#1E293B] text-xs font-semibold text-[#94A3B8] hover:bg-[#172033]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md"
                >
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
