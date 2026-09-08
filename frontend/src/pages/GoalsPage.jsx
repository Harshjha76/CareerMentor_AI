import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Target,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Trophy,
  Loader2
} from 'lucide-react';

export default function GoalsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [goalDesc, setGoalDesc] = useState('');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await api.goals.getAll();
      setGoals(res.goals || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalDesc.trim()) return;

    setCreating(true);
    try {
      const res = await api.goals.create({
        goal_description: goalDesc,
        target_date: targetDate
      });
      setGoals(prev => [res.goal, ...prev]);
      setModalOpen(false);
      setGoalDesc('');
    } catch (err) {
      alert('Error creating goal: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const updateProgress = async (goalId, newProgress) => {
    const clamped = Math.min(Math.max(newProgress, 0), 100);
    const isCompleted = clamped === 100;

    if (isCompleted) {
      triggerConfetti();
    }

    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          progress_percentage: clamped,
          status: isCompleted ? 'completed' : 'active'
        };
      }
      return g;
    }));

    try {
      await api.goals.update(goalId, {
        progress_percentage: clamped,
        status: isCompleted ? 'completed' : 'active'
      });
    } catch (err) {
      console.error('Failed to update goal progress:', err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    try {
      await api.goals.delete(goalId);
    } catch (err) {
      console.error('Delete goal error:', err);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Target className="w-8 h-8 text-electric-600" />
            {t('goals.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('goals.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-electric-600/25 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t('goals.btn_new_goal')}
        </button>
      </div>

      {/* Goals List */}
      {goals.length === 0 && !loading ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900">No Career Goals Set Yet</h3>
          <p className="text-sm text-gray-500">
            Setting clear, target-dated career milestones dramatically increases your chances of cracking your dream roles.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-electric-600 text-white font-bold text-xs shadow-sm hover:bg-electric-700"
          >
            + Set Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const isCompleted = (goal.progress_percentage || 0) >= 100;
            return (
              <div
                key={goal.id}
                className={`bg-white rounded-3xl border p-6 shadow-sm transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-300 ring-2 ring-emerald-400/20 bg-emerald-50/20'
                    : 'border-gray-200 hover:border-electric-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-electric-50 text-electric-700'
                    }`}>
                      {isCompleted ? t('goals.status_completed') : t('goals.status_active')}
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-extrabold text-base text-gray-900 mb-2 leading-snug">
                    {goal.goal_description}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
                    <Calendar className="w-3.5 h-3.5" />
                    Due by: {goal.target_date || 'Target Date'}
                  </div>

                  {/* Subtasks if present */}
                  {goal.subtasks && goal.subtasks.length > 0 && (
                    <div className="space-y-2 mb-6">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                        {t('goals.subtasks')}
                      </span>
                      {goal.subtasks.map((st, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 p-2 rounded-lg bg-slate-50 border border-gray-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-electric-600 flex-shrink-0" />
                          <span className="truncate">{st.title || st}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress Controls */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-600">{t('goals.progress')}</span>
                    <span className="text-electric-700 font-extrabold">{goal.progress_percentage || 0}%</span>
                  </div>

                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-tealBrand-500 to-electric-600'
                      }`}
                      style={{ width: `${goal.progress_percentage || 0}%` }}
                    />
                  </div>

                  {/* Quick percentage adjustment buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => updateProgress(goal.id, pct)}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          goal.progress_percentage === pct
                            ? 'bg-electric-600 text-white border-electric-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  {isCompleted && (
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-center text-xs font-bold flex items-center justify-center gap-1.5 animate-in zoom-in-95">
                      <Trophy className="w-4 h-4 text-emerald-600" />
                      {t('goals.completed_celebration')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal with AI Subtask Breakdown */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-1">
                {t('goals.add_goal_modal_title')}
              </h3>
              <p className="text-xs text-gray-500">
                AI will automatically break this goal into actionable milestone subtasks.
              </p>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('goals.goal_desc_label')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  placeholder={t('goals.goal_desc_placeholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('goals.target_date_label')}
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-electric-500 outline-none bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white font-bold text-xs shadow-md shadow-electric-600/25 transition-all"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Create with AI Breakdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
