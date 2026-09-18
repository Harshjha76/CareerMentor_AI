import { query } from '../config/db.js';

export async function getAdminStats(req, res) {
  try {
    // 1. Total real users in database
    const usersCountRes = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersCountRes.rows[0]?.count || '0', 10);

    // 2. Average resume score from real resumes
    const avgScoreRes = await query('SELECT AVG(score) as avg_score, COUNT(*) as count FROM resumes');
    const avgScore = avgScoreRes.rows[0]?.avg_score ? Math.round(parseFloat(avgScoreRes.rows[0].avg_score)) : 0;
    const totalResumes = parseInt(avgScoreRes.rows[0]?.count || '0', 10);

    // 3. Real Roadmaps & Goals count
    const roadmapsCountRes = await query('SELECT COUNT(*) as count FROM roadmaps');
    const totalRoadmaps = parseInt(roadmapsCountRes.rows[0]?.count || '0', 10);

    const goalsCountRes = await query('SELECT COUNT(*) as count FROM goals');
    const totalGoals = parseInt(goalsCountRes.rows[0]?.count || '0', 10);

    // 4. Real Language distribution from users table
    const langRes = await query(`
      SELECT preferred_language, COUNT(*) as count
      FROM users
      GROUP BY preferred_language
    `);

    const languageMap = { en: 0, hi: 0, mr: 0, sa: 0 };
    langRes.rows.forEach(r => {
      const lang = (r.preferred_language || 'en').toLowerCase();
      if (languageMap[lang] !== undefined) {
        languageMap[lang] = parseInt(r.count, 10);
      } else {
        languageMap.en += parseInt(r.count, 10);
      }
    });

    const languageDistribution = [
      { language: 'en', name: 'English', count: languageMap.en },
      { language: 'hi', name: 'हिंदी (Hindi)', count: languageMap.hi },
      { language: 'mr', name: 'मराठी (Marathi)', count: languageMap.mr },
      { language: 'sa', name: 'संस्कृतम् (Sanskrit)', count: languageMap.sa },
    ];

    // 5. Real Target Roles from users
    const rolesRes = await query(`
      SELECT target_role, COUNT(*) as count
      FROM users
      WHERE target_role IS NOT NULL AND TRIM(target_role) != ''
      GROUP BY target_role
      ORDER BY count DESC
      LIMIT 6
    `);
    const targetRoles = rolesRes.rows;

    // 6. Real Popular skills from roadmaps
    const skillsRes = await query(`
      SELECT skill_name, COUNT(*) as count
      FROM roadmaps
      WHERE skill_name IS NOT NULL AND TRIM(skill_name) != ''
      GROUP BY skill_name
      ORDER BY count DESC
      LIMIT 6
    `);
    const popularSkills = skillsRes.rows;

    // 7. Real Live Registered Users List (Whoever signed up or logged in!)
    const recentUsersRes = await query(`
      SELECT id, name, email, avatar_url, target_role, university_name, branch, preferred_language, daily_study_hours, available_study_minutes, is_onboarded, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 25
    `);

    return res.json({
      totalUsers,
      avgResumeScore: avgScore,
      totalResumes,
      totalRoadmaps,
      totalGoals,
      languageDistribution,
      targetRoles,
      popularSkills,
      recentUsers: recentUsersRes.rows || []
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform analytics: ' + err.message });
  }
}

