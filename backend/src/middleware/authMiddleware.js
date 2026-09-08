import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'careerpilot-ai-super-secret-key-2026';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let userRes = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);

    // Self-healing: If user record is missing in DB (e.g. SQLite database reset on Render restart),
    // restore the user record automatically using the cryptographically verified JWT payload
    if (userRes.rows.length === 0 && decoded && (decoded.id || decoded.email)) {
      try {
        const userEmail = decoded.email || `student_${decoded.id.slice(0, 8)}@careerpilot.ai`;
        const userName = decoded.name || userEmail.split('@')[0] || 'CareerPilot Student';
        
        // Check if user already exists under the same email
        const byEmail = await query('SELECT * FROM users WHERE email = $1', [userEmail]);
        if (byEmail.rows.length > 0) {
          userRes = byEmail;
        } else {
          const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userEmail)}`;
          await query(
            `INSERT INTO users (
              id, google_id, email, name, avatar_url, preferred_language, is_onboarded,
              target_role, daily_study_hours, available_study_minutes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              decoded.id,
              `recovered_${decoded.id}`,
              userEmail,
              userName,
              defaultAvatar,
              'en',
              true,
              'Software Engineer',
              2,
              120
            ]
          );
          userRes = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        }
      } catch (recoveryErr) {
        console.warn('Session auto-recovery notice:', recoveryErr.message);
      }
    }

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User session expired or not found in database. Please log in again.' });
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}
