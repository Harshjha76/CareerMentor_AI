import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageSelector({ variant = 'default' }) {
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
          variant === 'transparent'
            ? 'bg-white/80 backdrop-blur-md border-gray-200 hover:bg-white text-gray-700 shadow-sm'
            : 'bg-white border-gray-200 hover:border-electric-500 text-gray-800 shadow-sm'
        }`}
      >
        <Globe className="w-4 h-4 text-electric-600" />
        <span className="hidden sm:inline">{activeLang.flag}</span>
        <span className="font-semibold">{activeLang.native}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-gray-100 shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            Language (4 Supported)
          </div>
          {supportedLanguages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-electric-50 text-electric-700 font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{lang.flag}</span>
                  <div>
                    <div className="font-medium text-gray-900">{lang.native}</div>
                    <div className="text-xs text-gray-400">{lang.label}</div>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-electric-600"></span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
