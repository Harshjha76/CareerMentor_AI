import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { extractTextFromFile } from '../services/resumeParser.js';
import { analyzeResumeWithAI, extractStructuredResumeDetails } from '../services/aiService.js';

export async function uploadAndAnalyzeResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a resume file to upload (PDF, DOCX, or TXT).' });
    }

    const userId = req.user.id;
    const userRole = req.user.target_role || 'Software Engineer';
    const language = req.user.preferred_language || 'en';

    console.log(`📄 Deep parsing resume: ${req.file.originalname} for ${userRole} in [${language}]`);

    // Extract text
    const textContent = await extractTextFromFile(req.file.path, req.file.mimetype, req.file.originalname);

    // Run parallel AI analysis: ATS scoring + deep structured profile extraction
    const [analysis, extractedProfile] = await Promise.all([
      analyzeResumeWithAI(textContent, userRole, language),
      extractStructuredResumeDetails(textContent, language)
    ]);

    const resumeId = uuidv4();
    const score = analysis.score || 85;

    const combinedPayload = {
      analysis,
      extractedProfile
    };

    await query(
      `INSERT INTO resumes (id, user_id, file_url, ai_feedback, score)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        resumeId,
        userId,
        req.file.filename,
        JSON.stringify(combinedPayload),
        score
      ]
    );

    // Automatically sync authentic extracted skills into users.skills_inventory & current_skills
    try {
      const extractedSkillItems = [];
      const seenSkillNames = new Set();

      const addSkillIfNew = (name, cat = 'languages') => {
        if (!name || typeof name !== 'string') return;
        const cleanName = name.trim();
        const lower = cleanName.toLowerCase();
        if (cleanName.length > 1 && !seenSkillNames.has(lower)) {
          seenSkillNames.add(lower);
          let detectedCategory = cat;
          if (/react|node|express|fastapi|django|flask|spring|tailwind|vue|angular|redux|zustand/i.test(lower)) detectedCategory = 'frameworks';
          else if (/postgres|mongo|redis|mysql|sqlite|cassandra|dynamodb|sql/i.test(lower)) detectedCategory = 'databases';
          else if (/docker|aws|git|linux|kubernetes|postman|gcp|azure|terraform|ci\/cd/i.test(lower)) detectedCategory = 'tools';
          else if (/data structures|algorithms|dsa|system design|os|dbms|oop|networking/i.test(lower)) detectedCategory = 'core';

          extractedSkillItems.push({
            id: `sk-${uuidv4().slice(0, 8)}`,
            name: cleanName,
            category: detectedCategory,
            level: 'intermediate'
          });
        }
      };

      if (analysis.categorized_skills && typeof analysis.categorized_skills === 'object') {
        Object.entries(analysis.categorized_skills).forEach(([catKey, skillsArr]) => {
          if (Array.isArray(skillsArr)) {
            skillsArr.forEach(s => addSkillIfNew(s, catKey));
          }
        });
      }

      if (Array.isArray(analysis.detected_skills)) {
        analysis.detected_skills.forEach(s => addSkillIfNew(s));
      }

      if (extractedProfile?.technical_skills && typeof extractedProfile.technical_skills === 'object') {
        Object.entries(extractedProfile.technical_skills).forEach(([catKey, skillsArr]) => {
          if (Array.isArray(skillsArr)) {
            skillsArr.forEach(s => addSkillIfNew(s, catKey));
          }
        });
      }

      if (extractedSkillItems.length > 0) {
        const commaList = extractedSkillItems.map(s => s.name).join(', ');
        await query(
          `UPDATE users SET skills_inventory = $1, current_skills = $2 WHERE id = $3`,
          [JSON.stringify(extractedSkillItems), commaList, userId]
        );
        console.log(`✅ Synced ${extractedSkillItems.length} authentic extracted skills to user's knowledge vault.`);
      }
    } catch (syncErr) {
      console.warn('Notice syncing extracted skills to knowledge vault:', syncErr.message);
    }

    return res.json({
      message: 'Resume analyzed and structured profile extracted successfully',
      resumeId,
      score,
      analysis,
      extractedProfile,
      fileName: req.file.originalname
    });
  } catch (err) {
    console.error('Resume Analysis Error:', err);
    return res.status(500).json({ error: 'Failed to analyze resume: ' + err.message });
  }
}

export async function getLatestResume(req, res) {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT * FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ resume: null });
    }

    const resume = result.rows[0];
    let payload = resume.ai_feedback;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }

    // Support both new combined schema and legacy schema
    const analysis = payload.analysis || payload;
    const extractedProfile = payload.extractedProfile || null;

    return res.json({
      resume: {
        id: resume.id,
        score: resume.score,
        uploaded_at: resume.uploaded_at,
        analysis,
        extractedProfile,
        feedback: analysis // backward compatibility
      }
    });
  } catch (err) {
    console.error('Fetch resume error:', err);
    return res.status(500).json({ error: 'Failed to retrieve resume data' });
  }
}
