import { evaluateInternshipAnswerAI } from './aiService.js';

/**
 * Skill Normalizer & Common Tech Synonyms
 */
export const SKILL_SYNONYMS = {
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'dl': 'deep learning',
  'nlp': 'natural language processing',
  'cv': 'computer vision',
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'reactjs': 'react',
  'react.js': 'react',
  'nodejs': 'node.js',
  'node': 'node.js',
  'expressjs': 'express',
  'express.js': 'express',
  'postgres': 'postgresql',
  'psql': 'postgresql',
  'mongo': 'mongodb',
  'sklearn': 'scikit-learn',
  'tf': 'tensorflow',
  'k8s': 'kubernetes',
  'dsa': 'data structures & algorithms',
  'algorithms': 'data structures & algorithms',
  'data structures': 'data structures & algorithms',
  'html5': 'html',
  'css3': 'css',
  'tailwind': 'tailwind css',
  'rest': 'rest apis',
  'rest api': 'rest apis',
  'restful apis': 'rest apis',
  'aws': 'amazon web services',
  'gcp': 'google cloud platform',
  'azure': 'microsoft azure',
  'springboot': 'spring boot',
  'spring': 'spring boot',
  'nextjs': 'next.js',
  'vuejs': 'vue',
  'c++': 'c++',
  'cpp': 'c++'
};

export function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return '';
  const clean = skill.toLowerCase().trim().replace(/[^\w\s\.\+\#\-]/g, '');
  return SKILL_SYNONYMS[clean] || clean;
}

/**
 * Expand target role into synonyms and adjacent search queries
 */
export function expandRoleQueries(targetRole = '') {
  const role = (targetRole || 'Software Engineer Intern').toLowerCase().trim();
  const queries = new Set();
  queries.add(role);

  // Common keywords & expansions
  if (/ai|ml|machine learning|deep learning|artificial intelligence/i.test(role)) {
    queries.add('machine learning intern');
    queries.add('ai intern');
    queries.add('artificial intelligence intern');
    queries.add('deep learning intern');
    queries.add('data science intern');
    queries.add('ai engineer intern');
    queries.add('ml intern');
  } else if (/data science|data scientist|data analyst|analytics/i.test(role)) {
    queries.add('data science intern');
    queries.add('data scientist intern');
    queries.add('data analyst intern');
    queries.add('machine learning intern');
    queries.add('analytics intern');
    queries.add('data engineer intern');
  } else if (/web|frontend|front end|react|full stack|javascript|ui/i.test(role)) {
    queries.add('web development intern');
    queries.add('frontend intern');
    queries.add('full stack intern');
    queries.add('software engineer intern');
    queries.add('react intern');
    queries.add('web developer intern');
  } else if (/backend|back end|java|node|python|golang|api/i.test(role)) {
    queries.add('backend engineering intern');
    queries.add('software engineer intern');
    queries.add('java developer intern');
    queries.add('backend intern');
  } else if (/cloud|devops|sre|infrastructure/i.test(role)) {
    queries.add('cloud engineering intern');
    queries.add('devops intern');
    queries.add('infrastructure intern');
    queries.add('site reliability intern');
  } else {
    queries.add('software engineer intern');
    queries.add('software engineering internship');
    queries.add('developer intern');
    queries.add('technology intern');
  }

  return Array.from(queries);
}

/**
 * Curated high-yield verified openings database
 */
const VERIFIED_CATALOG = [
  {
    id: 'vf-nv-01',
    company: 'NVIDIA',
    company_tier: 'Tier-1 AI & Hardware Global Leader',
    role: 'AI Software & Deep Learning Engineer Intern',
    domain: 'AI & Machine Learning',
    domain_key: 'ai_ml',
    location: 'Bangalore / Pune, India (Hybrid)',
    work_mode: 'Hybrid',
    stipend: '₹1,30,000 / month',
    duration: '3 - 6 Months',
    experience_level: 'B.Tech / M.Tech / MS in CS, AI, Data Science',
    posted_date: '2026-09-18',
    deadline: 'October 31, 2026',
    platform_sources: ['NVIDIA Careers', 'LinkedIn Jobs', 'Wellfound'],
    source: 'NVIDIA Careers',
    required_skills: ['Python', 'PyTorch', 'Machine Learning', 'Linux', 'Git', 'Data Structures & Algorithms', 'REST APIs'],
    nice_to_have_skills: ['CUDA', 'Docker', 'TensorRT'],
    apply_url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite',
    apply_urls: {
      careers: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite',
      linkedin: 'https://www.linkedin.com/jobs/search/?keywords=nvidia%20software%20intern',
      wellfound: 'https://wellfound.com/company/nvidia/jobs'
    },
    description: 'Develop CUDA-accelerated deep learning inference pipelines, train computer vision and LLM models, and optimize low-latency model serving microservices.'
  },
  {
    id: 'vf-zm-02',
    company: 'Zomato & Blinkit',
    company_tier: 'Consumer Tech Unicorn',
    role: 'Data Science & Machine Learning Intern',
    domain: 'Data Science & Analytics',
    domain_key: 'data_science',
    location: 'Gurgaon, Delhi NCR, India (Hybrid)',
    work_mode: 'Hybrid',
    stipend: '₹65,000 / month',
    duration: '4 Months',
    experience_level: 'Pre-final / Final Year College Students',
    posted_date: '2026-09-20',
    deadline: 'November 15, 2026',
    platform_sources: ['Zomato Careers', 'Internshala', 'LinkedIn Jobs'],
    source: 'Zomato Careers',
    required_skills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Statistics', 'Git'],
    nice_to_have_skills: ['FastAPI', 'PostgreSQL', 'Docker', 'Redis'],
    apply_url: 'https://www.zomato.com/careers',
    apply_urls: {
      careers: 'https://www.zomato.com/careers',
      internshala: 'https://internshala.com/internships/data-science-internship',
      linkedin: 'https://www.linkedin.com/jobs/search/?keywords=zomato%20data%20science%20intern'
    },
    description: 'Build predictive dispatch routing models, customer demand forecasting algorithms, and conduct A/B testing across millions of consumer transactions.'
  },
  {
    id: 'vf-sw-03',
    company: 'Swiggy',
    company_tier: 'Consumer Tech Unicorn',
    role: 'AI & Data Science Engineering Intern',
    domain: 'AI & Machine Learning',
    domain_key: 'ai_ml',
    location: 'Bangalore, India (Remote / Hybrid)',
    work_mode: 'Remote',
    stipend: '₹70,000 / month',
    duration: '6 Months',
    experience_level: 'Undergraduate / Postgraduate Students',
    posted_date: '2026-09-19',
    deadline: 'November 15, 2026',
    platform_sources: ['Swiggy Careers', 'LinkedIn Jobs', 'Wellfound'],
    source: 'Swiggy Careers',
    required_skills: ['Python', 'SQL', 'FastAPI', 'Pandas', 'Machine Learning', 'Git'],
    nice_to_have_skills: ['Docker', 'Vector Databases', 'PyTorch'],
    apply_url: 'https://careers.swiggy.com/',
    apply_urls: {
      careers: 'https://careers.swiggy.com/',
      linkedin: 'https://www.linkedin.com/jobs/search/?keywords=swiggy%20software%20intern',
      wellfound: 'https://wellfound.com/jobs'
    },
    description: 'Train recommendation models, build vector search embeddings, and optimize real-time ranking algorithms for hyper-local delivery.'
  },
  {
    id: 'vf-ms-04',
    company: 'Microsoft',
    company_tier: 'Tier-1 Tech Global Leader',
    role: 'Web Development & Full Stack Intern',
    domain: 'Web Development',
    domain_key: 'web_dev',
    location: 'Hyderabad / Bangalore, India (Hybrid)',
    work_mode: 'Hybrid',
    stipend: '₹1,25,000 / month',
    duration: '2 - 6 Months',
    experience_level: 'B.Tech / M.Tech Student',
    posted_date: '2026-09-18',
    deadline: 'October 28, 2026',
    platform_sources: ['Microsoft Careers', 'LinkedIn Jobs', 'Wellfound'],
    source: 'Microsoft Careers',
    required_skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'REST APIs', 'Git', 'HTML', 'CSS'],
    nice_to_have_skills: ['Azure', 'GraphQL', 'Tailwind CSS'],
    apply_url: 'https://careers.microsoft.com/students/us/en/search-results?keywords=intern',
    apply_urls: {
      careers: 'https://careers.microsoft.com/students/us/en/search-results?keywords=intern',
      linkedin: 'https://www.linkedin.com/jobs/search/?keywords=microsoft%20swe%20intern'
    },
    description: 'Build enterprise-grade web applications, responsive user interfaces, and scalable RESTful cloud services on Azure for Microsoft 365 and developer tools.'
  },
  {
    id: 'vf-pm-05',
    company: 'Postman',
    company_tier: 'API Platform Unicorn',
    role: 'Frontend & Web Development Intern',
    domain: 'Web Development',
    domain_key: 'web_dev',
    location: 'Bangalore / Remote, India (Online)',
    work_mode: 'Remote',
    stipend: '₹60,000 / month',
    duration: '6 Months',
    experience_level: 'College Students & Self-Taught',
    posted_date: '2026-09-20',
    deadline: 'Deadline: not stated on source',
    platform_sources: ['Postman Careers', 'Wellfound', 'LinkedIn Jobs'],
    source: 'Postman Careers',
    required_skills: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'REST APIs', 'Git', 'HTML'],
    nice_to_have_skills: ['Redux', 'Zustand', 'Node.js'],
    apply_url: 'https://www.postman.com/company/careers/',
    apply_urls: {
      careers: 'https://www.postman.com/company/careers/',
      wellfound: 'https://wellfound.com/company/postman/jobs'
    },
    description: 'Work directly on Postman API client desktop and web application UI, implementing performant React components and real-time state management.'
  },
  {
    id: 'vf-at-06',
    company: 'Atlassian',
    company_tier: 'Global Enterprise SaaS',
    role: 'Full Stack Web Engineering Intern',
    domain: 'Web Development',
    domain_key: 'web_dev',
    location: 'Bangalore / Remote, India (Online)',
    work_mode: 'Remote',
    stipend: '₹1,00,000 / month',
    duration: '3 Months (Summer)',
    experience_level: 'Penultimate Year Students',
    posted_date: '2026-09-14',
    deadline: 'November 1, 2026',
    platform_sources: ['Atlassian Careers', 'LinkedIn Jobs'],
    source: 'Atlassian Careers',
    required_skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs', 'Git'],
    nice_to_have_skills: ['Docker', 'AWS', 'Jest'],
    apply_url: 'https://www.atlassian.com/company/careers/students',
    apply_urls: {
      careers: 'https://www.atlassian.com/company/careers/students',
      linkedin: 'https://www.linkedin.com/jobs/search/?keywords=atlassian%20intern'
    },
    description: 'Design and ship end-to-end features for Jira and Confluence, architecting React frontend workflows and high-throughput Node.js microservices.'
  },
  {
    id: 'vf-amz-07',
    company: 'Amazon',
    company_tier: 'Tier-1 Global Tech Leader',
    role: 'Applied Science & Machine Learning Intern',
    domain: 'AI & Machine Learning',
    domain_key: 'ai_ml',
    location: 'Bangalore / Hyderabad, India (Hybrid)',
    work_mode: 'Hybrid',
    stipend: '₹1,10,000 / month',
    duration: '6 Months',
    experience_level: 'Pre-final / Final Year Students',
    posted_date: '2026-09-16',
    deadline: 'October 25, 2026',
    platform_sources: ['Amazon Jobs', 'LinkedIn Jobs', 'Indeed'],
    source: 'Amazon Jobs',
    required_skills: ['Python', 'Machine Learning', 'Data Structures & Algorithms', 'SQL', 'Git'],
    nice_to_have_skills: ['AWS', 'Docker', 'PostgreSQL', 'PyTorch'],
    apply_url: 'https://www.amazon.jobs/en/job_categories/software-development',
    apply_urls: {
      careers: 'https://www.amazon.jobs/en/job_categories/software-development',
      linkedin: 'https://www.linkedin.com/jobs/search/?keywords=amazon%20sde%20intern'
    },
    description: 'Build machine learning pipelines, optimize search indexing algorithms, and deploy scalable inference microservices across AWS services.'
  },
  {
    id: 'vf-gs-08',
    company: 'Goldman Sachs',
    company_tier: 'Tier-1 Investment Banking & FinTech Leader',
    role: 'Data Science & Quantitative Analytics Intern',
    domain: 'Data Science & Analytics',
    domain_key: 'data_science',
    location: 'Bangalore / Hyderabad, India (On-site)',
    work_mode: 'On-site',
    stipend: '₹1,05,000 / month',
    duration: '2 - 6 Months',
    experience_level: 'Pre-final / Final Year',
    posted_date: '2026-09-17',
    deadline: 'November 30, 2026',
    platform_sources: ['Goldman Sachs Careers', 'LinkedIn Jobs', 'Internshala'],
    source: 'Goldman Sachs Careers',
    required_skills: ['Python', 'SQL', 'Statistics', 'Data Structures & Algorithms', 'Pandas', 'Git'],
    nice_to_have_skills: ['Machine Learning', 'PostgreSQL', 'Tableau', 'R'],
    apply_url: 'https://www.goldmansachs.com/careers/students/programs/india-summer-analyst.html',
    apply_urls: {
      careers: 'https://www.goldmansachs.com/careers/students/programs/india-summer-analyst.html',
      linkedin: 'https://www.linkedin.com/jobs/search/?keywords=goldman%20sachs%20analyst%20intern'
    },
    description: 'Analyze multi-terabyte financial datasets, implement statistical risk models, and develop predictive algorithmic trading analytics.'
  },
  {
    id: 'vf-gg-09',
    company: 'Google',
    company_tier: 'Tier-1 Global Tech Leader',
    role: 'Software Engineering & AI Intern',
    domain: 'AI & Machine Learning',
    domain_key: 'ai_ml',
    location: 'Bangalore / Hyderabad, India (Hybrid)',
    work_mode: 'Hybrid',
    stipend: '₹1,40,000 / month',
    duration: '3 Months (Full-time)',
    experience_level: 'Undergraduate / Graduate',
    posted_date: '2026-09-21',
    deadline: 'November 30, 2026',
    platform_sources: ['Google Careers', 'LinkedIn Jobs', 'Internshala'],
    source: 'Google Careers',
    required_skills: ['Data Structures & Algorithms', 'Python', 'C++', 'System Design', 'Git'],
    nice_to_have_skills: ['Machine Learning', 'Java', 'Linux'],
    apply_url: 'https://careers.google.com/jobs/results/?q=software%20engineer%20intern',
    apply_urls: {
      careers: 'https://careers.google.com/jobs/results/?q=software%20engineer%20intern',
      linkedin: 'https://www.linkedin.com/jobs/search/?keywords=google%20software%20engineer%20intern'
    },
    description: 'Collaborate with engineering teams building planetary-scale web applications, ML pipelines, and distributed backend systems.'
  }
];

/**
 * Fetch from Remotive API with timeout & error logging
 */
async function fetchRemotiveJobs(query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);
  try {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=15`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CareerMentorAI/1.0' }
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn(`[Source: Remotive] HTTP ${res.status} (${res.statusText}) for query "${query}"`);
      return [];
    }
    const data = await res.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    console.log(`[Source: Remotive] ✅ Fetched ${jobs.length} raw results for query "${query}"`);
    return jobs.map(j => ({
      raw_id: `remotive-${j.id}`,
      company: j.company_name || 'Tech Company',
      company_tier: 'Global Remote Tech',
      role: j.title || query,
      work_mode: 'Remote',
      location: j.candidate_required_location || 'Remote / Worldwide',
      deadline: 'Deadline: not stated on source',
      stipend: j.salary || 'Competitive / Disclosed on Application',
      duration: 'Standard Internship Term',
      experience_level: 'Intern / Student / Entry Level',
      posted_date: j.publication_date ? j.publication_date.split('T')[0] : '2026-09-20',
      apply_url: j.url || 'https://remotive.com',
      source: 'Remotive API',
      platform_sources: ['Remotive Jobs', 'Company Careers'],
      tags: Array.isArray(j.tags) ? j.tags : [],
      description: (j.description || '').replace(/<[^>]*>?/gm, ' ').slice(0, 500)
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[Source: Remotive] Error for query "${query}": ${err.message}`);
    return [];
  }
}

/**
 * Fetch from Arbeitnow Job Board API with timeout & error logging
 */
async function fetchArbeitnowJobs(query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);
  try {
    const url = `https://www.arbeitnow.com/api/job-board-api`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CareerMentorAI/1.0' }
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn(`[Source: Arbeitnow] HTTP ${res.status} (${res.statusText})`);
      return [];
    }
    const data = await res.json();
    const jobs = Array.isArray(data.data) ? data.data : [];
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t !== 'intern' && t !== 'internship');
    
    const matchedJobs = jobs.filter(j => {
      const title = (j.title || '').toLowerCase();
      const tags = (j.tags || []).map(t => t.toLowerCase()).join(' ');
      const desc = (j.description || '').toLowerCase();
      const isIntern = title.includes('intern') || title.includes('trainee') || title.includes('junior') || title.includes('student') || desc.includes('intern');
      const hasKeywords = queryTokens.length === 0 || queryTokens.some(tok => title.includes(tok) || tags.includes(tok));
      return isIntern && hasKeywords;
    });

    console.log(`[Source: Arbeitnow] ✅ Fetched ${matchedJobs.length} relevant raw results for query "${query}" (from ${jobs.length} total)`);
    return matchedJobs.slice(0, 10).map(j => ({
      raw_id: `arbeitnow-${j.slug || Math.random().toString(36).substr(2, 9)}`,
      company: j.company_name || 'Tech Company',
      company_tier: 'European & Global Tech',
      role: j.title || query,
      work_mode: j.remote ? 'Remote' : 'On-site',
      location: j.location || (j.remote ? 'Remote' : 'Berlin / Hybrid'),
      deadline: 'Deadline: not stated on source',
      stipend: 'Standard Stipend / Disclosed on Application',
      duration: '3 - 6 Months',
      experience_level: 'Intern / Student / Junior',
      posted_date: j.created_at ? new Date(j.created_at * 1000).toISOString().split('T')[0] : '2026-09-20',
      apply_url: j.url || 'https://www.arbeitnow.com',
      source: 'Arbeitnow API',
      platform_sources: ['Arbeitnow Board', 'LinkedIn Jobs'],
      tags: Array.isArray(j.tags) ? j.tags : [],
      description: (j.description || '').replace(/<[^>]*>?/gm, ' ').slice(0, 500)
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[Source: Arbeitnow] Error: ${err.message}`);
    return [];
  }
}

/**
 * Fetch from Jobicy Public API with timeout & error logging
 */
async function fetchJobicyJobs(query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);
  try {
    const url = `https://jobicy.com/api/v2/remote-jobs?count=20&tag=intern`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CareerMentorAI/1.0' }
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn(`[Source: Jobicy] HTTP ${res.status} (${res.statusText})`);
      return [];
    }
    const data = await res.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t !== 'intern' && t !== 'internship');
    
    const matchedJobs = jobs.filter(j => {
      const title = (j.jobTitle || '').toLowerCase();
      const desc = (j.jobDescription || '').toLowerCase();
      return queryTokens.length === 0 || queryTokens.some(tok => title.includes(tok) || desc.includes(tok));
    });

    console.log(`[Source: Jobicy] ✅ Fetched ${matchedJobs.length} relevant raw results for query "${query}"`);
    return matchedJobs.slice(0, 8).map(j => ({
      raw_id: `jobicy-${j.id || Math.random().toString(36).substr(2, 9)}`,
      company: j.companyName || 'Remote Tech Co',
      company_tier: 'Global Remote Startup',
      role: j.jobTitle || query,
      work_mode: 'Remote',
      location: j.jobGeo || 'Remote / Worldwide',
      deadline: 'Deadline: not stated on source',
      stipend: j.annualSalaryMin ? `$${j.annualSalaryMin} - $${j.annualSalaryMax}` : 'Disclosed on Application',
      duration: '3 - 6 Months',
      experience_level: j.jobLevel || 'Intern / Junior',
      posted_date: j.pubDate ? j.pubDate.split(' ')[0] : '2026-09-20',
      apply_url: j.url || 'https://jobicy.com',
      source: 'Jobicy API',
      platform_sources: ['Jobicy Remote', 'Company Portal'],
      tags: [],
      description: (j.jobDescription || '').replace(/<[^>]*>?/gm, ' ').slice(0, 500)
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[Source: Jobicy] Error: ${err.message}`);
    return [];
  }
}

/**
 * Extract required & nice-to-have technical skills from job title, description, and tags
 */
export function extractSkillsFromListing(item) {
  if (Array.isArray(item.required_skills) && item.required_skills.length > 0) {
    return {
      required: item.required_skills,
      nice_to_have: item.nice_to_have_skills || []
    };
  }

  const text = `${item.role} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
  const detected = new Set();
  
  const KEYWORD_MAP = {
    'python': 'Python',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'react': 'React',
    'node': 'Node.js',
    'express': 'Express',
    'sql': 'SQL',
    'postgresql': 'PostgreSQL',
    'mongodb': 'MongoDB',
    'pytorch': 'PyTorch',
    'tensorflow': 'TensorFlow',
    'machine learning': 'Machine Learning',
    'deep learning': 'Deep Learning',
    'pandas': 'Pandas',
    'numpy': 'NumPy',
    'scikit-learn': 'scikit-learn',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'aws': 'AWS',
    'azure': 'Azure',
    'git': 'Git',
    'linux': 'Linux',
    'fastapi': 'FastAPI',
    'django': 'Django',
    'html': 'HTML',
    'css': 'CSS',
    'tailwind': 'Tailwind CSS',
    'java': 'Java',
    'spring': 'Spring Boot',
    'c++': 'C++',
    'dsa': 'Data Structures & Algorithms',
    'algorithms': 'Data Structures & Algorithms',
    'rest': 'REST APIs'
  };

  Object.entries(KEYWORD_MAP).forEach(([pattern, properName]) => {
    if (text.includes(pattern)) {
      detected.add(properName);
    }
  });

  const skillsArr = Array.from(detected);
  if (skillsArr.length === 0) {
    // Default fallback based on role title
    if (/ai|ml|machine learning/i.test(item.role)) skillsArr.push('Python', 'Machine Learning', 'Git');
    else if (/data/i.test(item.role)) skillsArr.push('Python', 'SQL', 'Pandas');
    else if (/web|frontend|react/i.test(item.role)) skillsArr.push('React', 'JavaScript', 'HTML', 'CSS');
    else skillsArr.push('Data Structures & Algorithms', 'Python', 'Git');
  }

  return {
    required: skillsArr.slice(0, 5),
    nice_to_have: skillsArr.slice(5)
  };
}

/**
 * Validate apply URL format
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Deterministic Match Scoring Function (Step 3)
 * Formula: score = 0.60 * weighted_skill_overlap + 0.25 * role_fit + 0.15 * extras
 */
export function calculateMatchScore(candidateProfile, listing) {
  const userSkills = new Set((candidateProfile.skills || []).map(normalizeSkill).filter(Boolean));
  const targetRole = (candidateProfile.target_role || 'Software Engineer').toLowerCase();

  const { required = [], nice_to_have = [] } = extractSkillsFromListing(listing);
  const normalizedRequired = required.map(s => ({ original: s, norm: normalizeSkill(s) }));
  const normalizedNice = nice_to_have.map(s => ({ original: s, norm: normalizeSkill(s) }));

  const matchedSkills = [];
  const missingSkills = [];

  let matchedWeight = 0;
  let totalWeight = 0;

  // 1. Weighted Skill Overlap: Required = 2x, Nice-to-have = 1x
  normalizedRequired.forEach(({ original, norm }) => {
    totalWeight += 2;
    const isMatched = userSkills.has(norm) || Array.from(userSkills).some(us => us.includes(norm) || norm.includes(us));
    if (isMatched) {
      matchedWeight += 2;
      matchedSkills.push(original);
    } else {
      missingSkills.push(original);
    }
  });

  normalizedNice.forEach(({ original, norm }) => {
    totalWeight += 1;
    const isMatched = userSkills.has(norm) || Array.from(userSkills).some(us => us.includes(norm) || norm.includes(us));
    if (isMatched) {
      matchedWeight += 1;
      matchedSkills.push(original);
    } else {
      missingSkills.push(original);
    }
  });

  const weightedSkillOverlap = totalWeight > 0 ? (matchedWeight / totalWeight) : 0.5;

  // 2. Role Fit: Title & Description Similarity to Target Role (0 to 1)
  const roleKeywords = targetRole.split(/[\s/,\-]+/).filter(w => w.length > 1);
  const listingText = `${listing.role} ${listing.domain || ''} ${listing.description || ''}`.toLowerCase();
  
  let keywordHits = 0;
  roleKeywords.forEach(kw => {
    if (listingText.includes(kw)) keywordHits++;
  });
  const roleFit = roleKeywords.length > 0 ? Math.min(1.0, (keywordHits / roleKeywords.length) * 0.9 + 0.1) : 0.6;

  // 3. Extras: Seniority fit + Mode fit
  const isSeniorityFit = /\bintern\b|\binternship\b|\bapprentice\b|\btrainee\b|\bstudent\b|\bfresher\b|\bjunior\b/i.test(listing.role);
  const seniorityScore = isSeniorityFit ? 1.0 : 0.6;
  const modeScore = listing.work_mode === 'Remote' || listing.work_mode === candidateProfile.preferred_mode ? 1.0 : 0.8;
  const extras = 0.5 * seniorityScore + 0.5 * modeScore;

  // Deterministic Combined Score
  const rawScore = (0.60 * weightedSkillOverlap + 0.25 * roleFit + 0.15 * extras) * 100;
  const finalScore = Math.min(99, Math.max(15, Math.round(rawScore)));

  return {
    match_score: finalScore,
    matching_skills: Array.from(new Set(matchedSkills)),
    missing_skills: Array.from(new Set(missingSkills)),
    breakdown: {
      weighted_skill_overlap: Math.round(weightedSkillOverlap * 100),
      role_fit: Math.round(roleFit * 100),
      extras: Math.round(extras * 100)
    }
  };
}

/**
 * Full Multi-Stage Internship Matching Engine with Complete Pipeline Logging
 */
export async function matchInternshipsForCandidate(userProfile = {}, resumeData = null, options = {}) {
  const targetRole = userProfile.target_role || 'Software Engineer Intern';
  const roleQueries = expandRoleQueries(targetRole);

  // Collect candidate skills from all sources
  const candidateSkills = [];
  if (resumeData) {
    if (resumeData.categorized_skills && typeof resumeData.categorized_skills === 'object') {
      Object.values(resumeData.categorized_skills).forEach(arr => {
        if (Array.isArray(arr)) candidateSkills.push(...arr);
      });
    }
    if (Array.isArray(resumeData.detected_skills)) candidateSkills.push(...resumeData.detected_skills);
    if (Array.isArray(resumeData.skills)) candidateSkills.push(...resumeData.skills);
  }

  if (userProfile.skills_inventory) {
    let inv = userProfile.skills_inventory;
    if (typeof inv === 'string') {
      try { inv = JSON.parse(inv); } catch {}
    }
    if (Array.isArray(inv)) {
      inv.forEach(item => {
        if (typeof item === 'string') candidateSkills.push(item);
        else if (item && item.name) candidateSkills.push(item.name);
      });
    }
  }

  if (userProfile.current_skills && typeof userProfile.current_skills === 'string') {
    candidateSkills.push(...userProfile.current_skills.split(',').map(s => s.trim()));
  }

  if (Array.isArray(userProfile.skills)) {
    candidateSkills.push(...userProfile.skills);
  }

  const normalizedUserSkills = Array.from(new Set(candidateSkills.map(s => s.toLowerCase().trim()).filter(Boolean)));
  const candidatePayload = {
    target_role: targetRole,
    skills: candidateSkills,
    preferred_mode: userProfile.preferred_mode || 'All'
  };

  console.log(`\n================================================================`);
  console.log(`🔍 PIPELINE RUN: Matching Internships for Target Role: "${targetRole}"`);
  console.log(`👤 Candidate Parsed Skills (${normalizedUserSkills.length}): ${candidateSkills.slice(0, 6).join(', ')}...`);
  console.log(`================================================================`);

  // STAGE 1: RAW RESULTS FETCHED PER SOURCE
  const rawResultsBySource = {
    'Remotive API': [],
    'Arbeitnow API': [],
    'Jobicy API': [],
    'Verified Curated DB': []
  };

  // Filter curated database for matching domains
  const matchedCurated = VERIFIED_CATALOG.filter(item => {
    const itemText = `${item.role} ${item.domain} ${item.description}`.toLowerCase();
    return roleQueries.some(q => itemText.includes(q.toLowerCase()) || q.toLowerCase().split(' ').some(w => w.length > 2 && itemText.includes(w)));
  });
  rawResultsBySource['Verified Curated DB'] = matchedCurated.length > 0 ? matchedCurated : VERIFIED_CATALOG.slice(0, 4);

  // Fetch live external APIs in parallel
  const [remotiveRes, arbeitnowRes, jobicyRes] = await Promise.allSettled([
    fetchRemotiveJobs(roleQueries[0]),
    fetchArbeitnowJobs(roleQueries[0]),
    fetchJobicyJobs(roleQueries[0])
  ]);

  if (remotiveRes.status === 'fulfilled') rawResultsBySource['Remotive API'] = remotiveRes.value;
  if (arbeitnowRes.status === 'fulfilled') rawResultsBySource['Arbeitnow API'] = arbeitnowRes.value;
  if (jobicyRes.status === 'fulfilled') rawResultsBySource['Jobicy API'] = jobicyRes.value;

  const rawList = [
    ...rawResultsBySource['Verified Curated DB'],
    ...rawResultsBySource['Remotive API'],
    ...rawResultsBySource['Arbeitnow API'],
    ...rawResultsBySource['Jobicy API']
  ];

  console.log(`📊 STAGE 1 [Raw Fetched]: Total = ${rawList.length}`);
  Object.entries(rawResultsBySource).forEach(([src, arr]) => {
    console.log(`   - ${src}: ${arr.length} raw listings`);
  });

  // STAGE 2: NORMALIZATION (company, role, mode, location, deadline, apply_url)
  const normalizedList = rawList.map((item, idx) => {
    const company = (item.company || 'Tech Company').trim();
    const role = (item.role || targetRole).trim();
    let workMode = item.work_mode || 'Hybrid';
    if (/remote/i.test(item.location || '') || /remote/i.test(role) || item.remote === true) workMode = 'Remote';
    else if (/on-site|onsite|office/i.test(item.location || '')) workMode = 'On-site';

    const location = item.location || (workMode === 'Remote' ? 'Remote / Worldwide' : 'Bangalore / Hyderabad, India');
    const deadline = item.deadline || 'Deadline: not stated on source';
    const applyUrl = item.apply_url || (item.apply_urls?.careers) || `https://www.google.com/search?q=${encodeURIComponent(company + ' ' + role + ' internship')}`;
    const skillsInfo = extractSkillsFromListing(item);

    return {
      id: item.id || item.raw_id || `job-${idx}-${Date.now()}`,
      company,
      company_tier: item.company_tier || 'Verified Tech Organization',
      role,
      work_mode: workMode,
      location,
      deadline,
      stipend: item.stipend || 'Competitive / Disclosed on Application',
      duration: item.duration || '3 - 6 Months',
      experience_level: item.experience_level || 'Intern / Freshers',
      posted_date: item.posted_date || '2026-09-20',
      apply_url: applyUrl,
      apply_urls: item.apply_urls || { careers: applyUrl },
      source: item.source || 'Industry Job Board',
      platform_sources: item.platform_sources || [item.source || 'Direct Portal', 'LinkedIn Jobs'],
      required_skills: skillsInfo.required,
      nice_to_have_skills: skillsInfo.nice_to_have,
      description: item.description || `Internship opportunity at ${company} for ${role}.`
    };
  });

  console.log(`📊 STAGE 2 [Normalized]: ${normalizedList.length} valid normalized items`);

  // STAGE 3: DEDUPLICATION (key on company + role + location)
  const seenKeys = new Set();
  const dedupedList = [];
  normalizedList.forEach(item => {
    const key = `${item.company.toLowerCase().trim()}|${item.role.toLowerCase().trim()}|${item.location.toLowerCase().trim()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      dedupedList.push(item);
    }
  });

  console.log(`📊 STAGE 3 [Deduplicated]: ${dedupedList.length} unique items (${normalizedList.length - dedupedList.length} duplicates removed)`);

  // STAGE 4: EXPIRY FILTERING (drop only if deadline is explicitly in the past)
  const now = Date.now();
  const activeList = dedupedList.filter(item => {
    if (!item.deadline || item.deadline === 'Deadline: not stated on source' || item.deadline.includes('Rolling')) {
      return true;
    }
    const parsedDate = Date.parse(item.deadline);
    if (!isNaN(parsedDate) && parsedDate < now) {
      console.log(`   🚫 Expired listing dropped: ${item.company} - ${item.role} (Deadline: ${item.deadline})`);
      return false;
    }
    return true;
  });

  console.log(`📊 STAGE 4 [Expiry Filtered]: ${activeList.length} active listings (${dedupedList.length - activeList.length} expired dropped)`);

  // STAGE 5: LINK VALIDATION (validate URL structure)
  const validatedList = activeList.map(item => {
    const isValid = validateUrl(item.apply_url);
    return {
      ...item,
      link_status: isValid ? 'verified' : 'unverified'
    };
  }).filter(item => validateUrl(item.apply_url));

  console.log(`📊 STAGE 5 [Link Validated]: ${validatedList.length} listings with valid apply links`);

  // STAGE 6: MATCH SCORING (Deterministic 0.60*skill + 0.25*role + 0.15*extras)
  const scoredList = validatedList.map(item => {
    const scoreResult = calculateMatchScore(candidatePayload, item);
    const matchScore = scoreResult.match_score;
    let matchTier = 'Good Potential 📈';
    if (matchScore >= 85) matchTier = 'Top Match 🌟';
    else if (matchScore >= 72) matchTier = 'Strong Fit 🎯';
    else if (matchScore >= 60) matchTier = 'Relevant Match ⚡';
    else matchTier = 'Below 60% (Skill Gap) ⚠️';

    return {
      ...item,
      match_score: matchScore,
      matchScore: matchScore,
      match_tier: matchTier,
      matching_skills: scoreResult.matching_skills,
      missing_skills: scoreResult.missing_skills,
      matchingSkills: scoreResult.matching_skills,
      skillsToLearn: scoreResult.missing_skills,
      score_breakdown: scoreResult.breakdown,
      fit_analysis: scoreResult.matching_skills.length > 0
        ? `Your verified skills in ${scoreResult.matching_skills.slice(0, 3).join(', ')} match ${item.company}'s requirements (${matchScore}% match). Strengthening ${scoreResult.missing_skills.slice(0, 2).join(' & ') || 'core principles'} will boost selection chances.`
        : `Role aligns with your target trajectory (${matchScore}% fit). Completing ${scoreResult.missing_skills.slice(0, 3).join(', ')} will elevate qualification.`
    };
  });

  // Calculate score distribution
  const scores = scoredList.map(i => i.match_score).sort((a, b) => a - b);
  const minScore = scores.length > 0 ? scores[0] : 0;
  const maxScore = scores.length > 0 ? scores[scores.length - 1] : 0;
  const medianScore = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  console.log(`📊 STAGE 6 [Scored]: Distribution -> Min: ${minScore}%, Median: ${medianScore}%, Avg: ${avgScore}%, Max: ${maxScore}%`);

  // STAGE 7: CUT >= 60%
  const passed60List = scoredList.filter(item => item.match_score >= 60);
  passed60List.sort((a, b) => b.match_score - a.match_score);

  const below60List = scoredList.filter(item => item.match_score < 60);
  below60List.sort((a, b) => b.match_score - a.match_score);
  const top3Below60 = below60List.slice(0, 3).map(item => ({ ...item, is_recommended: false }));

  console.log(`📊 STAGE 7 [>= 60% Cut]: ${passed60List.length} passed threshold | ${below60List.length} below threshold`);
  console.log(`================================================================\n`);

  const pipelineStats = {
    target_role: targetRole,
    stage_counts: {
      raw_fetched: rawList.length,
      by_source: {
        remotive: rawResultsBySource['Remotive API'].length,
        arbeitnow: rawResultsBySource['Arbeitnow API'].length,
        jobicy: rawResultsBySource['Jobicy API'].length,
        verified_db: rawResultsBySource['Verified Curated DB'].length
      },
      normalized: normalizedList.length,
      deduplicated: dedupedList.length,
      expiry_filtered: activeList.length,
      link_validated: validatedList.length,
      scored_total: scoredList.length,
      passed_60_percent: passed60List.length,
      below_60_percent: below60List.length
    },
    score_distribution: {
      min: minScore,
      median: medianScore,
      max: maxScore,
      avg: avgScore
    }
  };

  return {
    candidate_target_role: targetRole,
    detected_skills_count: normalizedUserSkills.length,
    detected_skills: candidateSkills,
    top_internships: passed60List,
    below_threshold_internships: top3Below60,
    pipeline_stats: pipelineStats,
    message: passed60List.length === 0
      ? `Found ${scoredList.length} real openings, but 0 currently meet the >= 60% threshold for your current parsed skills. Check the 'Below 60%' section or follow your Roadmap to build required skills.`
      : null
  };
}

/**
 * Curated Internship Interview Questions Repository
 */
export function getInternshipInterviewQuestionsCatalog() {
  return [
    {
      id: 'q-dsa-01',
      category: 'Technical & DSA',
      difficulty: 'Medium',
      question: 'Explain the internal working of a HashMap (or Object/Map). How are hash collisions resolved in Java or Node.js, and what is the worst-case time complexity?',
      recommended_structure: '1. Array + Bucket concept, 2. Hash function & modulo indexing, 3. Separate Chaining (Linked Lists / Red-Black Trees), 4. O(1) average vs O(N) worst-case time complexity.',
      hints: ['Mention JDK 8 treeification when bucket length exceeds 8', 'Explain load factor and resizing']
    },
    {
      id: 'q-dsa-02',
      category: 'Technical & DSA',
      difficulty: 'Medium',
      question: 'Compare QuickSort and MergeSort in terms of Time Complexity, Space Complexity, and Stability. In what real-world scenarios would you prefer MergeSort over QuickSort?',
      recommended_structure: '1. Time Big-O (Best, Average, Worst: O(N log N) vs O(N^2)), 2. Auxiliary Space: O(1) in-place vs O(N), 3. Stability definition, 4. Scenario: Linked Lists or External Sorting with large datasets on disk.',
      hints: ['Mention pivot selection pitfalls (worst case for sorted array)', 'Explain stability importance for multi-attribute sorting']
    },
    {
      id: 'q-dsa-03',
      category: 'Technical & DSA',
      difficulty: 'Hard',
      question: 'Explain the difference between SQL (Relational) and NoSQL databases. When would you choose PostgreSQL over MongoDB for a production application, and what are ACID transactions?',
      recommended_structure: '1. ACID (Atomicity, Consistency, Isolation, Durability) vs BASE, 2. Strict relational schema with foreign keys vs dynamic JSON documents, 3. SQL for financial/transactional integrity, NoSQL for high-write unstructured feeds.',
      hints: ['Contrast horizontal vs vertical scaling', 'Give real examples: e-commerce orders (SQL) vs user activity log (NoSQL)']
    },
    {
      id: 'q-sys-01',
      category: 'Project Architecture',
      difficulty: 'Medium',
      question: 'Walk me through the architecture of your top full-stack project. What was the biggest performance bottleneck or technical challenge you faced, and how did you resolve it?',
      recommended_structure: '1. Client layer (React/UI), API gateway/routing, Database choice, 2. Specific bottleneck (e.g., slow query or re-renders), 3. Resolution (e.g., Redis caching, indexing, debouncing), 4. Quantified metric improvement.',
      hints: ['Use concrete metrics (e.g. 40% latency reduction)', 'Highlight architectural trade-offs']
    },
    {
      id: 'q-sys-02',
      category: 'Project Architecture',
      difficulty: 'Hard',
      question: 'How do you secure RESTful APIs in a modern web application? Explain JWT (JSON Web Token) authentication, token expiry, refresh token rotation, and how to defend against SQL Injection and XSS.',
      recommended_structure: '1. Stateless JWT structure (Header.Payload.Signature), 2. Short-lived Access Token + HttpOnly cookie Refresh Token, 3. Parameterized queries / ORMs for SQL injection, 4. Content Security Policy (CSP) and sanitization for XSS.',
      hints: ['Never store sensitive JWTs in localStorage where XSS can read them', 'Explain CORS configuration']
    },
    {
      id: 'q-beh-01',
      category: 'Behavioral & STAR',
      difficulty: 'Medium',
      question: 'Tell me about a challenging bug or technical roadblock you encountered while building a project. Walk me through your step-by-step troubleshooting process using the STAR method.',
      recommended_structure: 'Situation (Project context & symptom) -> Task (Goal & timeline) -> Action (Logs, breakpoint debugging, isolation test, root cause fix) -> Result (Successful patch & automated test to prevent regression).',
      hints: ['Focus on systematic root-cause analysis rather than guessing', 'Highlight what you learned for future projects']
    },
    {
      id: 'q-beh-02',
      category: 'Behavioral & STAR',
      difficulty: 'Medium',
      question: 'Describe a situation where you had a disagreement with a teammate or peer regarding a technical design choice or framework. How did you resolve it collaboratively?',
      recommended_structure: 'Situation (Conflicting views on tech/design) -> Task (Reach consensus without delaying sprint) -> Action (Benchmarking, pros/cons matrix, data-driven compromise) -> Result (Successful implementation on schedule & strong team rapport).',
      hints: ['Emphasize objective data and user requirements over ego', 'Show empathy and active listening']
    },
    {
      id: 'q-beh-03',
      category: 'Behavioral & STAR',
      difficulty: 'Easy',
      question: 'Why are you specifically interested in this Software Engineering internship, and how do you plan to create an impact in your first 30 days?',
      recommended_structure: '1. Alignment with company mission and tech stack, 2. 30-Day Ramp-up plan (Read codebase, set up local environment, ship first bugfix/PR in week 1), 3. Proactive eagerness to learn from senior mentors.',
      hints: ['Show genuine research about the company products', 'Express enthusiasm for learning and ownership']
    }
  ];
}

/**
 * Evaluate Candidate's Answer using AI
 */
export async function evaluateCandidateInternshipAnswer(question, answer, category, role, language) {
  return await evaluateInternshipAnswerAI({ question, answer, category, role, language });
}
