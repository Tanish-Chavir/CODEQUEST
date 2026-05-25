import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let testAccount = null;
let testTransporter = null;

/**
 * Send email using Nodemailer (SMTP / Ethereal fallback)
 */
const sendNodemailer = async (to, subject, html) => {
  let activeTransporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    activeTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    if (!testAccount) {
      console.log("Generating Ethereal test account for email previews...");
      testAccount = await nodemailer.createTestAccount();
      testTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
    activeTransporter = testTransporter;
  }

  const from = process.env.EMAIL_FROM || '"CodeQuest" <noreply@codequest.app>';
  const info = await activeTransporter.sendMail({
    from,
    to,
    subject,
    html
  });

  if (!process.env.EMAIL_USER) {
    console.log(`\n📧 Email sent! View it in your browser: ${nodemailer.getTestMessageUrl(info)}\n`);
  }
  return info;
};

/**
 * Send email using Resend REST API
 */
const sendResend = async (to, subject, html) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "CodeQuest <onboarding@resend.dev>";
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Resend API call failed");
  }
  return data;
};

/**
 * Send email using SendGrid REST API
 */
const sendSendGrid = async (to, subject, html) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM || "noreply@codequest.app";

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: "CodeQuest" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "SendGrid API call failed");
  }
  return { success: true };
};

/**
 * Reusable Unified Email Service
 */
export const emailService = {
  /**
   * Send a generic email, automatically resolving the provider based on env variables
   */
  async sendEmail({ to, subject, html }) {
    try {
      if (process.env.RESEND_API_KEY) {
        console.log(`[EmailService] Sending via Resend to ${to}...`);
        return await sendResend(to, subject, html);
      } else if (process.env.SENDGRID_API_KEY) {
        console.log(`[EmailService] Sending via SendGrid to ${to}...`);
        return await sendSendGrid(to, subject, html);
      } else {
        console.log(`[EmailService] Sending via Nodemailer/Ethereal to ${to}...`);
        return await sendNodemailer(to, subject, html);
      }
    } catch (error) {
      console.error("[EmailService] Failed to send email:", error.message);
      throw error;
    }
  },

  /**
   * Send One-Time Password (OTP) email
   */
  async sendOtpEmail(to, otp) {
    console.log(`\n🔐 [OTP SERVICE] Generated OTP verification code for ${to} is: ${otp}\n`);
    const subject = "CodeQuest Verification Code 🔐";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #4F46E5; text-align: center;">Welcome to CodeQuest</h2>
        <p>Hello,</p>
        <p>Use the following 6-digit verification code to complete your secure login. This code is valid for 5 minutes.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1F2937; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #6B7280; font-size: 14px;">If you did not request this code, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="text-align: center; color: #9CA3AF; font-size: 12px;">© CodeQuest Team. Elevate your coding skills.</p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  },

  /**
   * Send Security login notification email
   */
  async sendLoginNotificationEmail(to, username) {
    const subject = "New Login to CodeQuest 🚀";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #10B981; text-align: center;">New Sign-In Detected</h2>
        <p>Hi ${username},</p>
        <p>We detected a new sign-in to your CodeQuest account on ${new Date().toLocaleString()}.</p>
        <p>If this was you, you're all set! Keep up the amazing coding momentum. If you did not recognize this activity, please contact support immediately.</p>
        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="text-align: center; color: #9CA3AF; font-size: 12px;">© CodeQuest Team. Elevate your coding skills.</p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  },

  /**
   * Send Daily study reminder email
   */
  async sendStudyReminderEmail(to, username) {
    const subject = "Ready for your daily CodeQuest? ⚔️🔥";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #4F46E5; text-align: center;">⚔️ CodeQuest Learning Quest awaits!</h2>
        <p>Hi ${username},</p>
        <p>It's time for your daily CodeQuest habit! Completing just one coding quest or quiz a day reinforces concept retention and keeps your daily flame active.</p>
        
        <div style="background-color: #EEF2F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1F2937;">Today's Daily Multipliers:</h4>
          <ul style="color: #4B5563; font-size: 14px; padding-left: 20px;">
            <li>Daily login streak bonus: <strong>+100 XP</strong></li>
            <li>Interactive timeline quizzes: <strong>+50 XP</strong></li>
            <li>YouTube quest watch time conversion: <strong>2x XP</strong></li>
          </ul>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="http://localhost:3000/dashboard" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Resume Quest Now →</a>
        </div>

        <p style="color: #6B7280; font-size: 14px;">Want to change your reminder schedule? Simply adjust your time preferences inside your Account Settings page on the dashboard.</p>
        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="text-align: center; color: #9CA3AF; font-size: 12px;">© CodeQuest Team. Gamifying computer science education.</p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }
};
