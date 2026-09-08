import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from './LanguageContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('careerpilot_token'));
  const [isLoading, setIsLoading] = useState(true);
  const { changeLanguage } = useLanguage();

  useEffect(() => {
    if (token) {
      api.auth.getMe()
        .then(res => {
          setUser(res.user);
          if (res.user.preferred_language) {
            changeLanguage(res.user.preferred_language);
          }
        })
        .catch(err => {
          console.warn('Session expired or invalid:', err.message);
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const loginWithGoogle = async (credential) => {
    setIsLoading(true);
    try {
      const res = await api.auth.googleLogin(credential);
      localStorage.setItem('careerpilot_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.preferred_language) {
        changeLanguage(res.user.preferred_language);
      }
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDemo = async () => {
    setIsLoading(true);
    try {
      const res = await api.auth.demoLogin();
      localStorage.setItem('careerpilot_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.preferred_language) {
        changeLanguage(res.user.preferred_language);
      }
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (data) => {
    const res = await api.auth.saveOnboarding(data);
    setUser(res.user);
    if (res.user.preferred_language) {
      changeLanguage(res.user.preferred_language);
    }
    return res.user;
  };

  const updateProfile = async (data) => {
    const res = await api.auth.updateProfile(data);
    setUser(res.user);
    if (res.user.preferred_language) {
      changeLanguage(res.user.preferred_language);
    }
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('careerpilot_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithDemo,
        completeOnboarding,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
