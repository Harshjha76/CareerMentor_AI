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
