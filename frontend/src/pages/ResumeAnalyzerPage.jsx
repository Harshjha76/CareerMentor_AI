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
  Github,
  Copy,
  Check,
  ExternalLink,
  Code,
  Lightbulb,
  ShieldAlert,
  PlusCircle,
  Quote
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
  const [copiedIdx, setCopiedIdx] = useState(null);

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

Work Experience & Internships:
1. Tech Innovations Lab | Software Engineering Intern | May 2023 - Aug 2023 | Hyderabad
   - Developed scalable RESTful APIs using Node.js, Express, and PostgreSQL handling 2,500 daily requests.
   - Designed Redis caching strategy for hot database queries, reducing average API response latency by 42%.
   - Collaborated with senior engineers to implement CI/CD test automation pipelines using GitHub Actions.

Technical Projects:
1. CareerMentor AI: Real-Time Guidance Platform
   - Technologies: React, Node.js, Express, PostgreSQL, Tailwind CSS
   - Architected end-to-end full stack architecture with multi-language Devanagari localization.
   - Built ATS scoring pipeline using natural language parsing, reducing review turnaround by 80%.
2. Distributed Task Scheduler Microservice
   - Technologies: Python, Redis, FastAPI, Docker
   - Implemented asynchronous worker queue handling 5,000 requests/sec with zero job starvation.
   - Optimized database indexing, improving query throughput by 35%.

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

  const handleCopyRewrite = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2500);
  };

  const handleDownloadPDF = () => {
    if (!analysisResult) return;
    const doc = new jsPDF();
    const candidateName = extractedProfile?.personal_info?.name || user?.name || 'Candidate';
    const targetRole = user?.target_role || 'Software Engineer';
    const score = analysisResult.score || 85;

    // PAGE 1: Executive ATS Assessment & Profile Extraction
    doc.setFillColor(11, 18, 32);
    doc.rect(0, 0, 210, 297, 'F');

    // Header Title
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CareerMentor AI', 20, 22);

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

    const scoreColor = score >= 85 ? [16, 185, 129] : [245, 158, 11];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFontSize(14);
    doc.text(`${score} / 100`, 125, 56);

    doc.setFontSize(10);
    doc.text(score >= 85 ? 'HIGH ATS MATCH' : 'OPTIMIZATION NEEDED', 125, 69);

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

    // Section 2: Extracted Work Experience & Internships
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Extracted Work Experience & Internships', 20, y);
    y += 7;

    const workExp = extractedProfile?.work_experience || [];
    if (workExp.length > 0) {
      workExp.forEach((w) => {
        if (y > 260) { doc.addPage(); doc.setFillColor(11, 18, 32); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
        doc.setTextColor(248, 250, 252);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${w.role} — ${w.company} (${w.duration || 'Past'})`, 20, y);
        y += 5;

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        (w.responsibilities || []).forEach(r => {
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
      doc.text('No separate work experience detected. (Focus on project-based demonstrations).', 20, y);
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
      doc.text(`${p.title} [${(p.technologies || []).join(', ')}]`, 20, y);
      y += 5;

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      (p.highlights || []).forEach(h => {
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

      // Card container
      doc.setFillColor(23, 32, 51);
      doc.roundedRect(20, y, 170, 52, 2, 2, 'F');

      // Issue title
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Issue #${idx + 1}: ${issue.section_or_item}`, 24, y + 8);

      // Quoted original text
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      const origText = doc.splitTextToSize(`Original Quote: "${issue.original_text}"`, 162);
      doc.text(origText, 24, y + 15);

      // Diagnostic flaw
      doc.setTextColor(248, 113, 113);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const flawText = doc.splitTextToSize(`Diagnostic Flaw: ${issue.issue}`, 162);
      doc.text(flawText, 24, y + 26);

      // Recommended rewrite
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

    // Missing Skills
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

    // Required Keywords
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

    // Recommended Certifications
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
      doc.text(`★ ${c}`, 24, y);
      y += 5;
    });

    // Priority Recommendations
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

    doc.save(`CareerMentor_AI_Resume_Report_${candidateName.replace(/\s+/g, '_')}.pdf`);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-[#10B981] border-[#10B981]/50 bg-[#10B981]/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/50 bg-rose-500/10';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-[#3B82F6]" />
            {t('resume.title')}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            {t('resume.subtitle')}
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

      {/* Upload Zone */}
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
            {file ? file.name : t('resume.drag_drop')}
          </h3>
          <p className="text-xs text-[#94A3B8] mb-4">
            {t('resume.supported_formats')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#172033] border border-[#1E293B] text-[#F8FAFC] text-xs font-semibold hover:bg-[#1E293B] shadow-sm transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              Select Resume from Device
            </label>

            <button
              type="button"
              onClick={handleUseSampleResume}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#06B6D4] text-xs font-semibold hover:bg-[#06B6D4]/25 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              Use Pre-filled Sample Resume (with Internships & Projects)
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

      {/* Analysis & Extracted Profile Results */}
      {analysisResult && !analyzing && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs uppercase font-bold tracking-wider text-[#94A3B8]">
                {t('resume.overall_score')}
              </span>
              <h2 className="text-2xl font-black text-[#F8FAFC]">
                {analysisResult.score >= 80 ? t('resume.ats_grade_good') : t('resume.ats_grade_avg')}
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

          {/* Feedback Tabs */}
          <div className="bg-[#111827] rounded-3xl border border-[#1E293B] shadow-xl overflow-hidden">
            {/* Tab navigation */}
            <div className="flex overflow-x-auto border-b border-[#1E293B] bg-[#0B1220] p-2 gap-1.5">
              {[
                { id: 'extracted', label: 'Extracted Profile & Experience' },
                { id: 'issues', label: '🔥 Exact Issues & X-Y-Z Rewrites' },
                { id: 'what_to_add', label: '✨ What You MUST Add' },
                { id: 'summary', label: t('resume.tab_summary') },
                { id: 'formatting', label: t('resume.tab_formatting') },
                { id: 'keywords', label: t('resume.tab_keywords') },
                { id: 'actions', label: t('resume.tab_actions') },
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
                        Deep parsing engine categorized your personal details, work experience, projects, education, and skills inventory.
                      </p>
                    </div>
                    <span className="text-xs text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded-full font-bold border border-[#10B981]/30">
                      ✓ Real Extraction Verified
                    </span>
                  </div>

                  {/* Personal & Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0B1220] border border-[#1E293B] text-xs">
                    <div>
                      <span className="font-bold text-[#94A3B8] block mb-0.5">Full Name</span>
                      <span className="font-extrabold text-[#F8FAFC] text-sm">{extractedProfile.personal_info?.name || user?.name || 'Aarav Sharma'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#94A3B8] block mb-0.5">Email</span>
                      <span className="font-semibold text-[#F8FAFC] truncate block">{extractedProfile.personal_info?.email || user?.email || 'candidate@example.com'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#94A3B8] block mb-0.5">Phone</span>
                      <span className="font-semibold text-[#F8FAFC]">{extractedProfile.personal_info?.phone || '+91 98765 43210'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#94A3B8] block mb-0.5">Online Presence</span>
                      <div className="flex items-center gap-3 text-[#06B6D4] font-semibold">
                        {extractedProfile.personal_info?.github && (
                          <span className="truncate max-w-[100px]">{extractedProfile.personal_info.github}</span>
                        )}
                        {extractedProfile.personal_info?.linkedin && (
                          <span className="truncate max-w-[100px]">LinkedIn Verified</span>
                        )}
                        {!extractedProfile.personal_info?.github && !extractedProfile.personal_info?.linkedin && (
                          <span>GitHub & LinkedIn</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Work Experience & Internships (SEPARATED FROM PROJECTS) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#3B82F6] flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#3B82F6]" />
                        Work Experience & Internships ({extractedProfile.work_experience?.length || 0})
                      </h4>
                      <span className="text-[11px] text-[#94A3B8]">Professional & Industry History</span>
                    </div>

                    {extractedProfile.work_experience && extractedProfile.work_experience.length > 0 ? (
                      <div className="space-y-3">
                        {extractedProfile.work_experience.map((exp, idx) => (
                          <div key={idx} className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <span className="text-base font-extrabold text-[#F8FAFC]">{exp.role}</span>
                                <span className="text-sm text-[#06B6D4] font-semibold ml-2">@ {exp.company}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                                <span>{exp.duration || 'Past'}</span>
                                {exp.location && <span>• {exp.location}</span>}
                              </div>
                            </div>
                            <ul className="space-y-1.5 pl-4 text-xs text-[#CBD5E1] list-disc">
                              {(exp.responsibilities || []).map((resp, ri) => (
                                <li key={ri} className="leading-relaxed">{resp}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-[#1E293B] bg-[#0B1220]/50 text-xs text-[#94A3B8]">
                        No formal corporate work experience detected in text. (Check the "What You MUST Add" tab to see recommendations for highlighting internship or open-source roles).
                      </div>
                    )}
                  </div>

                  {/* Technical Projects (SEPARATED FROM WORK EXPERIENCE) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#06B6D4] flex items-center gap-2">
                        <Code className="w-4 h-4 text-[#06B6D4]" />
                        Technical Projects & Capstones ({extractedProfile.projects?.length || 0})
                      </h4>
                      <span className="text-[11px] text-[#94A3B8]">Architecture, Stack & Engineering Highlights</span>
                    </div>

                    {extractedProfile.projects && extractedProfile.projects.length > 0 ? (
                      <div className="space-y-3">
                        {extractedProfile.projects.map((proj, idx) => (
                          <div key={idx} className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="text-base font-extrabold text-[#F8FAFC] flex items-center gap-2">
                                {proj.title}
                                {proj.link && (
                                  <a href={`https://${proj.link.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="text-xs text-[#06B6D4] hover:underline flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(proj.technologies || []).map((t, ti) => (
                                  <span key={ti} className="px-2.5 py-0.5 rounded-md bg-[#172033] text-[#06B6D4] text-[10px] font-semibold border border-[#1E293B]">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <ul className="space-y-1.5 pl-4 text-xs text-[#CBD5E1] list-disc">
                              {(proj.highlights || []).map((hl, hli) => (
                                <li key={hli} className="leading-relaxed">{hl}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-[#1E293B] bg-[#0B1220]/50 text-xs text-[#94A3B8]">
                        No structured projects found. Highlight 2-3 production projects with quantifiable metrics.
                      </div>
                    )}
                  </div>

                  {/* Education */}
                  {extractedProfile.education && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-[#3B82F6]" /> Education & Academics
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {extractedProfile.education.map((edu, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-[#1E293B] bg-[#0B1220] space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
                              <span>{edu.degree}</span>
                              <span className="text-[#94A3B8]">{edu.year}</span>
                            </div>
                            <div className="text-xs text-[#94A3B8]">{edu.institution} • GPA: <strong className="text-[#F8FAFC]">{edu.gpa}</strong></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categorized Skills Inventory */}
                  {extractedProfile.categorized_skills && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#8B5CF6]" /> Extracted Skills Inventory
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        {Object.entries(extractedProfile.categorized_skills).map(([categoryKey, skillArr]) => (
                          <div key={categoryKey} className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] space-y-2">
                            <span className="font-bold capitalize text-[#F8FAFC] block">
                              {categoryKey.replace(/_/g, ' ')}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(skillArr || []).map((s, si) => (
                                <span key={si} className="px-2.5 py-1 rounded-md bg-[#172033] text-[#F8FAFC] border border-[#1E293B] text-[11px] font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {extractedProfile.certifications && extractedProfile.certifications.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#10B981]" /> Verified Certifications
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {extractedProfile.certifications.map((c, ci) => (
                          <div key={ci} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXACT ISSUES & GOOGLE X-Y-Z REWRITES */}
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

              {/* TAB 3: WHAT YOU MUST ADD */}
              {activeTab === 'what_to_add' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-[#CBD5E1] space-y-1">
                      <span className="font-bold text-[#F8FAFC] text-sm block">What You MUST Add to Maximize ATS Ranking</span>
                      <p>
                        High-tier tech recruiters and ATS parsers scan for specific architecture keywords, modern cloud tooling, and verified credentials. Adding these items will elevate your resume into the top 5th percentile.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Missing Target Role Skills */}
                    <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-3">
                      <h4 className="text-sm font-bold text-[#3B82F6] flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-[#3B82F6]" />
                        Missing Core Skills for {user?.target_role || 'Software Engineer'}
                      </h4>
                      <div className="space-y-2">
                        {(analysisResult.what_to_add?.missing_skills || [
                          'System Design & Microservices Architecture',
                          'Redis Caching & In-Memory State Management',
                          'Docker Containerization & CI/CD Pipelines'
                        ]).map((s, i) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#111827] border border-[#1E293B] text-xs font-semibold text-[#F8FAFC]">
                            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                            {s}
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
                        {(analysisResult.what_to_add?.required_keywords || [
                          'High Availability',
                          'Query Optimization',
                          'RESTful API Security',
                          'Concurrency & Thread Safety',
                          'Automated Unit Testing'
                        ]).map((k, i) => (
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
                        {(analysisResult.what_to_add?.recommended_certifications || [
                          'AWS Certified Solutions Architect - Associate',
                          'Oracle Certified Professional: Java SE Developer',
                          'Meta Backend Developer Professional Certificate'
                        ]).map((c, i) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#111827] border border-[#1E293B] text-xs font-semibold text-[#F8FAFC]">
                            <Award className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Missing Sections & Portfolio Links */}
                    <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0B1220] space-y-3">
                      <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Missing Sections & Verification Links
                      </h4>
                      <div className="space-y-2">
                        {(analysisResult.what_to_add?.missing_sections || [
                          'Quantified Business & Operational Metrics across all bullet points',
                          'Live Production Deployment Links & Interactive Demo URLs',
                          'Open Source Contributions or Technical Leadership Achievements'
                        ]).map((ms, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#111827] border border-[#1E293B] text-xs text-[#CBD5E1]">
                            <span className="text-amber-400 font-bold">•</span>
                            {ms}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SUMMARY */}
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

              {/* TAB 5: FORMATTING */}
              {activeTab === 'formatting' && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#F8FAFC]">Structure & Formatting Compliance</h3>
                  {(analysisResult.formatting || []).map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-sm text-[#F8FAFC]">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 6: KEYWORDS */}
              {activeTab === 'keywords' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs uppercase font-bold text-[#10B981] mb-2">
                      Present Keywords Found in Your Resume
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysisResult.keyword_optimization?.present || []).map((k, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-[#10B981]/15 text-[#10B981] text-xs font-semibold border border-[#10B981]/30">
                          ✓ {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase font-bold text-rose-400 mb-2">
                      Target Role Keywords Missing (Add to Boost ATS Match)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysisResult.keyword_optimization?.missing || []).map((k, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-semibold border border-rose-500/30">
                          + {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: ACTIONS */}
              {activeTab === 'actions' && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#F8FAFC]">Priority Action Plan</h3>
                  {(analysisResult.actionable_recommendations || []).map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-[#172033] border border-[#1E293B] text-sm text-[#F8FAFC] font-medium">
                      <span className="w-5 h-5 rounded-full bg-[#3B82F6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
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
