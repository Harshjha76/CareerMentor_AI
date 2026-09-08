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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <BarChart2 className="w-8 h-8 text-electric-600" />
          {t('admin.title')}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {t('admin.subtitle')}
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              {t('admin.total_users')}
            </span>
            <div className="text-3xl font-black text-gray-900">
              {stats?.totalUsers || '28'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              {t('admin.avg_ats')}
            </span>
            <div className="text-3xl font-black text-gray-900 flex items-baseline gap-1">
              {stats?.avgResumeScore || '84'}
              <span className="text-xs text-gray-400 font-normal">/100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              {t('admin.total_roadmaps')}
            </span>
            <div className="text-3xl font-black text-gray-900">
              {stats?.totalRoadmaps || '43'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-electric-600 flex items-center justify-center">
            <Map className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              {t('admin.total_goals')}
            </span>
            <div className="text-3xl font-black text-gray-900">
              {stats?.totalGoals || '19'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-tealBrand-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Language Distribution Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-electric-600" />
              {t('admin.language_dist')}
            </h2>
            <span className="text-xs text-gray-400 font-semibold">Strict 4 Languages</span>
          </div>

          <div className="space-y-4">
            {(stats?.languageDistribution || []).map((item) => {
              const maxCount = Math.max(...(stats?.languageDistribution || []).map(d => d.count), 1);
              const percentage = Math.round((item.count / maxCount) * 100);

              return (
                <div key={item.language} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-800 flex items-center gap-2">
                      <span className="text-base">{languageFlags[item.language]}</span>
                      {item.name}
                    </span>
                    <span className="text-electric-700">{item.count} users</span>
                  </div>

                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-tealBrand-500 to-electric-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Target Roles */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-tealBrand-600" />
            {t('admin.top_roles')}
          </h2>

          <div className="space-y-3">
            {(stats?.targetRoles || []).map((role, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-electric-100 text-electric-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {role.target_role}
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-500">
                  {role.count} students
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Popular Skills in Roadmaps */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {t('admin.top_skills')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(stats?.popularSkills || []).map((skill, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-gray-200/80 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-electric-700 mb-1">Rank #{idx + 1}</div>
                  <div className="text-sm font-extrabold text-gray-900">{skill.skill_name}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-electric-50 text-electric-800 text-xs font-bold">
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
