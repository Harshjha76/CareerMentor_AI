import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { chatWithCareerMentor } from '../services/aiService.js';

function generateSmartSessionTitle(prompt = '') {
  const lower = prompt.toLowerCase();
  if (lower.includes('java') && (lower.includes('backend') || lower.includes('spring'))) {
    return 'Java Backend Development Roadmap';
  }
  if (lower.includes('career progress') || lower.includes('analyze my career')) {
    return 'Career Progress & Readiness Analysis';
  }
  if (lower.includes('study plan') || lower.includes('schedule')) {
    return 'Personalized AI Study Plan';
  }
  if (lower.includes('resume') || lower.includes('cv')) {
    return 'Resume Review & Optimization';
  }
  if (lower.includes('dsa') || lower.includes('algorithm') || lower.includes('leetcode')) {
    return 'DSA & Coding Interview Prep';
  }
  if (lower.includes('system design') || lower.includes('architecture')) {
    return 'System Design Blueprint';
  }
  const words = prompt.trim().split(/\s+/).slice(0, 5).join(' ');
  return words.length > 35 ? words.slice(0, 32) + '...' : (words || 'Career Guidance Session');
}

/**
 * 1. Get all chat sessions for the authenticated user
 */
export async function getSessions(req, res) {
  try {
    const userId = req.user.id;

    const sessionsRes = await query(
      `SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );

    let sessions = sessionsRes.rows;

    if (sessions.length === 0) {
      const defaultId = uuidv4();
      const now = new Date().toISOString();
      const title = 'Career Guidance & Strategy';

      await query(
        `INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [defaultId, userId, title, now, now]
      );

      const initialGreeting = `Hello **${req.user.name || 'there'}**! 🌟 I am your 24/7 **CareerPilot AI Mentor**.\n\nI am calibrated for your target role (**${req.user.target_role || 'Software Engineer'}**) and dream companies (**${req.user.dream_companies || 'Google, Microsoft'}**).\n\nYou can ask me questions like:\n- 🚀 *"What skills should I learn for Java backend development?"*\n- 📈 *"Analyze my career progress."*\n- 📅 *"Create a study plan for me."*\n- 📄 *"What should I improve in my resume?"*`;

      const msgId = uuidv4();
      await query(
        `INSERT INTO chat_messages (id, session_id, user_id, sender, text, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [msgId, defaultId, userId, 'ai', initialGreeting, now]
      );

      sessions = [{
        id: defaultId,
        user_id: userId,
        title,
        created_at: now,
        updated_at: now
      }];
    }

    return res.json({ sessions });
  } catch (err) {
    console.error('Error fetching chat sessions:', err);
    return res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
}

/**
 * 2. Create a new chat session
 */
export async function createSession(req, res) {
  try {
    const userId = req.user.id;
    const { title } = req.body;
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    const sessionTitle = title?.trim() || 'New Career Discussion';

    await query(
      `INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, userId, sessionTitle, now, now]
    );

    const greetingMsgId = uuidv4();
    const welcome = `Hello **${req.user.name || 'there'}**! 🎯 New session started. How can I accelerate your career growth today?`;
    await query(
      `INSERT INTO chat_messages (id, session_id, user_id, sender, text, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [greetingMsgId, sessionId, userId, 'ai', welcome, now]
    );

    const sessionRes = await query(`SELECT * FROM chat_sessions WHERE id = $1`, [sessionId]);

    return res.json({
      session: sessionRes.rows[0],
      initialMessage: {
        id: greetingMsgId,
        session_id: sessionId,
        sender: 'ai',
        text: welcome,
        created_at: now
      }
    });
  } catch (err) {
    console.error('Error creating chat session:', err);
    return res.status(500).json({ error: 'Failed to create chat session' });
  }
}

/**
 * 3. Get all messages for a specific session
 */
export async function getSessionMessages(req, res) {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const sessionCheck = await query(
      `SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const messagesRes = await query(
      `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    );

    return res.json({
      session: sessionCheck.rows[0],
      messages: messagesRes.rows
    });
  } catch (err) {
    console.error('Error fetching session messages:', err);
    return res.status(500).json({ error: 'Failed to fetch session messages' });
  }
}

/**
 * 4. Send message inside a specific session
 */
export async function sendSessionMessage(req, res) {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { message, language: clientLang, attachment } = req.body;

    if ((!message || !message.trim()) && !attachment) {
      return res.status(400).json({ error: 'Message text or attachment is required' });
    }

    const sessionCheck = await query(
      `SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const currentSession = sessionCheck.rows[0];
    const messageText = message?.trim() || (attachment ? `Uploaded attachment: ${attachment.name}` : '');
    const now = new Date().toISOString();
    const userMsgId = uuidv4();

    // 1. Save User message
    await query(
      `INSERT INTO chat_messages (id, session_id, user_id, sender, text, attachment_name, attachment_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userMsgId,
        sessionId,
        userId,
        'user',
        messageText,
        attachment?.name || null,
        attachment?.type || null,
        now
      ]
    );

    // 2. Auto-generate smart session title if it is still a default title
    let updatedTitle = currentSession.title;
    if (['New Career Discussion', 'New Career Session', 'Career Guidance Session'].includes(currentSession.title)) {
      updatedTitle = generateSmartSessionTitle(messageText);
    }

    await query(
      `UPDATE chat_sessions SET updated_at = $1, title = $2 WHERE id = $3`,
      [now, updatedTitle, sessionId]
    );

    // 3. Fetch past messages in this session for conversational memory
    const historyRes = await query(
      `SELECT sender, text FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    );

    const contextMessages = historyRes.rows.map(r => ({
      sender: r.sender,
      text: r.text
    }));

    const language = clientLang || req.user.preferred_language || 'en';

    // 4. Generate AI response with career intelligence
    const aiResponseText = await chatWithCareerMentor(contextMessages, req.user, language, attachment);

    // 5. Save AI response
    const aiMsgId = uuidv4();
    const aiNow = new Date().toISOString();

    await query(
      `INSERT INTO chat_messages (id, session_id, user_id, sender, text, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [aiMsgId, sessionId, userId, 'ai', aiResponseText, aiNow]
    );

    // Sync legacy chat_history for backward compatibility
    try {
      await query(
        `INSERT INTO chat_history (id, user_id, message, ai_response, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), userId, messageText, aiResponseText, aiNow]
      );
    } catch (e) {
      // Non-critical legacy sync
    }

    return res.json({
      userMessage: {
        id: userMsgId,
        session_id: sessionId,
        sender: 'user',
        text: messageText,
        attachment_name: attachment?.name || null,
        created_at: now
      },
      message: {
        id: aiMsgId,
        session_id: sessionId,
        sender: 'ai',
        text: aiResponseText,
        created_at: aiNow
      },
      sessionTitle: updatedTitle
    });
  } catch (err) {
    console.error('Error sending session message:', err);
    return res.status(500).json({ error: 'Failed to process message: ' + err.message });
  }
}

/**
 * 5. Delete a chat session and all its messages
 */
export async function deleteSession(req, res) {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    await query(`DELETE FROM chat_messages WHERE session_id = $1 AND user_id = $2`, [sessionId, userId]);
    await query(`DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2`, [sessionId, userId]);

    return res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat session:', err);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
}

/**
 * 6. Rename chat session
 */
export async function renameSession(req, res) {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    await query(
      `UPDATE chat_sessions SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3`,
      [title.trim(), sessionId, userId]
    );

    return res.json({ message: 'Session renamed successfully', title: title.trim() });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to rename session' });
  }
}

/**
 * Legacy API Handlers for backward compatibility
 */
export async function getChatHistory(req, res) {
  try {
    const userId = req.user.id;
    const historyRes = await query(
      `SELECT * FROM chat_history WHERE user_id = $1 ORDER BY timestamp ASC LIMIT 50`,
      [userId]
    );

    const messages = [];
    for (const row of historyRes.rows) {
      messages.push({
        id: row.id + '-user',
        sender: 'user',
        text: row.message,
        timestamp: row.timestamp
      });
      messages.push({
        id: row.id + '-ai',
        sender: 'ai',
        text: row.ai_response,
        timestamp: row.timestamp
      });
    }

    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch chat history' });
  }
}

export async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    const { message, language: clientLang, attachment } = req.body;

    if ((!message || !message.trim()) && !attachment) {
      return res.status(400).json({ error: 'Message text or attachment is required' });
    }

    const messageText = message?.trim() || (attachment ? `Uploaded attachment: ${attachment.name}` : '');
    const language = clientLang || req.user.preferred_language || 'en';

    const recentRes = await query(
      `SELECT message, ai_response FROM chat_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10`,
      [userId]
    );

    const contextMessages = [];
    recentRes.rows.reverse().forEach(row => {
      contextMessages.push({ sender: 'user', text: row.message });
      contextMessages.push({ sender: 'ai', text: row.ai_response });
    });
    contextMessages.push({ sender: 'user', text: messageText });

    const aiResponse = await chatWithCareerMentor(contextMessages, req.user, language, attachment);

    const historyId = uuidv4();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO chat_history (id, user_id, message, ai_response, timestamp)
       VALUES ($1, $2, $3, $4, $5)`,
      [historyId, userId, messageText, aiResponse, now]
    );

    return res.json({
      message: {
        id: historyId + '-ai',
        sender: 'ai',
        text: aiResponse,
        timestamp: now
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process message: ' + err.message });
  }
}

export async function clearChatHistory(req, res) {
  try {
    const userId = req.user.id;
    await query(`DELETE FROM chat_history WHERE user_id = $1`, [userId]);
    return res.json({ message: 'Chat history cleared successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clear chat history' });
  }
}
