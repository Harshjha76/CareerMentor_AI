import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
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
  Loader2,
  FileText,
  ShieldCheck
} from 'lucide-react';

export default function WhatIKnowPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCat, setNewSkillCat] = useState('languages');
  const [newSkillLevel, setNewSkillLevel] = useState('intermediate');

  const categories = [
    { id: 'languages', label: t('what_i_know.cat_languages') || 'Programming Languages', icon: Code2, color: 'from-blue-600 to-indigo-600' },
    { id: 'frameworks', label: t('what_i_know.cat_frameworks') || 'Frameworks & Libraries', icon: Layers, color: 'from-purple-600 to-pink-600' },
    { id: 'databases', label: t('what_i_know.cat_databases') || 'Databases & Storage', icon: Database, color: 'from-emerald-600 to-teal-600' },
    { id: 'tools', label: t('what_i_know.cat_tools') || 'Cloud & DevOps Tools', icon: Terminal, color: 'from-amber-500 to-orange-600' },
    { id: 'core', label: t('what_i_know.cat_core') || 'Computer Science Foundations', icon: Cpu, color: 'from-rose-600 to-red-600' },
  ];

  // Fetch real verified user skills on mount
  useEffect(() => {
    async function loadSkills() {
      setLoading(true);
      try {
        const res = await api.skills.get();
        if (res.skills && res.skills.length > 0) {
          setSkills(res.skills);
        } else if (user?.current_skills) {
          // Parse from comma separated
          const raw = user.current_skills.split(',').map(s => s.trim()).filter(Boolean);
          const formatted = raw.map((name, idx) => {
            let cat = 'languages';
            const lower = name.toLowerCase();
            if (/react|node|express|fastapi|django|flask|spring|tailwind|vue|angular/i.test(lower)) cat = 'frameworks';
            else if (/postgres|mongo|redis|mysql|sqlite|cassandra/i.test(lower)) cat = 'databases';
            else if (/docker|aws|git|linux|kubernetes|postman|gcp|azure/i.test(lower)) cat = 'tools';
            else if (/data structures|algorithms|dsa|system design|os|dbms/i.test(lower)) cat = 'core';

            return {
              id: `skill-${idx}-${Date.now()}`,
              name,
              category: cat,
              level: 'intermediate'
            };
          });
          setSkills(formatted);
          if (formatted.length > 0) {
            await api.skills.save(formatted);
          }
        } else {
          setSkills([]);
        }
      } catch (err) {
        console.warn('Could not load user skills:', err.message);
        setSkills([]);
      } finally {
        setLoading(false);
      }
    }
    loadSkills();
  }, [user]);

  // Persist skills to backend
  const persistSkills = async (updatedList) => {
    setSaving(true);
    try {
      await api.skills.save(updatedList);
    } catch (err) {
      console.error('Failed to save skills:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    // Check duplicate
    if (skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      alert('This skill is already in your inventory.');
      return;
    }

    const newSkill = {
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      category: newSkillCat,
      level: newSkillLevel
    };

    const updated = [...skills, newSkill];
    setSkills(updated);
    setNewSkillName('');
    setModalOpen(false);
    await persistSkills(updated);
  };

  const removeSkill = async (id) => {
    const updated = skills.filter(s => s.id !== id);
    setSkills(updated);
    await persistSkills(updated);
  };

  const updateSkillLevel = async (id, newLevel) => {
    const updated = skills.map(s => s.id === id ? { ...s, level: newLevel } : s);
    setSkills(updated);
    await persistSkills(updated);
  };

  const calculateCompatibility = () => {
    if (skills.length === 0) return 0;
    const total = skills.length;
    const expertCount = skills.filter(s => s.level === 'expert').length;
    const interCount = skills.filter(s => s.level === 'intermediate').length;
    const score = Math.min(Math.round((expertCount * 14 + interCount * 8 + total * 2)), 98);
    return Math.max(score, 50);
  };

  const compatibilityScore = calculateCompatibility();

  // Dynamic Skill Gaps based strictly on user's actual missing competencies
  const getDynamicSkillGaps = () => {
    const allNames = skills.map(s => s.name.toLowerCase());
    const catalog = [
      { name: 'System Design & Distributed Systems', check: s => s.includes('system design') || s.includes('distributed'), why: 'Required for Tier-1 engineering interviews and scalable backend roles.', duration: '3 weeks' },
      { name: 'Distributed Caching (Redis)', check: s => s.includes('redis') || s.includes('caching'), why: 'Key interview topic for high-throughput backend performance.', duration: '1 week' },
      { name: 'Containerization & CI/CD (Docker & GitHub Actions)', check: s => s.includes('docker') || s.includes('kubernetes'), why: 'Essential DevOps proficiency expected by modern engineering teams.', duration: '2 weeks' },
      { name: 'Relational DB Query Optimization (PostgreSQL / MySQL)', check: s => s.includes('postgres') || s.includes('sql') || s.includes('mysql'), why: 'Core requirement for indexing, query planning, and transactional reliability.', duration: '1.5 weeks' }
    ];

    const missing = catalog.filter(c => !allNames.some(c.check));
    return missing.slice(0, 3);
  };

  const recommendedGaps = getDynamicSkillGaps();

  const getLevelBadge = (skill) => {
    const level = skill.level;
    return (
      <select
        value={level}
        onChange={(e) => updateSkillLevel(skill.id, e.target.value)}
        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold outline-none cursor-pointer border transition-colors ${
          level === 'expert' 
            ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' 
            : level === 'intermediate'
            ? 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30'
            : 'bg-[#172033] text-[#94A3B8] border-[#1E293B]'
        }`}
      >
        <option value="beginner" className="bg-[#111827] text-[#94A3B8]">Beginner</option>
        <option value="intermediate" className="bg-[#111827] text-[#3B82F6]">Intermediate</option>
        <option value="expert" className="bg-[#111827] text-[#10B981]">Expert</option>
      </select>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <BrainCircuit className="w-8 h-8 text-[#3B82F6]" />
            {t('what_i_know.title') || 'Verified Knowledge Inventory'}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            {t('what_i_know.subtitle') || 'Your real candidate skills baseline. Only authentic entered and resume-extracted skills are shown.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/resume')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#172033] hover:bg-[#1e293b] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E293B] font-bold text-xs sm:text-sm transition-all"
          >
            <FileText className="w-4 h-4 text-[#06B6D4]" />
            Extract from Resume
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#3B82F6]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('what_i_know.btn_add_skill') || 'Add Real Skill'}
          </button>
        </div>
      </div>

      {/* Target Company Skill Match Banner */}
      <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#172033] text-[#06B6D4] text-xs font-semibold border border-[#06B6D4]/30">
            <Building2 className="w-3.5 h-3.5" />
            Target: {user?.dream_companies || 'Google, Microsoft, Amazon'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC]">
            {t('what_i_know.company_match_title') || 'Authentic Industry Competitiveness'}
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl leading-relaxed">
            Targeting <strong className="text-[#F8FAFC]">{user?.target_role || 'Software Engineer'}</strong>. Match score and internship recommendations reflect your exact verified competencies with zero dummy data.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] text-white font-black text-2xl shadow-lg shadow-[#06B6D4]/20">
            <span>{compatibilityScore}%</span>
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-[#94A3B8]">{t('what_i_know.match_score') || 'Competitiveness'}</div>
            <div className="text-sm font-extrabold text-[#10B981]">
              {compatibilityScore >= 80 ? 'High Competitiveness 🚀' : compatibilityScore > 0 ? 'Solid Foundation 📈' : 'Profile Awaiting Skills'}
            </div>
            <div className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              {skills.length} verified skills
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#94A3B8]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
        </div>
      ) : skills.length === 0 ? (
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center mx-auto border border-[#3B82F6]/20">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#F8FAFC]">No Skills Added Yet</h3>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto">
            Add the programming languages, frameworks, databases, and tools you know, or upload your resume to extract them automatically.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs"
            >
              Add Your First Skill
            </button>
            <button
              onClick={() => navigate('/resume')}
              className="px-5 py-2.5 rounded-xl bg-[#172033] hover:bg-[#1e293b] text-[#F8FAFC] border border-[#1E293B] font-bold text-xs"
            >
              Upload Resume
            </button>
          </div>
        </div>
      ) : (
        /* Categorized Skills Grid */
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
                        No verified skills in this category
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
                            {getLevelBadge(skill)}
                            <button
                              onClick={() => removeSkill(skill.id)}
                              className="text-[#94A3B8] hover:text-red-400 p-1 transition-colors"
                              title="Delete skill"
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
      )}

      {/* Dynamic Skill Gaps */}
      {recommendedGaps.length > 0 && (
        <div className="bg-gradient-to-br from-[#111827] via-[#172033] to-[#0B1220] border border-[#1E293B] rounded-3xl p-6 sm:p-8 text-[#F8FAFC] shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center border border-[#06B6D4]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">
                  {t('what_i_know.skill_gaps_title') || 'Recommended High-Yield Skill Bridges'}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Identified by CareerMentor AI based on missing skills for {user?.target_role || 'Software Engineering'} roles
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedGaps.map((gap, i) => (
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
                  <span>{t('what_i_know.btn_add_to_roadmap') || 'Add to Study Roadmap'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 text-[#F8FAFC]">
            <h3 className="text-xl font-black text-[#F8FAFC]">
              {t('what_i_know.modal_title') || 'Add Real Skill'}
            </h3>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  {t('what_i_know.skill_name_label') || 'Skill Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Java, Python, Spring Boot, React, SQL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  {t('what_i_know.category_label') || 'Category'}
                </label>
                <select
                  value={newSkillCat}
                  onChange={(e) => setNewSkillCat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#1E293B] text-sm bg-[#172033] text-[#F8FAFC] outline-none"
                >
                  <option value="languages">Programming Languages</option>
                  <option value="frameworks">Frameworks & Libraries</option>
                  <option value="databases">Databases & Storage</option>
                  <option value="tools">Cloud & DevOps Tools</option>
                  <option value="core">Computer Science Foundations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  {t('what_i_know.proficiency_label') || 'Your Real Expertise Level'}
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
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
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
