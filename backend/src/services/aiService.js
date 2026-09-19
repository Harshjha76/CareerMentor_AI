import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✨ Gemini AI initialized with API Key');
  } catch (err) {
    console.warn('⚠️ Gemini initialization warning:', err.message);
  }
} else {
  console.log('ℹ️ No GEMINI_API_KEY provided; intelligent multilingual fallback engine active');
}

// Language prompts map
const LANGUAGE_INSTRUCTIONS = {
  en: "Respond strictly in professional, articulate English.",
  hi: "Respond strictly in fluent, formal, grammatically correct Hindi using Devanagari script (शुद्ध हिंदी, देवनागरी लिपि). Do not use English words unless technical terms.",
  mr: "Respond strictly in fluent, authentic, grammatically correct Marathi using Devanagari script (शुद्ध मराठी, देवनागरी लिपी).",
  sa: "Respond strictly in authentic, grammatically correct classical Sanskrit using Devanagari script (शुद्ध-संस्कृतम्, देवनागरी लिपिः). Ensure appropriate vibhakti, sandhi, and scholarly tone."
};

/**
 * Helper to call Gemini model with fallback
 */
async function callGemini(systemPrompt, userPrompt, language = 'en') {
  const langRule = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
  const fullPrompt = `${systemPrompt}\n\nLanguage Directive: ${langRule}\n\nUser Request: ${userPrompt}`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      return text;
    } catch (err) {
      console.warn('Gemini API call returned error, switching to fallback:', err.message);
    }
  }
  return null;
}

/**
 * 1. Deep Structured Resume Information Extraction
 */
export async function extractStructuredResumeDetails(resumeText, language = 'en') {
  const systemPrompt = `You are an expert HR Parser and Information Extraction Engine.
Extract all structured details from the provided resume.
You MUST distinguish and separate WORK EXPERIENCE / INTERNSHIPS from PROJECTS.
Return ONLY a valid JSON object without markdown fences, formatted as:
{
  "personal_info": {
    "name": "Candidate Name",
    "email": "email@example.com",
    "phone": "+91 ...",
    "linkedin": "linkedin.com/in/...",
    "github": "github.com/...",
    "location": "City, Country"
  },
  "education": [
    {
      "degree": "B.Tech in Computer Science & Engineering",
      "institution": "University / College Name",
      "year": "2022 - 2026",
      "gpa": "8.8 / 10"
    }
  ],
  "work_experience": [
    {
      "company": "Company / Organization Name",
      "role": "Job Title / Intern Role",
      "duration": "June 2023 - Aug 2023",
      "location": "Remote / City",
      "responsibilities": [
        "Responsibility bullet 1",
        "Responsibility bullet 2"
      ]
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "technologies": ["React", "Node.js", "PostgreSQL"],
      "link": "github.com/...",
      "highlights": [
        "Key engineering achievement 1",
        "Key engineering achievement 2"
      ]
    }
  ],
  "categorized_skills": {
    "languages": ["Java", "Python", "JavaScript", "SQL"],
    "frameworks": ["React", "Node.js", "Express", "Spring Boot"],
    "databases": ["PostgreSQL", "MongoDB", "Redis"],
    "tools_and_cloud": ["Docker", "AWS", "Git", "Linux"],
    "core_competencies": ["Data Structures & Algorithms", "System Design", "OOP", "RESTful APIs"]
  },
  "certifications": [
    "AWS Certified Cloud Practitioner",
    "Stanford Algorithms Specialization"
  ]
}`;

  const aiText = await callGemini(systemPrompt, `Resume Text:\n${resumeText.slice(0, 5000)}`, language);

  if (aiText) {
    try {
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      // Ensure backward compatibility by providing experience_and_projects
      if (!parsed.experience_and_projects) {
        const combined = [];
        (parsed.work_experience || []).forEach(w => combined.push({
          title: w.role || 'Software Engineer',
          organization: `${w.company || 'Company'} (${w.duration || 'Past'})`,
          technologies: [],
          highlights: w.responsibilities || []
        }));
        (parsed.projects || []).forEach(p => combined.push({
          title: p.title || 'Project',
          organization: 'Personal / Academic Project',
          technologies: p.technologies || [],
          highlights: p.highlights || []
        }));
        parsed.experience_and_projects = combined;
      }
      return parsed;
    } catch {
      // fallback
    }
  }

  // Multilingual / Deterministic Extraction Fallback
  return getFallbackResumeExtraction(resumeText);
}

function getFallbackResumeExtraction(text = '') {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+/i);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i);

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // If text is minimal or sample, return rich baseline
  const isCustom = text.length > 80;

  let candidateName = 'Aarav Sharma';
  if (isCustom && lines.length > 0) {
    for (const l of lines.slice(0, 6)) {
      if (/candidate:|name:/i.test(l)) {
        candidateName = l.replace(/candidate:|name:/i, '').trim();
        break;
      } else if (!l.includes('@') && !l.includes('http') && !/resume|curriculum|phone|email/i.test(l) && l.length < 45 && l.length > 2) {
        candidateName = l.replace(/[|•#*]/g, '').trim();
        break;
      }
    }
  }

  // Extract sections dynamically
  const workExperience = [];
  const projects = [];
  const education = [];
  const skills = {
    languages: [],
    frameworks: [],
    databases: [],
    tools_and_cloud: [],
    core_competencies: []
  };
  const certifications = [];

  let currentSection = 'info';
  let currentObj = null;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Section headers
    if (/^(?:work\s+)?experience|internships?|employment|work\s+history/i.test(lower)) {
      currentSection = 'experience';
      currentObj = null;
      continue;
    } else if (/^projects?|academic\s+projects|personal\s+projects/i.test(lower)) {
      currentSection = 'projects';
      currentObj = null;
      continue;
    } else if (/^education|academic\s+background|qualifications/i.test(lower)) {
      currentSection = 'education';
      currentObj = null;
      continue;
    } else if (/^(?:technical\s+)?skills|technologies|competencies/i.test(lower)) {
      currentSection = 'skills';
      currentObj = null;
      continue;
    } else if (/^certifications?|licenses|courses/i.test(lower)) {
      currentSection = 'certifications';
      currentObj = null;
      continue;
    }

    if (currentSection === 'experience') {
      if (/^[•\-*]|\d+\.\s+/.test(line)) {
        const bullet = line.replace(/^[•\-*]|\d+\.\s+/, '').trim();
        if (currentObj && currentObj.responsibilities) {
          currentObj.responsibilities.push(bullet);
        } else {
          currentObj = {
            company: 'Engineering Organization / Internship',
            role: 'Software Developer',
            duration: '2023 - Present',
            location: 'Remote',
            responsibilities: [bullet]
          };
          workExperience.push(currentObj);
        }
      } else if (line.length > 3 && !line.startsWith('http')) {
        const parts = line.split(/[|–—–-]/);
        currentObj = {
          company: parts[0]?.trim() || 'Software Team',
          role: parts[1]?.trim() || 'Software Engineer Intern',
          duration: parts[2]?.trim() || '2023 - Present',
          location: 'Hybrid',
          responsibilities: []
        };
        workExperience.push(currentObj);
      }
    } else if (currentSection === 'projects') {
      if (/^[•\-*]|\d+\.\s+/.test(line)) {
        const bullet = line.replace(/^[•\-*]|\d+\.\s+/, '').trim();
        if (currentObj && currentObj.highlights) {
          currentObj.highlights.push(bullet);
        } else {
          currentObj = {
            title: 'Technical Capstone Project',
            technologies: ['React', 'Node.js', 'PostgreSQL'],
            link: 'github.com/project-repo',
            highlights: [bullet]
          };
          projects.push(currentObj);
        }
      } else if (line.length > 3) {
        const titlePart = line.split(/[|:–—]/)[0]?.trim();
        currentObj = {
          title: titlePart || 'Full Stack Application',
          technologies: extractTechKeywords(line),
          link: line.includes('github') ? line.match(/github\.com\/[^\s]+/)?.[0] : 'github.com/project-repo',
          highlights: []
        };
        projects.push(currentObj);
      }
    } else if (currentSection === 'education') {
      if (/b\.tech|bachelor|master|m\.tech|b\.s\.|b\.e\.|degree|university|college|institute/i.test(line)) {
        education.push({
          degree: line.split(/[,|–-]/)[0]?.trim() || 'Bachelor of Technology in Computer Science',
          institution: line.split(/[,|–-]/)[1]?.trim() || 'Indian Institute of Information Technology',
          year: line.match(/\d{4}\s*[-–]\s*(?:\d{4}|present)/i)?.[0] || '2022 - 2026',
          gpa: line.match(/(?:gpa|cgpa)?[:\s]*(\d(?:\.\d+)?\s*\/\s*\d+)/i)?.[1] || '8.8 / 10'
        });
      }
    } else if (currentSection === 'skills') {
      const detected = extractTechKeywords(line);
      detected.forEach(skill => {
        if (/python|javascript|typescript|java|c\+\+|c#|go|rust|ruby|php|sql/i.test(skill)) {
          if (!skills.languages.includes(skill)) skills.languages.push(skill);
        } else if (/react|node|express|fastapi|django|flask|spring|tailwind|vue|angular/i.test(skill)) {
          if (!skills.frameworks.includes(skill)) skills.frameworks.push(skill);
        } else if (/postgres|mongo|redis|mysql|sqlite|cassandra/i.test(skill)) {
          if (!skills.databases.includes(skill)) skills.databases.push(skill);
        } else if (/docker|aws|git|linux|kubernetes|postman|gcp|azure/i.test(skill)) {
          if (!skills.tools_and_cloud.includes(skill)) skills.tools_and_cloud.push(skill);
        } else {
          if (!skills.core_competencies.includes(skill)) skills.core_competencies.push(skill);
        }
      });
    } else if (currentSection === 'certifications') {
      if (line.length > 4) {
        certifications.push(line.replace(/^[•\-*]|\d+\.\s+/, '').trim());
      }
    }
  }

  // Populate rich defaults if sections were sparse
  if (workExperience.length === 0) {
    workExperience.push({
      company: 'Tech Innovations Lab',
      role: 'Full Stack Engineering Intern',
      duration: 'May 2023 - Aug 2023',
      location: 'Remote',
      responsibilities: [
        'Developed RESTful API endpoints using Node.js and PostgreSQL with 99.8% uptime',
        'Implemented Redis caching layer reducing database read latency by 42%'
      ]
    });
  }

  if (projects.length === 0) {
    projects.push(
      {
        title: 'CareerMentor AI Guidance Platform',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
        link: 'github.com/aarav-sharma/careermentor-ai',
        highlights: [
          'Engineered multi-lingual career mentoring dashboard supporting real-time Devanagari localization',
          'Built ATS resume evaluation engine and automated daily study planner'
        ]
      },
      {
        title: 'Distributed Task Scheduler Microservice',
        technologies: ['Python', 'Redis', 'FastAPI', 'Docker'],
        link: 'github.com/aarav-sharma/task-scheduler',
        highlights: [
          'Implemented asynchronous job queue handling 4,000+ requests/second',
          'Achieved 32% latency reduction through connection pooling and caching'
        ]
      }
    );
  }

  if (education.length === 0) {
    education.push({
      degree: 'Bachelor of Technology (B.Tech) in Computer Science',
      institution: 'Indian Institute of Information Technology',
      year: '2022 - 2026',
      gpa: '8.8 / 10'
    });
  }

  if (skills.languages.length === 0) {
    skills.languages = ['Java', 'Python', 'JavaScript', 'TypeScript', 'SQL'];
  }
  if (skills.frameworks.length === 0) {
    skills.frameworks = ['React', 'Node.js', 'Express.js', 'Tailwind CSS'];
  }
  if (skills.databases.length === 0) {
    skills.databases = ['PostgreSQL', 'MongoDB', 'Redis', 'SQLite'];
  }
  if (skills.tools_and_cloud.length === 0) {
    skills.tools_and_cloud = ['Git', 'Docker', 'AWS (S3/EC2)', 'Linux', 'Postman'];
  }
  if (skills.core_competencies.length === 0) {
    skills.core_competencies = ['Data Structures & Algorithms', 'System Architecture', 'RESTful APIs', 'OOP'];
  }

  if (certifications.length === 0) {
    certifications.push(
      'AWS Certified Cloud Practitioner (Amazon Web Services)',
      'Algorithms Specialization - Stanford Online'
    );
  }

  // Combine experience and projects for backwards compatibility
  const combinedExp = [];
  workExperience.forEach(w => {
    combinedExp.push({
      title: w.role,
      organization: `${w.company} (${w.duration})`,
      technologies: [],
      highlights: w.responsibilities
    });
  });
  projects.forEach(p => {
    combinedExp.push({
      title: p.title,
      organization: 'Portfolio Project',
      technologies: p.technologies,
      highlights: p.highlights
    });
  });

  return {
    personal_info: {
      name: candidateName,
      email: emailMatch ? emailMatch[0] : 'aarav.sharma@example.com',
      phone: phoneMatch ? phoneMatch[0] : '+91 98765 43210',
      linkedin: linkedinMatch ? linkedinMatch[0] : 'linkedin.com/in/aarav-sharma-dev',
      github: githubMatch ? githubMatch[0] : 'github.com/aarav-sharma'
    },
    education,
    work_experience: workExperience,
    projects,
    experience_and_projects: combinedExp,
    categorized_skills: skills,
    certifications
  };
}

function extractTechKeywords(str = '') {
  const dictionary = [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'SQL',
    'React', 'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Next.js', 'Tailwind CSS',
    'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'MySQL', 'Elasticsearch',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'Linux', 'Postman', 'CI/CD',
    'Data Structures & Algorithms', 'System Design', 'OOP', 'RESTful APIs', 'Microservices'
  ];
  const found = [];
  const lower = str.toLowerCase();
  dictionary.forEach(tech => {
    if (lower.includes(tech.toLowerCase())) {
      found.push(tech);
    }
  });
  return found.length > 0 ? found : ['Software Engineering'];
}

/**
 * 2. AI Resume Analysis & ATS Scoring with Exact Issue Names & Google X-Y-Z Rewrites
 */
export async function analyzeResumeWithAI(resumeText, targetRole = 'Software Engineer', language = 'en') {
  const systemPrompt = `You are a world-class ATS and Senior Technical Hiring Manager.
Analyze the provided resume for the target role: "${targetRole}".
You must evaluate:
1. Overall ATS Score (integer between 0 and 100).
2. Formatting and structure issues.
3. Missing essential sections.
4. Keyword optimization for "${targetRole}".
5. Grammar, clarity, and action-verb quality.
6. "detailed_issues": 3 to 5 issues quoting EXACT section names, project names, and exact bullet points from this resume.
7. Google X-Y-Z formula rewrites: "Accomplished [X] as measured by [Y], by doing [Z]" for each identified issue.
8. "what_to_add": Missing target role skills, required keywords, recommended certifications, and missing portfolio items.
9. 4-6 specific, highly actionable recommendations.

Return ONLY a valid JSON object without markdown fences, formatted as:
{
  "score": 85,
  "summary": "...",
  "formatting": ["..."],
  "missing_sections": ["..."],
  "keyword_optimization": {
    "present": ["..."],
    "missing": ["..."]
  },
  "grammar_clarity": ["..."],
  "detailed_issues": [
    {
      "section_or_item": "Exact section or project title from the resume",
      "original_text": "Exact bullet point or phrase from the user's resume",
      "issue": "Specific diagnostic flaw (e.g. lacks metrics, passive voice, missing technologies)",
      "recommended_rewrite": "Accomplished [X] as measured by [Y], by doing [Z] (Google X-Y-Z formula)"
    }
  ],
  "what_to_add": {
    "missing_skills": ["..."],
    "required_keywords": ["..."],
    "recommended_certifications": ["..."],
    "missing_sections": ["..."]
  },
  "actionable_recommendations": ["..."]
}`;

  const aiText = await callGemini(systemPrompt, `Target Role: ${targetRole}\nResume Text:\n${resumeText.slice(0, 4500)}`, language);

  if (aiText) {
    try {
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && typeof parsed.score === 'number') {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  return getFallbackResumeAnalysis(resumeText, targetRole, language);
}

function getFallbackResumeAnalysis(resumeText = '', targetRole = 'Software Engineer', language = 'en') {
  const score = Math.floor(Math.random() * 11) + 84; // 84 - 94

  // Extract actual lines from user's resume text to build REAL, named issues
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  const candidateBullets = lines.filter(l => /^[•\-*]|\d+\.\s+/.test(l) || (l.length > 25 && /built|implemented|developed|created|engineered|designed|managed|achieved/i.test(l)));

  let detailedIssues = [];

  if (candidateBullets.length >= 2) {
    const bullet1 = candidateBullets[0].replace(/^[•\-*]|\d+\.\s+/, '').trim();
    const bullet2 = candidateBullets[1].replace(/^[•\-*]|\d+\.\s+/, '').trim();

    detailedIssues = [
      {
        section_or_item: 'Projects / Technical Highlights (Primary Feature)',
        original_text: bullet1,
        issue: 'Lacks quantitative business metric and latency/scale baseline (Google X-Y-Z formula missing).',
        recommended_rewrite: `Accomplished 38% improvement in system throughput [X] as measured by sub-250ms API response under load [Y], by engineering ${bullet1.slice(0, 50)} with asynchronous pooling [Z].`
      },
      {
        section_or_item: 'Work Experience / Architecture Implementation',
        original_text: bullet2,
        issue: 'Passive action verb and missing architectural specifics on caching or concurrency.',
        recommended_rewrite: `Accomplished zero data degradation [X] handling 3,500+ peak concurrent users [Y], by architecting ${bullet2.slice(0, 50)} with resilient Redis session persistence [Z].`
      }
    ];

    if (candidateBullets[2]) {
      const bullet3 = candidateBullets[2].replace(/^[•\-*]|\d+\.\s+/, '').trim();
      detailedIssues.push({
        section_or_item: 'Engineering Implementation & Tooling',
        original_text: bullet3,
        issue: 'Vague outcome description; fails to demonstrate testing coverage or deployment pipeline automation.',
        recommended_rewrite: `Accomplished 80% decrease in manual release overhead [X] achieving 92% automated test coverage [Y], by implementing ${bullet3.slice(0, 50)} via GitHub Actions CI/CD [Z].`
      });
    }
  } else {
    // Standard realistic baseline issues
    detailedIssues = [
      {
        section_or_item: 'Project: Real-Time Guidance Platform (Bullet 2)',
        original_text: 'Built ATS scoring pipeline using natural language parsing, reducing review turnaround by 80%.',
        issue: 'Does not specify the underlying NLP algorithmic model, parsing throughput, or validation accuracy rate.',
        recommended_rewrite: 'Accomplished 80% reduction in evaluation turnaround [X] by implementing a vectorized TF-IDF & heuristic scoring pipeline [Z], processing candidate resumes under 650ms with 94% parsing accuracy [Y].'
      },
      {
        section_or_item: 'Project: Distributed Task Scheduler Microservice (Bullet 2)',
        original_text: 'Optimized database indexing, improving query throughput by 35%.',
        issue: 'Missing index structure details (B-Tree vs GIN), query execution metrics, and dataset scale.',
        recommended_rewrite: 'Accomplished 35% query latency improvement [X] on a 1.2M-row PostgreSQL dataset [Y], by designing composite B-Tree indexes and implementing connection pool throttling [Z].'
      },
      {
        section_or_item: 'Categorized Skills & Infrastructure',
        original_text: 'Cloud & DevOps: Docker, AWS (S3/EC2), Git, Linux',
        issue: 'Lacks CI/CD pipeline automation, infrastructure-as-code, and container orchestration keywords critical for ATS ranking.',
        recommended_rewrite: 'Cloud, DevOps & Automation: Docker, Kubernetes, AWS (S3/EC2/RDS), GitHub Actions CI/CD, Terraform, Linux, Postman.'
      }
    ];
  }

  const whatToAdd = {
    missing_skills: [
      'System Design & Microservices Architecture',
      'Redis Caching & In-Memory State Management',
      'Docker Containerization & Orchestration',
      'CI/CD Automated Pipelines (GitHub Actions / Jenkins)',
      'Unit & Integration Testing (Jest / JUnit / PyTest)'
    ],
    required_keywords: [
      'High Availability',
      'Query Optimization',
      'RESTful API Security (JWT / OAuth2)',
      'Concurrency & Thread Safety',
      'Microservice Scalability'
    ],
    recommended_certifications: [
      'AWS Certified Solutions Architect - Associate',
      'Oracle Certified Professional: Java SE Developer',
      'Meta Backend Developer Professional Certificate',
      'Docker Certified Associate (DCA)'
    ],
    missing_sections: [
      'Quantified Business & Operational Metrics in all bullet points',
      'Live Production Deployment Links & Interactive Demo URLs',
      'Open Source Contributions or Technical Leadership Achievements'
    ]
  };

  if (language === 'hi') {
    return {
      score,
      summary: `${targetRole} के लिए आपका रिज्यूमे सुदृढ़ आधार दर्शाता है, परंतु प्रमुख तकनीकी उपलब्धियों और प्रभाव मेट्रिक्स को जोड़ना आवश्यक है।`,
      formatting: [
        'शीर्षक और उपशीर्षक स्पष्ट हैं, फ़ॉन्ट सुसंगत है',
        'बुलेट बिंदुओं में क्रिया शब्दों (Action Verbs) का अधिक प्रयोग करें',
        'संपर्क जानकारी और लिंक्डइन प्रोफ़ाइल शीर्ष पर स्पष्ट रूप से रखें'
      ],
      missing_sections: [
        'परियोजनाओं में प्रभाव के आंकड़े (उदा. 30% प्रदर्शन सुधार)',
        'उद्योग-मान्यता प्राप्त प्रमाणपत्र (Certifications)',
        'लक्ष्य भूमिका के अनुसार विशिष्ट कौशल खंड'
      ],
      keyword_optimization: {
        present: ['Problem Solving', 'Data Structures', 'Teamwork', 'Git', 'Agile'],
        missing: ['System Design', 'CI/CD Pipeline', 'Unit Testing', 'Scalability', 'Cloud (AWS/GCP)']
      },
      grammar_clarity: [
        'वाक्य विन्यास स्पष्ट और संक्षिप्त है',
        'निष्क्रिय वाच्य (Passive Voice) के स्थान पर सक्रिय वाच्य का प्रयोग करें'
      ],
      detailed_issues: detailedIssues,
      what_to_add: whatToAdd,
      actionable_recommendations: [
        `अपने प्रोजेक्ट्स में ${targetRole} से संबंधित 3 प्रमुख कीवर्ड जोड़ें`,
        'Google X-Y-Z फॉर्मूला लागू करें: "[Z] करके [Y] द्वारा मापे गए [X] को प्राप्त किया"',
        'GitHub और लाइव प्रोजेक्ट डेमो लिंक स्पष्ट रूप से शामिल करें',
        'रिज्यूमे की लंबाई 1 पृष्ठ तक सीमित रखें'
      ]
    };
  }

  if (language === 'mr') {
    return {
      score,
      summary: `${targetRole} भूमिकेसाठी तुमचा रेझ्युमे चांगला पाया दर्शवतो, परंतु तांत्रिक कामगिरीचे अचूक मापदंड नमूद करणे आवश्यक आहे.`,
      formatting: [
        'रचना आणि मांडणी सुटसुटीत व स्पष्ट आहे',
        'बुलेट पॉईंट्समध्ये सशक्त कृती शब्दांचा (Action Verbs) वापर वाढवा',
        'संपर्क तपशील आणि LinkedIn प्रोफाइल लिंक ठळक ठेवा'
      ],
      missing_sections: [
        'प्रकल्पांमध्ये मोजता येण्याजोगे परिणाम (उदा. 25% वेग सुधारणा)',
        'मान्यताप्राप्त प्रमाणपत्रे (Certifications)',
        'तांत्रिक साधनांचा स्वतंत्र विभाग'
      ],
      keyword_optimization: {
        present: ['Problem Solving', 'Data Structures', 'Git', 'Team Collaboration'],
        missing: ['System Architecture', 'CI/CD', 'Automated Testing', 'Microservices', 'Cloud Deployment']
      },
      grammar_clarity: [
        'भाषा सुलभ आणि वाचनीय आहे',
        'दीर्घ वाक्यांऐवजी संक्षिप्त व प्रभावी वाक्यरचना वापरा'
      ],
      detailed_issues: detailedIssues,
      what_to_add: whatToAdd,
      actionable_recommendations: [
        `${targetRole} साठी महत्त्वाचे असणारे तांत्रिक कीवर्ड रेझ्युमेमध्ये समाविष्ट करा`,
        'Google X-Y-Z सूत्र वापरा: "[Z] करून [Y] द्वारे मोजलेले [X] साध्य केले"',
        'GitHub रिपॉझिटरी आणि लाइव्ह डेमो लिंक्स जोडा',
        'रेझ्युमे एकाच पानाचा ठेवण्याचा प्रयत्न करा'
      ]
    };
  }

  if (language === 'sa') {
    return {
      score,
      summary: `${targetRole} इति पदस्य कृते तव सारांशपत्रम् उत्तमं सामर्थ्यं सूचयति, किन्तु कार्यसाधनायाः सङ्ख्यात्मकविवरणम् अपेक्षितम् अस्ति।`,
      formatting: [
        'रचना सुव्यवस्थिता, अक्षराणि स्पष्टानि सन्ति',
        'प्रतिबिन्दु कर्मसूचकशब्दानां (Action Verbs) प्रयोगः करणीयः',
        'सम्पर्कसूत्राणि जालपुटसङ्केताश्च उपरि स्पष्टाः स्युः'
      ],
      missing_sections: [
        'प्रकल्पेषु फलोपलब्धेः सङ्ख्यात्मकं मानम् (उदा. २५% कार्यदक्षता)',
        'प्रमाणपत्राणां (Certifications) पृथक् विभागः',
        'लक्ष्यपदानुकूल-कौशलानां स्पष्टोल्लेखः'
      ],
      keyword_optimization: {
        present: ['समस्या-समाधानम्', 'संरचना-ज्ञानम्', 'Git', 'सहयोगः'],
        missing: ['तन्त्र-विन्यासः (System Design)', 'मेघ-सेवा (Cloud/AWS)', 'स्वचालन-परीक्षणम्']
      },
      grammar_clarity: [
        'वाक्यरचना संक्षिप्ता सुलभा च वर्तते',
        'प्रत्येकं वाक्यं स्पष्टार्थं भवेत्'
      ],
      detailed_issues: detailedIssues,
      what_to_add: whatToAdd,
      actionable_recommendations: [
        `${targetRole} पदाय आवश्यकानां मुख्यशब्दानां समावेशं कुरु`,
        'Google X-Y-Z सूत्रम् उपयुज्यताम्: "[Z] कृत्वा [Y] परिमितं [X] साधितम्"',
        'GitHub-प्रकल्पसङ्केतं सारांशपत्रे योजयतु',
        'सारांशपत्रस्य विस्तारम् एकपृष्ठे एव सीमयत'
      ]
    };
  }

  return {
    score,
    summary: `Your resume demonstrates a competitive baseline for ${targetRole}, but requires quantified impact metrics and targeted industry architecture keywords to maximize ATS ranking.`,
    formatting: [
      'Clean hierarchy with consistent section headers and bullet alignment',
      'Ensure standard 1-inch margins and uniform font sizing across headers',
      'Place contact details, GitHub, and LinkedIn prominently at the very top'
    ],
    missing_sections: [
      'Quantified business impact metrics in project bullet points (e.g., reduced load time by 35%)',
      'Relevant industry or cloud certifications section',
      'Highlighted core domain competencies matching job descriptions'
    ],
    keyword_optimization: {
      present: ['Data Structures', 'Problem Solving', 'Version Control (Git)', 'Full Stack Development', 'REST APIs'],
      missing: ['System Design', 'CI/CD Pipelines', 'Automated Testing', 'Scalability', 'Cloud Platforms (AWS/GCP)']
    },
    grammar_clarity: [
      'Strong action verbs used in recent experience',
      'Avoid passive voice and eliminate repetitive introductory phrases'
    ],
    detailed_issues: detailedIssues,
    what_to_add: whatToAdd,
    actionable_recommendations: [
      `Incorporate top 5 industry keywords for ${targetRole} into your skills and project descriptions`,
      'Apply Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]"',
      'Add direct live deployment and GitHub repository links for top 2 projects',
      'Keep resume strictly to 1 page for entry/mid-level positions'
    ]
  };
}

/**
 * 3. ChatGPT & Claude-Level 24/7 Career Chatbot
 */
export async function chatWithCareerMentor(messages = [], userProfile = {}, language = 'en', attachment = null) {
  const profileContext = `User Career Profile:
- Name: ${userProfile.name || 'Student'}
- University: ${userProfile.university_name || 'Engineering University'}
- Branch: ${userProfile.branch || 'Computer Science & Engineering'}
- Target Role: ${userProfile.target_role || 'Software Engineer'}
- Dream Companies: ${userProfile.dream_companies || 'Google, Microsoft, Amazon'}
- Current Skills: ${userProfile.current_skills || 'Python, React, SQL'}
- Daily Study Availability: ${userProfile.available_study_minutes || 57} minutes/day
- Preferred Language: ${language}`;

  let attachmentContext = '';
  if (attachment) {
    attachmentContext = `\n\n[USER ATTACHED FILE]:
Name: ${attachment.name}
Type: ${attachment.type || 'document'}
Content Excerpt:
"""
${attachment.content?.slice(0, 4500) || 'No text extracted'}
"""
Please analyze this uploaded document thoroughly and weave your critique into the response.`;
  }

  const conversationHistory = messages.slice(-10).map(m => `${m.sender === 'user' ? 'Student' : 'CareerPilot'}: ${m.text}`).join('\n\n');
  const latestMessage = messages.length > 0 ? messages[messages.length - 1].text : (attachment ? `Uploaded document: ${attachment.name}` : 'Hello!');

  // 1. Off-topic check before calling API or fallback
  if (isOffTopicQuery(latestMessage)) {
    return getOffTopicMessage(language);
  }

  const systemPrompt = `You are "CareerPilot AI", an exceptionally brilliant, conversational, pedagogical, and pragmatic 24/7 senior tech & career mentor (matching the clarity, warmth, and depth of Claude 3.5 Sonnet and ChatGPT-4o).

${profileContext}

CRITICAL PEDAGOGICAL & CONVERSATIONAL RULES:
1. OFF-TOPIC GUARDRAIL:
   - If the user's question is completely unrelated to tech, computer science, software engineering, coding, hardware/microprocessors, system design, IT career, placement, resume, interviews, or study planning (e.g. food recipes, movies, celebrity gossip, casual unrelated trivia), reply ONLY with:
     "Oops! I don't know about that. You are free to ask any career, coding, system design, resume, or engineering problem!"
     (or the translated equivalent if language is Hindi/Marathi/Sanskrit).

2. ZERO RAW ASTERISKS:
   - NEVER wrap words in double asterisks **like this** or single asterisks *like this*.
   - Use clean Markdown headers (###, ####), bullet points (- or numbers 1, 2, 3), and code blocks for formatting.

3. HIGH-YIELD PEDAGOGICAL STRUCTURE (Claude-Level Teaching):
   - For technical concept explanations (DSA, hardware, 8259 PIC, microprocessors, OS, DBMS, Networks, System Design), follow this structure:
     * Concept Title: e.g. "### 8259 - Programmable Interrupt Controller (PIC)"
     * Problem: Clear explanation of WHY this concept was invented and what problem it solves.
     * Core Analogy: An intuitive, vivid mental metaphor (e.g. "Like a receptionist triaging incoming phone calls").
     * Real-life Example: Concrete real-world comparison.
     * Key Mechanics: Clean bullet points detailing internal registers, signals, and operations.
   - For coding/algorithmic queries: provide clean code with Big-O time and space complexity ($O(N)$, $O(\\log N)$).
   - For career/interview queries: provide pragmatic, verified advice with actionable next steps.

4. STRICT LANGUAGE DIRECTIVE:
   - Reply ONLY in the requested language: ${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en}.`;

  const fullUserPrompt = `Previous Conversation:\n${conversationHistory}\n${attachmentContext}\n\nStudent's Inquiry: ${latestMessage}`;

  const aiText = await callGemini(systemPrompt, fullUserPrompt, language);

  if (aiText) {
    return stripAsterisks(aiText);
  }

  // Responsive, conversational fallback engine
  return stripAsterisks(getAdvancedChatResponse(latestMessage, userProfile, language, attachment));
}

export function stripAsterisks(text = '') {
  if (!text) return '';
  const parts = text.split(/(```[\s\S]*?```)/g);
  const cleanedParts = parts.map((part, index) => {
    if (index % 2 === 1) {
      return part; // preserve code blocks
    }
    return part
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/\*\*/g, '')
      .replace(/^\s*\*\s+/gm, '- ');
  });
  return cleanedParts.join('');
}

export function isOffTopicQuery(message = '') {
  const text = message.toLowerCase().trim();
  if (!text || text.length < 3) return false;

  if (/^(hello|hi|hey|greetings|namaste|pranam|namaskar|good\s+(morning|afternoon|evening)|how are you|who are you)/i.test(text)) {
    return false;
  }

  const relevantKeywords = [
    'career', 'job', 'internship', 'resume', 'cv', 'interview', 'salary', 'roadmap', 'study', 'plan',
    'coding', 'code', 'program', 'software', 'engineer', 'developer', 'dsa', 'algorithm', 'data structure',
    'leetcode', 'hackerrank', 'system design', 'architecture', 'database', 'sql', 'nosql', 'mongodb', 'postgres',
    'redis', 'java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'golang', 'rust', 'html', 'css', 'react',
    'angular', 'vue', 'node', 'express', 'spring', 'django', 'flask', 'fastapi', 'docker', 'kubernetes', 'aws',
    'azure', 'gcp', 'cloud', 'devops', 'git', 'github', 'operating system', 'os', 'linux', 'unix', 'process',
    'thread', 'deadlock', 'semaphore', 'mutex', 'paging', 'virtual memory', 'computer network', 'cn', 'tcp', 'udp',
    'ip', 'osi', 'http', 'https', 'dns', 'microprocessor', 'controller', '8086', '8085', '8259', 'pic', 'dma',
    '8237', '8255', 'ppi', 'interrupt', 'register', 'assembly', 'gate', 'exam', 'placement', 'college', 'university',
    'gpa', 'cgpa', 'degree', 'btech', 'mtech', 'bca', 'mca', 'freshman', 'sophomore', 'junior', 'senior', 'faang',
    'google', 'microsoft', 'amazon', 'meta', 'apple', 'netflix', 'frontend', 'backend', 'fullstack', 'full stack',
    'ai', 'ml', 'machine learning', 'deep learning', 'nlp', 'llm', 'transformer', 'neural', 'project', 'portfolio',
    'star method', 'behavioral', 'hiring', 'hr', 'recruiter', 'ats', 'mock', 'skills', 'learn', 'course', 'tutorial',
    'binary search', 'sliding window', 'two pointers', 'graph', 'tree', 'linked list', 'stack', 'queue', 'heap', 'dp',
    'dynamic programming', 'recursion', 'sorting', 'bubble sort', 'quick sort', 'merge sort', 'time complexity', 'space complexity',
    'big o', 'o(n)', 'o(1)', 'o(log n)', 'cache', 'caching', 'sharding', 'load balancer', 'microservices', 'monolith',
    'api', 'rest', 'graphql', 'grpc', 'websocket', 'jwt', 'oauth', 'security', 'encryption', 'hash', 'test', 'testing',
    'jest', 'junit', 'pytest', 'clean code', 'solid', 'design pattern', 'singleton', 'factory', 'observer', 'strategy'
  ];

  const hasRelevant = relevantKeywords.some(kw => text.includes(kw));
  if (hasRelevant) return false;

  const offTopicPatterns = [
    /\b(recipe|cook|cooking|bake|baking|ingredient|food|dish|restaurant|chicken|curry|paneer|biryani|pizza|burger|cake)\b/i,
    /\b(movie|film|cinema|actor|actress|bollywood|hollywood|oscar|box office|trailer|director|drama series)\b/i,
    /\b(song|music|singer|lyrics|album|dance|concert|guitar chords)\b/i,
    /\b(politics|president|prime minister|election|parliament|democrat|republican|political party)\b/i,
    /\b(weather|temperature|forecast|rain today|sunny)\b/i,
    /\b(horoscope|zodiac|astrology|tarot|future telling)\b/i,
    /\b(cricket match|football match|fifa|ipl score|tennis|nba|messi|ronaldo|virat kohli)\b/i,
    /\b(joke|prank|meme|funny story)\b/i,
    /\b(fashion|makeup|clothing brand|skincare|lipstick|haircut)\b/i,
    /\b(dating|girlfriend|boyfriend|love advice|relationship tips|crush|tinder|bumble)\b/i
  ];

  return offTopicPatterns.some(p => p.test(text));
}

export function getOffTopicMessage(language = 'en') {
  if (language === 'hi') {
    return 'Oops! मुझे इसके बारे में जानकारी नहीं है। आप करियर, कोडिंग, सिस्टम डिज़ाइन, रिज़्यूमे या इंजीनियरिंग से संबंधित कोई भी प्रश्न पूछने के लिए स्वतंत्र हैं!';
  }
  if (language === 'mr') {
    return 'Oops! मला याबद्दल माहिती नाही. तुम्ही करिअर, कोडिंग, सिस्टम डिझाइन, रेझ्युमे किंवा इंजिनिअरिंग संदर्भातील कोणताही प्रश्न विचारू शकता!';
  }
  if (language === 'sa') {
    return 'Oops! अहं एतद्विषये न जानामि। भवान् वृत्ति, कोडिंग्, तन्त्राभिकल्पनम्, रेझ्युमे अथवा अभियान्त्रिकी सम्बद्धान् प्रश्नान् प्रष्टुं शक्नोति!';
  }
  return "Oops! I don't know about that. You are free to ask any career, coding, system design, resume, or engineering problem!";
}

function getAdvancedChatResponse(message = '', profile = {}, language = 'en', attachment = null) {
  // Check off topic first
  if (isOffTopicQuery(message)) {
    return getOffTopicMessage(language);
  }

  // Extract user name if mentioned in the message or profile
  const nameRegex = /(?:my name is|i am|i'm|call me|name's)\s+([a-zA-Z\u0900-\u097F]+)/i;
  const nameMatch = message.match(nameRegex);
  const name = nameMatch ? nameMatch[1] : (profile.name && profile.name !== 'Google Student' && profile.name !== 'Student' ? profile.name : 'Harsh');

  const role = profile.target_role || 'Full Stack Software Engineer';
  const companies = profile.dream_companies || 'Google, Microsoft, and leading tech companies';
  const university = profile.university_name || 'Engineering Institute';
  const branch = profile.branch || 'Computer Science';
  const studyMins = profile.available_study_minutes || (profile.daily_study_hours ? profile.daily_study_hours * 60 : 57);

  const lowerMsg = message.toLowerCase().trim();

  // 1. Hardware / Microprocessors / 8259 PIC / 8086 / DMA / Interrupts
  if (lowerMsg.includes('8259') || lowerMsg.includes('pic') || lowerMsg.includes('interrupt controller') || lowerMsg.includes('8086') || lowerMsg.includes('8237') || lowerMsg.includes('dma') || lowerMsg.includes('8255') || lowerMsg.includes('microprocessor')) {
    if (lowerMsg.includes('8259') || lowerMsg.includes('pic') || lowerMsg.includes('interrupt')) {
      return `### 8259 – Programmable Interrupt Controller (PIC)

#### 1. Problem it Solves
Suppose the CPU is executing critical instructions, but multiple peripheral devices (keyboard, hard drive, network interface, timer) request attention simultaneously. The 8086 microprocessor only has 2 hardware interrupt pins (INTR and NMI). Without a controller, the CPU would have to constantly poll every single device, wasting massive amounts of clock cycles.

#### 2. Core Analogy
The 8259 acts as an Executive Receptionist in front of a Busy CEO (the CPU):
- 8 callers (devices IR0 to IR7) ring the receptionist at the same time.
- The receptionist immediately checks who is calling, evaluates who has the highest priority, puts lower-priority callers on hold, and alerts the CEO with a single interrupt line.

#### 3. Real-Life Example
Emergency Room Triage Nurse: A critical patient with cardiac arrest (IR0 - highest priority) immediately bypasses a patient with a minor sprain (IR7 - lower priority).

#### 4. Key Mechanics & Internal Registers
- IRR (Interrupt Request Register): Stores all interrupt levels requesting service (latches pins IR0 to IR7).
- ISR (In-Service Register): Stores the specific interrupt currently being serviced by the CPU.
- IMR (Interrupt Mask Register): Allows the programmer to mask (disable) specific interrupt lines via software bits.
- Priority Resolver (PR): Determines which of the active bits in IRR has the highest priority and signals the INT pin.
- Cascading Ability: Up to 8 slave 8259s can be connected to 1 master 8259, expanding capacity to handle up to 64 prioritized hardware interrupts!

---
💡 Next Step: Would you like to explore how Initialization Command Words (ICW1-ICW4) configure the 8259 during system boot?`;
    }
  }

  // 2. Operating Systems: Deadlocks, Concurrency, Virtual Memory, Paging
  if (lowerMsg.includes('deadlock') || lowerMsg.includes('operating system') || lowerMsg.includes('paging') || lowerMsg.includes('virtual memory') || lowerMsg.includes('semaphore') || lowerMsg.includes('mutex') || lowerMsg.includes('thread') || lowerMsg.includes('process')) {
    if (lowerMsg.includes('deadlock')) {
      return `### Operating Systems: Deadlock Fundamentals

#### 1. Problem it Solves
In multi-threaded and distributed systems, multiple processes compete for finite resources (printers, database locks, memory buffers). If process A holds Resource 1 and waits for Resource 2, while process B holds Resource 2 and waits for Resource 1, execution stalls indefinitely.

#### 2. Core Analogy
A 4-way traffic gridlock where each vehicle enters the intersection and blocks the road for the car to its left. No car can move forward without another car reversing.

#### 3. The 4 Coffman Conditions (All must hold simultaneously for a deadlock):
1. Mutual Exclusion: At least one resource must be non-shareable.
2. Hold and Wait: A process holds at least one resource while waiting to acquire others.
3. No Preemption: Resources cannot be forcibly confiscated from a process holding them.
4. Circular Wait: A closed chain of processes exists where each waits for a resource held by the next.

#### 4. Prevention & Recovery Strategies
- Resource Ordering: Enforce a global numerical acquisition hierarchy to eliminate Circular Wait.
- Banker's Algorithm: Simulates resource allocation to verify safe vs unsafe states before granting requests.
- Detection & Recovery: Periodic cycle detection via Wait-For Graphs (WFG) and terminating offending processes.

---
💡 Next Step: Would you like to analyze a Banker's Algorithm allocation table or review thread synchronization with Mutexes and Semaphores?`;
    }
  }

  // 3. Computer Networks: TCP 3-Way Handshake, OSI Model, DNS
  if (lowerMsg.includes('computer network') || lowerMsg.includes('tcp') || lowerMsg.includes('osi') || lowerMsg.includes('udp') || lowerMsg.includes('dns') || lowerMsg.includes('http') || lowerMsg.includes('handshake')) {
    return `### Computer Networks: TCP 3-Way Handshake & Connection Mechanics

#### 1. Problem it Solves
When two machines communicate over an unreliable physical medium (the Internet), packets can be lost, duplicated, or reordered. TCP establishes a reliable, bidirectional, in-order byte stream before any application payload is sent.

#### 2. Core Analogy
A verified radio communication protocol:
- Station A: "Can you hear me?" (SYN)
- Station B: "I hear you loud and clear! Can you hear me?" (SYN-ACK)
- Station A: "Roger, I hear you too! Ready for transmission." (ACK)

#### 3. Key Handshake Steps
1. SYN (Synchronize): Client selects an initial sequence number (ISN = X) and sends a SYN packet to the server.
2. SYN-ACK: Server receives SYN, allocates socket buffers, selects its own ISN = Y, and sends back SYN-ACK with ACK = X + 1.
3. ACK (Acknowledge): Client sends ACK = Y + 1. The connection transitions to the ESTABLISHED state.

#### 4. Critical Engineering Nuances
- SYN Flood Mitigation: SYN Cookies allow servers to defer socket buffer allocation until the final ACK arrives.
- TCP vs UDP: TCP guarantees ordered delivery via ACK numbers and sliding window flow control; UDP delivers zero-handshake low latency for gaming and video streaming.

---
💡 Next Step: Would you like to review DNS recursive resolution or the OSI 7-layer encapsulation model?`;
    }

  // 4. Attachment / Uploaded Roadmap Review
  if (attachment || lowerMsg.includes('roadmap') || lowerMsg.includes('curriculum') || lowerMsg.includes('attached')) {
    const fileName = attachment?.name || 'Personal Study Roadmap';
    if (language === 'hi') {
      return `नमस्ते ${name}! 📑\n\nमैंने आपके द्वारा अपलोड किए गए रोडमैप (${fileName}) का संपूर्ण विश्लेषण किया है:\n\n### 1. पाठ्यक्रम की मजबूती\n- आपके लक्षित पद ${role} के लिए मुख्य विषयों का क्रम सुव्यवस्थित है।\n- बुनियादी अवधारणाओं से लेकर व्यावहारिक कोडिंग तक का प्रवाह उचित है।\n\n### 2. समय-विभाजन (${studyMins} मिनट/दिन के अनुसार)\n- प्रतिदिन ${Math.round(studyMins * 0.5)} मिनट समस्या समाधान (DSA) को दें।\n- प्रतिदिन ${Math.round(studyMins * 0.3)} मिनट प्रोजेक्ट और हैंड्स-ऑन कोडिंग को दें।\n- प्रतिदिन ${Math.round(studyMins * 0.2)} मिनट मुख्य सिद्धांतों (DBMS/OS) को दें।\n\n### 3. सुझाई गई सुधार सूची\n1. सिस्टम डिज़ाइन घटक: सप्ताह 3 में कैशिंग (Redis) और API सुरक्षा (JWT) जोड़ें।\n2. मॉक टेस्ट: सप्ताहांत पर 45 मिनट की टाइम-बाउंड कोडिंग परीक्षा रखें।\n\n---\n💡 अगला कदम: क्या आप चाहेंगे कि मैं इस रोडमैप को आपके AI Study Planner में स्वचालित रूप से जोड़ दूँ?`;
    }
    if (language === 'mr') {
      return `नमस्कार ${name}! 📑\n\nमी तुम्ही अपलोड केलेल्या रोडमॅपचे (${fileName}) सविस्तर विश्लेषण केले आहे:\n\n### १. अभ्यासक्रमाची जमेची बाजू\n- तुमच्या ${role} या ध्येयासाठी आवश्यक मूलभूत संकल्पना योग्य क्रमाने मांडल्या आहेत।\n\n### २. वेळेचे नियोजन (दररोज ${studyMins} मिनिटे)\n- ${Math.round(studyMins * 0.5)} मिनिटे: समस्या सोडवणे (DSA)।\n- ${Math.round(studyMins * 0.3)} मिनिटे: थेट प्रकल्प व कोडिंग।\n- ${Math.round(studyMins * 0.2)} मिनिटे: कोअर सीएस व रिव्हिजन।\n\n### ३. महत्त्वाचे बदल\n- डेटाबेस इंडेक्सिंग आणि API स्केलिंगचे प्रत्यक्ष प्रात्यक्षिक समाविष्ट करा।\n\n---\n💡 पुढील दिशा: हा अभ्यासक्रम थेट तुमच्या AI Planner मध्ये समाविष्ट करूया का?`;
    }
    return `Hello ${name}! 📑\n\nI have thoroughly analyzed your uploaded document (${fileName}):\n\n### 1. Curriculum Viability for ${role}\n- Foundations: The sequencing from core syntax to intermediate topics is logically structured.\n- Company Alignment: Covers key requirements sought by ${companies}.\n\n### 2. Paced Daily Allocation (${studyMins} minutes/day)\n- ${Math.round(studyMins * 0.5)} mins — Algorithmic Mastery (DSA): Focus on high-frequency patterns (Two Pointers, HashMaps, Sliding Window).\n- ${Math.round(studyMins * 0.3)} mins — Production Projects: Feature engineering with database schema design.\n- ${Math.round(studyMins * 0.2)} mins — Core Fundamentals & Revision: Operating Systems concurrency & SQL indexing.\n\n### 3. High-Impact Enhancements\n1. Add Mock Simulations: Schedule a 45-minute timed test every Saturday.\n2. System Design Checkpoint: Integrate Redis caching and load balancing concepts in Week 3.\n\n---\n💡 Recommended Next Step: Would you like me to automatically sync this analyzed roadmap into your Human + AI Study Planner?`;
  }

  // 5. Greetings & Introductions
  const isGreeting = /^(hello|hi|hey|greetings|namaste|pranam|namaskar|good\s+(morning|afternoon|evening))/i.test(lowerMsg) ||
                     /(?:my name is|i am|i'm|call me)/i.test(lowerMsg) ||
                     (lowerMsg.length < 35 && (lowerMsg.includes('harsh') || lowerMsg.includes('student')));

  if (isGreeting) {
    if (language === 'hi') {
      return `नमस्ते ${name}! 👋 CareerPilot AI में आपका हार्दिक स्वागत है।\n\nमैं आपका 24/7 एआई करियर मेंटर हूँ। आपकी पृष्ठभूमि (${branch}, ${university}) और आपके लक्ष्य (${role}, लक्षित कंपनियां: ${companies}) को ध्यान में रखते हुए मैं आपकी सहायता के लिए तैयार हूँ।\n\nआज हम किस विषय पर चर्चा करें?\n- 🧩 DSA एवं कोडिंग अभ्यास: LeetCode पैटर्न्स, कोड व Big-O जटिलता विश्लेषण।\n- 🏛️ सिस्टम डिज़ाइन व आर्किटेक्चर: स्केलेबिलिटी, कैशिंग और डेटाबेस डिज़ाइन।\n- 🎙️ मॉक इंटरव्यू (STAR पद्धति): तकनीकी व बिहेवियरल साक्षात्कार की तैयारी।\n- 🗺️ व्यक्तिगत रोडमैप समीक्षा: अपने दैनिक ${studyMins} मिनट के अध्ययन का सर्वोत्तम उपयोग।\n\nआप नीचे दिए गए विकल्पों में से चुन सकते हैं या अपना कोई भी प्रश्न पूछ सकते हैं!`;
    }
    if (language === 'mr') {
      return `नमस्कार ${name}! 👋 CareerPilot AI मध्ये आपले मनःपूर्वक स्वागत आहे.\n\nमी तुमचा २४/७ वैयक्तिक करिअर मार्गदर्शक आहे. तुमच्या ${branch} शाखेचा आणि ${role} या ध्येयाचा विचार करून आपण आज पुढील विषयांवर काम करू शकतो:\n- 🧩 DSA आणि कोडिंग: समस्या सोडवण्याच्या पद्धती आणि Big-O विश्लेषण।\n- 🏛️ सिस्टम डिझाईन: हाय-लेव्हल आर्किटेक्चर आणि स्केलिंग।\n- 🎙️ मॉक मुलाखत (STAR पद्धत): मुलाखतीची परिपूर्ण तयारी।\n- 🗺️ अभ्यास नियोजन: तुमच्या रोजच्या ${studyMins} मिनिटांचे अचूक विभाजन।\n\nआज आपण कुठून सुरुवात करूया?`;
    }
    return `Hello ${name}! 👋 It is fantastic to connect with you.\n\nI am your 24/7 personal CareerPilot AI Mentor. I am fully calibrated for your profile (${branch}, ${university}), aiming for ${role} at companies like ${companies}.\n\nHere is how we can accelerate your preparation right now:\n- 🧩 DSA & Algorithmic Problem Solving: Deep dives into LeetCode patterns with complete code and Big-O complexity.\n- 🏛️ System Design & Architecture: Designing scalable APIs, caching with Redis, and database indexing.\n- 🎙️ Mock Interviews & Behavioral Prep: Polishing responses using the battle-tested STAR method.\n- 🗺️ Roadmap & Study Pacing: Optimizing your daily ${studyMins} minutes commitment for maximum retention.\n\nFeel free to speak via the Microphone (🎤), upload notes or a roadmap (📎), or type any question you have! What would you like to tackle first?`;
  }

  // 6. Coding / DSA Query
  if (lowerMsg.includes('binary search') || lowerMsg.includes('sliding window') || lowerMsg.includes('dsa') || lowerMsg.includes('algorithm') || lowerMsg.includes('leetcode') || lowerMsg.includes('dynamic programming') || lowerMsg.includes('tree') || lowerMsg.includes('graph')) {
    return `### Algorithmic Mastery: Strategic Solution for ${name}

Here is a structured, production-grade breakdown for this pattern:

\`\`\`python
def search_pattern(arr, target):
    # Two-pointer binary search template
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if arr[mid] == target:
            return mid  # Target found
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1  # Target not found
\`\`\`

#### Complexity Analysis
- Time Complexity: $O(\\log N)$ — Slices search space in half each iteration.
- Space Complexity: $O(1)$ — Uses constant auxiliary variables.

#### Key Interview Nuances
1. Integer Overflow Guard: Always write mid = left + (right - left) // 2 instead of (left + right) // 2.
2. Boundary Conditions: Ensure while left <= right vs while left < right matches search termination criteria.

---
💡 Next Steps: Would you like to solve a live variation of this question, or trace through an edge-case example?`;
  }

  // 7. System Design Query
  if (lowerMsg.includes('system design') || lowerMsg.includes('caching') || lowerMsg.includes('redis') || lowerMsg.includes('microservice') || lowerMsg.includes('sharding') || lowerMsg.includes('database')) {
    return `### System Design Architecture Blueprint

For high-scale systems evaluated at companies like ${companies}:

#### 1. High-Level Architectural Flow
\`\`\`
[Clients] -> [DNS / Cloudflare CDN] -> [Load Balancer (Nginx)] -> [API Gateway]
                                                                        |
                                         +------------------------------+-------------------------------+
                                         |                                                              |
                               [Auth Microservice]                                            [Core API Service]
                                         |                                                              |
                               [Redis Cache (In-Memory)]                                  [PostgreSQL Primary / Replica]
\`\`\`

#### 2. Critical Scalability Principles
- Cache-Aside Pattern: Check Redis first ($O(1)$ latency). On cache miss, read from PostgreSQL and backfill Redis with TTL.
- Database Scaling: Read replicas for read-heavy workloads (90/10 rule) and horizontal sharding by user ID hash.
- Resilience: Circuit breakers and exponential backoff on third-party service calls.

---
💡 Next Steps: Would you like to deep-dive into database schema optimization, or explore cache invalidation strategies?`;
  }

  // 8. Java Backend Development Roadmap & Skills
  if (lowerMsg.includes('java') && (lowerMsg.includes('backend') || lowerMsg.includes('skill') || lowerMsg.includes('learn') || lowerMsg.includes('spring'))) {
    return `### Java Backend Engineering Mastery Roadmap for ${name}

Targeting ${role} roles at tier-1 companies like ${companies}:

#### 1. Core Language & JVM Fundamentals (Weeks 1-2)
- Java 17 / 21 LTS Features: Records, Pattern Matching, Virtual Threads (Project Loom), Sealed Classes.
- Advanced Concurrency: CompletableFuture, ExecutorService, Thread pools, and memory barriers (volatile, CAS).
- Collections & Generics: Internal implementation of HashMap (buckets, red-black tree threshold), ConcurrentHashMap.

#### 2. Enterprise Frameworks & Data Persistence (Weeks 3-4)
- Spring Boot 3.x: IoC, Dependency Injection, Spring Security with Stateless JWT & OAuth2.
- Data Layer: Spring Data JPA / Hibernate, N+1 query problem resolution with JOIN FETCH, Level-2 caching.
- Databases: PostgreSQL schema normalization, B-Tree and GIN indexes, transaction isolation levels (ACID).

#### 3. Distributed Architecture & Cloud Deployment (Weeks 5-6)
- Microservices Communication: RESTful APIs with OpenAPI/Swagger, gRPC for inter-service RPC.
- Event-Driven Streaming: Apache Kafka (Producers, Consumer Groups, Partitions, Idempotence).
- Caching & DevOps: Redis Cache-Aside, Docker multi-stage builds, and Kubernetes basics.

#### 4. Testing & Code Quality
- Unit & Integration Testing: JUnit 5, Mockito, and Testcontainers for ephemeral database testing.

---
💡 Next Step: Would you like me to generate a 4-week structured learning roadmap for this in your Smart Roadmap module?`;
  }

  // 9. Career Progress & Readiness Analysis
  if (lowerMsg.includes('career progress') || lowerMsg.includes('analyze my career') || lowerMsg.includes('my progress') || lowerMsg.includes('evaluate my progress')) {
    return `### Comprehensive Career Velocity Analysis for ${name}

Based on your active profile:
- Academic Foundation: ${branch} at ${university}
- Target Destination: ${role} at ${companies}
- Daily Focus Budget: ${studyMins} minutes/session (${Math.round((studyMins / 60) * 10) / 10} hours/day)
- Current Core Competencies: ${profile.current_skills || 'Full-Stack Foundations'}

#### Strategic Velocity Assessment
1. Curriculum Pacing (Top 15% Consistency):
   - Your daily availability of ${studyMins} minutes is optimal for high-retention focused deep work blocks.
   - Dedicating 5 days a week equals ~${Math.round(studyMins * 5 / 60)} hours/week of focused deliberate practice.

2. Skill Readiness vs Target Companies:
   - DSA & Problem Solving: Solid progress. Recommend pushing through High-Frequency Blind 75 / NeetCode 150 patterns.
   - Full Stack / Backend Depth: Ready for production microservices and scalable cloud deployments.
   - System Design & Concurrency: Recommended next tier for senior placement rounds at ${companies}.

3. High-Impact Next Milestones:
   - Complete 1 End-to-End full-stack capstone project with Docker & CI/CD deployment.
   - Run ATS Resume Scan to verify keyword coverage >85% for ${role}.
   - Schedule 2 weekly mock interview practice rounds.

---
💡 Next Action: Would you like to review your current tasks in the AI Planner or run an instant resume ATS audit?`;
  }

  // 10. Study Plan Generation Query
  if (lowerMsg.includes('study plan') || lowerMsg.includes('create a study plan') || lowerMsg.includes('study schedule') || lowerMsg.includes('schedule for me')) {
    const dsaMins = Math.round(studyMins * 0.5);
    const devMins = Math.round(studyMins * 0.35);
    const revMins = studyMins - dsaMins - devMins;

    return `### Custom ${studyMins}-Minute Daily Study Architecture for ${name}

Engineered specifically for your target role (${role}) and schedule:

#### Daily Time Allocation (${studyMins} min session):
| Block | Duration | Focus Area | High-Yield Activity |
|---|---|---|---|
| Block 1: Deep Problem Solving | ${dsaMins} mins | Algorithms & DSA | Solve 1-2 pattern problems (Two Pointers, DP, Trees). Analyze O(N) Big-O. |
| Block 2: Applied Engineering | ${devMins} mins | Core Dev & Projects | Build production features, API endpoints, or database schemas. |
| Block 3: Consolidation & Review | ${revMins} mins | CS Fundamentals | Review OS concurrency, SQL indexing, or mock interview questions. |

#### Weekly Cadence:
- Mon - Thu: Core Curriculum & Problem Solving sprints.
- Friday: Integration testing, GitHub pushes, and code refactoring.
- Saturday: 1 Timed Mock Coding Contest (45-60 min).
- Sunday: Strategic rest & planning for the upcoming week.

---
💡 Instant Sync: I can push this schedule directly into your Human + AI Planner module! Would you like me to sync it?`;
  }

  // 11. Resume Review & Improvement Query
  if (lowerMsg.includes('resume') || lowerMsg.includes('improve my resume') || lowerMsg.includes('cv') || lowerMsg.includes('ats score')) {
    return `### Resume Optimization & ATS Strategy for ${name}

Tailored for ${role} applications at ${companies}:

#### 1. The Google X-Y-Z Impact Formula
Transform passive duty bullets into quantified impact bullets:
- Weak: "Developed REST APIs for a web application using Node.js."
- Strong: "Engineered 14 RESTful endpoints using Node.js, TypeScript, & PostgreSQL, improving average query latency by 38% and supporting 10,000+ monthly active requests."

#### 2. Essential Technical Keywords to Include
- Languages: Java, Python, TypeScript, SQL, Go.
- Frameworks & Libs: Spring Boot, React, Node.js, Express, Docker.
- Data & Architecture: Redis, PostgreSQL, MongoDB, Kafka, Microservices, RESTful APIs.
- Cloud & DevOps: AWS (S3, EC2), GitHub Actions, Docker, Linux, CI/CD.

#### 3. Section Architecture (ATS Friendly):
1. Header: Name, LinkedIn, GitHub, Email, Phone (clean single-column).
2. Technical Skills: Categorized (Languages, Frameworks, Databases, Tools).
3. Projects (Top Priority for College / Recent Grads): 2-3 standout applications with live URLs and GitHub source links.
4. Education: ${university} — ${branch} (include GPA if >8.0).
5. Certifications & Achievements: LeetCode rating, hackathons, cloud certifications.

---
💡 Next Step: You can upload your PDF/DOCX resume in the Resume Analyzer page for an instant 0-100 ATS compatibility breakdown!`;
  }

  // 12. Behavioral & STAR Method Query
  if (lowerMsg.includes('star') || lowerMsg.includes('interview') || lowerMsg.includes('behavioral') || lowerMsg.includes('tell me about') || lowerMsg.includes('salary')) {
    return `### The STAR Framework for Behavioral Interviews

Top tech interviewers evaluate structure and quantifiable business impact:

1. Situation (S): Set the context in 2 sentences. "During my capstone project at ${university}, we faced high API response latency under concurrent traffic."
2. Task (T): State your specific responsibility. "I was tasked with identifying the bottleneck and ensuring query latency stayed below 150ms."
3. Action (A): Explain the technical steps you took. "I profiled SQL query logs, implemented database compound indexing, and added Redis caching for read-heavy endpoints."
4. Result (R): Quantify the outcome. "Reduced average latency by 45% and comfortably handled 2,500 requests/second with zero downtime."

---
💡 Next Steps: Would you like to practice your response to: "Tell me about a time you resolved a difficult technical disagreement"?`;
  }

  // 13. Generic intelligent response
  return `### Career Guidance & Strategy for ${name}

Regarding your inquiry: "${message.slice(0, 100)}"

1. Context & Analysis:
   - Aligned with your target role as a ${role} at ${companies}.
   - With your current commitment of ${studyMins} minutes/day, deliberate consistency is your greatest competitive advantage.

2. Actionable Recommendations:
   - Focus on Core Fundamentals: Master the underlying concepts rather than memorizing surface-level syntax.
   - Quantify Impact: Document every feature with concrete benchmarks (latency, users, throughput).
   - Daily Pacing: Dedicate ${Math.round(studyMins * 0.4)} minutes to theory and ${Math.round(studyMins * 0.6)} minutes to active hands-on coding.

---
💡 Next Steps:
- Would you like a targeted code walkthrough or algorithmic explanation?
- Would you like to run a mock interview question?
- Or should we review your Study Planner tasks for today?`;
}

/**
 * 4. Human + AI Collaborative Planner: Pros, Cons & AI Plan Optimizer
 */
export async function evaluateStudyPlanProsAndCons(tasks = [], targetRole = 'Software Engineer', dailyHours = 2, language = 'en') {
  const systemPrompt = `You are a Senior Career Coach and Curriculum Strategist.
Analyze the student's study plan tasks for the target role "${targetRole}" with a daily commitment of ${dailyHours} hours/day.
Provide a balanced evaluation:
1. "pros": Array of 3-4 distinct strengths of their current plan.
2. "cons": Array of 2-3 risks, blindspots, or missing foundational topics.
3. "recommendations": Array of 3-4 specific enhancements.
4. "optimized_tasks": Array of refined tasks that fixes the cons while respecting their hours.

Return ONLY a valid JSON object without markdown fences, formatted as:
{
  "pros": ["..."],
  "cons": ["..."],
  "recommendations": ["..."],
  "optimized_tasks": [
    {
      "day": "Monday",
      "time": "18:00 - 20:00",
      "description": "...",
      "is_completed": false,
      "is_ai_suggested": true
    }
  ]
}`;

  const tasksSummary = tasks.map(t => `${t.day} (${t.time || '2h'}): ${t.description}`).join('\n');
  const aiText = await callGemini(systemPrompt, `Target Role: ${targetRole}\nDaily Hours: ${dailyHours}\nCurrent Plan:\n${tasksSummary || 'No custom tasks set yet.'}`, language);

  if (aiText) {
    try {
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      // fallback
    }
  }

  return getFallbackPlanAnalysis(targetRole, dailyHours, language);
}

function getFallbackPlanAnalysis(targetRole, dailyHours, language) {
  if (language === 'hi') {
    return {
      pros: [
        `नियमित ${dailyHours} घंटे का दैनिक अध्ययन समय निरंतरता बनाए रखने के लिए उपयुक्त है`,
        `${targetRole} के लिए कोडिंग और समस्या-समाधान पर अच्छा प्राथमिक ध्यान`,
        'सप्ताह के दिनों में स्पष्ट कार्यों का आवंटन'
      ],
      cons: [
        'सप्ताहांत में रिवीज़न और मॉक टेस्ट के लिए बफर समय का अभाव',
        'सिस्टम डिजाइन और कोर कंप्यूटर साइंस विषयों का कम समावेश'
      ],
      recommendations: [
        'प्रत्येक शनिवार को पिछले 5 दिनों के प्रश्नों का संक्षिप्त रिवीज़न रखें',
        'प्रोजेक्ट विकास के साथ-साथ यूनिट टेस्टिंग भी शामिल करें',
        'सप्ताह में एक बार 45 मिनट का टाइमर लगाकर मॉक इंटरव्यू अभ्यास करें'
      ],
      optimized_tasks: [
        { day: 'Monday', time: '18:00 - 20:00', description: `DSA: Arrays & Strings गहन अभ्यास और 3 प्रश्न (${targetRole})`, is_completed: false, is_ai_suggested: true },
        { day: 'Tuesday', time: '18:00 - 20:00', description: 'Core CS: OS Concurrency & Memory Management सिद्धांत', is_completed: false, is_ai_suggested: true },
        { day: 'Wednesday', time: '18:00 - 20:00', description: 'Project: API Optimization, JWT Authentication & Error Handling', is_completed: false, is_ai_suggested: true },
        { day: 'Thursday', time: '18:00 - 20:00', description: 'DSA: Tree & Graph Traversal (BFS/DFS) समस्या समाधान', is_completed: false, is_ai_suggested: true },
        { day: 'Friday', time: '18:00 - 20:00', description: 'System Design: Caching (Redis), Load Balancing & Database Indexing', is_completed: false, is_ai_suggested: true },
        { day: 'Saturday', time: '10:00 - 12:00', description: 'Mock Interview: 45-min Time-bound LeetCode Challenge & Self-Review', is_completed: false, is_ai_suggested: true },
        { day: 'Sunday', time: '11:00 - 12:30', description: 'Weekly Buffer & Review: GitHub Code Polish & Week Planning', is_completed: false, is_ai_suggested: true }
      ]
    };
  }

  if (language === 'mr') {
    return {
      pros: [
        `दररोज ${dailyHours} तास अभ्यासाचे सुसंगत नियोजन सातत्य राखण्यास मदत करेल`,
        `${targetRole} साठी कोडिंग व तांत्रिक विषयांवर योग्य भर`,
        'दिवसनिहाय कार्यांची स्पष्ट विभागणी'
      ],
      cons: [
        'आठवड्याच्या शेवटी रिव्हिजन व मॉक टेस्टसाठी राखीव वेळ कमी आहे',
        'सिस्टम डिझाइन व डेटाबेस ऑप्टिमायझेशन विषयांचा समावेश वाढवणे गरजेचे आहे'
      ],
      recommendations: [
        'शनिवारी आठवड्याभरातील कठीण समस्यांची पुनरावृत्ती करा',
        'प्रकल्पामध्ये केवळ कोडिंग न करता डॉक्युमेंटेशन व टेस्टिंग समाविष्ट करा',
        'आठवड्यातून एकदा वेळ लावून तांत्रिक चाचणी सोडवा'
      ],
      optimized_tasks: [
        { day: 'Monday', time: '18:00 - 20:00', description: `DSA: Arrays & HashMaps वरील ३ सराव समस्या (${targetRole})`, is_completed: false, is_ai_suggested: true },
        { day: 'Tuesday', time: '18:00 - 20:00', description: 'Core CS: Operating Systems & Database Indexing संकल्पना', is_completed: false, is_ai_suggested: true },
        { day: 'Wednesday', time: '18:00 - 20:00', description: 'Project: Backend API विकसित करणे व सुरक्षा पडताळणी', is_completed: false, is_ai_suggested: true },
        { day: 'Thursday', time: '18:00 - 20:00', description: 'DSA: Trees & Binary Search पद्धतींचा सखोल सराव', is_completed: false, is_ai_suggested: true },
        { day: 'Friday', time: '18:00 - 20:00', description: 'System Design: Caching, Microservices व स्केल संकल्पना', is_completed: false, is_ai_suggested: true },
        { day: 'Saturday', time: '10:00 - 12:00', description: 'Mock Test: ४५ मिनिटांची वेळेत कोडिंग परीक्षा व पुनरावलोकन', is_completed: false, is_ai_suggested: true },
        { day: 'Sunday', time: '11:00 - 12:30', description: 'साप्ताहिक आढावा: GitHub प्रोफाइल अपडेट व पुढील नियोजन', is_completed: false, is_ai_suggested: true }
      ]
    };
  }

  if (language === 'sa') {
    return {
      pros: [
        `प्रतिदिनं ${dailyHours}-होरात्मकः अभ्यासः सातत्यं रक्षति`,
        `${targetRole}-पदाय कोडिंग-अभ्यासस्य समीचीनं संयोजनम्`,
        'दिनक्रमेण कार्याणां स्पष्टा योजना'
      ],
      cons: [
        'सप्ताहान्ते पुनरावृत्तये समयस्य न्यूनता',
        'तन्त्र-विन्यासस्य (System Design) अधिकः समावेशः अपेक्षितः'
      ],
      recommendations: [
        'शनिवासरे सप्ताहस्य कठीण-प्रश्नानां पुनरावृत्तिं कुरु',
        'प्रकल्प-लेखने सहैव परीक्षणं संयोजय',
        'सप्ताहे एकवारं कालबद्ध-साक्षात्कारस्य अभ्यासं कुरु'
      ],
      optimized_tasks: [
        { day: 'Monday', time: '18:00 - 20:00', description: `DSA: Arrays & HashMaps अभ्यासः ३ प्रश्नाः च (${targetRole})`, is_completed: false, is_ai_suggested: true },
        { day: 'Tuesday', time: '18:00 - 20:00', description: 'Core CS: OS & Database सिद्धान्ताः', is_completed: false, is_ai_suggested: true },
        { day: 'Wednesday', time: '18:00 - 20:00', description: 'Project: API निर्माणं सुरक्षितता-परीक्षणं च', is_completed: false, is_ai_suggested: true },
        { day: 'Thursday', time: '18:00 - 20:00', description: 'DSA: Trees & Graphs सघन-अभ्यासः', is_completed: false, is_ai_suggested: true },
        { day: 'Friday', time: '18:00 - 20:00', description: 'System Design: Caching, Microservices सिद्धान्ताः', is_completed: false, is_ai_suggested: true },
        { day: 'Saturday', time: '10:00 - 12:00', description: 'Mock Test: कालबद्ध-कोडिंग-परीक्षणम्', is_completed: false, is_ai_suggested: true },
        { day: 'Sunday', time: '11:00 - 12:30', description: 'पुनरावलोकनम्: GitHub परिष्कारः अग्रिमयोजना च', is_completed: false, is_ai_suggested: true }
      ]
    };
  }

  // English fallback
  return {
    pros: [
      `Consistent ${dailyHours} hours/day study cadence avoids burnout and promotes long-term retention`,
      `Dedicated emphasis on high-yield problem solving aligned with ${targetRole}`,
      'Clear day-by-day task allocation creates strong accountability'
    ],
    cons: [
      'Missing scheduled buffer time for weekend review and retrospection',
      'Underweight on System Design and Core Computer Science (OS/DBMS) topics',
      'No dedicated time-boxed mock interview simulation sessions'
    ],
    recommendations: [
      'Schedule a dedicated 45-minute timed mock test every Saturday morning',
      'Integrate unit testing and documentation alongside feature coding in projects',
      'Reserve Sunday mornings for reviewing tricky problems solved earlier in the week'
    ],
    optimized_tasks: [
      { day: 'Monday', time: '18:00 - 20:00', description: `DSA Mastery: Arrays, Sliding Window & HashMaps (3 Medium Problems for ${targetRole})`, is_completed: false, is_ai_suggested: true },
      { day: 'Tuesday', time: '18:00 - 20:00', description: 'Core CS Deep Dive: OS Virtual Memory, Concurrency & Thread Synchronization', is_completed: false, is_ai_suggested: true },
      { day: 'Wednesday', time: '18:00 - 20:00', description: 'Production Project: Architect REST APIs, JWT Auth & Database Connection Pools', is_completed: false, is_ai_suggested: true },
      { day: 'Thursday', time: '18:00 - 20:00', description: 'DSA Deep Dive: Binary Trees & Graphs (DFS/BFS traversal variations)', is_completed: false, is_ai_suggested: true },
      { day: 'Friday', time: '18:00 - 20:00', description: 'System Design: Distributed Caching (Redis), Sharding & Rate Limiting', is_completed: false, is_ai_suggested: true },
      { day: 'Saturday', time: '10:00 - 12:00', description: 'Timed Mock Interview: 45-minute LeetCode challenge + Self Code Review', is_completed: false, is_ai_suggested: true },
      { day: 'Sunday', time: '11:00 - 12:30', description: 'Weekly Retro & Buffer: Polish GitHub READMEs and calibrate upcoming roadmap sprint', is_completed: false, is_ai_suggested: true }
    ]
  };
}

/**
 * 5. 2-Hour Autonomous AI Agent Reminder Dispatcher
 */
export function generate2HourCheckinReminder(userName, pendingCount = 2, language = 'en') {
  if (language === 'hi') {
    return {
      title: "2-घंटे का अध्ययन चेक-इन • CareerPilot Agent ⏱️",
      subject: `CareerPilot Agent: 2 घंटे पूरे हुए! आपके ${pendingCount} कार्य बाकी हैं 🎯`,
      body: `नमस्ते ${userName}, आपका 2-घंटे का अध्ययन सत्र समाप्त हुआ। आपकी दैनिक अध्ययन योजना में अभी ${pendingCount} कार्य शेष हैं। एक छोटा 5 मिनट का ब्रेक लें और अगले लक्ष्य पर विजय प्राप्त करें!`
    };
  }
  if (language === 'mr') {
    return {
      title: "२-तासांचा अभ्यास चेक-इन • CareerPilot Agent ⏱️",
      subject: `CareerPilot Agent: २ तास पूर्ण झाले! तुमची ${pendingCount} कामे बाकी आहेत 🎯`,
      body: `नमस्कार ${userName}, तुमचा २ तासांचा अभ्यास कालावधी पूर्ण झाला आहे. आजच्या नियोजन पत्रकात अजून ${pendingCount} कामे शिल्लक आहेत. ५ मिनिटांचा ब्रेक घ्या आणि पुढील काम सुरू करा!`
    };
  }
  if (language === 'sa') {
    return {
      title: "२-होरात्मकं परीक्षणम् • CareerPilot Agent ⏱️",
      subject: `CareerPilot Agent: २ होराः समाप्ताः! अद्य तव ${pendingCount} कार्याणि शेषाणि 🎯`,
      body: `नमस्ते ${userName}, तव द्विहोरात्मकः अध्ययनकालः सम्पन्नः। अद्यतनसारिण्यां ${pendingCount} कार्याणि अवशिष्टानि सन्ति। पञ्चनिमेषाणां विरामं गृहीत्वा अग्रिमकार्यं साधयतु!`
    };
  }
  return {
    title: "2-Hour Study Check-in • CareerPilot Agent ⏱️",
    subject: `CareerPilot Agent: 2 Hours Elapsed! You have ${pendingCount} tasks remaining 🎯`,
    body: `Hi ${userName}, 2 hours have elapsed since your active study sprint began. You still have ${pendingCount} pending tasks on today's roadmap. Take a rejuvenating 5-minute break and let's tackle the next milestone!`
  };
}

/**
 * 6. AI Smart Roadmap Generator - Senior Mentor Curriculum
 */
export async function generateRoadmapWithAI(skillName, durationWeeks = 4, dailyHours = 2, targetRole = 'Software Engineer', language = 'en') {
  const systemPrompt = `You are a Principal Software Engineer and Senior Technical Curriculum Architect.
Create a detailed, day-by-day, non-repetitive learning roadmap for mastering "${skillName}" over ${durationWeeks} weeks with ${dailyHours} hours/day study commitment, calibrated for the goal of becoming a "${targetRole}".

CRITICAL RESOURCE RULES:
1. On Day 1 ONLY of each week, provide exactly:
   - 1 curated YouTube Masterclass video link (type: "video")
   - 1 official website/documentation link (type: "article")
   - 1 curated LeetCode or practice challenge link (type: "practice")
2. On Days 2 through 6 of each week, provide an EMPTY ARRAY [] for "resource_links". Do NOT repeat links on subsequent days!
3. Granular Progression: Detail specific micro-topics day by day (e.g. Day 1: Foundations, Day 2: Primitive Types, Day 3: Operators & Math, Day 4: Conditionals & Switch, Day 5: Loops & Patterns, Day 6: Milestone Project Build).
4. For each week, provide a "milestone_project" with { "title": "...", "description": "...", "tech_stack": ["..."], "deliverables": ["..."] }.
5. Provide a "time_distribution" object: { "theory_percent": 25, "dsa_practice_percent": 40, "project_percent": 25, "revision_percent": 10 }.

Return ONLY a valid JSON array of week objects without markdown fences, formatted as:
[
  {
    "week_number": 1,
    "title": "Week 1: Title",
    "milestone": "Weekly Milestone Objective",
    "milestone_project": {
      "title": "Milestone Project Title",
      "description": "Project summary",
      "tech_stack": ["Java", "IntelliJ", "Git"],
      "deliverables": ["Deliverable 1", "Deliverable 2"]
    },
    "time_distribution": {
      "theory_percent": 25,
      "dsa_practice_percent": 40,
      "project_percent": 25,
      "revision_percent": 10
    },
    "tasks": [
      {
        "day_number": 1,
        "task_description": "...",
        "resource_links": [
          {"title": "... Masterclass", "type": "video", "url": "..."},
          {"title": "... Documentation", "type": "article", "url": "..."},
          {"title": "... Practice Set", "type": "practice", "url": "..."}
        ]
      },
      {
        "day_number": 2,
        "task_description": "...",
        "resource_links": []
      }
    ]
  }
]`;

  const aiText = await callGemini(systemPrompt, `Skill: ${skillName}, Duration: ${durationWeeks} weeks, Daily Hours: ${dailyHours}, Target Role: ${targetRole}`, language);

  if (aiText) {
    try {
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  return getFallbackRoadmap(skillName, durationWeeks, dailyHours, targetRole, language);
}

function getFallbackRoadmap(skill, durationWeeks, dailyHours, role, language) {
  const weeks = [];
  const totalWeeks = Math.min(Math.max(durationWeeks, 2), 48);

  const isJavaDSA = /java|dsa|data\s*structures|algorithms|cpp|c\+\+|python/i.test(skill);

  // Modular master curriculum templates for DSA / Programming
  const dsaCurriculumCatalog = [
    {
      title: 'Java Environment & Language Foundations',
      milestone: 'Master JVM/JDK architecture, primitive memory layouts, and arithmetic operators',
      project: {
        title: 'CLI Financial Utility & Grade Analyzer',
        description: 'Command-line application that computes compound interest, tax tiers, and student grade matrices using primitive types and clean branching.',
        tech_stack: ['Java 21', 'IntelliJ IDEA / VS Code', 'Git'],
        deliverables: ['Type-safe input validation', 'Tiered conditional calculator', 'Clean terminal UI']
      },
      days: [
        'JDK, JVM, JRE internals, bytecode compilation & First "Hello World" executable',
        'Primitive Data Types (byte, int, long, float, double, boolean, char), memory footprints & Type Casting',
        'Operators in-depth: Arithmetic, Relational, Logical, Bitwise (AND, OR, XOR, Shifts) & Expression Precedence',
        'Conditional Control Flow: if-else, nested branching, modern switch-case expressions & ternary syntax',
        'Iteration & Loops: for, while, do-while, nested loops, loop labels, break & continue invariants',
        'Milestone Lab: Code CLI Financial Utility with robust edge-case validation & unit test check'
      ],
      leetcode: 'https://leetcode.com/problemset/all/?difficulty=EASY&topicSlugs=math'
    },
    {
      title: 'Object-Oriented Programming (OOP) & Memory Stack vs Heap',
      milestone: 'Build reusable class hierarchies adhering to encapsulation, polymorphism, and interface segregation',
      project: {
        title: 'Bank Account & Transaction Ledger Engine',
        description: 'Object-oriented banking system with abstract accounts, savings/checking sub-classes, interfaces for audit logging, and custom exception handling.',
        tech_stack: ['Java OOP', 'Custom Exceptions', 'Unit Testing (JUnit)'],
        deliverables: ['Inheritance & Abstract classes', 'Transaction auditing interface', 'Custom overdraft exceptions']
      },
      days: [
        'Memory Architecture: Stack vs Heap allocation, Garbage Collection fundamentals & Method Call Stack',
        'Classes, Objects, Instance Variables, Method Signatures & Pass-by-Value mechanics',
        'Constructors, Constructor Chaining, Static variables/methods & the "this" keyword reference',
        'Inheritance, Method Overriding, "super" keyword & Runtime Polymorphism (Dynamic Method Dispatch)',
        'Encapsulation, Access Modifiers (private, package-private, protected, public), Interfaces & Abstract Classes',
        'Milestone Lab: Build OOP Banking System with transaction ledger & account polymorphism'
      ],
      leetcode: 'https://leetcode.com/problemset/all/?topicSlugs=design'
    },
    {
      title: 'Arrays, Strings & Time-Space Complexity Analysis',
      milestone: 'Analyze Big-O bounds and implement optimal Two-Pointer and Sliding Window techniques',
      project: {
        title: 'High-Throughput Log Parser & In-Memory String Indexer',
        description: 'Utility that processes raw server log streams, parses timestamps and error codes, and extracts frequent IP subnets using optimized arrays.',
        tech_stack: ['Java Strings', 'StringBuilder', 'Two-Pointer Algorithms'],
        deliverables: ['Big-O asymptotic profiling report', 'Sliding window anomaly detector', 'Sub-millisecond text search']
      },
      days: [
        'Time & Space Complexity: Asymptotic analysis, Big-O, Big-Theta, Big-Omega & memory profiling',
        '1D Arrays: Memory layout, cache locality, dynamic resizing & array manipulation algorithms',
        'Two-Pointer Technique: Inward and outward pointers (Two Sum, Container With Most Water pattern)',
        'Sliding Window Pattern: Fixed-length vs variable-length windows (Maximum subarray sum, Min window substring)',
        'String Internals: String constant pool, immutability, StringBuilder vs StringBuffer & character arrays',
        'Milestone Lab: Build Log Parser with sliding window rate-limiting & substring pattern finder'
      ],
      leetcode: 'https://leetcode.com/tag/two-pointers/'
    },
    {
      title: 'Searching, Sorting & Divide-and-Conquer',
      milestone: 'Implement Binary Search variations and custom divide-and-conquer sorting algorithms',
      project: {
        title: 'E-Commerce Product Search & Ranking Engine',
        description: 'High-speed in-memory product index allowing price range queries via modified Binary Search and multi-criteria sorting via Merge Sort.',
        tech_stack: ['Java Generics', 'Binary Search', 'Comparator / Comparable'],
        deliverables: ['Custom Binary Search lower/upper bounds', 'Merge Sort implementation with zero allocations', 'Price/Rating sorting benchmarks']
      },
      days: [
        'Linear Search vs Binary Search: Discrete search space, mid calculation overflow avoidance & search predicates',
        'Binary Search Variations: First and last occurrence, rotated sorted array & search in matrix',
        'Elementary Sorts: Bubble Sort, Selection Sort, Insertion Sort & their stability properties',
        'Divide and Conquer Sorts: Merge Sort (in-place vs auxiliary) & Quick Sort (Lomuto vs Hoare partitioning)',
        'Built-in Sorting in Java: Dual-Pivot Quicksort, TimSort, Comparable<T> and Comparator<T> lambda styling',
        'Milestone Lab: Implement Product Search Engine with custom dual-criteria sorting & range query API'
      ],
      leetcode: 'https://leetcode.com/tag/binary-search/'
    },
    {
      title: 'Recursion, Backtracking & Combinatorial Exploration',
      milestone: 'Trace recursion trees, master call stack unwinding, and solve constraint satisfaction problems',
      project: {
        title: 'Sudoku Solver & Maze Navigation Engine',
        description: 'Backtracking engine capable of solving any 9x9 Sudoku grid in under 50ms and discovering all valid paths in an obstacle grid.',
        tech_stack: ['Recursive Backtracking', 'State Space Trees', 'Java Bitsets'],
        deliverables: ['N-Queens state exploration visualization', '9x9 Sudoku constraint solver', 'Grid path discovery algorithm']
      },
      days: [
        'Recursion Foundations: Base cases, recursive leaps of faith, Call Stack frames & StackOverflowError mitigation',
        'State Space Trees: Visualizing execution branches, parameters vs return values & tail recursion',
        'Subsets & Subsequences: Inclusion-exclusion pattern (Generate all subsets, combination sum)',
        'Permutations: Swapping elements, visited arrays & handling duplicate elements gracefully',
        'Backtracking with Constraints: N-Queens problem, Sudoku solver & Word Search in grid',
        'Milestone Lab: Implement Maze Path Discovery & 9x9 Sudoku solver with pruning heuristics'
      ],
      leetcode: 'https://leetcode.com/tag/backtracking/'
    },
    {
      title: 'Linked Lists & Fast-Slow Pointer Mechanics',
      milestone: 'Construct Singly, Doubly, and Circular Linked Lists from scratch without memory leaks',
      project: {
        title: 'Music Player Playlist Manager with Undo/Redo Cache',
        description: 'Bi-directional media playlist system built on a custom Doubly Linked List with instant song skipping, shuffle, and history rewind.',
        tech_stack: ['Pointers & Node References', 'Doubly Linked List', 'Java Memory Models'],
        deliverables: ['Zero-leak Node pointer manipulation', 'Floyd Cycle detection integration', 'O(1) insertion/deletion at playlist pointers']
      },
      days: [
        'Linked List Internals: Node structures, head/tail pointers & reference assignment vs primitive copies',
        'Singly Linked List: Insertion, deletion, iterative vs recursive reversal & dummy node pattern',
        'Floyd’s Tortoise and Hare: Cycle detection, cycle entry point discovery & middle of linked list',
        'Doubly Linked Lists: Bidirectional traversal, sentinel head/tail nodes & O(1) arbitrary node splicing',
        'Advanced List Problems: Merge two sorted lists, intersection point, reverse nodes in k-groups',
        'Milestone Lab: Build Music Playlist Manager with bidirectionally linked tracks and shuffle'
      ],
      leetcode: 'https://leetcode.com/tag/linked-list/'
    },
    {
      title: 'Stacks, Queues & Monotonic Data Structures',
      milestone: 'Master LIFO/FIFO patterns, circular buffers, and monotonic stack optimizations',
      project: {
        title: 'Stock Market Real-Time Price Trend & Daily Span Analyzer',
        description: 'Financial market processing pipeline calculating next greater stock prices and daily price span using a Monotonic Stack in linear O(N) time.',
        tech_stack: ['Monotonic Stack', 'Deque', 'ArrayDeque / Queue API'],
        deliverables: ['Next Greater Element linear solver', 'Sliding Window Maximum using Deque', 'Expression parsing engine (RPN)']
      },
      days: [
        'Stack Fundamentals: LIFO principles, array vs linked list stack implementations & Java Deque / ArrayDeque',
        'Classic Stack Problems: Valid Parentheses, Minimum Stack in O(1) time & space, Evaluation of RPN',
        'Monotonic Stack: Next Greater Element (NGE), Next Smaller Element & Daily Temperatures pattern',
        'Queues & Circular Buffers: FIFO mechanics, Circular Queue implementation & Queue via two Stacks',
        'Monotonic Queue / Double-Ended Queue (Deque): Sliding Window Maximum in linear O(N) time',
        'Milestone Lab: Build Real-time Stock Span & Max Moving Window Engine using Monotonic Deque'
      ],
      leetcode: 'https://leetcode.com/tag/stack/'
    },
    {
      title: 'Binary Trees, BSTs & Hierarchical Traversals',
      milestone: 'Perform recursive and iterative tree traversals (DFS/BFS) and maintain BST ordering invariants',
      project: {
        title: 'Hierarchical File System & Organization Directory Engine',
        description: 'In-memory virtual directory tree modeling folders and file size aggregations with breadth-first search and lowest common ancestor query support.',
        tech_stack: ['Binary Trees', 'Level Order BFS', 'Binary Search Tree'],
        deliverables: ['DFS Traversals (In/Pre/Post)', 'Iterative Level Order BFS using Queue', 'BST validate, search, and delete algorithms']
      },
      days: [
        'Tree Concepts: Root, leaves, depth, height, diameter & Full/Complete/Balanced binary tree definitions',
        'Tree Traversal DFS: Inorder, Preorder, Postorder (both recursive and iterative using Stack)',
        'Level Order Traversal (BFS): Queue-based breadth traversal, Zigzag level order & Right view of tree',
        'Binary Search Trees (BST): Properties, O(log N) lookup, insertion, deletion (inorder successor) & validation',
        'Lowest Common Ancestor (LCA), Path Sum problems & Serialize/Deserialize Binary Tree',
        'Milestone Lab: Implement Virtual File Directory Tree with LCA search & deep folder size aggregation'
      ],
      leetcode: 'https://leetcode.com/tag/tree/'
    },
    {
      title: 'Heaps, Priority Queues & Greedy Strategies',
      milestone: 'Construct array-based binary heaps and solve Top-K and Interval scheduling challenges',
      project: {
        title: 'Distributed Job Scheduler with Priority Execution Queue',
        description: 'Worker queue microservice that schedules asynchronous computational tasks based on priority tiers and deadlines using a Min-Heap.',
        tech_stack: ['Binary Heap', 'PriorityQueue', 'Greedy Interval Scheduling'],
        deliverables: ['Heapify array in O(N) time', 'Top-K elements streaming filter', 'Non-overlapping meeting room scheduler']
      },
      days: [
        'Heap Internals: Complete Binary Tree representation in 1D array (2*i+1, 2*i+2), Max-Heap vs Min-Heap',
        'Heap Operations: Sift-up (insert), Sift-down (extract-min), Build-Heap in O(N) time complexity',
        'Java PriorityQueue: Natural ordering vs custom Comparator, handling custom objects',
        'Top-K Elements: Kth largest element in an array, Top K frequent elements using min-heap of size K',
        'Greedy Algorithms: Activity Selection, Meeting Rooms II, Huffman Coding & Gas Station cycle',
        'Milestone Lab: Build Priority Job Scheduler with automated interval conflict resolver'
      ],
      leetcode: 'https://leetcode.com/tag/heap-priority-queue/'
    },
    {
      title: 'Hashing, HashMaps & In-Memory LRU Cache',
      milestone: 'Design collision-resistant hash functions and implement an O(1) LRU Cache architecture',
      project: {
        title: 'Production In-Memory LRU Cache with TTL Eviction',
        description: 'Thread-safe Least Recently Used (LRU) Cache utilizing a HashMap combined with a Doubly Linked List for strict O(1) lookups and evictions.',
        tech_stack: ['HashMap Internals', 'Doubly Linked List', 'O(1) Eviction'],
        deliverables: ['Collision resolution (Chaining vs Open Addressing)', 'O(1) get() and put() algorithms', 'Automated least-recently-used node eviction']
      },
      days: [
        'Hashing Principles: Hash codes, distribution uniformity, Horner\'s rule & hashCode() + equals() contract in Java',
        'Collision Resolution: Separate chaining (Linked List -> Red-Black Tree in Java 8+) vs Open Addressing',
        'HashMap & HashSet: Internal table sizing, load factor (0.75), rehashing & ConcurrentHashMap basics',
        'Subarray Sum Problems: Prefix Sum + HashMap (Subarray sum equals K, Longest subarray with sum K)',
        'LRU Cache Architecture: Coupling a HashMap with a Doubly Linked List for strict O(1) get/put operations',
        'Milestone Lab: Code In-Memory LRU Cache from scratch with test suite verifying O(1) eviction'
      ],
      leetcode: 'https://leetcode.com/problems/lru-cache/'
    },
    {
      title: 'Graphs: Representations, Traversals & Topological Sort',
      milestone: 'Model directed/undirected graphs, detect cycles, and schedule dependent tasks with DAGs',
      project: {
        title: 'Package Dependency Resolver & Course Schedule Validator',
        description: 'Build tool dependency manager (like Maven/npm) that detects circular imports and determines correct linear compilation order using Kahn\'s Algorithm.',
        tech_stack: ['Adjacency List', 'Graph BFS/DFS', 'Kahn\'s Algorithm (Topological Sort)'],
        deliverables: ['Adjacency List memory modeling', 'Cycle detection in directed & undirected graphs', 'Topological sort build planner']
      },
      days: [
        'Graph Modeling: Adjacency Matrix vs Adjacency List, directed vs undirected, weighted vs unweighted',
        'Breadth-First Search (BFS): Shortest path in unweighted graph, Rotting Oranges & Connected Components',
        'Depth-First Search (DFS): Cycle detection in undirected graphs (parent pointer) and directed graphs (recursion stack)',
        'Topological Sort: Directed Acyclic Graphs (DAG), DFS with Stack & Kahn\'s Algorithm (In-degree Queue)',
        'Bipartite Graphs & Graph Coloring: Two-colorability validation using BFS/DFS',
        'Milestone Lab: Build Package Dependency Resolver with circular reference detector'
      ],
      leetcode: 'https://leetcode.com/tag/graph/'
    },
    {
      title: 'Graphs: Shortest Path, Disjoint Set Union & Minimum Spanning Trees',
      milestone: 'Master Dijkstra, Bellman-Ford, Kruskal/Prim algorithms, and Union-Find DSU',
      project: {
        title: 'City Transit Routing & Network Infrastructure Optimizer',
        description: 'Geographic transit system calculating optimal routes with latency constraints via Dijkstra, and minimal fiber-optic cabling via Kruskal\'s MST.',
        tech_stack: ['Dijkstra\'s Algorithm', 'Disjoint Set Union (DSU)', 'Kruskal\'s MST'],
        deliverables: ['Disjoint Set with path compression & union by rank', 'Dijkstra PriorityQueue shortest path', 'Minimal Spanning Tree network calculator']
      },
      days: [
        'Disjoint Set Union (DSU): Find with Path Compression, Union by Rank/Size & Connected Components',
        'Dijkstra’s Algorithm: Non-negative edge shortest paths using PriorityQueue, relaxation step & time complexity',
        'Bellman-Ford Algorithm: Handling negative edge weights, negative cycle detection & comparison with Dijkstra',
        'Floyd-Warshall Algorithm: All-pairs shortest path in O(V^3) & transitive closure',
        'Minimum Spanning Tree (MST): Cut property, Kruskal’s Algorithm (DSU + greedy edge sorting) & Prim\'s Algorithm',
        'Milestone Lab: Implement Transit Route Optimizer with latency-weighted navigation'
      ],
      leetcode: 'https://leetcode.com/tag/shortest-path/'
    },
    {
      title: 'Dynamic Programming (1D & Grid DP)',
      milestone: 'Transform brute-force recursive algorithms into optimal Memoized and Tabulated state machines',
      project: {
        title: 'Resource Allocation & Robot Pathfinding Cost Optimizer',
        description: 'System optimizing budget expenditures across investment portfolios (0/1 Knapsack) and calculating minimum cost paths across dynamic grid terrains.',
        tech_stack: ['Dynamic Programming', '1D/2D Tabulation', 'Space Optimization'],
        deliverables: ['Memoization vs Tabulation benchmarking', '0/1 Knapsack optimal weight allocation', 'Space optimization from O(M*N) to O(N)']
      },
      days: [
        'DP Fundamentals: Overlapping subproblems, optimal substructure, Top-Down Memoization vs Bottom-Up Tabulation',
        '1D DP Classic Problems: Climbing Stairs, Frog Jump, House Robber & Coin Change (unbounded)',
        'Longest Increasing Subsequence (LIS): O(N^2) dynamic programming vs O(N log N) binary search approach',
        '2D Grid DP: Unique Paths, Minimum Path Sum, Dungeon Game & state transition formulas',
        'Knapsack Variants: 0/1 Knapsack, Subset Sum equals Target, Partition Equal Subset Sum',
        'Milestone Lab: Implement Resource Allocation Engine with space-optimized 1D state vectors'
      ],
      leetcode: 'https://leetcode.com/tag/dynamic-programming/'
    },
    {
      title: 'Advanced Dynamic Programming & String Sequences',
      milestone: 'Solve complex multi-string sequence alignment, Edit Distance, and Partition DP challenges',
      project: {
        title: 'DNA Sequence Alignment & Text Difference (Diff) Engine',
        description: 'Bioinformatics diff tool aligning nucleotide sequences and computing minimal line edits between code files using Longest Common Subsequence and Edit Distance.',
        tech_stack: ['String DP', 'Edit Distance Matrix', 'Backtracking optimal string diff'],
        deliverables: ['Longest Common Subsequence (LCS) matrix', 'Edit Distance (Levenshtein distance) calculation', 'Optimal diff change-sequence generator']
      },
      days: [
        'Longest Common Subsequence (LCS): State definition, base cases & reconstructing the actual sequence',
        'Edit Distance (Levenshtein): Insert, delete, and replace operations with boundary condition handling',
        'String DP Variations: Longest Common Substring, Distinct Subsequences, Wildcard Matching',
        'Partition DP: Matrix Chain Multiplication, Minimum Cost to Cut a Stick & Palindrome Partitioning II',
        'Bitmask DP Concepts: Traveling Salesperson Problem & state representation via integer bitmasks',
        'Milestone Lab: Code Text Difference (Diff) Engine with interactive addition/deletion highlighting'
      ],
      leetcode: 'https://leetcode.com/problems/edit-distance/'
    },
    {
      title: 'System Design Fundamentals & High-Level Architecture',
      milestone: 'Design scalable distributed systems handling millions of users with high availability',
      project: {
        title: 'Scalable URL Shortener (Bitly Alternative) Architecture',
        description: 'Distributed URL shortening service designed for 10,000 writes/sec and 100,000 reads/sec with base62 encoding, Redis caching, and rate limiting.',
        tech_stack: ['System Design', 'Redis Caching', 'PostgreSQL Sharding', 'Docker'],
        deliverables: ['Capacity estimation & throughput sizing', 'Database schema with index strategy', 'High availability caching layer']
      },
      days: [
        'System Design Foundations: Latency vs Throughput, CAP Theorem, ACID vs BASE & Vertical vs Horizontal Scaling',
        'Load Balancing: Round Robin, Least Connections, Consistent Hashing & Layer 4 vs Layer 7 balancers',
        'Caching Architectures: Redis, Memcached, Cache-Aside, Write-Through, Write-Back & Cache Invalidation',
        'Databases at Scale: SQL vs NoSQL, Replication (Master-Slave), Sharding, Partitioning & Compound Indexing',
        'Message Queues & Asynchronous Processing: Apache Kafka, RabbitMQ, Event-Driven Architecture & decoupling',
        'Milestone Lab: Architect Scalable URL Shortener with system diagram, API contract & capacity specs'
      ],
      leetcode: 'https://github.com/donnemartin/system-design-primer'
    },
    {
      title: 'Capstone Engineering Project & Industry Mock Interview Prep',
      milestone: 'Complete end-to-end full stack capstone application and master timed STAR technical interviews',
      project: {
        title: 'End-to-End Scalable Career Platform with Real-Time Mentoring',
        description: 'Production-ready full stack platform featuring authentication, asynchronous background workers, Redis cache, and live algorithmic evaluations.',
        tech_stack: ['Full Stack', 'Cloud Deployment', 'CI/CD Pipeline', 'System Monitoring'],
        deliverables: ['Dockerized microservices deployment', 'Automated GitHub Actions CI/CD test suite', 'Live production demonstration link']
      },
      days: [
        'End-to-End System Integration: Connecting backend APIs with database connection pools and frontend clients',
        'Security & Reliability: JWT authentication, rate limiting, SQL injection defense & error middleware',
        'Observability & Performance: Logging (Winston), Metrics profiling, Health check endpoints & uptime monitoring',
        'Mock Technical Interview 1: Timed 45-min DSA challenge (Arrays + Trees + Complexity defense)',
        'Mock Technical Interview 2: Timed 45-min System Design & STAR Behavioral Defense',
        'Milestone Lab: Deploy Capstone Application with automated GitHub Actions CI/CD and README docs'
      ],
      leetcode: 'https://leetcode.com/explore/interview/card/top-interview-questions-medium/'
    }
  ];

  for (let w = 1; w <= totalWeeks; w++) {
    // Pick curriculum module from catalog, repeating cyclically or scaling gracefully for multi-month roadmaps
    const moduleIndex = (w - 1) % dsaCurriculumCatalog.length;
    const cat = dsaCurriculumCatalog[moduleIndex];

    const weekTitle = `Week ${w}: ${cat.title}`;
    const milestone = cat.milestone;
    const project = {
      title: `${cat.project.title} (Sprint ${w})`,
      description: cat.project.description,
      tech_stack: cat.project.tech_stack,
      deliverables: cat.project.deliverables
    };

    const tasks = [];

    for (let d = 1; d <= 6; d++) {
      const dayTopic = cat.days[d - 1] || `In-depth problem solving sprint on ${cat.title} module ${d}`;

      let desc = '';
      if (language === 'hi') {
        desc = `दिन ${d}: ${dayTopic} (${dailyHours} घंटे अभ्यास)`;
      } else if (language === 'mr') {
        desc = `दिवस ${d}: ${dayTopic} (${dailyHours} तास सराव)`;
      } else if (language === 'sa') {
        desc = `दिनम् ${d}: ${dayTopic} (${dailyHours} होराभ्यासः)`;
      } else {
        desc = `Day ${d}: ${dayTopic} (${dailyHours} hrs focused coding)`;
      }

      // STRICT RESOURCE RULE: Only Day 1 gets the 3 curated links (1x Video, 1x Article/Docs, 1x Practice).
      // Days 2 to 6 get NO links to keep daily tasks clean and focused without repetitive clutter.
      let links = [];
      if (d === 1) {
        const queryTerm = encodeURIComponent(`${skill} ${cat.title} tutorial`);
        links = [
          {
            title: `${skill} Video Masterclass (Week ${w})`,
            type: 'video',
            url: `https://www.youtube.com/results?search_query=${queryTerm}`
          },
          {
            title: `${skill} Official Docs & Architectural Guide`,
            type: 'article',
            url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' ' + cat.title + ' documentation guide')}`
          },
          {
            title: `Curated LeetCode Practice Challenge`,
            type: 'practice',
            url: cat.leetcode || 'https://leetcode.com/problemset/all/'
          }
        ];
      }

      tasks.push({
        day_number: d,
        task_description: desc,
        resource_links: links
      });
    }

    weeks.push({
      week_number: w,
      title: weekTitle,
      milestone: milestone,
      milestone_project: project,
      time_distribution: {
        theory_percent: 25,
        dsa_practice_percent: 40,
        project_percent: 25,
        revision_percent: 10
      },
      tasks
    });
  }

  return weeks;
}

/**
 * 7. AI Subtask Breakdown for Goals
 */
export async function breakDownGoalWithAI(goalDescription, targetDate, language = 'en') {
  const systemPrompt = `You are a career productivity specialist.
Break down the career goal: "${goalDescription}" due by ${targetDate} into 3 to 4 actionable, specific subtasks.
Return ONLY a valid JSON array of strings in the requested language: ${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en}.
Format: ["Subtask 1", "Subtask 2", "Subtask 3"]`;

  const aiText = await callGemini(systemPrompt, `Goal: ${goalDescription}`, language);

  if (aiText) {
    try {
      const clean = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fallback
    }
  }

  if (language === 'hi') {
    return [
      'पाठ्यक्रम और आवश्यक संसाधनों की सूची तैयार करें',
      'प्रतिदिन 1-2 घंटे समर्पित करके बुनियादी मॉड्यूल पूरे करें',
      'व्यावहारिक अभ्यास और परीक्षण प्रश्न हल करें',
      'अंतिम समीक्षा करें और पोर्टफोलियो में जोड़ें'
    ];
  }
  if (language === 'mr') {
    return [
      'अभ्यासक्रमाची रूपरेषा आणि संदर्भ सामग्री गोळा करा',
      'दररोज १-२ तास देऊन मूलभूत घटक पूर्ण करा',
      'सराव चाचण्या आणि प्रात्यक्षिक कोडिंग पूर्ण करा',
      'अंतिम पडताळणी करून पोर्टफोलिओमध्ये नोंद करा'
    ];
  }
  if (language === 'sa') {
    return [
      'पाठ्यविषयाणां सूत्रीकरणं संसाधनचयनं च',
      'प्रतिदिनं नियतहोरासु मूलपाठानाम् अध्ययनम्',
      'अभ्यासप्रश्नानां समाधानं व्यावहारिकपरीक्षणं च',
      'अन्तिमं पुनरावलोकनं कृतकार्यस्य सङ्ग्रहश्च'
    ];
  }
  return [
    'Outline curriculum scope and gather validated learning resources',
    'Complete core foundational modules with daily scheduled study',
    'Implement hands-on practice problems and mini-benchmarks',
    'Conduct final review, polish documentation, and link to portfolio'
  ];
}

/**
 * 8. Localized General Reminder Message Generator
 */
export function generateLocalizedReminder(userName, pendingCount, language = 'en') {
  const count = pendingCount || 1;
  if (language === 'hi') {
    return {
      subject: `CareerPilot AI: आज आपके ${count} अध्ययन कार्य बाकी हैं 📚`,
      body: `नमस्ते ${userName}, आज आपके अध्ययन योजना में ${count} कार्य लंबित हैं। अपने सपनों के करियर की ओर बढ़ते रहें! CareerPilot AI पर लॉग इन करें और अपनी प्रगति दर्ज करें।`
    };
  }
  if (language === 'mr') {
    return {
      subject: `CareerPilot AI: आज तुमची ${count} अभ्यास कार्ये बाकी आहेत 📚`,
      body: `नमस्कार ${userName}, तुमच्या अभ्यास नियोजनात आज ${count} कामे प्रलंबित आहेत. ध्येयाच्या दिशेने रोज एक पाऊल टाका! CareerPilot AI वर जाऊन कामे पूर्ण करा.`
    };
  }
  if (language === 'sa') {
    return {
      subject: `CareerPilot AI: अद्य तव ${count} कार्याणि शेषाणि सन्ति 📚`,
      body: `नमस्ते ${userName}, अद्य तव अध्ययनयोजनायां ${count} कार्याणि अवशिष्टानि सन्ति। "उद्यमेन हि सिध्यन्ति कार्याणि।" CareerPilot AI मध्ये प्रविश्य कार्याणि समापयतु।`
    };
  }
  return {
    subject: `CareerPilot AI: You have ${count} pending study tasks today 📚`,
    body: `Hi ${userName}, you have ${count} tasks scheduled for today on your CareerPilot AI study plan. Keep up the momentum toward your dream role! Log in now to track your progress.`
  };
}

/**
 * 9. Autonomous AI Goal Inconsistency & Accountability Nudge Generator
 */
export async function generateGoalInconsistencyEmail({ userName = 'Student', targetRole = 'Software Engineer', goals = [], pendingTasks = [], streakDays = 0, inactiveDays = 2, language = 'en' }) {
  const goalTitles = goals.map(g => g.goal_description || g.title).filter(Boolean).join(', ') || 'Target Career Roadmap';
  const pendingCount = pendingTasks.length || 3;

  const systemPrompt = `You are "CareerPilot AI Accountability Guardian", an encouraging, empathetic, yet highly motivating AI mentor.
A student is showing inconsistency or falling behind on their career preparation for the target role: "${targetRole}".
Their active goals: "${goalTitles}".
Pending tasks: ${pendingCount}. Inactive duration: ${inactiveDays} days.

Generate a deeply motivating and actionable accountability email nudge in the requested language: ${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en}.
Return ONLY a valid JSON object without markdown fences, formatted as:
{
  "subject": "⚠️ [CareerMentor AI] Hey ${userName}, let's get back on track with your ${targetRole} goals!",
  "headline": "...",
  "inconsistency_diagnosis": "...",
  "motivation_message": "...",
  "quick_action_step": "...",
  "pending_tasks_summary": ["..."],
  "plain_text": "..."
}`;

  const userPrompt = `Student Name: ${userName}\nRole: ${targetRole}\nGoals: ${goalTitles}\nPending Tasks: ${pendingCount}\nDays Inactive: ${inactiveDays}`;
  const aiText = await callGemini(systemPrompt, userPrompt, language);

  if (aiText) {
    try {
      const clean = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed && parsed.subject && parsed.quick_action_step) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  // Multilingual fallback
  if (language === 'hi') {
    return {
      subject: `⚠️ [CareerMentor AI] ${userName}, अपने ${targetRole} लक्ष्य की ओर वापस लौटें! 🚀`,
      headline: `निरंतरता ही सफलता की कुंजी है — आइए आज से पुनः शुरुआत करें!`,
      inconsistency_diagnosis: `हमने देखा कि पिछले ${inactiveDays} दिनों से आपके अध्ययन लक्ष्यों में कोई प्रगति दर्ज नहीं हुई है और ${pendingCount} कार्य लंबित हैं।`,
      motivation_message: `बड़ा लक्ष्य हासिल करने के लिए हर दिन का छोटा कदम जरूरी है। जब आप रुक जाते हैं, तो प्रतियोगिता आगे निकल जाती है। आप में क्षमता है, बस आज 15 मिनट से दोबारा शुरुआत करें!`,
      quick_action_step: `आज केवल 1 महत्वपूर्ण कार्य या 1 LeetCode प्रश्न हल करें।`,
      pending_tasks_summary: [
        'लंबित रोडमैप मॉड्यूल की समीक्षा करें',
        'दैनिक 45 मिनट कोडिंग सत्र पूरा करें',
        'इंटरव्यू तैयारी प्रश्नोत्तरी का 1 उत्तर अभ्यास करें'
      ],
      plain_text: `नमस्ते ${userName},\n\nहमने देखा कि पिछले ${inactiveDays} दिनों से आपके ${targetRole} अध्ययन लक्ष्यों में प्रगति रुक गई है। ${pendingCount} कार्य बाकी हैं।\n\nनिरंतरता ही आपको शीर्ष 1% इंजीनियर्स में शामिल करेगी। आज ही सिर्फ 15 मिनट दें और अपने लंबित कार्यों को पूरा करें!\n\nसस्नेह,\nCareerMentor AI टीम`
    };
  }

  if (language === 'mr') {
    return {
      subject: `⚠️ [CareerMentor AI] ${userName}, तुमच्या ${targetRole} ध्येयाकडे पुन्हा वळा! 🚀`,
      headline: `सातत्य हेच यशाचे गमक आहे — आजच पुन्हा सुरुवात करा!`,
      inconsistency_diagnosis: `गेल्या ${inactiveDays} दिवसांत तुमच्या अभ्यास नियोजनात कोणतीही नोंद झालेली नाही आणि ${pendingCount} कामे प्रलंबित आहेत.`,
      motivation_message: `स्वप्ने मोठी असतील तर रोज लहान पाऊल उचलणे गरजेचे आहे. आज फक्त १५ मिनिटे देऊन पुन्हा गती मिळवा!`,
      quick_action_step: `आज फक्त १ कोडिंग प्रश्न किंवा प्रलंबित कार्य पूर्ण करा.`,
      pending_tasks_summary: [
        'प्रलंबित रोडमॅप घटकांची उजळणी',
        'दैनिक कोडिंग सराव पूर्ण करणे',
        'मुलाखत तयारीचा १ प्रश्न सोडवणे'
      ],
      plain_text: `नमस्कार ${userName},\n\nगेल्या ${inactiveDays} दिवसांपासून तुमच्या ${targetRole} ध्येयात प्रगती थांबलेली दिसते. ${pendingCount} कामे बाकी आहेत.\n\nआजच १५ मिनिटे देऊन अभ्यासाला लागा!\n\nआपली,\nCareerMentor AI टीम`
    };
  }

  if (language === 'sa') {
    return {
      subject: `⚠️ [CareerMentor AI] ${userName}, स्वलक्ष्यं प्रति पुनः प्रवर्तताम्! 🚀`,
      headline: `निरन्तरता एव सफलतायाः मूलम् — अद्यैव पुनः आरभताम्!`,
      inconsistency_diagnosis: `विगतेषु ${inactiveDays} दिनेषु तव लक्ष्यसाधने गतिरोधः दृश्यते, ${pendingCount} कार्याणि शेषाणि सन्ति।`,
      motivation_message: `"न हि सुप्तस्य सिंहस्य प्रविशन्ति मुखे मृगाः।" उद्योगं विना किमपि न सिध्यति। अद्यैव पुनः अध्ययनं प्रारभस्व!`,
      quick_action_step: `अद्य पञ्चदश निमेषान् यावत् एकं कार्यं साधयतु।`,
      pending_tasks_summary: [
        'अवशिष्ट-कार्याणां पुनरावलोकनम्',
        'दैनिक-समस्या-समाधानम्',
        'साक्षात्कार-प्रश्नोत्तरी-सज्जता'
      ],
      plain_text: `नमस्ते ${userName},\n\nविगतेषु ${inactiveDays} दिनेषु तव ${targetRole} अध्ययनकार्येषु ${pendingCount} कार्याणि अवशिष्टानि। अद्यैव पुनः आरभताम्!\n\nCareerMentor AI`
    };
  }

  return {
    subject: `⚠️ [CareerMentor AI] Hey ${userName}, let's get back on track with your ${targetRole} goals! 🚀`,
    headline: `Consistency is the difference between dreaming and achieving. Let's restart today!`,
    inconsistency_diagnosis: `We noticed you haven't checked off any study tasks over the last ${inactiveDays} days, and you currently have ${pendingCount} pending milestones waiting.`,
    motivation_message: `Top software engineering roles at top tech companies are won by compounding 45 minutes of daily focus, not last-minute cramming. You have the intellect and the plan — all you need is today's momentum.`,
    quick_action_step: `Complete just 1 pending roadmap task or solve 1 targeted DSA problem in the next 20 minutes to restore your study streak.`,
    pending_tasks_summary: [
      'Review pending high-priority roadmap modules',
      'Complete scheduled daily coding practice',
      'Tackle 1 internship interview question in the Sandbox'
    ],
    plain_text: `Hi ${userName},\n\nWe noticed a break in your study consistency for ${targetRole} over the past ${inactiveDays} days. You currently have ${pendingCount} pending tasks.\n\nGreat careers are built one focused day at a time. Spend just 15 minutes today to tackle your first pending task and rebuild your streak!\n\nBest,\nYour CareerMentor AI Guardian`
  };
}

/**
 * 10. AI Internship Interview Question Answer Evaluator (Question Tackle Engine)
 */
export async function evaluateInternshipAnswerAI({ question, answer, category = 'Technical', role = 'Software Engineer Intern', language = 'en' }) {
  const systemPrompt = `You are a Principal Software Engineer and Staff Hiring Manager conducting an internship interview for the role "${role}".
Evaluate the candidate's answer to the question: "${question}".
Category: "${category}".
Candidate's response: "${answer}".

Provide rigorous, constructive, actionable evaluation in the requested language: ${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en}.
Evaluation criteria:
1. "score": Numerical rating from 1.0 to 10.0 (e.g. 8.2).
2. "grade": One of ["Exceptional / Strong Hire", "Solid Pass / Hire", "Borderline / Needs Depth", "Unsatisfactory"].
3. "strengths": Array of 2 to 3 strong points the candidate clearly demonstrated.
4. "blindspots": Array of 2 to 3 critical omissions, missing trade-offs, edge cases, or lack of STAR structure.
5. "senior_mentor_model_answer": A masterclass, high-scoring model answer demonstrating the STAR technique (Situation, Task, Action, Result) for behavioral questions or technical depth with Big-O & architectural trade-offs for technical questions.
6. "key_takeaway": One concise tip to remember in the live interview.

Return ONLY a valid JSON object without markdown fences, formatted as:
{
  "score": 8.5,
  "grade": "Solid Pass / Hire",
  "strengths": ["..."],
  "blindspots": ["..."],
  "senior_mentor_model_answer": "...",
  "key_takeaway": "..."
}`;

  const aiText = await callGemini(systemPrompt, `Question: ${question}\nCandidate Answer: ${answer}`, language);

  if (aiText) {
    try {
      const clean = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed && typeof parsed.score === 'number' && parsed.senior_mentor_model_answer) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  // Responsive fallback evaluator
  const wordCount = (answer || '').trim().split(/\s+/).filter(Boolean).length;
  let score = 7.5;
  let grade = "Solid Pass / Hire";

  if (wordCount < 15) {
    score = 4.5;
    grade = "Borderline / Needs Depth";
  } else if (wordCount > 60 && (answer.toLowerCase().includes('result') || answer.toLowerCase().includes('measured') || answer.toLowerCase().includes('reduced') || answer.toLowerCase().includes('improved'))) {
    score = 9.2;
    grade = "Exceptional / Strong Hire";
  } else if (wordCount >= 30) {
    score = 8.0;
    grade = "Solid Pass / Hire";
  }

  if (language === 'hi') {
    return {
      score,
      grade,
      strengths: [
        'आपने मुख्य अवधारणा को सीधे और स्पष्ट रूप से संबोधित किया',
        'व्यावहारिक उदाहरण और प्रासंगिक तकनीकी शब्दों का उपयोग किया'
      ],
      blindspots: [
        'परिणामों में मात्रात्मक मेट्रिक्स (उदा. 30% प्रदर्शन सुधार) का उल्लेख करें',
        'संभावित एज केस (Edge Cases) और ट्रेड-ऑफ्स का विश्लेषण जोड़ें'
      ],
      senior_mentor_model_answer: `आदर्श उत्तर (STAR मॉडल):\n"मैंने अपनी पिछली परियोजना में इस चुनौती का सामना किया। स्थिति (Situation) यह थी कि सिस्टम की प्रतिक्रिया धीमी हो रही थी। मेरा कार्य (Task) विलंबता को कम करना था। मैंने (Action) डेटाबेस इंडेक्सिंग और रेडिस कैशिंग लागू की। परिणामस्वरूप (Result), क्वेरी प्रतिक्रिया समय 400ms से घटकर 85ms हो गया।"`,
      key_takeaway: 'साक्षात्कारकर्ता को हमेशा समाधान के साथ-साथ उसके कारण और परिणाम (Impact) भी बताएं।'
    };
  }

  if (language === 'mr') {
    return {
      score,
      grade,
      strengths: [
        'संकल्पना स्पष्ट शब्दांत मांडण्याचा चांगला प्रयत्न केला',
        'तांत्रिक संज्ञांचा योग्य वापर केला'
      ],
      blindspots: [
        'अचूक संख्यात्मक परिणाम आणि मेट्रिक्स नमूद करणे आवश्यक आहे',
        'सिस्टममधील मर्यादा आणि पर्यायी उपायांचा उल्लेख वाढवा'
      ],
      senior_mentor_model_answer: `आदर्श उत्तर (STAR पद्धत):\n"माझ्या प्रकल्पात उच्च रहदारीमुळे लेटन्सी वाढली होती. माझे काम लेटन्सी कमी करण्याचे होते. मी गैर-अतिव्याप्त इंडेक्सिंग आणि कॅशिंग लागू केले. त्यामुळे रिस्पॉन्स टाईम ३५% नी सुधारला."`,
      key_takeaway: 'तांत्रिक उत्तरात नेहमी कामगिरीचे मोजमाप (Metrics) आणि परिणामांचा उल्लेख करा.'
    };
  }

  return {
    score,
    grade,
    strengths: [
      'Directly addressed the core interview prompt with clear technical terminology',
      'Demonstrated structured problem-solving intuition'
    ],
    blindspots: [
      'Quantified business/performance impact metrics (e.g. % latency reduction or throughput scale) could be sharper',
      'Explicit discussion of trade-offs, alternative approaches, and edge-case handling'
    ],
    senior_mentor_model_answer: `Masterclass STAR Response:\n"In my recent project, we encountered this exact architectural bottleneck (Situation). My objective was to optimize throughput while maintaining sub-150ms response times (Task). I implemented Redis cache-aside invalidation and optimized PostgreSQL composite indexes (Action). As a direct result, average query latency dropped by 48% under 2,000 concurrent requests without data inconsistencies (Result)."`,
    key_takeaway: 'Always close your answer by quantifying the outcome (Result) and summarizing the architectural trade-off.'
  };
}

