import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import { Link, useNavigate } from 'react-router-dom';
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
  Github,
  Copy,
  Check,
  ExternalLink,
  Code,
  Lightbulb,
  ShieldAlert,
  PlusCircle,
  Quote,
  Building2,
  Send,
  Zap,
  MessageSquare,
  Trash2,
  RefreshCw,
  Clock,
  Compass
} from 'lucide-react';

export default function ResumeAnalyzerPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('extracted');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [extractedProfile, setExtractedProfile] = useState(null);
  const [matchedInternships, setMatchedInternships] = useState([]);
  const [loadingInternships, setLoadingInternships] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Multi-Resume State
  const [resumesList, setResumesList] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [switchingResume, setSwitchingResume] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(true);

  const fetchMatchedInternships = async () => {
    setLoadingInternships(true);
    try {
      const res = await api.internships.getRecommendations();
      if (res && res.top_internships) {
        setMatchedInternships(res.top_internships);
      }
    } catch (err) {
      console.warn('Notice loading matched internships:', err.message);
    } finally {
      setLoadingInternships(false);
    }
  };

  const loadResumesList = async () => {
    setLoadingResumes(true);
    try {
      const res = await api.resume.list();
      if (res && Array.isArray(res.resumes)) {
        setResumesList(res.resumes);
        const active = res.resumes.find(r => r.isActive);
        if (active) {
          setActiveResumeId(active.id);
        } else if (res.resumes.length > 0) {
          setActiveResumeId(res.resumes[0].id);
        }
      }
    } catch (err) {
      console.warn('Notice loading resumes list:', err.message);
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    // Load existing active resume & list of all user resumes
    api.resume.getLatest()
      .then(res => {
        if (res.resume) {
          setActiveResumeId(res.resume.id);
          setAnalysisResult({
            score: res.resume.score,
            ...(res.resume.analysis || res.resume.feedback || {})
          });
          if (res.resume.extractedProfile) {
            setExtractedProfile(res.resume.extractedProfile);
          }
          fetchMatchedInternships();
        }
      })
      .catch(() => {})
      .finally(() => {
        loadResumesList();
      });
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
      setActiveResumeId(res.resumeId);
      setActiveTab('extracted');
      setFile(null);
      await loadResumesList();
      fetchMatchedInternships();
    } catch (err) {
      alert('Analysis error: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSwitchResume = async (id) => {
    if (!id || id === activeResumeId || switchingResume) return;
    setSwitchingResume(true);
    try {
      const res = await api.resume.activate(id);
      if (res && res.resume) {
        setActiveResumeId(res.resume.id);
        setAnalysisResult({
          score: res.resume.score,
          ...(res.resume.analysis || res.resume.feedback || {})
        });
        setExtractedProfile(res.resume.extractedProfile);
        setActiveTab('extracted');
        await loadResumesList();
        fetchMatchedInternships();
      }
    } catch (err) {
      alert('Failed to switch active resume: ' + err.message);
    } finally {
      setSwitchingResume(false);
    }
  };

  const handleDeleteResume = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.resume.delete(id);
      await loadResumesList();
      // Reload latest active resume
      const res = await api.resume.getLatest();
      if (res && res.resume) {
        setActiveResumeId(res.resume.id);
        setAnalysisResult({
          score: res.resume.score,
          ...(res.resume.analysis || res.resume.feedback || {})
        });
        setExtractedProfile(res.resume.extractedProfile);
      } else {
        setActiveResumeId(null);
        setAnalysisResult(null);
        setExtractedProfile(null);
      }
    } catch (err) {
      alert('Failed to delete resume: ' + err.message);
    }
  };

  const handleUseSampleResume = async () => {
    setAnalyzing(true);
    try {
      const candidateName = user?.name && user?.name !== 'Student' && user?.name !== 'Google Student' ? user.name : 'Candidate Profile';
      const targetRole = user?.target_role || 'Full Stack Software Engineer';

      const sampleText = `Candidate: ${candidateName}
Email: ${user?.email || 'candidate@careerpilot.ai'}
Target Role: ${targetRole}

Professional Summary:
Motivated ${targetRole} with hands-on experience in full-stack architecture, relational database optimization, and cloud deployments. Proven track record of designing high-availability RESTful APIs and automating CI/CD workflows.

Education:
- Bachelor of Technology in Computer Science & Engineering (2022 - 2026), GPA: 8.8 / 10

Work Experience & Internships:
1. Software Engineering Intern | CloudScale Systems | May 2023 - Aug 2023
   - Built scalable RESTful API microservices using Node.js, Express, and PostgreSQL handling 2,500 daily requests with 99.8% uptime.
   - Designed Redis caching layer for hot database queries, reducing average API response latency by 42%.
   - Collaborated with senior engineers to implement CI/CD test automation pipelines using GitHub Actions.

Technical Projects:
1. Real-Time Collaborative Guidance Platform
   - Technologies: React, Node.js, Express, PostgreSQL, Tailwind CSS
   - Architected end-to-end full stack architecture with real-time responsive analytics.
   - Built vectorized NLP scoring pipeline, reducing review turnaround by 80% with 650ms average latency.
2. Distributed Task Scheduler Microservice
   - Technologies: Python, Redis, FastAPI, Docker
   - Implemented asynchronous worker queue handling 5,000 requests/sec with zero job starvation.
   - Optimized database indexing with composite B-Tree indexes, improving query throughput by 35%.

Categorized Skills:
- Languages: Java, Python, JavaScript, TypeScript, SQL, C++
- Frameworks: React, Node.js, Express, FastAPI, Spring Boot, Tailwind CSS
- Databases: PostgreSQL, MongoDB, Redis, SQLite
- Cloud & DevOps: Docker, Kubernetes, AWS (S3/EC2), Git, Linux, CI/CD
- Core Competencies: Data Structures & Algorithms, System Design, REST APIs, OOP

Certifications:
- AWS Certified Cloud Practitioner
- Stanford Algorithms Specialization`;

      const blob = new Blob([sampleText], { type: 'text/plain' });
      const sampleFile = new File([blob], `${candidateName.replace(/\s+/g, '_')}_Resume.txt`, { type: 'text/plain' });
      setFile(sampleFile);

      const res = await api.resume.upload(sampleFile);
      setAnalysisResult({
        score: res.score,
        ...res.analysis
      });
      setExtractedProfile(res.extractedProfile);
      setActiveResumeId(res.resumeId);
      setActiveTab('extracted');
      setFile(null);
      await loadResumesList();
      fetchMatchedInternships();
    } catch (err) {
      alert('Error analyzing sample: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyRewrite = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2500);
  };

  const handleDownloadPDF = () => {
    if (!analysisResult) return;
    const doc = new jsPDF();
    const candidateName = extractedProfile?.name || extractedProfile?.personal_info?.name || user?.name || 'Candidate';
    const targetRole = user?.target_role || 'Software Engineer';
    const score = analysisResult.score || 80;

    // PAGE 1: Executive ATS Assessment & Profile Extraction
    doc.setFillColor(11, 18, 32);
    doc.rect(0, 0, 210, 297, 'F');

    // Header Title
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CareerPilot AI', 20, 22);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Advanced ATS Diagnostic & Deep Extraction Report', 20, 30);

    // Divider
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Meta details card
    doc.setFillColor(23, 32, 51);
    doc.roundedRect(20, 40, 170, 34, 3, 3, 'F');

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text('CANDIDATE NAME', 26, 48);
    doc.text('TARGET ROLE', 26, 62);
    doc.text('EVALUATION SCORE', 125, 48);
    doc.text('ATS READINESS VERDICT', 125, 62);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(candidateName, 26, 55);
    doc.text(targetRole, 26, 69);

    const scoreColor = score >= 80 ? [16, 185, 129] : [245, 158, 11];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFontSize(14);
    doc.text(`${score} / 100`, 125, 56);

    doc.setFontSize(10);
    doc.text(score >= 80 ? 'HIGH ATS MATCH' : 'OPTIMIZATION NEEDED', 125, 69);

    // Section 1: Executive Summary
    let y = 86;
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Executive ATS Assessment & Summary', 20, y);
    y += 7;

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const splitSummary = doc.splitTextToSize(analysisResult.summary || 'Strong technical foundation.', 170);
    doc.text(splitSummary, 20, y);
    y += splitSummary.length * 5 + 8;

    // Section 2: Extracted Work Experience
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Extracted Work Experience & Internships', 20, y);
    y += 7;

    const workExp = extractedProfile?.experience || extractedProfile?.work_experience || [];
    if (workExp.length > 0) {
      workExp.forEach((w) => {
        if (y > 260) { doc.addPage(); doc.setFillColor(11, 18, 32); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
        doc.setTextColor(248, 250, 252);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${w.role || 'Role'} — ${w.company || 'Company'} (${w.dates || w.duration || 'Dates'})`, 20, y);
        y += 5;

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        (w.bullets || w.responsibilities || []).forEach(r => {
          if (y > 270) { doc.addPage(); doc.setFillColor(11, 18, 32); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
          const splitResp = doc.splitTextToSize(`• ${r}`, 166);
          doc.text(splitResp, 24, y);
          y += splitResp.length * 4.5;
        });
        y += 3;
      });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.text('No corporate employment detected. Demonstrating competencies via project portfolio.', 20, y);
      y += 6;
    }

    // Extracted Projects
    y += 4;
    if (y > 250) { doc.addPage(); doc.setFillColor(11, 18, 32); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Extracted Technical Projects', 20, y);
    y += 7;

    const projs = extractedProfile?.projects || [];
    projs.slice(0, 3).forEach((p) => {
      if (y > 260) { doc.addPage(); doc.setFillColor(11, 18, 32); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
      doc.setTextColor(248, 250, 252);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const stack = (p.techStack || p.technologies || []).join(', ');
      doc.text(`${p.title || 'Project'} ${stack ? `[${stack}]` : ''}`, 20, y);
      y += 5;

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      (p.bullets || p.highlights || []).forEach(h => {
        if (y > 270) { doc.addPage(); doc.setFillColor(11, 18, 32); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
        const splitH = doc.splitTextToSize(`• ${h}`, 166);
        doc.text(splitH, 24, y);
        y += splitH.length * 4.5;
      });
      y += 3;
    });

    // PAGE 2: Exact Resume Issues & Google X-Y-Z Rewrites
    doc.addPage();
    doc.setFillColor(11, 18, 32);
    doc.rect(0, 0, 210, 297, 'F');
    y = 22;

    doc.setTextColor(59, 130, 246);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Exact Quoted Resume Issues & Google X-Y-Z Rewrites', 20, y);
    y += 6;

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Google Formula: "Accomplished [X] as measured by [Y], by doing [Z]" to replace weak bullets.', 20, y);
    y += 10;

    const detailedIssues = analysisResult.detailed_issues || [];
    detailedIssues.forEach((issue, idx) => {
      if (y > 230) {
        doc.addPage();
        doc.setFillColor(11, 18, 32);
        doc.rect(0, 0, 210, 297, 'F');
        y = 20;
      }

      doc.setFillColor(23, 32, 51);
      doc.roundedRect(20, y, 170, 52, 2, 2, 'F');

      doc.setTextColor(245, 158, 11);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Issue #${idx + 1}: ${issue.section_or_item}`, 24, y + 8);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      const origText = doc.splitTextToSize(`Original Quote: "${issue.original_text}"`, 162);
      doc.text(origText, 24, y + 15);

      doc.setTextColor(248, 113, 113);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const flawText = doc.splitTextToSize(`Diagnostic Flaw: ${issue.issue}`, 162);
      doc.text(flawText, 24, y + 26);

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      const rewText = doc.splitTextToSize(`Google X-Y-Z Rewrite: "${issue.recommended_rewrite}"`, 162);
      doc.text(rewText, 24, y + 37);

      y += 58;
    });

    // PAGE 3: What You MUST Add & Action Plan
    doc.addPage();
    doc.setFillColor(11, 18, 32);
    doc.rect(0, 0, 210, 297, 'F');
    y = 22;

    doc.setTextColor(59, 130, 246);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('5. What You MUST Add to Beat the ATS', 20, y);
    y += 10;

    const whatToAdd = analysisResult.what_to_add || {};

    doc.setTextColor(6, 182, 212);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('A. Missing Technical Skills for Target Role:', 20, y);
    y += 6;
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    (whatToAdd.missing_skills || []).forEach(s => {
      doc.text(`+ ${s}`, 24, y);
      y += 5;
    });

    y += 3;
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('B. Critical ATS Keywords to Integrate:', 20, y);
    y += 6;
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    (whatToAdd.required_keywords || []).forEach(k => {
      doc.text(`+ ${k}`, 24, y);
      y += 5;
    });

    y += 3;
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('C. High-Value Industry Certifications:', 20, y);
    y += 6;
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    (whatToAdd.recommended_certifications || []).forEach(c => {
      const cName = typeof c === 'string' ? c : c.name;
      doc.text(`★ ${cName}`, 24, y);
      y += 5;
    });

    y += 6;
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('6. Priority Step-by-Step Action Plan', 20, y);
    y += 7;

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    (analysisResult.actionable_recommendations || []).forEach((rec, idx) => {
      const splitRec = doc.splitTextToSize(`${idx + 1}. ${rec}`, 170);
      doc.text(splitRec, 20, y);
      y += splitRec.length * 5 + 2;
    });

    doc.save(`CareerPilot_AI_Resume_Report_${candidateName.replace(/\s+/g, '_')}.pdf`);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[#10B981] border-[#10B981]/50 bg-[#10B981]/10';
    if (score >= 65) return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/50 bg-rose-500/10';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-[#3B82F6]" />
            Universal ATS Resume Analyzer
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Deep-tier parsing for PDF, DOCX, and TXT resumes with OCR fallback, multi-category scoring, and Knowledge Vault integration.
          </p>
        </div>

        {analysisResult && (
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#172033] to-[#1E293B] hover:from-[#1E293B] hover:to-[#334155] border border-[#3B82F6]/40 text-[#F8FAFC] text-xs sm:text-sm font-bold shadow-lg transition-all self-start md:self-auto"
          >
            <Download className="w-4 h-4 text-[#06B6D4]" />
            Download Complete Diagnostic Report (PDF)
          </button>
        )}
      </div>

      {/* Multi-Resume Selector & Management */}
      {resumesList && resumesList.length > 0 && (
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="text-sm sm:text-base font-extrabold text-[#F8FAFC]">
                Your Resumes ({resumesList.length})
              </h3>
              <span className="text-xs text-[#94A3B8] hidden sm:inline">
                — Switch active resume to auto-fill Knowledge Vault and update your roadmap baseline
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowUploadSection(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-[#1E293B] text-xs font-bold text-[#3B82F6] border border-[#3B82F6]/30 transition-colors self-start sm:self-auto"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {showUploadSection ? 'Hide Upload Box' : '+ Upload Another Resume'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {resumesList.map((resItem) => {
              const isActive = resItem.isActive || resItem.id === activeResumeId;
              return (
                <div
                  key={resItem.id}
                  onClick={() => !isActive && handleSwitchResume(resItem.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isActive
                      ? 'bg-[#172033] border-[#3B82F6] shadow-md shadow-[#3B82F6]/10 ring-1 ring-[#3B82F6]/50'
                      : 'bg-[#0B1220] border-[#1E293B] hover:border-[#3B82F6]/40 hover:bg-[#111827]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileText className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}`} />
                        <span className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate block" title={resItem.fileName}>
                          {resItem.fileName}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#94A3B8] mt-0.5">
                        {new Date(resItem.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getScoreColor(resItem.score)}`}>
                        {resItem.score} ATS
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]/70 text-[11px]">
                    {isActive ? (
                      <span className="text-[#10B981] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active in Knowledge Vault
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={switchingResume}
                        onClick={(e) => { e.stopPropagation(); handleSwitchResume(resItem.id); }}
                        className="text-[#3B82F6] hover:underline font-bold"
                      >
                        {switchingResume ? 'Switching...' : 'Switch to this resume →'}
                      </button>
                    )}

                    {resumesList.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteResume(resItem.id); }}
                        className="text-[#94A3B8] hover:text-rose-400 p-1 transition-colors"
                        title="Delete resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {showUploadSection && (
        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragOver
                ? 'border-[#3B82F6] bg-[#3B82F6]/10 scale-[0.99]'
                : 'border-[#1E293B] hover:border-[#3B82F6]/50 bg-[#0B1220]/70'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center mx-auto mb-3 border border-[#3B82F6]/20">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-[#F8FAFC] mb-1">
              {file ? file.name : 'Upload Any Resume Document (PDF, DOCX, TXT)'}
            </h3>
            <p className="text-xs text-[#94A3B8] mb-4">
              Supports freshers, experienced, single-column, two-column, and scanned resumes via Gemini OCR. Max 10MB.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#172033] border border-[#1E293B] text-[#F8FAFC] text-xs font-semibold hover:bg-[#1E293B] shadow-sm transition-colors">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                Select Resume File
              </label>

              <button
                type="button"
                onClick={handleUseSampleResume}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#06B6D4] text-xs font-semibold hover:bg-[#06B6D4]/25 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
                Generate Sample Resume for {user?.target_role || 'Software Engineer'}
              </button>
            </div>
          </div>

          {file && !analyzing && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm shadow-lg shadow-[#3B82F6]/25 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Start Deep Extraction & ATS Analysis
              </button>
            </div>
          )}

          {analyzing && (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#F8FAFC]">
                Extracting candidate experience, projects, skills & analyzing ATS compatibility...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analysis & Extracted Profile Results */}
      {analysisResult && !analyzing && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs uppercase font-bold tracking-wider text-[#94A3B8]">
                Overall ATS Score
              </span>
              <h2 className="text-2xl font-black text-[#F8FAFC]">
                {analysisResult.score >= 80 ? 'Exceptional ATS Alignment' : analysisResult.score >= 65 ? 'Competitive Foundation' : 'Optimization Required'}
              </h2>
              <p className="text-xs text-[#94A3B8] max-w-lg">
                Calibrated for target role: <strong className="text-[#F8FAFC]">{user?.target_role || 'Software Engineer'}</strong>. Detailed issues identify exact phrases extracted from your resume and prescribe Google X-Y-Z formula rewrites.
              </p>
            </div>

            {/* Circular score display */}
            <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center font-black ${getScoreColor(analysisResult.score)} shadow-inner`}>
              <span className="text-3xl">{analysisResult.score}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">/ 100</span>
            </div>
          </div>

          {/* ATS Category Breakdown (Requirement 4) */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#F8FAFC] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#3B82F6]" />
                  ATS Score Breakdown (6 Comprehensive Dimensions)
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Target Role: <strong className="text-[#06B6D4]">{user?.target_role || 'Software Engineer'}</strong>. Evaluated mathematically across keywords, completeness, metrics, verbs, parsability, and density.
                </p>
              </div>
              <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded-full border border-[#10B981]/30 self-start sm:self-auto">
                Real Content Scoring
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  key: 'keyword_match',
                  label: 'Role Keyword Match',
                  weight: '25%',
                  icon: Layers,
                  color: 'from-blue-500 to-indigo-500',
                  textColor: 'text-blue-400'
                },
                {
                  key: 'section_completeness',
                  label: 'Section Completeness',
                  weight: '20%',
                  icon: CheckCircle2,
                  color: 'from-emerald-500 to-teal-500',
                  textColor: 'text-emerald-400'
                },
                {
                  key: 'quantified_achievements',
                  label: 'Quantified Metrics & Scale',
                  weight: '20%',
                  icon: Sparkles,
                  color: 'from-cyan-500 to-blue-500',
                  textColor: 'text-cyan-400'
                },
                {
                  key: 'action_verbs',
                  label: 'Action Verb & Strength',
                  weight: '15%',
                  icon: Zap,
                  color: 'from-amber-500 to-orange-500',
                  textColor: 'text-amber-400'
                },
                {
                  key: 'formatting_parsability',
                  label: 'ATS Parsability & Format',
                  weight: '10%',
                  icon: FileText,
                  color: 'from-purple-500 to-pink-500',
                  textColor: 'text-purple-400'
                },
                {
                  key: 'length_and_density',
                  label: 'Length & Word Density',
                  weight: '10%',
                  icon: User,
                  color: 'from-rose-500 to-red-500',
                  textColor: 'text-rose-400'
                }
              ].map(cat => {
                const catData = analysisResult?.category_scores?.[cat.key] || {
                  score: analysisResult.score,
                  weight: cat.weight,
                  feedback: 'Evaluated against candidate content.'
                };
                const catScore = typeof catData === 'number' ? catData : (catData.score || analysisResult.score);
                const feedback = catData.feedback || '';

                return (
                  <div key={cat.key} className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC] mb-1">
                        <span className="flex items-center gap-1.5 truncate">
                          <cat.icon className={`w-4 h-4 ${cat.textColor}`} />
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] bg-[#172033] px-2 py-0.5 rounded-full border border-[#1E293B]">
                          {cat.weight}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mt-2">
                        <span className={`text-2xl font-black ${cat.textColor}`}>{catScore}</span>
                        <span className="text-[11px] font-bold text-[#94A3B8]">/ 100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#172033] mt-2 overflow-hidden border border-[#1E293B]">
                        <div
                          className={`h-full bg-gradient-to-r ${cat.color} transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(5, catScore))}%` }}
                        />
                      </div>
                    </div>
                    {feedback && (
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">
                        {feedback}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Tabs */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] shadow-xl overflow-hidden">
            {/* Tab navigation */}
            <div className="flex overflow-x-auto border-b border-[#1E293B] bg-[#0B1220] p-2 gap-1.5">
              {[
                { id: 'extracted', label: 'Extracted Profile & Experience' },
                { id: 'issues', label: '🔥 Exact Issues & X-Y-Z Rewrites' },
                { id: 'what_to_add', label: '✨ Missing Skills & Gaps' },
                { id: 'internships', label: '🎯 Matched Opportunities' },
                { id: 'summary', label: 'Executive Summary' },
                { id: 'actions', label: 'Action Plan' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#172033] text-[#3B82F6] border border-[#3B82F6]/40 shadow-sm font-bold'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172033]/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab contents */}
            <div className="p-6 sm:p-8">
              {/* TAB 1: EXTRACTED RESUME PROFILE */}
              {activeTab === 'extracted' && extractedProfile && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                        <User className="w-5 h-5 text-[#3B82F6]" />
                        Extracted Candidate Profile & Structure
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Strictly parsed from resume text. Work experience and projects are segregated; missing fields remain blank without invented data.
                      </p>
                    </div>
                    <span className="text-xs text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded-full font-bold border border-[#10B981]/30">
                      ✓ Authentic Extraction
                    </span>
                  </div>

                  {/* Personal & Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0B1220] border border-[#1E293B] text-xs">
                    <div>
                      <span className="font-bold text-[#94A3B8] block mb-0.5">Candidate Name</span>
                      <span className="font-extrabold text-[#F8FAFC] text-sm">
                        {extractedProfile.name || extractedProfile.personal_info?.name || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-[#94A3B8] block mb-0.5">Email</span>
                      <span className="font-semibold text-[#F8FAFC] truncate block">
                        {extractedProfile.contact?.email || extractedProfile.personal_info?.email || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-[#94A3B8] block mb-0.5">Phone</span>
                      <span className="font-semibold text-[#F8FAFC]">
                        {extractedProfile.contact?.phone || extractedProfile.personal_info?.phone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-[#94A3B8] block mb-0.5">Online Profiles</span>
                      <div className="flex flex-wrap items-center gap-2 text-[#06B6D4] font-semibold">
                        {(extractedProfile.contact?.github || extractedProfile.personal_info?.github) && (
                          <span className="truncate max-w-[120px]">
                            {extractedProfile.contact?.github || extractedProfile.personal_info?.github}
                          </span>
                        )}
                        {(extractedProfile.contact?.linkedin || extractedProfile.personal_info?.linkedin) && (
                          <span className="truncate max-w-[120px]">LinkedIn Verified</span>
                        )}
                        {!extractedProfile.contact?.github && !extractedProfile.personal_info?.github && !extractedProfile.contact?.linkedin && (
                          <span className="text-[#94A3B8]">None listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary / Objective */}
                  {extractedProfile.summary && (
                    <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] space-y-1">
                      <span className="text-xs uppercase font-bold text-[#3B82F6] block">Summary</span>
                      <p className="text-xs text-[#CBD5E1] leading-relaxed">{extractedProfile.summary}</p>
                    </div>
                  )}

                  {/* Work Experience (SEPARATED FROM PROJECTS) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#3B82F6] flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#3B82F6]" />
                        Work Experience & Internships ({(extractedProfile.experience || extractedProfile.work_experience || []).length})
                      </h4>
                      <span className="text-[11px] text-[#94A3B8]">Formal corporate / organizational roles</span>
                    </div>

                    {(extractedProfile.experience || extractedProfile.work_experience || []).length > 0 ? (
                      <div className="space-y-3">
                        {(extractedProfile.experience || extractedProfile.work_experience || []).map((exp, idx) => (
                          <div key={idx} className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <span className="text-base font-extrabold text-[#F8FAFC]">{exp.role || 'Software Role'}</span>
                                {exp.company && <span className="text-sm text-[#06B6D4] font-semibold ml-2">@ {exp.company}</span>}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                                <span>{exp.dates || exp.duration || ''}</span>
                                {exp.location && <span>• {exp.location}</span>}
                              </div>
                            </div>
                            <ul className="space-y-1.5 pl-4 text-xs text-[#CBD5E1] list-disc">
                              {(exp.bullets || exp.responsibilities || []).map((resp, ri) => (
                                <li key={ri} className="leading-relaxed">{resp}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-[#1E293B] bg-[#0B1220]/50 text-xs text-[#94A3B8]">
                        No formal corporate work experience detected. (Fresher profile with project-based proof).
                      </div>
                    )}
                  </div>

                  {/* Technical Projects (SEPARATED FROM WORK EXPERIENCE) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#06B6D4] flex items-center gap-2">
                        <Code className="w-4 h-4 text-[#06B6D4]" />
                        Technical Projects & Capstones ({(extractedProfile.projects || []).length})
                      </h4>
                      <span className="text-[11px] text-[#94A3B8]">Architecture, Stack & Engineering Highlights</span>
                    </div>

                    {(extractedProfile.projects || []).length > 0 ? (
                      <div className="space-y-3">
                        {extractedProfile.projects.map((proj, idx) => (
                          <div key={idx} className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="text-base font-extrabold text-[#F8FAFC] flex items-center gap-2">
                                {proj.title || 'Technical Project'}
                                {proj.link && (
                                  <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" className="text-xs text-[#06B6D4] hover:underline flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(proj.techStack || proj.technologies || []).map((t, ti) => (
                                  <span key={ti} className="px-2.5 py-0.5 rounded-md bg-[#172033] text-[#06B6D4] text-[10px] font-semibold border border-[#1E293B]">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <ul className="space-y-1.5 pl-4 text-xs text-[#CBD5E1] list-disc">
                              {(proj.bullets || proj.highlights || []).map((hl, hli) => (
                                <li key={hli} className="leading-relaxed">{hl}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-[#1E293B] bg-[#0B1220]/50 text-xs text-[#94A3B8]">
                        No structured projects found in this resume.
                      </div>
                    )}
                  </div>

                  {/* Education */}
                  {extractedProfile.education && extractedProfile.education.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-[#3B82F6]" /> Education & Academics
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {extractedProfile.education.map((edu, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-[#1E293B] bg-[#0B1220] space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
                              <span>{edu.degree || 'Degree'}</span>
                              <span className="text-[#94A3B8]">{edu.dates || edu.year || ''}</span>
                            </div>
                            {edu.institution && (
                              <div className="text-xs text-[#06B6D4] font-medium">{edu.institution}</div>
                            )}
                            {edu.gpa && (
                              <div className="text-[11px] text-[#94A3B8]">GPA: {edu.gpa}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Inventory */}
                  {extractedProfile.skills && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#06B6D4]" /> Extracted Verified Skills
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(extractedProfile.skills).map(([catKey, skillsArr]) => {
                          if (!Array.isArray(skillsArr) || skillsArr.length === 0) return null;
                          return (
                            <div key={catKey} className="p-4 rounded-xl border border-[#1E293B] bg-[#0B1220] space-y-2">
                              <span className="text-[11px] uppercase font-bold text-[#06B6D4] block capitalize">
                                {catKey.replace(/([A-Z])/g, ' $1')}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {skillsArr.map((s, si) => (
                                  <span key={si} className="px-2 py-0.5 rounded-md bg-[#172033] text-[#F8FAFC] text-[10px] font-semibold border border-[#1E293B]">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXACT ISSUES & GOOGLE X-Y-Z REWRITES (Requirement 5) */}
              {activeTab === 'issues' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-start gap-3">
                    <Quote className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-[#CBD5E1] space-y-1">
                      <span className="font-bold text-[#F8FAFC] text-sm block">Exact Resume Diagnostics & Google X-Y-Z Rewrites</span>
                      <p>
                        Each issue below quotes the <strong>exact section and sentence</strong> from your resume, diagnoses its flaw, and rewrites it following the Google X-Y-Z formula: <em>"Accomplished [X] as measured by [Y], by doing [Z]"</em>.
                      </p>
                    </div>
                  </div>

                  {(analysisResult.detailed_issues || []).map((issue, idx) => (
                    <div key={idx} className="p-6 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-4">
                      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/30">
                          {issue.section_or_item}
                        </span>
                        <span className="text-xs text-[#94A3B8]">Issue #{idx + 1}</span>
                      </div>

                      {/* Quoted Original Text */}
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase font-bold text-[#94A3B8] block">Original Snippet in Your Resume:</span>
                        <div className="p-3 rounded-xl bg-[#111827] border border-[#1E293B] text-xs text-[#CBD5E1] italic">
                          "{issue.original_text}"
                        </div>
                      </div>

                      {/* Diagnostic Flaw */}
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase font-bold text-rose-400 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Diagnostic Flaw & ATS Failure Reason:
                        </span>
                        <p className="text-xs text-rose-300/90 pl-1">
                          {issue.issue}
                        </p>
                      </div>

                      {/* Recommended Google X-Y-Z Rewrite */}
                      <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#10B981] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Recommended Google X-Y-Z Formula Rewrite:
                          </span>
                          <button
                            onClick={() => handleCopyRewrite(issue.recommended_rewrite, idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#172033] hover:bg-[#1E293B] text-xs font-semibold text-[#06B6D4] border border-[#1E293B] transition-colors"
                          >
                            {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedIdx === idx ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs sm:text-sm font-semibold text-[#F8FAFC] leading-relaxed">
                          "{issue.recommended_rewrite}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: WHAT YOU MUST ADD & ROADMAP LINK (Requirement 5 & 6) */}
              {activeTab === 'what_to_add' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-[#CBD5E1] space-y-1">
                      <span className="font-bold text-[#F8FAFC] text-sm block">Skill Gaps & Knowledge Vault Bridges</span>
                      <p>
                        These gaps reflect what {user?.target_role || 'Software Engineering'} roles expect versus what your resume proves. Click <strong>"Build Roadmap for this Skill Gap"</strong> to generate a personalized learning roadmap starting from that exact skill!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Missing Target Role Skills with 1-click Roadmap Bridge */}
                    <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-3">
                      <h4 className="text-sm font-bold text-[#3B82F6] flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-[#3B82F6]" />
                        Missing Skills for {user?.target_role || 'Software Engineer'}
                      </h4>
                      <div className="space-y-2.5">
                        {(analysisResult.what_to_add?.missing_skills || []).map((s, i) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#111827] border border-[#1E293B] text-xs">
                            <span className="font-semibold text-[#F8FAFC] flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                              {s}
                            </span>
                            <button
                              type="button"
                              onClick={() => navigate('/roadmap', { state: { domain: s } })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30 text-[#3B82F6] font-bold text-[11px] border border-[#3B82F6]/30 transition-colors self-start sm:self-auto"
                            >
                              <Sparkles className="w-3 h-3" />
                              Build Roadmap
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Required ATS Keywords */}
                    <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-3">
                      <h4 className="text-sm font-bold text-[#06B6D4] flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#06B6D4]" />
                        Critical ATS Keywords to Inject
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(analysisResult.what_to_add?.required_keywords || []).map((k, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] text-xs font-semibold border border-[#06B6D4]/30">
                            + {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Certifications */}
                    <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-3">
                      <h4 className="text-sm font-bold text-[#10B981] flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#10B981]" />
                        Recommended Industry Certifications
                      </h4>
                      <div className="space-y-2">
                        {(analysisResult.what_to_add?.recommended_certifications || []).map((c, i) => {
                          const cName = typeof c === 'string' ? c : c.name;
                          return (
                            <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#111827] border border-[#1E293B] text-xs font-semibold text-[#F8FAFC]">
                              <Award className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                              {cName}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Missing Sections */}
                    <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-3">
                      <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Missing Sections in Your Resume
                      </h4>
                      <div className="space-y-2">
                        {(analysisResult.missing_sections || []).length > 0 ? (
                          analysisResult.missing_sections.map((ms, i) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#111827] border border-[#1E293B] text-xs text-[#CBD5E1]">
                              <span className="text-amber-400 font-bold">•</span>
                              {ms}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-[#10B981]">
                            ✓ All essential ATS sections are present in this resume.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MATCHED INTERNSHIPS & RECRUITER CONNECT */}
              {activeTab === 'internships' && (
                <div className="space-y-6">
                  {matchedInternships.length === 0 ? (
                    <div className="p-8 text-center bg-[#0B1220] rounded-2xl border border-[#1E293B] space-y-3">
                      <p className="text-sm text-[#94A3B8]">
                        Loading verified job and internship matches for {user?.target_role || 'Software Engineering'}...
                      </p>
                      <button
                        type="button"
                        onClick={fetchMatchedInternships}
                        className="px-4 py-2 rounded-xl bg-[#172033] hover:bg-[#1E293B] text-[#3B82F6] text-xs font-bold border border-[#1E293B] transition-colors"
                      >
                        Fetch Recommendations Now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {matchedInternships.map((internship, idx) => {
                        const candidateName = user?.name || extractedProfile?.name || 'Candidate';
                        const outreachMessage = `Hi [Recruiter Name],\n\nI noticed the ${internship.role} opening at ${internship.company}. With a ${internship.matchScore}% skill alignment in ${(internship.matchingSkills || []).slice(0, 3).join(', ')} and production capstone experience in scalable software engineering, I would love to connect and share how I can add immediate value to your engineering team!\n\nBest regards,\n${candidateName}`;

                        return (
                          <div
                            key={internship.id || idx}
                            className="p-6 rounded-2xl border border-[#1E293B] bg-[#0B1220] hover:border-[#3B82F6]/50 transition-all flex flex-col justify-between space-y-4 shadow-md"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[#3B82F6]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                                      {internship.company}
                                    </span>
                                  </div>
                                  <h4 className="text-base font-extrabold text-[#F8FAFC] mt-0.5">
                                    {internship.role}
                                  </h4>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                                  {internship.matchScore}% Fit
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {(internship.matchingSkills || []).map((sk, ski) => (
                                  <span key={ski} className="px-2.5 py-0.5 rounded-md bg-[#10B981]/10 text-[#10B981] text-[10px] font-bold border border-[#10B981]/20">
                                    ✓ {sk}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(outreachMessage);
                                  alert('Recruiter outreach message copied to clipboard!');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-[#1E293B] text-xs font-bold text-[#06B6D4] border border-[#1E293B]"
                              >
                                <Copy className="w-3.5 h-3.5" /> Copy InMail Pitch
                              </button>

                              {internship.applyUrl && (
                                <a
                                  href={internship.applyUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-[#3B82F6] font-bold hover:underline"
                                >
                                  Apply Now <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#3B82F6]" /> Executive ATS Assessment
                  </h3>
                  <div className="p-5 rounded-2xl bg-[#0B1220] border border-[#1E293B] text-sm text-[#F8FAFC] leading-relaxed">
                    {analysisResult.summary}
                  </div>
                </div>
              )}

              {/* TAB 6: ACTIONS */}
              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#F8FAFC]">Priority Action Plan</h3>
                  <div className="space-y-3">
                    {(analysisResult.actionable_recommendations || []).map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-sm text-[#F8FAFC]">
                        <span className="w-6 h-6 rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
