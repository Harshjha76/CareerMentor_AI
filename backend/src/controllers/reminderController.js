import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { 
  sendEmailReminder, 
  sendAutomatedEmail, 
  getUserEmailPreferences, 
  checkEmailCooldown 
} from '../services/emailService.js';
import { 
  generateLocalizedReminder, 
  generate2HourCheckinReminder, 
  generateGoalInconsistencyEmail,
  generateWelcomeEmail,
  generateGoalCreatedEmail,
  generateMilestoneProgressEmail
} from '../services/aiService.js';
import { runSchedulerManualCheck } from '../services/emailScheduler.js';

/**
 * Get student's email preferences & consent state
 */
export async function getEmailPreferences(req, res) {
  try {
    const userId = req.user.id;
    const prefs = await getUserEmailPreferences(userId);
    return res.json({ preferences: prefs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch email preferences: ' + err.message });
  }
}

/**
 * Update student's email preferences
 */
export async function updateEmailPreferences(req, res) {
  try {
    const userId = req.user.id;
    const { 
      consent_granted, 
      welcome_enabled, 
      goal_enabled, 
      reminder_enabled, 
      progress_enabled 
    } = req.body;

    const existing = await query('SELECT * FROM email_preferences WHERE user_id = $1', [userId]);
    const now = new Date().toISOString();

    if (existing.rows.length > 0) {
      await query(
        `UPDATE email_preferences SET
          consent_granted = COALESCE($1, consent_granted),
          welcome_enabled = COALESCE($2, welcome_enabled),
          goal_enabled = COALESCE($3, goal_enabled),
          reminder_enabled = COALESCE($4, reminder_enabled),
          progress_enabled = COALESCE($5, progress_enabled),
          updated_at = $6
        WHERE user_id = $7`,
        [
          consent_granted !== undefined ? !!consent_granted : null,
          welcome_enabled !== undefined ? !!welcome_enabled : null,
          goal_enabled !== undefined ? !!goal_enabled : null,
          reminder_enabled !== undefined ? !!reminder_enabled : null,
          progress_enabled !== undefined ? !!progress_enabled : null,
          now,
          userId
        ]
      );
    } else {
      await query(
        `INSERT INTO email_preferences (
          user_id, consent_granted, welcome_enabled, goal_enabled, reminder_enabled, progress_enabled, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          consent_granted !== undefined ? !!consent_granted : true,
          welcome_enabled !== undefined ? !!welcome_enabled : true,
          goal_enabled !== undefined ? !!goal_enabled : true,
          reminder_enabled !== undefined ? !!reminder_enabled : true,
          progress_enabled !== undefined ? !!progress_enabled : true,
          now
        ]
      );
    }

    // Also update users.email_notifications_enabled for backward compatibility
    if (consent_granted !== undefined) {
      await query(
        `UPDATE users SET email_notifications_enabled = $1, email_consent_granted_at = $2 WHERE id = $3`,
        [!!consent_granted, consent_granted ? now : null, userId]
      );
    }

    const updated = await getUserEmailPreferences(userId);
    return res.json({
      message: 'Email preferences updated successfully',
      preferences: updated
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update email preferences: ' + err.message });
  }
}

/**
 * Grant Email Consent & Immediately Dispatch Personalized AI Welcome & Greeting Email
 */
export async function grantEmailConsent(req, res) {
  try {
    const user = req.user;
    const userId = user.id;
    const now = new Date().toISOString();

    // 1. Update preferences table
    const existing = await query('SELECT * FROM email_preferences WHERE user_id = $1', [userId]);
    if (existing.rows.length > 0) {
      await query(
        `UPDATE email_preferences SET consent_granted = TRUE, updated_at = $1 WHERE user_id = $2`,
        [now, userId]
      );
    } else {
      await query(
        `INSERT INTO email_preferences (user_id, consent_granted, welcome_enabled, goal_enabled, reminder_enabled, progress_enabled, updated_at)
         VALUES ($1, TRUE, TRUE, TRUE, TRUE, TRUE, $2)`,
        [userId, now]
      );
    }

    // Update users table
    await query(
      `UPDATE users SET email_notifications_enabled = TRUE, email_consent_granted_at = $1 WHERE id = $2`,
      [now, userId]
    );

    // 2. Generate personalized AI Welcome Email
    const welcomeData = await generateWelcomeEmail({
      userName: user.name || 'Engineer',
      targetRole: user.target_role || 'Software Engineer',
      dreamCompanies: user.dream_companies || 'Google, Microsoft, Amazon',
      skills: user.current_skills || 'Full Stack Engineering',
      language: user.preferred_language || 'en'
    });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #1e293b; border-radius: 16px; background: #0b1220; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.4);">
            ✨ EMAIL ACCESS GRANTED & ACTIVATED
          </span>
          <h1 style="color: #ffffff; margin: 18px 0 6px 0; font-size: 22px;">
            ${welcomeData.greeting || `Welcome to CareerMentor AI, ${user.name}!`}
          </h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Your autonomous 24/7 senior career mentor is ready</p>
        </div>

        <div style="background: #111c30; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6; margin: 0 0 14px 0;">${welcomeData.intro}</p>
          
          <h3 style="color: #60a5fa; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">🚀 Recommended 3 Action Steps:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.8;">
            ${(welcomeData.next_steps || []).map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="http://localhost:5173/what-i-know" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff; padding: 12px 30px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Verify Real Knowledge Base ⚡
          </a>
          <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">
            🔒 Safe Send-Only Access: We NEVER read or scan your personal inbox.
          </p>
        </div>
      </div>
    `;

    // 3. Dispatch welcome email directly to user's email
    const emailResult = await sendEmailReminder({
      toEmail: user.email,
      subject: welcomeData.subject || `Welcome to CareerMentor AI - Your Roadmap to ${user.target_role || 'Software Engineer'}`,
      textContent: welcomeData.plain_text || welcomeData.intro,
      htmlContent,
      userId,
      emailType: 'welcome'
    });

    return res.json({
      success: true,
      message: `✅ Email access granted and welcome greeting dispatched to ${user.email}`,
      email: user.email,
      emailResult,
      welcomeData
    });
  } catch (err) {
    console.error('Grant Email Consent Error:', err);
    return res.status(500).json({ error: 'Failed to grant consent and dispatch welcome email: ' + err.message });
  }
}

/**
 * Get User's Email Delivery & Audit History
 */
export async function getEmailHistory(req, res) {
  try {
    const userId = req.user.id;
    const history = await query(
      `SELECT * FROM email_logs WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 25`,
      [userId]
    );
    return res.json({ history: history.rows || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch email history: ' + err.message });
  }
}

/**
 * Trigger / Test Personalized AI Welcome Email
 */
export async function sendWelcomeEmailManual(req, res) {
  try {
    const user = req.user;
    const welcomeData = await generateWelcomeEmail({
      userName: user.name || 'Candidate',
      targetRole: user.target_role || 'Software Engineer',
      dreamCompanies: user.dream_companies || 'Google, Microsoft',
      skills: user.current_skills || 'Tech Stack',
      language: user.preferred_language || 'en'
    });

    const emailResult = await sendAutomatedEmail({
      userId: user.id,
      toEmail: user.email,
      emailType: 'welcome',
      subject: welcomeData.subject,
      textContent: welcomeData.plain_text || welcomeData.intro,
      force: true
    });

    return res.json({
      success: true,
      message: `Welcome email dispatched to ${user.email}`,
      emailResult,
      welcomeData
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send welcome email: ' + err.message });
  }
}

/**
 * Trigger / Test Goal Confirmation Email
 */
export async function sendGoalEmailManual(req, res) {
  try {
    const user = req.user;
    const goalData = await generateGoalCreatedEmail({
      userName: user.name || 'Candidate',
      goalDescription: req.body.goal_description || 'Master Data Structures and Backend Architecture',
      targetDate: req.body.target_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      subtasks: req.body.subtasks || ['Day 1: Array & HashMaps', 'Day 2: Two Pointer technique', 'Day 3: Sliding Window'],
      targetRole: user.target_role || 'Software Engineer',
      language: user.preferred_language || 'en'
    });

    const emailResult = await sendAutomatedEmail({
      userId: user.id,
      toEmail: user.email,
      emailType: 'goal',
      subject: goalData.subject,
      textContent: goalData.plain_text || goalData.mentor_advice,
      force: true
    });

    return res.json({
      success: true,
      message: `Goal confirmation email dispatched to ${user.email}`,
      emailResult,
      goalData
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send goal email: ' + err.message });
  }
}

/**
 * Trigger / Test Inconsistency Recovery Email
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
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px 24px; border: 1px solid #334155; border-radius: 16px; background: #0b1220; color: #f8fafc;">
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

        <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 16px 18px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #fbbf24; font-weight: 600; margin: 0 0 4px 0;">⚠️ Inactivity Detected</p>
          <p style="font-size: 14px; color: #e2e8f0; line-height: 1.5; margin: 0;">${aiNudge.inconsistency_diagnosis}</p>
        </div>

        <div style="background: #111c30; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="color: #60a5fa; margin: 0 0 10px 0; font-size: 15px; font-weight: 600;">🎯 AI Mentor Note</h3>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 14px 0;">${aiNudge.motivation_message}</p>
          
          <div style="background: rgba(59, 130, 246, 0.15); border: 1px dashed rgba(59, 130, 246, 0.5); padding: 12px 14px; border-radius: 8px;">
            <span style="color: #93c5fd; font-weight: 700; font-size: 13px;">⚡ Quick Action Step Today:</span>
            <p style="color: #ffffff; font-size: 14px; margin: 4px 0 0 0; font-weight: 500;">${aiNudge.quick_action_step}</p>
          </div>
        </div>

        ${(aiNudge.pending_tasks_summary && aiNudge.pending_tasks_summary.length > 0) ? `
          <div style="margin-bottom: 24px;">
            <h4 style="color: #94a3b8; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; margin: 0 0 10px 0;">Immediate High-Yield Tasks Waiting:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 14px; line-height: 1.7;">
              ${aiNudge.pending_tasks_summary.map(t => `<li style="margin-bottom: 4px;">${t}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #1e293b;">
          <a href="http://localhost:5173/roadmap" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 13px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
            Resume Career Prep & Clear Task ⚡
          </a>
          <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">
            Sent autonomously by CareerMentor AI to ${user.email}
          </p>
        </div>
      </div>
    `;

    // 5. Send email via automated handler
    const emailResult = await sendAutomatedEmail({
      userId: user.id,
      toEmail: user.email,
      emailType: 'inactivity',
      subject: aiNudge.subject,
      textContent: aiNudge.plain_text || aiNudge.motivation_message,
      htmlContent,
      force: true // manual trigger bypasses cooldown
    });

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
 * Trigger background scheduler manually on demand
 */
export async function triggerSchedulerNow(req, res) {
  try {
    const report = await runSchedulerManualCheck();
    return res.json({ message: 'AI Background Scheduler check completed', report });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to execute scheduler: ' + err.message });
  }
}

/**
 * Send standard test reminder
 */
export async function sendTestReminder(req, res) {
  try {
    const user = req.user;
    const language = user.preferred_language || 'en';

    const pendingTasks = await query(
      `SELECT COUNT(*) as count FROM roadmap_tasks rt
       JOIN roadmaps r ON rt.roadmap_id = r.id
       WHERE r.user_id = $1 AND rt.is_completed = FALSE`,
      [user.id]
    );

    const count = parseInt(pendingTasks.rows[0]?.count || '2', 10);
    const { subject, body } = generateLocalizedReminder(user.name, count, language);

    const emailRes = await sendAutomatedEmail({
      userId: user.id,
      toEmail: user.email,
      emailType: 'reminder',
      subject,
      textContent: body,
      force: true
    });

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
 * Get student's consistency health & pending tasks metrics
 */
export async function getInconsistencyStatus(req, res) {
  try {
    const userId = req.user.id;

    const [goalsRes, tasksRes, recentReminders, prefs] = await Promise.all([
      query(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM goals WHERE user_id = $1`, [userId]),
      query(`SELECT COUNT(*) as total_tasks, SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as done_tasks FROM roadmap_tasks rt JOIN roadmaps r ON rt.roadmap_id = r.id WHERE r.user_id = $1`, [userId]),
      query(`SELECT * FROM email_logs WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 5`, [userId]),
      getUserEmailPreferences(userId)
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
      consent_granted: prefs.consent_granted,
      preferences: prefs,
      recentReminders: recentReminders.rows || []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute consistency status: ' + err.message });
  }
}

export async function simulate2HourCheckin(req, res) {
  try {
    const user = req.user;
    const language = user.preferred_language || 'en';

    const pendingTasks = await query(
      `SELECT COUNT(*) as count FROM roadmap_tasks rt
       JOIN roadmaps r ON rt.roadmap_id = r.id
       WHERE r.user_id = $1 AND rt.is_completed = FALSE`,
      [user.id]
    );

    const count = parseInt(pendingTasks.rows[0]?.count || '3', 10);
    const checkin = generate2HourCheckinReminder(user.name, count, language);

    const emailRes = await sendAutomatedEmail({
      userId: user.id,
      toEmail: user.email,
      emailType: 'reminder',
      subject: checkin.subject,
      textContent: checkin.body,
      force: true
    });

    return res.json({
      message: '2-Hour Agent check-in triggered',
      title: checkin.title,
      subject: checkin.subject,
      body: checkin.body,
      language,
      pendingCount: count,
      providerResult: emailRes,
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
      `SELECT * FROM email_logs WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 20`,
      [userId]
    );
    return res.json({ reminders: reminders.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch reminders' });
  }
}

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

    await query(
      `UPDATE email_preferences SET consent_granted = $1, updated_at = $2 WHERE user_id = $3`,
      [isEnabled, now, userId]
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
