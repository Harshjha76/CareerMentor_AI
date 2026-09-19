import nodemailer from 'nodemailer';

let transporter = null;
let etherealTransporter = null;

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
  console.log('📧 SMTP Email Transporter configured successfully');
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
 * Send an email reminder / consistency check-in in user's chosen language
 */
export async function sendEmailReminder({ toEmail, subject, textContent, htmlContent }) {
  console.log(`📨 [Email Service] Preparing email to ${toEmail}`);
  console.log(`   Subject: ${subject}`);

  // 1. Check Resend API (Free 3,000 emails/month tier)
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
      if (response.ok) {
        console.log('✅ Email successfully sent via Resend:', data);
        return { success: true, provider: 'resend', data };
      } else {
        console.warn('⚠️ Resend returned error status:', data);
      }
    } catch (err) {
      console.warn('⚠️ Resend email dispatch failed:', err.message);
    }
  }

  // 2. Check Brevo / Sendinblue API (Free 300 emails/day tier)
  if (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY) {
    try {
      const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'CareerPilot AI Mentor', email: process.env.EMAIL_FROM_ADDRESS || 'mentor@careermentor-ai.com' },
          to: [{ email: toEmail }],
          subject: subject,
          textContent: textContent,
          htmlContent: htmlContent || `<p>${textContent}</p>`
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Email successfully sent via Brevo:', data);
        return { success: true, provider: 'brevo', data };
      }
    } catch (err) {
      console.warn('⚠️ Brevo email dispatch failed:', err.message);
    }
  }

  // 2. Check Custom / Gmail SMTP Transporter
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"CareerPilot AI Mentor" <noreply@careermentor-ai.com>',
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

  // 3. Fallback: Free Ethereal Email with Live Web Preview URL
  try {
    const eth = await getEtherealTransporter();
    if (eth) {
      const info = await eth.sendMail({
        from: '"CareerPilot AI Mentor" <mentor@careerpilot.ai>',
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent || `<p>${textContent}</p>`,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('✅ Email dispatched via Ethereal. Preview URL:', previewUrl);
      return {
        success: true,
        provider: 'ethereal',
        messageId: info.messageId,
        previewUrl,
        message: 'Live test email generated! View preview in browser.'
      };
    }
  } catch (err) {
    console.warn('⚠️ Ethereal email dispatch notice:', err.message);
  }

  // 4. Dev mode preview simulation
  console.log('💡 [Email Service Simulation] Logged email notification for preview:');
  console.log(`   To: ${toEmail}`);
  console.log(`   Body: ${textContent}`);
  return {
    success: true,
    simulated: true,
    message: 'Email logged successfully in simulation mode.'
  };
}
