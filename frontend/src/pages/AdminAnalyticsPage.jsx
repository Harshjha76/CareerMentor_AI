import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  BarChart2,
  Users,
  Award,
  Map,
  Target,
  Globe2,
  TrendingUp,
  Sparkles,
  UserCheck,
  GraduationCap,
  Calendar,
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.admin.getStats()
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load admin stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const languageFlags = {
    en: '🇬🇧',
    hi: '🇮🇳',
    mr: '🚩',
    sa: '🕉️'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header with Live Sync Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Real Database Telemetry & Live Users
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <BarChart2 className="w-8 h-8 text-[#3B82F6]" />
            {t('admin.title')}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Real-time live metrics on user registrations, active sessions, language preferences, and roadmap milestones directly from PostgreSQL/SQLite.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#172033] hover:bg-[#1E293B] border border-[#1E293B] text-[#F8FAFC] text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#06B6D4] ${loading ? 'animate-spin' : ''}`} />
          Refresh Live Data
        </button>
      </div>

      {/* Top 4 Real KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Real Users */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex items-center justify-between hover:border-blue-500/40 transition-all">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
              {t('admin.total_users')}
            </span>
            <div className="text-3xl font-black text-white flex items-baseline gap-1">
              {stats?.totalUsers !== undefined ? stats.totalUsers : 0}
              <span className="text-xs text-emerald-400 font-semibold ml-1">Live</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Average Resume Score */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex items-center justify-between hover:border-emerald-500/40 transition-all">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
              {t('admin.avg_ats')}
            </span>
            <div className="text-3xl font-black text-white flex items-baseline gap-1">
              {stats?.avgResumeScore || 0}
              <span className="text-xs text-[#94A3B8] font-normal">/100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Total Roadmaps */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex items-center justify-between hover:border-purple-500/40 transition-all">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
              {t('admin.total_roadmaps')}
            </span>
            <div className="text-3xl font-black text-white">
              {stats?.totalRoadmaps !== undefined ? stats.totalRoadmaps : 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] flex items-center justify-center">
            <Map className="w-6 h-6" />
          </div>
        </div>

        {/* Total Goals */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex items-center justify-between hover:border-cyan-500/40 transition-all">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
              {t('admin.total_goals')}
            </span>
            <div className="text-3xl font-black text-white">
              {stats?.totalGoals !== undefined ? stats.totalGoals : 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#06B6D4] flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Real Language Distribution Card */}
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#3B82F6]" />
              {t('admin.language_dist')}
            </h2>
            <span className="text-xs text-[#94A3B8] font-semibold">Strict 4 Languages</span>
          </div>

          <div className="space-y-4">
            {(stats?.languageDistribution || []).map((item) => {
              const totalUsersCount = (stats?.languageDistribution || []).reduce((acc, curr) => acc + curr.count, 0) || 1;
              const percentage = Math.round((item.count / totalUsersCount) * 100);

              return (
                <div key={item.language} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#F8FAFC] flex items-center gap-2">
                      <span className="text-base">{languageFlags[item.language]}</span>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-normal">({percentage}%)</span>
                      <span className="text-[#06B6D4]">{item.count} users</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#0B1220] h-3 rounded-full overflow-hidden border border-[#1E293B]">
                    <div
                      className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.max(percentage, item.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real Top Target Roles */}
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#06B6D4]" />
              {t('admin.top_roles')}
            </h2>
            <span className="text-xs text-[#94A3B8] font-semibold">Real User Profiles</span>
          </div>

          <div className="space-y-3">
            {(stats?.targetRoles && stats.targetRoles.length > 0) ? (
              stats.targetRoles.map((role, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B] hover:border-blue-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold flex items-center justify-center border border-[#3B82F6]/30">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-[#F8FAFC]">
                      {role.target_role}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {role.count} {role.count === 1 ? 'student' : 'students'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                No target roles configured yet. Roles will appear here in real time as students complete onboarding.
              </div>
            )}
          </div>
        </div>

        {/* Real Popular Skills in Roadmaps */}
        <div className="lg:col-span-2 bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              {t('admin.top_skills')}
            </h2>
            <span className="text-xs text-[#94A3B8] font-semibold">Generated Roadmaps</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(stats?.popularSkills && stats.popularSkills.length > 0) ? (
              stats.popularSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] shadow-sm flex items-center justify-between hover:border-[#3B82F6]/40 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-[#06B6D4] mb-1">Rank #{idx + 1}</div>
                    <div className="text-sm font-extrabold text-[#F8FAFC] truncate max-w-[180px]">{skill.skill_name}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#172033] text-[#3B82F6] text-xs font-bold border border-[#1E293B]">
                    {skill.count} {skill.count === 1 ? 'roadmap' : 'roadmaps'}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-6 text-center text-xs text-slate-400 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                No roadmaps generated yet. Generate your first learning roadmap to populate live skill demand telemetry.
              </div>
            )}
          </div>
        </div>

        {/* REAL REGISTERED USERS & LIVE SESSIONS TABLE */}
        <div className="lg:col-span-2 bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                Live Registered Students & Users Database
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real users logged into the platform with verified credentials and career goals.
              </p>
            </div>
            <span className="text-xs bg-emerald-500/15 text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-500/30 self-start sm:self-auto">
              {stats?.recentUsers?.length || 0} Registered Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B1220] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Candidate</th>
                  <th className="p-3.5">Target Role</th>
                  <th className="p-3.5">University & Branch</th>
                  <th className="p-3.5">Language</th>
                  <th className="p-3.5">Study Pacing</th>
                  <th className="p-3.5 rounded-r-xl">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {(stats?.recentUsers && stats.recentUsers.length > 0) ? (
                  stats.recentUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-[#0B1220]/60 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={usr.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={usr.name}
                            className="w-8 h-8 rounded-full border border-blue-500/30 object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-sm">{usr.name}</div>
                            <div className="text-slate-400 text-[11px]">{usr.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-blue-400">
                          {usr.target_role || 'Software Engineer'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        <div>{usr.university_name || 'Engineering Institute'}</div>
                        <div className="text-[11px] text-slate-400">{usr.branch || 'Computer Science'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#172033] border border-[#1E293B] font-semibold text-white">
                          <span>{languageFlags[usr.preferred_language || 'en']}</span>
                          <span>{(usr.preferred_language || 'en').toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-emerald-400 font-bold">
                          {usr.daily_study_hours || 2}h / day ({usr.available_study_minutes || 120}m)
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {usr.created_at ? new Date(usr.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">
                      No user registrations recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

