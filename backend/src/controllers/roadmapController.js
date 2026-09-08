import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { generateRoadmapWithAI } from '../services/aiService.js';

export async function createRoadmap(req, res) {
  try {
    const userId = req.user.id;
    const { skill_name, duration_weeks, daily_hours } = req.body;

    if (!skill_name) {
      return res.status(400).json({ error: 'Skill or domain name is required' });
    }

    const weeks = parseInt(duration_weeks || '4', 10);
    const hours = parseInt(daily_hours || req.user.daily_study_hours || '2', 10);
    const targetRole = req.user.target_role || 'Software Engineer';
    const language = req.user.preferred_language || 'en';

    console.log(`🗺️ Generating roadmap for [${skill_name}], ${weeks} weeks, ${hours}h/day in [${language}]`);

    const curriculum = await generateRoadmapWithAI(skill_name, weeks, hours, targetRole, language);

    const roadmapId = uuidv4();
    await query(
      `INSERT INTO roadmaps (id, user_id, skill_name, duration_weeks, daily_hours, target_role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [roadmapId, userId, skill_name, weeks, hours, targetRole, 'active']
    );

    // Insert weekly tasks
    for (const week of curriculum) {
      for (const task of week.tasks) {
        const taskId = uuidv4();
        await query(
          `INSERT INTO roadmap_tasks (
            id, roadmap_id, week_number, day_number, task_description, resource_links, is_completed
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            taskId,
            roadmapId,
            week.week_number,
            task.day_number,
            task.task_description,
            JSON.stringify(task.resource_links || []),
            false
          ]
        );
      }
    }

    return res.json({
      message: 'Roadmap generated successfully',
      roadmapId,
      skill_name,
      duration_weeks: weeks,
      daily_hours: hours,
      curriculum
    });
  } catch (err) {
    console.error('Roadmap Creation Error:', err);
    return res.status(500).json({ error: 'Failed to generate roadmap: ' + err.message });
  }
}

export async function getUserRoadmaps(req, res) {
  try {
    const userId = req.user.id;
    const roadmapsRes = await query(
      `SELECT * FROM roadmaps WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const roadmaps = [];
    for (const r of roadmapsRes.rows) {
      const tasksRes = await query(
        `SELECT * FROM roadmap_tasks WHERE roadmap_id = $1 ORDER BY week_number ASC, day_number ASC`,
        [r.id]
      );

      const totalTasks = tasksRes.rows.length;
      const completedTasks = tasksRes.rows.filter(t => !!t.is_completed).length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Group tasks by week
      const weeksMap = {};
      tasksRes.rows.forEach(t => {
        if (!weeksMap[t.week_number]) {
          weeksMap[t.week_number] = {
            week_number: t.week_number,
            tasks: []
          };
        }
        weeksMap[t.week_number].tasks.push({
          ...t,
          is_completed: !!t.is_completed
        });
      });

      roadmaps.push({
        ...r,
        progress,
        totalTasks,
        completedTasks,
        weeks: Object.values(weeksMap)
      });
    }

    return res.json({ roadmaps });
  } catch (err) {
    console.error('Get Roadmaps Error:', err);
    return res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
}

export async function toggleTaskComplete(req, res) {
  try {
    const { taskId } = req.params;
    const { is_completed } = req.body;

    const completedAt = is_completed ? new Date().toISOString() : null;
    await query(
      `UPDATE roadmap_tasks SET is_completed = $1, completed_at = $2 WHERE id = $3`,
      [is_completed, completedAt, taskId]
    );

    return res.json({ message: 'Task updated', taskId, is_completed });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update task: ' + err.message });
  }
}

export async function updateTask(req, res) {
  try {
    const { taskId } = req.params;
    const { task_description } = req.body;

    await query(
      `UPDATE roadmap_tasks SET task_description = $1 WHERE id = $2`,
      [task_description, taskId]
    );

    return res.json({ message: 'Task description updated', taskId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to edit task: ' + err.message });
  }
}
