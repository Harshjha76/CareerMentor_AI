import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  Globe2,
  Bot,
  User,
  Loader2,
  HelpCircle,
  Clock
} from 'lucide-react';

export default function ChatbotPage() {
  const { user } = useAuth();
  const { t, language, changeLanguage, supportedLanguages } = useLanguage();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const loadChatHistory = async () => {
    try {
      const res = await api.chat.getHistory();
      if (res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      } else {
        // Provide an initial greeting from CareerPilot
        setMessages([
          {
            id: 'init-1',
            sender: 'ai',
            text: getInitialGreeting(user?.name, user?.target_role, language),
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  function getInitialGreeting(name, role, lang) {
    if (lang === 'hi') {
      return `नमस्ते **${name || 'विद्यार्थी'}**! 🌟\n\nमैं आपका 24/7 **करियरपायलट मेंटर** हूँ। आपके लक्ष्य **${role || 'सॉफ्टवेयर इंजीनियर'}** के लिए साक्षात्कार की तैयारी, कोडिंग अभ्यास, और कंपनी चयन के बारे में आप मुझसे कभी भी पूछ सकते हैं।`;
    }
    if (lang === 'mr') {
      return `नमस्कार **${name || 'विद्यार्थी मित्र'}**! 🌟\n\nमी तुमचा २४/७ **करिअरपायलट मार्गदर्शक** आहे. तुमच्या **${role || 'सॉफ्टवेअर इंजिनिअर'}** या ध्येयासाठी मुलाखत तयारी, कोडिंग सराव आणि कंपन्यांच्या निवडीबद्दल आपण कधीही विचारू शकता.`;
    }
    if (lang === 'sa') {
      return `नमस्ते **${name || 'छात्र'}**! 🌟\n\nअहं तव २४/७ **करियरपायलट् वृत्तिमार्गदर्शकः** अस्मि। तव अभीष्टपदस्य **${role || 'Software Engineer'}** कृते साक्षात्कारसज्जताम्, अभ्यासयोजनां च अधिकृत्य मां यत्किञ्चित् पृच्छतु।`;
    }
    return `Hello **${name || 'there'}**! 🌟\n\nI am your 24/7 personal **CareerPilot Mentor**. I'm fully aware of your target role (**${role || 'Software Engineer'}**) and dream companies. Ask me anything about interview prep, tech stacks, or career advice!`;
  }

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || sending) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      const res = await api.chat.sendMessage(query, language);
      setMessages(prev => [...prev, res.message]);
    } catch (err) {
      alert('Error communicating with mentor: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear all conversation history?')) return;
    try {
      await api.chat.clearHistory();
      setMessages([
        {
          id: 'cleared-init',
          sender: 'ai',
          text: getInitialGreeting(user?.name, user?.target_role, language),
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error('Clear history error:', err);
    }
  };

  const quickPrompts = [
    t('chat.p1'),
    t('chat.p2'),
    t('chat.p3'),
    t('chat.p4')
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Banner */}
      <div className="bg-white rounded-t-3xl border border-gray-200 border-b-0 p-4 sm:p-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-900 to-electric-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              CareerPilot Mentor
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h2>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>{user?.target_role || 'Software Engineer'}</span>
              <span>•</span>
              <span className="text-electric-700 font-semibold uppercase">{language}</span>
            </div>
          </div>
        </div>

        {/* Right tools: Language switch & Clear */}
        <div className="flex items-center gap-2">
          {/* In-chat language switcher */}
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 focus:border-electric-500 outline-none"
          >
            {supportedLanguages.map(l => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.native}
              </option>
            ))}
          </select>

          <button
            onClick={handleClearHistory}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={t('chat.clear_history')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-slate-50/80 border-x border-gray-200 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-electric-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                  AI
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-primary-900 to-electric-700 text-white rounded-br-xs shadow-md'
                    : 'bg-white text-gray-800 border border-gray-200/90 rounded-bl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line prose prose-sm max-w-none">
                  {m.text}
                </div>
                <div className={`text-[10px] mt-2 flex items-center justify-end gap-1 ${isUser ? 'text-white/70' : 'text-gray-400'}`}>
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {isUser && (
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt="You"
                  className="w-8 h-8 rounded-full border border-gray-300 object-cover flex-shrink-0"
                />
              )}
            </div>
          );
        })}

        {sending && (
          <div className="flex items-center gap-2.5 text-gray-400 text-xs animate-pulse">
            <div className="w-8 h-8 rounded-full bg-electric-100 text-electric-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>{t('chat.typing')}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Prompts Ribbon */}
      <div className="bg-white border-x border-t border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">
          Quick Ask:
        </span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-electric-50 hover:text-electric-700 text-gray-700 text-xs font-medium border border-gray-200/70 whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-b-3xl border border-gray-200 border-t-0 p-4 shadow-sm">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 text-sm focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 text-gray-900 outline-none transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="px-5 py-3 rounded-2xl bg-electric-600 hover:bg-electric-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-electric-600/25 transition-all flex items-center gap-1.5"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">{t('chat.btn_send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
