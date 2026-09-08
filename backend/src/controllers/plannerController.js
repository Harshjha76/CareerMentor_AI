import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';

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
    const userRole = req.user.target_role || 'Software Engineer';
    const hours = req.user.daily_study_hours || 2;
    const language = req.user.preferred_language || 'en';

    // Fetch active roadmap tasks
    const activeTasks = await query(
      `SELECT rt.task_description, r.skill_name
       FROM roadmap_tasks rt
       JOIN roadmaps r ON rt.roadmap_id = r.id
       WHERE r.user_id = $1 AND rt.is_completed = FALSE
       LIMIT 10`,
      [userId]
    );

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const generatedTasks = [];

    days.forEach((day, index) => {
      let taskTitle = '';
      if (activeTasks.rows[index]) {
        taskTitle = activeTasks.rows[index].task_description;
      } else {
        if (language === 'hi') {
          taskTitle = `${day}: ${userRole} के लिए समस्या-समाधान और कोडिंग अभ्यास (${hours} घंटे)`;
        } else if (language === 'mr') {
          taskTitle = `${day}: ${userRole} साठी कोडिंग व तांत्रिक विषयांचा अभ्यास (${hours} तास)`;
        } else if (language === 'sa') {
          taskTitle = `${day}: ${userRole}-पदाय कोडिंग-समस्यासमाधानं च (${hours} होराः)`;
        } else {
          taskTitle = `${day}: Practice core concepts and mock questions for ${userRole} (${hours} hrs)`;
        }
      }

      generatedTasks.push({
        id: uuidv4(),
        day,
        time: '18:00 - 20:00',
        description: taskTitle,
        is_completed: false,
        status: 'pending', // 'pending' | 'completed' | 'overdue'
        is_ai_suggested: true
      });
    });

    const planId = uuidv4();
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    await query(
      `INSERT INTO plans (id, user_id, plan_type, start_date, end_date, tasks, ai_suggestions, is_edited_by_user)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        planId,
        userId,
        'weekly',
        today,
        nextWeek,
        JSON.stringify(generatedTasks),
        `AI generated schedule optimized for ${hours} hours/day preparation towards ${userRole}.`,
        false
      ]
    );

    return res.json({
      message: 'Plan generated successfully with AI',
      planId,
      tasks: generatedTasks
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

    // Fetch existing weekly plan or create new
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
