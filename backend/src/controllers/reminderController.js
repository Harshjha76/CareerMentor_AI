import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { sendEmailReminder } from '../services/emailService.js';
import { generateLocalizedReminder, generate2HourCheckinReminder, generateGoalInconsistencyEmail } from '../services/aiService.js';

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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #1e293b; border-radius: 16px; background: #0b1220; color: #f8fafc;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; border: 1px solid rgba(59, 130, 246, 0.4);">
              CareerMentor AI 24/7
            </span>
            <h2 style="color: #ffffff; margin: 16px 0 6px 0; font-size: 22px;">Daily Study Progress Reminder</h2>
            <p style="color: #94a3b8; font-size: 14px; margin: 0;">Stay committed to your tech career roadmap</p>
          </div>
          <div style="background: #111c30; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6; margin: 0;">${body}</p>
          </div>
          <div style="text-align: center;">
            <a href="http://localhost:5173/planner" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);">
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

/**
 * Autonomous AI Inconsistency & Goal Dropout Guardian Email Dispatcher
 */
export async function sendInconsistencyNudge(req, res) {
  try {
    const user = req.user;
    const language = user.preferred_language || 'en';

    // 1. Fetch active goals
    const goalsRes = await query(
      `SELECT * FROM goals WHERE user_id = $1 AND status != 'completed' ORDER BY target_date ASC LIMIT 3`,
      [user.id]
    );

    // 2. Fetch pending roadmap tasks
    const tasksRes = await query(
      `SELECT rt.id, rt.task_description, rt.week_number, rt.day_number
       FROM roadmap_tasks rt
       JOIN roadmaps r ON rt.roadmap_id = r.id
       WHERE r.user_id = $1 AND rt.is_completed = FALSE
       ORDER BY rt.week_number ASC, rt.day_number ASC LIMIT 4`,
      [user.id]
    );

    const goals = goalsRes.rows || [];
    const pendingTasks = tasksRes.rows || [];

    // 3. Generate tailored AI Nudge
    const aiNudge = await generateGoalInconsistencyEmail({
      userName: user.name || 'Candidate',
      targetRole: user.target_role || 'Software Engineer',
      goals,
      pendingTasks,
      streakDays: 0,
      inactiveDays: 2,
      language
    });

    // 4. Construct high-impact email HTML template
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px 24px; border: 1px solid #334155; border-radius: 16px; background: #0b1220; color: #f8fafc;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background: rgba(239, 68, 68, 0.15); color: #f87171; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.4); display: inline-block;">
            ⚡ AI ACCOUNTABILITY GUARDIAN
          </span>
          <h1 style="color: #ffffff; margin: 16px 0 8px 0; font-size: 22px; line-height: 1.3;">
            ${aiNudge.headline || `Let's Get Back on Track with Your ${user.target_role || 'Software Engineer'} Goal!`}
          </h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">
            Personalized Consistency Nudge for <strong>${user.name}</strong>
          </p>
        </div>

        <!-- Inconsistency Alert Box -->
        <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 16px 18px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #fbbf24; font-weight: 600; margin: 0 0 4px 0;">⚠️ Inactivity Detected</p>
          <p style="font-size: 14px; color: #e2e8f0; line-height: 1.5; margin: 0;">${aiNudge.inconsistency_diagnosis}</p>
        </div>

        <!-- Motivation & Action Step -->
        <div style="background: #111c30; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="color: #60a5fa; margin: 0 0 10px 0; font-size: 15px; font-weight: 600;">🎯 AI Mentor Note</h3>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 14px 0;">${aiNudge.motivation_message}</p>
          
          <div style="background: rgba(59, 130, 246, 0.15); border: 1px dashed rgba(59, 130, 246, 0.5); padding: 12px 14px; border-radius: 8px;">
            <span style="color: #93c5fd; font-weight: 700; font-size: 13px;">⚡ Quick Action Step Today:</span>
            <p style="color: #ffffff; font-size: 14px; margin: 4px 0 0 0; font-weight: 500;">${aiNudge.quick_action_step}</p>
          </div>
        </div>

        <!-- Pending Tasks -->
        ${(aiNudge.pending_tasks_summary && aiNudge.pending_tasks_summary.length > 0) ? `
          <div style="margin-bottom: 24px;">
            <h4 style="color: #94a3b8; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; margin: 0 0 10px 0;">Immediate High-Yield Tasks Waiting:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 14px; line-height: 1.7;">
              ${aiNudge.pending_tasks_summary.map(t => `<li style="margin-bottom: 4px;">${t}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- CTA Button -->
        <div style="text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #1e293b;">
          <a href="http://localhost:5173/goals" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 13px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
            Resume Career Prep & Clear Goal ⚡
          </a>
          <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">
            Sent autonomously by CareerMentor AI Accountability Engine to ${user.email}
          </p>
        </div>
      </div>
    `;

    // 5. Send email via transporter
    const emailResult = await sendEmailReminder({
      toEmail: user.email,
      subject: aiNudge.subject,
      textContent: aiNudge.plain_text || aiNudge.motivation_message,
      htmlContent
    });

    // 6. Record in reminders history
    const reminderId = uuidv4();
    await query(
      `INSERT INTO reminders (id, user_id, reminder_text, scheduled_time, is_sent, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [reminderId, user.id, `[AI Inconsistency Nudge] ${aiNudge.subject}: ${aiNudge.quick_action_step}`, new Date().toISOString(), true, new Date().toISOString()]
    );

    return res.json({
      success: true,
      message: `Accountability AI Nudge email sent to ${user.email}`,
      recipient: user.email,
      nudge: aiNudge,
      emailResult,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Inconsistency Nudge Error:', err);
    return res.status(500).json({ error: 'Failed to dispatch inconsistency email: ' + err.message });
  }
}

/**
 * Get student's consistency health & pending tasks metrics
 */
export async function getInconsistencyStatus(req, res) {
  try {
    const userId = req.user.id;

    const [goalsRes, tasksRes, recentReminders] = await Promise.all([
      query(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM goals WHERE user_id = $1`, [userId]),
      query(`SELECT COUNT(*) as total_tasks, SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as done_tasks FROM roadmap_tasks rt JOIN roadmaps r ON rt.roadmap_id = r.id WHERE r.user_id = $1`, [userId]),
      query(`SELECT * FROM reminders WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 5`, [userId])
    ]);

    const totalGoals = parseInt(goalsRes.rows[0]?.total || '0', 10);
    const completedGoals = parseInt(goalsRes.rows[0]?.completed || '0', 10);
    const totalTasks = parseInt(tasksRes.rows[0]?.total_tasks || '0', 10);
    const doneTasks = parseInt(tasksRes.rows[0]?.done_tasks || '0', 10);
    const pendingTasks = Math.max(0, totalTasks - doneTasks);

    const taskCompletionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 65;
    const consistencyScore = Math.min(100, Math.max(30, taskCompletionRate));

    return res.json({
      consistencyScore,
      totalGoals,
      completedGoals,
      totalTasks,
      doneTasks,
      pendingTasks: pendingTasks || 3,
      isConsistent: consistencyScore >= 70,
      recentReminders: recentReminders.rows || []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute consistency status: ' + err.message });
  }
}

/**
 * 2-Hour Autonomous AI Agent Study Check-in Simulator
 */
export async function simulate2HourCheckin(req, res) {
  try {
    const user = req.user;
    const language = user.preferred_language || 'en';

    // Fetch count of pending tasks
    const pendingTasks = await query(
      `SELECT COUNT(*) as count FROM roadmap_tasks rt
       JOIN roadmaps r ON rt.roadmap_id = r.id
       WHERE r.user_id = $1 AND rt.is_completed = FALSE`,
      [user.id]
    );

    const count = parseInt(pendingTasks.rows[0]?.count || '3', 10);
    const checkin = generate2HourCheckinReminder(user.name, count, language);

    // Send email or log notification
    await sendEmailReminder({
      toEmail: user.email,
      subject: checkin.subject,
      textContent: checkin.body
    });

    // Save in reminders log
    const reminderId = uuidv4();
    await query(
      `INSERT INTO reminders (id, user_id, reminder_text, scheduled_time, is_sent, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [reminderId, user.id, checkin.body, new Date().toISOString(), true, new Date().toISOString()]
    );

    return res.json({
      message: '2-Hour Agent check-in triggered',
      title: checkin.title,
      subject: checkin.subject,
      body: checkin.body,
      language,
      pendingCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('2-Hour Check-in Error:', err);
    return res.status(500).json({ error: 'Failed to trigger 2-hour checkin: ' + err.message });
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

/**
 * Update user's explicit email consistency permission (Send-only access)
 */
export async function updateEmailPermission(req, res) {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;
    const isEnabled = enabled !== false;
    const now = new Date().toISOString();

    await query(
      `UPDATE users 
       SET email_notifications_enabled = $1, email_consent_granted_at = $2 
       WHERE id = $3`,
      [isEnabled, isEnabled ? now : null, userId]
    );

    return res.json({
      success: true,
      email_notifications_enabled: isEnabled,
      email_consent_granted_at: isEnabled ? now : null,
      message: isEnabled 
        ? '✅ Email consistency guardian access granted (Send-only enabled).' 
        : '⏸️ Email consistency notifications paused.'
    });
  } catch (err) {
    console.error('Error updating email permission:', err);
    return res.status(500).json({ error: 'Failed to update email permission: ' + err.message });
  }
}

