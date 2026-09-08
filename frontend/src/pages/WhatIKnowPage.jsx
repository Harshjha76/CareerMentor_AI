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
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Expert</span>;
    }
    if (level === 'intermediate') {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Intermediate</span>;
    }
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Beginner</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <BrainCircuit className="w-8 h-8 text-electric-600" />
            {t('what_i_know.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('what_i_know.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-electric-600/25 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t('what_i_know.btn_add_skill')}
        </button>
      </div>

      {/* Target Company Skill Match Banner */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-50 text-electric-700 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            Target: {user?.dream_companies || 'Google, Microsoft, Amazon'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">
            {t('what_i_know.company_match_title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed">
            Based on your target role (<strong className="text-gray-800">{user?.target_role || 'Software Engineer'}</strong>), our AI analyzed your knowledge inventory against real industry hiring criteria.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-tr from-tealBrand-500 to-electric-600 text-white font-black text-2xl shadow-lg shadow-electric-500/20">
            <span>{compatibilityScore}%</span>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-gray-400">{t('what_i_know.match_score')}</div>
            <div className="text-sm font-extrabold text-emerald-600">
              {compatibilityScore >= 80 ? 'High Competitiveness' : 'Solid Foundation'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{skills.length} verified competencies</div>
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
              className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${cat.color} text-white flex items-center justify-center shadow-xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm text-gray-900">
                      {cat.label}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    {catSkills.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[120px]">
                  {catSkills.length === 0 ? (
                    <div className="text-center py-6 text-gray-300 text-xs italic">
                      No skills added in this category
                    </div>
                  ) : (
                    catSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-tealBrand-600" />
                          <span className="text-xs font-semibold text-gray-800">{skill.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getLevelBadge(skill.level)}
                          <button
                            onClick={() => removeSkill(skill.id)}
                            className="text-gray-300 hover:text-red-500 p-1 transition-colors"
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
      <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-primary-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tealBrand-500/20 text-tealBrand-300 flex items-center justify-center border border-tealBrand-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {t('what_i_know.skill_gaps_title')}
              </h3>
              <p className="text-xs text-slate-300">
                Recommended by CareerPilot AI to push your candidate profile to the top 5%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RECOMMENDED_GAPS.map((gap, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col justify-between space-y-4 hover:bg-white/10 transition-colors"
            >
              <div>
                <div className="text-[11px] text-tealBrand-300 font-bold mb-1">Estimated: {gap.duration}</div>
                <h4 className="font-extrabold text-sm text-white mb-1.5">{gap.name}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{gap.why}</p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/roadmap')}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-tealBrand-500 hover:bg-tealBrand-600 text-white font-bold text-xs shadow-sm transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900">
              {t('what_i_know.modal_title')}
            </h3>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('what_i_know.skill_name_label')}
                </label>
                <input
                  type="text"
                  required
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. TypeScript, Redis, Kubernetes, Next.js"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-electric-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('what_i_know.category_label')}
                </label>
                <select
                  value={newSkillCat}
                  onChange={(e) => setNewSkillCat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm bg-white"
                >
                  <option value="languages">{t('what_i_know.cat_languages')}</option>
                  <option value="frameworks">{t('what_i_know.cat_frameworks')}</option>
                  <option value="databases">{t('what_i_know.cat_databases')}</option>
                  <option value="tools">{t('what_i_know.cat_tools')}</option>
                  <option value="core">{t('what_i_know.cat_core')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
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
                          ? 'bg-electric-600 text-white border-electric-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
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
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white font-bold text-xs shadow-md"
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
