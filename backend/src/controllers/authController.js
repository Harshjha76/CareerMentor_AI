import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'careerpilot-ai-super-secret-key-2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function formatUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    preferred_language: user.preferred_language || 'en',
    target_role: user.target_role || 'Software Engineer',
    dream_companies: user.dream_companies || 'Google, Microsoft',
    current_skills: user.current_skills || '',
    daily_study_hours: user.daily_study_hours || 2,
    available_study_minutes: user.available_study_minutes || (user.daily_study_hours ? user.daily_study_hours * 60 : 120),
    university_name: user.university_name || '',
    branch: user.branch || '',
    phone_number: user.phone_number || '',
    is_onboarded: !!user.is_onboarded
  };
}

/**
 * Direct Email Sign-In / Registration
 * Activates user account with personal email so AI agent can send study check-ins
 */
export async function emailLogin(req, res) {
  const { email, name } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email format (e.g. name@example.com)' });
  }

  const userName = (name && typeof name === 'string' && name.trim())
    ? name.trim()
    : cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  try {
    let existingUser = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    let user;
    let isNewUser = false;

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
      // Update name if a custom name was provided
      if (name && typeof name === 'string' && name.trim() && user.name !== name.trim()) {
        await query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), user.id]);
        user.name = name.trim();
      }
    } else {
      isNewUser = true;
      const newId = uuidv4();
      const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
      
      await query(
        `INSERT INTO users (
          id, google_id, email, name, avatar_url, preferred_language, is_onboarded,
          target_role, dream_companies, current_skills, daily_study_hours, available_study_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          newId,
          `email_${Date.now()}`,
          cleanEmail,
          userName,
          defaultAvatar,
          'en',
          false,
          'Software Engineer',
          'Google, Microsoft, TCS, Infosys',
          'JavaScript, React, SQL',
          2,
          57
        ]
      );
      const created = await query('SELECT * FROM users WHERE id = $1', [newId]);
      user = created.rows[0];
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: formatUserResponse(user),
      isNewUser
    });
  } catch (err) {
    console.error('Email Auth Error:', err);
    return res.status(500).json({ error: 'Authentication failed: ' + err.message });
  }
}

/**
 * Handle Google Sign-In (OAuth ID Token)
 */
export async function googleLogin(req, res) {
  const { id_token, credential } = req.body;
  const tokenToVerify = id_token || credential;

  if (!tokenToVerify) {
    return res.status(400).json({ error: 'Google credential or id_token is required' });
  }

  try {
    let email, name, picture, googleId;

    // Verify token with Google Auth Library if configured
    if (GOOGLE_CLIENT_ID && !tokenToVerify.startsWith('mock_')) {
      const ticket = await client.verifyIdToken({
        idToken: tokenToVerify,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      // Decode JWT payload or mock credential
      try {
        const decoded = jwt.decode(tokenToVerify);
        if (decoded && decoded.email) {
          googleId = decoded.sub || `google_${Date.now()}`;
          email = decoded.email;
          name = decoded.name || 'Google User';
          picture = decoded.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
        } else {
          throw new Error('Could not decode token');
        }
      } catch {
        googleId = `google_user_${Date.now()}`;
        email = `student_${Date.now()}@gmail.com`;
        name = 'Google Student';
        picture = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
      }
    }

    // Check if user already exists
    let existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
      // Update avatar or name if changed
      await query('UPDATE users SET avatar_url = $1, name = $2 WHERE id = $3', [
        picture || user.avatar_url,
        name || user.name,
        user.id
      ]);
    } else {
      // Create new user record
      const newId = uuidv4();
      await query(
        `INSERT INTO users (
          id, google_id, email, name, avatar_url, preferred_language, is_onboarded
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newId, googleId, email, name, picture, 'en', false]
      );
      const created = await query('SELECT * FROM users WHERE id = $1', [newId]);
      user = created.rows[0];
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(500).json({ error: 'Google authentication failed: ' + err.message });
  }
}

/**
 * 1-Click Demo User Login for immediate evaluation
 */
export async function demoLogin(req, res) {
  try {
    const demoEmail = 'demo.student@careerpilot.ai';
    let userRes = await query('SELECT * FROM users WHERE email = $1', [demoEmail]);
    let user;

    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
    } else {
      const newId = uuidv4();
      await query(
        `INSERT INTO users (
          id, google_id, email, name, avatar_url, target_role, dream_companies,
          current_skills, daily_study_hours, available_study_minutes, university_name, branch, phone_number, preferred_language, is_onboarded
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          newId,
          'google_demo_1001',
          demoEmail,
          'Aarav Sharma',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          'Full Stack Software Engineer',
          'Google, Microsoft, TCS, Infosys',
          'JavaScript, React, Node.js, Python, SQL',
          2,
          57,
          'Indian Institute of Technology (IIT)',
          'Computer Science & Engineering',
          '+91 98765 43210',
          'en',
          true
        ]
      );
      const created = await query('SELECT * FROM users WHERE id = $1', [newId]);
      user = created.rows[0];
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Demo Login Error:', err);
    return res.status(500).json({ error: 'Failed to authenticate demo user' });
  }
}

/**
 * Save Onboarding Profile Questionnaire
 */
export async function saveOnboarding(req, res) {
  try {
    const userId = req.user.id;
    const {
      target_role,
      dream_companies,
      current_skills,
      daily_study_hours,
      available_study_minutes,
      university_name,
      branch,
      phone_number,
      preferred_language
    } = req.body;

    // Validate preferred_language strictly to en, hi, mr, sa
    const validLanguages = ['en', 'hi', 'mr', 'sa'];
    const selectedLang = validLanguages.includes(preferred_language) ? preferred_language : 'en';
    const studyMins = available_study_minutes ? parseInt(available_study_minutes, 10) : (daily_study_hours ? parseInt(daily_study_hours, 10) * 60 : 120);

    await query(
      `UPDATE users SET
        target_role = $1,
        dream_companies = $2,
        current_skills = $3,
        daily_study_hours = $4,
        available_study_minutes = $5,
        university_name = $6,
        branch = $7,
        phone_number = $8,
        preferred_language = $9,
        is_onboarded = TRUE
      WHERE id = $10`,
      [
        target_role || 'Software Engineer',
        dream_companies || 'Google, Microsoft',
        Array.isArray(current_skills) ? current_skills.join(', ') : current_skills || 'General Tech',
        daily_study_hours ? parseInt(daily_study_hours, 10) : Math.round(studyMins / 60),
        studyMins,
        university_name || '',
        branch || '',
        phone_number || '',
        selectedLang,
        userId
      ]
    );

    const updated = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = updated.rows[0];

    return res.json({
      message: 'Onboarding completed successfully',
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Onboarding Error:', err);
    return res.status(500).json({ error: 'Failed to complete onboarding' });
  }
}

/**
 * Get current authenticated user profile
 */
export async function getMe(req, res) {
  try {
    const user = req.user;
    return res.json({
      user: formatUserResponse(user)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

/**
 * Update Profile Settings & Language
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const {
      name,
      email,
      target_role,
      dream_companies,
      current_skills,
      daily_study_hours,
      available_study_minutes,
      university_name,
      branch,
      phone_number,
      preferred_language
    } = req.body;

    const validLanguages = ['en', 'hi', 'mr', 'sa'];
    const selectedLang = validLanguages.includes(preferred_language)
      ? preferred_language
      : req.user.preferred_language;

    const studyMins = available_study_minutes
      ? parseInt(available_study_minutes, 10)
      : (req.user.available_study_minutes || (daily_study_hours ? parseInt(daily_study_hours, 10) * 60 : 120));

    const updatedEmail = email && typeof email === 'string' && email.includes('@')
      ? email.trim().toLowerCase()
      : req.user.email;

    await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        target_role = COALESCE($3, target_role),
        dream_companies = COALESCE($4, dream_companies),
        current_skills = COALESCE($5, current_skills),
        daily_study_hours = COALESCE($6, daily_study_hours),
        available_study_minutes = COALESCE($7, available_study_minutes),
        university_name = COALESCE($8, university_name),
        branch = COALESCE($9, branch),
        phone_number = COALESCE($10, phone_number),
        preferred_language = $11
      WHERE id = $12`,
      [
        name || req.user.name,
        updatedEmail,
        target_role || req.user.target_role,
        dream_companies || req.user.dream_companies,
        current_skills || req.user.current_skills,
        daily_study_hours ? parseInt(daily_study_hours, 10) : req.user.daily_study_hours,
        studyMins,
        university_name !== undefined ? university_name : req.user.university_name,
        branch !== undefined ? branch : req.user.branch,
        phone_number !== undefined ? phone_number : req.user.phone_number,
        selectedLang,
        userId
      ]
    );

    const updated = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = updated.rows[0];

    return res.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(user)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
}
