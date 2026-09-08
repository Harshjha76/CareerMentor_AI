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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Target className="w-8 h-8 text-[#3B82F6]" />
            {t('goals.title')}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            {t('goals.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#3B82F6]/25 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t('goals.btn_new_goal')}
        </button>
      </div>

      {/* Goals List */}
      {goals.length === 0 && !loading ? (
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-[#F8FAFC]">No Career Goals Set Yet</h3>
          <p className="text-sm text-[#94A3B8]">
            Setting clear, target-dated career milestones dramatically increases your chances of cracking your dream roles.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#3B82F6] text-white font-bold text-xs shadow-sm hover:bg-[#2563EB]"
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
                className={`bg-[#111827] rounded-3xl border p-6 shadow-xl transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'border-[#10B981]/50 ring-2 ring-[#10B981]/20 bg-[#111827]'
                    : 'border-[#1E293B] hover:border-[#3B82F6]/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isCompleted ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' : 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30'
                    }`}>
                      {isCompleted ? t('goals.status_completed') : t('goals.status_active')}
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-[#94A3B8] hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-extrabold text-base text-[#F8FAFC] mb-2 leading-snug">
                    {goal.goal_description}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-5">
                    <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                    Due by: {goal.target_date || 'Target Date'}
                  </div>

                  {/* Subtasks if present */}
                  {goal.subtasks && goal.subtasks.length > 0 && (
                    <div className="space-y-2 mb-6">
                      <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block">
                        {t('goals.subtasks')}
                      </span>
                      {goal.subtasks.map((st, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#F8FAFC] p-2 rounded-lg bg-[#0B1220] border border-[#1E293B]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4] flex-shrink-0" />
                          <span className="truncate">{st.title || st}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress Controls */}
                <div className="space-y-3 pt-4 border-t border-[#1E293B]">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#94A3B8]">{t('goals.progress')}</span>
                    <span className="text-[#06B6D4] font-extrabold">{goal.progress_percentage || 0}%</span>
                  </div>

                  <div className="w-full bg-[#0B1220] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#10B981]'
                          : 'bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]'
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
                            ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                            : 'bg-[#172033] text-[#94A3B8] border-[#1E293B] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  {isCompleted && (
                    <div className="p-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-center text-xs font-bold flex items-center justify-center gap-1.5 animate-in zoom-in-95">
                      <Trophy className="w-4 h-4 text-[#10B981]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 text-[#F8FAFC]">
            <div>
              <h3 className="text-xl font-black text-[#F8FAFC] mb-1">
                {t('goals.add_goal_modal_title')}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                AI will automatically break this goal into actionable milestone subtasks.
              </p>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  {t('goals.goal_desc_label')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  placeholder={t('goals.goal_desc_placeholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none resize-none placeholder-[#94A3B8]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  {t('goals.target_date_label')}
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#172033] text-sm text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#1E293B] text-xs font-semibold text-[#94A3B8] hover:bg-[#172033]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-[#3B82F6]/25 transition-all"
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
