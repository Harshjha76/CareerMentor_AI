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
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1E293B] bg-[#111827] hover:border-[#3B82F6] text-[#F8FAFC] text-xs font-semibold shadow-xs transition-all duration-200"
      >
        <Globe className="w-3.5 h-3.5 text-[#06B6D4]" />
        <span className="hidden sm:inline">{activeLang.flag}</span>
        <span className="font-semibold">{activeLang.native}</span>
        <ChevronDown className="w-3 h-3 text-[#94A3B8] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider border-b border-[#1E293B]">
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
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-[#172033] text-[#3B82F6] font-bold border-l-2 border-[#3B82F6]'
                    : 'text-[#F8FAFC] hover:bg-[#172033]/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{lang.flag}</span>
                  <div>
                    <div className="font-semibold text-[#F8FAFC]">{lang.native}</div>
                    <div className="text-[10px] text-[#94A3B8]">{lang.label}</div>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4]"></span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
