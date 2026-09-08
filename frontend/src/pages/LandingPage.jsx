import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import GoogleSignInButton from '../components/GoogleSignInButton';
import {
  Sparkles,
  FileText,
  Map,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Users,
  Award,
  Globe2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const features = [
    {
      icon: FileText,
      color: 'from-blue-600 to-cyan-500',
      title: t('landing.feat_resume_title'),
      desc: t('landing.feat_resume_desc'),
      badge: 'ATS 90+'
    },
    {
      icon: Map,
      color: 'from-purple-600 to-indigo-500',
      title: t('landing.feat_roadmap_title'),
      desc: t('landing.feat_roadmap_desc'),
      badge: 'Curated'
    },
    {
      icon: Calendar,
      color: 'from-teal-600 to-emerald-500',
      title: t('landing.feat_planner_title'),
      desc: t('landing.feat_planner_desc'),
      badge: 'Automated'
    },
    {
      icon: MessageSquare,
      color: 'from-amber-500 to-orange-500',
      title: t('landing.feat_chat_title'),
      desc: t('landing.feat_chat_desc'),
      badge: '24/7 AI'
    }
  ];

  const stats = [
    { label: t('landing.stats_students'), icon: Users },
    { label: t('landing.stats_roadmaps'), icon: Map },
    { label: t('landing.stats_ats'), icon: Award },
    { label: t('landing.stats_languages'), icon: Globe2 },
  ];

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex flex-col selection:bg-[#3B82F6] selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-[#0B1220]/80 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white shadow-md shadow-[#3B82F6]/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#F8FAFC]">
                CareerPilot<span className="text-[#06B6D4]">.AI</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector variant="transparent" />
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold shadow-md shadow-[#3B82F6]/25 transition-all"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Subtle decorative background gradient blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none -z-10">
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111827] border border-[#1E293B] text-[#06B6D4] text-xs font-semibold mb-6 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>{t('landing.badge')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span>
            <span className="font-bold text-[#F8FAFC]">English • हिंदी • मराठी • संस्कृतम्</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-6">
            <span className="block bg-gradient-to-r from-[#F8FAFC] via-[#94A3B8] to-[#F8FAFC] bg-clip-text text-transparent">
              {t('landing.hero_title')}
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-lg sm:text-xl text-[#94A3B8] max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            {t('landing.hero_subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="max-w-lg mx-auto mb-6">
            <GoogleSignInButton fullWidth />
          </div>

          {/* Demo Note */}
          <p className="text-xs text-[#94A3B8] font-medium">
            💡 {t('landing.demo_note')}
          </p>
        </div>
      </section>

      {/* Stats Ribbon */}
      <section className="border-y border-[#1E293B] bg-[#111827]/70 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="flex flex-col items-center justify-center p-3">
                  <div className="w-10 h-10 rounded-xl bg-[#172033] text-[#3B82F6] flex items-center justify-center mb-2 shadow-xs border border-[#1E293B]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#F8FAFC]">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-[#0B1220]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight mb-4">
              {t('landing.features_heading')}
            </h2>
            <p className="text-[#94A3B8] text-base sm:text-lg">
              {t('landing.features_sub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="relative group bg-[#111827] p-8 rounded-3xl border border-[#1E293B] shadow-xl hover:border-[#3B82F6]/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${f.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#172033] text-[#06B6D4] border border-[#1E293B]">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#F8FAFC] mb-2.5 group-hover:text-[#3B82F6] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-[#94A3B8] text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Strict 4-Language Highlight Banner */}
      <section className="py-16 bg-gradient-to-r from-[#111827] via-[#172033] to-[#0B1220] border-y border-[#1E293B] text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#172033] text-[#06B6D4] text-xs font-semibold mb-4 border border-[#06B6D4]/30">
            <Globe2 className="w-4 h-4" /> Multilingual Architecture
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-4 tracking-tight text-[#F8FAFC]">
            Seamlessly Mentoring in 4 Dedicated Languages
          </h2>
          <p className="text-[#94A3B8] text-sm sm:text-base max-w-2xl mx-auto mb-8">
            CareerPilot AI is uniquely calibrated to provide resume ATS analysis, career counseling, study plans, and daily notifications strictly in your chosen tongue.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
              <span className="text-2xl mb-1 block">🇬🇧</span>
              <div className="font-bold text-[#F8FAFC] text-sm">English</div>
              <div className="text-[11px] text-[#94A3B8]">Professional Register</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
              <span className="text-2xl mb-1 block">🇮🇳</span>
              <div className="font-bold text-[#F8FAFC] text-sm">हिंदी</div>
              <div className="text-[11px] text-[#94A3B8]">देवनागरी लिपि</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
              <span className="text-2xl mb-1 block">🚩</span>
              <div className="font-bold text-[#F8FAFC] text-sm">मराठी</div>
              <div className="text-[11px] text-[#94A3B8]">शुद्ध मराठी लिपी</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
              <span className="text-2xl mb-1 block">🕉️</span>
              <div className="font-bold text-[#F8FAFC] text-sm">संस्कृतम्</div>
              <div className="text-[11px] text-[#94A3B8]">विद्वत्-परम्परा</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#0B1220] border-t border-[#1E293B] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3B82F6]" />
            <span className="font-bold text-[#F8FAFC]">CareerPilot AI</span>
            <span className="text-[#94A3B8] text-xs">© 2026. Built for college students & job seekers.</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#94A3B8]">
            <span>Supported: English • हिंदी • मराठी • संस्कृतम्</span>
            <Link to="/admin" className="text-[#3B82F6] hover:underline font-medium text-xs">
              View Analytics
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
