import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { sendEmailReminder } from '../services/emailService.js';
import { generateLocalizedReminder } from '../services/aiService.js';

export async function sendTestReminder(req, res) {
  try {
    const user = req.user;
    const language = user.preferred_language || 'en';

    // Count pending roadmap tasks
    const pendingTasks = await query(
      `SELECT COUNT(*) as count FROM roadmap_tasks rt
       JOIN roadmaps r ON rt.roadmap_id = r.id
       WHERE r.user_id = $1 AND rt.is_completed = FALSE`,
      [user.id]
    );

    const count = parseInt(pendingTasks.rows[0]?.count || '2', 10);
    const { subject, body } = generateLocalizedReminder(user.name, count, language);

    const emailRes = await sendEmailReminder({
      toEmail: user.email,
      subject,
      textContent: body,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #1E3A8A; margin: 0;">CareerPilot AI</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">24/7 Intelligent Career Guidance</p>
          </div>
          <div style="background: #f3f4f6; padding: 18px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0;">${body}</p>
          </div>
          <div style="text-align: center;">
            <a href="http://localhost:5173/planner" style="display: inline-block; background: #7C3AED; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Open Career Study Planner
            </a>
          </div>
        </div>
      `
    });

    // Record reminder in database
    const reminderId = uuidv4();
    await query(
      `INSERT INTO reminders (id, user_id, reminder_text, scheduled_time, is_sent, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [reminderId, user.id, body, new Date().toISOString(), true, new Date().toISOString()]
    );

    return res.json({
      message: 'Reminder notification dispatched successfully',
      to: user.email,
      subject,
      body,
      language,
      providerResult: emailRes
    });
  } catch (err) {
    console.error('Reminder error:', err);
    return res.status(500).json({ error: 'Failed to send reminder: ' + err.message });
  }
}

export async function getReminders(req, res) {
  try {
    const userId = req.user.id;
    const reminders = await query(
      `SELECT * FROM reminders WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 20`,
      [userId]
    );
    return res.json({ reminders: reminders.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch reminders' });
  }
}
