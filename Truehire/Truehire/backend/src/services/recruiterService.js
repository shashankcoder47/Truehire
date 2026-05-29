import { prisma } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';
import { buildPagination } from '../utils/pagination.js';
import { sendShortlistedEmail } from '../utils/sendEmail.js';

const recruiterSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  company: true,
  company_name: true,
  official_email: true,
  phone_number: true,
  website: true,
  industry: true,
  company_size: true,
  headquarters_location: true,
  short_overview: true,
  detailed_description: true,
  company_logo: true,
  profile_complete: true,
  approval_status: true,
  status: true,
  created_at: true,
  updated_at: true,
};

const normalizeRecruiter = (recruiter) => {
  if (!recruiter) return null;

  return {
    ...recruiter,
    id: String(recruiter.id),
    role: String(recruiter.role || 'RECRUITER').toLowerCase().replace(/_/g, '-'),
  };
};

const normalizeCompany = (company) => {
  if (!company) return null;

  return {
    ...company,
    id: String(company.id),
    recruiter_id: company.recruiter_id != null ? String(company.recruiter_id) : null,
  };
};

const normalizeDedupeText = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
  }
};

const dedupeCompanies = (companies = []) => {
  const seen = new Set();
  const uniqueCompanies = [];

  for (const company of companies) {
    const key =
      normalizeDedupeText(company.company_name || company.company) ||
      normalizeDedupeText(company.official_email || company.email) ||
      normalizeDedupeText(company.website);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueCompanies.push(company);
  }

  return uniqueCompanies;
};

const normalizeRecruiterId = (recruiterId) => {
  if (recruiterId === null || recruiterId === undefined || recruiterId === '') {
    throw new ApiError(401, 'Authentication token is missing a recruiter identifier');
  }

  try {
    return BigInt(recruiterId);
  } catch (error) {
    throw new ApiError(401, 'Authentication token contains an invalid recruiter identifier');
  }
};

const recruiterProfileFieldParsers = {
  company: (value) => value,
  company_name: (value) => value,
  official_email: (value) => value,
  phone_number: (value) => value,
  website: (value) => value,
  industry: (value) => value,
  company_size: (value) => value,
  headquarters_location: (value) => value,
  short_overview: (value) => value,
  detailed_description: (value) => value,
  company_logo: (value) => value,
  company_profile_complete: (value) => value == null ? value : Boolean(value),
  onboarding_step: (value) => {
    if (value == null || value === '') return value;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new ApiError(400, 'Invalid onboarding step');
    }
    return parsed;
  },
  onboarding_completed_at: (value) => {
    if (value == null || value === '') return value;
    if (value instanceof Date) return value;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError(400, 'Invalid onboarding completion date');
    }

    return parsed;
  },
};

const sanitizeRecruiterUpdatePayload = (payload = {}) => {
  const data = {};

  for (const [field, parser] of Object.entries(recruiterProfileFieldParsers)) {
    if (!Object.prototype.hasOwnProperty.call(payload, field)) continue;
    data[field] = parser(payload[field]);
  }

  return data;
};

export const registerRecruiter = async (payload) => {
  const recruiter = await prisma.recruiters.findUnique({
    where: { email: payload.email },
    select: recruiterSelect,
  });

  if (!recruiter) {
    throw new ApiError(404, 'Recruiter profile not found');
  }

  return normalizeRecruiter(recruiter);
};

export const getRecruiterProfile = async (recruiterId) => {
  const recruiter = await prisma.recruiters.findUnique({
    where: { id: normalizeRecruiterId(recruiterId) },
    select: recruiterSelect,
  });

  if (!recruiter) {
    throw new ApiError(404, 'Recruiter profile not found');
  }

  return normalizeRecruiter(recruiter);
};

export const updateCompanyDetails = async (recruiterId, payload) => {
  const data = sanitizeRecruiterUpdatePayload(payload);

  const recruiter = await prisma.recruiters.update({
    where: { id: normalizeRecruiterId(recruiterId) },
    data,
    select: recruiterSelect,
  });

  return normalizeRecruiter(recruiter);
};

const normalizeApplicationRecord = (application, detailedApplication = null) => {
  if (!application) return null;
  const user = application.users;
  const job = application.jobs;

  return {
    applicationId: String(application.id),
    id: String(application.id),
    userId: application.user_id != null ? String(application.user_id) : null,
    jobId: application.job_id != null ? String(application.job_id) : null,
    status: String(application.status || 'APPLIED'),
    appliedAt: detailedApplication?.applied_at || application.applied_at || null,
    notes: application.notes || detailedApplication?.additional_comments || null,
    candidateName: detailedApplication?.name || user?.name || 'Candidate',
    candidateEmail: detailedApplication?.email || user?.email || '',
    phone: detailedApplication?.phone || user?.contact_number || null,
    location: detailedApplication?.location || user?.current_location || job?.location || null,
    experience_level: detailedApplication?.experience_level || null,
    current_salary:
      detailedApplication?.current_salary != null ? Number(detailedApplication.current_salary) : null,
    expected_salary:
      detailedApplication?.expected_salary != null ? Number(detailedApplication.expected_salary) : null,
    notice_period:
      detailedApplication?.notice_period != null ? Number(detailedApplication.notice_period) : null,
    additional_comments: detailedApplication?.additional_comments || application.notes || null,
    resume_path: detailedApplication?.resume_path || user?.resume_file || null,
    match_score: detailedApplication?.match_score != null ? Number(detailedApplication.match_score) : null,
    matchScore: detailedApplication?.match_score != null ? Number(detailedApplication.match_score) : null,
    matched_skills: parseJsonArray(detailedApplication?.matched_skills),
    matchedSkills: parseJsonArray(detailedApplication?.matched_skills),
    missing_skills: parseJsonArray(detailedApplication?.missing_skills),
    missingSkills: parseJsonArray(detailedApplication?.missing_skills),
    match_status: detailedApplication?.match_status || 'MATCHED',
    matchStatus: detailedApplication?.match_status || 'MATCHED',
    jobTitle: job?.title || 'Job',
    jobCompany: job?.company || 'Company',
    jobLocation: job?.location || null,
    user: user
      ? {
          id: String(user.id),
          name: user.name,
          email: user.email,
        }
      : null,
    job: job
      ? {
          id: String(job.id),
          title: job.title,
          company: job.company,
          location: job.location,
          recruiterId: job.recruiter_id != null ? String(job.recruiter_id) : null,
        }
      : null,
  };
};

export const getRecruiterApplications = async (recruiterId, pagination = {}) => {
  const normalizedRecruiterId = normalizeRecruiterId(recruiterId);
  const { page = 1, limit = 20, skip = 0, take = limit } = pagination;
  const where = {
    jobs: {
      recruiter_id: normalizedRecruiterId,
    },
  };

  console.log('[recruiter-applications] recruiter lookup', {
    recruiterId: String(normalizedRecruiterId),
  });

  const [applications, total] = await prisma.$transaction([
    prisma.job_applications.findMany({
      where,
      orderBy: {
        applied_at: 'desc',
      },
      skip,
      take,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            contact_number: true,
            current_location: true,
            resume_file: true,
          },
        },
        jobs: {
          select: {
            id: true,
            recruiter_id: true,
            title: true,
            company: true,
            location: true,
            skills_required: true,
            min_experience_years: true,
            match_percentage: true,
          },
        },
      },
    }),
    prisma.job_applications.count({ where }),
  ]);

  const detailFilters = applications.map((application) => ({
    job_id: application.job_id,
    user_id: application.user_id,
  }));

  const detailedApplications = detailFilters.length
    ? await prisma.applications.findMany({
        where: {
          OR: detailFilters,
        },
        orderBy: {
          applied_at: 'desc',
        },
        select: {
          id: true,
          job_id: true,
          user_id: true,
          name: true,
          email: true,
          phone: true,
          location: true,
          experience_level: true,
          current_salary: true,
          expected_salary: true,
          notice_period: true,
          additional_comments: true,
          resume_path: true,
          match_score: true,
          matched_skills: true,
          missing_skills: true,
          match_status: true,
          applied_at: true,
        },
      })
    : [];

  const detailedApplicationMap = new Map();
  detailedApplications.forEach((application) => {
    const key = `${String(application.job_id)}:${String(application.user_id)}`;
    if (!detailedApplicationMap.has(key)) {
      detailedApplicationMap.set(key, application);
    }
  });

  console.log('[recruiter-applications] applications fetched', {
    recruiterId: String(normalizedRecruiterId),
    applicationCount: applications.length,
    applicationIds: applications.map((application) => String(application.id)),
  });

  const normalizedApplications = applications.map((application) => {
    const detailKey = `${String(application.job_id)}:${String(application.user_id)}`;
    return normalizeApplicationRecord(application, detailedApplicationMap.get(detailKey) || null);
  });

  return {
    applications: normalizedApplications,
    pagination: buildPagination({ page, limit: take, total }),
  };
};

export const getRecruiterApplicationProfile = async (recruiterId, applicationId) => {
  const normalizedRecruiterId = normalizeRecruiterId(recruiterId);
  const normalizedApplicationId = BigInt(String(applicationId));

  const application = await prisma.job_applications.findUnique({
    where: {
      id: normalizedApplicationId,
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          contact_number: true,
          current_location: true,
          professional_summary: true,
          core_skills: true,
          secondary_skills: true,
          soft_skills: true,
          languages_known: true,
          linkedin_url: true,
          github_url: true,
          portfolio_url: true,
          resume_file: true,
        },
      },
      jobs: {
        select: {
          id: true,
          recruiter_id: true,
          title: true,
          company: true,
          location: true,
          skills_required: true,
          min_experience_years: true,
          match_percentage: true,
        },
      },
    },
  });

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  if (!application.jobs || application.jobs.recruiter_id !== normalizedRecruiterId) {
    throw new ApiError(403, 'You are not allowed to view this applicant profile');
  }

  const detailedApplication = await prisma.applications.findFirst({
    where: {
      job_id: application.job_id,
      user_id: application.user_id,
    },
    orderBy: {
      applied_at: 'desc',
    },
    select: {
      id: true,
      job_id: true,
      user_id: true,
      name: true,
      email: true,
      phone: true,
      location: true,
      experience_level: true,
      current_salary: true,
      expected_salary: true,
      notice_period: true,
      additional_comments: true,
      resume_path: true,
      match_score: true,
      matched_skills: true,
      missing_skills: true,
      match_status: true,
      applied_at: true,
    },
  });

  return {
    application: normalizeApplicationRecord(application, detailedApplication || null),
    applicant: application.users
      ? {
          ...application.users,
          id: String(application.users.id),
        }
      : null,
  };
};

const getOwnedApplication = async (recruiterId, applicationId) => {
  const normalizedRecruiterId = normalizeRecruiterId(recruiterId);
  const normalizedApplicationId = BigInt(String(applicationId));

  const application = await prisma.job_applications.findUnique({
    where: {
      id: normalizedApplicationId,
    },
    include: {
      jobs: {
        select: {
          id: true,
          recruiter_id: true,
          title: true,
          company: true,
          location: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          contact_number: true,
          current_location: true,
          resume_file: true,
        },
      },
    },
  });

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  if (!application.jobs || application.jobs.recruiter_id !== normalizedRecruiterId) {
    throw new ApiError(403, 'You are not allowed to update this application');
  }

  return application;
};

export const updateRecruiterApplicationStatus = async (
  recruiterId,
  applicationId,
  status,
  rejectionReason = null,
) => {
  const application = await getOwnedApplication(recruiterId, applicationId);
  const now = new Date();
  const normalizedStatus = String(status || '').trim().toUpperCase();
  const reason = rejectionReason ? String(rejectionReason).trim() : null;
  const previousStatus = String(application.status || '').trim().toUpperCase();

  const updatedApplication = await prisma.job_applications.update({
    where: {
      id: application.id,
    },
    data: {
      status: normalizedStatus,
      rejection_reason: normalizedStatus === 'REJECTED' ? reason : null,
      recruiter_last_action_at: now,
    },
    include: {
      jobs: {
        select: {
          id: true,
          recruiter_id: true,
          title: true,
          company: true,
          location: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          contact_number: true,
          current_location: true,
          resume_file: true,
        },
      },
    },
  });

  await prisma.applications.updateMany({
    where: {
      job_id: application.job_id,
      user_id: application.user_id,
    },
    data: {
      recruiter_last_action_at: now,
    },
  });

  const normalizedApplication = normalizeApplicationRecord(updatedApplication, null);
  let shortlistEmailSent = false;

  if (normalizedStatus === 'SHORTLISTED' && previousStatus !== 'SHORTLISTED' && updatedApplication.users?.email) {
    try {
      await sendShortlistedEmail({
        to: updatedApplication.users.email,
        candidateName: updatedApplication.users.name,
        jobTitle: updatedApplication.jobs?.title,
        companyName: updatedApplication.jobs?.company,
      });
      shortlistEmailSent = true;
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  return {
    ...normalizedApplication,
    shortlistEmailSent,
  };
};

export const getCompanies = async () => {
  const recruiters = await prisma.recruiters.findMany({
    where: {
      approval_status: 'APPROVED',
    },
    select: {
      id: true,
      recruiter_id: true,
      company_name: true,
      company: true,
      category: true,
      industry: true,
      company_size: true,
      company_logo: true,
      website: true,
      official_email: true,
      phone_number: true,
      headquarters_location: true,
      short_overview: true,
      detailed_description: true,
      approval_status: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: {
      updated_at: 'desc',
    },
    take: 100,
  });

  return dedupeCompanies(recruiters).map((recruiter) =>
    normalizeCompany({
      ...recruiter,
      company_name: recruiter.company_name || recruiter.company || 'Unnamed company',
    }),
  );
};

export const getCompanyRatingsSummary = async () => {
  const summaries = await prisma.company_ratings.groupBy({
    by: ['company_id'],
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  return summaries.map((summary) => ({
    company_id: String(summary.company_id),
    average_rating: Number(summary._avg.rating || 0),
    ratings_count: summary._count.rating || 0,
  }));
};

export const getUserCompanyRatings = async (userId) => {
  const ratings = await prisma.company_ratings.findMany({
    where: {
      user_id: BigInt(userId),
    },
    select: {
      company_id: true,
      rating: true,
    },
    take: 100,
  });

  return ratings.map((rating) => ({
    company_id: String(rating.company_id),
    rating: rating.rating,
  }));
};

export const rateCompany = async (userId, companyId, ratingValue) => {
  const normalizedCompanyId = BigInt(companyId);
  const normalizedUserId = BigInt(userId);
  const normalizedRating = Number(ratingValue);

  if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  const recruiter = await prisma.recruiters.findUnique({
    where: { id: normalizedCompanyId },
    select: { id: true },
  });

  if (!recruiter) {
    throw new ApiError(404, 'Company not found');
  }

  await prisma.company_ratings.upsert({
    where: {
      company_id_user_id: {
        company_id: normalizedCompanyId,
        user_id: normalizedUserId,
      },
    },
    update: {
      rating: normalizedRating,
      updated_at: new Date(),
    },
    create: {
      company_id: normalizedCompanyId,
      user_id: normalizedUserId,
      rating: normalizedRating,
    },
  });

  const summary = await prisma.company_ratings.aggregate({
    where: {
      company_id: normalizedCompanyId,
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  return {
    rating: normalizedRating,
    average_rating: Number(summary._avg.rating || 0),
    ratings_count: summary._count.rating || 0,
  };
};
