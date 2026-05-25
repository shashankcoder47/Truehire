import { env } from '../config/env.js';
import { sendEmail } from '../utils/email.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDeadline = (deadline) => {
  if (!deadline) return 'Open until filled';
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return 'Open until filled';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const buildJobUrl = (jobId) => {
  const baseUrl = env.frontendUrl || '';
  return jobId ? `${baseUrl}/jobs/${encodeURIComponent(String(jobId))}` : `${baseUrl}/jobs`;
};

export const createWeeklyJobAlertEmail = ({ userName, jobs }) => {
  const safeUserName = escapeHtml(userName || 'there');
  const jobCards = jobs
    .map((job, index) => {
      const jobUrl = buildJobUrl(job.id);
      return `
        <div style="border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:0 0 16px;background:#ffffff;">
          <p style="margin:0 0 8px;color:#0891b2;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">
            Match ${index + 1}
          </p>
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;line-height:1.3;">
            ${escapeHtml(job.title)}
          </h2>
          <p style="margin:0 0 6px;color:#334155;font-size:14px;"><strong>Company:</strong> ${escapeHtml(job.company_name || job.company || 'TrueHire partner')}</p>
          <p style="margin:0 0 6px;color:#334155;font-size:14px;"><strong>Location:</strong> ${escapeHtml(job.location || 'Remote')}</p>
          <p style="margin:0 0 18px;color:#334155;font-size:14px;"><strong>Deadline:</strong> ${escapeHtml(formatDeadline(job.application_deadline || job.deadline))}</p>
          <a href="${jobUrl}" style="display:inline-block;background:#020617;color:#ffffff;padding:11px 18px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:800;">
            View job
          </a>
        </div>
      `;
    })
    .join('');

  return `
    <div style="background:#f1f5f9;padding:36px 12px;font-family:Arial,sans-serif;">
      <div style="max-width:660px;margin:auto;background:#f8fafc;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.12);">
        <div style="background:linear-gradient(135deg,#071827,#0f766e);padding:30px;color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#a5f3fc;">TrueHire weekly matches</p>
          <h1 style="margin:0;font-size:28px;line-height:1.25;">Your weekly job matches from TrueHire</h1>
        </div>
        <div style="padding:30px;">
          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Hi ${safeUserName},</p>
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
            Here are active jobs matching your skills this week. Apply before the deadline from your TrueHire dashboard.
          </p>
          ${jobCards}
          <p style="margin:24px 0 0;color:#475569;font-size:14px;line-height:1.7;">
            Regards,<br /><strong>TrueHire Team</strong>
          </p>
        </div>
        <div style="background:#e2e8f0;padding:16px;text-align:center;color:#64748b;font-size:12px;">
          &copy; ${new Date().getFullYear()} TrueHire. You received this because weekly job alerts are enabled.
        </div>
      </div>
    </div>
  `;
};

export const sendWeeklyJobAlertEmail = ({ to, userName, jobs }) =>
  sendEmail({
    to,
    subject: 'Your weekly job matches from TrueHire',
    html: createWeeklyJobAlertEmail({ userName, jobs }),
  });
