import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGoal } from '../context/GoalContext';
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
  Bell,
  Mail,
  Flame,
  ShieldCheck,
  Building2,
  Briefcase,
  LogOut,
  UserCheck,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const { goal } = useGoal();
  const navigate = useNavigate();

  const [resumeScore, setResumeScore] = useState(88);
  const [roadmaps, setRoadmaps] = useState([]);
  const [plannerTasks, setPlannerTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [matchedInternshipsCount, setMatchedInternshipsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [agentNotification, setAgentNotification] = useState(null);
  const [triggeringCheckin, setTriggeringCheckin] = useState(false);

  // Flexible Availability & Interactive Charts State
  const [availableMinutes, setAvailableMinutes] = useState(goal.daily_minutes || user?.available_study_minutes || 60);
  const [hoveredStudyIndex, setHoveredStudyIndex] = useState(null);
  const [hoveredGapIndex, setHoveredGapIndex] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [resumeRes, roadmapsRes, plannerRes, goalsRes, skillsRes, streakRes, internRes] = await Promise.allSettled([
          api.resume.getLatest(),
          api.roadmap.getAll(),
          api.planner.get('weekly'),
          api.goals.getAll(),
          api.skills.get(),
          api.reminders.getStreakStatus(),
          api.internships.getRecommendations()
        ]);

        if (resumeRes.status === 'fulfilled' && resumeRes.value?.resume) {
          setResumeScore(resumeRes.value.resume.score);
        }
        if (roadmapsRes.status === 'fulfilled' && roadmapsRes.value?.roadmaps) {
          setRoadmaps(roadmapsRes.value.roadmaps);
        }
        if (plannerRes.status === 'fulfilled' && plannerRes.value?.tasks) {
          setPlannerTasks(plannerRes.value.tasks);
        }
        if (goalsRes.status === 'fulfilled' && goalsRes.value?.goals) {
          setGoals(goalsRes.value.goals);
        }
        if (skillsRes.status === 'fulfilled' && skillsRes.value?.skills) {
          setUserSkills(skillsRes.value.skills);
        }
        if (streakRes.status === 'fulfilled' && streakRes.value) {
          setStreakData(streakRes.value);
        }
        if (internRes.status === 'fulfilled' && internRes.value?.top_internships) {
          setMatchedInternshipsCount(internRes.value.top_internships.length);
        }
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

  const activeRoadmap = roadmaps.find(r => r.skill_name?.toLowerCase() === goal.domain?.toLowerCase()) || roadmaps[0];
  const roadmapProgress = activeRoadmap?.progress || 0;

  // Knowledge gap calculations using genuine user verified skills vs target role requirements
  const ROLE_SKILL_REQUIREMENTS = {
    'software engineer': ['Data Structures & Algorithms', 'System Design', 'Git', 'SQL', 'REST APIs', 'Clean Architecture', 'Testing & CI/CD'],
    'frontend developer': ['React', 'JavaScript / TypeScript', 'HTML5 & CSS3', 'Tailwind CSS', 'REST / GraphQL APIs', 'State Management', 'Web Performance'],
    'backend developer': ['Node.js / Express', 'PostgreSQL / SQL', 'REST & gRPC APIs', 'Redis Caching', 'Docker', 'Authentication & JWT', 'System Design'],
    'full stack developer': ['React / Frontend', 'Node.js / Backend', 'PostgreSQL / MongoDB', 'REST APIs', 'Docker', 'Git / CI-CD', 'System Design'],
    'data scientist': ['Python', 'Pandas & NumPy', 'Machine Learning', 'SQL', 'Data Visualization', 'Deep Learning', 'Statistics'],
    'data analyst': ['SQL', 'Excel / Sheets', 'Tableau / PowerBI', 'Python', 'Data Cleaning', 'Business Analytics', 'Statistics'],
    'devops engineer': ['Docker & Containers', 'Kubernetes', 'CI/CD Pipelines', 'AWS / Cloud', 'Linux / Bash', 'Terraform', 'Monitoring & Observability'],
    'java developer': ['Core Java & OOP', 'Data Structures & Algorithms', 'Spring Boot', 'SQL & Hibernate', 'REST APIs', 'Microservices', 'Git & Maven'],
    'python developer': ['Python Core', 'Data Structures & Algorithms', 'FastAPI / Django', 'PostgreSQL / SQL', 'Docker', 'REST APIs', 'Git']
  };

  const allVerifiedSkillStrings = [
    ...userSkills.map(s => s.name || s.skill_name || ''),
    ...(user?.current_skills ? user.current_skills.split(',').map(s => s.trim()) : []),
    ...(Array.isArray(user?.skills_inventory) ? user.skills_inventory.map(s => typeof s === 'string' ? s : s.name || '') : [])
  ].filter(Boolean);

  const uniqueVerifiedSkills = Array.from(new Set(allVerifiedSkillStrings.map(s => s.toLowerCase())));
  const targetRoleKey = (user?.target_role || 'Software Engineer').toLowerCase();
  const matchedRoleKey = Object.keys(ROLE_SKILL_REQUIREMENTS).find(k => targetRoleKey.includes(k) || k.includes(targetRoleKey)) || 'software engineer';
  const targetRequiredSkills = ROLE_SKILL_REQUIREMENTS[matchedRoleKey];

  const matchedSkills = targetRequiredSkills.filter(req => {
    const reqClean = req.toLowerCase();
    return uniqueVerifiedSkills.some(userSkill => {
      return userSkill.includes(reqClean) || reqClean.includes(userSkill) ||
             (reqClean.includes('dsa') && (userSkill.includes('algorithm') || userSkill.includes('data structure') || userSkill.includes('leetcode'))) ||
             (reqClean.includes('sql') && (userSkill.includes('postgres') || userSkill.includes('mysql') || userSkill.includes('database'))) ||
             (reqClean.includes('react') && userSkill.includes('frontend')) ||
             (reqClean.includes('node') && userSkill.includes('backend'));
    });
  });

  const rawMatchPct = Math.round((matchedSkills.length / Math.max(1, targetRequiredSkills.length)) * 100);
  const compatibilityPct = uniqueVerifiedSkills.length === 0 ? 0 : Math.max(25, rawMatchPct);
  const gapPct = 100 - compatibilityPct;

  const studyCategories = [
    { name: 'Algorithms & DSA', pct: 0.45, color: '#8B5CF6', hoverColor: '#A78BFA', bg: 'bg-[#8B5CF6]/15', text: 'text-[#A78BFA]', offset: 0, dash: '45 55' },
    { name: 'Projects & APIs', pct: 0.25, color: '#06B6D4', hoverColor: '#22D3EE', bg: 'bg-[#06B6D4]/15', text: 'text-[#06B6D4]', offset: -45, dash: '25 75' },
    { name: 'System Design', pct: 0.15, color: '#F59E0B', hoverColor: '#FBBF24', bg: 'bg-amber-500/15', text: 'text-amber-400', offset: -70, dash: '15 85' },
    { name: 'CS Core & Review', pct: 0.15, color: '#3B82F6', hoverColor: '#60A5FA', bg: 'bg-[#3B82F6]/15', text: 'text-[#60A5FA]', offset: -85, dash: '15 85' }
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] pb-16">
      {/* Top Ambient Glows */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* 2-Hour Autonomous Agent Toast Alert */}
      {agentNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-[#111827] rounded-3xl border border-[#06B6D4] shadow-2xl p-5 animate-in slide-in-from-top-6 duration-300">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#06B6D4]/20">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30">
                  Autonomous Agent Alert
                </span>
                <span className="text-[10px] text-[#94A3B8]">Just now</span>
              </div>
              <h4 className="font-extrabold text-sm text-[#F8FAFC]">{agentNotification.title}</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{agentNotification.body}</p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => navigate('/planner')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white text-xs font-bold shadow-md transition-all"
                >
                  View Remaining Tasks →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">
        {/* Mission Control Hero Banner */}
        <div className="bg-gradient-to-r from-[#111827] via-[#172033] to-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Target: {user?.target_role || goal.domain || 'Software Engineer'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-bold">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Autonomous Agent Online
              </span>
              {user?.email && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#090D16] border border-[#1E293B] text-[#38BDF8] text-xs font-semibold">
                  <Mail className="w-3.5 h-3.5 text-[#3B82F6]" />
                  {user.email}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#F8FAFC]">
              Welcome back, {user?.name || 'Engineer'}! 👋
            </h1>
            <p className="text-[#94A3B8] text-xs sm:text-sm leading-relaxed max-w-2xl">
              Your autonomous career agent is actively synchronizing your learning velocity, ATS resume calibration, and verified hiring opportunities.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleTrigger2hCheckin}
                disabled={triggeringCheckin}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#3B82F6]/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-4 h-4" />
                {triggeringCheckin ? 'Dispatching...' : 'Trigger 2h Study Check-in'}
              </button>
              <Link
                to="/roadmap"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#090D16] hover:bg-[#111827] text-[#CBD5E1] hover:text-[#F8FAFC] text-xs sm:text-sm font-bold border border-[#1E293B] transition-all"
              >
                <Map className="w-4 h-4 text-[#06B6D4]" />
                Resume Learning Roadmap
              </Link>
            </div>
          </div>

          {/* Connected Google Identity Card with One-Click Account Switching */}
          <div className="relative z-10 shrink-0 bg-[#090D16]/90 border border-[#1E293B] rounded-2xl p-4 sm:p-5 w-full lg:w-72 space-y-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#F8FAFC] truncate">
                  {user?.name || 'Verified User'}
                </div>
                <div className="text-[11px] text-[#94A3B8] truncate" title={user?.email}>
                  {user?.email || 'Signed In'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[10px] font-bold">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Google OAuth Verified</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#161F30] hover:bg-[#1E293B] border border-[#2A3548] text-[#38BDF8] text-[11px] font-bold transition-all cursor-pointer"
                title="Switch to another Google or Email account"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-[11px] font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Quick Key Metric Glass Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: ATS Resume Score */}
          <Link
            to="/resume"
            className="p-5 rounded-3xl bg-[#111827] border border-[#1E293B] hover:border-[#3B82F6]/50 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[#94A3B8]">ATS Resume Score</span>
              <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/15 text-[#60A5FA] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#F8FAFC]">{resumeScore}/100</div>
              <p className="text-[11px] text-[#10B981] font-semibold mt-0.5">High Industry Readiness 🚀</p>
            </div>
            <div className="text-xs font-bold text-[#60A5FA] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Analyze Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: Roadmap Progress */}
          <Link
            to="/roadmap"
            className="p-5 rounded-3xl bg-[#111827] border border-[#1E293B] hover:border-[#06B6D4]/50 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[#94A3B8]">Curriculum Progress</span>
              <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center">
                <Map className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#F8FAFC]">{roadmapProgress}%</div>
              <p className="text-[11px] text-[#94A3B8] font-semibold mt-0.5">{activeRoadmap?.skill_name || 'Active Roadmap'}</p>
            </div>
            <div className="text-xs font-bold text-[#06B6D4] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Milestones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: Verified Skills Inventory */}
          <Link
            to="/what-i-know"
            className="p-5 rounded-3xl bg-[#111827] border border-[#1E293B] hover:border-emerald-500/50 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[#94A3B8]">Verified Skills</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#F8FAFC]">{userSkills.length} Verified</div>
              <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">0% Demo / Genuine Baseline</p>
            </div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Open Skill Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 4: Qualified Internships */}
          <Link
            to="/internships"
            className="p-5 rounded-3xl bg-[#111827] border border-[#1E293B] hover:border-[#8B5CF6]/50 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[#94A3B8]">Matched Internships</span>
              <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 text-[#A78BFA] flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#F8FAFC]">{matchedInternshipsCount} Openings</div>
              <p className="text-[11px] text-[#A78BFA] font-semibold mt-0.5">≥ 60% Match Threshold</p>
            </div>
            <div className="text-xs font-bold text-[#A78BFA] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Browse Openings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* 5 Core Feature Navigation Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/chat"
            className="p-5 bg-[#111827] rounded-3xl border border-[#1E293B] hover:border-amber-500/50 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#F8FAFC]">Career Chatbot</h3>
              <p className="text-xs text-[#94A3B8] mt-1 leading-snug">24/7 intelligent career counseling & interview mock prep.</p>
            </div>
            <div className="mt-4 text-xs font-bold text-amber-400 flex items-center gap-1">Start Chatting →</div>
          </Link>

          <Link
            to="/resume"
            className="p-5 bg-[#111827] rounded-3xl border border-[#1E293B] hover:border-[#3B82F6]/50 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 text-[#60A5FA] flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#F8FAFC]">Resume Analyzer</h3>
              <p className="text-xs text-[#94A3B8] mt-1 leading-snug">Deep structured extraction & honest ATS scoring.</p>
            </div>
            <div className="mt-4 text-xs font-bold text-[#60A5FA] flex items-center gap-1">Analyze Resume →</div>
          </Link>

          <Link
            to="/roadmap"
            className="p-5 bg-[#111827] rounded-3xl border border-[#1E293B] hover:border-purple-500/50 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#F8FAFC]">Smart Roadmap</h3>
              <p className="text-xs text-[#94A3B8] mt-1 leading-snug">7-day progressive curriculum tailored to your goal.</p>
            </div>
            <div className="mt-4 text-xs font-bold text-purple-400 flex items-center gap-1">View Curriculum →</div>
          </Link>

          <Link
            to="/planner"
            className="p-5 bg-[#111827] rounded-3xl border border-[#1E293B] hover:border-emerald-500/50 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-[#10B981] flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#F8FAFC]">AI Study Planner</h3>
              <p className="text-xs text-[#94A3B8] mt-1 leading-snug">Human + AI co-planning with exact minute breakdown.</p>
            </div>
            <div className="mt-4 text-xs font-bold text-[#10B981] flex items-center gap-1">Open Co-Planner →</div>
          </Link>

          <Link
            to="/what-i-know"
            className="p-5 bg-[#111827] rounded-3xl border border-[#1E293B] hover:border-rose-500/50 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-3">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#F8FAFC]">What I Know</h3>
              <p className="text-xs text-[#94A3B8] mt-1 leading-snug">Verified skills baseline & skill-gap bridge catalog.</p>
            </div>
            <div className="mt-4 text-xs font-bold text-rose-400 flex items-center gap-1">Explore Vault →</div>
          </Link>
        </div>

        {/* Interactive Charts: Study Time Allocation & Knowledge Gap Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Study Time Allocation */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-7 shadow-xl space-y-5 relative overflow-visible">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#F8FAFC] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#3B82F6]" />
                  Study Time Allocation
                </h3>
                <p className="text-xs text-[#94A3B8]">Session budget: {availableMinutes} mins/day</p>
              </div>
              <span className="text-xs font-bold text-[#60A5FA] bg-[#3B82F6]/15 px-2.5 py-1 rounded-full border border-[#3B82F6]/30">
                Today's Budget
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 relative">
              {/* Donut Chart SVG with Non-Clipping Center and Hover Effects */}
              <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 overflow-visible">
                  {studyCategories.map((cat, idx) => (
                    <circle
                      key={idx}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={hoveredStudyIndex === idx ? cat.hoverColor : cat.color}
                      strokeWidth={hoveredStudyIndex === idx ? "7" : "5"}
                      strokeDasharray={cat.dash}
                      strokeDashoffset={cat.offset}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredStudyIndex(idx)}
                      onMouseLeave={() => setHoveredStudyIndex(null)}
                    />
                  ))}
                </svg>

                {/* Center Dynamic Label or Active Category Tooltip */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 z-20">
                  {hoveredStudyIndex !== null ? (
                    <div className="animate-in fade-in duration-150">
                      <span className="text-2xl font-black text-[#F8FAFC]">
                        {Math.round(availableMinutes * studyCategories[hoveredStudyIndex].pct)}m
                      </span>
                      <div className="text-[11px] font-bold text-[#60A5FA] uppercase tracking-wider">
                        {Math.round(studyCategories[hoveredStudyIndex].pct * 100)}% Focus
                      </div>
                      <span className="text-[9.5px] text-[#94A3B8] line-clamp-1 max-w-[110px]">
                        {studyCategories[hoveredStudyIndex].name}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-black text-[#F8FAFC]">{availableMinutes}m</span>
                      <span className="text-[10px] uppercase font-extrabold text-[#94A3B8] tracking-wider block">
                        Daily Target
                      </span>
                      <span className="text-[9px] text-[#64748B] block mt-0.5">Today's Session</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Legend List with Non-Overlapping Tooltips */}
              <div className="space-y-2 w-full sm:w-auto text-xs z-10">
                {studyCategories.map((cat, idx) => {
                  const isHovered = hoveredStudyIndex === idx;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredStudyIndex(idx)}
                      onMouseLeave={() => setHoveredStudyIndex(null)}
                      className={`flex items-center justify-between gap-4 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isHovered
                          ? 'bg-[#1E293B] border-[#3B82F6] shadow-md -translate-y-0.5'
                          : 'bg-[#090D16] border-[#1E293B] hover:border-[#334155]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                        <span className={`${cat.text} font-bold`}>{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-[#F8FAFC]">
                          {Math.round(availableMinutes * cat.pct)}m
                        </span>
                        <span className="text-[10px] text-[#94A3B8] ml-1.5 font-medium">
                          ({Math.round(cat.pct * 100)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart 2: Knowledge Gap Alignment Donut */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#F8FAFC] flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-[#06B6D4]" />
                  Knowledge Gap Alignment
                </h3>
                <p className="text-xs text-[#94A3B8]">Target Role: {user?.target_role || 'Software Engineer'}</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                {compatibilityPct}% Matched
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 overflow-visible">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth={hoveredGapIndex === 0 ? "7" : "5.5"}
                    strokeDasharray={`${compatibilityPct} ${gapPct}`}
                    strokeDashoffset="0"
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredGapIndex(0)}
                    onMouseLeave={() => setHoveredGapIndex(null)}
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth={hoveredGapIndex === 1 ? "7" : "5.5"}
                    strokeDasharray={`${gapPct} ${compatibilityPct}`}
                    strokeDashoffset={`-${compatibilityPct}`}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredGapIndex(1)}
                    onMouseLeave={() => setHoveredGapIndex(null)}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 z-20">
                  {hoveredGapIndex === 1 ? (
                    <div>
                      <span className="text-2xl font-black text-amber-400">{gapPct}%</span>
                      <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">Skill Gap</span>
                      <span className="text-[9px] text-[#94A3B8] block">High-Yield Areas</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-black text-[#F8FAFC]">{compatibilityPct}%</span>
                      <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider block">Role Fit</span>
                      <span className="text-[9px] text-[#94A3B8] block">{matchedSkills.length}/{targetRequiredSkills.length} Skills</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 w-full sm:w-auto text-xs z-10">
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-[#090D16] border border-[#1E293B]">
                  <span className="text-emerald-400 font-bold">Verified Known Skills</span>
                  <span className="font-extrabold text-[#F8FAFC]">{uniqueVerifiedSkills.length} Skills</span>
                </div>
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-[#090D16] border border-[#1E293B]">
                  <span className="text-amber-400 font-bold">Target Role Coverage</span>
                  <span className="font-extrabold text-[#F8FAFC]">{matchedSkills.length} of {targetRequiredSkills.length} Required</span>
                </div>
                <Link
                  to="/what-i-know"
                  className="w-full text-center block py-2 rounded-xl bg-[#172033] hover:bg-[#1e2d47] text-xs font-bold text-[#60A5FA] border border-[#3B82F6]/30 transition-all cursor-pointer"
                >
                  Manage Knowledge Vault →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
