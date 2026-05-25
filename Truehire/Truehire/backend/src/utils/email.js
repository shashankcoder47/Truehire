import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const emailService = process.env.EMAIL_SERVICE || 'gmail';
const smtpHost = String(process.env.EMAIL_HOST || '').trim();
const smtpPort = Number(process.env.EMAIL_PORT || 587);
const smtpUser = String(process.env.EMAIL_USER || '').trim();
const smtpPass = String(process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

let transporter;

const hasEmailConfig = Boolean(smtpUser && smtpPass);

const getTransporter = () => {
  if (!hasEmailConfig) {
    throw new Error('Email service is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env');
  }

  if (!transporter) {
    const transportConfig = smtpHost
      ? {
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
        }
      : {
          service: emailService,
        };

    transporter = nodemailer.createTransport({
      ...transportConfig,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const mailer = getTransporter();

  try {
    return await mailer.sendMail({
      from: `"TrueHire" <${smtpUser}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    if (error?.code === 'EAUTH' || error?.responseCode === 535) {
      throw new Error('Email login failed. Update EMAIL_USER and EMAIL_PASS with a valid Gmail app password.');
    }

    throw error;
  }
};

export const sendOtpEmail = async ({ to, otp }) => {
  const html = `
    <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,sans-serif;">
      <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 14px rgba(0,0,0,0.1)">
        <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;">TrueHire</h1>
          <p style="margin-top:8px;color:#e0e7ff;font-size:14px;">Secure Login Confirmation</p>
        </div>
        <div style="padding:32px;text-align:center;color:#333;">
          <h2 style="margin-top:0;font-size:22px;">Verify Your Login</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            Use the verification code below to complete your sign-in.
          </p>
          <div style="margin:28px 0;">
            <span style="display:inline-block;background:#f1f5f9;padding:16px 34px;font-size:28px;letter-spacing:8px;font-weight:bold;border-radius:10px;color:#4f46e5;border:1px dashed #c7d2fe;">
              ${otp}
            </span>
          </div>
          <p style="font-size:14px;color:#666;">This code is valid for <strong>10 minutes</strong>.</p>
          <p style="margin-top:26px;font-size:14px;color:#555;">Best regards,<br /><strong>TrueHire Team</strong></p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#888;">
          &copy; ${new Date().getFullYear()} TrueHire
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Your TrueHire Login Verification Code',
    html,
  });
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;">
      <h2 style="color:#111827;">Password Reset Request</h2>
      <p style="color:#374151;">Hi ${name || 'there'},</p>
      <p style="color:#4b5563;line-height:1.6;">
        We received a request to reset your TrueHire password. Click the button below to choose a new password.
      </p>
      <div style="margin:28px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
      </div>
      <p style="color:#6b7280;line-height:1.6;">
        This link will expire in 1 hour. If you did not request a password reset, you can ignore this email.
      </p>
      <p style="color:#374151;">Best regards,<br /><strong>TrueHire Team</strong></p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'TrueHire Password Reset',
    html,
  });
};

export const sendWelcomeEmail = async ({ to, name, roleLabel, loginPath = '/login' }) => {
  const normalizedName = String(name || 'there').trim();
  const normalizedRoleLabel = String(roleLabel || 'account').trim().toLowerCase();
  const accountLabel = normalizedRoleLabel === 'recruiter' ? 'recruiter account' : `${normalizedRoleLabel} account`;

  const html = `
    <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,sans-serif;">
      <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 14px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;">TrueHire</h1>
          <p style="margin-top:8px;color:#e0e7ff;font-size:14px;">Account Ready</p>
        </div>
        <div style="padding:32px;color:#333;">
          <h2 style="margin-top:0;margin-bottom:16px;font-size:28px;color:#111827;text-align:center;">Welcome to TrueHire</h2>
          <p style="margin:0 0 18px;color:#374151;font-size:16px;">Hi ${normalizedName},</p>
          <p style="margin:0 0 18px;color:#555;font-size:15px;line-height:1.7;">
            Your ${accountLabel} has been created successfully. You can now sign in and continue using TrueHire.
          </p>
          <p style="margin:0 0 28px;color:#555;font-size:15px;line-height:1.7;">
            Click the button below to open your login page.
          </p>
          <div style="margin:0 0 28px;">
            <a href="${env.frontendUrl}${loginPath}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;">
              Go to Login
            </a>
          </div>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
            Best regards,<br /><strong>TrueHire Team</strong>
          </p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#888;">
          &copy; ${new Date().getFullYear()} TrueHire
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Welcome to TrueHire',
    html,
  });
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getTextItems = (value, limit = 5) => {
  if (!value) return [];
  const rawItems = Array.isArray(value)
    ? value
    : String(value)
        .split(/\r?\n|[|•]/)
        .flatMap((item) => String(item).split(/,(?=\s*[A-Z0-9])/));

  return rawItems
    .map((item) => String(item).replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, limit);
};

const renderEmailListSection = (title, items, accentColor) => {
  if (!items.length) return '';

  const listItems = items
    .map(
      (item) => `
        <li style="margin:0 0 8px;padding-left:2px;color:#475569;line-height:1.55;">
          <span style="color:${accentColor};font-weight:700;">•</span>
          <span style="margin-left:8px;">${escapeHtml(item)}</span>
        </li>
      `,
    )
    .join('');

  return `
    <div style="margin-top:18px;padding-top:18px;border-top:1px solid #e2e8f0;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#334155;">${title}</p>
      <ul style="margin:0;padding:0;list-style:none;">
        ${listItems}
      </ul>
    </div>
  `;
};

const sendJobPostedEmail = async ({
  to,
  name,
  job,
  eyebrow = 'TrueHire job alert',
  intro = 'A new role has been posted on TrueHire.',
  footer = 'You received this because you enabled job alerts on TrueHire.',
}) => {
  const candidateName = String(name || 'there').trim();
  const jobTitle = String(job?.title || 'New job').trim();
  const companyName = String(job?.company || 'A company you follow').trim();
  const location = String(job?.location || 'Remote').trim();
  const requirements = getTextItems(job?.requirements);
  const benefits = getTextItems(job?.benefits);
  const requirementsHtml = renderEmailListSection('Requirements', requirements, '#2563eb');
  const benefitsHtml = renderEmailListSection('Benefits', benefits, '#059669');
  const jobId = String(job?.id || job?.jobId || job?.job_id || '').trim();
  const jobUrl = jobId
    ? `${env.frontendUrl || ''}/jobs/${encodeURIComponent(jobId)}`
    : `${env.frontendUrl || ''}/jobs`;

  const html = `
    <div style="background:#eef4ff;padding:36px 12px;font-family:Arial,sans-serif;">
      <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.14);">
        <div style="background:#10233f;padding:28px;color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#bae6fd;">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:0;font-size:26px;line-height:1.25;">${escapeHtml(companyName)} posted a new job</h1>
        </div>
        <div style="padding:30px;color:#1f2937;">
          <p style="margin:0 0 18px;font-size:16px;">Hi ${escapeHtml(candidateName)},</p>
          <p style="margin:0 0 18px;color:#4b5563;line-height:1.7;">
            ${escapeHtml(intro)}
          </p>
          <div style="border:1px solid #dbeafe;background:#f8fbff;border-radius:12px;padding:22px;margin:22px 0;">
            <h2 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#0f172a;">${escapeHtml(jobTitle)}</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0;">
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;width:96px;">Company</td>
                <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:700;">${escapeHtml(companyName)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;width:96px;">Location</td>
                <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:700;">${escapeHtml(location)}</td>
              </tr>
            </table>
            ${requirementsHtml}
            ${benefitsHtml}
          </div>
          <a href="${jobUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;padding:13px 22px;border-radius:9px;text-decoration:none;font-weight:700;">
            View job
          </a>
          <p style="margin:26px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
            ${escapeHtml(footer)}
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `${companyName} posted a new job: ${jobTitle}`,
    html,
  });
};

export const sendFollowedCompanyJobEmail = async ({ to, name, job }) =>
  sendJobPostedEmail({
    to,
    name,
    job,
    eyebrow: 'TrueHire company alert',
    intro: 'A company you follow on TrueHire has posted a new role.',
    footer: `You received this because you follow ${String(job?.company || 'this company').trim()} on TrueHire.`,
  });

export { hasEmailConfig };
