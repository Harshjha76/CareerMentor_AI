import { evaluateInternshipAnswerAI } from './aiService.js';

/**
 * High-Yield Curated Internship Openings & Matching Engine
 */
export async function matchInternshipsForCandidate(userProfile = {}, resumeData = null) {
  const targetRole = (userProfile.target_role || 'Software Engineer').toLowerCase();
  
  // Extract user skills from all possible sources: parsed resume, skills_inventory, and profile
  const parsedSkills = [];

  // 1. From latest parsed resume
  if (resumeData) {
    if (resumeData.categorized_skills && typeof resumeData.categorized_skills === 'object') {
      Object.values(resumeData.categorized_skills).forEach(arr => {
        if (Array.isArray(arr)) parsedSkills.push(...arr);
      });
    }
    if (Array.isArray(resumeData.detected_skills)) {
      parsedSkills.push(...resumeData.detected_skills);
    }
    if (Array.isArray(resumeData.skills)) {
      parsedSkills.push(...resumeData.skills);
    }
  }

  // 2. From user profile skills_inventory (verified database inventory)
  if (userProfile.skills_inventory) {
    let inv = userProfile.skills_inventory;
    if (typeof inv === 'string') {
      try { inv = JSON.parse(inv); } catch {}
    }
    if (Array.isArray(inv)) {
      inv.forEach(item => {
        if (typeof item === 'string') parsedSkills.push(item);
        else if (item && item.name) parsedSkills.push(item.name);
      });
    } else if (inv && typeof inv === 'object') {
      Object.values(inv).forEach(val => {
        if (Array.isArray(val)) {
          val.forEach(item => {
            if (typeof item === 'string') parsedSkills.push(item);
            else if (item && item.name) parsedSkills.push(item.name);
          });
        }
      });
    }
  }

  // 3. From current_skills field
  if (userProfile.current_skills && typeof userProfile.current_skills === 'string') {
    parsedSkills.push(...userProfile.current_skills.split(',').map(s => s.trim()));
  }

  // Normalize skill set
  const userSkillSet = new Set(parsedSkills.filter(Boolean).map(s => s.toLowerCase().trim()));
  if (userSkillSet.size === 0) {
    ['javascript', 'react', 'node.js', 'python', 'sql', 'git', 'dsa'].forEach(s => userSkillSet.add(s));
  }

  // Curated active tier-1 and high-growth startup internships
  const internshipCatalog = [
    {
      id: 'intern-01',
      company: 'Google',
      company_tier: 'Tier-1 Global Tech',
      role: 'Software Engineering (SWE) Intern - Summer 2026',
      domain: 'Full Stack & Distributed Systems',
      location: 'Bangalore / Hyderabad / Remote',
      work_mode: 'Hybrid',
      stipend: '₹1,20,000 / month (,500/mo)',
      duration: '3 Months (Full-time)',
      experience_level: 'Undergraduate / Graduate',
      required_skills: ['Data Structures & Algorithms', 'Java', 'C++', 'Python', 'System Design', 'Git'],
      apply_urls: {
        careers: 'https://careers.google.com/jobs/results/?q=software%20engineer%20intern',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=google%20software%20engineer%20intern',
        internshala: 'https://internshala.com/internships/google-internship'
      },
      description: 'Collaborate with world-class engineering teams building planetary-scale web applications, microservices, and distributed backend systems.'
    },
    {
      id: 'intern-02',
      company: 'Microsoft',
      company_tier: 'Tier-1 Global Tech',
      role: 'Full Stack Cloud Developer Intern',
      domain: 'Cloud & Full Stack',
      location: 'Hyderabad / Noida / Remote',
      work_mode: 'Hybrid',
      stipend: '₹1,10,000 / month',
      duration: '2 - 6 Months',
      experience_level: 'B.Tech / M.Tech Student',
      required_skills: ['React', 'TypeScript', 'Node.js', 'Azure', 'RESTful APIs', 'SQL'],
      apply_urls: {
        careers: 'https://careers.microsoft.com/students/us/en/search-results?keywords=intern',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=microsoft%20software%20intern',
        wellfound: 'https://wellfound.com/jobs'
      },
      description: 'Build responsive UI components and resilient serverless cloud APIs supporting Azure developer tools and Microsoft 365 services.'
    },
    {
      id: 'intern-03',
      company: 'Amazon Web Services (AWS)',
      company_tier: 'Tier-1 Global Tech',
      role: 'Backend Engineering Intern (AWS Cloud Services)',
      domain: 'Backend & Cloud Infrastructure',
      location: 'Bangalore / Chennai / Hybrid',
      work_mode: 'Hybrid',
      stipend: '₹1,15,000 / month',
      duration: '6 Months',
      experience_level: 'Pre-final / Final Year',
      required_skills: ['Java', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'Microservices', 'Distributed Systems'],
      apply_urls: {
        careers: 'https://www.amazon.jobs/en/job_categories/software-development',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=amazon%20sde%20intern',
        internshala: 'https://internshala.com/internships/software-development-internship'
      },
      description: 'Design highly available distributed storage and computing pipelines with sub-100ms latency guarantees.'
    },
    {
      id: 'intern-04',
      company: 'Postman',
      company_tier: 'Unicorn Tech Startup',
      role: 'Frontend Engineering Intern (Developer Tools)',
      domain: 'Frontend Engineering',
      location: 'Bangalore / Remote',
      work_mode: 'Remote',
      stipend: '₹60,000 / month',
      duration: '6 Months',
      experience_level: 'College Students & Self-Taught',
      required_skills: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Redux / Zustand', 'RESTful APIs'],
      apply_urls: {
        careers: 'https://www.postman.com/company/careers/',
        wellfound: 'https://wellfound.com/company/postman/jobs',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=postman%20frontend%20intern'
      },
      description: 'Craft high-performance interactive interfaces, API client dashboards, and canvas visualization components for 30M+ developers.'
    },
    {
      id: 'intern-05',
      company: 'CRED / Razorpay',
      company_tier: 'High-Growth FinTech Unicorn',
      role: 'Backend & Systems Engineering Intern',
      domain: 'Backend & FinTech Infrastructure',
      location: 'Bangalore / Hybrid',
      work_mode: 'Hybrid',
      stipend: '₹75,000 / month',
      duration: '3 - 6 Months',
      experience_level: 'Final Year / Fresh Graduates',
      required_skills: ['Go', 'Java', 'Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'System Architecture'],
      apply_urls: {
        careers: 'https://razorpay.com/jobs/',
        wellfound: 'https://wellfound.com/jobs',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=razorpay%20software%20intern'
      },
      description: 'Build mission-critical payment processing pipelines, idempotent transaction workflows, and caching layers with 99.999% reliability.'
    },
    {
      id: 'intern-06',
      company: 'Atlassian',
      company_tier: 'Global SaaS Leader',
      role: 'Full Stack Engineering Intern (Jira & Confluence)',
      domain: 'Full Stack SaaS',
      location: 'Remote / Bangalore',
      work_mode: 'Remote',
      stipend: '₹1,00,000 / month',
      duration: '3 Months (Summer)',
      experience_level: 'Penultimate Year',
      required_skills: ['React', 'Java', 'Spring Boot', 'TypeScript', 'GraphQL', 'Docker'],
      apply_urls: {
        careers: 'https://www.atlassian.com/company/careers/students',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=atlassian%20software%20intern'
      },
      description: 'Join distributed collaborative SaaS teams building real-time document editing and automated project workflows.'
    },
    {
      id: 'intern-07',
      company: 'Zomato / Swiggy',
      company_tier: 'Consumer Tech Unicorn',
      role: 'AI & Data Engineering Intern',
      domain: 'AI & Data Science',
      location: 'Gurgaon / Bangalore',
      work_mode: 'Hybrid',
      stipend: '₹50,000 / month',
      duration: '4 Months',
      experience_level: 'College Students',
      required_skills: ['Python', 'SQL', 'FastAPI', 'Pandas', 'Machine Learning', 'Docker'],
      apply_urls: {
        careers: 'https://www.zomato.com/careers',
        internshala: 'https://internshala.com/internships/data-science-internship',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=zomato%20data%20science%20intern'
      },
      description: 'Develop dispatch optimization algorithms, predictive delivery routing, and user recommendation models.'
    },
    {
      id: 'intern-08',
      company: 'BrowserStack',
      company_tier: 'DevOps & Testing Leader',
      role: 'DevOps & Cloud Infrastructure Intern',
      domain: 'DevOps & Cloud',
      location: 'Mumbai / Remote',
      work_mode: 'Remote',
      stipend: '₹55,000 / month',
      duration: '6 Months',
      experience_level: 'B.Tech CS / IT',
      required_skills: ['Linux', 'Docker', 'Kubernetes', 'AWS', 'Python', 'CI/CD Pipelines', 'Git'],
      apply_urls: {
        careers: 'https://www.browserstack.com/careers',
        wellfound: 'https://wellfound.com/company/browserstack/jobs',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=browserstack%20devops%20intern'
      },
      description: 'Scale cloud device farms and maintain automated virtualization infrastructure across global data centers.'
    },
    {
      id: 'intern-09',
      company: 'Goldman Sachs',
      company_tier: 'Tier-1 Global Investment Bank',
      role: 'Java Backend & Enterprise Systems Engineering Intern',
      domain: 'Java Backend & Distributed Systems',
      location: 'Bangalore / Hyderabad',
      work_mode: 'Hybrid',
      stipend: '₹1,05,000 / month',
      duration: '2 - 6 Months',
      experience_level: 'Pre-final / Final Year',
      required_skills: ['Java', 'Spring Boot', 'Data Structures & Algorithms', 'SQL', 'PostgreSQL', 'Multithreading', 'Git'],
      apply_urls: {
        careers: 'https://www.goldmansachs.com/careers/students/programs/india-summer-analyst.html',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=goldman%20sachs%20engineering%20intern',
        internshala: 'https://internshala.com/internships/java-development-internship'
      },
      description: 'Engineer high-throughput transactional order execution and portfolio management microservices with ultra-low latency Java.'
    },
    {
      id: 'intern-10',
      company: 'Oracle',
      company_tier: 'Tier-1 Enterprise Cloud Leader',
      role: 'Java Cloud Infrastructure & Database Intern',
      domain: 'Java Cloud & Enterprise',
      location: 'Bangalore / Noida / Hyderabad',
      work_mode: 'Hybrid',
      stipend: '₹85,000 / month',
      duration: '6 Months',
      experience_level: 'Undergraduate / Postgraduate',
      required_skills: ['Java', 'SQL', 'PostgreSQL', 'Docker', 'REST APIs', 'Data Structures & Algorithms'],
      apply_urls: {
        careers: 'https://www.oracle.com/corporate/careers/students-grads/',
        linkedin: 'https://www.linkedin.com/jobs/search/?keywords=oracle%20software%20engineer%20intern'
      },
      description: 'Develop next-generation Autonomous Database tooling, Java cloud microservices, and distributed clustering components.'
    }
  ];

  // Calculate dynamic match scores based on candidate skill set and target role
  const scoredInternships = internshipCatalog.map(item => {
    const matchingSkills = [];
    const missingSkills = [];

    item.required_skills.forEach(req => {
      const isMatched = Array.from(userSkillSet).some(us => 
        us.includes(req.toLowerCase()) || req.toLowerCase().includes(us)
      );
      if (isMatched) {
        matchingSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    });

    const matchRatio = item.required_skills.length > 0 ? (matchingSkills.length / item.required_skills.length) : 0.5;
    const roleBoost = item.role.toLowerCase().includes(targetRole) || item.domain.toLowerCase().includes(targetRole) ? 14 : 6;
    const rawScore = Math.round(matchRatio * 72 + roleBoost + 12);
    // Ensure verified candidate skills yield >= 60% match score for relevant roles
    const matchScore = Math.min(98, Math.max(matchingSkills.length > 0 ? 62 : 45, rawScore));

    let matchTier = 'Relevant Match ⚡';
    if (matchScore >= 90) matchTier = 'Top Match 🌟';
    else if (matchScore >= 78) matchTier = 'Strong Fit 🎯';
    else if (matchScore >= 60) matchTier = 'Good Potential 📈';

    return {
      ...item,
      matching_skills: matchingSkills,
      missing_skills: missingSkills,
      matchingSkills: matchingSkills,
      skillsToLearn: missingSkills,
      match_score: matchScore,
      matchScore: matchScore,
      match_tier: matchTier,
      fit_analysis: matchingSkills.length > 0
        ? `Your verified expertise in ${matchingSkills.slice(0, 3).join(', ')} directly aligns with ${item.company}'s requirements (${matchScore}% match). Strengthening ${missingSkills.slice(0, 2).join(' & ') || 'system design'} will maximize selection potential.`
        : `Target role ${item.role} aligns with your career trajectory. Adding ${missingSkills.slice(0, 3).join(', ')} will elevate competitiveness.`
    };
  });

  // Filter to keep matches >= 60%
  let filteredMatches = scoredInternships.filter(item => item.match_score >= 60);
  if (filteredMatches.length === 0) {
    // Fallback guarantee if very few skills detected
    filteredMatches = scoredInternships.slice(0, 6);
  }

  filteredMatches.sort((a, b) => b.match_score - a.match_score);

  return {
    candidate_target_role: userProfile.target_role || 'Software Engineer',
    detected_skills_count: userSkillSet.size,
    detected_skills: Array.from(userSkillSet),
    top_internships: filteredMatches
  };
}

/**
 * Curated Internship Interview Questions Repository (Technical, Architecture, Behavioral STAR)
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
