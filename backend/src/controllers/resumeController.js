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
