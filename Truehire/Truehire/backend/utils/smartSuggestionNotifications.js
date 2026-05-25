const { pool } = require('../config/database');

const SUGGESTION_DELAY_MINUTES = parseInt(
  process.env.SMART_SUGGESTION_DELAY_MINUTES || '5',
  10
);
const CHECK_INTERVAL_MINUTES = parseInt(
  process.env.SMART_SUGGESTION_CHECK_INTERVAL_MINUTES || '1',
  10
);
const CHECK_INTERVAL_MS = Math.max(CHECK_INTERVAL_MINUTES, 1) * 60 * 1000;

const NOTIFICATION_TITLE = 'Explore Similar Jobs';
const NOTIFICATION_MESSAGE =
  "We're still waiting for a response from the recruiter. Meanwhile, here are similar jobs you might be interested in.";

const MAX_SUGGESTIONS = parseInt(
  process.env.SMART_SUGGESTION_MAX_RESULTS || '6',
  10
);
const RECRUITER_ACTIVE_DAYS = parseInt(
  process.env.SMART_SUGGESTION_RECRUITER_ACTIVE_DAYS || '30',
  10
);
const RECENT_RECRUITER_WINDOW_DAYS = Math.max(RECRUITER_ACTIVE_DAYS, 1);

let isRunning = false;

const buildMetadata = (applicationId, jobId, suggestedJobs = []) => ({
  title: NOTIFICATION_TITLE,
  type: 'smart_suggestion',
  applicationId,
  jobId,
  jobs: suggestedJobs,
  actions: {
    primary: {
      label: 'Browse similar jobs',
      href: jobId ? `/jobs?relatedTo=${jobId}` : '/jobs'
    }
  }
});

const normalizeText = (value) => (value || '').toString().toLowerCase();
const splitKeywords = (value) =>
  normalizeText(value)
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean);
const normalizeLocation = (value) =>
  normalizeText(value)
    .replace(/\bremote\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const isRemoteLocation = (value) => normalizeText(value).includes('remote');

const isSameOrNearbyLocation = (jobLocation, targetLocation) => {
  if (!jobLocation || !targetLocation) return false;
  if (isRemoteLocation(jobLocation) || isRemoteLocation(targetLocation)) return true;

  const jobParts = normalizeLocation(jobLocation)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const targetParts = normalizeLocation(targetLocation)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return jobParts.some((part) => targetParts.includes(part));
};

const buildContext = (applicationRow) => {
  const skillKeywords = []
    .concat(applicationRow.core_skills || '')
    .concat(applicationRow.secondary_skills || '')
    .concat(applicationRow.tools_technologies || '')
    .concat(applicationRow.skill_keywords || '')
    .concat(applicationRow.skills_required || '')
    .join(',');

  const preferredLocations = []
    .concat(applicationRow.preferred_locations || '')
    .concat(applicationRow.location || '')
    .join(',');

  return {
    title: applicationRow.job_title || applicationRow.title || '',
    skills: splitKeywords(skillKeywords),
    experienceLevel: normalizeText(applicationRow.experience_level || ''),
    location: preferredLocations,
    industry:
      normalizeText(applicationRow.industry_preference || '') ||
      normalizeText(applicationRow.functional_area || ''),
    employmentType: normalizeText(applicationRow.preferred_employment_type || '')
  };
};

const scoreJobMatch = (job, context) => {
  const jobTitleKeywords = splitKeywords(job.title);
  const titleOverlap = jobTitleKeywords.some((word) =>
    splitKeywords(context.title).includes(word)
  );

  const jobSkillKeywords = splitKeywords(job.skills_required || '');
  const skillOverlap = jobSkillKeywords.some((skill) => context.skills.includes(skill));

  const experienceMatch = context.experienceLevel
    ? normalizeText(job.experience_level) === context.experienceLevel
    : false;

  const locationMatch = context.location
    ? isSameOrNearbyLocation(job.location, context.location)
    : false;

  const employmentMatch = context.employmentType
    ? normalizeText(job.employment_type) === context.employmentType
    : false;

  const industryMatch = context.industry
    ? normalizeText(job.description || '').includes(context.industry) ||
      normalizeText(job.requirements || '').includes(context.industry)
    : false;

  let score = 0;
  if (titleOverlap) score += 3;
  if (skillOverlap) score += 3;
  if (experienceMatch) score += 2;
  if (locationMatch || isRemoteLocation(job.location)) score += 2;
  if (industryMatch) score += 1;
  if (employmentMatch) score += 1;

  return {
    score,
    meetsRules:
      titleOverlap &&
      skillOverlap &&
      (experienceMatch || !context.experienceLevel) &&
      (locationMatch || isRemoteLocation(job.location)) &&
      (industryMatch || !context.industry)
  };
};

const fetchRelatedJobs = async (applicationRow) => {
  const context = buildContext(applicationRow);
  const query = `
    SELECT
      j.id,
      j.title,
      j.company,
      j.location,
      j.experience_level,
      j.employment_type,
      j.skills_required,
      j.description,
      j.requirements,
      j.updated_at,
      r.updated_at AS recruiter_updated_at
    FROM jobs j
    LEFT JOIN recruiters r ON r.id = j.recruiter_id
    WHERE j.status = 'Active'
      AND j.id <> ?
      AND (
        r.updated_at IS NULL
        OR r.updated_at >= DATE_SUB(NOW(), INTERVAL ${RECENT_RECRUITER_WINDOW_DAYS} DAY)
      )
    ORDER BY j.updated_at DESC
    LIMIT 50
  `;

  const [rows] = await pool.execute(query, [applicationRow.job_id]);
  const ranked = (rows || [])
    .map((job) => ({ job, match: scoreJobMatch(job, context) }))
    .filter((entry) => entry.match.meetsRules || entry.match.score >= 6)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, MAX_SUGGESTIONS)
    .map((entry) => ({
      id: entry.job.id,
      title: entry.job.title,
      company: entry.job.company,
      location: entry.job.location,
      experienceLevel: entry.job.experience_level
    }));

  return ranked;
};

const fetchEligibleApplications = async () => {
  const query = `
    SELECT
      ja.id,
      ja.user_id AS userId,
      ja.job_id AS jobId,
      ja.smart_timer_started_at,
      j.title AS job_title,
      j.location,
      j.experience_level,
      j.employment_type,
      j.skills_required,
      j.description,
      j.requirements,
      u.desired_job_role,
      u.core_skills,
      u.secondary_skills,
      u.tools_technologies,
      u.skill_keywords,
      u.preferred_locations,
      u.preferred_employment_type,
      u.industry_preference,
      u.functional_area
    FROM job_applications ja
    INNER JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN users u ON ja.user_id = u.id
    WHERE ja.recruiter_last_action_at IS NULL
      AND (ja.smart_suggestion_triggered = 0 OR ja.smart_suggestion_triggered IS NULL)
      AND ja.smart_timer_started_at IS NOT NULL
      AND ja.smart_timer_started_at <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
  `;
  const [rows] = await pool.execute(query, [SUGGESTION_DELAY_MINUTES]);
  return rows || [];
};

const markTriggered = async (connection, applicationId) => {
  const [result] = await connection.execute(
    `
      UPDATE job_applications
      SET smart_suggestion_triggered = 1
      WHERE id = ?
        AND recruiter_last_action_at IS NULL
        AND (smart_suggestion_triggered = 0 OR smart_suggestion_triggered IS NULL)
    `,
    [applicationId]
  );
  return result.affectedRows > 0;
};

const insertNotification = async (
  connection,
  userId,
  applicationId,
  jobId,
  suggestedJobs
) => {
  const metadata = buildMetadata(applicationId, jobId, suggestedJobs);
  await connection.execute(
    `
      INSERT INTO user_notifications (
        user_id, application_id, message, metadata, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'unread', NOW(), NOW())
    `,
    [userId, applicationId, NOTIFICATION_MESSAGE, JSON.stringify(metadata)]
  );
};

const runSmartSuggestionNotifications = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const applications = await fetchEligibleApplications();
    if (!applications.length) {
      return;
    }

    for (const application of applications) {
      const suggestedJobs = await fetchRelatedJobs(application);
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const updated = await markTriggered(connection, application.id);
        if (!updated) {
          await connection.rollback();
          continue;
        }

        await insertNotification(
          connection,
          application.userId,
          application.id,
          application.jobId,
          suggestedJobs
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        console.error(
          'Smart suggestion notification failed for application',
          application.id,
          error
        );
      } finally {
        connection.release();
      }
    }
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.warn(
        'Smart suggestion notifications skipped: missing job_applications columns.'
      );
    } else {
      console.error('Smart suggestion notification runner failed:', error);
    }
  } finally {
    isRunning = false;
  }
};

const scheduleSmartSuggestionNotifications = () => {
  runSmartSuggestionNotifications();
  setInterval(runSmartSuggestionNotifications, CHECK_INTERVAL_MS);
};

module.exports = {
  runSmartSuggestionNotifications,
  scheduleSmartSuggestionNotifications
};
