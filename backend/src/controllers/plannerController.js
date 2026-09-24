import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import {
  evaluateStudyPlanProsAndCons,
  generateStudyPlanWithAI
} from '../services/aiService.js';

export async function getPlan(req, res) {
  try {
    const userId = req.user.id;
    const { type = 'weekly' } = req.query;

    const result = await query(
      `SELECT * FROM plans WHERE user_id = $1 AND plan_type = $2 ORDER BY start_date DESC LIMIT 1`,
      [userId, type]
    );

    if (result.rows.length === 0) {
      return res.json({ plan: null, tasks: [] });
    }

    const plan = result.rows[0];
    let tasks = plan.tasks;
    if (typeof tasks === 'string') {
      try {
        tasks = JSON.parse(tasks);
      } catch {
        tasks = [];
      }
    }

    return res.json({ plan, tasks: tasks || [] });
  } catch (err) {
    console.error('Get Plan Error:', err);
    return res.status(500).json({ error: 'Failed to fetch planner' });
  }
}

export async function generateAIPlan(req, res) {
  try {
    const userId = req.user.id;
    const {
      target_role,
      skill_level = 'Intermediate',
      session_minutes,
      days_per_week = 7
    } = req.body || {};

    const cleanRole = (target_role || req.user.target_role || '').trim();
    if (!cleanRole) {
      return res.status(400).json({
        error: 'Please enter your target role, exam, or learning domain (e.g. Full Stack Developer, AI/ML, UPSC, Guitar).'
      });
    }

    const sessionMinutes = Number(session_minutes) > 0 ? Number(session_minutes) : (req.user.available_study_minutes || 57);
    const language = req.user.preferred_language || 'en';

    // Generate comprehensive, progression-based weekly plan with subtasks & free resources
    const planData = await generateStudyPlanWithAI({
      targetRole: cleanRole,
      skillLevel: skill_level,
      sessionMinutes,
      daysPerWeek: Number(days_per_week) || 7,
      language
    });

    const generatedDays = planData.days || [];

    // Structure tasks with topic titles, duration, and subtask checklists
    const planTasks = generatedDays.map((d, index) => ({
      id: d.id || `plan-day-${index + 1}-${Date.now()}`,
      day: d.day,
      topic: d.topic,
      type: d.type || 'learn',
      time: d.time || `${sessionMinutes} min Session`,
      duration_minutes: d.duration_minutes || sessionMinutes,
      description: d.topic,
      subtasks: (d.subtasks || []).map((st, sIdx) => ({
        id: st.id || `subtask-${index + 1}-${sIdx + 1}`,
        title: st.title,
        duration_minutes: st.duration_minutes,
        resource: st.resource || 'Documentation & Guides',
        done_when: st.done_when || 'Task completed with output verified',
        is_completed: false
      })),
      is_completed: false,
      status: 'pending',
      is_ai_suggested: true
    }));

    // Update user target_role if changed
    try {
      await query(`UPDATE users SET target_role = $1 WHERE id = $2`, [cleanRole, userId]);
    } catch (uErr) {
      console.warn('Notice updating user target role:', uErr.message);
    }

    const planId = uuidv4();
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    // Save to plans table
    const existing = await query(
      `SELECT id FROM plans WHERE user_id = $1 AND plan_type = 'weekly' ORDER BY start_date DESC LIMIT 1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE plans SET tasks = $1, ai_suggestions = $2, is_edited_by_user = FALSE WHERE id = $3`,
        [
          JSON.stringify(planTasks),
          `AI study plan generated for ${cleanRole} (${skill_level}, ${sessionMinutes}m/day).`,
          existing.rows[0].id
        ]
      );
    } else {
      await query(
        `INSERT INTO plans (id, user_id, plan_type, start_date, end_date, tasks, ai_suggestions, is_edited_by_user)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          planId,
          userId,
          'weekly',
          today,
          nextWeek,
          JSON.stringify(planTasks),
          `AI study plan generated for ${cleanRole} (${skill_level}, ${sessionMinutes}m/day).`,
          false
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Plan generated successfully with AI',
      planId,
      role: cleanRole,
      skill_level,
      session_minutes: sessionMinutes,
      days_per_week: days_per_week,
      tasks: planTasks,
      plan_data: planData
    });
  } catch (err) {
    console.error('Generate AI Plan Error:', err);
    return res.status(500).json({ error: 'Failed to generate study plan: ' + err.message });
  }
}

export async function savePlanTasks(req, res) {
  try {
    const userId = req.user.id;
    const { tasks } = req.body;

    const existing = await query(
      `SELECT * FROM plans WHERE user_id = $1 AND plan_type = 'weekly' ORDER BY start_date DESC LIMIT 1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE plans SET tasks = $1, is_edited_by_user = TRUE WHERE id = $2`,
        [JSON.stringify(tasks), existing.rows[0].id]
      );
    } else {
      const planId = uuidv4();
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      await query(
        `INSERT INTO plans (id, user_id, plan_type, start_date, end_date, tasks, is_edited_by_user)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [planId, userId, 'weekly', today, nextWeek, JSON.stringify(tasks), true]
      );
    }

    return res.json({ message: 'Plan tasks updated successfully', tasks });
  } catch (err) {
    console.error('Save Plan Error:', err);
    return res.status(500).json({ error: 'Failed to update tasks: ' + err.message });
  }
}

/**
 * Analyze Plan: Evaluates user's plan with AI for Pros and Cons
 */
export async function analyzePlanProsAndCons(req, res) {
  try {
    const userId = req.user.id;
    const { tasks } = req.body;
    const targetRole = req.user.target_role || 'Software Engineer';
    const dailyHours = req.user.daily_study_hours || 2;
    const language = req.user.preferred_language || 'en';

    console.log(`🤖 Evaluating study plan for ${targetRole} with AI (${tasks?.length || 0} tasks) in [${language}]`);

    const evaluation = await evaluateStudyPlanProsAndCons(tasks || [], targetRole, dailyHours, language);

    return res.json({
      message: 'Plan evaluation completed',
      evaluation
    });
  } catch (err) {
    console.error('Analyze Plan Error:', err);
    return res.status(500).json({ error: 'Failed to evaluate plan: ' + err.message });
  }
}

/**
 * Apply AI Optimization: Overwrites/merges current plan with AI-optimized schedule
 */
export async function applyAIOptimization(req, res) {
  try {
    const userId = req.user.id;
    const { optimized_tasks } = req.body;

    if (!Array.isArray(optimized_tasks) || optimized_tasks.length === 0) {
      return res.status(400).json({ error: 'Optimized tasks array is required' });
    }

    const tasksWithIds = optimized_tasks.map(t => ({
      ...t,
      id: t.id || uuidv4(),
      status: t.is_completed ? 'completed' : 'pending'
    }));

    await savePlanTasks({ user: req.user, body: { tasks: tasksWithIds } }, res);
  } catch (err) {
    console.error('Apply AI Optimization Error:', err);
    return res.status(500).json({ error: 'Failed to apply optimization: ' + err.message });
  }
}
