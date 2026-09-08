import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { chatWithCareerMentor } from '../services/aiService.js';

export async function getChatHistory(req, res) {
  try {
    const userId = req.user.id;
    const historyRes = await query(
      `SELECT * FROM chat_history WHERE user_id = $1 ORDER BY timestamp ASC LIMIT 50`,
      [userId]
    );

    // Format for client
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
    console.error('Chat history error:', err);
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

    // Active language priority: client override -> user preferred language -> 'en'
    const language = clientLang || req.user.preferred_language || 'en';

    // Fetch last 10 messages for context
    const recentRes = await query(
      `SELECT message, ai_response FROM chat_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10`,
      [userId]
    );

    const contextMessages = [];
    // Reverse to chronological order
    recentRes.rows.reverse().forEach(row => {
      contextMessages.push({ sender: 'user', text: row.message });
      contextMessages.push({ sender: 'ai', text: row.ai_response });
    });

    contextMessages.push({ sender: 'user', text: messageText });

    // Generate AI response
    const aiResponse = await chatWithCareerMentor(contextMessages, req.user, language, attachment);

    // Save to database
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
    console.error('Chat error:', err);
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
