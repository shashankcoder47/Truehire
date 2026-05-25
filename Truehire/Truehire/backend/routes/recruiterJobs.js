const express = require('express');
const Job = require('../models/Job');
const Recruiter = require('../models/Recruiter');
const { verifyToken, requireRecruiter } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

const EXPIRE_JOB_STATUSES = ['OPEN', 'Active'];

const expirePastDeadlineJobs = async () => {
  const expireSql = `
    UPDATE jobs
    SET status = 'Expired', updated_at = NOW()
    WHERE status IN (?, ?)
      AND application_deadline IS NOT NULL
      AND DATE(application_deadline) < CURDATE()
  `;

  try {
    await pool.execute(expireSql, EXPIRE_JOB_STATUSES);
  } catch (error) {
    // Backward compatibility: if legacy schema does not support "Expired",
    // skip status mutation and rely on fetch-time filtering below.
    if (error?.code !== 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
      throw error;
    }
  }
};

router.get('/jobs', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await expirePastDeadlineJobs();

    const recruiterId =
      req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
        ? req.user.mainRecruiterId
        : req.user.id;

    const recruiterRecord = await Recruiter.findById(recruiterId).catch(() => null);
    const recruiterKeys = [recruiterId];
    if (recruiterRecord?.recruiter_id && String(recruiterRecord.recruiter_id) !== String(recruiterId)) {
      recruiterKeys.push(recruiterRecord.recruiter_id);
    }

    let jobs = [];
    if (recruiterKeys.length === 1) {
      jobs = await Job.findByRecruiter(recruiterId);
    } else {
      const placeholders = recruiterKeys.map(() => '?').join(',');
      const [rows] = await req.db.pool.execute(
        `SELECT * FROM jobs
         WHERE recruiter_id IN (${placeholders})
           AND status <> 'Expired'
           AND (application_deadline IS NULL OR DATE(application_deadline) >= CURDATE())
         ORDER BY created_at DESC`,
        recruiterKeys
      );
      jobs = rows.map((row) => new Job(row));
    }

    jobs = jobs.filter((job) => {
      const status = String(job?.status || '').toLowerCase();
      if (status === 'expired') return false;

      if (!job?.application_deadline) return true;
      const deadline = new Date(job.application_deadline);
      if (Number.isNaN(deadline.getTime())) return true;

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      return deadlineDate >= todayStart;
    });

    const jobIds = jobs.map((job) => Number(job.id)).filter((id) => Number.isFinite(id));
    const viewsMap = await Job.getViewCountsByJobIds(jobIds);

    res.json({
      success: true,
      jobs: jobs.map((job) => {
        const payload = job.toJSON();
        const count = viewsMap.get(Number(job.id));
        return {
          ...payload,
          views_count: Number.isFinite(count) ? count : Number(payload.views_count || 0)
        };
      })
    });
  } catch (error) {
    console.error('Get recruiter jobs error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching recruiter jobs' });
  }
});

module.exports = router;
