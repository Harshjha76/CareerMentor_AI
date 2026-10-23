import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { query } from '../config/db.js';
import { extractTextFromFile } from '../services/resumeParser.js';
import { analyzeResumeWithAI, extractStructuredResumeDetails, getRoleExpectations } from '../services/aiService.js';

/**
 * Helper to sync extracted skills and role gaps into users.skills_inventory, current_skills, and skill_gaps
 */
/**
 * Helper to assess candidate's verified skills against target role requirements.
 * Classifies into:
 * 1. Confirmed Weaknesses (missing critical role skills or low proficiency)
 * 2. Unassessed Skills (self-reported on resume without verified project/role proof)
 * 3. Verified Strengths (skills with demonstrated projects/experience)
 */
export function assessCandidateSkillsAndGaps(skillsInventory = [], targetRole = 'Software Engineer') {
  const expectations = getRoleExpectations(targetRole);
  const candidateSkillsMap = new Map();
  skillsInventory.forEach(s => {
    if (s && s.name) {
      candidateSkillsMap.set(s.name.toLowerCase().trim(), s);
    }
  });

  const skillGaps = [];
  const expectedSkills = expectations.skills || [];

  for (const expSkill of expectedSkills) {
    const lower = expSkill.toLowerCase().trim();
    let matchedSkill = null;

    for (const [candName, candSkill] of candidateSkillsMap.entries()) {
      if (candName === lower || candName.includes(lower) || lower.includes(candName)) {
        matchedSkill = candSkill;
        break;
      }
    }

    if (!matchedSkill) {
      // Confirmed missing / weakness
      skillGaps.push({
        name: expSkill,
        targetRole,
        priority: 'high',
        status: 'confirmed_weakness',
        evidenceType: 'missing',
        suggestedDuration: '1-2 weeks',
        reason: `Essential requirement for ${targetRole} positions. Not found on candidate resume.`
      });
    } else if (matchedSkill.level === 'beginner' || matchedSkill.evidenceType === 'self_reported' || (matchedSkill.confidence && matchedSkill.confidence <= 50)) {
      // Unassessed / needs project proof
      skillGaps.push({
        name: expSkill,
        targetRole,
        priority: 'medium',
        status: 'unassessed',
        evidenceType: 'self_reported',
        suggestedDuration: '1 week',
        reason: `Self-reported in resume skills list without verified project evidence. Practical assessment recommended.`
      });
    }
  }

  return skillGaps;
}

/**
 * Helper to sync extracted skills and role gaps into users.skills_inventory, current_skills, and skill_gaps
 * Categorizes skills by evidence (project count, experience bullets, quantified metrics, certifications)
 * Never assumes expert without sufficient verifiable proof.
 */
export async function syncKnowledgeVaultFromResume(userId, combinedPayload = null, targetRole = 'Software Engineer', resumeId = null) {
  try {
    // 1. Fetch current user skills inventory to preserve any manually added skills
    const userRes = await query('SELECT skills_inventory, current_skills FROM users WHERE id = $1', [userId]);
    let existingInventory = [];
    if (userRes.rows.length > 0 && userRes.rows[0].skills_inventory) {
      try {
        const raw = userRes.rows[0].skills_inventory;
        existingInventory = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!Array.isArray(existingInventory)) existingInventory = [];
      } catch {
        existingInventory = [];
      }
    }

    // Keep manual skills (skills that were not auto-extracted from a previous resume)
    const preservedManualSkills = existingInventory.filter(s => s.source === 'manual');
    const seenSkillNames = new Set(preservedManualSkills.map(s => (s.name || '').toLowerCase().trim()));

    const extractedSkillItems = [];

    if (combinedPayload) {
      const extractedProfile = combinedPayload.extractedProfile || {};
      const skillsObj = extractedProfile.skills || extractedProfile.categorized_skills || {};
      const projects = Array.isArray(extractedProfile.projects) ? extractedProfile.projects : [];
      const experiences = Array.isArray(extractedProfile.experience) ? extractedProfile.experience : [];
      const certifications = Array.isArray(extractedProfile.certifications) ? extractedProfile.certifications : [];

      const metricRegex = /\b(?:\d+[%kKmM]?|\$\d+|\d+\+?|reduced|increased|optimized|latency|ms|throughput|scale|users)\b/i;

      const analyzeSkillEvidence = (skillName) => {
        const norm = skillName.toLowerCase();
        let projCount = 0;
        let projHasMetrics = false;
        const matchedProjects = [];

        for (const p of projects) {
          const techArr = Array.isArray(p.techStack) ? p.techStack.map(t => String(t).toLowerCase()) : [];
          const textToSearch = `${p.title || ''} ${p.description || ''} ${(p.bullets || []).join(' ')}`.toLowerCase();
          const isTechMatch = techArr.some(t => t.includes(norm) || norm.includes(t));
          const isTextMatch = textToSearch.includes(norm);

          if (isTechMatch || isTextMatch) {
            projCount++;
            matchedProjects.push(p.title || 'Portfolio Project');
            if (metricRegex.test(textToSearch)) {
              projHasMetrics = true;
            }
          }
        }

        let expCount = 0;
        let expHasMetrics = false;
        const matchedExperiences = [];

        for (const exp of experiences) {
          const textToSearch = `${exp.role || ''} ${exp.company || ''} ${(exp.bullets || []).join(' ')}`.toLowerCase();
          if (textToSearch.includes(norm)) {
            expCount++;
            matchedExperiences.push(exp.role ? `${exp.role} at ${exp.company || 'Company'}` : 'Experience');
            if (metricRegex.test(textToSearch)) {
              expHasMetrics = true;
            }
          }
        }

        let hasCert = false;
        for (const c of certifications) {
          if ((c.name || '').toLowerCase().includes(norm)) {
            hasCert = true;
          }
        }

        let level = 'beginner';
        let evidenceType = 'self_reported';
        let evidence = 'Self-reported in skills section (no project evidence found)';
        let confidence = 40;

        if (projCount >= 2 || (projCount >= 1 && expCount >= 1)) {
          if (projHasMetrics || expHasMetrics) {
            level = 'expert';
            evidenceType = 'project_and_experience_proven';
            evidence = `Proven in ${projCount} project(s) & experience with quantified impact`;
            confidence = 85;
          } else {
            level = 'intermediate';
            evidenceType = 'project_proven';
            evidence = `Applied across ${projCount} project(s) / employment`;
            confidence = 75;
          }
        } else if (projCount === 1) {
          level = 'intermediate';
          evidenceType = 'project_proven';
          evidence = `Applied in 1 project (${matchedProjects[0] || 'Portfolio Project'})`;
          confidence = 65;
        } else if (expCount === 1) {
          level = 'intermediate';
          evidenceType = 'experience_proven';
          evidence = `Demonstrated in work experience (${matchedExperiences[0] || 'Employment Role'})`;
          confidence = 65;
        } else if (hasCert) {
          level = 'intermediate';
          evidenceType = 'certified';
          evidence = 'Validated by industry certification';
          confidence = 70;
        }

        return {
          level,
          evidenceType,
          evidence,
          confidence,
          projectCount: projCount,
          experienceCount: expCount,
          hasMetrics: projHasMetrics || expHasMetrics,
          hasCertification: hasCert
        };
      };

      const addSkill = (name, category = 'languages') => {
        if (!name || typeof name !== 'string') return;
        const clean = name.trim();
        const lower = clean.toLowerCase();
        if (clean.length > 1 && !seenSkillNames.has(lower)) {
          seenSkillNames.add(lower);
          const evidenceInfo = analyzeSkillEvidence(clean);
          extractedSkillItems.push({
            id: `sk-${uuidv4().slice(0, 8)}`,
            name: clean,
            category,
            level: evidenceInfo.level,
            confidence: evidenceInfo.confidence,
            evidence: evidenceInfo.evidence,
            evidenceType: evidenceInfo.evidenceType,
            projectCount: evidenceInfo.projectCount,
            experienceCount: evidenceInfo.experienceCount,
            hasMetrics: evidenceInfo.hasMetrics,
            hasCertification: evidenceInfo.hasCertification,
            verified: true,
            source: 'resume',
            resumeId: resumeId || null
          });
        }
      };

      // Category mapping directly from structured extraction
      if (Array.isArray(skillsObj.languages)) skillsObj.languages.forEach(s => addSkill(s, 'languages'));
      if (Array.isArray(skillsObj.frameworks)) skillsObj.frameworks.forEach(s => addSkill(s, 'frameworks'));
      if (Array.isArray(skillsObj.libraries)) skillsObj.libraries.forEach(s => addSkill(s, 'frameworks'));
      if (Array.isArray(skillsObj.databases)) skillsObj.databases.forEach(s => addSkill(s, 'databases'));
      if (Array.isArray(skillsObj.developerTools)) skillsObj.developerTools.forEach(s => addSkill(s, 'tools'));
      if (Array.isArray(skillsObj.cloud)) skillsObj.cloud.forEach(s => addSkill(s, 'tools'));
      if (Array.isArray(skillsObj.tools_and_cloud)) skillsObj.tools_and_cloud.forEach(s => addSkill(s, 'tools'));
      if (Array.isArray(skillsObj.coreConcepts)) skillsObj.coreConcepts.forEach(s => addSkill(s, 'core'));
      if (Array.isArray(skillsObj.core_competencies)) skillsObj.core_competencies.forEach(s => addSkill(s, 'core'));
    }

    // Combine manual skills + new resume verified skills
    const finalInventory = [...preservedManualSkills, ...extractedSkillItems];

    // Compute dynamic skill gaps versus target role with distinction between confirmed weaknesses and unassessed skills
    const skillGapsPayload = assessCandidateSkillsAndGaps(finalInventory, targetRole);

    const commaList = finalInventory.map(s => s.name).join(', ');
    await query(
      `UPDATE users
       SET skills_inventory = $1,
           current_skills = $2,
           skill_gaps = $3
       WHERE id = $4`,
      [
        JSON.stringify(finalInventory),
        commaList,
        JSON.stringify(skillGapsPayload),
        userId
      ]
    );

    console.log(`✅ Synced Knowledge Vault for user ${userId}: ${extractedSkillItems.length} resume skills with evidence, ${preservedManualSkills.length} manual skills, ${skillGapsPayload.length} gaps`);

    return { finalInventory, extractedSkillItems, preservedManualSkills, skillGapsPayload };
  } catch (err) {
    console.warn('Notice syncing knowledge vault from resume:', err.message);
    return { finalInventory: [], extractedSkillItems: [], preservedManualSkills: [], skillGapsPayload: [] };
  }
}

/**
 * Normalizes a resume record from the database
 */
function normalizeResumeRecord(row) {
  if (!row) return null;
  let payload = row.ai_feedback;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }

  const analysis = payload.analysis || payload;
  const extractedProfile = payload.extractedProfile || null;

  return {
    id: row.id,
    fileName: row.file_name || (row.file_url ? path.basename(row.file_url) : 'Resume Document'),
    fileUrl: row.file_url,
    fileType: row.file_type || 'application/pdf',
    score: row.score,
    isActive: Boolean(row.is_active),
    uploadedAt: row.uploaded_at,
    analysis,
    extractedProfile,
    feedback: analysis // backwards compatibility
  };
}

/**
 * Upload, parse, and analyze resume
 * Stores multiple resumes per user, marking the newly uploaded one as active
 */
export async function uploadAndAnalyzeResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a resume file to upload (PDF, DOCX, or TXT).' });
    }

    const userId = req.user.id;
    const userRole = req.user.target_role || 'Software Engineer';
    const language = req.user.preferred_language || 'en';

    console.log(`📄 Deep parsing resume: ${req.file.originalname} for ${userRole} in [${language}]`);

    // Extract text with layout preservation and OCR fallback
    const textContent = await extractTextFromFile(req.file.path, req.file.mimetype, req.file.originalname);

    // Run structured profile extraction with temperature 0
    const extractedProfile = await extractStructuredResumeDetails(textContent, language);

    // Run ATS analysis evaluated against target role
    const analysis = await analyzeResumeWithAI(textContent, userRole, language, extractedProfile);

    const resumeId = uuidv4();
    const score = analysis.score || 80;

    const combinedPayload = {
      analysis,
      extractedProfile,
      parsed_at: new Date().toISOString()
    };

    // Mark all existing resumes of this user as inactive
    await query(`UPDATE resumes SET is_active = FALSE WHERE user_id = $1`, [userId]);

    // Insert new active resume
    await query(
      `INSERT INTO resumes (id, user_id, file_url, file_name, file_type, ai_feedback, score, is_active, parsed_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        resumeId,
        userId,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        JSON.stringify(combinedPayload),
        score,
        true, // is_active
        textContent.slice(0, 50000)
      ]
    );

    // Sync Knowledge Vault: "What I Know" & "What I Don't Know"
    await syncKnowledgeVaultFromResume(userId, combinedPayload, userRole, resumeId);

    // Automatically run internship matcher for immediate recommendations
    let matchedInternships = [];
    try {
      const { matchInternshipsForCandidate } = await import('../services/internshipService.js');
      const latestUserRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
      const activeUser = latestUserRes.rows[0] || req.user;
      const matchResult = await matchInternshipsForCandidate(activeUser, combinedPayload);
      matchedInternships = matchResult.top_internships || [];
    } catch (matchErr) {
      console.warn('Notice matching internships automatically upon resume upload:', matchErr.message);
    }

    return res.json({
      message: 'Resume analyzed and structured profile extracted successfully',
      resumeId,
      score,
      analysis,
      extractedProfile,
      matched_internships: matchedInternships,
      fileName: req.file.originalname,
      isActive: true
    });
  } catch (err) {
    console.error('Resume Analysis Error:', err);
    return res.status(500).json({ error: 'Failed to analyze resume: ' + err.message });
  }
}

/**
 * Retrieve the active resume for the user
 * Falls back to latest uploaded if none marked active
 */
export async function getLatestResume(req, res) {
  try {
    const userId = req.user.id;
    // Query active resume first
    let result = await query(
      `SELECT * FROM resumes WHERE user_id = $1 AND is_active = TRUE ORDER BY uploaded_at DESC LIMIT 1`,
      [userId]
    );

    // Fallback to latest resume
    if (result.rows.length === 0) {
      result = await query(
        `SELECT * FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
        [userId]
      );
    }

    if (result.rows.length === 0) {
      return res.json({ resume: null });
    }

    const normalized = normalizeResumeRecord(result.rows[0]);
    return res.json({ resume: normalized });
  } catch (err) {
    console.error('Fetch resume error:', err);
    return res.status(500).json({ error: 'Failed to retrieve resume data' });
  }
}

/**
 * List all uploaded resumes for the user with active indicator
 */
export async function listUserResumes(req, res) {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT id, file_name, file_url, file_type, score, is_active, uploaded_at, ai_feedback
       FROM resumes
       WHERE user_id = $1
       ORDER BY uploaded_at DESC`,
      [userId]
    );

    const resumes = result.rows.map(row => {
      let candidateName = null;
      let role = null;
      try {
        const payload = typeof row.ai_feedback === 'string' ? JSON.parse(row.ai_feedback) : (row.ai_feedback || {});
        candidateName = payload.extractedProfile?.name || payload.extractedProfile?.personal_info?.name || null;
      } catch {
        // ignore
      }

      return {
        id: row.id,
        fileName: row.file_name || (row.file_url ? path.basename(row.file_url) : 'Resume Document'),
        fileType: row.file_type || 'application/pdf',
        score: row.score,
        isActive: Boolean(row.is_active),
        uploadedAt: row.uploaded_at,
        candidateName
      };
    });

    return res.json({ resumes });
  } catch (err) {
    console.error('List resumes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve resume list' });
  }
}

/**
 * Retrieve a specific resume by ID
 */
export async function getResumeById(req, res) {
  try {
    const userId = req.user.id;
    const resumeId = req.params.id;

    const result = await query(
      `SELECT * FROM resumes WHERE id = $1 AND user_id = $2`,
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const normalized = normalizeResumeRecord(result.rows[0]);
    return res.json({ resume: normalized });
  } catch (err) {
    console.error('Get resume by ID error:', err);
    return res.status(500).json({ error: 'Failed to retrieve resume' });
  }
}

/**
 * Set a specific resume as active and re-sync Knowledge Vault
 */
export async function setActiveResume(req, res) {
  try {
    const userId = req.user.id;
    const resumeId = req.params.id;
    const targetRole = req.user.target_role || 'Software Engineer';

    // Verify resume exists for this user
    const check = await query(`SELECT * FROM resumes WHERE id = $1 AND user_id = $2`, [resumeId, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Set all resumes to inactive, then set the chosen resume to active
    await query(`UPDATE resumes SET is_active = FALSE WHERE user_id = $1`, [userId]);
    await query(`UPDATE resumes SET is_active = TRUE WHERE id = $1 AND user_id = $2`, [resumeId, userId]);

    const activeRecord = check.rows[0];
    let payload = activeRecord.ai_feedback;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch { payload = {}; }
    }

    // Re-sync Knowledge Vault from this activated resume
    await syncKnowledgeVaultFromResume(userId, payload, targetRole, resumeId);

    const normalized = normalizeResumeRecord({ ...activeRecord, is_active: true });
    return res.json({
      message: 'Resume switched successfully and Knowledge Vault updated.',
      resume: normalized
    });
  } catch (err) {
    console.error('Set active resume error:', err);
    return res.status(500).json({ error: 'Failed to switch active resume' });
  }
}

/**
 * Delete a resume record and optionally switch active to next latest
 */
export async function deleteResume(req, res) {
  try {
    const userId = req.user.id;
    const resumeId = req.params.id;

    const record = await query(`SELECT * FROM resumes WHERE id = $1 AND user_id = $2`, [resumeId, userId]);
    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const wasActive = Boolean(record.rows[0].is_active);
    const fileUrl = record.rows[0].file_url;

    // Delete record from DB
    await query(`DELETE FROM resumes WHERE id = $1 AND user_id = $2`, [resumeId, userId]);

    // Delete physical file if exists
    if (fileUrl) {
      const filePath = path.resolve('uploads', fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      }
    }

    // If deleted resume was active, set the newest remaining resume as active
    if (wasActive) {
      const remaining = await query(
        `SELECT id FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
        [userId]
      );
      if (remaining.rows.length > 0) {
        const nextId = remaining.rows[0].id;
        await query(`UPDATE resumes SET is_active = TRUE WHERE id = $1`, [nextId]);
        const nextRecord = await query(`SELECT * FROM resumes WHERE id = $1`, [nextId]);
        if (nextRecord.rows.length > 0) {
          let payload = nextRecord.rows[0].ai_feedback;
          if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch { payload = {}; }
          }
          await syncKnowledgeVaultFromResume(userId, payload, req.user.target_role || 'Software Engineer', nextId);
        }
      } else {
        // No resumes remain for this user: clean all resume-extracted skills while keeping any manual skills
        await syncKnowledgeVaultFromResume(userId, null, req.user.target_role || 'Software Engineer', null);
      }
    }

    return res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Delete resume error:', err);
    return res.status(500).json({ error: 'Failed to delete resume' });
  }
}
