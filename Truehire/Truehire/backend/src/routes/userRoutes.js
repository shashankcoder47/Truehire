import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { getFollowedCompaniesForUser } from '../services/companyFollowService.js';
import {
  getJobAlertPreference,
  getWeeklyJobMatchesForUser,
  getUserNotificationSettings,
  updateJobAlertPreference,
  updateUserNotificationSettings,
} from '../services/jobAlertService.js';
import { getProfile, updateProfilePhoto, updateProfileResume, upsertProfile } from '../services/userService.js';
import { getFollowList, getFollowStats } from '../services/followService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadSingle } from '../utils/upload.js';
import { updateUserProfileSchema } from '../validators/userValidators.js';

const router = Router();

router.get(
  '/job-alert-preference',
  authenticate,
  asyncHandler(async (req, res) => {
    const preference = await getJobAlertPreference(req.auth.sub);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      ...preference,
      preference,
    });
  }),
);

router.get(
  '/job-alert-matches',
  authenticate,
  asyncHandler(async (req, res) => {
    const jobs = await getWeeklyJobMatchesForUser(req.auth.sub);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  }),
);

router.put(
  '/job-alert-preference',
  authenticate,
  asyncHandler(async (req, res) => {
    const enabled = req.body.job_alert_enabled ?? req.body.job_alerts;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'job_alert_enabled must be a boolean',
      });
    }

    const preference = await updateJobAlertPreference(req.auth.sub, enabled);

    res.json({
      success: true,
      message: enabled ? 'Weekly job alerts enabled.' : 'Weekly job alerts disabled.',
      ...preference,
      preference,
    });
  }),
);

router.get(
  '/settings',
  authenticate,
  asyncHandler(async (req, res) => {
    const settings = await getUserNotificationSettings(req.auth.sub);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      settings,
    });
  }),
);

router.put(
  '/settings',
  authenticate,
  asyncHandler(async (req, res) => {
    const nextJobAlerts = req.body.job_alert_enabled ?? req.body.job_alerts;

    if (nextJobAlerts === undefined && req.body.email_notifications === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No supported settings to update',
      });
    }

    if (nextJobAlerts !== undefined && typeof nextJobAlerts !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'job_alerts must be a boolean',
      });
    }

    if (req.body.email_notifications !== undefined && typeof req.body.email_notifications !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'email_notifications must be a boolean',
      });
    }

    const settings = await updateUserNotificationSettings(req.auth.sub, req.body);

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      settings,
    });
  }),
);

router.get(
  '/followed-companies',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await getFollowedCompaniesForUser(req.auth.sub);

    res.json({
      success: true,
      ...data,
      data,
    });
  }),
);

router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await getProfile(req.auth.sub);
    res.setHeader('Cache-Control', 'no-store');

    res.json({
      success: true,
      user: profile,
      data: profile,
    });
  }),
);

router.get(
  '/profile/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await getProfile(req.auth.sub);
    res.setHeader('Cache-Control', 'no-store');

    res.json({
      success: true,
      user: profile,
      data: profile,
    });
  }),
);

router.get(
  '/profile/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await getProfile(req.params.id);
    const followStats = await getFollowStats(req.params.id);
    res.setHeader('Cache-Control', 'no-store');

    res.json({
      success: true,
      user: profile,
      data: profile,
      followStats,
    });
  }),
);

router.get(
  '/profile/:id/follows/:type(followers|following)',
  authenticate,
  asyncHandler(async (req, res) => {
    const users = await getFollowList(req.params.id, req.params.type, req.auth.sub);
    let data = users.map((user) => ({ ...user, followType: 'user' }));

    if (req.params.type === 'following') {
      const followedCompanies = await getFollowedCompaniesForUser(req.params.id);
      data = data.concat((followedCompanies.companies || []).map((company) => ({
        ...company,
        id: String(company.id),
        name: company.company_name || company.company || 'Company',
        profileImage: company.company_logo || null,
        followType: 'company',
      })));
    }

    res.json({
      success: true,
      data,
    });
  }),
);

router.put(
  '/profile/photo',
  authenticate,
  uploadSingle('photo', 'profile-images'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image uploads are allowed for profile photos',
      });
    }

    const filePath = req.file.path;
    const user = await updateProfilePhoto(req.auth.sub, filePath);

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      filePath,
      user,
      data: user,
    });
  }),
);

router.post(
  '/profile/resume',
  authenticate,
  uploadSingle('resume', 'resumes'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const allowedResumeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);

    if (!allowedResumeTypes.has(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF, DOC, and DOCX files are allowed for resumes',
      });
    }

    const filePath = req.file.path;
    const user = await updateProfileResume(req.auth.sub, filePath);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      file: {
        name: req.file.originalname,
        path: filePath,
        type: req.file.mimetype,
        size: req.file.size,
      },
      user,
      data: user,
    });
  }),
);

router.post(
  '/profile/certification-document',
  authenticate,
  uploadSingle('document', 'certification-documents'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Certification document uploaded successfully',
      file: {
        name: req.file.originalname,
        path: req.file.path,
        type: req.file.mimetype,
        size: req.file.size,
      },
    });
  }),
);

router.put(
  '/profile',
  authenticate,
  validateRequest({ body: updateUserProfileSchema }),
  asyncHandler(async (req, res) => {
    const profile = await upsertProfile(req.auth.sub, req.validatedBody);

    res.json({
      success: true,
      message: 'Profile saved successfully',
      user: profile,
      data: profile,
    });
  }),
);

router.put(
  '/profile/me',
  authenticate,
  validateRequest({ body: updateUserProfileSchema }),
  asyncHandler(async (req, res) => {
    const profile = await upsertProfile(req.auth.sub, req.validatedBody);

    res.json({
      success: true,
      message: 'Profile saved successfully',
      user: profile,
      data: profile,
    });
  }),
);

export default router;
