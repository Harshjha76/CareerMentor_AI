import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  ArrowRight,
  Loader2,
  Award,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  Mail,
  Phone,
  Linkedin,
  Github
} from 'lucide-react';

export default function ResumeAnalyzerPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('extracted');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [extractedProfile, setExtractedProfile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    // Load existing analyzed resume if available
    api.resume.getLatest()
      .then(res => {
        if (res.resume) {
          setAnalysisResult({
            score: res.resume.score,
            ...(res.resume.analysis || res.resume.feedback || {})
          });
          if (res.resume.extractedProfile) {
            setExtractedProfile(res.resume.extractedProfile);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const res = await api.resume.upload(file);
      setAnalysisResult({
        score: res.score,
        ...res.analysis
      });
      setExtractedProfile(res.extractedProfile);
      setActiveTab('extracted');
    } catch (err) {
      alert('Analysis error: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUseSampleResume = async () => {
    setAnalyzing(true);
    try {
      const sampleText = `Candidate: Aarav Sharma
Email: aarav.sharma.dev@gmail.com | Phone: +91 98765 43210
LinkedIn: linkedin.com/in/aarav-sharma | GitHub: github.com/aarav-sharma
Target Role: Full Stack Software Engineer

Education:
- B.Tech in Computer Science & Engineering, IIIT Hyderabad (2022 - 2026), GPA: 8.8 / 10

Work & Project Experience:
1. CareerMentor AI: Real-Time Guidance Platform
   - Technologies: React, Node.js, Express, PostgreSQL, Tailwind CSS
   - Architected end-to-end full stack architecture with multi-language Devanagari localization.
   - Built ATS scoring pipeline using natural language parsing, reducing review turnaround by 80%.
2. Distributed Task Scheduler Microservice
   - Technologies: Python, Redis, FastAPI, Docker
   - Implemented asynchronous worker queue handling 5,000 requests/sec with zero job starvation.
   - Optimized database indexing, improving query throughput by 35%.

Categorized Skills:
- Languages: Python, JavaScript, TypeScript, SQL, C++
- Frameworks: React, Node.js, Express, FastAPI, Tailwind CSS
- Databases: PostgreSQL, MongoDB, Redis, SQLite
- Cloud & DevOps: Docker, AWS (S3/EC2), Git, Linux
- Core Competencies: Data Structures & Algorithms, System Design, REST APIs, OOP

Certifications:
- AWS Certified Cloud Practitioner
- Stanford Algorithms Specialization`;

      const blob = new Blob([sampleText], { type: 'text/plain' });
      const sampleFile = new File([blob], 'Aarav_Sharma_Resume.txt', { type: 'text/plain' });
      setFile(sampleFile);

      const res = await api.resume.upload(sampleFile);
      setAnalysisResult({
        score: res.score,
        ...res.analysis
      });
      setExtractedProfile(res.extractedProfile);
      setActiveTab('extracted');
    } catch (err) {
      alert('Error analyzing sample: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!analysisResult) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('CareerPilot AI - Resume Feedback & Extraction Report', 20, 20);

    doc.setFontSize(11);
    doc.text(`Candidate: ${extractedProfile?.personal_info?.name || user?.name || 'Student'}`, 20, 32);
    doc.text(`Target Role: ${user?.target_role || 'Software Engineer'}`, 20, 40);
    doc.text(`Overall ATS Score: ${analysisResult.score}/100`, 20, 48);

    doc.setFontSize(13);
    doc.text('ATS Summary & Evaluation:', 20, 60);
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(analysisResult.summary || 'Strong candidate baseline.', 170);
    doc.text(splitSummary, 20, 68);

    let y = 88;
    doc.setFontSize(13);
    doc.text('Key Actionable Recommendations:', 20, y);
    doc.setFontSize(10);
    y += 8;

    (analysisResult.actionable_recommendations || []).forEach((rec, idx) => {
      const splitRec = doc.splitTextToSize(`${idx + 1}. ${rec}`, 170);
      doc.text(splitRec, 20, y);
      y += splitRec.length * 6 + 2;
    });

    doc.save(`CareerPilot_Resume_Report_${user?.name?.replace(/\s+/g, '_') || 'Report'}.pdf`);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
    if (score >= 70) return 'text-amber-600 border-amber-500 bg-amber-50';
    return 'text-rose-600 border-rose-500 bg-rose-50';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-electric-600" />
            {t('resume.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('resume.subtitle')}
          </p>
        </div>

        {analysisResult && (
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all self-start md:self-auto"
          >
            <Download className="w-4 h-4 text-tealBrand-300" />
            {t('resume.download_pdf')}
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragOver
              ? 'border-electric-500 bg-electric-50/50 scale-[0.99]'
              : 'border-gray-300 hover:border-electric-400 bg-slate-50/60'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-electric-100 text-electric-600 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-1">
            {file ? file.name : t('resume.drag_drop')}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {t('resume.supported_formats')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 shadow-xs transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              Select File from Device
            </label>

            <button
              type="button"
              onClick={handleUseSampleResume}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-electric-50 border border-electric-200 text-electric-700 text-xs font-semibold hover:bg-electric-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-electric-600" />
              Use Pre-filled Sample Resume
            </button>
          </div>
        </div>

        {file && !analyzing && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAnalyze}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white font-bold text-sm shadow-md shadow-electric-600/20 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Start Deep Extraction & Analysis
            </button>
          </div>
        )}

        {analyzing && (
          <div className="py-8 text-center space-y-2">
            <Loader2 className="w-8 h-8 text-electric-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-700">{t('resume.analyzing')}</p>
          </div>
        )}
      </div>

      {/* Analysis & Extracted Profile Results */}
      {analysisResult && !analyzing && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                {t('resume.overall_score')}
              </span>
              <h2 className="text-2xl font-black text-gray-900">
                {analysisResult.score >= 80 ? t('resume.ats_grade_good') : t('resume.ats_grade_avg')}
              </h2>
              <p className="text-xs text-gray-500 max-w-lg">
                Extracted candidate information verified for target role: <strong className="text-gray-800">{user?.target_role || 'Software Engineer'}</strong>
              </p>
            </div>

            {/* Circular score display */}
            <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center font-black ${getScoreColor(analysisResult.score)} shadow-inner`}>
              <span className="text-3xl">{analysisResult.score}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">/ 100</span>
            </div>
          </div>

          {/* Feedback Tabs */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Tab navigation */}
            <div className="flex overflow-x-auto border-b border-gray-100 bg-slate-50/70 p-2 gap-1.5">
              {[
                { id: 'extracted', label: t('resume.tab_extracted') },
                { id: 'summary', label: t('resume.tab_summary') },
                { id: 'formatting', label: t('resume.tab_formatting') },
                { id: 'missing', label: t('resume.tab_missing') },
                { id: 'keywords', label: t('resume.tab_keywords') },
                { id: 'grammar', label: t('resume.tab_grammar') },
                { id: 'actions', label: t('resume.tab_actions') },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-electric-700 shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab contents */}
            <div className="p-6 sm:p-8">
              {/* TAB: EXTRACTED RESUME PROFILE (Requested by User!) */}
              {activeTab === 'extracted' && extractedProfile && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-electric-600" />
                      {t('resume.extracted_details_title')}
                    </h3>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                      Parsed Automatically
                    </span>
                  </div>

                  {/* Personal & Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-gray-100 text-xs">
                    <div>
                      <span className="font-bold text-gray-400 block mb-0.5">Name</span>
                      <span className="font-extrabold text-gray-900 text-sm">{extractedProfile.personal_info?.name || 'Aarav Sharma'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-400 block mb-0.5">Email</span>
                      <span className="font-semibold text-gray-800">{extractedProfile.personal_info?.email || 'student@example.com'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-400 block mb-0.5">Phone</span>
                      <span className="font-semibold text-gray-800">{extractedProfile.personal_info?.phone || '+91 98765 43210'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-400 block mb-0.5">Profiles</span>
                      <div className="flex items-center gap-2 text-electric-700 font-semibold">
                        <span>GitHub</span> • <span>LinkedIn</span>
                      </div>
                    </div>
                  </div>

                  {/* Education */}
                  {extractedProfile.education && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-electric-600" /> Education
                      </h4>
                      {extractedProfile.education.map((edu, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                            <span>{edu.degree}</span>
                            <span className="text-gray-400">{edu.year}</span>
                          </div>
                          <div className="text-xs text-gray-600">{edu.institution} • GPA: {edu.gpa}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Experience & Projects */}
                  {extractedProfile.experience_and_projects && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-tealBrand-600" /> Projects & Experience
                      </h4>
                      {extractedProfile.experience_and_projects.map((exp, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                            <span className="text-sm font-extrabold">{exp.title}</span>
                            <span className="text-xs text-gray-400 font-normal">{exp.organization}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(exp.technologies || []).map((t, ti) => (
                              <span key={ti} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {t}
                              </span>
                            ))}
                          </div>
                          <ul className="space-y-1 pl-4 text-xs text-gray-600 list-disc">
                            {(exp.highlights || []).map((hl, hli) => (
                              <li key={hli}>{hl}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Categorized Skills */}
                  {extractedProfile.categorized_skills && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-purple-600" /> Extracted Skills Inventory
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {Object.entries(extractedProfile.categorized_skills).map(([categoryKey, skillArr]) => (
                          <div key={categoryKey} className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                            <span className="font-bold capitalize text-gray-700 block mb-1.5">
                              {categoryKey.replace(/_/g, ' ')}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {(skillArr || []).map((s, si) => (
                                <span key={si} className="px-2 py-0.5 rounded bg-white text-gray-800 border border-gray-200 text-[11px] font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 1. Summary */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-electric-600" /> Overview & ATS Readiness
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 text-sm text-gray-700 leading-relaxed">
                    {analysisResult.summary}
                  </div>
                </div>
              )}

              {/* 2. Formatting */}
              {activeTab === 'formatting' && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-900">Structure & Formatting Checks</h3>
                  {(analysisResult.formatting || []).map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-gray-100 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Missing Sections */}
              {activeTab === 'missing' && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-900">Missing or Incomplete Sections</h3>
                  {(analysisResult.missing_sections || []).map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-sm text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Keywords */}
              {activeTab === 'keywords' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs uppercase font-bold text-emerald-700 mb-2">
                      Present Industry Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysisResult.keyword_optimization?.present || []).map((k, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                          ✓ {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase font-bold text-rose-700 mb-2">
                      Recommended Missing Keywords to Add
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysisResult.keyword_optimization?.missing || []).map((k, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
                          + {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Grammar */}
              {activeTab === 'grammar' && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-900">Grammar, Clarity & Impact Verbs</h3>
                  {(analysisResult.grammar_clarity || []).map((item, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-gray-200 text-sm text-gray-700">
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {/* 6. Actionable Suggestions */}
              {activeTab === 'actions' && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-900">Top Priority Action Steps</h3>
                  {(analysisResult.actionable_recommendations || []).map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-electric-50/60 border border-electric-200 text-sm text-electric-950 font-medium">
                      <span className="w-5 h-5 rounded-full bg-electric-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
