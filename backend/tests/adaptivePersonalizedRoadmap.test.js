import test from 'node:test';
import assert from 'node:assert/strict';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../src/config/db.js';
import {
  syncKnowledgeVaultFromResume,
  assessCandidateSkillsAndGaps
} from '../src/controllers/resumeController.js';
import {
  createRoadmap,
  adaptRoadmap,
  submitTaskProgressFeedback,
  getUserRoadmaps
} from '../src/controllers/roadmapController.js';
import { generateProgressiveRoadmap } from '../src/services/curriculumEngine.js';
import { updateProfile } from '../src/controllers/authController.js';

test('Personalized Adaptive Resume-Based Roadmap & Knowledge Vault Engine', async (t) => {
  const userAId = `user-adapt-a-${Date.now()}`;
  const userBId = `user-adapt-b-${Date.now()}`;

  // Seed User A and User B in database
  await query(
    `INSERT INTO users (id, email, name, target_role, available_study_minutes, daily_study_hours, learning_style, current_skill_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userAId, `${userAId}@test.com`, 'User Alpha', 'Full Stack Developer', 60, 1, 'project_based', 'Intermediate']
  );

  await query(
    `INSERT INTO users (id, email, name, target_role, available_study_minutes, daily_study_hours, learning_style, current_skill_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userBId, `${userBId}@test.com`, 'User Beta', 'Data Analyst', 45, 1, 'rapid_drills', 'Beginner']
  );

  await t.test('1. Resume Evidence & Proficiency Extraction: never assumes expert without metrics', async () => {
    const resumePayload = {
      extractedProfile: {
        name: 'Alex Johnson',
        skills: {
          languages: ['Java', 'JavaScript', 'HTML/CSS', 'Kotlin'],
          frameworks: ['React', 'Express', 'Spring Boot'],
          databases: ['PostgreSQL', 'MongoDB'],
          developerTools: ['Git', 'Docker']
        },
        projects: [
          {
            title: 'Cloud Distributed Cache & Storage Engine',
            description: 'Architected high-throughput storage pipeline in Java and PostgreSQL with 45% latency reduction.',
            techStack: ['Java', 'PostgreSQL', 'Docker'],
            bullets: ['Reduced query latency by 45% using indexed PostgreSQL joins and connection pooling.', 'Processed 50,000 concurrent records.']
          },
          {
            title: 'Modern E-Commerce Dashboard',
            description: 'Full stack responsive catalog in React and Express with microservice backend.',
            techStack: ['React', 'Express', 'JavaScript'],
            bullets: ['Constructed modular UI in React with Tailwind CSS.', 'Scaled API routes handling 1,000 requests/minute.']
          }
        ],
        experience: [
          {
            role: 'Software Engineering Intern',
            company: 'Tech Solutions Inc.',
            dates: '2023 - 2024',
            bullets: [
              'Contributed to core microservices in Java and Spring Boot, optimizing database transactions.',
              'Automated Docker build pipelines in GitHub Actions.'
            ]
          }
        ],
        certifications: [
          { name: 'AWS Certified Developer Associate', issuer: 'Amazon Web Services' }
        ]
      }
    };

    const syncResult = await syncKnowledgeVaultFromResume(userAId, resumePayload, 'Full Stack Developer', 'res-test-101');
    assert.ok(syncResult.extractedSkillItems.length > 0, 'Extracted skills should not be empty');

    // Java has 2 projects/experiences AND quantified metrics -> expert
    const javaSkill = syncResult.extractedSkillItems.find(s => s.name.toLowerCase() === 'java');
    assert.ok(javaSkill, 'Java skill must be extracted');
    assert.equal(javaSkill.level, 'expert', 'Java with multiple projects, experience, and quantified metrics should be expert');
    assert.ok(javaSkill.hasMetrics, 'Java should have hasMetrics true');
    assert.ok(javaSkill.confidence >= 80, 'Java confidence should be high (>=80)');
    assert.ok(javaSkill.evidence.toLowerCase().includes('proven'), 'Evidence should describe proven project experience');

    // Kotlin is only listed in skills section with NO projects -> beginner / self_reported
    const kotlinSkill = syncResult.extractedSkillItems.find(s => s.name.toLowerCase() === 'kotlin');
    assert.ok(kotlinSkill, 'Kotlin skill must be extracted');
    assert.equal(kotlinSkill.level, 'beginner', 'Kotlin without project evidence must NOT be marked expert or intermediate');
    assert.equal(kotlinSkill.evidenceType, 'self_reported');
    assert.equal(kotlinSkill.confidence, 40, 'Self reported confidence should be 40');
  });

  await t.test('2. Dynamic Weak Areas: classifies into confirmed weaknesses vs unassessed skills', async () => {
    // Current inventory for User A
    const userRow = await query('SELECT skills_inventory, skill_gaps FROM users WHERE id = $1', [userAId]);
    const rawInv = userRow.rows[0].skills_inventory;
    const inventory = typeof rawInv === 'string' ? JSON.parse(rawInv) : rawInv;

    // Assess gaps versus "Backend Developer"
    const gaps = assessCandidateSkillsAndGaps(inventory, 'Backend Developer');
    assert.ok(gaps.length > 0, 'Gaps should be identified against role expectations');

    // Redis is NOT in candidate inventory -> confirmed_weakness
    const redisGap = gaps.find(g => g.name.toLowerCase().includes('redis'));
    assert.ok(redisGap, 'Redis should be flagged as missing gap for Backend Developer');
    assert.equal(redisGap.status, 'confirmed_weakness');
    assert.equal(redisGap.priority, 'high');
    assert.ok(redisGap.reason.includes('Essential requirement'), 'Should include concrete reason why employers expect this');

    // Verify unassessed items have status unassessed
    const unassessedItem = gaps.find(g => g.status === 'unassessed');
    if (unassessedItem) {
      assert.equal(unassessedItem.evidenceType, 'self_reported');
    }
  });

  await t.test('3. Adaptive Roadmap Generation: fast-tracks proven skills & prioritizes confirmed gaps', async () => {
    // Test curriculum engine directly with options
    const verifiedSkills = [
      { name: 'Java', level: 'expert', projectCount: 2, hasMetrics: true },
      { name: 'PostgreSQL', level: 'intermediate', projectCount: 1 }
    ];
    const skillGaps = [
      { name: 'Redis', priority: 'high', status: 'confirmed_weakness' },
      { name: 'System Design', priority: 'high', status: 'confirmed_weakness' }
    ];

    const weeks = generateProgressiveRoadmap(
      'Java Backend Engineering',
      8,
      45, // 45 mins/day
      'Backend Developer',
      'Intermediate',
      {
        verifiedSkills,
        skillGaps,
        learningStyle: 'project_based'
      }
    );

    assert.equal(weeks.length, 8, 'Should generate 8 weeks');

    // Week 1 should NOT be basic syntax / "Hello World" since Java is already proven
    const week1Title = weeks[0].title.toLowerCase();
    assert.ok(!week1Title.includes('basic') && !week1Title.includes('foundational syntax'),
      `Week 1 (${weeks[0].title}) should fast-track beyond basic syntax when candidate has verified Java experience`);

    // Gaps (Redis or System Design) should be interleaved into curriculum
    const hasRedisOrSysDesign = weeks.some(w =>
      w.title.toLowerCase().includes('redis') ||
      w.theme.toLowerCase().includes('redis') ||
      w.title.toLowerCase().includes('system design') ||
      w.theme.toLowerCase().includes('system design')
    );
    assert.ok(hasRedisOrSysDesign, 'High-priority gaps (Redis / System Design) should be prioritized into the curriculum architecture');

    // Verify exact minute sum for daily tasks
    weeks[0].tasks.forEach(task => {
      assert.equal(task.duration_minutes, 45, `Task day ${task.day_number} duration must equal 45m`);
      if (task.subtasks && task.subtasks.length > 0) {
        const subSum = task.subtasks.reduce((acc, st) => acc + (st.duration_minutes || st.minutes), 0);
        assert.equal(subSum, 45, `Subtasks on day ${task.day_number} must sum to 45m`);
      }
    });
  });

  await t.test('4. Learning Availability & Study Preferences: persists updates anytime', async () => {
    const mockReq = {
      user: { id: userAId, email: `${userAId}@test.com`, name: 'User Alpha', preferred_language: 'en' },
      body: {
        target_role: 'Senior Full Stack Architect',
        learning_style: 'interview_defense',
        available_study_minutes: 90,
        current_skill_level: 'Advanced',
        target_deadline: '2026-12-31'
      }
    };

    let responseData = null;
    const mockRes = {
      json: (data) => { responseData = data; return data; },
      status: () => mockRes
    };

    await updateProfile(mockReq, mockRes);
    assert.ok(responseData && responseData.user, 'Profile update must return updated user');
    assert.equal(responseData.user.target_role, 'Senior Full Stack Architect');
    assert.equal(responseData.user.learning_style, 'interview_defense');
    assert.equal(responseData.user.available_study_minutes, 90);
    assert.equal(responseData.user.current_skill_level, 'Advanced');
    assert.equal(responseData.user.target_deadline, '2026-12-31');
  });

  await t.test('5. Progress Feedback & Adaptation: struggling triggers remediation, mastered boosts confidence', async () => {
    // Generate a real roadmap for User A
    const reqCreate = {
      user: {
        id: userAId,
        email: `${userAId}@test.com`,
        name: 'User Alpha',
        target_role: 'Full Stack Developer',
        preferred_language: 'en',
        available_study_minutes: 60
      },
      body: {
        skill_name: 'Full Stack Web Development',
        duration_weeks: 4,
        daily_minutes: 60,
        skill_level: 'Intermediate'
      }
    };

    let createdRoadmapRes = null;
    const mockRes = {
      json: (data) => { createdRoadmapRes = data; return data; },
      status: () => mockRes
    };

    await createRoadmap(reqCreate, mockRes);
    assert.ok(createdRoadmapRes && createdRoadmapRes.roadmapId, 'Roadmap must be created in DB');

    // Retrieve created tasks
    const tasksRes = await query('SELECT * FROM roadmap_tasks WHERE roadmap_id = $1 ORDER BY week_number ASC, day_number ASC', [createdRoadmapRes.roadmapId]);
    assert.ok(tasksRes.rows.length > 0, 'Roadmap tasks must exist');
    const firstTask = tasksRes.rows[0];

    // Case A: User is struggling on Task 1
    const reqFeedbackStruggling = {
      user: { id: userAId },
      params: { taskId: firstTask.id },
      body: { feedback: 'struggling', quiz_score: 40 }
    };
    let feedbackResStruggling = null;
    const mockResStruggling = {
      json: (data) => { feedbackResStruggling = data; return data; },
      status: () => mockResStruggling
    };

    await submitTaskProgressFeedback(reqFeedbackStruggling, mockResStruggling);
    assert.equal(feedbackResStruggling.status, 'needs_revision', 'Task status must transition to needs_revision');
    assert.equal(feedbackResStruggling.adaptationAction, 'remediation_injected');
    assert.ok(feedbackResStruggling.remediationTask, 'Remediation task must be dynamically generated');
    assert.ok(feedbackResStruggling.remediationTask.topic.includes('Targeted Remediation'), 'Remediation task must focus on topic');

    // Case B: User masters Task 2 with 95 score
    const secondTask = tasksRes.rows[1];
    const reqFeedbackMastered = {
      user: { id: userAId },
      params: { taskId: secondTask.id },
      body: { feedback: 'too_easy', quiz_score: 95 }
    };
    let feedbackResMastered = null;
    const mockResMastered = {
      json: (data) => { feedbackResMastered = data; return data; },
      status: () => mockResMastered
    };

    await submitTaskProgressFeedback(reqFeedbackMastered, mockResMastered);
    assert.equal(feedbackResMastered.status, 'mastered', 'Task status must transition to mastered');
    assert.equal(feedbackResMastered.is_completed, true);
    assert.equal(feedbackResMastered.adaptationAction, 'fast_track_mastery');
  });

  await t.test('6. Data Integrity & Isolation: zero cross-user leakage', async () => {
    // User B attempts to access User A's roadmaps or tasks
    const reqUserB = {
      user: { id: userBId }
    };
    let roadmapsUserB = null;
    const mockResB = {
      json: (data) => { roadmapsUserB = data; return data; },
      status: () => mockResB
    };

    await getUserRoadmaps(reqUserB, mockResB);
    assert.equal(roadmapsUserB.roadmaps.length, 0, 'User B must have 0 roadmaps (isolated from User A)');

    // User B attempts to submit feedback for User A's task -> must return 404 unauthorized
    const userATasks = await query('SELECT rt.id FROM roadmap_tasks rt JOIN roadmaps r ON rt.roadmap_id = r.id WHERE r.user_id = $1 LIMIT 1', [userAId]);
    const userATaskId = userATasks.rows[0].id;

    let errorStatus = 200;
    let errorBody = null;
    const mockResUnauthorized = {
      status: (code) => { errorStatus = code; return mockResUnauthorized; },
      json: (data) => { errorBody = data; return data; }
    };

    await submitTaskProgressFeedback({ user: { id: userBId }, params: { taskId: userATaskId }, body: { feedback: 'just_right' } }, mockResUnauthorized);
    assert.equal(errorStatus, 404, 'User B must NOT be allowed to modify User A roadmap tasks');
  });
});
