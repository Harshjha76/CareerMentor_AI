import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Mail,
  Loader2,
  AlertCircle,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Zap,
  Bell,
  Edit2,
  Bot,
  User as UserIcon,
  RotateCcw,
  Target,
  BookOpen,
  CheckSquare,
  Square,
  ChevronDown,
  ExternalLink,
  Layers,
  Award
} from 'lucide-react';

const ROLE_SUGGESTIONS = [
  'Full Stack Developer',
  'AI / Machine Learning Engineer',
  'Data Scientist & Analyst',
  'DevOps & Cloud Infrastructure Engineer',
  'Frontend Engineer (React / TypeScript)',
  'Java Backend & Distributed Systems',
  'Python Backend & FastAPIs',
  'Cybersecurity & Ethical Hacking',
  'UI / UX Designer & Product Design',
  'Product Manager (Tech & SaaS)',
  'Mobile App Developer (Flutter / React Native)',
  'UPSC Civil Services Examination',
  'Chartered Accountant (CA Finals / Inter)',
  'IELTS & Academic English Fluency',
  'Guitar & Contemporary Music Theory',
  'Data Structures & Algorithms (LeetCode Prep)',
  'Digital Marketing, SEO & Growth Hacking'
];

export default function PlannerPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // Role, Skill Level & Availability State
  const [targetRole, setTargetRole] = useState(() => {
    return localStorage.getItem('planner_target_role') || user?.target_role || 'Full Stack Developer';
  });
  const [skillLevel, setSkillLevel] = useState('Intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState(7);
  const [selectedMinutes, setSelectedMinutes] = useState(user?.available_study_minutes || 57);

  // Autocomplete UI state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(ROLE_SUGGESTIONS);
  const suggestionsRef = useRef(null);

  // Planner data & UI status
  const [viewMode, setViewMode] = useState('weekly');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [analyzingPlan, setAnalyzingPlan] = useState(false);
  const [planEvaluation, setPlanEvaluation] = useState(null);
  const [applyingOpt, setApplyingOpt] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderToast, setReminderToast] = useState(null);

  // New / Edit task modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDay, setNewTaskDay] = useState('Monday');
  const [newTaskTime, setNewTaskTime] = useState('57 min Block');

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadPlanner();
  }, []);

  // Sync role to localStorage
  useEffect(() => {
    if (targetRole.trim()) {
      localStorage.setItem('planner_target_role', targetRole.trim());
    }
  }, [targetRole]);

  // Click outside suggestions handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleInputChange = (e) => {
    const val = e.target.value;
    setTargetRole(val);
    setGenerationError(null);
    if (val.trim()) {
      const filtered = ROLE_SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase()));
      setFilteredSuggestions(filtered.length > 0 ? filtered : ROLE_SUGGESTIONS);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions(ROLE_SUGGESTIONS);
    }
  };

  const selectSuggestion = (sug) => {
    setTargetRole(sug);
    setShowSuggestions(false);
  };

  const loadPlanner = async () => {
    try {
      const res = await api.planner.get(viewMode);
      if (res.tasks && res.tasks.length > 0) {
        setTasks(res.tasks);
      } else {
        await handleGeneratePlan(targetRole, skillLevel, selectedMinutes, daysPerWeek);
      }
    } catch (err) {
      console.error('Failed to load planner:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (roleToUse = targetRole, levelToUse = skillLevel, minsToUse = selectedMinutes, daysToUse = daysPerWeek) => {
    const roleClean = (roleToUse || '').trim();
    if (!roleClean) {
      setGenerationError('Please enter a role or domain (e.g. Full Stack Developer, AI/ML, UPSC, Guitar) to generate a realistic plan.');
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    try {
      const res = await api.planner.generateAI({
        target_role: roleClean,
        skill_level: levelToUse,
        session_minutes: minsToUse,
        days_per_week: daysToUse
      });

      if (res && res.tasks) {
        setTasks(res.tasks);
        setReminderToast({
          title: `Study Plan Generated for ${roleClean}!`,
          body: `7-day structured progression (${minsToUse}m/day) initialized with actionable checklists.`,
          to: user?.email
        });
        setTimeout(() => setReminderToast(null), 6000);
      }
    } catch (err) {
      setGenerationError(err.message || 'Failed to generate AI study plan. Please check your connection and retry.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyzePlan = async () => {
    setAnalyzingPlan(true);
    try {
      const res = await api.planner.analyze(tasks);
      setPlanEvaluation(res.evaluation);
    } catch (err) {
      alert('Failed to evaluate plan: ' + err.message);
    } finally {
      setAnalyzingPlan(false);
    }
  };

  const handleApplyAIOptimization = async () => {
    if (!planEvaluation?.optimized_tasks) return;
    setApplyingOpt(true);
    try {
      await api.planner.optimize(planEvaluation.optimized_tasks);
      setTasks(planEvaluation.optimized_tasks);
      setPlanEvaluation(null);
      setReminderToast({
        title: 'Plan Optimized by AI!',
        body: 'Your weekly schedule has been calibrated with review buffer sessions.',
        to: user?.email
      });
      setTimeout(() => setReminderToast(null), 6000);
    } catch (err) {
      alert('Failed to apply optimization: ' + err.message);
    } finally {
      setApplyingOpt(false);
    }
  };

  const toggleDayStatus = async (taskId) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.is_completed;
        return {
          ...t,
          is_completed: nextCompleted,
          status: nextCompleted ? 'completed' : 'pending',
          subtasks: (t.subtasks || []).map(st => ({ ...st, is_completed: nextCompleted }))
        };
      }
      return t;
    });
    setTasks(updated);
    try {
      await api.planner.saveTasks(updated);
    } catch (err) {
      console.error('Failed to save tasks:', err);
    }
  };

  const toggleSubtaskStatus = async (taskId, subtaskId) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = (t.subtasks || []).map(st => {
          if (st.id === subtaskId) {
            return { ...st, is_completed: !st.is_completed };
          }
          return st;
        });
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.is_completed);
        return {
          ...t,
          subtasks: updatedSubtasks,
          is_completed: allCompleted,
          status: allCompleted ? 'completed' : 'pending'
        };
      }
      return t;
    });
    setTasks(updated);
    try {
      await api.planner.saveTasks(updated);
    } catch (err) {
      console.error('Failed to save subtask status:', err);
    }
  };

  const deleteTask = async (taskId) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    try {
      await api.planner.saveTasks(updated);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setNewTaskDesc('');
    setNewTaskDay('Monday');
    setNewTaskTime(`${selectedMinutes} min Block`);
    setModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTaskId(task.id);
    setNewTaskDesc(task.topic || task.description || '');
    setNewTaskDay(task.day || 'Monday');
    setNewTaskTime(task.time || `${selectedMinutes} min Block`);
    setModalOpen(true);
  };

  const handleSaveTaskModal = async (e) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;

    let updated;
    if (editingTaskId) {
      updated = tasks.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            day: newTaskDay,
            time: newTaskTime,
            topic: newTaskDesc,
            description: newTaskDesc
          };
        }
        return t;
      });
    } else {
      const newTask = {
        id: `task-${Date.now()}`,
        day: newTaskDay,
        time: newTaskTime,
        topic: newTaskDesc,
        type: 'practice',
        duration_minutes: selectedMinutes,
        description: newTaskDesc,
        subtasks: [
          {
            id: `subtask-${Date.now()}-1`,
            title: newTaskDesc,
            duration_minutes: selectedMinutes,
            resource: 'User Assigned Resource',
            done_when: 'Completed and verified',
            is_completed: false
          }
        ],
        is_completed: false,
        status: 'pending',
        is_ai_suggested: false
      };
      updated = [...tasks, newTask];
    }

    setTasks(updated);
    setModalOpen(false);
    setEditingTaskId(null);
    setNewTaskDesc('');

    try {
      await api.planner.saveTasks(updated);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleAdaptTimeAvailability = async (mins) => {
    setSelectedMinutes(mins);
    handleGeneratePlan(targetRole, skillLevel, mins, daysPerWeek);
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const res = await api.reminders.sendTest();
      setReminderToast({
        title: 'Reminder Notification Dispatched!',
        body: res.body,
        to: res.to
      });
      setTimeout(() => setReminderToast(null), 7000);
    } catch (err) {
      alert('Failed to send reminder: ' + err.message);
    } finally {
      setSendingReminder(false);
    }
  };

  const handle2HourCheckin = async () => {
    try {
      const res = await api.reminders.checkin2h();
      setReminderToast({
        title: res.title || '2-Hour Study Check-in Alert',
        body: res.body,
        to: user?.email
      });
      setTimeout(() => setReminderToast(null), 8000);
    } catch (err) {
      alert('Failed to trigger checkin: ' + err.message);
    }
  };

  // Helper for Day Type badge styling
  const getTypeBadge = (type) => {
    switch (type) {
      case 'learn':
        return { label: '📖 Learn & Fundamentals', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'practice':
        return { label: '⚡ Guided Practice', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'project':
        return { label: '🛠️ Hands-on Project', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'mock test':
        return { label: '🎯 Timed Mock / Challenge', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'revision':
        return { label: '🔄 Weekly Retrospective', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      default:
        return { label: '📌 Study Block', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Toast Notification */}
      {reminderToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#111827] rounded-2xl border border-[#06B6D4] shadow-2xl p-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/20 text-[#06B6D4] flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#F8FAFC]">{reminderToast.title}</h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">Recipient: {reminderToast.to}</p>
              <div className="mt-2 p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs text-[#F8FAFC] leading-relaxed font-medium">
                "{reminderToast.body}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Human + AI Co-Planning Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-[#3B82F6]" />
            Personalized Weekly Study Planner
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Build a realistic, non-repeating, progression-based study arc tailored to your target domain with step-by-step checklist subtasks and free resources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleAnalyzePlan}
            disabled={analyzingPlan}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 text-white text-xs font-bold shadow-md shadow-[#3B82F6]/25 transition-all"
          >
            {analyzingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
            Analyze Plan with AI
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#172033] border border-[#1E293B] text-[#F8FAFC] hover:bg-[#1E293B] text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
            Add Task Manually
          </button>

          <button
            onClick={handle2HourCheckin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all"
            title="Simulate 2-Hour Autonomous AI Agent Study Alert"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            2h Alert Test
          </button>

          <button
            onClick={handleSendReminder}
            disabled={sendingReminder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-sm transition-all"
          >
            {sendingReminder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            Send Reminder Email
          </button>
        </div>
      </div>

      {/* 1. DYNAMIC TARGET ROLE & DOMAIN INPUT BAR */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#111827] border border-[#1E293B] shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white">Target Role, Exam, or Learning Goal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Role Autocomplete Input */}
          <div className="md:col-span-5 relative" ref={suggestionsRef}>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Enter your role or domain (Jobs, Internships, Exams, or Skills)
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetRole}
                onChange={handleRoleInputChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder="e.g. Full Stack Developer, AI/ML, UPSC, Guitar, CA..."
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none placeholder-[#94A3B8]/50 font-medium"
              />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl p-1.5 space-y-0.5">
                {filteredSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectSuggestion(sug)}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-blue-600 hover:text-white transition-colors text-slate-300"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Skill Level Selector */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Current Skill Level
            </label>
            <div className="grid grid-cols-3 gap-1 bg-[#172033] p-1 rounded-xl border border-[#1E293B]">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSkillLevel(lvl)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    skillLevel === lvl
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Active Days Per Week */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Days / Week
            </label>
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] outline-none font-semibold"
            >
              <option value={7}>7 Days (Full Sprint)</option>
              <option value={6}>6 Days (Mon - Sat)</option>
              <option value={5}>5 Days (Weekdays)</option>
              <option value={4}>4 Days (Accelerated)</option>
              <option value={3}>3 Days (Weekend / Light)</option>
            </select>
          </div>

          {/* Generate Plan CTA */}
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => handleGeneratePlan(targetRole, skillLevel, selectedMinutes, daysPerWeek)}
              disabled={generating}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Plan
            </button>
          </div>
        </div>

        {/* Inline Error State */}
        {generationError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generationError}</span>
          </div>
        )}
      </div>

      {/* 2. VELOCITY & SESSION BUDGET CONTROL BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#F8FAFC]">Active Role Curriculum:</span>
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                {targetRole}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Level: <strong className="text-white">{skillLevel}</strong> • Days: <strong className="text-white">{daysPerWeek}d/wk</strong> • Daily Budget: <strong className="text-emerald-400">{selectedMinutes} mins</strong>
            </p>
          </div>
        </div>

        {/* Flexible Availability Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#94A3B8] flex items-center gap-1 mr-1">
            <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
            Session Budget:
          </span>
          {[30, 45, 57, 90, 120].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleAdaptTimeAvailability(mins)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedMinutes === mins
                  ? 'bg-[#3B82F6] text-white shadow-md ring-2 ring-[#3B82F6]/30'
                  : 'bg-[#172033] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] border border-[#1E293B]'
              }`}
            >
              {mins}m {mins === 57 && '⚡'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleGeneratePlan(targetRole, skillLevel, selectedMinutes, daysPerWeek)}
            disabled={generating}
            className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#172033] hover:bg-[#1E293B] text-[#F8FAFC] border border-[#1E293B] text-xs font-bold transition-all"
            title="Regenerate whole plan with AI"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 text-[#06B6D4]" />}
            Regenerate AI
          </button>
        </div>
      </div>

      {/* AI STRATEGIC CO-PLANNING ANALYSIS CARD (Pros & Cons) */}
      {planEvaluation && (
        <div className="bg-[#111827] rounded-3xl border border-[#06B6D4]/50 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] text-xs font-extrabold mb-1 border border-[#06B6D4]/30">
                <Zap className="w-3.5 h-3.5 text-[#06B6D4]" /> Co-Pilot Evaluation
              </div>
              <h3 className="text-xl font-black text-[#F8FAFC]">
                AI Strategic Evaluation for {targetRole}
              </h3>
            </div>

            <button
              onClick={handleApplyAIOptimization}
              disabled={applyingOpt}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#10B981]/25 transition-all self-start sm:self-auto"
            >
              {applyingOpt ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Apply AI Optimization
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pros / Strengths */}
            <div className="p-5 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 space-y-3">
              <h4 className="font-extrabold text-sm text-[#10B981] flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-[#10B981]" />
                Strengths of this Schedule
              </h4>
              <ul className="space-y-2 text-xs text-[#F8FAFC]">
                {(planEvaluation.pros || []).map((pro, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#10B981] font-bold">✓</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons / Risks */}
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
              <h4 className="font-extrabold text-sm text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Identified Blindspots & Risks
              </h4>
              <ul className="space-y-2 text-xs text-[#F8FAFC]">
                {(planEvaluation.cons || []).map((con, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">⚠</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-5 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-2">
            <h4 className="font-extrabold text-sm text-[#F8FAFC] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Strategic Recommendations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {(planEvaluation.recommendations || []).map((rec, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#172033] border border-[#1E293B] text-xs text-[#94A3B8] leading-snug">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. PROGRESSION-BASED SCHEDULE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {DAYS.map((dayName, dIdx) => {
          const dayTask = tasks.find(t => t.day === dayName);
          const isDayCompleted = !!dayTask?.is_completed;
          const badgeInfo = getTypeBadge(dayTask?.type);

          return (
            <div
              key={dayName}
              className={`bg-[#111827] rounded-3xl border transition-all shadow-xl p-5 flex flex-col justify-between space-y-4 ${
                isDayCompleted
                  ? 'border-emerald-500/40 bg-[#111827]/90'
                  : 'border-[#1E293B] hover:border-blue-500/40'
              }`}
            >
              <div className="space-y-3.5">
                {/* Day Header Row */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#1E293B]">
                  <div>
                    <span className="font-black text-sm text-white block">{dayName}</span>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeInfo.bg}`}>
                      {badgeInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {dayTask && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(dayTask)}
                          title="Edit Session Topic"
                          className="text-[#94A3B8] hover:text-[#3B82F6] transition-colors p-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDayStatus(dayTask.id)}
                          title="Mark Entire Day Completed"
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isDayCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-[#1E293B] hover:border-emerald-500'
                          }`}
                        >
                          {isDayCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Day Topic Title */}
                {dayTask ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
                        <Clock className="w-3 h-3" />
                        <span>{dayTask.duration_minutes || selectedMinutes} mins total</span>
                      </div>
                      <h3 className={`text-xs sm:text-sm font-bold leading-snug ${isDayCompleted ? 'line-through text-[#94A3B8]' : 'text-white'}`}>
                        {dayTask.topic || dayTask.description}
                      </h3>
                      {dayTask.description && dayTask.description !== dayTask.topic && (
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {dayTask.description}
                        </p>
                      )}
                    </div>

                    {/* Subtasks Checklist */}
                    {dayTask.subtasks && dayTask.subtasks.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[#1E293B]/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Checklist Subtasks ({dayTask.subtasks.filter(s => s.is_completed).length}/{dayTask.subtasks.length}):
                        </span>
                        <div className="space-y-2">
                          {dayTask.subtasks.map((st) => (
                            <div
                              key={st.id}
                              className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-colors ${
                                st.is_completed
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                                  : 'bg-[#0B1220] border-[#1E293B] text-slate-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleSubtaskStatus(dayTask.id, st.id)}
                                  className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-400 transition-colors"
                                >
                                  {st.is_completed ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`font-semibold leading-tight ${st.is_completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                                      {st.title}
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-400 shrink-0 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                      {st.duration_minutes}m
                                    </span>
                                  </div>

                                  {/* Resource pill & Done-when criteria */}
                                  {st.resource && (
                                    <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1 truncate">
                                      <BookOpen className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                      <span className="truncate">{st.resource}</span>
                                    </div>
                                  )}
                                  {st.done_when && (
                                    <div className="mt-0.5 text-[10px] text-amber-300/80 leading-tight">
                                      🎯 Done when: {st.done_when}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Rest / Buffer Day
                  </div>
                )}
              </div>

              {dayTask && (
                <div className="pt-2 border-t border-[#1E293B]/70 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    {dayTask.is_ai_suggested ? '🤖 AI Architected' : '👤 Custom Added'}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteTask(dayTask.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Day Plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual & Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#F8FAFC]">
            <h3 className="text-lg font-bold text-[#F8FAFC]">
              {editingTaskId ? 'Edit Study Session' : 'Add Custom Study Task'}
            </h3>

            <form onSubmit={handleSaveTaskModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                  Session Topic / Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="e.g. Master React Custom Hooks and solve 3 LeetCode Mediums"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none placeholder-[#94A3B8]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">Day of Week</label>
                  <select
                    value={newTaskDay}
                    onChange={(e) => setNewTaskDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#1E293B] text-xs bg-[#172033] text-[#F8FAFC] outline-none font-medium"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">Duration Block</label>
                  <input
                    type="text"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    placeholder="e.g. 57 min Block"
                    className="w-full px-3 py-2 rounded-xl border border-[#1E293B] bg-[#172033] text-xs text-[#F8FAFC] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#1E293B] text-xs font-semibold text-[#94A3B8] hover:bg-[#172033]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-sm"
                >
                  {editingTaskId ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
