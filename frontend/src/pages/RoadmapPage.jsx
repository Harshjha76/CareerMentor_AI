import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGoal } from '../context/GoalContext';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import {
  Map,
  Sparkles,
  BookOpen,
  Video,
  Code,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Clock,
  Calendar,
  ExternalLink,
  Target,
  Zap,
  Check,
  Flame,
  Layers,
  ArrowRight,
  Play,
  Trophy,
  AlertTriangle,
  ShieldCheck,
  Mail,
  Building2,
  MapPin,
  DollarSign,
  TrendingUp,
  Brain,
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';

const SUGGESTED_DOMAINS = [
  'Full Stack Web Development',
  'Data Structures & Algorithms',
  'Data Analyst & SQL',
  'Python & Machine Learning',
  'DevOps & Cloud Engineering',
  'Cybersecurity & Network Defense',
  'UI / UX & Product Design',
  'Mobile App Development (Flutter / React Native)'
];

const YOUTUBE_PLAYLIST_RECOMMENDATIONS = {
  dsa: [
    {
      title: 'Complete Java + DSA Bootcamp (Beginner to Advanced)',
      channel: 'Kunal Kushwaha',
      videos: '65+ Lectures',
      rating: '4.9 ★',
      url: 'https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7mUgf54YjV4b4DQ',
      description: 'Comprehensive Java syntax, OOP, Bitwise operations, Recursion, Sorting, Trees, Graphs, Dynamic Programming & interview solutions.',
      tag: '⭐ Complete DSA Masterclass'
    },
    {
      title: 'Striver A2Z DSA Placement Sheet',
      channel: 'take U forward (Striver)',
      videos: '100+ Videos',
      rating: '5.0 ★',
      url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz',
      description: 'Step-by-step topic-wise A2Z DSA sheet from basic math to advanced DP & Graph algorithms with code walkthroughs.',
      tag: '🔥 Top Placement Standard'
    }
  ],
  fullstack: [
    {
      title: 'Complete Modern React & JavaScript Track',
      channel: 'Chai aur Code',
      videos: '85+ Episodes',
      rating: '4.9 ★',
      url: 'https://www.youtube.com/playlist?list=PLu71SKxNbfoBuX3f4EOACle2yCjtBgEIO',
      description: 'Hands-on practical full-stack engineering covering modern ES6+, DOM, React hooks, Redux Toolkit, and production builds.',
      tag: '⭐ Full Stack Front-to-Back'
    },
    {
      title: 'Production Backend & Database Systems',
      channel: 'freeCodeCamp.org',
      videos: '8+ Hours Complete Course',
      rating: '4.8 ★',
      url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
      description: 'Production backend architecture, REST API design, JWT auth, PostgreSQL schema modeling, and microservice deployment.',
      tag: '🚀 Backend & APIs'
    }
  ],
  ai: [
    {
      title: 'Neural Networks: Zero to Hero',
      channel: 'Andrej Karpathy (ex-OpenAI)',
      videos: '7 Deep Dives',
      rating: '5.0 ★',
      url: 'https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ',
      description: 'Build micrograd, backpropagation, MLP, and GPT language models from scratch in pure Python and PyTorch.',
      tag: '⭐ Deep Learning Core'
    },
    {
      title: 'Complete Data Science & GenAI Masterclass',
      channel: 'Krish Naik',
      videos: '70+ Videos',
      rating: '4.9 ★',
      url: 'https://www.youtube.com/playlist?list=PLZoTAELRMXVN7mGZtXn3tEevnZ_VlXm4J',
      description: 'Python for AI, Pandas, LangChain, HuggingFace Transformers, Vector Databases, and LLMOps.',
      tag: '🤖 Generative AI'
    }
  ],
  devops: [
    {
      title: 'Complete DevOps Bootcamp (Docker, K8s, CI/CD)',
      channel: 'TechWorld with Nana',
      videos: '50+ High-Yield Videos',
      rating: '4.9 ★',
      url: 'https://www.youtube.com/c/TechWorldwithNana/playlists',
      description: 'Docker multi-stage builds, Kubernetes pod orchestration, Helm charts, Terraform infrastructure as code, and Prometheus monitoring.',
      tag: '⭐ Complete Cloud Track'
    }
  ]
};

export default function RoadmapPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { goal, updateGoal, setDomain, setDurationWeeks, setDailyMinutes } = useGoal();
  const navigate = useNavigate();

  const [skillInput, setSkillInput] = useState(goal.domain || 'Full Stack Web Development');
  const [durationInput, setDurationInput] = useState(goal.duration_weeks || 12);
  const [dailyMinsInput, setDailyMinsInput] = useState(goal.daily_minutes || 60);
  const [loading, setLoading] = useState(true);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({ 1: true });
  const [streakData, setStreakData] = useState(null);
  const [matchedInternships, setMatchedInternships] = useState([]);
  const [syncingPlanner, setSyncingPlanner] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Synchronize local input with shared GoalContext
  useEffect(() => {
    if (goal.domain && goal.domain !== skillInput) setSkillInput(goal.domain);
    if (goal.duration_weeks && goal.duration_weeks !== durationInput) setDurationInput(goal.duration_weeks);
    if (goal.daily_minutes && goal.daily_minutes !== dailyMinsInput) setDailyMinsInput(goal.daily_minutes);
  }, [goal.domain, goal.duration_weeks, goal.daily_minutes]);

  useEffect(() => {
    loadRoadmaps();
    loadStreakData();
    loadMatchedInternships();
  }, [goal.domain]);

  const loadRoadmaps = async () => {
    setLoading(true);
    try {
      const res = await api.roadmap.getAll();
      const all = res.roadmaps || [];
      const current = all.find(r => r.skill_name?.toLowerCase() === goal.domain?.toLowerCase()) || all[0];
      
      if (!current && goal.domain) {
        // Auto-generate if not present
        await api.roadmap.generate({
          skill_name: goal.domain,
          duration_weeks: goal.duration_weeks || 12,
          daily_minutes: goal.daily_minutes || 60,
          skill_level: goal.level || 'Intermediate'
        });
        const fresh = await api.roadmap.getAll();
        setActiveRoadmap(fresh.roadmaps?.[0] || null);
      } else {
        setActiveRoadmap(current || null);
      }
    } catch (err) {
      console.error('Failed to load roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStreakData = async () => {
    try {
      const res = await api.reminders.getStreakStatus();
      setStreakData(res);
    } catch (e) {
      console.warn('Streak status notice:', e.message);
    }
  };

  const loadMatchedInternships = async () => {
    try {
      const res = await api.internships.getRecommendations();
      if (res && res.top_internships) {
        setMatchedInternships(res.top_internships);
      }
    } catch (e) {
      console.warn('Matched internships notice:', e.message);
    }
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!skillInput.trim()) return;

    setLoading(true);
    try {
      updateGoal({
        domain: skillInput.trim(),
        duration_weeks: durationInput,
        daily_minutes: dailyMinsInput,
        current_week: 1
      });

      await api.roadmap.generate({
        skill_name: skillInput.trim(),
        duration_weeks: durationInput,
        daily_minutes: dailyMinsInput,
        skill_level: goal.level || 'Intermediate'
      });
      await loadRoadmaps();
      await loadStreakData();
      setExpandedWeeks({ 1: true });
    } catch (err) {
      alert('Error generating roadmap: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (weekNum) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekNum]: !prev[weekNum]
    }));
  };

  const toggleSubtask = async (taskId, subtaskId, currentSubtaskStatus) => {
    try {
      const res = await api.roadmap.toggleSubtask(taskId, subtaskId, !currentSubtaskStatus);
      await loadStreakData();
      if (activeRoadmap) {
        const updatedWeeks = activeRoadmap.weeks.map(w => ({
          ...w,
          tasks: w.tasks.map(t => {
            if (t.id === taskId) {
              const updatedSubs = (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, is_completed: !currentSubtaskStatus } : st);
              const allDone = updatedSubs.length > 0 && updatedSubs.every(st => !!st.is_completed);
              return {
                ...t,
                subtasks: updatedSubs,
                is_completed: allDone || (res.task_completed !== undefined ? res.task_completed : t.is_completed)
              };
            }
            return t;
          })
        }));

        let total = 0;
        let completed = 0;
        updatedWeeks.forEach(w => {
          w.tasks.forEach(t => {
            total++;
            if (t.is_completed) completed++;
          });
        });

        setActiveRoadmap({
          ...activeRoadmap,
          weeks: updatedWeeks,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
          completedTasks: completed,
          totalTasks: total
        });
      }
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    try {
      await api.roadmap.toggleTask(taskId, !currentStatus);
      await loadStreakData();
      if (activeRoadmap) {
        const updatedWeeks = activeRoadmap.weeks.map(w => ({
          ...w,
          tasks: w.tasks.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t)
        }));

        let total = 0;
        let completed = 0;
        updatedWeeks.forEach(w => {
          w.tasks.forEach(t => {
            total++;
            if (t.is_completed) completed++;
          });
        });

        setActiveRoadmap({
          ...activeRoadmap,
          weeks: updatedWeeks,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
          completedTasks: completed,
          totalTasks: total
        });
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleSyncToPlanner = async (week) => {
    if (!week || !week.tasks) return;
    setSyncingPlanner(true);
    setSyncSuccess(false);
    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const mappedTasks = week.tasks.map((t, idx) => ({
        id: t.id || `task-${Date.now()}-${idx}`,
        day: days[(t.day_number - 1) % 7] || 'Monday',
        time: `${goal.daily_minutes || 60}m Session`,
        description: t.topic || t.task_description,
        is_completed: !!t.is_completed,
        is_ai_suggested: true
      }));

      await api.planner.saveTasks(mappedTasks);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3500);
    } catch (err) {
      alert('Failed to sync tasks: ' + err.message);
    } finally {
      setSyncingPlanner(false);
    }
  };

  const handleExportPDF = () => {
    if (!activeRoadmap) return;
    const doc = new jsPDF();
    const studentName = user?.name || 'Engineer';
    const targetRole = user?.target_role || 'Software Engineer';
    const dailyMins = goal.daily_minutes || 60;

    doc.setFillColor(11, 18, 32);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CareerPilot AI', 20, 22);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Senior Mentor Curriculum & Execution Blueprint', 20, 30);

    doc.setFillColor(23, 32, 51);
    doc.roundedRect(20, 38, 170, 32, 3, 3, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text('STUDENT', 26, 46);
    doc.text('DOMAIN', 26, 58);
    doc.text('DURATION', 120, 46);
    doc.text('DAILY COMMITMENT', 120, 58);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, 26, 52);
    doc.text(activeRoadmap.skill_name, 26, 64);
    doc.text(`${activeRoadmap.duration_weeks} Weeks`, 120, 52);
    doc.text(`${dailyMins} mins/day`, 120, 64);

    let y = 80;
    (activeRoadmap.weeks || []).forEach(w => {
      if (y > 260) {
        doc.addPage();
        doc.setFillColor(11, 18, 32);
        doc.rect(0, 0, 210, 297, 'F');
        y = 25;
      }
      doc.setTextColor(6, 182, 212);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Week ${w.week_number}: ${w.title}`, 20, y);
      y += 6;

      (w.tasks || []).forEach(t => {
        if (y > 275) {
          doc.addPage();
          doc.setFillColor(11, 18, 32);
          doc.rect(0, 0, 210, 297, 'F');
          y = 25;
        }
        doc.setTextColor(203, 213, 225);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`• Day ${t.day_number}: ${t.topic || t.task_description}`, 24, y);
        y += 5;
      });
      y += 4;
    });

    doc.save(`CareerPilot_${activeRoadmap.skill_name.replace(/\s+/g, '_')}_Roadmap.pdf`);
  };

  const getPlaylists = () => {
    const s = (activeRoadmap?.skill_name || goal.domain || '').toLowerCase();
    if (/dsa|algorithm|leetcode|java/i.test(s)) return YOUTUBE_PLAYLIST_RECOMMENDATIONS.dsa;
    if (/ai|python|machine|data/i.test(s)) return YOUTUBE_PLAYLIST_RECOMMENDATIONS.ai;
    if (/devops|cloud|docker|kubernetes/i.test(s)) return YOUTUBE_PLAYLIST_RECOMMENDATIONS.devops;
    return YOUTUBE_PLAYLIST_RECOMMENDATIONS.fullstack;
  };

  const getTypeBadge = (type) => {
    const tLower = (type || 'learn').toLowerCase();
    if (tLower === 'learn') return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">LEARN</span>;
    if (tLower === 'practice') return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30">PRACTICE</span>;
    if (tLower === 'project') return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">PROJECT</span>;
    if (tLower === 'mock test') return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">MOCK TEST</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">REVISION</span>;
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] pb-16">
      {/* Top Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B]/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#06B6D4]">
                Autonomous Learning Architect
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#F8FAFC] flex items-center gap-3">
              <Map className="w-8 h-8 text-[#3B82F6]" />
              Learning Roadmap & Milestones
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
              Every day is 100% unique, progressively tailored to your goal with exact minute breakdowns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeRoadmap && (
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-[#172033] border border-[#1E293B] text-xs font-bold text-[#CBD5E1] hover:text-[#F8FAFC] transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-[#06B6D4]" />
                Export Syllabus PDF
              </button>
            )}
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 text-xs font-bold text-white shadow-lg shadow-[#3B82F6]/20 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Open Daily Co-Planner →
            </Link>
          </div>
        </div>

        {/* Domain Config & Quick Selection */}
        <div className="bg-[#111827]/90 backdrop-blur-md rounded-3xl border border-[#1E293B] p-6 sm:p-7 shadow-2xl space-y-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                Target Role / Learning Domain
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="e.g. Full Stack Web Development, DSA in Java, DevOps & Cloud..."
                  className="flex-1 px-4 py-3 rounded-xl bg-[#090D16] border border-[#1E293B] text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#3B82F6]/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate AI Roadmap</span>
                </button>
              </div>
            </div>

            {/* Quick Domain Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#64748B] mr-1">Quick Select:</span>
              {SUGGESTED_DOMAINS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSkillInput(d);
                    updateGoal({ domain: d, current_week: 1 });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    skillInput.toLowerCase() === d.toLowerCase()
                      ? 'bg-[#3B82F6]/20 border-[#3B82F6]/50 text-[#60A5FA]'
                      : 'bg-[#090D16] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Timeline & Daily Commitment Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1E293B]">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#94A3B8]">
                  Curriculum Timeline: <strong className="text-[#F8FAFC]">{durationInput} Weeks</strong>
                </label>
                <select
                  value={durationInput}
                  onChange={(e) => setDurationInput(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-[#1E293B] text-xs font-semibold text-[#F8FAFC] outline-none focus:border-[#3B82F6]"
                >
                  <option value={2}>2 Weeks (Fast-track Sprint)</option>
                  <option value={4}>4 Weeks (1 Month Intensive)</option>
                  <option value={8}>8 Weeks (2 Months Core)</option>
                  <option value={12}>12 Weeks (3 Months Mastery)</option>
                  <option value={16}>16 Weeks (4 Months Comprehensive)</option>
                  <option value={24}>24 Weeks (6 Months Deep Track)</option>
                  <option value={48}>48 Weeks (12 Months Masterclass)</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-[#94A3B8]">
                  <span>Daily Study Commitment</span>
                  <span className="text-[#06B6D4] font-bold">{dailyMinsInput} mins/day</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="360"
                  step="5"
                  value={dailyMinsInput}
                  onChange={(e) => setDailyMinsInput(parseInt(e.target.value, 10))}
                  className="w-full accent-[#3B82F6] cursor-pointer mt-2"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Roadmap Velocity & Progress Bar */}
        {activeRoadmap && (
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#F8FAFC]">{activeRoadmap.skill_name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] text-xs font-bold border border-[#10B981]/30">
                  {activeRoadmap.progress || 0}% Completed
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                {activeRoadmap.completedTasks || 0} of {activeRoadmap.totalTasks || 0} milestones checked off
              </p>
              {/* Progress track */}
              <div className="w-full sm:w-80 h-2 bg-[#090D16] rounded-full overflow-hidden border border-[#1E293B] mt-2">
                <div
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#10B981] transition-all duration-500 rounded-full"
                  style={{ width: `${activeRoadmap.progress || 0}%` }}
                />
              </div>
            </div>

            {/* Streak & Velocity Highlights */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#090D16] border border-[#1E293B]">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-black text-[#F8FAFC]">{streakData?.currentStreak || 0} Days</div>
                  <div className="text-[10px] text-[#94A3B8] font-bold uppercase">Study Streak</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
            <span className="text-xs font-semibold">Architecting progressive non-repeating curriculum...</span>
          </div>
        ) : !activeRoadmap ? (
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-12 text-center space-y-4">
            <Map className="w-12 h-12 text-[#3B82F6] mx-auto opacity-60" />
            <h3 className="text-lg font-bold text-[#F8FAFC]">No Roadmap Generated Yet</h3>
            <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
              Select or type any target skill above to generate a personalized 7-days/week curriculum.
            </p>
          </div>
        ) : (
          /* Weeks Accordion */
          <div className="space-y-5">
            {(activeRoadmap.weeks || []).map((week) => {
              const isExpanded = !!expandedWeeks[week.week_number];
              const weekProgress = week.tasks && week.tasks.length > 0
                ? Math.round((week.tasks.filter(t => t.is_completed).length / week.tasks.length) * 100)
                : 0;

              return (
                <div
                  key={week.week_number}
                  className="bg-[#111827] rounded-3xl border border-[#1E293B] overflow-hidden shadow-xl transition-all"
                >
                  {/* Week Header Banner */}
                  <div
                    onClick={() => toggleWeek(week.week_number)}
                    className="p-5 sm:p-6 bg-gradient-to-r from-[#111827] via-[#172033] to-[#111827] flex items-center justify-between cursor-pointer hover:bg-[#172033]/80 transition-colors select-none"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/15 text-[#60A5FA] flex items-center justify-center font-black text-sm border border-[#3B82F6]/30 shrink-0">
                        W{week.week_number}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider">
                            Week {week.week_number} Milestone
                          </span>
                          <span className="text-xs text-[#94A3B8]">• {weekProgress}% Done</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-[#F8FAFC] truncate mt-0.5">
                          {week.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        to={`/planner?week=${week.week_number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-bold transition-all"
                      >
                        <span>Planner</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC]">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Week Body (Days 1 to 7) */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-5 border-t border-[#1E293B]">
                      {/* Milestone Project Card */}
                      {week.milestone_project && (
                        <div className="p-4 rounded-2xl bg-[#090D16] border border-[#1E293B] space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-[#8B5CF6] flex items-center gap-1.5">
                              <Layers className="w-4 h-4" /> Weekly Capstone Project
                            </span>
                            <span className="text-[#94A3B8] text-[11px]">{week.milestone_project.title}</span>
                          </div>
                          <p className="text-xs text-[#CBD5E1] leading-relaxed">
                            {week.milestone_project.description}
                          </p>
                        </div>
                      )}

                      {/* Day 1 Curated Resources */}
                      {week.tasks?.[0]?.resource_links && week.tasks[0].resource_links.length > 0 && (
                        <div className="p-4 rounded-2xl bg-[#090D16] border border-[#1E293B] space-y-2.5">
                          <span className="text-[11px] font-extrabold uppercase text-[#94A3B8] block">
                            Curated Masterclass Resources (Week {week.week_number}):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {week.tasks[0].resource_links.map((res, ri) => (
                              <a
                                key={ri}
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-[#172033] border border-[#1E293B] hover:border-[#3B82F6]/50 text-xs text-[#CBD5E1] hover:text-[#F8FAFC] transition-all font-semibold"
                              >
                                {res.type === 'video' ? <Video className="w-3.5 h-3.5 text-rose-400" /> : <BookOpen className="w-3.5 h-3.5 text-[#3B82F6]" />}
                                <span>{res.title}</span>
                                <ExternalLink className="w-3 h-3 text-[#64748B]" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 7 Clean Daily Cards */}
                      <div className="space-y-3">
                        {(week.tasks || []).map((task) => {
                          const isDone = !!task.is_completed;
                          const cleanTopic = (task.topic || task.task_description || '').replace(/^Day\s*\d+\s*:\s*/i, '');

                          return (
                            <div
                              key={task.id || task.day_number}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                                isDone
                                  ? 'bg-[#090D16]/50 border-emerald-500/20 opacity-80'
                                  : 'bg-[#090D16] border-[#1E293B] hover:border-[#3B82F6]/40'
                              }`}
                            >
                              {/* Top row: Day badge, Type badge, Topic, Duration */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleTask(task.id, isDone)}
                                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                                      isDone
                                        ? 'bg-[#10B981] border-[#10B981] text-white shadow-xs'
                                        : 'border-[#1E293B] hover:border-[#3B82F6] text-transparent'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-[#172033] text-[#CBD5E1] text-[11px] font-extrabold border border-[#1E293B]">
                                      Day {task.day_number} ({task.day || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][task.day_number - 1]})
                                    </span>
                                    {getTypeBadge(task.type)}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                                  <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                                  <span className="font-semibold text-[#CBD5E1]">{task.duration_minutes || goal.daily_minutes || 60} mins</span>
                                </div>
                              </div>

                              {/* Clean Semantic Topic (No double Day 1 prefix) */}
                              <div className="pl-8">
                                <h4 className={`text-sm font-bold ${isDone ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'}`}>
                                  {cleanTopic}
                                </h4>
                                {task.done_when && (
                                  <p className="text-xs text-[#94A3B8] mt-1 flex items-center gap-1.5">
                                    <span className="text-[#06B6D4] font-semibold">Done when:</span>
                                    <span>{task.done_when}</span>
                                  </p>
                                )}
                              </div>

                              {/* Subtasks Checklist */}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div className="pl-8 pt-1 space-y-1.5">
                                  {task.subtasks.map((st) => (
                                    <div
                                      key={st.id}
                                      onClick={() => toggleSubtask(task.id, st.id, st.is_completed)}
                                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                        st.is_completed
                                          ? 'bg-[#111827]/40 border-emerald-500/20 text-[#64748B] line-through'
                                          : 'bg-[#111827] border-[#1E293B] text-[#CBD5E1] hover:border-[#3B82F6]/40'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                          st.is_completed ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#1E293B]'
                                        }`}>
                                          {st.is_completed && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className="truncate">{st.title}</span>
                                      </div>
                                      <span className="text-[11px] font-bold text-[#06B6D4] shrink-0 ml-2">
                                        {st.duration_minutes}m
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Week Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1E293B]">
                        <button
                          type="button"
                          onClick={() => handleSyncToPlanner(week)}
                          disabled={syncingPlanner}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#172033] border border-[#1E293B] text-xs font-bold text-[#CBD5E1] transition-all cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
                          {syncSuccess ? '✓ Synced to Study Planner!' : `⚡ Sync Week ${week.week_number} to Planner`}
                        </button>

                        <Link
                          to={`/planner?week=${week.week_number}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/40 text-[#60A5FA] text-xs font-bold transition-all"
                        >
                          <span>Open in Daily Co-Planner</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Curated YouTube Playlists Section */}
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#F8FAFC] flex items-center gap-2">
                <Play className="w-5 h-5 text-rose-500 fill-rose-500" />
                Recommended High-Yield YouTube Masterclasses
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Curated playlist references matched to {activeRoadmap?.skill_name || 'your curriculum'}.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
              100% Free Resources
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getPlaylists().map((pl, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#090D16] border border-[#1E293B] hover:border-rose-500/40 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                      {pl.tag}
                    </span>
                    <span className="text-[#94A3B8] font-bold">{pl.rating}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#F8FAFC] group-hover:text-rose-400 transition-colors">
                    {pl.title}
                  </h4>
                  <div className="text-xs text-[#94A3B8] flex items-center gap-2">
                    <span>{pl.channel}</span>
                    <span>•</span>
                    <span>{pl.videos}</span>
                  </div>
                  <p className="text-xs text-[#CBD5E1] leading-relaxed">{pl.description}</p>
                </div>

                <a
                  href={pl.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Watch Playlist on YouTube
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Matched Internships Row */}
        {matchedInternships.length > 0 && (
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#F8FAFC] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#3B82F6]" />
                  Direct Real Internship Openings for this Curriculum
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Verified hiring openings matching your target competencies.
                </p>
              </div>
              <Link
                to="/internships"
                className="text-xs font-bold text-[#60A5FA] hover:text-[#93C5FD] flex items-center gap-1"
              >
                <span>View All Openings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedInternships.slice(0, 3).map((intern) => (
                <div
                  key={intern.id}
                  className="p-5 rounded-2xl bg-[#090D16] border border-[#1E293B] hover:border-[#3B82F6]/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-[#60A5FA] bg-[#3B82F6]/15 px-2 py-0.5 rounded border border-[#3B82F6]/30">
                        {intern.company_tier || 'Verified Opening'}
                      </span>
                      <span className="text-xs font-black text-[#10B981]">
                        {intern.match_score || 85}% Match
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#F8FAFC]">{intern.role}</h4>
                    <p className="text-xs text-[#94A3B8] flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#3B82F6]" />
                      <span>{intern.company}</span>
                      <span>•</span>
                      <span>{intern.location}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400">{intern.stipend}</span>
                    <a
                      href={intern.apply_urls?.careers || intern.apply_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs transition-all shadow"
                    >
                      Apply
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
