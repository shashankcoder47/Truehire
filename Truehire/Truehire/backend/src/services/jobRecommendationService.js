import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { hasEmailConfig, sendEmail } from '../utils/email.js';

const CORE_SKILL_SCORE = 50;
const SOFT_SKILL_SCORE = 20;

const normalizeSkill = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const parseSkillList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map(normalizeSkill).filter(Boolean)));
  }

  const raw = String(value).trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Array.from(new Set(parsed.map(normalizeSkill).filter(Boolean)));
    }
  } catch (_error) {
    // Fall through to delimiter parsing for comma/newline text fields.
  }

  return Array.from(
    new Set(
      raw
        .split(/[\n,;|/]+/)
        .map(normalizeSkill)
        .filter(Boolean),
    ),
  );
};

const getRequiredSkills = (job) => parseSkillList(job?.skills_required || job?.requirements || '');

const getRequiredSkillText = (job) => normalizeSkill(job?.skills_required || job?.requirements || '');

const getJobDedupeKey = (job) => [
  job?.recruiter_id != null ? String(job.recruiter_id) : '',
  normalizeSkill(job?.title),
  normalizeSkill(job?.company),
  normalizeSkill(job?.location),
  normalizeSkill(job?.employment_type),
  normalizeSkill(job?.requirements),
  normalizeSkill(job?.benefits),
  normalizeSkill(job?.skills_required),
  job?.salary_min != null ? String(Number(job.salary_min)) : '',
  job?.salary_max != null ? String(Number(job.salary_max)) : '',
].join('|');

const dedupeJobs = (jobs = []) => {
  const seen = new Set();
  const uniqueJobs = [];

  for (const job of jobs) {
    const key = getJobDedupeKey(job);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueJobs.push(job);
  }

  return uniqueJobs;
};

const isSkillMatched = (requiredSkill, requiredSkillText, userSkill) => {
  if (!requiredSkill || !userSkill) return false;
  return (
    requiredSkill === userSkill ||
    requiredSkill.includes(userSkill) ||
    userSkill.includes(requiredSkill) ||
    (requiredSkillText && requiredSkillText.includes(userSkill))
  );
};

export const calculateRecommendationScore = ({ job, user }) => {
  const requiredSkills = getRequiredSkills(job);
  const requiredSkillText = getRequiredSkillText(job);
  if (!requiredSkills.length && !requiredSkillText) {
    return { score: 0, matchedCoreSkills: [], matchedSoftSkills: [], requiredSkills: [] };
  }

  const coreSkills = [
    ...parseSkillList(user?.core_skills),
    ...parseSkillList(user?.secondary_skills),
  ];
  const softSkills = parseSkillList(user?.soft_skills);
  const matchedCoreSkills = [];
  const matchedSoftSkills = [];
  const skillTargets = requiredSkills.length ? requiredSkills : [requiredSkillText];

  for (const coreSkill of coreSkills) {
    if (skillTargets.some((requiredSkill) => isSkillMatched(requiredSkill, requiredSkillText, coreSkill))) {
      matchedCoreSkills.push(coreSkill);
    }
  }

  for (const softSkill of softSkills) {
    if (matchedCoreSkills.includes(softSkill)) {
      continue;
    }

    if (skillTargets.some((requiredSkill) => isSkillMatched(requiredSkill, requiredSkillText, softSkill))) {
      matchedSoftSkills.push(softSkill);
    }
  }

  const score = (matchedCoreSkills.length * CORE_SKILL_SCORE) + (matchedSoftSkills.length * SOFT_SKILL_SCORE);

  return {
    score,
    matchedCoreSkills: Array.from(new Set(matchedCoreSkills)),
    matchedSoftSkills: Array.from(new Set(matchedSoftSkills)),
    requiredSkills,
  };
};

export const getRecommendedJobsForUser = async (userId) => {
  const normalizedUserId = String(userId);
  const [userRows] = await pool.execute(
    'SELECT id, core_skills, secondary_skills, soft_skills FROM users WHERE id = ? LIMIT 1',
    [normalizedUserId],
  );
  const user = userRows[0];

  if (!user) return [];

  const [jobs] = await pool.execute(
    `SELECT
        id,
        recruiter_id,
        title,
        company,
        company_logo,
        location,
        employment_type,
        experience_level,
        salary_min,
        salary_max,
        salary_currency,
        requirements,
        benefits,
        skills_required,
        application_deadline,
        is_urgent,
        created_at
      FROM jobs
      WHERE status = 'OPEN'
        AND (application_deadline IS NULL OR application_deadline >= CURDATE())
      ORDER BY created_at DESC`,
  );

  const [applications] = await pool.execute(
    'SELECT job_id FROM job_applications WHERE user_id = ?',
    [normalizedUserId],
  );

  const appliedJobIds = new Set(applications.map((application) => String(application.job_id)));

  return dedupeJobs(jobs)
    .filter((job) => !appliedJobIds.has(String(job.id)))
    .map((job) => {
      const match = calculateRecommendationScore({ job, user });
      return {
        ...job,
        id: String(job.id),
        recruiter_id: job.recruiter_id != null ? String(job.recruiter_id) : null,
        salary_min: job.salary_min != null ? Number(job.salary_min) : null,
        salary_max: job.salary_max != null ? Number(job.salary_max) : null,
        recommendationScore: match.score,
        matchedCoreSkills: match.matchedCoreSkills,
        matchedSoftSkills: match.matchedSoftSkills,
        requiredSkills: match.requiredSkills,
      };
    })
    .filter((job) => job.recommendationScore > 0)
    .sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) return b.recommendationScore - a.recommendationScore;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
};

const ensureRecommendationEmailTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS job_recommendation_emails (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      job_id BIGINT UNSIGNED NOT NULL,
      sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_job_recommendation_email (user_id, job_id)
    )
  `);
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildFrontendUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return env.frontendUrl ? `${env.frontendUrl}${normalizedPath}` : normalizedPath;
};

const buildJobMatchEmail = ({ user, job, requiredSkills }) => {
  const safeName = escapeHtml(user.name || 'there');
  const safeTitle = escapeHtml(job.title || 'Job');
  const safeCompany = escapeHtml(job.company || 'Company');
  const safeLocation = escapeHtml(job.location || 'Remote');
  const safeSkills = escapeHtml(requiredSkills.join(', ') || 'Not specified');
  const applyUrl = escapeHtml(buildFrontendUrl(`/jobs/${job.id}/apply`));

  return `
    <div style="margin:0;padding:0;background:#eef2f7;font-family:Arial,sans-serif;color:#111827;">
      <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
        A new job matching your profile skills is ready to review on TrueHire.
      </div>
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.10);">
          <div style="background:#111827;padding:28px 30px;color:#ffffff;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;">TrueHire job match</p>
            <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:800;">A matching job was posted</h1>
            <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#d1d5db;">Hi ${safeName}, this role matches skills from your profile.</p>
          </div>

          <div style="padding:30px;">
            <div style="border:1px solid #e5e7eb;border-radius:14px;padding:22px;background:#f9fafb;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#64748b;">Job title</p>
              <h2 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#111827;">${safeTitle}</h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0;border-top:1px solid #e5e7eb;font-size:14px;color:#64748b;width:35%;">Company</td>
                  <td style="padding:10px 0;border-top:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#111827;">${safeCompany}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-top:1px solid #e5e7eb;font-size:14px;color:#64748b;">Location</td>
                  <td style="padding:10px 0;border-top:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#111827;">${safeLocation}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-top:1px solid #e5e7eb;font-size:14px;color:#64748b;vertical-align:top;">Required skills</td>
                  <td style="padding:10px 0;border-top:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#111827;">${safeSkills}</td>
                </tr>
              </table>
            </div>

            <div style="margin:28px 0 22px;text-align:center;">
              <a href="${applyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:800;">
                View Job & Apply
              </a>
            </div>

            <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;text-align:center;">
              If you are already logged in, the button opens the apply page directly. Otherwise, login first and TrueHire will bring you back to this job.
            </p>
          </div>

          <div style="background:#f8fafc;padding:18px 30px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">Best regards,<br /><strong style="color:#111827;">TrueHire Team</strong></p>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const sendJobMatchNotificationsForJob = async (job) => {
  if (!job?.id) return { checked: 0, matched: 0, emailed: 0 };

  const requiredSkills = getRequiredSkills(job);
  if (!requiredSkills.length) return { checked: 0, matched: 0, emailed: 0 };

  const [users] = await pool.execute(
    'SELECT id, name, email, core_skills, secondary_skills, soft_skills FROM users',
  );

  let matched = 0;
  let emailed = 0;
  await ensureRecommendationEmailTable();

  for (const user of users) {
    if (!user.email) continue;

    const match = calculateRecommendationScore({ job, user });
    if (match.score <= 0) continue;

    matched += 1;
    const [existingSend] = await pool.execute(
      `SELECT id
       FROM job_recommendation_emails
       WHERE user_id = ?
         AND job_id = ?
       LIMIT 1`,
      [String(user.id), String(job.id)],
    );

    if (existingSend.length > 0) continue;

    if (!hasEmailConfig) {
      continue;
    }

    try {
      await sendEmail({
        to: user.email,
        subject: 'New Job Match Found',
        html: buildJobMatchEmail({ user, job, requiredSkills: match.requiredSkills }),
      });
      await pool.execute(
        'INSERT IGNORE INTO job_recommendation_emails (user_id, job_id) VALUES (?, ?)',
        [String(user.id), String(job.id)],
      );
      emailed += 1;
    } catch (error) {
      console.error('Failed to send job match email:', {
        userId: String(user.id),
        jobId: String(job.id),
        error: error?.message || error,
      });
    }
  }

  return { checked: users.length, matched, emailed };
};
