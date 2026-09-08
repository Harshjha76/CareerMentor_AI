import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import RoadmapPage from './pages/RoadmapPage';
import PlannerPage from './pages/PlannerPage';
import ChatbotPage from './pages/ChatbotPage';
import GoalsPage from './pages/GoalsPage';
import WhatIKnowPage from './pages/WhatIKnowPage';
import SettingsPage from './pages/SettingsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220]">
        <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user && !user.is_onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isOnboarding = location.pathname === '/onboarding';

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col font-sans text-[#F8FAFC] selection:bg-[#3B82F6] selection:text-white">
      {!isLandingPage && !isOnboarding && <Navbar />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/what-i-know"
            element={
              <ProtectedRoute>
                <WhatIKnowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumeAnalyzerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <RoadmapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <PlannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatbotPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <GoalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
