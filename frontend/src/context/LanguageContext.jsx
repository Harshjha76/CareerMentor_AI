import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import mr from '../i18n/mr.json';
import sa from '../i18n/sa.json';

const dictionaries = { en, hi, mr, sa };

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🚩' },
  { code: 'sa', label: 'Sanskrit', native: 'संस्कृतम्', flag: '🕉️' },
];

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('careerpilot_lang');
    if (saved && ['en', 'hi', 'mr', 'sa'].includes(saved)) {
      return saved;
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('careerpilot_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (newLang) => {
    if (['en', 'hi', 'mr', 'sa'].includes(newLang)) {
      setLanguage(newLang);
    }
  };

  /**
   * Helper translation function looking up keys like "nav.dashboard" or "landing.hero_title"
   */
  const t = (path) => {
    const keys = path.split('.');
    let current = dictionaries[language];
    let fallback = dictionaries.en;

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        current = undefined;
        break;
      }
    }

    if (current !== undefined) {
      return current;
    }

    // Try fallback to English
    for (const key of keys) {
      if (fallback && fallback[key] !== undefined) {
        fallback = fallback[key];
      } else {
        return path; // return key name if completely missing
      }
    }

    return fallback;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
