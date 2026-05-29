import { Router } from 'express';
import { createPremiumOrder, verifyPremiumPayment } from '../controllers/recruiterPremiumController.js';
import { prisma } from '../config/database.js';
import { authenticate, recruiterOnly, userOnly } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  getCompanies,
  getCompanyRatingsSummary,
  getRecruiterApplicationProfile,
  getRecruiterApplications,
  getRecruiterProfile,
  getUserCompanyRatings,
  rateCompany,
  registerRecruiter,
  updateRecruiterApplicationStatus,
  updateCompanyDetails,
} from '../services/recruiterService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createApplicationViewedNotification,
  createApplicationViewTimeNotification,
} from '../services/notificationService.js';
import {
  recruiterRegistrationSchema,
  updateCompanySchema,
} from '../validators/recruiterValidators.js';
import { ApiError } from '../utils/apiError.js';
import { getPagination } from '../utils/pagination.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { uploadMimeTypes, uploadSingle } from '../utils/upload.js';

const router = Router();

const normalizeRecruiterId = (value) => {
  try {
    return BigInt(String(value));
  } catch (_error) {
    return null;
  }
};

const normalizeDurationSeconds = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
};

const mapVerificationStatus = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'APPROVED') return 'Verified';
  if (normalized === 'REJECTED') return 'Rejected';
  return 'Pending';
};

const getRecruiterSettingsPayload = (recruiter) => ({
  loginType: recruiter.login_type ? String(recruiter.login_type).toLowerCase() : null,
  password: recruiter.password ? true : null,
});

const updateRecruiterPassword = async (req, res) => {
  const recruiterId = normalizeRecruiterId(req.auth.sub);

  if (!recruiterId) {
    throw new ApiError(400, 'Invalid recruiter id');
  }

  const recruiter = await prisma.recruiters.findUnique({
    where: { id: recruiterId },
    select: {
      id: true,
      password: true,
      login_type: true,
    },
  });

  if (!recruiter) {
    throw new ApiError(404, 'Recruiter not found');
  }

  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  const confirmPassword = String(req.body?.confirmPassword || '');
  const isGoogleOnly =
    String(recruiter.login_type || '').toUpperCase() === 'GOOGLE' && !recruiter.password;

  if (isGoogleOnly) {
    if (!newPassword || !confirmPassword) {
      throw new ApiError(400, 'New password and confirmation are required');
    }
  } else if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, 'Current, new, and confirmation passwords are required');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'New password and confirmation do not match');
  }

  if (!isGoogleOnly) {
    const isPasswordValid = await comparePassword(currentPassword, recruiter.password || '');

    if (!isPasswordValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.recruiters.update({
    where: { id: recruiterId },
    data: {
      password: passwordHash,
    },
  });

  return res.json({
    success: true,
    message: 'Password updated successfully',
  });
};

router.post(
  '/register',
  validateRequest({ body: recruiterRegistrationSchema }),
  asyncHandler(async (req, res) => {
    const result = await registerRecruiter(req.validatedBody);

    res.status(201).json({
      success: true,
      message: 'Recruiter registered successfully',
      data: result,
    });
  }),
);

router.get(
  '/companies',
  asyncHandler(async (_req, res) => {
    const companies = await getCompanies();

    res.json({
      success: true,
      companies,
    });
  }),
);

router.get(
  '/companies/ratings',
  asyncHandler(async (_req, res) => {
    const ratings = await getCompanyRatingsSummary();

    res.json({
      success: true,
      ratings,
    });
  }),
);

router.get(
  '/companies/ratings/me',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const ratings = await getUserCompanyRatings(req.auth.sub);

    res.json({
      success: true,
      ratings,
    });
  }),
);

router.post(
  '/companies/:id/ratings',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await rateCompany(req.auth.sub, req.params.id, req.body?.rating);

    res.json({
      success: true,
      ...result,
    });
  }),
);

router.get(
  '/me',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const recruiter = await getRecruiterProfile(req.auth.sub);

    res.json({
      success: true,
      data: recruiter,
    });
  }),
);

router.get(
  '/profile/me',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const recruiter = await getRecruiterProfile(req.auth.sub);

    res.json({
      success: true,
      recruiter,
      data: recruiter,
    });
  }),
);

router.get(
  '/settings',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const recruiterId = normalizeRecruiterId(req.auth.sub);

    if (!recruiterId) {
      throw new ApiError(400, 'Invalid recruiter id');
    }

    const recruiter = await prisma.recruiters.findUnique({
      where: { id: recruiterId },
      select: {
        login_type: true,
        password: true,
      },
    });

    if (!recruiter) {
      throw new ApiError(404, 'Recruiter not found');
    }

    res.setHeader('Cache-Control', 'no-store');
    const payload = getRecruiterSettingsPayload(recruiter);
    res.json({
      success: true,
      data: payload,
      settings: payload,
    });
  }),
);

router.put(
  '/settings/password',
  authenticate,
  recruiterOnly,
  asyncHandler(updateRecruiterPassword),
);

router.post('/change-password', authenticate, recruiterOnly, asyncHandler(updateRecruiterPassword));

router.post('/premium/order', authenticate, recruiterOnly, createPremiumOrder);
router.post('/premium/verify', authenticate, recruiterOnly, verifyPremiumPayment);

router.get(
  '/applications',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    console.log('[recruiter-applications] request', {
      recruiterId: req.auth.sub,
      role: req.auth.role,
      subRecruiterId: req.auth.subRecruiterId ?? null,
    });

    const result = await getRecruiterApplications(req.auth.sub, getPagination(req.query));

    res.json({
      success: true,
      applications: result.applications,
      data: result.applications,
      pagination: result.pagination,
    });
  }),
);

router.get(
  '/applications/:applicationId/profile',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const result = await getRecruiterApplicationProfile(req.auth.sub, req.params.applicationId);

    res.json({
      success: true,
      application: result.application,
      applicant: result.applicant,
      data: result,
    });
  }),
);

router.post(
  '/applications/:applicationId/record-view',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const recruiterId = normalizeRecruiterId(req.auth.sub);
    const applicationId = BigInt(String(req.params.applicationId));

    const application = await prisma.job_applications.findUnique({
      where: { id: applicationId },
      include: {
        jobs: {
          select: {
            id: true,
            recruiter_id: true,
          },
        },
      },
    });

    if (!application || !application.jobs || application.jobs.recruiter_id !== recruiterId) {
      throw new ApiError(404, 'Application not found');
    }

    const now = new Date();
    await prisma.job_applications.update({
      where: { id: application.id },
      data: { recruiter_last_action_at: now },
    });

    await createApplicationViewedNotification({
      userId: application.user_id,
      applicationId: application.id,
      jobId: application.job_id,
    });

    res.json({ success: true });
  }),
);

router.post(
  '/applications/:applicationId/record-view-time',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const durationSeconds = normalizeDurationSeconds(req.body?.seconds || req.body?.durationSeconds);
    if (!durationSeconds) {
      res.json({ success: true, ignored: true });
      return;
    }

    const recruiterId = normalizeRecruiterId(req.auth.sub);
    const applicationId = BigInt(String(req.params.applicationId));

    const application = await prisma.job_applications.findUnique({
      where: { id: applicationId },
      include: {
        jobs: {
          select: {
            id: true,
            recruiter_id: true,
          },
        },
      },
    });

    if (!application || !application.jobs || application.jobs.recruiter_id !== recruiterId) {
      throw new ApiError(404, 'Application not found');
    }

    const now = new Date();
    await prisma.job_applications.update({
      where: { id: application.id },
      data: {
        total_view_seconds: {
          increment: durationSeconds,
        },
        recruiter_last_action_at: now,
      },
    });

    await createApplicationViewTimeNotification({
      userId: application.user_id,
      applicationId: application.id,
      jobId: application.job_id,
      seconds: durationSeconds,
    });

    res.json({ success: true });
  }),
);

router.put(
  '/applications/:applicationId/shortlist',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const application = await updateRecruiterApplicationStatus(
      req.auth.sub,
      req.params.applicationId,
      'SHORTLISTED',
    );

    res.json({
      success: true,
      message: application.shortlistEmailSent
        ? 'Candidate shortlisted successfully. Shortlisted email sent successfully.'
        : 'Candidate shortlisted successfully.',
      status: 'Shortlisted',
      emailSent: application.shortlistEmailSent,
      application,
      data: application,
    });
  }),
);

router.put(
  '/applications/:applicationId/reject',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const rejectionReason =
      String(req.body?.reason || req.body?.rejectionReason || '').trim() || null;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const application = await updateRecruiterApplicationStatus(
      req.auth.sub,
      req.params.applicationId,
      'REJECTED',
      rejectionReason,
    );

    res.json({
      success: true,
      message: 'Applicant has been rejected successfully.',
      status: 'Rejected',
      application,
      data: application,
    });
  }),
);

router.put(
  '/company-details',
  authenticate,
  recruiterOnly,
  validateRequest({ body: updateCompanySchema }),
  asyncHandler(async (req, res) => {
    const recruiter = await updateCompanyDetails(req.auth.sub, req.validatedBody);

    res.json({
      success: true,
      message: 'Company details updated successfully',
      data: recruiter,
    });
  }),
);

router.put(
  '/profile/me',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const recruiter = await updateCompanyDetails(req.auth.sub, req.body);

    res.json({
      success: true,
      message: 'Recruiter profile updated successfully',
      recruiter,
      data: recruiter,
    });
  }),
);

router.post(
  '/profile/logo',
  authenticate,
  recruiterOnly,
  uploadSingle('logo', 'company-logos', {
    allowedMimeTypes: uploadMimeTypes.images,
    maxFileSize: 2 * 1024 * 1024,
  }),
  asyncHandler(async (req, res) => {
    const recruiterId = normalizeRecruiterId(req.auth.sub);

    if (!recruiterId) {
      throw new ApiError(400, 'Invalid recruiter id');
    }

    if (!req.file?.path) {
      throw new ApiError(400, 'Logo file is required');
    }

    const recruiter = await prisma.recruiters.update({
      where: { id: recruiterId },
      data: { company_logo: req.file.path },
      select: {
        id: true,
        company_logo: true,
      },
    });

    res.json({
      success: true,
      message: 'Company logo uploaded successfully',
      logoUrl: recruiter.company_logo,
      company_logo: recruiter.company_logo,
    });
  }),
);

router.get(
  '/verification',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const recruiterId = normalizeRecruiterId(req.auth.sub);

    if (!recruiterId) {
      return res.status(400).json({ success: false, message: 'Invalid recruiter id' });
    }

    const documents = await prisma.recruiter_verification_documents.findMany({
      where: { recruiter_id: recruiterId },
      select: {
        id: true,
        doc_type: true,
        file_path: true,
        status: true,
        rejection_reason: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const recruiter = await prisma.recruiters.findUnique({
      where: { id: recruiterId },
      select: { approval_status: true },
    });

    res.json({
      success: true,
      status: mapVerificationStatus(recruiter?.approval_status),
      documents: documents.map((doc) => ({
        ...doc,
        id: String(doc.id),
        status: mapVerificationStatus(doc.status),
      })),
    });
  }),
);

router.post(
  '/verification',
  authenticate,
  recruiterOnly,
  uploadSingle('document', 'verification', {
    allowedMimeTypes: uploadMimeTypes.documents,
    maxFileSize: 10 * 1024 * 1024,
  }),
  asyncHandler(async (req, res) => {
    const recruiterId = normalizeRecruiterId(req.auth.sub);

    if (!recruiterId) {
      return res.status(400).json({ success: false, message: 'Invalid recruiter id' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Document file is required' });
    }

    const docType = String(req.body?.doc_type || '').trim();
    if (!docType) {
      return res.status(400).json({ success: false, message: 'Document type is required' });
    }

    const filePath = req.file.path;

    const document = await prisma.recruiter_verification_documents.create({
      data: {
        recruiter_id: recruiterId,
        doc_type: docType,
        file_path: filePath,
        status: 'PENDING',
      },
      select: {
        id: true,
        doc_type: true,
        file_path: true,
        status: true,
        rejection_reason: true,
        created_at: true,
      },
    });

    await prisma.recruiters.update({
      where: { id: recruiterId },
      data: {
        approval_status: 'PENDING',
        approval_rejection_reason: null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Verification document uploaded successfully',
      document: {
        ...document,
        id: String(document.id),
        status: mapVerificationStatus(document.status),
      },
    });
  }),
);

export default router;
