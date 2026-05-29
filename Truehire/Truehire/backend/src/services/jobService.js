import { prisma } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';
import { buildPagination } from '../utils/pagination.js';
import {
  calculateResumeMatch,
  extractResumeText,
} from './resumeMatchService.js';

const listJobSelect = {
  id: true,
  recruiter_id: true,
  title: true,
  company: true,
  company_logo: true,
  location: true,
  employment_type: true,
  experience_level: true,
  salary_min: true,
  salary_max: true,
  salary_currency: true,
  description: true,
  requirements: true,
  benefits: true,
  skills_required: true,
  min_experience_years: true,
  match_percentage: true,
  application_deadline: true,
  status: true,
  is_featured: true,
  is_urgent: true,
  views_count: true,
  applications_count: true,
  max_applicants: true,
  created_at: true,
  updated_at: true,
};

const normalizeJob = (job) => {
  if (!job) return null;

  return {
    ...job,
    id: String(job.id),
    recruiter_id: job.recruiter_id != null ? String(job.recruiter_id) : null,
    salary_min: job.salary_min != null ? Number(job.salary_min) : null,
    salary_max: job.salary_max != null ? Number(job.salary_max) : null,
    max_applicants: job.max_applicants != null ? Number(job.max_applicants) : null,
    min_experience_years: job.min_experience_years != null ? Number(job.min_experience_years) : null,
    match_percentage: job.match_percentage != null ? Number(job.match_percentage) : 0,
    applications_count: job.applications_count != null ? Number(job.applications_count) : 0,
    views_count: job.views_count != null ? Number(job.views_count) : 0,
  };
};

const normalizeDuplicateKeyText = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const getJobDedupeKey = (job) => [
  job.recruiter_id != null ? String(job.recruiter_id) : '',
  normalizeDuplicateKeyText(job.title),
  normalizeDuplicateKeyText(job.company),
  normalizeDuplicateKeyText(job.location),
  normalizeDuplicateKeyText(job.employment_type),
  normalizeDuplicateKeyText(job.requirements),
  normalizeDuplicateKeyText(job.benefits),
  normalizeDuplicateKeyText(job.skills_required),
  job.salary_min != null ? String(Number(job.salary_min)) : '',
  job.salary_max != null ? String(Number(job.salary_max)) : '',
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

const DEDUPE_WINDOW_MS = 2 * 60 * 1000;

const normalizeRecruiterId = (recruiterId) => {
  if (recruiterId === null || recruiterId === undefined || recruiterId === '') {
    throw new ApiError(401, 'Authentication token is missing a recruiter identifier');
  }

  try {
    return BigInt(String(recruiterId));
  } catch (_error) {
    throw new ApiError(401, 'Authentication token contains an invalid recruiter identifier');
  }
};

const joinTextList = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const cleaned = value.map((item) => String(item).trim()).filter(Boolean);
    return cleaned.length ? cleaned.join('\n') : null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeNullableDecimal = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]/g, '').trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeNullableNoticePeriod = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const matched = trimmed.match(/-?\d+/);
    if (!matched) return null;
    const parsed = Number(matched[0]);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
  }
  return null;
};

const normalizePercentage = (value) => {
  const parsed = normalizeNullableDecimal(value);
  if (parsed == null) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const normalizeOptionalYears = (value) => {
  const parsed = normalizeNullableDecimal(value);
  if (parsed == null) return null;
  return Math.max(0, Number(parsed.toFixed(1)));
};

const toJsonArray = (items = []) => JSON.stringify(Array.isArray(items) ? items : []);

export const getJobById = async (jobId) => {
  const job = await prisma.jobs.findUnique({
    where: { id: BigInt(jobId) },
    select: listJobSelect,
  });

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  return normalizeJob(job);
};

export const getAllJobs = async (options = {}) => {
  const take = Number.isFinite(Number(options.limit)) && Number(options.limit) > 0
    ? Math.min(Number(options.limit), 200)
    : 25;

  const fetchTake = Math.min(take * 5, 500);
  const jobs = await prisma.jobs.findMany({
    where: {
      status: 'OPEN',
    },
    orderBy: {
      created_at: 'desc',
    },
    take: fetchTake,
    select: listJobSelect,
  });

  return dedupeJobs(jobs).slice(0, take).map(normalizeJob);
};

export const getRecruiterJobs = async (recruiterId, pagination = {}) => {
  const { page = 1, limit = 20, skip = 0, take = limit } = pagination;
  const where = {
    recruiter_id: normalizeRecruiterId(recruiterId),
  };
  const fetchTake = Math.min(take * 5, 500);

  const [jobs, total] = await prisma.$transaction([
    prisma.jobs.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: fetchTake,
      select: listJobSelect,
    }),
    prisma.jobs.count({ where }),
  ]);

  const normalizedJobs = dedupeJobs(jobs).slice(0, take).map(normalizeJob);

  return {
    jobs: normalizedJobs,
    pagination: buildPagination({ page, limit: take, total }),
  };
};

export const getRecruiterJobsList = async (recruiterId) => {
  const jobs = await prisma.jobs.findMany({
    where: {
      recruiter_id: normalizeRecruiterId(recruiterId),
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 100,
    select: listJobSelect,
  });

  return dedupeJobs(jobs).map(normalizeJob);
};

export const applyToJob = async (userId, jobId, payload = {}) => {
  const normalizedUserId = BigInt(userId);
  const normalizedJobId = BigInt(jobId);

  const job = await prisma.jobs.findUnique({
    where: { id: normalizedJobId },
    select: {
      id: true,
      title: true,
      location: true,
      company: true,
      status: true,
      recruiter_id: true,
      applications_count: true,
      skills_required: true,
      match_percentage: true,
    },
  });

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (String(job.status || '').toUpperCase() !== 'OPEN') {
    throw new ApiError(400, 'Applications are closed for this job');
  }

  const existingApplication = await prisma.job_applications.findFirst({
    where: {
      user_id: normalizedUserId,
      job_id: normalizedJobId,
    },
    select: {
      id: true,
    },
  });

  if (existingApplication) {
    throw new ApiError(409, 'You have already applied for this job');
  }

  const application = await prisma.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { id: normalizedUserId },
      select: {
        id: true,
        name: true,
        email: true,
        contact_number: true,
        current_location: true,
        total_experience_years: true,
        current_salary: true,
        expected_salary: true,
        notice_period: true,
        resume_file: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    const uploadedResumePath = payload.resume_path || payload.resumePath || null;
    const resolvedResumePath = uploadedResumePath || user.resume_file || null;

    if (uploadedResumePath && uploadedResumePath !== user.resume_file) {
      await tx.users.update({
        where: { id: normalizedUserId },
        data: {
          resume_file: uploadedResumePath,
        },
      });
    }

    let resumeMatch = {
      matchScore: null,
      matchedSkills: [],
      missingSkills: [],
      matchStatus: 'MATCHED',
    };

    try {
      const resumeText = await extractResumeText({
        file: payload.resumeFile || null,
        storedPath: resolvedResumePath,
      });
      resumeMatch = calculateResumeMatch({
        resumeText,
        requiredSkills: job.skills_required,
        matchPercentage: job.match_percentage,
      });
    } catch (error) {
      console.error('Resume match extraction failed:', error);
      resumeMatch = calculateResumeMatch({
        resumeText: '',
        requiredSkills: job.skills_required,
        matchPercentage: job.match_percentage,
      });
    }

    const createdApplication = await tx.job_applications.create({
      data: {
        user_id: normalizedUserId,
        job_id: normalizedJobId,
        notes: payload.coverLetter?.trim() || payload.additionalComments?.trim() || null,
      },
      select: {
        id: true,
        status: true,
        applied_at: true,
      },
    });

    await tx.applications.create({
      data: {
        job_id: normalizedJobId,
        user_id: normalizedUserId,
        name: String(payload.name || user.name || '').trim() || 'Candidate',
        email: String(payload.email || user.email || '').trim(),
        phone: String(payload.phone || user.contact_number || '').trim() || null,
        location: String(payload.location || user.current_location || '').trim() || null,
        experience_level: String(
          payload.experience_level ||
            payload.experienceLevel ||
            (user.total_experience_years != null ? `${user.total_experience_years} years` : ''),
        ).trim() || null,
        current_salary: normalizeNullableDecimal(
          payload.current_salary ?? payload.currentSalary ?? user.current_salary ?? null,
        ),
        expected_salary: normalizeNullableDecimal(
          payload.expected_salary ?? payload.expectedSalary ?? user.expected_salary ?? null,
        ),
        notice_period: normalizeNullableNoticePeriod(
          payload.notice_period ?? payload.noticePeriod ?? user.notice_period ?? null,
        ),
        additional_comments:
          payload.additionalComments?.trim() || payload.coverLetter?.trim() || null,
        resume_path: resolvedResumePath,
        match_score: resumeMatch.matchScore,
        matched_skills: toJsonArray(resumeMatch.matchedSkills),
        missing_skills: toJsonArray(resumeMatch.missingSkills),
        match_status: resumeMatch.matchStatus,
      },
    });

    await tx.jobs.update({
      where: { id: normalizedJobId },
      data: {
        applications_count: {
          increment: 1,
        },
      },
    });

    return createdApplication;
  });

  return {
    id: String(application.id),
    status: String(application.status || 'APPLIED'),
    applied_at: application.applied_at,
    job: {
      id: String(job.id),
      title: job.title,
      location: job.location,
      company: job.company,
    },
  };
};

export const createJob = async (recruiterId, payload = {}) => {
  const normalizedRecruiterId = normalizeRecruiterId(recruiterId);

  const recruiter = await prisma.recruiters.findUnique({
    where: { id: normalizedRecruiterId },
    select: {
      id: true,
      company: true,
      company_name: true,
      company_logo: true,
    },
  });

  if (!recruiter) {
    throw new ApiError(404, 'Recruiter profile not found');
  }

  const companyName = String(payload.company || recruiter.company_name || recruiter.company || '').trim();
  if (!companyName) {
    throw new ApiError(400, 'Company name is required before posting a job');
  }

  const normalizedTitle = payload.title.trim();
  const normalizedLocation = payload.location.trim();
  const normalizedRequirements = joinTextList(payload.requirements);
  const normalizedBenefits = payload.benefits?.trim() || null;
  const normalizedSkillsRequired = payload.skillsRequired?.trim() || null;
  const normalizedMinExperienceYears = normalizeOptionalYears(payload.minExperienceYears);
  const normalizedMatchPercentage = normalizePercentage(payload.matchPercentage) ?? 0;
  const recentDuplicateWindow = new Date(Date.now() - DEDUPE_WINDOW_MS);

  const recentJobs = await prisma.jobs.findMany({
    where: {
      recruiter_id: normalizedRecruiterId,
      created_at: {
        gte: recentDuplicateWindow,
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 10,
    select: listJobSelect,
  });

  const duplicateJob = recentJobs.find((job) =>
    normalizeDuplicateKeyText(job.title) === normalizeDuplicateKeyText(normalizedTitle) &&
    normalizeDuplicateKeyText(job.company) === normalizeDuplicateKeyText(companyName) &&
    normalizeDuplicateKeyText(job.location) === normalizeDuplicateKeyText(normalizedLocation) &&
    normalizeDuplicateKeyText(job.employment_type) === normalizeDuplicateKeyText(payload.employmentType) &&
    normalizeDuplicateKeyText(job.requirements) === normalizeDuplicateKeyText(normalizedRequirements) &&
    normalizeDuplicateKeyText(job.benefits) === normalizeDuplicateKeyText(normalizedBenefits) &&
    normalizeDuplicateKeyText(job.skills_required) === normalizeDuplicateKeyText(normalizedSkillsRequired)
  );

  if (duplicateJob) {
    return normalizeJob(duplicateJob);
  }

  const createdJob = await prisma.jobs.create({
    data: {
      recruiter_id: normalizedRecruiterId,
      title: normalizedTitle,
      company: companyName,
      location: normalizedLocation,
      employment_type: payload.employmentType,
      experience_level: payload.experienceLevel || 'MID_LEVEL',
      salary_min: payload.salaryMin ?? null,
      salary_max: payload.salaryMax ?? null,
      salary_currency: payload.salaryCurrency || 'INR',
      description: payload.description.trim(),
      requirements: normalizedRequirements,
      benefits: normalizedBenefits,
      skills_required: normalizedSkillsRequired,
      min_experience_years: normalizedMinExperienceYears,
      match_percentage: normalizedMatchPercentage,
      application_deadline: payload.applicationDue ? new Date(payload.applicationDue) : null,
      status: payload.status || 'OPEN',
      is_featured: payload.isFeatured ?? false,
      is_urgent: payload.isUrgent ?? false,
      max_applicants: payload.maxApplicants ?? null,
      company_logo: payload.companyLogo || recruiter.company_logo || null,
    },
    select: listJobSelect,
  });

  return normalizeJob(createdJob);
};

const buildJobUpdateData = (payload = {}) => {
  const data = {};

  if (payload.title !== undefined) data.title = payload.title.trim();
  if (payload.company !== undefined) data.company = payload.company?.trim() || null;
  if (payload.location !== undefined) data.location = payload.location.trim();
  if (payload.employmentType !== undefined) data.employment_type = payload.employmentType;
  if (payload.experienceLevel !== undefined) data.experience_level = payload.experienceLevel || null;
  if (payload.salaryMin !== undefined) data.salary_min = payload.salaryMin ?? null;
  if (payload.salaryMax !== undefined) data.salary_max = payload.salaryMax ?? null;
  if (payload.salaryCurrency !== undefined) data.salary_currency = payload.salaryCurrency || 'INR';
  if (payload.description !== undefined) data.description = payload.description.trim();
  if (payload.requirements !== undefined) data.requirements = joinTextList(payload.requirements);
  if (payload.benefits !== undefined) data.benefits = payload.benefits?.trim() || null;
  if (payload.skillsRequired !== undefined) data.skills_required = payload.skillsRequired?.trim() || null;
  if (payload.minExperienceYears !== undefined) data.min_experience_years = normalizeOptionalYears(payload.minExperienceYears);
  if (payload.matchPercentage !== undefined) data.match_percentage = normalizePercentage(payload.matchPercentage) ?? 0;
  if (payload.applicationDue !== undefined) {
    data.application_deadline = payload.applicationDue ? new Date(payload.applicationDue) : null;
  }
  if (payload.status !== undefined) {
    data.status = payload.status;
    data.closed_at = payload.status === 'CLOSED' ? new Date() : null;
  }
  if (payload.isFeatured !== undefined) data.is_featured = payload.isFeatured;
  if (payload.isUrgent !== undefined) data.is_urgent = payload.isUrgent;
  if (payload.maxApplicants !== undefined) data.max_applicants = payload.maxApplicants ?? null;

  data.updated_at = new Date();
  return data;
};

export const updateJob = async (recruiterId, jobId, payload = {}) => {
  const normalizedRecruiterId = normalizeRecruiterId(recruiterId);
  const normalizedJobId = BigInt(jobId);

  const existingJob = await prisma.jobs.findUnique({
    where: { id: normalizedJobId },
    select: {
      id: true,
      recruiter_id: true,
    },
  });

  if (!existingJob) {
    throw new ApiError(404, 'Job not found');
  }

  if (existingJob.recruiter_id !== normalizedRecruiterId) {
    throw new ApiError(403, 'You are not allowed to update this job');
  }

  const updatedJob = await prisma.jobs.update({
    where: { id: normalizedJobId },
    data: buildJobUpdateData(payload),
    select: listJobSelect,
  });

  return normalizeJob(updatedJob);
};

export const deleteJob = async (recruiterId, jobId) => {
  const normalizedRecruiterId = normalizeRecruiterId(recruiterId);
  const normalizedJobId = BigInt(jobId);

  const existingJob = await prisma.jobs.findUnique({
    where: { id: normalizedJobId },
    select: {
      id: true,
      recruiter_id: true,
    },
  });

  if (!existingJob) {
    throw new ApiError(404, 'Job not found');
  }

  if (existingJob.recruiter_id !== normalizedRecruiterId) {
    throw new ApiError(403, 'You are not allowed to delete this job');
  }

  await prisma.jobs.delete({
    where: { id: normalizedJobId },
  });
};
