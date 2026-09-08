import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  FileText,
  Map,
  Calendar,
  MessageSquare,
  Target,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  BrainCircuit,
  Zap,
  TrendingUp,
  AlertCircle,
  Activity,
  Bell
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [resumeScore, setResumeScore] = useState(88);
  const [roadmaps, setRoadmaps] = useState([]);
  const [plannerTasks, setPlannerTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentNotification, setAgentNotification] = useState(null);
  const [triggeringCheckin, setTriggeringCheckin] = useState(false);

  // Flexible Availability & Interactive Charts State
  const [availableMinutes, setAvailableMinutes] = useState(user?.available_study_minutes || 57);
  const [hoveredStudyIndex, setHoveredStudyIndex] = useState(null);
  const [hoveredGapIndex, setHoveredGapIndex] = useState(null);
  const [customMinsInput, setCustomMinsInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelectMinutes = async (mins) => {
    const val = parseInt(mins, 10);
    if (!val || val <= 0) return;
    setAvailableMinutes(val);
    setShowCustomInput(false);
    try {
      await api.auth.updateProfile({ available_study_minutes: val });
    } catch (e) {
      console.warn('Failed to save study minutes:', e);
    }
  };

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [resumeRes, roadmapsRes, plannerRes, goalsRes] = await Promise.all([
          api.resume.getLatest().catch(() => ({ resume: null })),
          api.roadmap.getAll().catch(() => ({ roadmaps: [] })),
          api.planner.get('weekly').catch(() => ({ tasks: [] })),
          api.goals.getAll().catch(() => ({ goals: [] }))
        ]);

        if (resumeRes.resume) {
          setResumeScore(resumeRes.resume.score);
        }

        setRoadmaps(roadmapsRes.roadmaps || []);
        setPlannerTasks(plannerRes.tasks || []);
        setGoals(goalsRes.goals || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleTrigger2hCheckin = async () => {
    setTriggeringCheckin(true);
    try {
      const res = await api.reminders.checkin2h();
      setAgentNotification(res);
      setTimeout(() => setAgentNotification(null), 8000);
    } catch (err) {
      alert('Failed to trigger check-in: ' + err.message);
    } finally {
      setTriggeringCheckin(false);
    }
  };

  const togglePlannerTask = async (taskId) => {
    const updated = plannerTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, is_completed: !task.is_completed, status: !task.is_completed ? 'completed' : 'pending' };
      }
      return task;
    });
    setPlannerTasks(updated);
    try {
      await api.planner.saveTasks(updated);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const pendingTasksCount = plannerTasks.filter(t => !t.is_completed).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 2-Hour Autonomous Agent Toast Alert */}
      {agentNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-white rounded-3xl border-2 border-electric-500 shadow-2xl p-5 animate-in slide-in-from-top-6 duration-300">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-900 to-electric-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-electric-100 text-electric-800">
                  Autonomous Agent Alert
                </span>
                <span className="text-[10px] text-gray-400">Just now</span>
              </div>
              <h4 className="font-extrabold text-sm text-gray-900">{agentNotification.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{agentNotification.body}</p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => navigate('/planner')}
                  className="px-3 py-1.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white text-xs font-bold shadow-xs"
                >
                  View Remaining Tasks →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-900 via-electric-900 to-primary-950 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-tealBrand-300 text-xs font-bold border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              Target: {user?.target_role || 'Software Engineer'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              {t('dashboard.agent_active')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            {t('dashboard.welcome')}, {user?.name || 'Aarav'}! 👋
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
            {t('dashboard.subheading')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTrigger2hCheckin}
              disabled={triggeringCheckin}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tealBrand-500 hover:bg-tealBrand-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-tealBrand-500/25 transition-all"
            >
              <Bell className="w-4 h-4" />
              {t('dashboard.btn_trigger_checkin')}
            </button>
            <Link
              to="/what-i-know"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-sm transition-all"
            >
              <BrainCircuit className="w-4 h-4 text-purple-300" />
              {t('dashboard.action_what_i_know')}
            </Link>
          </div>
        </div>

        {/* Decorative circle shapes */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-electric-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-32 top-0 w-48 h-48 bg-tealBrand-400/20 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* CORE FEATURE MODULES GRID (Directly Below Title as requested!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Module 1: Career Chatbot */}
        <Link
          to="/chat"
          className="group p-5 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-electric-400 transition-all hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-gray-900 group-hover:text-electric-700 transition-colors">
              Career Chatbot
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              24/7 ChatGPT & Claude-level career counseling & mock prep.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-electric-600 group-hover:translate-x-1 transition-transform">
            Start Chatting <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 2: Resume Analyzer */}
        <Link
          to="/resume"
          className="group p-5 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-gray-900 group-hover:text-blue-700 transition-colors">
              Resume Analyzer
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Deep details extraction & instant ATS scoring out of 100.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            Analyze Resume <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 3: Learning Roadmap */}
        <Link
          to="/roadmap"
          className="group p-5 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-400 transition-all hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-gray-900 group-hover:text-purple-700 transition-colors">
              Smart Roadmap
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Personalized week-by-week curriculum with curated resources.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
            View Curriculum <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 4: AI Planner (Human + AI) */}
        <Link
          to="/planner"
          className="group p-5 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-teal-400 transition-all hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-gray-900 group-hover:text-teal-700 transition-colors">
              AI Planner
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Co-planning: get pros & cons with 1-click AI schedule refinement.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
            Plan Schedule <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 5: What I Know */}
        <Link
          to="/what-i-know"
          className="group p-5 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-rose-400 transition-all hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-gray-900 group-hover:text-rose-700 transition-colors">
              What I Know
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Verified skill vault & dream company compatibility assessment.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform">
            Explore Vault <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* DEDICATED COMPARTMENT: WHAT I KNOW & SKILLS VAULT (Prominently below title & launchpad) */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-purple-50/40 rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-tealBrand-500 animate-ping"></span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700">
                Knowledge Vault & Skill Gap Compartment
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              What I Know vs What I Need To Know
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Live skill alignment for <span className="font-bold text-gray-800">{user?.target_role || 'Software Engineer'}</span> at <span className="font-bold text-gray-800">{user?.dream_companies || 'Google, Microsoft'}</span>.
            </p>
          </div>

          <Link
            to="/what-i-know"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02]"
          >
            <BrainCircuit className="w-4 h-4" />
            Manage Full Vault →
          </Link>
        </div>

        {/* Skill Matrix Breakdown Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mastered Skills Preview */}
          <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                What I Know (Mastered • 68%)
              </h4>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Verified
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Proficiencies proven in previous projects and verified ATS assessments:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Python', 'JavaScript', 'React.js', 'Node.js', 'PostgreSQL', 'Git & GitHub', 'REST APIs'].map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/60"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Target Gap Skills Preview */}
          <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                What I Need To Know (Target Gap • 32%)
              </h4>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                Tier-1 Required
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Priority gaps to bridge for technical interviews at {user?.dream_companies || 'Google, Microsoft'}:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['System Design & Architecture', 'Redis Caching & Pub/Sub', 'Docker & CI/CD Pipelines', 'Dynamic Programming on Trees'].map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200/60"
                >
                  ⚡ {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* REALISTIC INTERACTIVE PIE CHARTS & VISUAL ANALYTICS WITH CURSOR HOVER TOOLTIP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart 1: Study Time Allocation with Flexible Availability Selector */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-electric-600" />
                Study Time Allocation
              </h3>
              <p className="text-xs text-gray-500">
                Current availability: <span className="font-bold text-electric-700">{availableMinutes} mins/day</span>
              </p>
            </div>

            {/* Quick Availability Pills (30m, 45m, 57m, 90m, Custom) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              {[30, 45, 57, 90].map((m) => (
                <button
                  key={m}
                  onClick={() => handleSelectMinutes(m)}
                  className={`px-2.5 py-1 rounded-xl transition-all ${
                    availableMinutes === m
                      ? 'bg-white text-electric-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {m}m
                </button>
              ))}
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`px-2 py-1 rounded-xl transition-all ${
                  ![30, 45, 57, 90].includes(availableMinutes)
                    ? 'bg-white text-electric-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {showCustomInput && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-gray-200">
              <span className="text-xs text-gray-600 font-medium">Set daily study time:</span>
              <input
                type="number"
                min="10"
                max="600"
                value={customMinsInput}
                onChange={(e) => setCustomMinsInput(e.target.value)}
                placeholder="e.g. 57"
                className="w-20 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 outline-none"
              />
              <button
                onClick={() => {
                  if (customMinsInput) handleSelectMinutes(customMinsInput);
                }}
                className="px-3 py-1 bg-electric-600 text-white rounded-lg text-xs font-bold hover:bg-electric-700"
              >
                Apply
              </button>
            </div>
          )}

          {/* SVG Pie Chart with Cursor Hover */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* DSA 45% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#7C3AED"
                  strokeWidth={hoveredStudyIndex === 0 ? "6" : "4.5"}
                  strokeDasharray="45 55"
                  strokeDashoffset="0"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredStudyIndex(0)}
                  onMouseLeave={() => setHoveredStudyIndex(null)}
                />
                {/* Web Dev & APIs 25% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#14B8A6"
                  strokeWidth={hoveredStudyIndex === 1 ? "6" : "4.5"}
                  strokeDasharray="25 75"
                  strokeDashoffset="-45"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredStudyIndex(1)}
                  onMouseLeave={() => setHoveredStudyIndex(null)}
                />
                {/* System Design 15% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth={hoveredStudyIndex === 2 ? "6" : "4.5"}
                  strokeDasharray="15 85"
                  strokeDashoffset="-70"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredStudyIndex(2)}
                  onMouseLeave={() => setHoveredStudyIndex(null)}
                />
                {/* Core CS Theory 15% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth={hoveredStudyIndex === 3 ? "6" : "4.5"}
                  strokeDasharray="15 85"
                  strokeDashoffset="-85"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredStudyIndex(3)}
                  onMouseLeave={() => setHoveredStudyIndex(null)}
                />
              </svg>

              {/* Dynamic Center Tooltip on Hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                {hoveredStudyIndex === 0 && (
                  <>
                    <span className="text-xs font-extrabold text-[#7C3AED]">DSA Mastery</span>
                    <span className="text-xl font-black text-gray-900">{Math.round(availableMinutes * 0.45)} mins</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">45% of time</span>
                  </>
                )}
                {hoveredStudyIndex === 1 && (
                  <>
                    <span className="text-xs font-extrabold text-[#14B8A6]">Projects & APIs</span>
                    <span className="text-xl font-black text-gray-900">{Math.round(availableMinutes * 0.25)} mins</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">25% of time</span>
                  </>
                )}
                {hoveredStudyIndex === 2 && (
                  <>
                    <span className="text-xs font-extrabold text-[#F59E0B]">System Design</span>
                    <span className="text-xl font-black text-gray-900">{Math.round(availableMinutes * 0.15)} mins</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">15% of time</span>
                  </>
                )}
                {hoveredStudyIndex === 3 && (
                  <>
                    <span className="text-xs font-extrabold text-[#3B82F6]">CS Core & OS</span>
                    <span className="text-xl font-black text-gray-900">{Math.round(availableMinutes * 0.15)} mins</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">15% of time</span>
                  </>
                )}
                {hoveredStudyIndex === null && (
                  <>
                    <span className="text-2xl font-black text-gray-900">{availableMinutes}m</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Hover slice</span>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Legend with Cursor Hover */}
            <div className="space-y-2.5 w-full sm:w-auto text-xs">
              <div
                onMouseEnter={() => setHoveredStudyIndex(0)}
                onMouseLeave={() => setHoveredStudyIndex(null)}
                className={`flex items-center justify-between sm:justify-start gap-4 p-2 rounded-xl cursor-pointer transition-all ${
                  hoveredStudyIndex === 0 ? 'bg-purple-50 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#7C3AED]"></span>
                  <span className="font-semibold text-gray-800">Algorithms & DSA</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900">{Math.round(availableMinutes * 0.45)}m</span>
                  <span className="text-[10px] text-gray-400 ml-1.5">(45%)</span>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredStudyIndex(1)}
                onMouseLeave={() => setHoveredStudyIndex(null)}
                className={`flex items-center justify-between sm:justify-start gap-4 p-2 rounded-xl cursor-pointer transition-all ${
                  hoveredStudyIndex === 1 ? 'bg-teal-50 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#14B8A6]"></span>
                  <span className="font-semibold text-gray-800">Projects & APIs</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900">{Math.round(availableMinutes * 0.25)}m</span>
                  <span className="text-[10px] text-gray-400 ml-1.5">(25%)</span>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredStudyIndex(2)}
                onMouseLeave={() => setHoveredStudyIndex(null)}
                className={`flex items-center justify-between sm:justify-start gap-4 p-2 rounded-xl cursor-pointer transition-all ${
                  hoveredStudyIndex === 2 ? 'bg-amber-50 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                  <span className="font-semibold text-gray-800">System Design</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900">{Math.round(availableMinutes * 0.15)}m</span>
                  <span className="text-[10px] text-gray-400 ml-1.5">(15%)</span>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredStudyIndex(3)}
                onMouseLeave={() => setHoveredStudyIndex(null)}
                className={`flex items-center justify-between sm:justify-start gap-4 p-2 rounded-xl cursor-pointer transition-all ${
                  hoveredStudyIndex === 3 ? 'bg-blue-50 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span>
                  <span className="font-semibold text-gray-800">Core CS (OS/DBMS)</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900">{Math.round(availableMinutes * 0.15)}m</span>
                  <span className="text-[10px] text-gray-400 ml-1.5">(15%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart 2: "What I Know vs What I Need to Know" Interactive Donut Chart */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-600" />
                Knowledge Gap Analysis
              </h3>
              <p className="text-xs text-gray-500">
                What I Know vs What I Need for {user?.dream_companies?.split(',')[0] || 'Google'}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800">
              68% Compatible
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* SVG Donut with Hover */}
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* What I Know 68% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth={hoveredGapIndex === 0 ? "6.5" : "4.5"}
                  strokeDasharray="68 32"
                  strokeDashoffset="0"
                  className="cursor-pointer transition-all duration-200 hover:opacity-95"
                  onMouseEnter={() => setHoveredGapIndex(0)}
                  onMouseLeave={() => setHoveredGapIndex(null)}
                />
                {/* What I Need to Know 32% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth={hoveredGapIndex === 1 ? "6.5" : "4.5"}
                  strokeDasharray="32 68"
                  strokeDashoffset="-68"
                  className="cursor-pointer transition-all duration-200 hover:opacity-95"
                  onMouseEnter={() => setHoveredGapIndex(1)}
                  onMouseLeave={() => setHoveredGapIndex(null)}
                />
              </svg>

              {/* Dynamic Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                {hoveredGapIndex === 0 && (
                  <>
                    <span className="text-xs font-extrabold text-[#10B981]">Mastered Skills</span>
                    <span className="text-2xl font-black text-gray-900">68%</span>
                    <span className="text-[10px] text-gray-400">7 Verified</span>
                  </>
                )}
                {hoveredGapIndex === 1 && (
                  <>
                    <span className="text-xs font-extrabold text-[#F59E0B]">Missing Gaps</span>
                    <span className="text-2xl font-black text-gray-900">32%</span>
                    <span className="text-[10px] text-gray-400">4 Gaps to Bridge</span>
                  </>
                )}
                {hoveredGapIndex === null && (
                  <>
                    <span className="text-2xl font-black text-gray-900">68%</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Role Match</span>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Legend */}
            <div className="space-y-3 w-full sm:w-auto text-xs">
              <div
                onMouseEnter={() => setHoveredGapIndex(0)}
                onMouseLeave={() => setHoveredGapIndex(null)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  hoveredGapIndex === 0
                    ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                    : 'bg-white border-gray-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                    <span className="font-bold text-gray-900">What I Know</span>
                  </div>
                  <span className="font-black text-emerald-700">68%</span>
                </div>
                <div className="text-[11px] text-gray-500">
                  Python, React, Node.js, SQL, Git & APIs
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredGapIndex(1)}
                onMouseLeave={() => setHoveredGapIndex(null)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  hoveredGapIndex === 1
                    ? 'bg-amber-50 border-amber-300 shadow-xs'
                    : 'bg-white border-gray-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                    <span className="font-bold text-gray-900">What I Need To Know</span>
                  </div>
                  <span className="font-black text-amber-700">32%</span>
                </div>
                <div className="text-[11px] text-gray-500">
                  System Design, Redis, Docker, DP Algorithms
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule & Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1 & 2: Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-50 text-electric-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {t('dashboard.today_schedule')}
                </h2>
                <p className="text-xs text-gray-500">Synchronized with your active roadmaps and study plan</p>
              </div>
            </div>

            <Link
              to="/planner"
              className="text-xs font-semibold text-electric-600 hover:text-electric-700 flex items-center gap-1"
            >
              Full Planner <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {plannerTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                onClick={() => togglePlannerTask(task.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  task.is_completed
                    ? 'bg-emerald-50/60 border-emerald-200 text-gray-500'
                    : 'bg-white border-gray-200 hover:border-electric-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!task.is_completed}
                  onChange={() => {}}
                  className="mt-1 w-4 h-4 rounded text-electric-600 accent-electric-600 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {task.time || '18:00 - 20:00'}
                    </span>
                    {task.is_ai_suggested && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-electric-100 text-electric-700">
                        AI Plan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Active Goals */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-tealBrand-600" />
              {t('dashboard.active_goals_title')}
            </h3>
            <Link to="/goals" className="text-xs text-electric-600 hover:underline font-semibold">
              Manage
            </Link>
          </div>

          <div className="space-y-4">
            {goals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                    {goal.goal_description}
                  </span>
                  <span className="font-bold text-electric-700">
                    {goal.progress_percentage || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-tealBrand-500 to-electric-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress_percentage || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/goals"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold transition-colors"
            >
              + Add New Career Milestone
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
