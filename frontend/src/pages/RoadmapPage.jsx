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
  Target
} from 'lucide-react';

const SUGGESTED_SKILLS = [
  'Python for Data Science',
  'React & Modern Frontend',
  'Full Stack Node.js & SQL',
  'Data Structures & Algorithms',
  'System Design & Microservices',
  'Machine Learning Foundations'
];

export default function RoadmapPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [skillName, setSkillName] = useState('Python for Data Science');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [dailyHours, setDailyHours] = useState(user?.daily_study_hours || 2);
  const [loading, setLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({ 1: true });

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
      // Update local state smoothly
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

  const handleExportPDF = () => {
    if (!activeRoadmap) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`CareerPilot AI: ${activeRoadmap.skill_name} Roadmap`, 20, 20);

    doc.setFontSize(11);
    doc.text(`Student: ${user?.name || 'Student'} | Role: ${user?.target_role || 'Software Engineer'}`, 20, 30);
    doc.text(`Duration: ${activeRoadmap.duration_weeks} Weeks | Daily Commitment: ${activeRoadmap.daily_hours} hrs/day`, 20, 38);
    doc.text(`Overall Progress: ${activeRoadmap.progress || 0}%`, 20, 46);

    let y = 58;
    (activeRoadmap.weeks || []).forEach(w => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(13);
      doc.text(`Week ${w.week_number}: ${w.title || 'Curriculum'}`, 20, y);
      y += 8;

      doc.setFontSize(10);
      (w.tasks || []).forEach(t => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const status = t.is_completed ? '[x]' : '[ ]';
        const line = doc.splitTextToSize(`${status} Day ${t.day_number}: ${t.task_description}`, 170);
        doc.text(line, 24, y);
        y += line.length * 5 + 3;
      });
      y += 6;
    });

    doc.save(`Roadmap_${activeRoadmap.skill_name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Map className="w-8 h-8 text-[#3B82F6]" />
            {t('roadmap.title')}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            {t('roadmap.subtitle')}
          </p>
        </div>

        {activeRoadmap && (
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#172033] hover:bg-[#1E293B] border border-[#1E293B] text-[#F8FAFC] text-xs sm:text-sm font-bold shadow-md transition-all self-start md:self-auto"
          >
            <Download className="w-4 h-4 text-[#06B6D4]" />
            {t('roadmap.export_pdf')}
          </button>
        )}
      </div>

      {/* Generator Form Card */}
      <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#F8FAFC] mb-2">
              {t('roadmap.form_skill')}
            </label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder={t('roadmap.form_skill_placeholder')}
              className="w-full px-4 py-3 rounded-xl border border-[#1E293B] bg-[#172033] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#F8FAFC] outline-none text-sm transition-all"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {SUGGESTED_SKILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSkillName(s)}
                  className="px-2.5 py-1 rounded-lg bg-[#172033] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#F8FAFC] mb-2">
                {t('roadmap.form_duration')}
              </label>
              <select
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#F8FAFC] outline-none text-sm bg-[#172033]"
              >
                <option value={2}>2 Weeks (Fast-track)</option>
                <option value={4}>4 Weeks (1 Month Standard)</option>
                <option value={8}>8 Weeks (Comprehensive)</option>
                <option value={12}>12 Weeks (Full Mastery)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#F8FAFC] mb-2">
                {t('roadmap.form_hours')}: <span className="text-[#06B6D4] font-extrabold">{dailyHours} hrs</span>
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
                  {t('roadmap.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  {t('roadmap.btn_generate')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Roadmap View */}
      {activeRoadmap && (
        <div className="space-y-6">
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
                <span>Progress</span>
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

          {/* Accordion Weeks */}
          <div className="space-y-4">
            {(activeRoadmap.weeks || []).map((week) => {
              const isExpanded = expandedWeeks[week.week_number] ?? true;
              return (
                <div
                  key={week.week_number}
                  className="bg-[#111827] rounded-2xl border border-[#1E293B] shadow-xl overflow-hidden transition-all"
                >
                  {/* Week Title Accordion Button */}
                  <button
                    type="button"
                    onClick={() => toggleWeekExpand(week.week_number)}
                    className="w-full flex items-center justify-between p-5 bg-[#172033]/60 hover:bg-[#172033] text-left transition-colors border-b border-[#1E293B]"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                        {t('roadmap.week')} {week.week_number}
                      </span>
                      <h3 className="text-base font-bold text-[#F8FAFC] mt-0.5">
                        {week.title || `Mastery Module ${week.week_number}`}
                      </h3>
                      {week.milestone && (
                        <p className="text-xs text-[#10B981] font-medium mt-1">
                          🎯 {t('roadmap.milestone')}: {week.milestone}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#94A3B8] transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Tasks List */}
                  {isExpanded && (
                    <div className="p-5 space-y-4 divide-y divide-[#1E293B]">
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
                                  {t('roadmap.day')} {task.day_number}
                                </span>
                                <p className={`text-sm font-semibold ${task.is_completed ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'}`}>
                                  {task.task_description}
                                </p>
                              </div>
                            </div>

                            {/* Resource Links */}
                            {resources.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 ml-8 md:ml-0">
                                {resources.map((res, ri) => (
                                  <a
                                    key={ri}
                                    href={res.url || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                      res.type === 'video'
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                        : res.type === 'practice'
                                        ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/20'
                                        : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30 hover:bg-[#3B82F6]/20'
                                    }`}
                                  >
                                    {res.type === 'video' && <Video className="w-3 h-3" />}
                                    {res.type === 'practice' && <Code className="w-3 h-3" />}
                                    {res.type === 'article' && <BookOpen className="w-3 h-3" />}
                                    <span className="truncate max-w-[120px]">{res.title || 'Resource'}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
