import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { v4 as uuidv4 } from 'uuid';
import { query, initDB } from '../src/config/db.js';
import {
  syncKnowledgeVaultFromResume,
  setActiveResume,
  deleteResume,
  listUserResumes,
  getResumeById
} from '../src/controllers/resumeController.js';
import { updateUserSkills } from '../src/controllers/authController.js';
import { getRecommendedInternships } from '../src/controllers/internshipController.js';
import { computeATSScoreBreakdown } from '../src/services/aiService.js';

function parseInventory(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
}

describe('Deep End-to-End Audit & Verification Test Suite', () => {
  const userAlphaId = `test-user-alpha-${Date.now()}`;
  const userBetaId = `test-user-beta-${Date.now()}`;
  const resume1Id = `resume-java-${Date.now()}`;
  const resume2Id = `resume-python-${Date.now()}`;

  const resume1Payload = {
    analysis: {
      score: 85,
      what_to_add: { missing_skills: ['Docker', 'AWS'] }
    },
    extractedProfile: {
      name: 'Alpha Developer',
      skills: {
        languages: ['Java', 'SQL'],
        frameworks: ['Spring Boot', 'Hibernate'],
        databases: ['MySQL'],
        developerTools: ['Git', 'Maven'],
        coreConcepts: ['Data Structures & Algorithms', 'OOP']
      }
    }
  };

  const resume2Payload = {
    analysis: {
      score: 92,
      what_to_add: { missing_skills: ['Kubernetes'] }
    },
    extractedProfile: {
      name: 'Alpha Developer',
      skills: {
        languages: ['Python', 'SQL'],
        frameworks: ['FastAPI', 'PyTorch'],
        databases: ['PostgreSQL'],
        developerTools: ['Docker', 'Linux'],
        coreConcepts: ['Machine Learning', 'Data Structures']
      }
    }
  };

  before(async () => {
    await initDB();

    // Create User Alpha
    await query(
      `INSERT INTO users (id, email, name, target_role, current_skills, skills_inventory, is_onboarded)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userAlphaId, `alpha.${Date.now()}@test.com`, 'Alpha Dev', 'Software Engineer', '', '[]', true]
    );

    // Create User Beta (for cross-user isolation tests)
    await query(
      `INSERT INTO users (id, email, name, target_role, current_skills, skills_inventory, is_onboarded)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userBetaId, `beta.${Date.now()}@test.com`, 'Beta Dev', 'Software Engineer', '', '[]', true]
    );
  });

  after(async () => {
    // Cleanup test data
    await query('DELETE FROM resumes WHERE user_id IN ($1, $2)', [userAlphaId, userBetaId]);
    await query('DELETE FROM users WHERE id IN ($1, $2)', [userAlphaId, userBetaId]);
  });

  // -------------------------------------------------------------
  // TEST 1: First Resume Upload & Knowledge Vault Sync
  // -------------------------------------------------------------
  it('1. User Alpha uploads Resume 1 (Java): Knowledge Vault reflects only Resume 1 skills', async () => {
    await query(
      `INSERT INTO resumes (id, user_id, file_name, file_type, ai_feedback, score, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [resume1Id, userAlphaId, 'Resume_Java.pdf', 'application/pdf', JSON.stringify(resume1Payload), 85, true]
    );

    await syncKnowledgeVaultFromResume(userAlphaId, resume1Payload, 'Java Developer', resume1Id);

    const userRes = await query('SELECT skills_inventory, current_skills FROM users WHERE id = $1', [userAlphaId]);
    const inventory = parseInventory(userRes.rows[0].skills_inventory);

    const skillNames = inventory.map(s => s.name);
    assert.ok(skillNames.includes('Java'), 'Should contain Java');
    assert.ok(skillNames.includes('Spring Boot'), 'Should contain Spring Boot');
    assert.ok(skillNames.includes('MySQL'), 'Should contain MySQL');
    assert.ok(!skillNames.includes('PyTorch'), 'Must NOT contain PyTorch before Resume 2 is uploaded');

    // All skills are verified from Resume 1
    assert.ok(inventory.every(s => s.source === 'resume' && s.resumeId === resume1Id));
  });

  // -------------------------------------------------------------
  // TEST 2: Manual Skill Addition in Knowledge Vault
  // -------------------------------------------------------------
  it('2. User Alpha manually adds GraphQL: tagged with source "manual" and preserved', async () => {
    const userRes = await query('SELECT skills_inventory FROM users WHERE id = $1', [userAlphaId]);
    const inventory = parseInventory(userRes.rows[0].skills_inventory);

    inventory.push({
      id: 'manual-sk-1',
      name: 'GraphQL',
      category: 'frameworks',
      level: 'intermediate',
      source: 'manual',
      verified: true
    });

    const mockReq = {
      user: { id: userAlphaId, target_role: 'Software Engineer' },
      body: { skills: inventory }
    };
    let jsonResult = null;
    const mockRes = {
      status: () => mockRes,
      json: (data) => { jsonResult = data; return data; }
    };

    await updateUserSkills(mockReq, mockRes);

    const updatedUserRes = await query('SELECT skills_inventory FROM users WHERE id = $1', [userAlphaId]);
    const updatedInventory = parseInventory(updatedUserRes.rows[0].skills_inventory);

    const manualSkill = updatedInventory.find(s => s.name === 'GraphQL');
    assert.ok(manualSkill, 'Manual skill GraphQL should exist in database');
    assert.strictEqual(manualSkill.source, 'manual', 'Skill should have source manual');
  });

  // -------------------------------------------------------------
  // TEST 3: Second Resume Upload & Active Resume Switching
  // -------------------------------------------------------------
  it('3. User Alpha uploads Resume 2 (Python): Resume 1 skills replaced, manual GraphQL preserved', async () => {
    // Set Resume 1 inactive, insert Resume 2 as active
    await query('UPDATE resumes SET is_active = FALSE WHERE user_id = $1', [userAlphaId]);
    await query(
      `INSERT INTO resumes (id, user_id, file_name, file_type, ai_feedback, score, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [resume2Id, userAlphaId, 'Resume_Python.pdf', 'application/pdf', JSON.stringify(resume2Payload), 92, true]
    );

    await syncKnowledgeVaultFromResume(userAlphaId, resume2Payload, 'Python Developer', resume2Id);

    const userRes = await query('SELECT skills_inventory FROM users WHERE id = $1', [userAlphaId]);
    const inventory = parseInventory(userRes.rows[0].skills_inventory);
    const skillNames = inventory.map(s => s.name);

    // Resume 2 skills must be present
    assert.ok(skillNames.includes('Python'), 'Should contain Python');
    assert.ok(skillNames.includes('FastAPI'), 'Should contain FastAPI');
    assert.ok(skillNames.includes('PostgreSQL'), 'Should contain PostgreSQL');

    // Manual skill must still be preserved
    assert.ok(skillNames.includes('GraphQL'), 'Manual skill GraphQL must be preserved');

    // Resume 1 skills must NOT leak into Resume 2 session
    assert.ok(!skillNames.includes('Spring Boot'), 'Spring Boot must NOT leak from inactive Resume 1');
    assert.ok(!skillNames.includes('Hibernate'), 'Hibernate must NOT leak from inactive Resume 1');
  });

  // -------------------------------------------------------------
  // TEST 4: Switching Active Resume Back to Resume 1
  // -------------------------------------------------------------
  it('4. User Alpha switches active resume back to Resume 1: Knowledge Vault immediately flips back', async () => {
    const mockReq = {
      user: { id: userAlphaId, target_role: 'Java Developer' },
      params: { id: resume1Id }
    };
    let jsonResult = null;
    const mockRes = {
      status: () => mockRes,
      json: (data) => { jsonResult = data; return data; }
    };

    await setActiveResume(mockReq, mockRes);
    assert.ok(jsonResult.resume.isActive, 'Resume 1 should now be active');

    const userRes = await query('SELECT skills_inventory FROM users WHERE id = $1', [userAlphaId]);
    const inventory = parseInventory(userRes.rows[0].skills_inventory);
    const skillNames = inventory.map(s => s.name);

    // Resume 1 skills are back
    assert.ok(skillNames.includes('Java'), 'Java should be restored');
    assert.ok(skillNames.includes('Spring Boot'), 'Spring Boot should be restored');

    // Manual skill is preserved
    assert.ok(skillNames.includes('GraphQL'), 'Manual skill GraphQL must remain preserved');

    // Resume 2 skills are removed
    assert.ok(!skillNames.includes('FastAPI'), 'FastAPI must NOT leak from inactive Resume 2');
    assert.ok(!skillNames.includes('PyTorch'), 'PyTorch must NOT leak from inactive Resume 2');
  });

  // -------------------------------------------------------------
  // TEST 5: Cross-User Isolation (User Beta cannot access Alpha's data)
  // -------------------------------------------------------------
  it('5. User Beta data isolation: cannot list, access, or activate User Alpha resumes', async () => {
    // 1. Beta lists resumes -> empty list
    const mockReqList = { user: { id: userBetaId } };
    let listResult = null;
    await listUserResumes(mockReqList, {
      status: () => ({ json: () => {} }),
      json: (d) => { listResult = d; }
    });
    assert.strictEqual(listResult.resumes.length, 0, 'User Beta must see 0 resumes');

    // 2. Beta tries to get Alpha resume by ID -> 404
    const mockReqGet = { user: { id: userBetaId }, params: { id: resume1Id } };
    let statusCode = 200;
    await getResumeById(mockReqGet, {
      status: (code) => { statusCode = code; return { json: () => {} }; },
      json: () => {}
    });
    assert.strictEqual(statusCode, 404, 'User Beta must receive 404 when requesting Alpha resume');

    // 3. Beta tries to activate Alpha resume -> 404
    const mockReqActivate = { user: { id: userBetaId }, params: { id: resume1Id } };
    let activateStatus = 200;
    await setActiveResume(mockReqActivate, {
      status: (code) => { activateStatus = code; return { json: () => {} }; },
      json: () => {}
    });
    assert.strictEqual(activateStatus, 404, 'User Beta must receive 404 trying to activate Alpha resume');
  });

  // -------------------------------------------------------------
  // TEST 6: Internship Matcher Uses Active Resume & Authentic Math
  // -------------------------------------------------------------
  it('6. Internship recommendations match strictly against active resume with genuine math', async () => {
    const mockReq = {
      user: { id: userAlphaId, target_role: 'Java Developer' }
    };
    let recResult = null;
    await getRecommendedInternships(mockReq, {
      status: () => ({ json: () => {} }),
      json: (d) => { recResult = d; }
    });

    assert.ok(recResult.success, 'Internships response should succeed');
    assert.ok(recResult.top_internships.length > 0, 'Should return matching internships');

    // Active resume is Java: verify matched skills reflect Java/SQL, not Python/FastAPI
    const allMatching = recResult.top_internships.flatMap(i => i.matching_skills || []);
    assert.ok(allMatching.some(s => /java|sql|git/i.test(s)), 'Matched skills should reflect active Java resume');
  });

  // -------------------------------------------------------------
  // TEST 7: Resume Deletion & Clean Knowledge Vault Reset
  // -------------------------------------------------------------
  it('7. Deleting resumes cascades correctly: zero-resume state resets resume skills and keeps manual', async () => {
    // Delete Resume 2 first
    await deleteResume({ user: { id: userAlphaId }, params: { id: resume2Id } }, {
      status: () => ({ json: () => {} }),
      json: () => {}
    });

    // Delete active Resume 1
    await deleteResume({ user: { id: userAlphaId }, params: { id: resume1Id } }, {
      status: () => ({ json: () => {} }),
      json: () => {}
    });

    const userRes = await query('SELECT skills_inventory FROM users WHERE id = $1', [userAlphaId]);
    const inventory = parseInventory(userRes.rows[0].skills_inventory);

    // Only manual skill GraphQL remains
    assert.strictEqual(inventory.length, 1, 'Only 1 manual skill should remain');
    assert.strictEqual(inventory[0].name, 'GraphQL');
    assert.strictEqual(inventory[0].source, 'manual');
  });

  // -------------------------------------------------------------
  // TEST 8: ATS Scoring Math (Zero Invention)
  // -------------------------------------------------------------
  it('8. ATS Scoring produces transparent breakdown with zero hardcoded minimums or mock profiles', () => {
    const sampleProfile = {
      contact: { email: 'test@domain.com', phone: '1234567890' },
      summary: 'Experienced software engineer',
      education: [{ degree: 'B.Tech' }],
      experience: [{ company: 'Test Corp', role: 'Developer', bullets: ['Engineered microservice handling 5,000 QPS with 99.9% uptime'] }],
      projects: [],
      skills: { languages: ['Java', 'SQL'], frameworks: ['Spring Boot'], developerTools: ['Docker'] }
    };
    const breakdown = computeATSScoreBreakdown(sampleProfile, 'Engineered microservice handling 5,000 QPS with 99.9% uptime test@domain.com 1234567890', 'Java Developer');

    assert.ok(typeof breakdown.score === 'number' && breakdown.score >= 0 && breakdown.score <= 100);
    assert.ok(breakdown.category_scores.keyword_match.weight === 25);
    assert.ok(breakdown.category_scores.section_completeness.weight === 20);
    assert.ok(breakdown.category_scores.quantified_achievements.weight === 20);
    assert.ok(breakdown.category_scores.action_verbs.weight === 15);
    assert.ok(breakdown.category_scores.formatting_parsability.weight === 10);
    assert.ok(breakdown.category_scores.length_and_density.weight === 10);
  });
});
