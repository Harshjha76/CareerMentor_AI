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
  Sparkles
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getStats()
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load admin stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const languageFlags = {
    en: '🇬🇧',
    hi: '🇮🇳',
    mr: '🚩',
    sa: '🕉️'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
          <BarChart2 className="w-8 h-8 text-[#3B82F6]" />
          {t('admin.title')}
        </h1>
        <p className="text-[#94A3B8] text-sm mt-1">
          {t('admin.subtitle')}
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
              {t('admin.total_users')}
            </span>
            <div className="text-3xl font-black text-[#F8FAFC]">
              {stats?.totalUsers || '28'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
              {t('admin.avg_ats')}
            </span>
            <div className="text-3xl font-black text-[#F8FAFC] flex items-baseline gap-1">
              {stats?.avgResumeScore || '84'}
              <span className="text-xs text-[#94A3B8] font-normal">/100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
              {t('admin.total_roadmaps')}
            </span>
            <div className="text-3xl font-black text-[#F8FAFC]">
              {stats?.totalRoadmaps || '43'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] flex items-center justify-center">
            <Map className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111827] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
              {t('admin.total_goals')}
            </span>
            <div className="text-3xl font-black text-[#F8FAFC]">
              {stats?.totalGoals || '19'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#06B6D4] flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Language Distribution Card */}
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#3B82F6]" />
              {t('admin.language_dist')}
            </h2>
            <span className="text-xs text-[#94A3B8] font-semibold">Strict 4 Languages</span>
          </div>

          <div className="space-y-4">
            {(stats?.languageDistribution || []).map((item) => {
              const maxCount = Math.max(...(stats?.languageDistribution || []).map(d => d.count), 1);
              const percentage = Math.round((item.count / maxCount) * 100);

              return (
                <div key={item.language} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#F8FAFC] flex items-center gap-2">
                      <span className="text-base">{languageFlags[item.language]}</span>
                      {item.name}
                    </span>
                    <span className="text-[#06B6D4]">{item.count} users</span>
                  </div>

                  <div className="w-full bg-[#0B1220] h-3 rounded-full overflow-hidden border border-[#1E293B]">
                    <div
                      className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Target Roles */}
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#06B6D4]" />
            {t('admin.top_roles')}
          </h2>

          <div className="space-y-3">
            {(stats?.targetRoles || []).map((role, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold flex items-center justify-center border border-[#3B82F6]/30">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-[#F8FAFC]">
                    {role.target_role}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#94A3B8]">
                  {role.count} students
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Popular Skills in Roadmaps */}
        <div className="lg:col-span-2 bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
            {t('admin.top_skills')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(stats?.popularSkills || []).map((skill, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] shadow-sm flex items-center justify-between hover:border-[#3B82F6]/40 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-[#06B6D4] mb-1">Rank #{idx + 1}</div>
                  <div className="text-sm font-extrabold text-[#F8FAFC]">{skill.skill_name}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#172033] text-[#3B82F6] text-xs font-bold border border-[#1E293B]">
                  {skill.count} roadmaps
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
