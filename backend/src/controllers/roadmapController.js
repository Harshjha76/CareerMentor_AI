import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { generateRoadmapWithAI } from '../services/aiService.js';
import { sendEmailReminder } from '../services/emailService.js';

export async function createRoadmap(req, res) {
  try {
    const userId = req.user.id;
    const { skill_name, duration_weeks, daily_hours, daily_minutes, skill_level } = req.body;

    if (!skill_name) {
      return res.status(400).json({ error: 'Skill or domain name is required' });
    }

    const weeks = parseInt(duration_weeks || '12', 10);
    const numericMinutes = Number(daily_minutes) || (Number(daily_hours) ? Number(daily_hours) * 60 : (req.user.available_study_minutes || 60));
    const targetRole = req.user.target_role || 'Software Engineer';
    const language = req.user.preferred_language || 'en';
    const skillLevel = skill_level || 'Intermediate';

    console.log(`🗺️ Generating roadmap for [${skill_name}], ${weeks} weeks, ${numericMinutes}m/day in [${language}]`);

    const curriculum = await generateRoadmapWithAI(skill_name, weeks, numericMinutes, targetRole, language, skillLevel);

    const roadmapId = uuidv4();
    const hoursEquivalent = Math.max(1, Math.round(numericMinutes / 60));
    await query(
      `INSERT INTO roadmaps (id, user_id, skill_name, duration_weeks, daily_hours, target_role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [roadmapId, userId, skill_name, weeks, hoursEquivalent, targetRole, 'active']
    );

    // Insert weekly tasks with rich daily payload
    for (const week of curriculum) {
      for (const task of week.tasks) {
        const taskId = uuidv4();
        const payload = {
          topic: task.topic || task.task_description,
          type: task.type || 'learn',
          time: task.time || `${numericMinutes} min Session`,
          duration_minutes: task.duration_minutes || numericMinutes,
          done_when: task.done_when || '',
          subtasks: task.subtasks || [],
          links: task.resource_links || [],
          ...(task.day_number === 1 ? {
            week_title: week.title,
            milestone: week.milestone,
            milestone_project: week.milestone_project || null,
            time_distribution: week.time_distribution || {
              theory_percent: 25,
              practical_build_percent: 40,
              project_percent: 25,
              revision_percent: 10
            }
          } : {})
        };

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
            JSON.stringify(payload),
            false
          ]
        );
      }
    }

    // Asynchronously dispatch personalized AI Roadmap Kickoff Email to student's email
    (async () => {
      try {
        const { sendAutomatedEmail } = await import('../services/emailService.js');
        await sendAutomatedEmail({
          userId,
          toEmail: req.user.email,
          emailType: 'goal',
          subject: `🗺️ New Study Roadmap Activated: ${skill_name} (${weeks} Weeks)`,
          textContent: `Hi ${req.user.name},\n\nYour new comprehensive study roadmap for ${skill_name} is active (${weeks} weeks, ${numericMinutes}m/day).\n\nStart with Week 1 Day 1 foundational tasks in your roadmap to maintain your streak!\n\n- CareerMentor AI Agent`,
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #1e293b; border-radius: 16px; background: #0b1220; color: #f8fafc;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; border: 1px solid rgba(59, 130, 246, 0.4);">
                  🗺️ STUDY ROADMAP ACTIVATED
                </span>
                <h1 style="color: #ffffff; margin: 16px 0 6px 0; font-size: 20px;">
                  ${skill_name} Mastery Roadmap
                </h1>
                <p style="color: #94a3b8; font-size: 13.5px; margin: 0;">Plan: <strong>${weeks} Weeks</strong> at <strong>${numericMinutes} minutes/day</strong></p>
              </div>
              <div style="background: #111c30; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="color: #60a5fa; font-size: 14px; margin: 0 0 8px 0;">🎯 Week 1 Focus:</h3>
                <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0;">${curriculum[0]?.title || 'Core Fundamentals & Architecture'}</p>
              </div>
              <div style="text-align: center;">
                <a href="http://localhost:5173/roadmap" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
                  View Full Study Roadmap 🚀
                </a>
              </div>
            </div>
          `
        });
      } catch (e) {
        console.warn('Notice: Background roadmap email kickoff skipped:', e.message);
      }
    })();

    return res.json({
      message: 'Roadmap generated successfully',
      roadmapId,
      skill_name,
      duration_weeks: weeks,
      daily_minutes: numericMinutes,
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

      // Group tasks by week with milestone project and time distribution unpack
      const weeksMap = {};
      let detectedTimeDistribution = null;

      tasksRes.rows.forEach(t => {
        let links = [];
        let weekTitle = null;
        let milestone = null;
        let milestoneProject = null;
        let topic = null;
        let type = 'learn';
        let time = '60 min Session';
        let durationMinutes = 60;
        let doneWhen = '';
        let subtasks = [];

        if (typeof t.resource_links === 'string') {
          try {
            const parsed = JSON.parse(t.resource_links);
            if (Array.isArray(parsed)) {
              links = parsed;
            } else if (parsed && typeof parsed === 'object') {
              links = parsed.links || [];
              weekTitle = parsed.week_title || null;
              milestone = parsed.milestone || null;
              milestoneProject = parsed.milestone_project || null;
              topic = parsed.topic || null;
              type = parsed.type || 'learn';
              time = parsed.time || '60 min Session';
              durationMinutes = parsed.duration_minutes || 60;
              doneWhen = parsed.done_when || '';
              subtasks = parsed.subtasks || [];
              if (parsed.time_distribution) {
                detectedTimeDistribution = parsed.time_distribution;
              }
            }
          } catch {}
        } else if (Array.isArray(t.resource_links)) {
          links = t.resource_links;
        }

        if (!weeksMap[t.week_number]) {
          weeksMap[t.week_number] = {
            week_number: t.week_number,
            title: weekTitle || `Week ${t.week_number}`,
            milestone: milestone || '',
            milestone_project: milestoneProject || null,
            tasks: []
          };
        } else {
          if (weekTitle) weeksMap[t.week_number].title = weekTitle;
          if (milestone) weeksMap[t.week_number].milestone = milestone;
          if (milestoneProject) weeksMap[t.week_number].milestone_project = milestoneProject;
        }

        weeksMap[t.week_number].tasks.push({
          ...t,
          topic: topic || t.task_description,
          type: type || 'learn',
          time: time || '60 min Session',
          duration_minutes: durationMinutes,
          done_when: doneWhen,
          subtasks: subtasks,
          resource_links: links,
          is_completed: !!t.is_completed
        });
      });

      roadmaps.push({
        ...r,
        progress,
        totalTasks,
        completedTasks,
        time_distribution: detectedTimeDistribution || {
          theory_percent: 25,
          practical_build_percent: 40,
          project_percent: 25,
          revision_percent: 10
        },
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

export async function toggleRoadmapSubtask(req, res) {
  try {
    const { taskId } = req.params;
    const { subtaskId, is_completed } = req.body;

    const taskRes = await query(`SELECT * FROM roadmap_tasks WHERE id = $1`, [taskId]);
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskRes.rows[0];
    let payload = {};
    try {
      payload = JSON.parse(task.resource_links || '{}');
    } catch {}

    const subtasks = payload.subtasks || [];
    let updatedSubtasks = subtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, is_completed: !!is_completed };
      }
      return st;
    });

    const allSubtasksDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => !!st.is_completed);
    payload.subtasks = updatedSubtasks;

    const taskCompleted = allSubtasksDone || !!task.is_completed;
    const completedAt = taskCompleted ? (task.completed_at || new Date().toISOString()) : null;

    await query(
      `UPDATE roadmap_tasks SET resource_links = $1, is_completed = $2, completed_at = $3 WHERE id = $4`,
      [JSON.stringify(payload), taskCompleted, completedAt, taskId]
    );

    return res.json({ success: true, taskId, subtaskId, is_completed, task_completed: taskCompleted, subtasks: updatedSubtasks });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle subtask: ' + err.message });
  }
}

export async function regenerateWeekRoadmap(req, res) {
  try {
    const userId = req.user.id;
    const { roadmapId, weekNumber, skillName, dailyMinutes = 60, skillLevel = 'Intermediate' } = req.body;

    if (!roadmapId || !weekNumber) {
      return res.status(400).json({ error: 'roadmapId and weekNumber are required' });
    }

    const roadmapRes = await query(`SELECT * FROM roadmaps WHERE id = $1 AND user_id = $2`, [roadmapId, userId]);
    if (roadmapRes.rows.length === 0) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    const roadmap = roadmapRes.rows[0];
    const skill = skillName || roadmap.skill_name;
    const totalWeeks = roadmap.duration_weeks || 12;
    const targetRole = roadmap.target_role || req.user.target_role || 'Software Engineer';
    const language = req.user.preferred_language || 'en';

    const { regenerateSingleWeekWithAI } = await import('../services/aiService.js');
    const weekData = await regenerateSingleWeekWithAI({
      skillName: skill,
      weekNumber: Number(weekNumber),
      totalWeeks,
      dailyMinutes: Number(dailyMinutes) || (roadmap.daily_hours * 60) || 60,
      targetRole,
      language,
      skillLevel
    });

    // Delete existing tasks for this week
    await query(`DELETE FROM roadmap_tasks WHERE roadmap_id = $1 AND week_number = $2`, [roadmapId, Number(weekNumber)]);

    // Insert new tasks
    for (const task of weekData.tasks) {
      const taskId = uuidv4();
      const payload = {
        topic: task.topic || task.task_description,
        type: task.type || 'learn',
        time: task.time || `${dailyMinutes} min Session`,
        duration_minutes: task.duration_minutes || dailyMinutes,
        done_when: task.done_when || '',
        subtasks: task.subtasks || [],
        links: task.resource_links || [],
        ...(task.day_number === 1 ? {
          week_title: weekData.title,
          milestone: weekData.milestone,
          milestone_project: weekData.milestone_project || null,
          time_distribution: weekData.time_distribution || null
        } : {})
      };

      await query(
        `INSERT INTO roadmap_tasks (
          id, roadmap_id, week_number, day_number, task_description, resource_links, is_completed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          taskId,
          roadmapId,
          Number(weekNumber),
          task.day_number,
          task.task_description,
          JSON.stringify(payload),
          false
        ]
      );
    }

    return res.json({
      success: true,
      message: `Week ${weekNumber} regenerated successfully`,
      week: weekData
    });
  } catch (err) {
    console.error('Regenerate Week Error:', err);
    return res.status(500).json({ error: 'Failed to regenerate week: ' + err.message });
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

/**
 * Get student's roadmap study streak, heatmap, and consistency telemetry
 */
export async function getRoadmapStreak(req, res) {
  try {
    const userId = req.user.id;

    // Fetch all completed tasks with dates
    const tasksRes = await query(
      `SELECT rt.completed_at, rt.is_completed, r.skill_name
       FROM roadmap_tasks rt
       JOIN roadmaps r ON rt.roadmap_id = r.id
       WHERE r.user_id = $1
       ORDER BY rt.completed_at DESC`,
      [userId]
    );

    const completedDates = new Set();
    let totalCompletedTasks = 0;
    let totalTasks = tasksRes.rows.length;

    tasksRes.rows.forEach(row => {
      if (row.is_completed) {
        totalCompletedTasks++;
        if (row.completed_at) {
          const dateStr = row.completed_at.split('T')[0];
          completedDates.add(dateStr);
        }
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const isMaintainedToday = completedDates.has(todayStr);

    // Calculate current consecutive streak
    let currentStreak = 0;
    let checkDate = new Date();

    if (!isMaintainedToday) {
      // Check from yesterday to see if streak is still active
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (completedDates.has(dateKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Default streak baseline
    const bestStreak = Math.max(currentStreak, completedDates.size > 0 ? completedDates.size : 1);

    // Last 7 days activity array
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days.push({
        date: dStr,
        dayName,
        completed: completedDates.has(dStr),
        isToday: dStr === todayStr
      });
    }

    return res.json({
      currentStreak: isMaintainedToday ? currentStreak : currentStreak,
      bestStreak,
      isMaintainedToday,
      totalActiveDays: completedDates.size,
      totalCompletedTasks,
      totalTasks,
      last7Days,
      streakAtRisk: !isMaintainedToday && currentStreak > 0
    });
  } catch (err) {
    console.error('Error fetching roadmap streak:', err);
    return res.status(500).json({ error: 'Failed to compute streak: ' + err.message });
  }
}

/**
 * Send an AI Streak Recovery / Inconsistency Alert Email
 */
export async function sendRoadmapStreakAlert(req, res) {
  try {
    const user = req.user;
    const userId = user.id;

    // Fetch latest active roadmap and pending tasks
    const activeRoadmapRes = await query(
      `SELECT * FROM roadmaps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const roadmap = activeRoadmapRes.rows[0];
    const domainName = roadmap?.skill_name || 'Software Engineering';

    const pendingTasksRes = await query(
      `SELECT rt.task_description, rt.week_number, rt.day_number
       FROM roadmap_tasks rt
       JOIN roadmaps r ON rt.roadmap_id = r.id
       WHERE r.user_id = $1 AND rt.is_completed = FALSE
       ORDER BY rt.week_number ASC, rt.day_number ASC LIMIT 3`,
      [userId]
    );

    const pendingTask = pendingTasksRes.rows[0]?.task_description || `Master foundational concepts for ${domainName}`;
    const subject = `🔥 [CareerPilot AI] Keep Your ${domainName} Streak Alive!`;
    const textContent = `Hi ${user.name || 'Student'},\n\nYour study streak for "${domainName}" is at risk today! Complete your next milestone to keep your momentum going:\n\n👉 Today's Task: ${pendingTask}\n\nLog into CareerPilot AI now: http://localhost:5173/roadmap`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #1e293b; border-radius: 16px; background: #0b1220; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.4); display: inline-block;">
            🔥 ROADMAP STUDY STREAK GUARDIAN
          </span>
          <h2 style="color: #ffffff; margin: 16px 0 6px 0; font-size: 22px;">Don't Break Your ${domainName} Streak!</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Automated Mobile Check-in for <strong>${user.name}</strong></p>
        </div>
        
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 16px 18px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #f87171; font-weight: 700; margin: 0 0 4px 0;">⚠️ Milestone Inactivity Warning</p>
          <p style="font-size: 14px; color: #e2e8f0; line-height: 1.5; margin: 0;">You haven't completed a task today. Complete 1 milestone to maintain your daily streak!</p>
        </div>

        <div style="background: #111c30; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <span style="color: #60a5fa; font-size: 12px; font-weight: 700; text-transform: uppercase;">⚡ Recommended 15-Minute Task:</span>
          <p style="font-size: 15px; color: #ffffff; margin: 8px 0 0 0; font-weight: 600;">${pendingTask}</p>
        </div>

        <div style="text-align: center;">
          <a href="http://localhost:5173/roadmap" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; padding: 12px 30px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
            Open Roadmap & Complete Task 🔥
          </a>
          <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">
            Sent autonomously by CareerPilot AI Streak Guardian to ${user.email}
          </p>
        </div>
      </div>
    `;

    const emailRes = await sendEmailReminder({
      toEmail: user.email,
      subject,
      textContent,
      htmlContent
    });

    return res.json({
      success: true,
      message: `Streak recovery email dispatched to ${user.email}`,
      recipient: user.email,
      domainName,
      pendingTask,
      emailRes
    });
  } catch (err) {
    console.error('Streak alert email error:', err);
    return res.status(500).json({ error: 'Failed to send streak alert email: ' + err.message });
  }
}
