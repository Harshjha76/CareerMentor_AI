import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const GoalContext = createContext(null);

const STORAGE_KEY = 'careermentor_shared_goal';

const DEFAULT_GOAL = {
  domain: 'DSA in Java',
  duration_weeks: 12,
  daily_minutes: 60,
  level: 'Intermediate',
  start_date: new Date().toISOString().split('T')[0],
  current_week: 1
};

export function GoalProvider({ children }) {
  const { user } = useAuth();

  const [goal, setGoal] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          domain: parsed.domain || user?.target_role || DEFAULT_GOAL.domain,
          duration_weeks: Number(parsed.duration_weeks) || DEFAULT_GOAL.duration_weeks,
          daily_minutes: Number(parsed.daily_minutes) || user?.available_study_minutes || DEFAULT_GOAL.daily_minutes,
          level: parsed.level || DEFAULT_GOAL.level,
          start_date: parsed.start_date || DEFAULT_GOAL.start_date,
          current_week: Number(parsed.current_week) || 1
        };
      }
    } catch (e) {
      console.warn('Failed to parse stored shared goal:', e);
    }

    return {
      ...DEFAULT_GOAL,
      domain: user?.target_role || DEFAULT_GOAL.domain,
      daily_minutes: user?.available_study_minutes || DEFAULT_GOAL.daily_minutes
    };
  });

  // Sync with user profile on login if no custom domain yet
  useEffect(() => {
    if (user?.target_role && (!goal.domain || goal.domain === 'Full Stack Software Engineer')) {
      updateGoal({ domain: user.target_role });
    }
  }, [user]);

  // Persist to localStorage whenever goal changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goal));
    } catch (err) {
      console.warn('Failed to save shared goal to localStorage:', err);
    }
  }, [goal]);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          setGoal(prev => ({ ...prev, ...updated }));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateGoal = useCallback((partial) => {
    setGoal(prev => {
      const next = { ...prev, ...partial };
      // Sanitize numbers
      if (partial.duration_weeks !== undefined) {
        next.duration_weeks = Math.max(1, Number(partial.duration_weeks) || 12);
      }
      if (partial.daily_minutes !== undefined) {
        next.daily_minutes = Math.max(15, Number(partial.daily_minutes) || 60);
      }
      if (partial.current_week !== undefined) {
        next.current_week = Math.max(1, Number(partial.current_week) || 1);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setDomain = useCallback((domain) => {
    if (!domain) return;
    updateGoal({ domain: domain.trim(), current_week: 1 });
  }, [updateGoal]);

  const setDurationWeeks = useCallback((duration_weeks) => {
    updateGoal({ duration_weeks: Number(duration_weeks) });
  }, [updateGoal]);

  const setDailyMinutes = useCallback((daily_minutes) => {
    updateGoal({ daily_minutes: Number(daily_minutes) });
  }, [updateGoal]);

  const setLevel = useCallback((level) => {
    updateGoal({ level });
  }, [updateGoal]);

  const setCurrentWeek = useCallback((current_week) => {
    updateGoal({ current_week: Number(current_week) });
  }, [updateGoal]);

  return (
    <GoalContext.Provider
      value={{
        goal,
        updateGoal,
        setDomain,
        setDurationWeeks,
        setDailyMinutes,
        setLevel,
        setCurrentWeek
      }}
    >
      {children}
    </GoalContext.Provider>
  );
}

export function useGoal() {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoal must be used within a GoalProvider');
  }
  return context;
}
