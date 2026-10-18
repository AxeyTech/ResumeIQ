import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Generate a cryptographically random 6-digit OTP.
 */
export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * OTP validity window in minutes.
 */
export const OTP_EXPIRY_MINUTES = 10;

/**
 * Create a Nodemailer transporter using Gmail SMTP.
 * Falls back gracefully if SMTP credentials are not configured.
 */
let transporter = null;

function getTransporter() {
  if (!transporter && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS.replace(/\s+/g, ''),
      },
    });
  }
  return transporter;
}

/**
 * Send a 6-digit OTP verification email to the given address.
 * @param {string} toEmail
 * @param {string} otp
 * @param {string} userName
 */
export async function sendVerificationEmail(toEmail, otp, userName) {
  const mailer = getTransporter();
  if (!mailer) {
    logger.warn(`Email sending disabled — OTP for ${toEmail}: ${otp}`);
    return;
  }

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; color: #0f172a; margin: 0;">
          Resume<span style="background: linear-gradient(135deg, #4285F4, #34A853); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">IQ</span>
        </h1>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 8px;">Verify your email address</h2>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px;">
          Hi ${userName || 'there'}, enter the verification code below in ResumeIQ to activate your account.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px 32px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${otp}</span>
          </div>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. If you didn't sign up for ResumeIQ, ignore this email.
        </p>
      </div>
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
        &copy; ${new Date().getFullYear()} ResumeIQ &mdash; AI-Powered ATS Resume Optimization
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ResumeIQ" <${env.SMTP_USER}>`,
    to: toEmail,
    subject: `${otp} — Your ResumeIQ Verification Code`,
    html,
  });

  logger.info('Verification email sent', { toEmail });
}
