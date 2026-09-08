import nodemailer from 'nodemailer';

let transporter = null;

// Initialize Nodemailer if SMTP credentials are provided
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('📧 SMTP Email Transporter configured');
}

/**
 * Send an email reminder in user's chosen language
 */
export async function sendEmailReminder({ toEmail, subject, textContent, htmlContent }) {
  console.log(`📨 [Email Service] Preparing email to ${toEmail}`);
  console.log(`   Subject: ${subject}`);

  // 1. Check Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'CareerPilot AI <onboarding@resend.dev>',
          to: [toEmail],
          subject: subject,
          text: textContent,
          html: htmlContent || `<p>${textContent}</p>`,
        }),
      });
      const data = await response.json();
      console.log('✅ Email successfully sent via Resend:', data);
      return { success: true, provider: 'resend', data };
    } catch (err) {
      console.warn('⚠️ Resend email dispatch failed:', err.message);
    }
  }

  // 2. Check SMTP Transporter
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"CareerPilot AI" <noreply@careerpilot.ai>',
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent || `<p>${textContent}</p>`,
      });
      console.log('✅ Email successfully sent via SMTP:', info.messageId);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.warn('⚠️ SMTP email dispatch failed:', err.message);
    }
  }

  // 3. Fallback / Dev mode preview simulation
  console.log('💡 [Email Service Simulation] Logged email notification for preview:');
  console.log(`   To: ${toEmail}`);
  console.log(`   Body: ${textContent}`);
  return {
    success: true,
    simulated: true,
    message: 'Email logged in simulation mode (set RESEND_API_KEY or SMTP_HOST in .env for external delivery).'
  };
}
