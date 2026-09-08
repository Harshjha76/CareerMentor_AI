import pg from 'pg';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isPostgres = false;
let pgPool = null;
let sqliteDb = null;

// Determine DB mode:
const connectionString = process.env.DATABASE_URL;

if (connectionString && connectionString.startsWith('postgres')) {
  try {
    pgPool = new pg.Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    isPostgres = true;
    console.log('✅ Connected to PostgreSQL database');
  } catch (err) {
    console.warn('⚠️ PostgreSQL connection failed, falling back to SQLite:', err.message);
    isPostgres = false;
  }
}

if (!isPostgres) {
  const dbDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbFile = path.join(dbDir, 'careerpilot.sqlite');
  sqliteDb = new sqlite3.Database(dbFile, (err) => {
    if (err) {
      console.error('❌ Failed to open SQLite database:', err.message);
    } else {
      console.log(`✅ Using SQLite database at: ${dbFile}`);
    }
  });
}

/**
 * Unified query function supporting parameter substitution ($1, $2... -> ? for SQLite)
 */
export async function query(sql, params = []) {
  if (isPostgres && pgPool) {
    try {
      const res = await pgPool.query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount };
    } catch (pgError) {
      console.error('PostgreSQL query error:', pgError);
      throw pgError;
    }
  } else {
    return new Promise((resolve, reject) => {
      // Convert PostgreSQL $1, $2... parameter tokens to SQLite ? tokens
      const sqliteSql = sql.replace(/\$(\d+)/g, '?');

      const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteSql);
      if (isSelect) {
        sqliteDb.all(sqliteSql, params, (err, rows) => {
          if (err) return reject(err);
          // Auto-parse JSON strings for compatibility
          const parsedRows = (rows || []).map(row => {
            const copy = { ...row };
            for (const key of Object.keys(copy)) {
              if (typeof copy[key] === 'string' && (copy[key].startsWith('{') || copy[key].startsWith('['))) {
                try {
                  copy[key] = JSON.parse(copy[key]);
                } catch {
                  // Keep as string
                }
              }
            }
            return copy;
          });
          resolve({ rows: parsedRows, rowCount: parsedRows.length });
        });
      } else {
        sqliteDb.run(sqliteSql, params, function (err) {
          if (err) return reject(err);
          resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
        });
      }
    });
  }
}

/**
 * Table Initializer creating all 8 required tables
 */
export async function initDB() {
  console.log('🔄 Initializing database schema...');

  const tables = [
    // 1. Users
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      google_id VARCHAR(128) UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      target_role VARCHAR(255),
      dream_companies TEXT,
      current_skills TEXT,
      daily_study_hours INTEGER DEFAULT 2,
      available_study_minutes INTEGER DEFAULT 120,
      university_name VARCHAR(255),
      branch VARCHAR(255),
      phone_number VARCHAR(50),
      preferred_language VARCHAR(10) DEFAULT 'en',
      is_onboarded BOOLEAN DEFAULT FALSE
    );`,

    // 2. Resumes
    `CREATE TABLE IF NOT EXISTS resumes (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      file_url TEXT,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ai_feedback TEXT,
      score INTEGER DEFAULT 0
    );`,

    // 3. Roadmaps
    `CREATE TABLE IF NOT EXISTS roadmaps (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      skill_name VARCHAR(255) NOT NULL,
      duration_weeks INTEGER DEFAULT 4,
      daily_hours INTEGER DEFAULT 2,
      target_role VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'active'
    );`,

    // 4. Roadmap Tasks
    `CREATE TABLE IF NOT EXISTS roadmap_tasks (
      id VARCHAR(64) PRIMARY KEY,
      roadmap_id VARCHAR(64) NOT NULL,
      week_number INTEGER NOT NULL,
      day_number INTEGER NOT NULL,
      task_description TEXT NOT NULL,
      resource_links TEXT,
      is_completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP
    );`,

    // 5. Plans
    `CREATE TABLE IF NOT EXISTS plans (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      plan_type VARCHAR(50) DEFAULT 'weekly',
      start_date DATE,
      end_date DATE,
      tasks TEXT,
      ai_suggestions TEXT,
      is_edited_by_user BOOLEAN DEFAULT FALSE
    );`,

    // 6. Chat History (legacy fallback)
    `CREATE TABLE IF NOT EXISTS chat_history (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 6b. Multi-Session Chat Sessions
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 6c. Multi-Session Chat Messages
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(64) PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      sender VARCHAR(20) NOT NULL,
      text TEXT NOT NULL,
      attachment_name VARCHAR(255),
      attachment_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 7. Reminders
    `CREATE TABLE IF NOT EXISTS reminders (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      reminder_text TEXT NOT NULL,
      scheduled_time TIMESTAMP,
      is_sent BOOLEAN DEFAULT FALSE,
      sent_at TIMESTAMP
    );`,

    // 8. Goals
    `CREATE TABLE IF NOT EXISTS goals (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      goal_description TEXT NOT NULL,
      target_date DATE,
      progress_percentage INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active'
    );`
  ];

  for (const sql of tables) {
    try {
      await query(sql);
    } catch (err) {
      console.error('Error creating table:', err.message);
    }
  }

  // Idempotent column migrations for existing databases
  const alterColumns = [
    'ALTER TABLE users ADD COLUMN university_name VARCHAR(255);',
    'ALTER TABLE users ADD COLUMN branch VARCHAR(255);',
    'ALTER TABLE users ADD COLUMN phone_number VARCHAR(50);',
    'ALTER TABLE users ADD COLUMN available_study_minutes INTEGER DEFAULT 120;'
  ];
  for (const alterSql of alterColumns) {
    try {
      await query(alterSql);
    } catch {
      // Column already exists or already migrated, safe to ignore
    }
  }

  // Seed default demo user if not exists
  try {
    const demoCheck = await query('SELECT id FROM users WHERE email = $1', ['demo.student@careerpilot.ai']);
    if (demoCheck.rows.length === 0) {
      const demoId = uuidv4();
      await query(
        `INSERT INTO users (
          id, google_id, email, name, avatar_url, target_role, dream_companies,
          current_skills, daily_study_hours, available_study_minutes, university_name, branch, phone_number, preferred_language, is_onboarded
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          demoId,
          'google_demo_1001',
          'demo.student@careerpilot.ai',
          'Aarav Sharma',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          'Full Stack Software Engineer',
          'Google, Microsoft, Atlassian, Infosys',
          'JavaScript, React, Node.js, Python, SQL',
          2,
          57,
          'Indian Institute of Technology (IIT)',
          'Computer Science & Engineering',
          '+91 98765 43210',
          'en',
          true
        ]
      );

      // Seed a sample goal for demo user
      await query(
        `INSERT INTO goals (id, user_id, goal_description, target_date, progress_percentage, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuidv4(),
          demoId,
          'Master Data Structures & System Design for SDE Interviews',
          new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          65,
          'active'
        ]
      );

      console.log('🌱 Seeded demo student profile');
    } else {
      // Ensure existing demo user has enriched fields
      await query(
        `UPDATE users SET
          university_name = COALESCE(university_name, 'Indian Institute of Technology (IIT)'),
          branch = COALESCE(branch, 'Computer Science & Engineering'),
          phone_number = COALESCE(phone_number, '+91 98765 43210'),
          available_study_minutes = COALESCE(available_study_minutes, 57)
         WHERE email = $1`,
        ['demo.student@careerpilot.ai']
      );
    }
  } catch (seedErr) {
    console.warn('Notice on seeding demo user:', seedErr.message);
  }

  console.log('✅ Database schema verified and ready');
}

export { isPostgres };
