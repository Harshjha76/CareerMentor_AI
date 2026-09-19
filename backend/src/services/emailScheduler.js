import { query } from '../config/db.js';
import { sendAutomatedEmail, checkEmailCooldown, getUserEmailPreferences } from './emailService.js';
import { generateGoalInconsistencyEmail } from './aiService.js';

let schedulerInterval = null;

/**
 * Scan active users and dispatch automated consistency & recovery emails
 */
export async function runSchedulerManualCheck() {
  console.log('⏰ [AI Email Scheduler] Running automated student consistency check...');
  const results = {
    checkedUsers: 0,
    emailsDispatched: 0,
    skipped: 0,
    errors: []
  };

  try {
    // 1. Fetch all onboarded users with email notifications enabled
    const usersRes = await query(
      `SELECT u.id, u.email, u.name, u.target_role, u.preferred_language, u.email_notifications_enabled
       FROM users u
       WHERE u.email IS NOT NULL AND u.email != ''`
    );

    const users = usersRes.rows || [];
    results.checkedUsers = users.length;

    for (const user of users) {
      try {
        const userId = user.id;

        // Check user preferences
        const prefs = await getUserEmailPreferences(userId);
        if (!prefs.consent_granted || !prefs.reminder_enabled) {
          results.skipped++;
          continue;
        }

        // Check cooldown (18 hours minimum between automated reminders)
        const cooldown = await checkEmailCooldown(userId, 'inactivity', 18);
        if (!cooldown.canSend) {
          results.skipped++;
          continue;
        }

        // Check pending tasks
        const tasksRes = await query(
          `SELECT rt.id, rt.task_description, rt.week_number, rt.day_number
           FROM roadmap_tasks rt
           JOIN roadmaps r ON rt.roadmap_id = r.id
           WHERE r.user_id = $1 AND rt.is_completed = FALSE
           ORDER BY rt.week_number ASC, rt.day_number ASC LIMIT 3`,
          [userId]
        );

        // Check recent task completions
        const recentActivity = await query(
          `SELECT completed_at FROM roadmap_tasks rt
           JOIN roadmaps r ON rt.roadmap_id = r.id
           WHERE r.user_id = $1 AND rt.is_completed = TRUE
           ORDER BY rt.completed_at DESC LIMIT 1`,
          [userId]
        );

        const lastActivityDate = recentActivity.rows[0]?.completed_at 
          ? new Date(recentActivity.rows[0].completed_at).getTime() 
          : 0;

        const hoursSinceLastTask = (Date.now() - lastActivityDate) / (1000 * 60 * 60);

        // If inactive for > 24 hours and has pending tasks
        if (tasksRes.rows.length > 0 && hoursSinceLastTask > 24) {
          const goalsRes = await query(
            `SELECT * FROM goals WHERE user_id = $1 AND status != 'completed' LIMIT 2`,
            [userId]
          );

          const aiNudge = await generateGoalInconsistencyEmail({
            userName: user.name || 'Candidate',
            targetRole: user.target_role || 'Software Engineer',
            goals: goalsRes.rows || [],
            pendingTasks: tasksRes.rows || [],
            streakDays: 0,
            inactiveDays: Math.min(Math.round(hoursSinceLastTask / 24), 7),
            language: user.preferred_language || 'en'
          });

          const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #1e293b; border-radius: 16px; background: #0b1220; color: #f8fafc;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="background: rgba(239, 68, 68, 0.15); color: #f87171; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.4);">
                  ⚡ AUTONOMOUS AI MENTOR CHECK-IN
                </span>
                <h2 style="color: #ffffff; margin: 16px 0 6px 0; font-size: 20px;">
                  ${aiNudge.headline || `Let's protect your study streak, ${user.name}!`}
                </h2>
              </div>
              <div style="background: #111c30; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 12px 0;">${aiNudge.motivation_message}</p>
                <div style="background: rgba(59, 130, 246, 0.15); border: 1px dashed rgba(59, 130, 246, 0.4); padding: 12px; border-radius: 8px;">
                  <strong style="color: #93c5fd; font-size: 13px;">⚡ 15-Minute Action Step:</strong>
                  <p style="color: #ffffff; font-size: 13px; margin: 4px 0 0 0;">${aiNudge.quick_action_step}</p>
                </div>
              </div>
              <div style="text-align: center;">
                <a href="http://localhost:5173/roadmap" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
                  Resume Study Roadmap 🚀
                </a>
              </div>
            </div>
          `;

          const sendRes = await sendAutomatedEmail({
            userId,
            toEmail: user.email,
            emailType: 'inactivity',
            subject: aiNudge.subject || `Stay on track with your ${user.target_role || 'Engineering'} goals`,
            textContent: aiNudge.plain_text || aiNudge.motivation_message,
            htmlContent
          });

          if (sendRes.success) {
            results.emailsDispatched++;
          }
        }
      } catch (userErr) {
        results.errors.push({ userId: user.id, error: userErr.message });
      }
    }
  } catch (err) {
    console.error('Scheduler execution error:', err);
    results.errors.push({ global: err.message });
  }

  console.log(`⏰ [AI Email Scheduler] Finished run: ${results.emailsDispatched} sent, ${results.skipped} skipped.`);
  return results;
}

/**
 * Start the recurring background cron/interval (Runs every 4 hours)
 */
export function startEmailScheduler() {
  if (schedulerInterval) return;

  // Run initial check after 30 seconds
  setTimeout(() => {
    runSchedulerManualCheck();
  }, 30000);

  // Set recurring interval: 4 hours (4 * 60 * 60 * 1000 ms)
  const INTERVAL_MS = 4 * 60 * 60 * 1000;
  schedulerInterval = setInterval(() => {
    runSchedulerManualCheck();
  }, INTERVAL_MS);

  console.log('🤖 CareerMentor AI Email Background Scheduler started (4h interval)');
}
