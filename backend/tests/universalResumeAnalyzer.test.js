import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  extractStructuredResumeDetails,
  analyzeResumeWithAI,
  computeATSScoreBreakdown,
  getRoleExpectations
} from '../src/services/aiService.js';
import { normalizeExtractedText } from '../src/services/resumeParser.js';

describe('Universal Resume Analyzer Test Suite', () => {

  // Test 1: Fresher Resume (College graduate, zero corporate experience, academic projects)
  const FRESHER_RESUME = `
Rohan Patel
rohan.patel@engineering.edu | +91 91234 56789 | Mumbai, India
github.com/rohan-patel | linkedin.com/in/rohan-patel-dev

SUMMARY
Enthusiastic Computer Science graduate seeking an Associate Software Engineer role. Strong foundations in Java, Python, Data Structures, and relational database systems.

EDUCATION
Bachelor of Technology in Computer Engineering
University of Mumbai, India | 2020 - 2024
CGPA: 8.4 / 10

ACADEMIC & PERSONAL PROJECTS
1. Smart Campus Shuttle Tracker
Technologies: React, Node.js, Express, MongoDB, Socket.io
- Engineered real-time bus tracking application serving 1,200 active campus students.
- Implemented WebSocket connection handling live GPS coordinates with sub-300ms update latency.
- Deployed backend on Render and frontend on Vercel with automated GitHub Actions CI/CD.

2. Automated Library Book Checkout Kiosk
Technologies: Java, Swing, MySQL, JDBC
- Developed desktop management system for book reservation and automated fine calculation.
- Designed relational schema with 8 normalized tables and composite indexes.
- Reduced manual checkout queue wait time by 45% during peak semester hours.

TECHNICAL SKILLS
Languages: Java, Python, JavaScript, SQL, C++
Frameworks: React, Node.js, Express
Databases: MySQL, MongoDB
Developer Tools: Git, Postman, Linux, VS Code
Core Concepts: Data Structures & Algorithms, Object-Oriented Programming, Database Management
`;

  // Test 2: Experienced Resume (Senior Engineer, 6+ years, 2 corporate companies, metrics-dense)
  const EXPERIENCED_RESUME = `
Sarah Jenkins
sarah.jenkins.tech@gmail.com | +1 (555) 234-5678 | San Francisco, CA
linkedin.com/in/sarah-jenkins-lead | github.com/sjenkins-cloud

PROFESSIONAL SUMMARY
Senior Backend Software Engineer with 6+ years of experience designing distributed microservices, high-throughput message streaming architectures, and cloud-native infrastructure on AWS.

WORK EXPERIENCE
Lead Backend Engineer | Nova Technologies, San Francisco, CA
March 2021 - Present
- Architected event-driven microservices platform handling 45,000 requests/sec with 99.99% uptime using Go, Kafka, and PostgreSQL.
- Reduced p99 database query latency by 58% on a 25M-row dataset by designing partitioned tables and in-memory Redis caching.
- Spearheaded team of 7 software engineers, instituting code review standards and unit testing pipelines achieving 94% coverage.

Software Engineer II | Acme Cloud Corp, Seattle, WA
July 2018 - February 2021
- Built asynchronous order processing engine using Java, Spring Boot, and RabbitMQ processing $12M in monthly e-commerce transactions.
- Automated multi-region container orchestration using Docker, Kubernetes (EKS), and Terraform, reducing release cycle time by 70%.
- Designed resilient retry mechanisms with exponential backoff, cutting transient external API timeout failures to zero.

TECHNICAL SKILLS
Languages: Go, Java, Python, SQL, Bash
Frameworks: Spring Boot, Gin, gRPC, Node.js
Cloud & DevOps: AWS (EKS, RDS, S3), Docker, Kubernetes, Terraform, GitHub Actions, Prometheus, Datadog
Databases: PostgreSQL, Redis, MySQL, DynamoDB
Core Concepts: Microservices Architecture, Distributed Systems, Concurrency, System Design

EDUCATION
Master of Science in Computer Science | University of Washington | 2016 - 2018
Bachelor of Science in Software Engineering | Purdue University | 2012 - 2016

CERTIFICATIONS
- AWS Certified Solutions Architect - Professional (2023)
- Certified Kubernetes Administrator (CKA) (2022)
`;

  // Test 3: Two-Column Resume Representation
  const TWO_COLUMN_RESUME = `
Elena Rostova
elena.rostova@designcloud.io | +44 20 7946 0958 | London, UK
github.com/elena-rostova | elenarostova.dev

[LEFT COLUMN: SKILLS & EDUCATION]
CORE COMPETENCIES:
Languages: TypeScript, JavaScript, Python, HTML5, CSS3
Frameworks: React, Next.js, Vue.js, Tailwind CSS, Redux Toolkit
Databases: PostgreSQL, Supabase
Tools: Git, Webpack, Vite, Figma, Jest, Playwright

EDUCATION:
B.Sc. in Software Engineering & Human-Computer Interaction
Imperial College London | 2019 - 2023
First Class Honours

[RIGHT COLUMN: WORK HISTORY & CAPSTONES]
WORK EXPERIENCE:
Frontend Software Engineer | FinTech Studio UK | Aug 2023 - Present
- Developed modular trading dashboard in React and TypeScript with real-time WebSocket market feeds.
- Optimized bundle size by 42% through dynamic route code-splitting, boosting Google Lighthouse score from 68 to 96.
- Implemented WCAG 2.1 AA accessibility standards across 35 consumer banking screens.

PROJECTS:
Open Source Design System Library (Next.js, Tailwind, Storybook)
- Built accessible React UI component library downloaded 18,000+ times on npm.
- Achieved 98% unit test coverage using Jest and React Testing Library.
`;

  // Test 4: Scanned / Sparse Document Simulation
  const SPARSE_DOCUMENT = `
Candidate Profile
Contact: test.candidate@domain.com
Brief Note: Application for developer position.
`;

  it('Test 1: Fresher Resume correctly extracted with 0 corporate experience and no identity leaks', async () => {
    const profile = await extractStructuredResumeDetails(FRESHER_RESUME);

    // Assert authentic candidate name
    assert.strictEqual(profile.name, 'Rohan Patel', 'Candidate name should be Rohan Patel');
    assert.ok(profile.contact.email.includes('rohan.patel@engineering.edu'), 'Candidate email should match');
    assert.ok(profile.contact.phone.includes('91234 56789'), 'Candidate phone should match');

    // Assert Fresher has 0 corporate jobs (experience: [])
    assert.strictEqual(profile.experience.length, 0, 'Fresher with no corporate jobs must have empty experience array');

    // Assert academic projects are populated
    assert.ok(profile.projects.length >= 2, 'Should extract at least 2 projects');
    const titles = profile.projects.map(p => p.title.toLowerCase());
    assert.ok(titles.some(t => t.includes('shuttle') || t.includes('tracker')), 'Should extract Smart Campus Shuttle Tracker');

    // Assert NO fake identity leaks
    const serialized = JSON.stringify(profile).toLowerCase();
    assert.ok(!serialized.includes('aarav sharma'), 'Must not contain fake name Aarav Sharma');
    assert.ok(!serialized.includes('tech innovations lab'), 'Must not contain fake company Tech Innovations Lab');
  });

  it('Test 2: Experienced Resume correctly extracts corporate employment and high metrics', async () => {
    const profile = await extractStructuredResumeDetails(EXPERIENCED_RESUME);

    assert.strictEqual(profile.name, 'Sarah Jenkins', 'Candidate name should be Sarah Jenkins');
    assert.ok(profile.experience.length >= 2, 'Experienced engineer must have 2 corporate jobs');

    const companies = profile.experience.map(e => e.company.toLowerCase());
    assert.ok(companies.some(c => c.includes('nova')), 'Should extract Nova Technologies');
    assert.ok(companies.some(c => c.includes('acme')), 'Should extract Acme Cloud Corp');

    // Zero data leakage from Fresher test
    const serialized = JSON.stringify(profile).toLowerCase();
    assert.ok(!serialized.includes('rohan patel'), 'Must not leak Rohan Patel data');
    assert.ok(!serialized.includes('campus shuttle'), 'Must not leak campus shuttle project');

    // Run ATS analysis evaluated against Backend Engineer role
    const analysis = await analyzeResumeWithAI(EXPERIENCED_RESUME, 'Backend Engineer', 'en', profile);
    assert.ok(typeof analysis.score === 'number' && analysis.score >= 80, 'Experienced resume should score high on ATS');
    assert.ok(analysis.category_scores.quantified_achievements.score >= 75, 'Metrics-dense resume should score high on quantified achievements');
  });

  it('Test 3: Two-Column Resume preserves sidebars, skills, and main column work experience', async () => {
    const profile = await extractStructuredResumeDetails(TWO_COLUMN_RESUME);

    assert.strictEqual(profile.name, 'Elena Rostova', 'Candidate name should be Elena Rostova');
    assert.ok(profile.skills.languages.some(l => /typescript|javascript/i.test(l)), 'Should extract TypeScript/JavaScript');
    assert.ok(profile.experience.some(e => /fintech/i.test(e.company)), 'Should extract FinTech Studio UK');
    assert.ok(profile.projects.some(p => /design system/i.test(p.title)), 'Should extract Design System Library');

    // Zero data leakage
    const serialized = JSON.stringify(profile).toLowerCase();
    assert.ok(!serialized.includes('sarah jenkins'), 'Must not leak Sarah Jenkins');
    assert.ok(!serialized.includes('rohan patel'), 'Must not leak Rohan Patel');
  });

  it('Test 4: Sparse / Scanned document handles lack of text cleanly without inventing data', async () => {
    const profile = await extractStructuredResumeDetails(SPARSE_DOCUMENT);

    assert.ok(profile.experience.length === 0, 'Sparse document must have 0 experience items');
    assert.ok(profile.projects.length === 0, 'Sparse document must have 0 project items');
    const serialized = JSON.stringify(profile).toLowerCase();
    assert.ok(!serialized.includes('aarav'), 'Must not hallucinate Aarav');
    assert.ok(!serialized.includes('stanford'), 'Must not hallucinate Stanford');

    // ATS analysis reflects sparse content
    const analysis = await analyzeResumeWithAI(SPARSE_DOCUMENT, 'Software Engineer', 'en', profile);
    assert.ok(analysis.score <= 50, 'Sparse document must receive a low ATS score');
    assert.ok(analysis.missing_sections.length > 0, 'Must flag missing sections');
  });

  it('Test 5: normalizeExtractedText handles layout wraps and whitespace artifacts', () => {
    const messy = 'Soft-\nware Engi-\nneering   is\u00A0essential.\n\n\n\nClean.';
    const cleaned = normalizeExtractedText(messy);
    assert.strictEqual(cleaned, 'Software Engineering   is essential.\n\nClean.');
  });

  it('Test 6: computeATSScoreBreakdown computes all 6 dimensions with mathematical consistency', () => {
    const profile = {
      name: 'Test Candidate',
      contact: { email: 'test@example.com', phone: '+1 555 123 4567' },
      summary: 'Experienced Full Stack Developer with 4 years building web apps.',
      education: [{ degree: 'B.S. in Computer Science', institution: 'State University' }],
      experience: [
        {
          role: 'Full Stack Engineer',
          company: 'Acme Corp',
          bullets: [
            'Architected scalable React frontend and Node.js microservices handling 10,000 daily users with 99.9% uptime.',
            'Optimized PostgreSQL queries, reducing p99 latency by 40% across 50 API endpoints.'
          ]
        }
      ],
      projects: [],
      skills: {
        languages: ['JavaScript', 'TypeScript', 'SQL'],
        frameworks: ['React', 'Node.js', 'Express'],
        databases: ['PostgreSQL'],
        developerTools: ['Git', 'Docker']
      }
    };

    const resumeText = `Test Candidate\ntest@example.com | +1 555 123 4567\nFull Stack Developer experienced in React, Node.js, TypeScript, PostgreSQL, Docker, Git. Architected scalable React frontend and Node.js microservices handling 10,000 daily users with 99.9% uptime. Optimized PostgreSQL queries, reducing p99 latency by 40% across 50 API endpoints. B.S. in Computer Science.`;

    const breakdown = computeATSScoreBreakdown(profile, resumeText, 'Full Stack Developer');

    assert.ok(typeof breakdown.score === 'number' && breakdown.score >= 70, 'Score should be a number >= 70');
    assert.ok(breakdown.category_scores.keyword_match.weight === 25);
    assert.ok(breakdown.category_scores.section_completeness.weight === 20);
    assert.ok(breakdown.category_scores.quantified_achievements.weight === 20);
    assert.ok(breakdown.category_scores.action_verbs.weight === 15);
    assert.ok(breakdown.category_scores.formatting_parsability.weight === 10);
    assert.ok(breakdown.category_scores.length_and_density.weight === 10);
  });
});
