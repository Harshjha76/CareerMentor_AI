import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { breakDownGoalWithAI } from '../services/aiService.js';

export async function getGoals(req, res) {
  try {
    const userId = req.user.id;
    const goalsRes = await query(
      `SELECT * FROM goals WHERE user_id = $1 ORDER BY target_date ASC, id DESC`,
      [userId]
    );

    const goals = goalsRes.rows.map(g => {
      let subtasks = [];
      try {
        if (g.ai_subtasks) {
          subtasks = typeof g.ai_subtasks === 'string' ? JSON.parse(g.ai_subtasks) : g.ai_subtasks;
        }
      } catch {
        subtasks = [];
      }
      return {
        ...g,
        subtasks
      };
    });

    return res.json({ goals });
  } catch (err) {
    console.error('Get Goals error:', err);
    return res.status(500).json({ error: 'Failed to fetch goals' });
  }
}

export async function createGoal(req, res) {
  try {
    const userId = req.user.id;
    const { goal_description, target_date } = req.body;
    const language = req.user.preferred_language || 'en';

    if (!goal_description) {
      return res.status(400).json({ error: 'Goal description is required' });
    }

    // Auto-generate subtasks with AI in user's language
    const generatedSubtasks = await breakDownGoalWithAI(goal_description, target_date, language);
    const subtaskObjects = generatedSubtasks.map((text, idx) => ({
      id: `st-${idx}-${Date.now()}`,
      title: text,
      is_completed: false
    }));

    const goalId = uuidv4();
    const formattedDate = target_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Store subtasks in SQLite/PG
    await query(
      `INSERT INTO goals (id, user_id, goal_description, target_date, progress_percentage, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [goalId, userId, goal_description, formattedDate, 0, 'active']
    );

    // Asynchronously dispatch personalized AI Goal Kickoff Email to student's email
    (async () => {
      try {
        const { sendAutomatedEmail } = await import('../services/emailService.js');
        const { generateGoalCreatedEmail } = await import('../services/aiService.js');
        
        const goalData = await generateGoalCreatedEmail({
          userName: req.user.name || 'Candidate',
          goalDescription: goal_description,
          targetDate: formattedDate,
          subtasks: subtaskObjects,
          targetRole: req.user.target_role || 'Software Engineer',
          language
        });

        await sendAutomatedEmail({
          userId,
          toEmail: req.user.email,
          emailType: 'goal',
          subject: goalData.subject,
          textContent: goalData.plain_text || goalData.mentor_advice,
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #1e293b; border-radius: 16px; background: #0b1220; color: #f8fafc;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; border: 1px solid rgba(59, 130, 246, 0.4);">
                  🎯 NEW CAREER GOAL ACTIVATED
                </span>
                <h1 style="color: #ffffff; margin: 16px 0 6px 0; font-size: 20px;">
                  ${goalData.headline || `Goal Locked In: ${goal_description}`}
                </h1>
                <p style="color: #94a3b8; font-size: 13.5px; margin: 0;">Target Completion Date: <strong>${formattedDate}</strong></p>
              </div>
              <div style="background: #111c30; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="color: #60a5fa; font-size: 14px; margin: 0 0 8px 0;">💡 Mentor Advice</h3>
                <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 14px 0;">${goalData.mentor_advice}</p>
                <h4 style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 8px 0;">Actionable Subtasks:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 13px; line-height: 1.7;">
                  ${(goalData.action_items || subtaskObjects.map(s => s.title)).map(t => `<li>${t}</li>`).join('')}
                </ul>
              </div>
              <div style="text-align: center;">
                <a href="http://localhost:5173/goals" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
                  Open Goal Tracker 🚀
                </a>
              </div>
            </div>
          `
        });
      } catch (e) {
        console.warn('Notice: Background goal email dispatch skipped:', e.message);
      }
    })();

    return res.json({
      message: 'Goal created successfully',
      goal: {
        id: goalId,
        user_id: userId,
        goal_description,
        target_date: formattedDate,
        progress_percentage: 0,
        status: 'active',
        subtasks: subtaskObjects
      }
    });
  } catch (err) {
    console.error('Create Goal error:', err);
    return res.status(500).json({ error: 'Failed to create goal: ' + err.message });
  }
}

export async function updateGoalProgress(req, res) {
  try {
    const { goalId } = req.params;
    const { progress_percentage, status } = req.body;

    const newStatus = progress_percentage >= 100 ? 'completed' : status || 'active';

    await query(
      `UPDATE goals SET progress_percentage = $1, status = $2 WHERE id = $3`,
      [progress_percentage, newStatus, goalId]
    );

    return res.json({ message: 'Goal updated', goalId, progress_percentage, status: newStatus });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update goal: ' + err.message });
  }
}

export async function deleteGoal(req, res) {
  try {
    const { goalId } = req.params;
    await query(`DELETE FROM goals WHERE id = $1`, [goalId]);
    return res.json({ message: 'Goal removed successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete goal' });
  }
}
