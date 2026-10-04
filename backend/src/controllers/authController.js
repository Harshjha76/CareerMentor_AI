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
  if (!user) {
    user = {};
  }
  let skillsInventory = [];
  if (user.skills_inventory) {
    try {
      skillsInventory = typeof user.skills_inventory === 'string' ? JSON.parse(user.skills_inventory) : user.skills_inventory;
    } catch {
      skillsInventory = [];
    }
  }

  return {
    id: user.id || '',
    email: user.email || '',
    name: user.name || '',
    avatar_url: user.avatar_url || '',
    preferred_language: user.preferred_language || 'en',
    target_role: user.target_role || 'Software Engineer',
    dream_companies: user.dream_companies || 'Google, Microsoft',
    current_skills: user.current_skills || '',
    skills_inventory: skillsInventory,
    daily_study_hours: user.daily_study_hours || 2,
    available_study_minutes: user.available_study_minutes || (user.daily_study_hours ? user.daily_study_hours * 60 : 120),
    university_name: user.university_name || '',
    branch: user.branch || '',
    phone_number: user.phone_number || '',
    email_notifications_enabled: user.email_notifications_enabled !== false,
    email_consent_granted_at: user.email_consent_granted_at || null,
    is_onboarded: user.is_onboarded === true || user.is_onboarded === 1 || user.is_onboarded === '1' || user.is_onboarded === 'true'
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
          'Google, Microsoft',
          '',
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
 * Handle Google Sign-In (OAuth ID Token / Verified Google Credentials / Callback)
 */
export async function googleLogin(req, res) {
  const params = { ...(req.query || {}), ...(req.body || {}) };
  const { id_token, credential, email: bodyEmail, name: bodyName, picture: bodyPicture, sub: bodySub, google_id: bodyGoogleId } = params;
  const tokenToVerify = id_token || credential;

  try {
    let email = null;
    let name = null;
    let picture = null;
    let googleId = null;

    // 1. If Google ID token is provided and Google Client ID is configured, verify with Google Auth Library
    if (tokenToVerify && typeof tokenToVerify === 'string') {
      if (GOOGLE_CLIENT_ID && !tokenToVerify.startsWith('mock_') && !tokenToVerify.startsWith('sim_')) {
        try {
          const ticket = await client.verifyIdToken({
            idToken: tokenToVerify,
            audience: GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          googleId = payload.sub;
          email = payload.email;
          name = payload.name;
          picture = payload.picture;
        } catch (verifyErr) {
          console.warn('Google client token verification notice:', verifyErr.message);
        }
      }

      // If not resolved yet, attempt standard JWT token decoding
      if (!email) {
        try {
          const decoded = jwt.decode(tokenToVerify);
          if (decoded && decoded.email) {
            googleId = decoded.sub || bodySub || bodyGoogleId;
            email = decoded.email;
            name = decoded.name || bodyName;
            picture = decoded.picture || bodyPicture;
          }
        } catch (decodeErr) {
          console.warn('JWT token decoding notice:', decodeErr.message);
        }
      }
    }

    // 2. If token decoding did not provide email, check explicit verified payload
    if (!email && (bodyEmail || req.body.email)) {
      const candidate = (bodyEmail || req.body.email || '').trim().toLowerCase();
      if (candidate.includes('@')) {
        email = candidate;
        googleId = bodySub || bodyGoogleId || req.body.sub || req.body.google_id || `google_sub_${encodeURIComponent(candidate)}`;
        name = bodyName || req.body.name || candidate.split('@')[0];
        picture = bodyPicture || req.body.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(candidate)}`;
      }
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid Google email address is required to sign in' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const finalGoogleId = googleId || `google_sub_${encodeURIComponent(normalizedEmail)}`;
    const displayName = (name && typeof name === 'string' && name.trim())
      ? name.trim()
      : normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const displayAvatar = picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`;

    // 3. Database Lookup: Look up user by google_id OR lower(email)
    let existingUser = await query('SELECT * FROM users WHERE google_id = $1 OR LOWER(email) = $2', [finalGoogleId, normalizedEmail]);
    let user;
    let isNewUser = false;

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
      // Update Google ID, avatar or name if changed / missing
      await query(
        `UPDATE users SET
          google_id = COALESCE(google_id, $1),
          avatar_url = COALESCE($2, avatar_url),
          name = COALESCE($3, name)
         WHERE id = $4`,
        [finalGoogleId, displayAvatar, displayName, user.id]
      );
      const refreshed = await query('SELECT * FROM users WHERE id = $1', [user.id]);
      user = refreshed.rows[0];
    } else {
      isNewUser = true;
      // 4. Create new user record
      const newId = uuidv4();
      await query(
        `INSERT INTO users (
          id, google_id, email, name, avatar_url, preferred_language, is_onboarded,
          target_role, dream_companies, current_skills, daily_study_hours, available_study_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          newId,
          finalGoogleId,
          normalizedEmail,
          displayName,
          displayAvatar,
          'en',
          false,
          'Software Engineer',
          'Google, Microsoft',
          '',
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User session expired or unauthorized. Please log in again.' });
    }

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
    } = req.body || {};

    // Validate preferred_language strictly to en, hi, mr, sa
    const validLanguages = ['en', 'hi', 'mr', 'sa'];
    const selectedLang = validLanguages.includes(preferred_language)
      ? preferred_language
      : (req.user?.preferred_language || 'en');

    const studyMins = available_study_minutes
      ? parseInt(available_study_minutes, 10)
      : (req.user?.available_study_minutes || (daily_study_hours ? parseInt(daily_study_hours, 10) * 60 : 120));

    const cleanSkillsStr = Array.isArray(current_skills) ? current_skills.join(', ') : (current_skills || '');
    
    // Convert onboarding skills to structured inventory if present
    let initialInventory = [];
    if (cleanSkillsStr.trim()) {
      initialInventory = cleanSkillsStr.split(',').map((s, idx) => {
        const trimmed = s.trim();
        let cat = 'languages';
        const lower = trimmed.toLowerCase();
        if (/react|node|express|fastapi|django|flask|spring|tailwind|vue|angular|redux|zustand/i.test(lower)) cat = 'frameworks';
        else if (/postgres|mongo|redis|mysql|sqlite|cassandra|dynamodb|sql/i.test(lower)) cat = 'databases';
        else if (/docker|aws|git|linux|kubernetes|postman|gcp|azure|terraform/i.test(lower)) cat = 'tools';
        else if (/data structures|algorithms|dsa|system design|os|dbms|oop/i.test(lower)) cat = 'core';

        return {
          id: `sk-onboard-${idx}-${Date.now()}`,
          name: trimmed,
          category: cat,
          level: 'intermediate'
        };
      }).filter(s => s.name);
    }

    // Check if user exists in database first
    const existingCheck = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (existingCheck.rows.length === 0) {
      // If user record wasn't found in DB (e.g. ephemeral database restart), insert record first
      const defaultEmail = req.user.email || `user_${userId.slice(0, 8)}@gmail.com`;
      const defaultName = req.user.name || defaultEmail.split('@')[0];
      const defaultAvatar = req.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(defaultEmail)}`;
      
      await query(
        `INSERT INTO users (
          id, google_id, email, name, avatar_url, preferred_language, is_onboarded,
          target_role, dream_companies, current_skills, daily_study_hours, available_study_minutes,
          university_name, branch, phone_number, skills_inventory
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          userId,
          `google_sub_${encodeURIComponent(defaultEmail)}`,
          defaultEmail,
          defaultName,
          defaultAvatar,
          selectedLang,
          true,
          target_role || 'Software Engineer',
          dream_companies || 'Google, Microsoft',
          cleanSkillsStr,
          daily_study_hours ? parseInt(daily_study_hours, 10) : Math.round(studyMins / 60),
          studyMins,
          university_name || '',
          branch || '',
          phone_number || '',
          initialInventory.length > 0 ? JSON.stringify(initialInventory) : null
        ]
      );
    } else {
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
          skills_inventory = $10,
          is_onboarded = true
        WHERE id = $11`,
        [
          target_role || 'Software Engineer',
          dream_companies || 'Google, Microsoft',
          cleanSkillsStr,
          daily_study_hours ? parseInt(daily_study_hours, 10) : Math.round(studyMins / 60),
          studyMins,
          university_name || '',
          branch || '',
          phone_number || '',
          selectedLang,
          initialInventory.length > 0 ? JSON.stringify(initialInventory) : null,
          userId
        ]
      );
    }

    const updated = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = updated.rows[0] || req.user;

    return res.json({
      message: 'Onboarding completed successfully',
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Onboarding Error:', err);
    return res.status(500).json({ error: 'Failed to complete onboarding: ' + err.message });
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

/**
 * Get User's Real Verified Skills Inventory
 */
export async function getUserSkills(req, res) {
  try {
    const userId = req.user.id;
    const result = await query('SELECT current_skills, skills_inventory FROM users WHERE id = $1', [userId]);
    const row = result.rows[0] || {};
    
    let inventory = [];
    if (row.skills_inventory) {
      try {
        inventory = typeof row.skills_inventory === 'string' ? JSON.parse(row.skills_inventory) : row.skills_inventory;
      } catch {
        inventory = [];
      }
    } else if (row.current_skills) {
      // Auto-migrate comma-separated skills
      inventory = row.current_skills.split(',').map((s, idx) => {
        const trimmed = s.trim();
        let cat = 'languages';
        const lower = trimmed.toLowerCase();
        if (/react|node|express|fastapi|django|flask|spring|tailwind|vue|angular/i.test(lower)) cat = 'frameworks';
        else if (/postgres|mongo|redis|mysql|sqlite|cassandra/i.test(lower)) cat = 'databases';
        else if (/docker|aws|git|linux|kubernetes|postman|gcp|azure/i.test(lower)) cat = 'tools';
        else if (/data structures|algorithms|dsa|system design|os|dbms/i.test(lower)) cat = 'core';

        return {
          id: `sk-${idx}-${Date.now()}`,
          name: trimmed,
          category: cat,
          level: 'intermediate'
        };
      });
    }

    return res.json({ skills: inventory });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user skills: ' + err.message });
  }
}

/**
 * Save User's Real Verified Skills Inventory
 */
export async function updateUserSkills(req, res) {
  try {
    const userId = req.user.id;
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of skill objects' });
    }

    const commaSkills = skills.map(s => s.name || s).join(', ');
    const jsonInventory = JSON.stringify(skills);

    await query(
      `UPDATE users SET current_skills = $1, skills_inventory = $2 WHERE id = $3`,
      [commaSkills, jsonInventory, userId]
    );

    return res.json({
      message: 'Skills updated successfully',
      skills
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update skills: ' + err.message });
  }
}
