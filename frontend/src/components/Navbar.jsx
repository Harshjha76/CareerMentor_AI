import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import {
  Compass,
  FileText,
  Map,
  Calendar,
  MessageSquare,
  Target,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Bell,
  CheckCircle2
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: Compass },
    { to: '/resume', label: t('nav.resume'), icon: FileText },
    { to: '/roadmap', label: t('nav.roadmap'), icon: Map },
    { to: '/planner', label: t('nav.planner'), icon: Calendar },
    { to: '/chat', label: t('nav.chat'), icon: MessageSquare },
    { to: '/goals', label: t('nav.goals'), icon: Target },
    { to: '/admin', label: t('nav.admin'), icon: BarChart2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 transition-all">
      {/* 1. Top Primary Header */}
      <div className="bg-[#0B1220]/95 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Agent Badge on Left */}
            <div className="flex items-center gap-3">
              <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] via-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white shadow-lg shadow-[#3B82F6]/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <div className="font-black text-xl tracking-tight text-[#F8FAFC]">
                    CareerPilot<span className="text-[#06B6D4]">.AI</span>
                  </div>
                  <div className="text-[10px] tracking-wider text-[#94A3B8] font-bold uppercase -mt-0.5 hidden sm:block">
                    Autonomous Career Agent
                  </div>
                </div>
              </Link>

              {isAuthenticated && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                  <span>Agent Online</span>
                </div>
              )}
            </div>

            {/* Right Actions: Language, Notification, Settings, Profile */}
            <div className="flex items-center gap-3">
              <LanguageSelector />

              {isAuthenticated ? (
                <div className="flex items-center gap-2 relative">
                  {/* Notification Bell */}
                  <div className="relative">
                    <button
                      onClick={() => setNotifOpen(!notifOpen)}
                      className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172033] rounded-xl border border-[#1E293B] transition-colors relative"
                      title="Agent Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse"></span>
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-[#111827] rounded-2xl shadow-2xl border border-[#1E293B] p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 mb-2.5">
                          <span className="font-extrabold text-[#F8FAFC] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" /> Autonomous Agent
                          </span>
                          <span className="text-[10px] bg-[#3B82F6]/15 text-[#3B82F6] px-2 py-0.5 rounded-full font-bold border border-[#3B82F6]/30">
                            2h Cadence
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-xl bg-[#172033] border border-[#1E293B]">
                            <div className="font-bold text-[#F8FAFC] text-[11px] mb-0.5">2-Hour Study Check-in ⏱️</div>
                            <div className="text-[#94A3B8] text-[11px] leading-relaxed">
                              Your study velocity is actively monitored. Complete your daily tasks!
                            </div>
                            <div className="text-[10px] text-[#06B6D4] font-semibold mt-1">Autonomous monitoring active</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#172033] border border-[#1E293B]">
                            <div className="font-bold text-[#F8FAFC] text-[11px] mb-0.5">Daily Goal Progress 🎯</div>
                            <div className="text-[#94A3B8] text-[11px] leading-relaxed">
                              Check off scheduled tasks to preserve your study streak.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/settings"
                    className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172033] rounded-xl border border-[#1E293B] transition-colors"
                    title={t('nav.settings')}
                  >
                    <Settings className="w-4 h-4" />
                  </Link>

                  <div className="flex items-center gap-2 pl-2 border-l border-[#1E293B]">
                    <img
                      src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full border border-[#3B82F6]/40 object-cover"
                    />
                    <span className="hidden md:block text-xs font-semibold text-[#F8FAFC] max-w-[100px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      title={t('nav.logout')}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile Menu Toggle */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172033] rounded-xl border border-[#1E293B]"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              ) : (
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#3B82F6] hover:bg-[#2563eb] text-white shadow-md shadow-[#3B82F6]/20 transition-all"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dedicated Sub-Header Navigation Bar ("Below of the title") */}
      {isAuthenticated && (
        <div className="bg-[#111827]/95 backdrop-blur-md border-b border-[#1E293B] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                      isActive
                        ? 'bg-[#172033] text-[#3B82F6] border border-[#3B82F6]/40 shadow-xs'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172033]/60 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#06B6D4]' : 'text-[#94A3B8]'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] shadow-xs shadow-[#06B6D4]/50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden border-b border-[#1E293B] bg-[#111827] px-4 pt-2 pb-4 space-y-1 shadow-2xl">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#172033] text-[#3B82F6] border border-[#3B82F6]/30'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172033]/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#06B6D4]' : 'text-[#94A3B8]'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
