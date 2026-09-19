import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Award,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Zap,
  BookOpen,
  Copy,
  Check,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  ShieldCheck,
  TrendingUp,
  Brain,
  Linkedin
} from 'lucide-react';
import { api } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import EmailGuardianCard from '../components/EmailGuardianCard';

export default function InternshipsPage() {
  const [activeTab, setActiveTab] = useState('matched'); // 'matched' | 'interview' | 'accountability'
  const [loading, setLoading] = useState(true);
  const [internshipsData, setInternshipsData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Filters & search
  const [domainFilter, setDomainFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Accountability state
  const [consistencyStatus, setConsistencyStatus] = useState(null);
  const [sendingNudge, setSendingNudge] = useState(false);
  const [nudgeResult, setNudgeResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.internships.getRecommendations(),
        api.internships.getQuestions(),
        api.reminders.getInconsistencyStatus()
      ]);

      if (results[0].status === 'fulfilled' && results[0].value) {
        setInternshipsData(results[0].value);
      }
      if (results[1].status === 'fulfilled' && results[1].value) {
        const qList = results[1].value.questions || [];
        setQuestions(qList);
        if (qList.length > 0) {
          setSelectedQuestion(qList[0]);
        }
      }
      if (results[2].status === 'fulfilled' && results[2].value) {
        setConsistencyStatus(results[2].value);
      }
    } catch (err) {
      console.error('Error loading internships data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!selectedQuestion || !userAnswer.trim()) return;
    setEvaluating(true);
    setEvaluationResult(null);

    try {
      const res = await api.internships.evaluateAnswer({
        question: selectedQuestion.question,
        answer: userAnswer,
        category: selectedQuestion.category,
        role: internshipsData?.candidate_target_role || 'Software Engineer Intern'
      });

      if (res && res.evaluation) {
        setEvaluationResult(res.evaluation);
      }
    } catch (err) {
      console.error('Failed to evaluate answer:', err);
      alert('Evaluation failed: ' + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSendNudge = async () => {
    setSendingNudge(true);
    setNudgeResult(null);
    try {
      const res = await api.reminders.sendInconsistencyNudge();
      setNudgeResult(res);
      const statusRes = await api.reminders.getInconsistencyStatus();
      setConsistencyStatus(statusRes);
    } catch (err) {
      console.error('Failed to dispatch nudge email:', err);
      alert('Error sending nudge: ' + err.message);
    } finally {
      setSendingNudge(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2500);
  };

  // Safe Filtered internships
  const filteredInternships = (internshipsData?.top_internships || []).filter(item => {
    if (!item) return false;
    const domain = (item.domain || '').toLowerCase();
    const role = (item.role || '').toLowerCase();
    const company = (item.company || '').toLowerCase();
    const reqSkills = Array.isArray(item.required_skills) ? item.required_skills : [];

    const matchesDomain = domainFilter === 'All' || domain.includes(domainFilter.toLowerCase()) || role.includes(domainFilter.toLowerCase());
    const matchesSearch = searchQuery === '' ||
      company.includes(searchQuery.toLowerCase()) ||
      role.includes(searchQuery.toLowerCase()) ||
      reqSkills.some(s => (s || '').toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title & Subtitle */}
        <div className="bg-gradient-to-r from-[#111C30] via-[#17243B] to-[#111C30] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> CareerPilot Autonomous AI Agent
              </div>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                AI Agent: Smart Internship Matcher & Interview Prep
              </h1>
              <p className="text-sm md:text-base text-slate-400 max-w-2xl">
                Autonomous AI agent that extracts verified skills from your resume, ranks high-yield tech internships, provides Claude-level interview tackle coaching, and maintains your daily consistency with automated email check-ins.
              </p>
            </div>

            {/* Quick Stats Pill */}
            {internshipsData && (
              <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shrink-0">
                <div className="text-center px-2">
                  <div className="text-2xl font-bold text-blue-400">{internshipsData.top_internships?.length || 8}</div>
                  <div className="text-xs text-slate-400">Matched Openings</div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center px-2">
                  <div className="text-2xl font-bold text-emerald-400">{internshipsData.detected_skills_count || 6}+</div>
                  <div className="text-xs text-slate-400">Parsed Skills</div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center px-2">
                  <div className="text-2xl font-bold text-purple-400">{questions.length || 8}</div>
                  <div className="text-xs text-slate-400">Tackle Questions</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('matched')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'matched'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Resume-Matched Internships</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 font-bold">
                {filteredInternships.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'interview'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Internship Interview Tackle Sandbox</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300 font-bold">
                AI Evaluator
              </span>
            </button>

            <button
              onClick={() => setActiveTab('accountability')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'accountability'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>AI Inconsistency Email Guardian</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 font-bold">
                Live Nudge
              </span>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-slate-400 text-sm">Matching internships with your resume and loading interview sandbox...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: RESUME-MATCHED INTERNSHIPS */}
            {activeTab === 'matched' && (
              <div className="space-y-6">
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111C30] border border-slate-800/80 p-4 rounded-xl">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search company, role, or skill..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Domain:
                    </span>
                    {['All', 'Full Stack', 'Cloud', 'Frontend', 'Backend', 'AI & Data'].map((dom) => (
                      <button
                        key={dom}
                        onClick={() => setDomainFilter(dom)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          domainFilter === dom
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candidate Skill Match Summary Banner */}
                <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-blue-950/40 border border-blue-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Target Role: <span className="text-blue-400">{internshipsData?.candidate_target_role || 'Software Engineer'}</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Ranked by semantic match between your resume skills and company qualification criteria.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(internshipsData?.detected_skills || []).slice(0, 7).map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-300 text-xs border border-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Internship Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredInternships.map((internship) => (
                    <div
                      key={internship.id}
                      className="bg-[#111C30] border border-slate-800/90 hover:border-blue-500/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-950/20 flex flex-col justify-between space-y-5 group"
                    >
                      <div>
                        {/* Card Top: Company & Fit Score */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                {internship.company_tier}
                              </span>
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                {internship.work_mode}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                              {internship.role}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-300">
                              <Building2 className="w-4 h-4 text-blue-400" />
                              <span>{internship.company}</span>
                            </div>
                          </div>

                          {/* Match Score Badge */}
                          <div className="flex flex-col items-end shrink-0">
                            <div className={`px-3 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1.5 border shadow-sm ${
                              internship.match_score >= 90
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                : 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                            }`}>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{internship.match_score}% Match</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 font-medium">{internship.match_tier}</span>
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-semibold text-emerald-400">{internship.stipend}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{internship.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5 col-span-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{internship.location}</span>
                          </div>
                        </div>

                        {/* AI Fit Analysis Box */}
                        <div className="mt-4 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            💡 <strong className="text-blue-300">AI Match Rationale:</strong> {internship.fit_analysis}
                          </p>
                        </div>

                        {/* Skill Badges (Matching vs Missing) */}
                        <div className="mt-4 space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-emerald-400 font-semibold mr-1">Matched:</span>
                            {(internship.matching_skills || internship.matchingSkills || []).map((sk, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                                <Check className="w-2.5 h-2.5" /> {sk}
                              </span>
                            ))}
                          </div>

                          {(internship.missing_skills || internship.skillsToLearn || []).length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-amber-400 font-semibold mr-1">To Brush Up:</span>
                              {(internship.missing_skills || internship.skillsToLearn || []).map((sk, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                                  ⚡ {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom: 1-Click Application Portals & Recruiter Outreach */}
                      <div className="pt-4 border-t border-slate-800/80 space-y-2">
                        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                          Apply via Direct Portals & Recruiter Connect:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={internship.apply_urls?.careers || internship.applyUrl || `https://www.google.com/search?q=${encodeURIComponent(internship.company + ' ' + internship.role + ' careers')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Company Portal
                          </a>
                          <a
                            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(internship.company + ' Technical Recruiter')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0A66C2]/80 hover:bg-[#0A66C2] text-white text-xs font-semibold transition-all"
                          >
                            <Linkedin className="w-3.5 h-3.5" /> Recruiters
                          </a>
                          {internship.apply_urls?.internshala && (
                            <a
                              href={internship.apply_urls.internshala}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white text-xs font-semibold transition-all"
                            >
                              Internshala
                            </a>
                          )}
                          {internship.apply_urls?.wellfound && (
                            <a
                              href={internship.apply_urls.wellfound}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-all"
                            >
                              Wellfound
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: INTERNSHIP INTERVIEW QUESTION TACKLE SANDBOX */}
            {activeTab === 'interview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Col: Question Catalog */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#111C30] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span>High-Yield Interview Questions</span>
                      </h3>
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                        {questions.length} Questions
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                      {questions.map((q) => {
                        const isSelected = selectedQuestion?.id === q.id;
                        return (
                          <div
                            key={q.id}
                            onClick={() => {
                              setSelectedQuestion(q);
                              setEvaluationResult(null);
                            }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/30'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                q.category.includes('Technical')
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : q.category.includes('Architecture')
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                {q.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">{q.difficulty}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                              {q.question}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Col: Interactive Answer Tackle & AI Evaluation */}
                <div className="lg:col-span-7 space-y-6">
                  {selectedQuestion && (
                    <div className="bg-[#111C30] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                      {/* Active Question Prompt */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {selectedQuestion.category} • {selectedQuestion.difficulty}
                          </span>
                          <span className="text-xs text-slate-400">Interactive Tackle Sandbox</span>
                        </div>
                        <h2 className="text-lg font-bold text-white leading-snug">
                          {selectedQuestion.question}
                        </h2>

                        {/* Recommended Blueprint */}
                        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Recommended Answer Structure:
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {selectedQuestion.recommended_structure}
                          </p>
                        </div>
                      </div>

                      {/* Candidate Answer Text Area */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold text-slate-300">
                            Your Answer / Technical Defense:
                          </label>
                          <span className="text-slate-400">
                            {userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0} words
                          </span>
                        </div>

                        <textarea
                          rows={6}
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type your response here using the STAR format (Situation, Task, Action, Result) or detailing algorithmic complexity & architecture trade-offs..."
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 font-mono leading-relaxed"
                        />
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setUserAnswer('')}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={handleEvaluateAnswer}
                          disabled={evaluating || !userAnswer.trim()}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all"
                        >
                          {evaluating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating with AI Mentor...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" /> Evaluate My Answer with AI
                            </>
                          )}
                        </button>
                      </div>

                      {/* AI Evaluation Output */}
                      {evaluationResult && (
                        <div className="mt-6 pt-6 border-t border-slate-800 space-y-5 animate-fadeIn">
                          {/* Score & Grade Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 p-4 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-bold text-lg text-purple-300">
                                {evaluationResult.score}/10
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{evaluationResult.grade}</div>
                                <div className="text-xs text-slate-400">AI Senior Hiring Manager Verdict</div>
                              </div>
                            </div>
                            <div className="text-xs font-medium text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                              🎯 {evaluationResult.key_takeaway || 'Quantify results and trade-offs'}
                            </div>
                          </div>

                          {/* Strengths & Blindspots Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strengths */}
                            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" /> Strong Points Demonstrated:
                              </div>
                              <ul className="space-y-1.5 text-xs text-slate-300">
                                {(evaluationResult.strengths || []).map((s, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-400">•</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Blindspots */}
                            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                                <AlertTriangle className="w-4 h-4" /> Missing Elements & Blindspots:
                              </div>
                              <ul className="space-y-1.5 text-xs text-slate-300">
                                {(evaluationResult.blindspots || []).map((b, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-amber-400">•</span>
                                    <span>{b}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Senior Mentor Model Answer */}
                          <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                                <Award className="w-4 h-4" /> Senior Mentor Exemplary Model Answer (STAR):
                              </div>
                              <button
                                onClick={() => copyToClipboard(evaluationResult.senior_mentor_model_answer)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                              >
                                {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedAnswer ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                              <MarkdownRenderer content={evaluationResult.senior_mentor_model_answer} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: AI GOAL INCONSISTENCY EMAIL GUARDIAN */}
            {activeTab === 'accountability' && (
              <div className="space-y-6">
                {/* Full Email Guardian Access & Device Sync Card */}
                <EmailGuardianCard
                  onEmailSent={() => {
                    api.reminders.getInconsistencyStatus().then(setConsistencyStatus);
                  }}
                />

                {/* Consistency Health Metrics */}
                <div className="bg-[#111C30] border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
                    Live Velocity & Accountability Telemetry
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="text-xs text-slate-400">Consistency Health Score</span>
                      <div className="text-2xl font-bold text-emerald-400">
                        {consistencyStatus?.consistencyScore || 85}%
                      </div>
                      <p className="text-[11px] text-slate-400">Based on task completion velocity</p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="text-xs text-slate-400">Active Goals</span>
                      <div className="text-2xl font-bold text-blue-400">
                        {consistencyStatus?.totalGoals || 1}
                      </div>
                      <p className="text-[11px] text-slate-400">Target milestones tracked</p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="text-xs text-slate-400">Pending Tasks</span>
                      <div className="text-2xl font-bold text-amber-400">
                        {consistencyStatus?.pendingTasks || 3}
                      </div>
                      <p className="text-[11px] text-slate-400">Waiting for daily check-in</p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="text-xs text-slate-400">Guardian Status</span>
                      <div className="text-2xl font-bold text-purple-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-6 h-6 text-purple-400" /> Active
                      </div>
                      <p className="text-[11px] text-slate-400">Auto check-in &amp; mobile sync</p>
                    </div>
                  </div>
                </div>

                {/* Email Dispatch Result Preview */}
                {nudgeResult && (
                  <div className="bg-[#111C30] border border-emerald-500/40 rounded-2xl p-6 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Email Successfully Dispatched to {nudgeResult.recipient}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(nudgeResult.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {nudgeResult.nudge && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                        <div className="text-xs font-semibold text-slate-400 uppercase">
                          Subject: <strong className="text-white normal-case">{nudgeResult.nudge.subject}</strong>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono">
                          <p className="font-bold text-amber-400 mb-2">⚠️ {nudgeResult.nudge.inconsistency_diagnosis}</p>
                          <p className="text-slate-300 mb-3">{nudgeResult.nudge.motivation_message}</p>
                          <p className="text-emerald-400 font-bold">⚡ Quick Step: {nudgeResult.nudge.quick_action_step}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Reminders Log Table */}
                <div className="bg-[#111C30] border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>Recent Automated Reminder & Nudge History</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="p-3 rounded-l-lg">Type / Subject</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 rounded-r-lg">Dispatched At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(consistencyStatus?.recentReminders || []).map((rem) => (
                          <tr key={rem.id} className="hover:bg-slate-900/40">
                            <td className="p-3 font-medium text-slate-200 max-w-md truncate">
                              {rem.reminder_text}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                Delivered (Email)
                              </span>
                            </td>
                            <td className="p-3 text-slate-400">
                              {new Date(rem.sent_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
