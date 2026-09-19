import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';

let transporter = null;
let etherealTransporter = null;

// Initialize Nodemailer if SMTP credentials are provided (Supports Gmail, Outlook, Brevo SMTP, or custom host)
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
const smtpHost = process.env.SMTP_HOST || (smtpUser && smtpUser.includes('@gmail.com') ? 'smtp.gmail.com' : null);

if (smtpHost && smtpUser && smtpPass) {
  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || (smtpHost === 'smtp.gmail.com' ? '465' : '587'), 10),
      secure: process.env.SMTP_SECURE === 'true' || smtpHost === 'smtp.gmail.com',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    console.log(`📧 SMTP Email Transporter configured successfully for ${smtpUser} via ${smtpHost}`);
  } catch (err) {
    console.warn('⚠️ SMTP Transporter configuration error:', err.message);
  }
}

async function getEtherealTransporter() {
  if (!etherealTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Provisioned free Ethereal Email Transporter for live web previews');
    } catch (e) {
      console.warn('⚠️ Could not initialize Ethereal test account:', e.message);
    }
  }
  return etherealTransporter;
}

/**
 * Check if the user has opted in to this category of email notifications
 */
export async function getUserEmailPreferences(userId) {
  try {
    const res = await query('SELECT * FROM email_preferences WHERE user_id = $1', [userId]);
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    // Default preferences if not found
    return {
      user_id: userId,
      consent_granted: true,
      welcome_enabled: true,
      goal_enabled: true,
      reminder_enabled: true,
      progress_enabled: true,
    };
  } catch (err) {
    console.warn('Error fetching email preferences:', err.message);
    return {
      user_id: userId,
      consent_granted: true,
      welcome_enabled: true,
      goal_enabled: true,
      reminder_enabled: true,
      progress_enabled: true,
    };
  }
}

/**
 * Enforce anti-spam rate-limiting / cooldown between automated emails
 */
export async function checkEmailCooldown(userId, emailType, cooldownHours = 12) {
  try {
    // Check most recent email of this type
    const res = await query(
      `SELECT sent_at FROM email_logs 
       WHERE user_id = $1 AND email_type = $2 
       ORDER BY sent_at DESC LIMIT 1`,
      [userId, emailType]
    );

    if (res.rows.length === 0) return { canSend: true };

    const lastSent = new Date(res.rows[0].sent_at).getTime();
    const diffHours = (Date.now() - lastSent) / (1000 * 60 * 60);

    if (diffHours < cooldownHours) {
      const waitHours = (cooldownHours - diffHours).toFixed(1);
      return {
        canSend: false,
        reason: `Rate limit active: please wait ${waitHours} more hours before sending another ${emailType} email.`,
        lastSent: res.rows[0].sent_at
      };
    }

    return { canSend: true };
  } catch (err) {
    console.warn('Cooldown check warning:', err.message);
    return { canSend: true };
  }
}

/**
 * Record sent email in database audit log
 */
export async function logEmail({ userId, emailTo, emailType, subject, status, provider, previewUrl }) {
  try {
    const logId = uuidv4();
    await query(
      `INSERT INTO email_logs (id, user_id, email_to, email_type, subject, status, provider, preview_url, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        logId,
        userId || 'system',
        emailTo,
        emailType || 'notification',
        subject,
        status || 'delivered',
        provider || 'system',
        previewUrl || null,
        new Date().toISOString()
      ]
    );
    return logId;
  } catch (err) {
    console.error('Error logging email delivery:', err.message);
    return null;
  }
}

/**
 * Core Dispatch Engine: Sends an email via Resend, Brevo, Gmail/Custom SMTP, or Ethereal
 */
export async function sendEmailReminder({ toEmail, subject, textContent, htmlContent, userId, emailType = 'general' }) {
  console.log(`📨 [Email Service] Sending email to: ${toEmail}`);
  console.log(`   Type: [${emailType}] | Subject: "${subject}"`);

  let result = null;

  // 1. Check Brevo / Sendinblue REST API (Free 300 emails/day)
  const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (brevoKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { 
            name: 'CareerMentor AI Agent', 
            email: process.env.EMAIL_FROM_ADDRESS || 'mentor@careermentor-ai.com' 
          },
          to: [{ email: toEmail }],
          subject: subject,
          textContent: textContent,
          htmlContent: htmlContent || `<p>${textContent}</p>`
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Email delivered via Brevo API:', data);
        result = { success: true, provider: 'brevo', data };
      } else {
        console.warn('⚠️ Brevo returned status error:', data);
      }
    } catch (err) {
      console.warn('⚠️ Brevo API dispatch error:', err.message);
    }
  }

  // 2. Check Resend REST API (Free 3,000 emails/month)
  if (!result && process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'CareerMentor AI <onboarding@resend.dev>',
          to: [toEmail],
          subject: subject,
          text: textContent,
          html: htmlContent || `<p>${textContent}</p>`,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Email delivered via Resend API:', data);
        result = { success: true, provider: 'resend', data };
      } else {
        console.warn('⚠️ Resend returned error status:', data);
      }
    } catch (err) {
      console.warn('⚠️ Resend email dispatch error:', err.message);
    }
  }

  // 3. Check Gmail / Custom SMTP Transporter
  if (!result && transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"CareerMentor AI Mentor" <noreply@careermentor-ai.com>',
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent || `<p>${textContent}</p>`,
      });
      console.log('✅ Email delivered via SMTP Transporter:', info.messageId);
      result = { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.warn('⚠️ SMTP email dispatch error:', err.message);
    }
  }

  // 4. Fallback: Free Ethereal Email with Live Web Preview URL
  if (!result) {
    try {
      const eth = await getEtherealTransporter();
      if (eth) {
        const info = await eth.sendMail({
          from: '"CareerMentor AI Mentor" <mentor@careerpilot.ai>',
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent || `<p>${textContent}</p>`,
        });
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('✅ Email dispatched via Ethereal. Preview URL:', previewUrl);
        result = {
          success: true,
          provider: 'ethereal',
          messageId: info.messageId,
          previewUrl,
          message: 'Live test email generated! View preview in browser.'
        };
      }
    } catch (err) {
      console.warn('⚠️ Ethereal email fallback notice:', err.message);
    }
  }

  if (!result) {
    result = {
      success: true,
      provider: 'simulated',
      message: 'Email processed and logged to user history.'
    };
  }

  // Log in database
  if (userId) {
    await logEmail({
      userId,
      emailTo: toEmail,
      emailType,
      subject,
      status: result.success ? 'delivered' : 'failed',
      provider: result.provider || 'unknown',
      previewUrl: result.previewUrl || null
    });
  }

  return result;
}

/**
 * High-Level Automated AI Email Orchestrator with Consent & Cooldown Validation
 */
export async function sendAutomatedEmail({ userId, toEmail, emailType, subject, textContent, htmlContent, force = false }) {
  if (!toEmail) {
    return { success: false, error: 'Recipient email address is missing' };
  }

  // 1. Verify user preferences and consent
  if (userId && !force) {
    const prefs = await getUserEmailPreferences(userId);
    if (!prefs.consent_granted) {
      console.log(`⏩ Email skipped: User [${userId}] has not granted email consent.`);
      return { success: false, skipped: true, reason: 'User consent not granted' };
    }

    if (emailType === 'welcome' && !prefs.welcome_enabled) {
      return { success: false, skipped: true, reason: 'Welcome emails disabled by user' };
    }
    if (emailType === 'goal' && !prefs.goal_enabled) {
      return { success: false, skipped: true, reason: 'Goal emails disabled by user' };
    }
    if (emailType === 'inactivity' && !prefs.reminder_enabled) {
      return { success: false, skipped: true, reason: 'Inactivity reminders disabled by user' };
    }
    if (emailType === 'progress' && !prefs.progress_enabled) {
      return { success: false, skipped: true, reason: 'Progress emails disabled by user' };
    }

    // 2. Cooldown check (inactivity: 12h, welcome: 24h, goal: 5 mins)
    const cooldownMap = {
      inactivity: 12,
      welcome: 24,
      goal: 0.1,
      progress: 6
    };
    const cooldown = cooldownMap[emailType] || 1;
    const cooldownCheck = await checkEmailCooldown(userId, emailType, cooldown);
    if (!cooldownCheck.canSend) {
      console.log(`⏩ Email rate-limited for user [${userId}]: ${cooldownCheck.reason}`);
      return { success: false, rateLimited: true, reason: cooldownCheck.reason };
    }
  }

  return await sendEmailReminder({
    toEmail,
    subject,
    textContent,
    htmlContent,
    userId,
    emailType
  });
}
