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
  AlertCircle
} from 'lucide-react';

export default function PlannerPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'daily'
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderToast, setReminderToast] = useState(null);

  // New task modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDay, setNewTaskDay] = useState('Monday');
  const [newTaskTime, setNewTaskTime] = useState('18:00 - 19:30');

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
        // Automatically suggest initial AI plan if empty
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

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      day: newTaskDay,
      time: newTaskTime,
      description: newTaskDesc,
      is_completed: false,
      status: 'pending',
      is_ai_suggested: false
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    setModalOpen(false);
    setNewTaskDesc('');

    try {
      await api.planner.saveTasks(updated);
    } catch (err) {
      console.error('Failed to save task:', err);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {reminderToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white rounded-2xl border border-electric-200 shadow-2xl p-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-electric-100 text-electric-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">{reminderToast.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">To: {reminderToast.to}</p>
              <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-gray-100 text-xs text-gray-700">
                "{reminderToast.body}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-electric-600" />
            {t('planner.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('planner.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center shadow-xs">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-electric-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('planner.weekly_view')}
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'daily'
                  ? 'bg-electric-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('planner.daily_view')}
            </button>
          </div>

          <button
            onClick={handleGenerateAIPlan}
            disabled={generating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-electric-50 border border-electric-200 text-electric-700 hover:bg-electric-100 text-xs font-bold transition-all"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-electric-600" />}
            {t('planner.btn_ai_generate')}
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('planner.btn_add_task')}
          </button>

          <button
            onClick={handleSendReminder}
            disabled={sendingReminder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-tealBrand-600 hover:bg-tealBrand-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            {sendingReminder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {t('planner.btn_send_reminder')}
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {DAYS.map((day) => {
          const dayTasks = tasks.filter(t => t.day === day);
          return (
            <div
              key={day}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                  <span className="font-extrabold text-sm text-gray-900">{day}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {dayTasks.length} tasks
                  </span>
                </div>

                <div className="space-y-3 min-h-[140px]">
                  {dayTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-300 text-xs">
                      No tasks scheduled
                    </div>
                  ) : (
                    dayTasks.map((task) => {
                      const isCompleted = !!task.is_completed;
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl border text-xs transition-all ${
                            isCompleted
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                              : 'bg-white border-gray-200 hover:border-electric-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {task.time || '18:00'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleTaskStatus(task.id)}
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                  isCompleted
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-gray-300 hover:border-emerald-500'
                                }`}
                              >
                                {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <p className={`font-medium ${isCompleted ? 'line-through opacity-70' : 'text-gray-800'}`}>
                            {task.description}
                          </p>

                          {task.is_ai_suggested && (
                            <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-electric-100 text-electric-700">
                              AI Suggestion
                            </span>
                          )}
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

      {/* Manual Task Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <h3 className="text-lg font-bold text-gray-900">
              {t('planner.new_task_modal_title')}
            </h3>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('planner.task_desc')}
                </label>
                <input
                  type="text"
                  required
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="e.g., Complete Python Chapter 3 and solve 3 LeetCode problems"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Day</label>
                  <select
                    value={newTaskDay}
                    onChange={(e) => setNewTaskDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('planner.task_time')}</label>
                  <input
                    type="text"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    placeholder="18:00 - 20:00"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-electric-600 hover:bg-electric-700 text-white text-xs font-bold shadow-sm"
                >
                  {t('planner.save_task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
