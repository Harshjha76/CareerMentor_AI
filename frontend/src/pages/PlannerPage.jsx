import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGoal } from '../context/GoalContext';
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
  Award,
  RefreshCw,
  FolderGit2,
  Check
} from 'lucide-react';

const ROLE_SUGGESTIONS = [
  'Full Stack Developer',
  'AI / Machine Learning Engineer',
  'DSA in Java',
  'Data Analyst & SQL',
  'DevOps & Cloud Infrastructure',
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
  'Guitar & Contemporary Music Theory'
];

const PRESET_CHIPS = [
  'Full Stack Developer',
  'AI / Machine Learning',
  'DSA in Java',
  'Data Analyst & SQL',
  'DevOps & Cloud',
  'Cybersecurity'
];

export default function PlannerPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { goal, updateGoal, setDomain, setDailyMinutes } = useGoal();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active week selection
  const urlWeek = parseInt(searchParams.get('week'), 10);
  const activeWeekNumber = !isNaN(urlWeek) && urlWeek > 0 ? urlWeek : (goal.current_week || 1);

  // Search & input states
  const [roleInput, setRoleInput] = useState(goal.domain || 'DSA in Java');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(ROLE_SUGGESTIONS);
  const suggestionsRef = useRef(null);

  // Planner data & loading
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [weekTasks, setWeekTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingWeek, setRegeneratingWeek] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderToast, setReminderToast] = useState(null);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Sync roleInput with goal.domain
  useEffect(() => {
    if (goal.domain && goal.domain !== roleInput) {
      setRoleInput(goal.domain);
    }
  }, [goal.domain]);

  // Load Roadmap & Week Tasks
  useEffect(() => {
    loadPlannerData();
  }, [goal.domain, activeWeekNumber, goal.duration_weeks, goal.daily_minutes]);

  // Click outside suggestions
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
    setRoleInput(val);
    if (val.trim()) {
      const filtered = ROLE_SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase()));
      setFilteredSuggestions(filtered.length > 0 ? filtered : ROLE_SUGGESTIONS);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions(ROLE_SUGGESTIONS);
    }
  };

  const selectSuggestion = (sug) => {
    setRoleInput(sug);
    setShowSuggestions(false);
    updateGoal({ domain: sug, current_week: 1 });
    setSearchParams({ week: '1' });
    triggerNewPlanForDomain(sug);
  };

  const handleSelectChip = (chip) => {
    setRoleInput(chip);
    updateGoal({ domain: chip, current_week: 1 });
    setSearchParams({ week: '1' });
    triggerNewPlanForDomain(chip);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!roleInput.trim()) return;
    setShowSuggestions(false);
    updateGoal({ domain: roleInput.trim(), current_week: 1 });
    setSearchParams({ week: '1' });
    triggerNewPlanForDomain(roleInput.trim());
  };

  const triggerNewPlanForDomain = async (domain) => {
    setLoading(true);
    try {
      await api.roadmap.generate({
        skill_name: domain,
        duration_weeks: goal.duration_weeks || 12,
        daily_minutes: goal.daily_minutes || 60,
        skill_level: goal.level || 'Intermediate'
      });
      await loadPlannerData();
    } catch (err) {
      console.error('Failed to generate roadmap for domain:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlannerData = async () => {
    setLoading(true);
    try {
      const res = await api.roadmap.getAll();
      const allRoadmaps = res.roadmaps || [];
      
      let current = allRoadmaps.find(
        r => r.skill_name?.toLowerCase() === goal.domain?.toLowerCase()
      ) || allRoadmaps[0];

      if (!current) {
        await api.roadmap.generate({
          skill_name: goal.domain || 'DSA in Java',
          duration_weeks: goal.duration_weeks || 12,
          daily_minutes: goal.daily_minutes || 60,
          skill_level: goal.level || 'Intermediate'
        });
        const fresh = await api.roadmap.getAll();
        current = fresh.roadmaps?.[0];
      }

      if (current) {
        setActiveRoadmap(current);
        const selectedWeek = (current.weeks || []).find(w => w.week_number === activeWeekNumber) || current.weeks?.[0];
        setWeekTasks(selectedWeek?.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load planner data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWeek = (weekNum) => {
    updateGoal({ current_week: weekNum });
    setSearchParams({ week: weekNum.toString() });
  };

  const toggleSubtask = async (taskId, subtaskId, currentStatus) => {
    try {
      const res = await api.roadmap.toggleSubtask(taskId, subtaskId, !currentStatus);
      setWeekTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const updatedSubs = (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, is_completed: !currentStatus } : st);
          const allDone = updatedSubs.length > 0 && updatedSubs.every(st => !!st.is_completed);
          return {
            ...t,
            subtasks: updatedSubs,
            is_completed: allDone || (res.task_completed !== undefined ? res.task_completed : t.is_completed)
          };
        }
        return t;
      }));
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    try {
      await api.roadmap.toggleTask(taskId, !currentStatus);
      setWeekTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const newStatus = !currentStatus;
          const updatedSubs = (t.subtasks || []).map(st => ({ ...st, is_completed: newStatus }));
          return { ...t, is_completed: newStatus, subtasks: updatedSubs };
        }
        return t;
      }));
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleRegenerateWeek = async () => {
    if (!activeRoadmap) return;
    setRegeneratingWeek(true);
    try {
      const res = await api.roadmap.regenerateWeek({
        roadmap_id: activeRoadmap.id,
        week_number: activeWeekNumber,
        skill_name: goal.domain,
        total_weeks: goal.duration_weeks,
        daily_minutes: goal.daily_minutes,
        skill_level: goal.level
      });
      if (res && res.week && res.week.tasks) {
        setWeekTasks(res.week.tasks);
      }
    } catch (err) {
      alert('Failed to regenerate week: ' + err.message);
    } finally {
      setRegeneratingWeek(false);
    }
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    setReminderToast(null);
    try {
      const res = await api.reminders.triggerToday();
      setReminderToast({
        title: 'Study Reminder Dispatched 🚀',
        body: `Sent to ${res.user?.email || user?.email || 'your email'}.`
      });
      setTimeout(() => setReminderToast(null), 6000);
    } catch (err) {
      alert('Failed to trigger reminder: ' + err.message);
    } finally {
      setSendingReminder(false);
    }
  };

  const totalTasks = weekTasks.length;
  const completedCount = weekTasks.filter(t => !!t.is_completed).length;
  const weekProgressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const totalWeeksCount = activeRoadmap?.duration_weeks || goal.duration_weeks || 12;

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
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Reminder Toast */}
      {reminderToast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm bg-[#111827] border border-[#06B6D4] rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[#F8FAFC]">{reminderToast.title}</div>
              <div className="text-[11px] text-[#94A3B8]">{reminderToast.body}</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B]/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#3B82F6]">
                Human + AI Collaborative Co-Planner
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#F8FAFC] flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-[#06B6D4]" />
              Weekly AI Study Co-Planner
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
              7 scheduled daily modules per week, synchronized with your Roadmap and Session Budget.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSendReminder}
              disabled={sendingReminder}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-[#172033] border border-[#1E293B] text-xs font-bold text-[#CBD5E1] transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-4 h-4 text-[#06B6D4]" />
              <span>Send Daily Email Alert</span>
            </button>
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 text-xs font-bold text-white shadow-lg shadow-[#3B82F6]/20 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>View Full Roadmap →</span>
            </Link>
          </div>
        </div>

        {/* Role / Domain Search & Autocomplete Bar */}
        <div className="bg-[#111827]/90 backdrop-blur-md rounded-3xl border border-[#1E293B] p-6 sm:p-7 shadow-2xl space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative space-y-3">
            <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block">
              Enter Any Target Role, Domain, or Skill to Plan
            </label>
            <div className="flex flex-col sm:flex-row gap-3 relative" ref={suggestionsRef}>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={roleInput}
                  onChange={handleRoleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="e.g. Full Stack Developer, DSA in Java, DevOps, AI/ML, UPSC, CA, Guitar..."
                  className="w-full px-4 py-3 rounded-xl bg-[#090D16] border border-[#1E293B] text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all"
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-50 p-2 space-y-1">
                    {filteredSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => selectSuggestion(sug)}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#172033] transition-colors flex items-center justify-between"
                      >
                        <span>{sug}</span>
                        <ArrowRight className="w-3 h-3 text-[#64748B]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#3B82F6]/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate Co-Plan</span>
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#64748B] mr-1">Quick Select:</span>
              {PRESET_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSelectChip(chip)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    goal.domain?.toLowerCase() === chip.toLowerCase()
                      ? 'bg-[#3B82F6]/20 border-[#3B82F6]/50 text-[#60A5FA]'
                      : 'bg-[#090D16] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-slate-700'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Week Selector Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">
              Select Study Week
            </span>
            <span className="text-xs text-[#60A5FA] font-bold">
              Active: Week {activeWeekNumber} of {totalWeeksCount}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {Array.from({ length: totalWeeksCount }, (_, i) => i + 1).map((wNum) => {
              const isSelected = wNum === activeWeekNumber;
              return (
                <button
                  key={wNum}
                  onClick={() => handleSelectWeek(wNum)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30 scale-105'
                      : 'bg-[#111827] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-slate-700'
                  }`}
                >
                  Week {wNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Week Banner & Single-Week AI Regeneration */}
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider">
                Week {activeWeekNumber} Overview
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] text-xs font-bold border border-[#10B981]/30">
                {weekProgressPct}% Week Completed
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#F8FAFC]">
              {activeRoadmap?.weeks?.find(w => w.week_number === activeWeekNumber)?.title || `Week ${activeWeekNumber} Study Module`}
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Daily commitment: <strong className="text-[#06B6D4]">{goal.daily_minutes || 60} mins/day</strong> ({completedCount} of {totalTasks} days completed)
            </p>
          </div>

          <button
            onClick={handleRegenerateWeek}
            disabled={regeneratingWeek}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#172033] hover:bg-[#1E293B] border border-[#3B82F6]/40 text-[#60A5FA] text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {regeneratingWeek ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Regenerate AI Week {activeWeekNumber}</span>
          </button>
        </div>

        {/* 7 Daily Cards List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
            <span className="text-xs font-semibold">Loading daily study arc...</span>
          </div>
        ) : weekTasks.length === 0 ? (
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-12 text-center space-y-4">
            <CalendarIcon className="w-12 h-12 text-[#3B82F6] mx-auto opacity-60" />
            <h3 className="text-lg font-bold text-[#F8FAFC]">No Tasks for Week {activeWeekNumber}</h3>
            <button
              onClick={handleRegenerateWeek}
              className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow"
            >
              Generate Week {activeWeekNumber} Tasks
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {weekTasks.map((task) => {
              const isDone = !!task.is_completed;
              const cleanTopic = (task.topic || task.task_description || '').replace(/^Day\s*\d+\s*:\s*/i, '');
              const dayName = task.day || DAYS[task.day_number - 1] || 'Monday';

              return (
                <div
                  key={task.id || task.day_number}
                  className={`p-5 rounded-3xl border transition-all space-y-4 ${
                    isDone
                      ? 'bg-[#111827]/60 border-emerald-500/20 opacity-80'
                      : 'bg-[#111827] border-[#1E293B] hover:border-[#3B82F6]/50 shadow-xl'
                  }`}
                >
                  {/* Top Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B]/70 pb-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id, isDone)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                          isDone
                            ? 'bg-[#10B981] border-[#10B981] text-white shadow-sm'
                            : 'border-[#1E293B] bg-[#090D16] hover:border-[#3B82F6] text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#090D16] text-[#F8FAFC] text-xs font-black border border-[#1E293B]">
                          Day {task.day_number} ({dayName})
                        </span>
                        {getTypeBadge(task.type)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                      <Clock className="w-4 h-4 text-[#3B82F6]" />
                      <span className="font-bold text-[#F8FAFC]">{task.duration_minutes || goal.daily_minutes || 60} mins</span>
                    </div>
                  </div>

                  {/* Clean Topic & Done When */}
                  <div className="pl-9 space-y-1">
                    <h3 className={`text-sm sm:text-base font-bold ${isDone ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'}`}>
                      {cleanTopic}
                    </h3>
                    {task.done_when && (
                      <p className="text-xs text-[#94A3B8] flex items-center gap-1.5">
                        <span className="text-[#06B6D4] font-semibold">Done when:</span>
                        <span>{task.done_when}</span>
                      </p>
                    )}
                  </div>

                  {/* Subtasks Checklist */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="pl-9 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase text-[#64748B] tracking-wider block">
                        Actionable Subtasks ({task.duration_minutes || goal.daily_minutes || 60} mins total):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {task.subtasks.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => toggleSubtask(task.id, st.id, st.is_completed)}
                            className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                              st.is_completed
                                ? 'bg-[#090D16]/50 border-emerald-500/20 text-[#64748B] line-through'
                                : 'bg-[#090D16] border-[#1E293B] text-[#CBD5E1] hover:border-[#3B82F6]/50 hover:bg-[#111827]'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                                st.is_completed ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#1E293B]'
                              }`}>
                                {st.is_completed && <Check className="w-3 h-3" />}
                              </div>
                              <span className="font-semibold text-xs leading-snug line-clamp-2">{st.title}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-1 border-t border-[#1E293B]/60">
                              <span className="text-[#06B6D4] font-bold">{st.duration_minutes}m</span>
                              {st.resource && (
                                <span className="text-[10px] text-[#64748B] truncate max-w-[100px]">Ref linked</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
