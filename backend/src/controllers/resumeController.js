import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { query } from '../config/db.js';
import { extractTextFromFile } from '../services/resumeParser.js';
import { analyzeResumeWithAI, extractStructuredResumeDetails, getRoleExpectations } from '../services/aiService.js';

/**
 * Helper to sync extracted skills and role gaps into users.skills_inventory, current_skills, and skill_gaps
 */
export async function syncKnowledgeVaultFromResume(userId, combinedPayload, targetRole = 'Software Engineer') {
  try {
    const analysis = combinedPayload.analysis || {};
    const extractedProfile = combinedPayload.extractedProfile || {};
    const skillsObj = extractedProfile.skills || extractedProfile.categorized_skills || {};

    const extractedSkillItems = [];
    const seenSkillNames = new Set();

    const addSkill = (name, category = 'languages') => {
      if (!name || typeof name !== 'string') return;
      const clean = name.trim();
      const lower = clean.toLowerCase();
      if (clean.length > 1 && !seenSkillNames.has(lower)) {
        seenSkillNames.add(lower);
        extractedSkillItems.push({
          id: `sk-${uuidv4().slice(0, 8)}`,
          name: clean,
          category,
          level: 'intermediate',
          verified: true,
          source: 'resume'
        });
      }
    };

    // Category mapping directly from structured extraction (no hardcoded skill buckets)
    if (Array.isArray(skillsObj.languages)) skillsObj.languages.forEach(s => addSkill(s, 'languages'));
    if (Array.isArray(skillsObj.frameworks)) skillsObj.frameworks.forEach(s => addSkill(s, 'frameworks'));
    if (Array.isArray(skillsObj.libraries)) skillsObj.libraries.forEach(s => addSkill(s, 'frameworks'));
    if (Array.isArray(skillsObj.databases)) skillsObj.databases.forEach(s => addSkill(s, 'databases'));
    if (Array.isArray(skillsObj.developerTools)) skillsObj.developerTools.forEach(s => addSkill(s, 'tools'));
    if (Array.isArray(skillsObj.cloud)) skillsObj.cloud.forEach(s => addSkill(s, 'tools'));
    if (Array.isArray(skillsObj.tools_and_cloud)) skillsObj.tools_and_cloud.forEach(s => addSkill(s, 'tools'));
    if (Array.isArray(skillsObj.coreConcepts)) skillsObj.coreConcepts.forEach(s => addSkill(s, 'core'));
    if (Array.isArray(skillsObj.core_competencies)) skillsObj.core_competencies.forEach(s => addSkill(s, 'core'));

    // Compute dynamic skill gaps versus target role
    const expectations = getRoleExpectations(targetRole);
    const missingSkills = (analysis.what_to_add?.missing_skills || expectations.skills)
      .filter(s => !seenSkillNames.has(s.toLowerCase()));

    const skillGapsPayload = missingSkills.map(gapName => ({
      name: gapName,
      targetRole,
      priority: 'high',
      suggestedDuration: '1-2 weeks',
      reason: `Essential requirement for ${targetRole} positions.`
    }));

    if (extractedSkillItems.length > 0 || skillGapsPayload.length > 0) {
      const commaList = extractedSkillItems.map(s => s.name).join(', ');
      await query(
        `UPDATE users
         SET skills_inventory = $1,
             current_skills = $2,
             skill_gaps = $3
         WHERE id = $4`,
        [
          JSON.stringify(extractedSkillItems),
          commaList,
          JSON.stringify(skillGapsPayload),
          userId
        ]
      );
      console.log(`✅ Synced ${extractedSkillItems.length} verified skills & ${skillGapsPayload.length} gaps to Knowledge Vault`);
    }

    return { extractedSkillItems, skillGapsPayload };
  } catch (err) {
    console.warn('Notice syncing knowledge vault from resume:', err.message);
    return { extractedSkillItems: [], skillGapsPayload: [] };
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
    await syncKnowledgeVaultFromResume(userId, combinedPayload, userRole);

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
    await syncKnowledgeVaultFromResume(userId, payload, targetRole);

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
          await syncKnowledgeVaultFromResume(userId, payload, req.user.target_role || 'Software Engineer');
        }
      }
    }

    return res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Delete resume error:', err);
    return res.status(500).json({ error: 'Failed to delete resume' });
  }
}
