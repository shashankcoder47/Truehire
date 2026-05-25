import { sendEmail } from './email.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const createShortlistedEmailTemplate = ({ candidateName, jobTitle, companyName }) => {
  const safeCandidateName = escapeHtml(candidateName || 'Candidate');
  const safeJobTitle = escapeHtml(jobTitle || 'this position');
  const safeCompanyName = escapeHtml(companyName || 'TrueHire');
  const year = new Date().getFullYear();

  return `
    <div style="background:#f4f6f8;padding:40px 12px;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 24px rgba(15,23,42,0.12);">
        <div style="background:linear-gradient(135deg,#4f46e5,#2563eb);padding:30px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;">TrueHire</h1>
          <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">Recruitment Team</p>
        </div>
        <div style="padding:34px;color:#1f2937;">
          <p style="margin:0 0 18px;font-size:16px;">Hello ${safeCandidateName},</p>
          <h2 style="margin:0 0 18px;color:#111827;font-size:24px;">Congratulations!</h2>
          <p style="margin:0 0 18px;color:#4b5563;font-size:16px;line-height:1.7;">
            Your application for the position of <strong style="color:#111827;">${safeJobTitle}</strong>
            ${safeCompanyName && safeCompanyName !== 'TrueHire' ? `at <strong style="color:#111827;">${safeCompanyName}</strong>` : ''}
            has been shortlisted successfully.
          </p>
          <div style="margin:24px 0;padding:18px;border-left:4px solid #4f46e5;background:#eef2ff;border-radius:8px;">
            <p style="margin:0;color:#3730a3;font-size:15px;line-height:1.6;">
              Our recruitment team will contact you shortly regarding the next steps in the hiring process.
            </p>
          </div>
          <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">
            Best Regards,<br />
            <strong>${safeCompanyName}</strong>
          </p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#6b7280;">
          &copy; ${year} TrueHire. Building careers with purpose.
        </div>
      </div>
    </div>
  `;
};

export const sendShortlistedEmail = ({ to, candidateName, jobTitle, companyName }) =>
  sendEmail({
    to,
    subject: 'Application Shortlisted - TrueHire',
    html: createShortlistedEmailTemplate({
      candidateName,
      jobTitle,
      companyName,
    }),
  });

export { sendEmail };
