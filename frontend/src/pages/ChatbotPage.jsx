import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  Plus,
  ArrowRight,
  Mic,
  MicOff,
  Paperclip,
  X,
  FileText,
  Clock,
  ChevronRight,
  Search
} from 'lucide-react';

export default function ChatbotPage() {
  const { user } = useAuth();
  const { t, language, changeLanguage, supportedLanguages } = useLanguage();

  // Multi-session states
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Input states
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Voice & File attachments
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileReading, setFileReading] = useState(false);

  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // 1. Initial Load: Fetch User's Chat Sessions
  useEffect(() => {
    loadSessions();
  }, []);

  // 2. Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.chat.getSessions();
      const userSessions = res.sessions || [];
      setSessions(userSessions);

      if (userSessions.length > 0) {
        const firstSession = userSessions[0];
        setActiveSessionId(firstSession.id);
        await loadSessionMessages(firstSession.id);
      } else {
        await handleCreateNewSession();
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    setLoadingMessages(true);
    try {
      const res = await api.chat.getSessionMessages(sessionId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to load messages for session:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    setMobileSidebarOpen(false);
    await loadSessionMessages(sessionId);
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await api.chat.createSession('New Career Discussion');
      if (res.session) {
        setSessions(prev => [res.session, ...prev]);
        setActiveSessionId(res.session.id);
        setMessages(res.initialMessage ? [res.initialMessage] : []);
        setMobileSidebarOpen(false);
      }
    } catch (err) {
      alert('Failed to start new chat: ' + err.message);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await api.chat.deleteSession(sessionId);
      const remaining = sessions.filter(s => s.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          await loadSessionMessages(remaining[0].id);
        } else {
          await handleCreateNewSession();
        }
      }
    } catch (err) {
      alert('Failed to delete session: ' + err.message);
    }
  };

  // Voice speech recognition via Web Speech API
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'sa' ? 'sa-IN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = (err) => {
        console.warn('Speech recognition notice:', err);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Attachment upload (PDF, DOCX, TXT, JSON, MD)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileReading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result || '';
      setAttachedFile({
        name: file.name,
        type: file.name.endsWith('.json') ? 'roadmap' : 'document',
        size: (file.size / 1024).toFixed(1) + ' KB',
        content: text.slice(0, 5000)
      });
      setFileReading(false);
    };

    reader.onerror = () => {
      alert('Failed to read document.');
      setFileReading(false);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSendMessage = async (textToSend = null) => {
    const messageContent = (textToSend !== null ? textToSend : inputText).trim();
    if ((!messageContent && !attachedFile) || sending || !activeSessionId) return;

    const outgoingText = messageContent || (attachedFile ? `Uploaded attachment: ${attachedFile.name}` : '');
    const currentAttachment = attachedFile;

    setInputText('');
    setAttachedFile(null);
    setSending(true);

    // Optimistic user message update
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      session_id: activeSessionId,
      sender: 'user',
      text: outgoingText,
      attachment_name: currentAttachment?.name || null,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.chat.sendSessionMessage(
        activeSessionId,
        outgoingText,
        language,
        currentAttachment
      );

      // Replace with confirmed user message + AI reply
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        res.userMessage || tempUserMsg,
        res.message
      ]);

      // Update session title in list if title changed
      if (res.sessionTitle) {
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, title: res.sessionTitle, updated_at: new Date().toISOString() };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error('Send message error:', err);
      const isAuthIssue = err.message?.toLowerCase().includes('session') || err.message?.toLowerCase().includes('token') || err.message?.toLowerCase().includes('database');
      const guidance = isAuthIssue
        ? `⚠️ **Session Notice**: ${err.message}. Please refresh the page or sign in with your email to continue your career session.`
        : `⚠️ **Connection notice**: ${err.message}. Please verify your network and try again.`;
      
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          session_id: activeSessionId,
          sender: 'ai',
          text: guidance,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Filtered session list based on search
  const filteredSessions = sessions.filter(s =>
    (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick prompt chips requested
  const contextualPrompts = [
    "What skills should I learn for Java backend development?",
    "Analyze my career progress.",
    "Create a study plan for me.",
    "What should I improve in my resume?"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-8.5rem)] min-h-[580px] flex gap-5">
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR: Conversation Sessions History */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#111827] border-r border-[#1E293B] p-4 flex flex-col transition-transform duration-200 lg:static lg:z-auto lg:rounded-3xl lg:border shadow-2xl ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#F8FAFC]">Chat Sessions</h3>
              <p className="text-[10px] text-[#94A3B8]">Database-backed history</p>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* + New Chat Button */}
        <button
          onClick={handleCreateNewSession}
          className="w-full py-2.5 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563eb] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#3B82F6]/20 transition-all active:scale-[0.99] mb-3"
        >
          <Plus className="w-4 h-4" />
          <span>New Career Chat</span>
        </button>

        {/* Session Search */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#172033] border border-[#1E293B] text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#3B82F6] outline-none"
          />
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-12 text-[#94A3B8] text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />
              <span>Loading sessions...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#94A3B8]">
              No conversations found.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`group relative p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                    isActive
                      ? 'bg-[#172033] border-[#3B82F6]/50 shadow-xs text-[#F8FAFC]'
                      : 'bg-transparent border-transparent hover:bg-[#172033]/60 text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 overflow-hidden">
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isActive ? 'text-[#06B6D4]' : 'text-[#94A3B8]'}`} />
                    <div className="overflow-hidden">
                      <div className="font-semibold text-xs truncate max-w-[170px]">
                        {session.title || 'Career Discussion'}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(session.updated_at || session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-3 border-t border-[#1E293B] mt-2 flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>AI Calibrated</span>
          </span>
          <span className="font-mono text-[10px]">{user?.available_study_minutes || 57}m/day</span>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CHAT AREA */}
      {/* ========================================================= */}
      <section className="flex-1 bg-[#111827] border border-[#1E293B] rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
        {/* Top Chat Session Header */}
        <div className="p-4 bg-[#111827]/90 backdrop-blur-md border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile toggle button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#172033] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] via-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-[#F8FAFC] max-w-[280px] sm:max-w-md truncate">
                  {activeSession?.title || 'Career Discussion'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] text-[10px] font-bold border border-[#10B981]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  Active
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Target: <strong className="text-[#F8FAFC]">{user?.target_role || 'Software Engineer'}</strong> • {user?.dream_companies || 'Top Tech'}
              </p>
            </div>
          </div>

          {/* Right Tools: Language switch & Delete session */}
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#1E293B] bg-[#172033] text-xs font-bold text-[#F8FAFC] focus:border-[#3B82F6] outline-none"
            >
              {supportedLanguages.map(l => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.native}
                </option>
              ))}
            </select>

            {activeSessionId && (
              <button
                onClick={(e) => handleDeleteSession(activeSessionId, e)}
                className="p-2 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-[#1E293B] transition-colors"
                title="Delete this session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 bg-[#0B1220]/60 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loadingMessages ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8] text-xs gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#3B82F6]" />
              <span>Loading conversation stream...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#172033] border border-[#1E293B] text-[#06B6D4] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-bold text-sm text-[#F8FAFC]">Ready to strategize your career</h4>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                Ask any question about coding patterns, system design, resume critique, or study scheduling below.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] text-white flex items-center justify-center flex-shrink-0 text-xs font-black shadow-xs mt-1">
                      AI
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#3B82F6] text-white rounded-tr-xs shadow-md shadow-[#3B82F6]/20'
                        : 'bg-[#172033] text-[#F8FAFC] border border-[#1E293B] rounded-tl-xs shadow-xs space-y-2'
                    }`}
                  >
                    {/* Attachment preview if user uploaded file */}
                    {m.attachment_name && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 text-xs font-mono text-cyan-200 mb-2 border border-white/10">
                        <Paperclip className="w-3 h-3" />
                        <span>{m.attachment_name}</span>
                      </div>
                    )}

                    <div className="whitespace-pre-line prose prose-invert prose-sm max-w-none text-[#F8FAFC]">
                      {m.text}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(m.created_at || m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(m.text, m.id)}
                          className="hover:text-[#F8FAFC] flex items-center gap-1 p-1 transition-colors"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#10B981]" />
                              <span className="text-[#10B981] font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <img
                      src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt="You"
                      className="w-8 h-8 rounded-full border border-[#3B82F6]/50 object-cover flex-shrink-0 mt-1"
                    />
                  )}
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-center gap-3 text-xs animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[#172033] border border-[#1E293B] text-[#06B6D4] flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-[#172033] border border-[#1E293B] text-xs text-[#94A3B8] shadow-xs">
                CareerPilot is formulating your technical strategy...
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips (Common queries) */}
        <div className="bg-[#111827] border-t border-[#1E293B] px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-[#94A3B8] whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#06B6D4]" /> Ideas:
          </span>
          {contextualPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1 rounded-full bg-[#172033] hover:bg-[#1E293B] hover:border-[#3B82F6]/40 text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-medium border border-[#1E293B] whitespace-nowrap transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Box Footer with Voice Mic & File Attachment */}
        <div className="p-4 bg-[#111827] border-t border-[#1E293B] space-y-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.json,.md"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Attached file chip */}
          {attachedFile && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#172033] border border-[#3B82F6]/40 text-xs text-[#F8FAFC] w-fit animate-in fade-in">
              <FileText className="w-4 h-4 text-[#06B6D4]" />
              <span className="font-semibold max-w-[220px] truncate">{attachedFile.name}</span>
              <span className="text-[10px] text-[#94A3B8] font-mono">({attachedFile.size})</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-0.5 text-[#94A3B8] hover:text-red-400 rounded-full"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-2 sm:gap-3"
          >
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#172033] rounded-2xl border border-[#1E293B] transition-colors"
              title="Upload personal roadmap or document (PDF, TXT, JSON)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-3 rounded-2xl border transition-all ${
                isListening
                  ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/30 animate-pulse'
                  : 'text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#172033] border-[#1E293B]'
              }`}
              title={isListening ? "Listening... (Click to stop)" : "Speak via Microphone"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Listening... speak now..." : t('chat.placeholder')}
              className="flex-1 px-4 py-3 rounded-2xl bg-[#0B1220] border border-[#1E293B] text-sm focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 text-[#F8FAFC] placeholder-[#94A3B8] outline-none transition-all"
            />

            <button
              type="submit"
              disabled={(!inputText.trim() && !attachedFile) || sending}
              className="px-5 sm:px-6 py-3 rounded-2xl bg-[#3B82F6] hover:bg-[#2563eb] disabled:opacity-40 text-white font-bold text-sm shadow-lg shadow-[#3B82F6]/20 transition-all flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">{t('chat.btn_send')}</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
