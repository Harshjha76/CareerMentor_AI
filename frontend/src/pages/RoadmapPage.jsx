import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  Download,
  Loader2,
  Clock,
  Calendar,
  ExternalLink,
  Target,
  PieChart,
  FolderGit2,
  Zap,
  Check,
  Flame,
  Layers,
  ArrowRight,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';

const YOUTUBE_PLAYLIST_RECOMMENDATIONS = {
  dsa_java: [
    {
      title: 'Complete Java + DSA Bootcamp (Beginner to Advanced)',
      channel: 'Kunal Kushwaha',
      videos: '65+ Comprehensive Videos',
      rating: '4.9 ★ (1.2M+ Students)',
      url: 'https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7mUgf54YjV4b4DQ',
      description: 'Comprehensive Java syntax, OOP, Bitwise operations, Recursion, Sorting, Trees, Graphs, Dynamic Programming & interview solutions.',
      tag: '⭐ Complete 12-Month Java Masterclass'
    },
    {
      title: 'Striver A2Z DSA Course / Playlist',
      channel: 'take U forward (Striver)',
      videos: '100+ Videos',
      rating: '5.0 ★ (Industry Standard)',
      url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz',
      description: 'Step-by-step topic-wise A2Z DSA sheet from basic math to advanced DP & Graph algorithms with code walkthroughs.',
      tag: '🔥 Top Tier Placement Standard'
    },
    {
      title: 'Mastering Data Structures & Algorithms',
      channel: 'Abdul Bari',
      videos: '84 Lectures',
      rating: '4.9 ★ (Legendary Pedagogy)',
      url: 'https://www.youtube.com/playlist?list=PLAXnLdrLnQpRcveZTtD644gM9uzYqJCwr',
      description: 'Crystal-clear chalkboard explanations of algorithmic complexity, recurrence relations, tree rotations, and dynamic programming.',
      tag: '🏛️ Deep Theoretical Foundations'
    },
    {
      title: 'NeetCode 150 & Blind 75 Pattern Mastery',
      channel: 'NeetCode',
      videos: '150 High-Yield Solutions',
      rating: '4.9 ★',
      url: 'https://www.youtube.com/c/NeetCode/playlists',
      description: 'Clean, optimal explanations covering the 18 essential coding patterns asked in Google, Microsoft, and Amazon interviews.',
      tag: '🎯 LeetCode Pattern Blueprint'
    }
  ],
  web_fullstack: [
    {
      title: 'Complete JavaScript & Modern React Mastery',
      channel: 'Chai aur Code (Hitesh Choudhary)',
      videos: '85+ In-depth Episodes',
      rating: '4.9 ★',
      url: 'https://www.youtube.com/playlist?list=PLu71SKxNbfoBuX3f4EOACle2yCjtBgEIO',
      description: 'Hands-on practical full-stack engineering covering modern ES6+, DOM manipulation, React hooks, Redux Toolkit, and production builds.',
      tag: '⭐ Full Stack Front-to-Back'
    },
    {
      title: 'Full Stack Node.js, Express & Database Systems',
      channel: 'freeCodeCamp.org',
      videos: '8+ Hours Complete Course',
      rating: '4.8 ★',
      url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
      description: 'Production backend architecture, REST API design, JWT auth, MongoDB / PostgreSQL schema modeling, and microservice deployment.',
      tag: '🚀 Backend & Cloud Infrastructure'
    }
  ],
  system_design: [
    {
      title: 'System Design Interview & Microservices Architecture',
      channel: 'Gaurav Sen',
      videos: '45+ Videos',
      rating: '4.9 ★',
      url: 'https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX',
      description: 'Distributed systems fundamentals: load balancing, consistent hashing, database sharding, CAP theorem, and message queues.',
      tag: '🏛️ Distributed Systems Core'
    },
    {
      title: 'ByteByteGo Visual System Design Series',
      channel: 'ByteByteGo (Alex Xu)',
      videos: '35+ Visual Animations',
      rating: '4.9 ★',
      url: 'https://www.youtube.com/@ByteByteGo',
      description: 'Visual system design architecture diagrams breaking down large scale platforms like WhatsApp, YouTube, and Uber.',
      tag: '💡 Visual High-Scale Architecture'
    }
  ],
  python_ai: [
    {
      title: 'Complete Data Science & Generative AI Masterclass',
      channel: 'Krish Naik',
      videos: '70+ Videos',
      rating: '4.9 ★',
      url: 'https://www.youtube.com/playlist?list=PLZoTAELRMXVN7mGZtXn3tEevnZ_VlXm4J',
      description: 'Python for AI, Pandas/NumPy, LangChain, HuggingFace Transformers, OpenAI API, Vector Databases (Chroma/Pinecone), and LLMOps.',
      tag: '🤖 Generative AI & Deep Learning'
    }
  ]
};

const SUGGESTED_SKILLS = [
  'DSA in Java (12 Months Complete Mastery)',
  'Full Stack Node.js & React System Architecture',
  'Data Structures & Algorithms in C++',
  'Python for AI & Data Engineering',
  'System Design & Distributed Microservices',
  'DevOps, Kubernetes & Cloud Architecture'
];

export default function RoadmapPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [skillName, setSkillName] = useState('DSA in Java (12 Months Complete Mastery)');
  const [durationWeeks, setDurationWeeks] = useState(48);
  const [dailyHours, setDailyHours] = useState(user?.daily_study_hours || 2);
  const [loading, setLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({ 1: true });
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [syncingPlanner, setSyncingPlanner] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadRoadmaps = async () => {
    try {
      const res = await api.roadmap.getAll();
      if (res.roadmaps && res.roadmaps.length > 0) {
        setRoadmaps(res.roadmaps);
        setActiveRoadmap(res.roadmaps[0]);
      }
    } catch (err) {
      console.error('Failed to load roadmaps:', err);
    }
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!skillName.trim()) return;

    setLoading(true);
    try {
      await api.roadmap.generate({
        skill_name: skillName,
        duration_weeks: durationWeeks,
        daily_hours: dailyHours
      });
      await loadRoadmaps();
    } catch (err) {
      alert('Error generating roadmap: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    try {
      await api.roadmap.toggleTask(taskId, !currentStatus);
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

        const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

        setActiveRoadmap({
          ...activeRoadmap,
          weeks: updatedWeeks,
          progress: newProgress,
          completedTasks: completed,
          totalTasks: total
        });
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const toggleWeekExpand = (weekNum) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekNum]: !prev[weekNum]
    }));
  };

  // 1-Click Automation: Sync active week's daily tasks directly to Study Co-Planner
  const handleSyncToPlanner = async (week) => {
    if (!week || !week.tasks || week.tasks.length === 0) return;
    setSyncingPlanner(true);
    setSyncSuccess(false);

    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const mappedTasks = week.tasks.map((t, idx) => ({
        id: t.id || `task-${Date.now()}-${idx}`,
        day: days[(t.day_number - 1) % 7] || 'Monday',
        time: '18:00 - 20:00',
        description: `[${activeRoadmap.skill_name}] Day ${t.day_number}: ${t.task_description}`,
        is_completed: !!t.is_completed,
        is_ai_suggested: true
      }));

      await api.planner.saveTasks(mappedTasks);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      alert('Failed to sync tasks to study planner: ' + err.message);
    } finally {
      setSyncingPlanner(false);
    }
  };

  // Human-Style Senior Mentor PDF Download
  const handleExportPDF = () => {
    if (!activeRoadmap) return;
    const doc = new jsPDF();
    const studentName = user?.name || 'Engineer';
    const targetRole = user?.target_role || 'Software Engineer';
    const dailyMins = (activeRoadmap.daily_hours || 2) * 60;

    // Page 1: Mentor Cover & Time Distribution
    doc.setFillColor(11, 18, 32);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(59, 130, 246);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CareerMentor AI', 20, 22);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Senior Mentor Curriculum & Execution Blueprint', 20, 30);

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Metadata Card
    doc.setFillColor(23, 32, 51);
    doc.roundedRect(20, 40, 170, 36, 3, 3, 'F');

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text('STUDENT NAME', 26, 48);
    doc.text('TARGET CAREER ROLE', 26, 62);
    doc.text('TOTAL DURATION', 125, 48);
    doc.text('DAILY COMMITMENT', 125, 62);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, 26, 55);
    doc.text(targetRole, 26, 69);
    doc.text(`${activeRoadmap.duration_weeks} Weeks (${activeRoadmap.duration_weeks >= 48 ? '12-Month Masterclass' : activeRoadmap.duration_weeks >= 24 ? '6-Month Track' : 'Sprint'})`, 125, 55);
    doc.text(`${activeRoadmap.daily_hours} Hours/day (${dailyMins} mins)`, 125, 69);

    // Section 1: Study Time Distribution Blueprint
    let y = 88;
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Senior Mentor Time Allocation Framework', 20, y);
    y += 8;

    const timeDist = [
      { category: 'LeetCode / Algorithmic Problem Solving', percent: '40%', time: `${Math.round(dailyMins * 0.4)} mins/day`, focus: 'Pattern mastery (Two Pointers, Sliding Window, Graphs, DP)' },
      { category: 'Hands-on Milestone Portfolio Projects', percent: '25%', time: `${Math.round(dailyMins * 0.25)} mins/day`, focus: 'Building production architectures & testable modules' },
      { category: 'Core Theory & Computer Science Foundations', percent: '25%', time: `${Math.round(dailyMins * 0.25)} mins/day`, focus: 'Memory architecture, Big-O analysis & system invariants' },
      { category: 'Weekly Revision, Mock Testing & Retros', percent: '10%', time: `${Math.round(dailyMins * 0.1)} mins/day`, focus: 'Timed coding simulations and GitHub documentation' }
    ];

    timeDist.forEach(td => {
      doc.setFillColor(23, 32, 51);
      doc.roundedRect(20, y, 170, 14, 2, 2, 'F');
      doc.setTextColor(248, 250, 252);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${td.category} (${td.percent})`, 24, y + 6);
      doc.setTextColor(16, 185, 129);
      doc.text(td.time, 150, y + 6);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Focus: ${td.focus}`, 24, y + 11);
      y += 17;
    });

    // Section 2: Milestone-by-Milestone Day-by-Day Syllabus
    y += 4;
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Day-by-Day Mentor Curriculum & Milestone Projects', 20, y);
    y += 8;

    (activeRoadmap.weeks || []).forEach(w => {
      if (y > 230) {
        doc.addPage();
        doc.setFillColor(11, 18, 32);
        doc.rect(0, 0, 210, 297, 'F');
        y = 20;
      }

      doc.setFillColor(23, 32, 51);
      doc.roundedRect(20, y, 170, 10, 2, 2, 'F');
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Week ${w.week_number}: ${w.title || 'Curriculum Sprint'}`, 24, y + 7);
      y += 14;

      if (w.milestone) {
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`🎯 Milestone Goal: ${w.milestone}`, 22, y);
        y += 6;
      }

      // Milestone Project
      if (w.milestone_project) {
        doc.setTextColor(6, 182, 212);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`🔨 Milestone Project: ${w.milestone_project.title}`, 22, y);
        y += 5;
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const splitDesc = doc.splitTextToSize(`Specs: ${w.milestone_project.description}`, 166);
        doc.text(splitDesc, 24, y);
        y += splitDesc.length * 4 + 2;
      }

      // Day by Day Tasks
      (w.tasks || []).forEach(t => {
        if (y > 270) {
          doc.addPage();
          doc.setFillColor(11, 18, 32);
          doc.rect(0, 0, 210, 297, 'F');
          y = 20;
        }
        const status = t.is_completed ? '[COMPLETED]' : '[PENDING]';
        doc.setTextColor(t.is_completed ? 148 : 248, t.is_completed ? 163 : 250, t.is_completed ? 184 : 252);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', t.is_completed ? 'normal' : 'bold');
        const line = doc.splitTextToSize(`• Day ${t.day_number}: ${t.task_description} ${status}`, 166);
        doc.text(line, 24, y);
        y += line.length * 4.5;
      });

      y += 6;
    });

    doc.save(`CareerMentor_Roadmap_${activeRoadmap.skill_name.replace(/\s+/g, '_')}.pdf`);
  };

  // Pie/Donut Chart Slices Data
  const chartData = [
    {
      id: 'dsa',
      label: 'LeetCode & Algorithmic Problem Solving',
      percent: 40,
      color: '#10B981',
      dailyMins: Math.round(((activeRoadmap?.daily_hours || dailyHours) * 60) * 0.4),
      weeklyHours: (((activeRoadmap?.daily_hours || dailyHours) * 7) * 0.4).toFixed(1),
      guideline: 'High-frequency LeetCode patterns (Two Pointers, Sliding Window, Trees, Graphs, DP). Focus on edge cases and optimal Big-O complexity.'
    },
    {
      id: 'project',
      label: 'Hands-on Milestone Portfolio Projects',
      percent: 25,
      color: '#06B6D4',
      dailyMins: Math.round(((activeRoadmap?.daily_hours || dailyHours) * 60) * 0.25),
      weeklyHours: (((activeRoadmap?.daily_hours || dailyHours) * 7) * 0.25).toFixed(1),
      guideline: 'Apply data structures and system design principles into tangible portfolio applications with test suites and clean architecture.'
    },
    {
      id: 'theory',
      label: 'Core Theory & Language Foundations',
      percent: 25,
      color: '#3B82F6',
      dailyMins: Math.round(((activeRoadmap?.daily_hours || dailyHours) * 60) * 0.25),
      weeklyHours: (((activeRoadmap?.daily_hours || dailyHours) * 7) * 0.25).toFixed(1),
      guideline: 'Master JVM/Memory models, concurrency, database indexing, and underlying mathematical fundamentals.'
    },
    {
      id: 'revision',
      label: 'Weekly Retros, Timed Mock Tests & Buffer',
      percent: 10,
      color: '#8B5CF6',
      dailyMins: Math.round(((activeRoadmap?.daily_hours || dailyHours) * 60) * 0.1),
      weeklyHours: (((activeRoadmap?.daily_hours || dailyHours) * 7) * 0.1).toFixed(1),
      guideline: '45-minute timed interview challenge every Saturday, GitHub commit polishing, and upcoming week sprint planning.'
    }
  ];

  const getRecommendedPlaylists = (skill) => {
    const s = (skill || '').toLowerCase();
    if (s.includes('java') || s.includes('dsa') || s.includes('algorithm') || s.includes('c++')) {
      return YOUTUBE_PLAYLIST_RECOMMENDATIONS.dsa_java;
    }
    if (s.includes('system design') || s.includes('microservice') || s.includes('architecture')) {
      return YOUTUBE_PLAYLIST_RECOMMENDATIONS.system_design;
    }
    if (s.includes('python') || s.includes('ai') || s.includes('data')) {
      return YOUTUBE_PLAYLIST_RECOMMENDATIONS.python_ai;
    }
    return YOUTUBE_PLAYLIST_RECOMMENDATIONS.web_fullstack;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Map className="w-8 h-8 text-[#3B82F6]" />
            Senior Mentor Learning Roadmaps
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Personalized day-by-day curriculum with milestone projects, time distribution analytics, and 1x curated masterclass resources.
          </p>
        </div>

        {activeRoadmap && (
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#172033] to-[#1E293B] hover:from-[#1E293B] hover:to-[#334155] border border-[#3B82F6]/40 text-[#F8FAFC] text-xs sm:text-sm font-bold shadow-lg transition-all self-start md:self-auto"
          >
            <Download className="w-4 h-4 text-[#06B6D4]" />
            Download Mentor Syllabus (PDF)
          </button>
        )}
      </div>

      {/* Generator Form Card */}
      <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#F8FAFC] mb-2">
              Select or Type Your Target Domain / Skill
            </label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. DSA in Java for 12 Months, Full Stack System Design, Python AI"
              className="w-full px-4 py-3 rounded-xl border border-[#1E293B] bg-[#172033] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#F8FAFC] outline-none text-sm transition-all"
            />
            {/* Suggested Skill Chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {SUGGESTED_SKILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSkillName(s);
                    if (s.includes('12 Months')) setDurationWeeks(48);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#172033] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#F8FAFC] mb-2">
                Curriculum Timeline Duration
              </label>
              <select
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#F8FAFC] outline-none text-sm bg-[#172033]"
              >
                <option value={2}>2 Weeks (Fast-track Sprint)</option>
                <option value={4}>4 Weeks (1 Month Standard)</option>
                <option value={8}>8 Weeks (2 Months Core)</option>
                <option value={12}>12 Weeks (3 Months Quarter Mastery)</option>
                <option value={24}>24 Weeks (6 Months Deep-Dive)</option>
                <option value={48}>48 Weeks (12 Months / 1 Year Masterclass - e.g. DSA in Java)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#F8FAFC] mb-2">
                Daily Study Commitment: <span className="text-[#06B6D4] font-extrabold">{dailyHours} hrs/day ({dailyHours * 60} mins)</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseInt(e.target.value, 10))}
                className="w-full accent-[#3B82F6] cursor-pointer mt-3"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 text-white font-bold text-sm shadow-md shadow-[#3B82F6]/25 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Day-by-Day Mentor Curriculum...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  Generate Senior Mentor Roadmap & Projects
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Roadmap View */}
      {activeRoadmap && (
        <div className="space-y-8">
          {/* Progress Header */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#172033] text-[#06B6D4] text-xs font-semibold mb-2 border border-[#06B6D4]/30">
                <Target className="w-3.5 h-3.5" />
                Target Role: {activeRoadmap.target_role}
              </div>
              <h2 className="text-2xl font-black text-[#F8FAFC]">
                {activeRoadmap.skill_name}
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                {activeRoadmap.duration_weeks} Weeks • {activeRoadmap.daily_hours} Hours/day • {activeRoadmap.completedTasks || 0} of {activeRoadmap.totalTasks || 0} tasks completed
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-right">
              <div className="flex justify-between text-xs font-bold text-[#F8FAFC]">
                <span>Overall Completion</span>
                <span className="text-[#06B6D4] font-black">{activeRoadmap.progress || 0}%</span>
              </div>
              <div className="w-full bg-[#0B1220] h-3 rounded-full overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] h-full rounded-full transition-all duration-300"
                  style={{ width: `${activeRoadmap.progress || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* INTERACTIVE TIME DISTRIBUTION SVG DONUT / PIE CHART WITH REALISTIC CURSOR HOVER */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#10B981]" />
                  Where to Spend Your Study Time (Time Distribution Analytics)
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Hover over the chart segments to inspect recommended daily minutes and senior mentor execution guidelines.
                </p>
              </div>
              <span className="text-xs text-[#06B6D4] bg-[#06B6D4]/15 px-3 py-1 rounded-full font-bold border border-[#06B6D4]/30 self-start sm:self-auto">
                Realistic Pacing Model
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* SVG Donut Chart */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                <svg className="w-60 h-60 transform -rotate-90 cursor-pointer drop-shadow-[0_0_20px_rgba(59,130,246,0.15)]" viewBox="0 0 100 100">
                  <defs>
                    <filter id="glow-dsa" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#10B981" floodOpacity="0.5" />
                    </filter>
                    <filter id="glow-proj" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#06B6D4" floodOpacity="0.5" />
                    </filter>
                    <filter id="glow-theory" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#3B82F6" floodOpacity="0.5" />
                    </filter>
                    <filter id="glow-rev" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#8B5CF6" floodOpacity="0.5" />
                    </filter>
                  </defs>

                  {/* Track base */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#1E293B"
                    strokeWidth="8"
                    opacity="0.4"
                  />

                  {/* Circle 1: LeetCode (40%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth={hoveredSlice === 'dsa' ? '15' : '10'}
                    strokeDasharray="40 60"
                    strokeDashoffset="0"
                    filter={hoveredSlice === 'dsa' ? 'url(#glow-dsa)' : undefined}
                    className="transition-all duration-300 hover:opacity-100 opacity-90"
                    onMouseEnter={() => setHoveredSlice('dsa')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                  {/* Circle 2: Projects (25%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#06B6D4"
                    strokeWidth={hoveredSlice === 'project' ? '15' : '10'}
                    strokeDasharray="25 75"
                    strokeDashoffset="-40"
                    filter={hoveredSlice === 'project' ? 'url(#glow-proj)' : undefined}
                    className="transition-all duration-300 hover:opacity-100 opacity-90"
                    onMouseEnter={() => setHoveredSlice('project')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                  {/* Circle 3: Theory (25%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#3B82F6"
                    strokeWidth={hoveredSlice === 'theory' ? '15' : '10'}
                    strokeDasharray="25 75"
                    strokeDashoffset="-65"
                    filter={hoveredSlice === 'theory' ? 'url(#glow-theory)' : undefined}
                    className="transition-all duration-300 hover:opacity-100 opacity-90"
                    onMouseEnter={() => setHoveredSlice('theory')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                  {/* Circle 4: Revision (10%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#8B5CF6"
                    strokeWidth={hoveredSlice === 'revision' ? '15' : '10'}
                    strokeDasharray="10 90"
                    strokeDashoffset="-90"
                    filter={hoveredSlice === 'revision' ? 'url(#glow-rev)' : undefined}
                    className="transition-all duration-300 hover:opacity-100 opacity-90"
                    onMouseEnter={() => setHoveredSlice('revision')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                </svg>

                {/* Donut Center Display */}
                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-black text-[#F8FAFC]">
                    {hoveredSlice ? `${chartData.find(c => c.id === hoveredSlice)?.percent}%` : `${activeRoadmap.daily_hours}h`}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">
                    {hoveredSlice ? chartData.find(c => c.id === hoveredSlice)?.dailyMins + ' mins/day' : 'Daily Study'}
                  </span>
                </div>
              </div>

              {/* Interactive Legend Cards */}
              <div className="lg:col-span-7 space-y-3">
                {chartData.map((item) => {
                  const isHovered = hoveredSlice === item.id;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredSlice(item.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isHovered
                          ? 'bg-[#172033] border-[#3B82F6] shadow-lg scale-[1.01]'
                          : 'bg-[#0B1220] border-[#1E293B] hover:border-[#1E293B]/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs sm:text-sm font-bold text-[#F8FAFC]">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black" style={{ color: item.color }}>
                            {item.percent}%
                          </span>
                          <span className="text-[11px] text-[#94A3B8]">
                            ({item.dailyMins} mins/day)
                          </span>
                        </div>
                      </div>

                      {isHovered && (
                        <div className="mt-2.5 pt-2 border-t border-[#1E293B] text-xs text-[#CBD5E1] leading-relaxed">
                          💡 <strong className="text-[#F8FAFC]">Senior Mentor Advice:</strong> {item.guideline}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* YOUTUBE PLAYLIST RECOMMENDATIONS FOR GOAL & ROLE */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                  <Video className="w-5 h-5 text-rose-500" />
                  Recommended YouTube Playlists for Your Goal & Role
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Curated end-to-end masterclass playlists matched to <strong className="text-[#F8FAFC]">{activeRoadmap.skill_name}</strong>.
                </p>
              </div>
              <span className="text-xs text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full font-bold border border-rose-500/30 self-start sm:self-auto flex items-center gap-1.5">
                <Play className="w-3 h-3 fill-rose-400" />
                100% Free Curated Playlists
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getRecommendedPlaylists(activeRoadmap.skill_name).map((playlist, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] hover:border-rose-500/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        {playlist.tag}
                      </span>
                      <span className="text-[11px] text-[#94A3B8] font-bold">
                        {playlist.rating}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#F8FAFC] group-hover:text-rose-400 transition-colors">
                      {playlist.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                      <span className="font-semibold text-[#CBD5E1]">👤 {playlist.channel}</span>
                      <span>•</span>
                      <span>📺 {playlist.videos}</span>
                    </div>

                    <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                      {playlist.description}
                    </p>
                  </div>

                  <a
                    href={playlist.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Watch Full Playlist on YouTube <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Sync success toast */}
          {syncSuccess && (
            <div className="p-4 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-between text-xs text-[#10B981] font-bold shadow-lg">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                ⚡ Roadmap tasks successfully automated & synced to your Study Co-Planner!
              </span>
              <Link to="/planner" className="underline hover:text-white flex items-center gap-1">
                View Planner <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Accordion Weeks List */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#3B82F6]" />
                Day-by-Day Structured Curriculum & Milestone Projects
              </h3>
              <span className="text-xs text-[#94A3B8]">
                {activeRoadmap.weeks?.length || 0} Total Milestone Weeks
              </span>
            </div>

            {(activeRoadmap.weeks || []).map((week) => {
              const isExpanded = expandedWeeks[week.week_number] ?? (week.week_number === 1);
              return (
                <div
                  key={week.week_number}
                  className="bg-[#111827] rounded-3xl border border-[#1E293B] shadow-xl overflow-hidden transition-all"
                >
                  {/* Week Header */}
                  <button
                    type="button"
                    onClick={() => toggleWeekExpand(week.week_number)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 bg-[#172033]/60 hover:bg-[#172033] text-left transition-colors border-b border-[#1E293B]"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                        Week {week.week_number}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC] mt-0.5">
                        {week.title || `Mastery Module ${week.week_number}`}
                      </h3>
                      {week.milestone && (
                        <p className="text-xs text-[#10B981] font-medium mt-1">
                          🎯 Milestone: {week.milestone}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#94A3B8] transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Week Content */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-6">
                      {/* Milestone Checkpoint Portfolio Project Card */}
                      {week.milestone_project && (
                        <div className="p-5 rounded-2xl bg-[#0B1220] border border-[#06B6D4]/30 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5">
                              <FolderGit2 className="w-4 h-4 text-[#06B6D4]" />
                              Milestone Build Project: {week.milestone_project.title}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(week.milestone_project.tech_stack || []).map((tech, ti) => (
                                <span key={ti} className="px-2 py-0.5 rounded-md bg-[#172033] text-[#06B6D4] text-[10px] font-semibold border border-[#1E293B]">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-[#CBD5E1] leading-relaxed">
                            {week.milestone_project.description}
                          </p>
                          {week.milestone_project.deliverables && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                              {week.milestone_project.deliverables.map((deliv, di) => (
                                <div key={di} className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] bg-[#111827] p-2 rounded-xl border border-[#1E293B]">
                                  <CheckCircle2 className="w-3 h-3 text-[#10B981] flex-shrink-0" />
                                  <span className="truncate">{deliv}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Automation: Sync Active Week to Study Planner */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSyncToPlanner(week)}
                          disabled={syncingPlanner}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/40 text-[#3B82F6] text-xs font-bold transition-all shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          ⚡ Sync Week {week.week_number} to Study Co-Planner
                        </button>
                      </div>

                      {/* Daily Tasks List */}
                      <div className="space-y-4 divide-y divide-[#1E293B]">
                        {(week.tasks || []).map((task) => {
                          let resources = [];
                          if (typeof task.resource_links === 'string') {
                            try { resources = JSON.parse(task.resource_links); } catch {}
                          } else if (Array.isArray(task.resource_links)) {
                            resources = task.resource_links;
                          }

                          return (
                            <div
                              key={task.id}
                              className={`pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                task.is_completed ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleTask(task.id, task.is_completed)}
                                  className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-all ${
                                    task.is_completed
                                      ? 'bg-[#10B981] border-[#10B981] text-white'
                                      : 'border-[#1E293B] hover:border-[#3B82F6]'
                                  }`}
                                >
                                  {task.is_completed && <CheckCircle2 className="w-4 h-4" />}
                                </button>

                                <div>
                                  <span className="text-xs font-bold text-[#94A3B8] block">
                                    Day {task.day_number}
                                  </span>
                                  <p className={`text-sm font-semibold ${task.is_completed ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'}`}>
                                    {task.task_description}
                                  </p>
                                </div>
                              </div>

                              {/* Strict 1x Curated Resource Links on Day 1 */}
                              {resources.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 ml-8 md:ml-0">
                                  {resources.map((res, ri) => (
                                    <a
                                      key={ri}
                                      href={res.url || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                                        res.type === 'video'
                                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                          : res.type === 'practice'
                                          ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/20'
                                          : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30 hover:bg-[#3B82F6]/20'
                                      }`}
                                    >
                                      {res.type === 'video' && <Video className="w-3.5 h-3.5" />}
                                      {res.type === 'practice' && <Code className="w-3.5 h-3.5" />}
                                      {res.type === 'article' && <BookOpen className="w-3.5 h-3.5" />}
                                      <span className="truncate max-w-[140px]">{res.title || 'Resource'}</span>
                                      <ExternalLink className="w-3 h-3 opacity-60" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
