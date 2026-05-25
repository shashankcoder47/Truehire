import { Router } from 'express';
import { authenticate, recruiterOnly, userOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  followCompany,
  getCompanyFollowersForRecruiter,
  getCompanyFollowingForRecruiter,
  getFollowStatus,
  getFollowedCompaniesForUser,
  unfollowCompany,
} from '../services/companyFollowService.js';

const router = Router();

router.post(
  '/companies/:companyId/follow',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await followCompany(req.auth.sub, req.params.companyId);

    res.status(201).json({
      success: true,
      message: 'Company followed successfully',
      ...result,
    });
  }),
);

router.delete(
  '/companies/:companyId/unfollow',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await unfollowCompany(req.auth.sub, req.params.companyId);

    res.json({
      success: true,
      message: 'Company unfollowed successfully',
      ...result,
    });
  }),
);

router.get(
  '/companies/:companyId/follow-status',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await getFollowStatus(req.auth.sub, req.params.companyId);

    res.json({
      success: true,
      ...result,
    });
  }),
);

router.get(
  '/companies/:companyId/followers',
  authenticate,
  asyncHandler(async (req, res) => {
    const followers = await getCompanyFollowersForRecruiter(req.params.companyId);

    res.json({
      success: true,
      followers,
      data: followers,
    });
  }),
);

router.get(
  '/companies/:companyId/following',
  authenticate,
  asyncHandler(async (req, res) => {
    const following = await getCompanyFollowingForRecruiter(req.params.companyId);

    res.json({
      success: true,
      following,
      data: following,
    });
  }),
);

router.get(
  '/users/followed-companies',
  authenticate,
  userOnly,
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
  '/recruiter/company-followers',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const followers = await getCompanyFollowersForRecruiter(req.auth.sub);

    res.json({
      success: true,
      followers,
      data: followers,
    });
  }),
);

router.get(
  '/recruiter/company-following',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const following = await getCompanyFollowingForRecruiter(req.auth.sub);

    res.json({
      success: true,
      following,
      data: following,
    });
  }),
);

export default router;
