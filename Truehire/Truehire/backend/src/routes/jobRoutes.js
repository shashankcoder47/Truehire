import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, recruiterOnly, userOnly } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  getRecommendedJobsForUser,
  sendJobMatchNotificationsForJob,
} from '../services/jobRecommendationService.js';
import {
  applyToJob,
  createJob,
  deleteJob,
  getAllJobs,
  getJobById,
  getRecruiterJobs,
  updateJob,
} from '../services/jobService.js';
import { createNewJobPostedNotifications } from '../services/notificationService.js';
import { uploadSingle } from '../utils/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  applyJobSchema,
  createJobSchema,
  jobIdParamSchema,
  updateJobSchema,
} from '../validators/jobValidators.js';

const router = Router();

const normalizeCreateJobRequest = (req, _res, next) => {
  const body = req.body || {};

  req.body = {
    title: body.title,
    company: body.company,
    description: body.description,
    location: body.location,
    employmentType: body.employmentType ?? body.employment_type ?? body.type,
    experienceLevel: body.experienceLevel ?? body.experience_level,
    salaryMin: body.salaryMin ?? body.salary_min,
    salaryMax: body.salaryMax ?? body.salary_max,
    salaryCurrency: body.salaryCurrency ?? body.salary_currency,
    requirements: body.requirements,
    benefits: body.benefits,
    skillsRequired: body.skillsRequired ?? body.skills_required ?? body.category,
    minExperienceYears: body.minExperienceYears ?? body.min_experience_years ?? body.minimumExperience,
    matchPercentage: body.matchPercentage ?? body.match_percentage,
    maxApplicants: body.maxApplicants ?? body.max_applicants,
    applicationDue: body.applicationDue ?? body.application_deadline ?? body.deadline,
    status: body.status,
    isFeatured: body.isFeatured ?? body.is_featured,
    isUrgent: body.isUrgent ?? body.is_urgent,
  };

  if (req.file) {
    req.body.companyLogo = req.file.path;
  }

  next();
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const jobs = await getAllJobs({ limit: req.query.limit });

    res.json({
      success: true,
      jobs,
      data: jobs,
    });
  }),
);

router.get(
  '/recruiter/my-jobs',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const jobs = await getRecruiterJobs(req.auth.sub);

    res.json({
      success: true,
      jobs,
      data: jobs,
    });
  }),
);

router.get(
  '/recommended',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const jobs = await getRecommendedJobsForUser(req.auth.sub);

    res.json({
      success: true,
      jobs,
      data: jobs,
    });
  }),
);

router.get(
  '/user/applications',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const applications = await prisma.job_applications.findMany({
      where: {
        user_id: BigInt(req.auth.sub),
      },
      orderBy: {
        applied_at: 'desc',
      },
      select: {
        id: true,
        job_id: true,
        status: true,
        applied_at: true,
        total_view_seconds: true,
        introduction_videos: {
          select: {
            id: true,
            uploaded_at: true,
          },
          orderBy: {
            uploaded_at: 'desc',
          },
          take: 1,
        },
        jobs: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary_min: true,
            salary_max: true,
            salary_currency: true,
          },
        },
      },
    });

    const normalizedApplications = applications.map((application) => {
      const job = application.jobs;
      const normalizedStatus = String(application.status || 'APPLIED');
      const isShortlisted = normalizedStatus.toLowerCase() === 'shortlisted';
      const latestIntroVideo = application.introduction_videos?.[0] || null;
      const salaryMin = job?.salary_min != null ? Number(job.salary_min) : '-';
      const salaryMax = job?.salary_max != null ? Number(job.salary_max) : '-';
      const salaryCurrency = job?.salary_currency || 'INR';

      return {
        id: String(application.id),
        jobId: job?.id != null ? String(job.id) : String(application.job_id),
        jobTitle: job?.title || 'Job',
        company: job?.company || 'Company',
        location: job?.location || 'Remote',
        salary: `${salaryCurrency} ${salaryMin} - ${salaryMax}`,
        status: normalizedStatus,
        appliedDate: application.applied_at ? new Date(application.applied_at).toDateString() : '',
        applicationId: `APP-${application.id}`,
        viewTimeSeconds: Number(application.total_view_seconds || 0),
        videoStatus: isShortlisted ? (latestIntroVideo ? 'Video Uploaded' : 'Video Pending') : null,
        videoUploadedAt: latestIntroVideo?.uploaded_at || null,
      };
    });

    res.json({
      success: true,
      applications: normalizedApplications,
    });
  }),
);

router.get(
  '/:jobId',
  validateRequest({ params: jobIdParamSchema }),
  asyncHandler(async (req, res) => {
    const job = await getJobById(req.validatedParams.jobId);

    res.json({
      success: true,
      job,
      data: job,
    });
  }),
);

router.post(
  '/',
  authenticate,
  recruiterOnly,
  uploadSingle('company_logo', 'company-logos'),
  normalizeCreateJobRequest,
  validateRequest({ body: createJobSchema }),
  asyncHandler(async (req, res) => {
    console.log('Received job:', req.validatedBody);

    const job = await createJob(req.auth.sub, {
      ...req.validatedBody,
      companyLogo: req.body.companyLogo,
    });

    createNewJobPostedNotifications(job)
      .then((result) => {
        console.log('New job user notifications completed:', result);
      })
      .catch((error) => {
        console.error('New job user notifications failed:', error);
      });

    sendJobMatchNotificationsForJob(job)
      .then((result) => {
        console.log('New job skill-match emails completed:', result);
      })
      .catch((error) => {
        console.error('New job skill-match emails failed:', error);
      });

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job,
      data: job,
    });
  }),
);

router.patch(
  '/:jobId',
  authenticate,
  recruiterOnly,
  validateRequest({ params: jobIdParamSchema, body: updateJobSchema }),
  asyncHandler(async (req, res) => {
    const job = await updateJob(req.auth.sub, req.validatedParams.jobId, req.validatedBody);

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job,
    });
  }),
);

router.delete(
  '/:jobId',
  authenticate,
  recruiterOnly,
  validateRequest({ params: jobIdParamSchema }),
  asyncHandler(async (req, res) => {
    await deleteJob(req.auth.sub, req.validatedParams.jobId);

    res.status(204).send();
  }),
);

router.post(
  '/:jobId/apply',
  authenticate,
  userOnly,
  uploadSingle('resume', 'resumes'),
  validateRequest({ params: jobIdParamSchema, body: applyJobSchema }),
  asyncHandler(async (req, res) => {
    const application = await applyToJob(
      req.auth.sub,
      req.validatedParams.jobId,
      {
        ...req.body,
        ...req.validatedBody,
        ...(req.file?.path ? { resume_path: req.file.path } : {}),
        ...(req.file ? { resumeFile: req.file } : {}),
      },
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
      application_id: application.id,
      data: application,
    });
  }),
);

export default router;
