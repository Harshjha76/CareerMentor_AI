import { query } from '../config/db.js';
import {
  matchInternshipsForCandidate,
  getInternshipInterviewQuestionsCatalog,
  evaluateCandidateInternshipAnswer
} from '../services/internshipService.js';

/**
 * Get personalized internships matched to user resume & skills
 */
export async function getRecommendedInternships(req, res) {
  try {
    const user = req.user;

    // Fetch latest user details including skills_inventory
    let userDetails = user;
    try {
      const userRes = await query('SELECT * FROM users WHERE id = $1', [user.id]);
      if (userRes.rows.length > 0) {
        userDetails = userRes.rows[0];
      }
    } catch (uErr) {
      console.warn('Notice loading user details:', uErr.message);
    }

    // Look for user's latest parsed resume
    let resumeData = null;
    try {
      const resumeRes = await query(
        'SELECT ai_feedback FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
        [user.id]
      );
      if (resumeRes.rows.length > 0 && resumeRes.rows[0].ai_feedback) {
        let raw = resumeRes.rows[0].ai_feedback;
        if (typeof raw === 'string') {
          resumeData = JSON.parse(raw);
        } else {
          resumeData = raw;
        }
      }
    } catch (parseErr) {
      console.warn('Notice reading latest resume for matching:', parseErr.message);
    }

    const matches = await matchInternshipsForCandidate(userDetails, resumeData);

    return res.json({
      success: true,
      has_resume: !!resumeData,
      ...matches
    });
  } catch (err) {
    console.error('Error fetching recommended internships:', err);
    return res.status(500).json({ error: 'Failed to fetch internship recommendations: ' + err.message });
  }
}

/**
 * Get curated internship interview questions bank
 */
export async function getInternshipQuestions(req, res) {
  try {
    const questions = getInternshipInterviewQuestionsCatalog();
    return res.json({
      success: true,
      total_questions: questions.length,
      questions
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch interview questions' });
  }
}

/**
 * Interactive AI Answer Evaluator for Internship Questions
 */
export async function evaluateInternshipAnswer(req, res) {
  try {
    const { question, answer, category, role } = req.body;
    const language = req.user?.preferred_language || 'en';

    if (!question || !answer || answer.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide both question and candidate answer.' });
    }

    const evaluation = await evaluateCandidateInternshipAnswer(
      question,
      answer,
      category || 'Technical',
      role || req.user?.target_role || 'Software Engineer Intern',
      language
    );

    return res.json({
      success: true,
      question,
      candidate_answer: answer,
      language,
      evaluation
    });
  } catch (err) {
    console.error('Answer evaluation error:', err);
    return res.status(500).json({ error: 'Failed to evaluate answer: ' + err.message });
  }
}
