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
  Copy,
  Check,
  Code2,
  Briefcase,
  HelpCircle,
  Clock,
  ArrowRight,
  Mic,
  MicOff,
  Paperclip,
  X,
  FileText
} from 'lucide-react';

export default function ChatbotPage() {
  const { user } = useAuth();
  const { t, language, changeLanguage, supportedLanguages } = useLanguage();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Speech & Attachment States
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileReading, setFileReading] = useState(false);
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

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
      return `नमस्ते **${name || 'विद्यार्थी'}**! 🌟\n\nमैं आपका 24/7 **करियरपायलट एआई मेंटर** हूँ। आपके लक्ष्य **${role || 'सॉफ्टवेयर इंजीनियर'}** के लिए:\n- तकनीकी व कोडिंग साक्षात्कार (DSA, System Design)\n- बिहेवियरल इंटरव्यू (STAR विधि)\n- रिज्यूमे विश्लेषण व प्रोजेक्ट मार्गदर्शन\n\nआप किस विषय में गहराई से जानना चाहते हैं?`;
    }
    if (lang === 'mr') {
      return `नमस्कार **${name || 'विद्यार्थी मित्र'}**! 🌟\n\nमी तुमचा २४/७ **करिअरपायलट मार्गदर्शक** आहे. तुमच्या **${role || 'सॉफ्टवेअर इंजिनिअर'}** या ध्येयासाठी:\n- तांत्रिक व कोडिंग मुलाखती (DSA, System Design)\n- बिहेव्हियरल प्रश्न (STAR पद्धत)\n- रेझ्युमे प्रोजेक्ट्स व कंपनी निवड\n\nआपण आज कोणत्या विषयाने सुरुवात करूया?`;
    }
    if (lang === 'sa') {
      return `नमस्ते **${name || 'छात्र'}**! 🌟\n\nअहं तव २४/७ **करियरपायलट् वृत्तिमार्गदर्शकः** अस्मि। तव अभीष्टपदस्य **${role || 'Software Engineer'}** कृते:\n- तान्त्रिक-साक्षात्कारः (DSA, System Design)\n- व्यावहारिक-प्रश्नाः (STAR-विधिः)\n- सारांशपत्र-प्रकल्पमार्गदर्शनम्\n\nकिम् अधिकृत्य अद्य चर्चां कुर्मः?`;
    }
    return `Hello **${name || 'there'}**! 🌟\n\nI am your 24/7 personal **CareerPilot AI Mentor** (operating with ChatGPT-4o & Claude-level career intelligence).\n\nI am calibrated for your target role (**${role || 'Full Stack Software Engineer'}**) and dream companies:\n- **Technical Mastery**: Live mock interviews, system design blueprints, and DSA optimization.\n- **Behavioral Frameworks**: STAR method interview coaching.\n- **Portfolio Engineering**: Architecting standout projects that impress hiring managers.\n\nWhat specific challenge can we tackle together right now?`;
  }

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
        content: typeof text === 'string' ? text : 'Binary file'
      });
      setFileReading(false);
    };

    reader.onerror = () => {
      alert('Failed to read file');
      setFileReading(false);
    };

    reader.readAsText(file);
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if ((!query.trim() && !attachedFile) || sending) return;

    const attachmentPayload = attachedFile ? { ...attachedFile } : null;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query || (attachmentPayload ? `Uploaded: ${attachmentPayload.name}` : ''),
      attachment: attachmentPayload,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAttachedFile(null);
    setSending(true);

    try {
      const res = await api.chat.sendMessage(query, language, attachmentPayload);
      setMessages(prev => [...prev, res.message]);
    } catch (err) {
      alert('Error communicating with mentor: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  // Dynamic follow-up suggestion chips
  const dynamicFollowUps = [
    "Simulate a live 15-minute coding interview",
    "How do I explain system design trade-offs?",
    "Give me 3 high-impact bullet points for my resume"
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Banner */}
      <div className="bg-white rounded-t-3xl border border-gray-200 border-b-0 p-4 sm:p-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-900 to-electric-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              CareerPilot Agent
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                ChatGPT / Claude Level
              </span>
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
      <div className="flex-1 bg-slate-50/80 border-x border-gray-200 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-900 to-electric-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-black shadow-xs mt-1">
                  AI
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-primary-900 to-electric-700 text-white rounded-tr-xs shadow-md'
                    : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-xs shadow-xs space-y-3'
                }`}
              >
                <div className="whitespace-pre-line prose prose-sm max-w-none">
                  {m.text}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(m.text, m.id)}
                      className="hover:text-gray-700 flex items-center gap-1 p-1 transition-colors"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied</span>
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
                  className="w-8 h-8 rounded-full border border-gray-300 object-cover flex-shrink-0 mt-1"
                />
              )}
            </div>
          );
        })}

        {sending && (
          <div className="flex items-center gap-3 text-gray-400 text-xs animate-pulse">
            <div className="w-8 h-8 rounded-full bg-electric-100 text-electric-600 flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200 text-xs text-gray-600 shadow-xs">
              CareerPilot is analyzing technical & strategic context...
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Topics / Follow-ups */}
      <div className="bg-white border-x border-t border-gray-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-electric-600" /> Prompts:
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

      {/* Input Box with Attachment Chip and Voice Mic */}
      <div className="bg-white rounded-b-3xl border border-gray-200 border-t-0 p-4 shadow-sm space-y-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.json,.md"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Attachment preview chip */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 w-fit animate-in fade-in">
            <FileText className="w-4 h-4 text-purple-600" />
            <span className="font-semibold max-w-[220px] truncate">{attachedFile.name}</span>
            <span className="text-[10px] text-purple-500 font-mono">({attachedFile.size})</span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-0.5 text-purple-400 hover:text-purple-700 rounded-full"
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
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-2xl border border-gray-200 transition-colors"
            title="Upload personal roadmap or document (PDF, TXT, JSON)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-3 rounded-2xl border transition-all ${
              isListening
                ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/30 animate-pulse'
                : 'text-gray-500 hover:text-electric-700 hover:bg-electric-50 border-gray-200'
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
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 text-sm focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 text-gray-900 outline-none transition-all"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !attachedFile) || sending}
            className="px-5 sm:px-6 py-3 rounded-2xl bg-electric-600 hover:bg-electric-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-electric-600/25 transition-all flex items-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">{t('chat.btn_send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
