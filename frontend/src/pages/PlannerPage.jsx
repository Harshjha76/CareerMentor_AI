import React, { useState, useEffect } from 'react';
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
  RotateCcw
} from 'lucide-react';

export default function PlannerPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [viewMode, setViewMode] = useState('weekly');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analyzingPlan, setAnalyzingPlan] = useState(false);
  const [planEvaluation, setPlanEvaluation] = useState(null);
  const [applyingOpt, setApplyingOpt] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderToast, setReminderToast] = useState(null);
  const [selectedMinutes, setSelectedMinutes] = useState(user?.available_study_minutes || 57);

  // New / Edit task modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDay, setNewTaskDay] = useState('Monday');
  const [newTaskTime, setNewTaskTime] = useState('18:00 - 19:00');

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadPlanner();
  }, []);

  const loadPlanner = async () => {
    try {
      const res = await api.planner.get(viewMode);
      if (res.tasks && res.tasks.length > 0) {
        setTasks(res.tasks);
      } else {
        await handleGenerateAIPlan();
      }
    } catch (err) {
      console.error('Failed to load planner:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIPlan = async () => {
    setGenerating(true);
    try {
      const res = await api.planner.generateAI();
      setTasks(res.tasks || []);
    } catch (err) {
      alert('Error generating plan: ' + err.message);
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
        body: 'Your weekly schedule has been calibrated with system design and review buffer sessions.',
        to: user?.email
      });
      setTimeout(() => setReminderToast(null), 6000);
    } catch (err) {
      alert('Failed to apply optimization: ' + err.message);
    } finally {
      setApplyingOpt(false);
    }
  };

  const toggleTaskStatus = async (taskId) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.is_completed ? 'pending' : 'completed';
        return {
          ...t,
          is_completed: !t.is_completed,
          status: nextStatus
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
    setNewTaskDesc(task.description);
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
        description: newTaskDesc,
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
    const updated = tasks.map(t => ({
      ...t,
      time: `${mins} min block`
    }));
    setTasks(updated);
    try {
      await api.planner.saveTasks(updated);
      setReminderToast({
        title: `Plan Adapted to ${mins} Minutes!`,
        body: `All study sessions have been calibrated to ${mins} minute deep-work blocks.`,
        to: user?.email
      });
      setTimeout(() => setReminderToast(null), 5000);
    } catch (err) {
      console.error('Failed to save adapted tasks:', err);
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Toast */}
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
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-[#3B82F6]" />
            {t('planner.title')}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            {t('planner.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Analyze Plan with AI (Pros & Cons) */}
          <button
            onClick={handleAnalyzePlan}
            disabled={analyzingPlan}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:opacity-90 text-white text-xs font-bold shadow-md shadow-[#3B82F6]/25 transition-all"
          >
            {analyzingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
            {t('planner.btn_analyze_plan')}
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#172033] border border-[#1E293B] text-[#F8FAFC] hover:bg-[#1E293B] text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
            {t('planner.btn_add_task')}
          </button>

          <button
            onClick={handle2HourCheckin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all"
            title="Simulate 2-Hour Autonomous AI Agent Study Alert"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {t('planner.btn_checkin_2h')}
          </button>

          <button
            onClick={handleSendReminder}
            disabled={sendingReminder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-sm transition-all"
          >
            {sendingReminder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {t('planner.btn_send_reminder')}
          </button>
        </div>
      </div>

      {/* Human + AI Collaborative Velocity & Availability Control Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#F8FAFC]">Human + AI Co-Planning Velocity</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                Active Co-Pilot
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              👤 <strong className="text-[#F8FAFC]">{tasks.filter(t => !t.is_ai_suggested).length}</strong> Human Tasks • 🤖 <strong className="text-[#06B6D4]">{tasks.filter(t => !!t.is_ai_suggested).length}</strong> AI Tasks • Total: <strong className="text-[#F8FAFC]">{tasks.length}</strong>
            </p>
          </div>
        </div>

        {/* Flexible Availability Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#94A3B8] flex items-center gap-1 mr-1">
            <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
            Session Budget:
          </span>
          {[30, 45, 57, 90].map((mins) => (
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
            onClick={handleGenerateAIPlan}
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
                {t('planner.analysis_title')}
              </h3>
            </div>

            <button
              onClick={handleApplyAIOptimization}
              disabled={applyingOpt}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#10B981]/25 transition-all self-start sm:self-auto"
            >
              {applyingOpt ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {t('planner.btn_apply_ai')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pros / Strengths */}
            <div className="p-5 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 space-y-3">
              <h4 className="font-extrabold text-sm text-[#10B981] flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-[#10B981]" />
                {t('planner.pros_heading')}
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
                {t('planner.cons_heading')}
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
              {t('planner.recs_heading')}
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

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {DAYS.map((day) => {
          const dayTasks = tasks.filter(t => t.day === day);
          return (
            <div
              key={day}
              className="bg-[#111827] rounded-2xl border border-[#1E293B] shadow-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E293B]">
                  <span className="font-extrabold text-sm text-[#F8FAFC]">{day}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#172033] text-[#94A3B8] border border-[#1E293B]">
                    {dayTasks.length} tasks
                  </span>
                </div>

                <div className="space-y-3 min-h-[140px]">
                  {dayTasks.length === 0 ? (
                    <div className="text-center py-8 text-[#94A3B8]/60 text-xs">
                      No tasks scheduled
                    </div>
                  ) : (
                    dayTasks.map((task) => {
                      const isCompleted = !!task.is_completed;
                      const isAI = !!task.is_ai_suggested;
                      return (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-2xl border text-xs transition-all ${
                            isCompleted
                              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#F8FAFC]'
                              : 'bg-[#0B1220]/70 border-[#1E293B] hover:border-[#3B82F6]/50 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-semibold text-[#94A3B8] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#3B82F6]" /> {task.time || `${selectedMinutes} min`}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(task)}
                                title="Edit Session"
                                className="text-[#94A3B8] hover:text-[#3B82F6] transition-colors p-1"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleTaskStatus(task.id)}
                                title="Mark Completed"
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                  isCompleted
                                    ? 'bg-[#10B981] border-[#10B981] text-white'
                                    : 'border-[#1E293B] hover:border-[#10B981]'
                                }`}
                              >
                                {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTask(task.id)}
                                title="Delete Session"
                                className="text-[#94A3B8] hover:text-red-400 transition-colors p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <p className={`font-medium ${isCompleted ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'}`}>
                            {task.description}
                          </p>

                          <div className="flex items-center gap-1.5 mt-2.5">
                            {isAI ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25">
                                <Bot className="w-2.5 h-2.5" /> AI Co-Pilot
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#172033] text-[#94A3B8] border border-[#1E293B]">
                                <UserIcon className="w-2.5 h-2.5" /> Human Added
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual & Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#F8FAFC]">
            <h3 className="text-lg font-bold text-[#F8FAFC]">
              {editingTaskId ? 'Edit Study Session' : t('planner.new_task_modal_title')}
            </h3>

            <form onSubmit={handleSaveTaskModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                  {t('planner.task_desc')}
                </label>
                <input
                  type="text"
                  required
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="e.g., Complete Python Chapter 3 and solve 3 LeetCode problems"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none placeholder-[#94A3B8]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">Day</label>
                  <select
                    value={newTaskDay}
                    onChange={(e) => setNewTaskDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#1E293B] text-xs bg-[#172033] text-[#F8FAFC] outline-none"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">{t('planner.task_time')}</label>
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
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-sm"
                >
                  {editingTaskId ? 'Save Changes' : t('planner.save_task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
