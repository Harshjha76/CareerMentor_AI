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
          if (res?.user?.email?.startsWith('student_')) {
            console.warn('Clearing legacy temporary account:', res.user.email);
            logout();
            return;
          }
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

  const loginWithEmail = async (email, name) => {
    // Clear any previous session state first to avoid stale cross-account state
    localStorage.removeItem('careerpilot_token');
    setToken(null);
    setUser(null);
    setIsLoading(true);

    try {
      const res = await api.auth.emailLogin(email, name);
      if (!res?.token || !res?.user) {
        throw new Error('Authentication failed. No user credentials returned.');
      }
      localStorage.setItem('careerpilot_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.preferred_language) {
        changeLanguage(res.user.preferred_language);
      }
      return res.user;
    } catch (err) {
      localStorage.removeItem('careerpilot_token');
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credentialOrPayload) => {
    // Clear any previous session state first to prevent account contamination
    localStorage.removeItem('careerpilot_token');
    setToken(null);
    setUser(null);
    setIsLoading(true);

    try {
      const res = await api.auth.googleLogin(credentialOrPayload);
      if (!res?.token || !res?.user) {
        throw new Error('Google authentication failed. No user record returned.');
      }
      localStorage.setItem('careerpilot_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.preferred_language) {
        changeLanguage(res.user.preferred_language);
      }
      return res.user;
    } catch (err) {
      localStorage.removeItem('careerpilot_token');
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDemo = async () => {
    localStorage.removeItem('careerpilot_token');
    setToken(null);
    setUser(null);
    setIsLoading(true);

    try {
      const res = await api.auth.demoLogin();
      if (!res?.token || !res?.user) {
        throw new Error('Failed to start demo session');
      }
      localStorage.setItem('careerpilot_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.preferred_language) {
        changeLanguage(res.user.preferred_language);
      }
      return res.user;
    } catch (err) {
      localStorage.removeItem('careerpilot_token');
      setToken(null);
      setUser(null);
      throw err;
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

  const switchAccount = () => {
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        loginWithEmail,
        loginWithGoogle,
        loginWithDemo,
        completeOnboarding,
        updateProfile,
        logout,
        switchAccount
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
