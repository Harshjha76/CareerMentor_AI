import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [resumeScore, setResumeScore] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [plannerTasks, setPlannerTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

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
        } else {
          setResumeScore(84); // Default showcase score
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
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-900 via-electric-800 to-primary-900 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-tealBrand-300 text-xs font-semibold mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target Role: {user?.target_role || 'Software Engineer'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            {t('dashboard.welcome')}, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6">
            {t('dashboard.subheading')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tealBrand-500 hover:bg-tealBrand-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-tealBrand-500/25 transition-all"
            >
              <Map className="w-4 h-4" /> {t('dashboard.action_new_roadmap')}
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-sm transition-all"
            >
              <MessageSquare className="w-4 h-4" /> {t('dashboard.action_chat_mentor')}
            </Link>
          </div>
        </div>

        {/* Decorative circle shapes */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-electric-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-32 top-0 w-48 h-48 bg-tealBrand-400/20 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: ATS Resume Score */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              {t('dashboard.stat_resume_score')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 flex items-baseline gap-1">
              {resumeScore !== null ? resumeScore : '--'}
              <span className="text-xs text-gray-400 font-normal">/100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 2: Active Roadmaps */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              {t('dashboard.stat_active_roadmaps')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {roadmaps.length > 0 ? roadmaps.length : 1}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-electric-600 flex items-center justify-center">
            <Map className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3: Pending Tasks Today */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              {t('dashboard.stat_pending_tasks')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {pendingTasksCount || 3}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 4: Active Goals */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              {t('dashboard.stat_active_goals')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {goals.length > 0 ? goals.length : 1}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-tealBrand-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Tasks & Goal Progress */}
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

          {plannerTasks.length === 0 ? (
            <div className="py-10 text-center text-gray-500 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm">{t('dashboard.no_tasks_today')}</p>
              <Link
                to="/planner"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-electric-600 text-white text-xs font-bold shadow-sm hover:bg-electric-700"
              >
                Auto-Generate Study Plan
              </Link>
            </div>
          ) : (
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
          )}
        </div>

        {/* Column 3: Active Goals & Quick Shortcuts */}
        <div className="space-y-8">
          {/* Active Goals Widget */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-tealBrand-600" />
                {t('dashboard.active_goals_title')}
              </h3>
              <Link to="/goals" className="text-xs text-electric-600 hover:underline font-semibold">
                Manage
              </Link>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                No active goals yet.
                <Link to="/goals" className="block mt-2 font-bold text-electric-600">
                  + Create your first goal
                </Link>
              </div>
            ) : (
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
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-tealBrand-500 to-electric-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-slate-900 to-primary-950 rounded-3xl p-6 text-white shadow-md">
            <h3 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-tealBrand-300" />
              {t('dashboard.quick_actions')}
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/resume"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-xs font-semibold flex flex-col items-center text-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-tealBrand-300" />
                {t('dashboard.action_analyze_resume')}
              </Link>
              <Link
                to="/roadmap"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-xs font-semibold flex flex-col items-center text-center gap-1.5"
              >
                <Map className="w-4 h-4 text-purple-300" />
                {t('dashboard.action_new_roadmap')}
              </Link>
              <Link
                to="/chat"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-xs font-semibold flex flex-col items-center text-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 text-amber-300" />
                {t('dashboard.action_chat_mentor')}
              </Link>
              <Link
                to="/goals"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-xs font-semibold flex flex-col items-center text-center gap-1.5"
              >
                <Target className="w-4 h-4 text-emerald-300" />
                {t('dashboard.action_add_goal')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
