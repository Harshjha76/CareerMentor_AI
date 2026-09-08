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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Map className="w-8 h-8 text-electric-600" />
            {t('roadmap.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('roadmap.subtitle')}
          </p>
        </div>

        {activeRoadmap && (
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all self-start md:self-auto"
          >
            <Download className="w-4 h-4 text-tealBrand-300" />
            {t('roadmap.export_pdf')}
          </button>
        )}
      </div>

      {/* Generator Form Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              {t('roadmap.form_skill')}
            </label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder={t('roadmap.form_skill_placeholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 text-gray-900 outline-none text-sm transition-all"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {SUGGESTED_SKILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSkillName(s)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-electric-50 hover:text-electric-700 text-xs font-semibold text-gray-600 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {t('roadmap.form_duration')}
              </label>
              <select
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 text-gray-900 outline-none text-sm bg-white"
              >
                <option value={2}>2 Weeks (Fast-track)</option>
                <option value={4}>4 Weeks (1 Month Standard)</option>
                <option value={8}>8 Weeks (Comprehensive)</option>
                <option value={12}>12 Weeks (Full Mastery)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {t('roadmap.form_hours')}: <span className="text-electric-600 font-extrabold">{dailyHours} hrs</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseInt(e.target.value, 10))}
                className="w-full accent-electric-600 cursor-pointer mt-3"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-tealBrand-600 to-electric-600 hover:from-tealBrand-500 hover:to-electric-500 text-white font-bold text-sm shadow-md shadow-electric-600/25 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('roadmap.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-tealBrand-200" />
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
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-50 text-electric-700 text-xs font-semibold mb-2">
                <Target className="w-3.5 h-3.5" />
                Target Role: {activeRoadmap.target_role}
              </div>
              <h2 className="text-2xl font-black text-gray-900">
                {activeRoadmap.skill_name}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {activeRoadmap.duration_weeks} Weeks • {activeRoadmap.daily_hours} Hours/day • {activeRoadmap.completedTasks || 0} of {activeRoadmap.totalTasks || 0} tasks completed
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-right">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Progress</span>
                <span className="text-electric-600 font-black">{activeRoadmap.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-tealBrand-500 to-electric-600 h-full rounded-full transition-all duration-300"
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
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all"
                >
                  {/* Week Title Accordion Button */}
                  <button
                    type="button"
                    onClick={() => toggleWeekExpand(week.week_number)}
                    className="w-full flex items-center justify-between p-5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-electric-600">
                        {t('roadmap.week')} {week.week_number}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5">
                        {week.title || `Mastery Module ${week.week_number}`}
                      </h3>
                      {week.milestone && (
                        <p className="text-xs text-tealBrand-700 font-medium mt-1">
                          🎯 {t('roadmap.milestone')}: {week.milestone}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Tasks List */}
                  {isExpanded && (
                    <div className="p-5 space-y-4 divide-y divide-gray-100">
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
                              task.is_completed ? 'opacity-70' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => toggleTask(task.id, task.is_completed)}
                                className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-all ${
                                  task.is_completed
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-gray-300 hover:border-electric-500'
                                }`}
                              >
                                {task.is_completed && <CheckCircle2 className="w-4 h-4" />}
                              </button>

                              <div>
                                <span className="text-xs font-bold text-gray-400 block">
                                  {t('roadmap.day')} {task.day_number}
                                </span>
                                <p className={`text-sm font-semibold ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
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
                                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                        : res.type === 'practice'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
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
