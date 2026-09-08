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

      {/* REALISTIC PIE CHARTS & VISUAL ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart 1: Study Time Allocation */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-electric-600" />
              {t('dashboard.chart_study_time')}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Active Sprint
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* SVG Pie Chart */}
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* DSA 45% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#7C3AED"
                  strokeWidth="4"
                  strokeDasharray="45 55"
                  strokeDashoffset="0"
                />
                {/* Web Dev & APIs 25% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#14B8A6"
                  strokeWidth="4"
                  strokeDasharray="25 75"
                  strokeDashoffset="-45"
                />
                {/* System Design 15% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="4"
                  strokeDasharray="15 85"
                  strokeDashoffset="-70"
                />
                {/* Core CS Theory 15% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth="4"
                  strokeDasharray="15 85"
                  strokeDashoffset="-85"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-gray-900">100%</span>
                <span className="text-[10px] uppercase font-bold text-gray-400">Pacing</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 w-full sm:w-auto text-xs">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#7C3AED]"></span>
                  <span className="font-semibold text-gray-800">Algorithms & DSA</span>
                </div>
                <span className="font-bold text-gray-900">45%</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#14B8A6]"></span>
                  <span className="font-semibold text-gray-800">Projects & APIs</span>
                </div>
                <span className="font-bold text-gray-900">25%</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                  <span className="font-semibold text-gray-800">System Design</span>
                </div>
                <span className="font-bold text-gray-900">15%</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span>
                  <span className="font-semibold text-gray-800">Core CS (OS/DBMS)</span>
                </div>
                <span className="font-bold text-gray-900">15%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart 2: Target Role Skill Readiness */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-tealBrand-600" />
              {t('dashboard.chart_skill_readiness')}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800">
              Tier-1 Ready
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* SVG Pie Chart */}
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Languages 35% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeDasharray="35 65"
                  strokeDashoffset="0"
                />
                {/* Frameworks 30% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth="4"
                  strokeDasharray="30 70"
                  strokeDashoffset="-35"
                />
                {/* Databases 20% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#6366F1"
                  strokeWidth="4"
                  strokeDasharray="20 80"
                  strokeDashoffset="-65"
                />
                {/* Architecture 15% */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="transparent"
                  stroke="#EC4899"
                  strokeWidth="4"
                  strokeDasharray="15 85"
                  strokeDashoffset="-85"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-gray-900">82%</span>
                <span className="text-[10px] uppercase font-bold text-gray-400">Match</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 w-full sm:w-auto text-xs">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                  <span className="font-semibold text-gray-800">Programming (Python/JS)</span>
                </div>
                <span className="font-bold text-gray-900">35%</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span>
                  <span className="font-semibold text-gray-800">Frameworks (React/Node)</span>
                </div>
                <span className="font-bold text-gray-900">30%</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#6366F1]"></span>
                  <span className="font-semibold text-gray-800">Databases (SQL/Mongo)</span>
                </div>
                <span className="font-bold text-gray-900">20%</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#EC4899]"></span>
                  <span className="font-semibold text-gray-800">Architecture & Cloud</span>
                </div>
                <span className="font-bold text-gray-900">15%</span>
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
