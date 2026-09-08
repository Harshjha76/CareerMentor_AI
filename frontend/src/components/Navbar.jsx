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
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-900 via-electric-600 to-tealBrand-500 flex items-center justify-center text-white shadow-md shadow-electric-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary-900 via-electric-700 to-primary-800 bg-clip-text text-transparent">
                CareerPilot<span className="text-tealBrand-600">.AI</span>
              </div>
              <div className="text-[10px] tracking-wider text-gray-400 font-semibold uppercase -mt-1 hidden sm:block">
                Smart Career Agent
              </div>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-electric-50 text-electric-700 font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-electric-600' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <LanguageSelector />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/settings"
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('nav.settings')}
                >
                  <Settings className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full border border-electric-200 object-cover"
                  />
                  <span className="hidden md:block text-xs font-semibold text-gray-700 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('nav.logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <Link
                to="/"
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-electric-600 text-white hover:bg-electric-700 shadow-md shadow-electric-600/20 transition-all"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-electric-50 text-electric-700 font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-electric-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Settings className="w-4 h-4" /> {t('nav.settings')}
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" /> {t('nav.logout')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
