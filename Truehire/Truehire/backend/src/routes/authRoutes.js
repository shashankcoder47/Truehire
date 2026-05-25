import { Router } from 'express';
import {
  getCurrentUser,
  login,
  loginWithGoogle,
  register,
  resetPassword,
  sendForgotPasswordEmail,
  sendRecruiterOtp,
  verifyRecruiterOtp,
} from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { loginSchema, registerSchema } from '../validators/authValidators.js';

const router = Router();

const mapParamRole = (value) => String(value || 'user').trim().toUpperCase();
const authResponse = (result) => ({
  success: true,
  user: result.user,
  role: result.role || result.user?.role,
  token: result.token,
});

router.post(
  '/register/:role',
  asyncHandler(async (req, res) => {
    const result = await register(req.body, mapParamRole(req.params.role));

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      role: result.role || result.user?.role,
      user: result.user,
      token: result.token,
    });
  }),
);

router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const result = await register(req.validatedBody, req.validatedBody.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      role: result.role || result.user?.role,
      user: result.user,
      token: result.token,
    });
  }),
);

router.post(
  '/register/user',
  asyncHandler(async (req, res) => {
    const result = await register(req.body, 'USER');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      role: result.role || result.user?.role,
      user: result.user,
      token: result.token,
    });
  }),
);

router.post(
  '/register/recruiter',
  asyncHandler(async (req, res) => {
    const result = await register(req.body, 'RECRUITER');

    res.status(201).json({
      success: true,
      message: 'Recruiter registered successfully',
      role: result.role || result.user?.role,
      user: result.user,
      token: result.token,
    });
  }),
);

router.post(
  '/register/admin',
  asyncHandler(async (req, res) => {
    res.status(403).json({
      success: false,
      message: 'Admin accounts cannot be created from public registration',
    });
  }),
);

router.post(
  '/google/login',
  asyncHandler(async (req, res) => {
    const result = await loginWithGoogle(req.body || {});

    res.json({
      success: true,
      message: 'Google login successful',
      role: result.role || result.user?.role,
      user: result.user,
      token: result.token,
    });
  }),
);

router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const result = await login(req.validatedBody);

    console.log('POST /api/auth/login response:', {
      email: req.validatedBody.email,
      hasUser: Boolean(result?.user),
      hasToken: Boolean(result?.token),
    });

    res.json({
      ...authResponse(result),
      message: 'Login successful',
    });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await getCurrentUser(req.auth);

    res.json({
      success: true,
      ...result,
    });
  }),
);

router.post(
  '/send-otp',
  asyncHandler(async (req, res) => {
    const result = await sendRecruiterOtp(req.body || {});

    res.json(result);
  }),
);

router.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const result = await verifyRecruiterOtp(req.body || {});

    res.json({
      success: true,
      message: 'OTP verified successfully',
      role: result.role || result.user?.role,
      user: result.user,
      token: result.token,
    });
  }),
);

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const result = await sendForgotPasswordEmail({
      email: req.body?.email,
      userType: 'USER',
    });

    res.json(result);
  }),
);

router.post(
  '/recruiter-forgot-password',
  asyncHandler(async (req, res) => {
    const result = await sendForgotPasswordEmail({
      email: req.body?.email,
      userType: 'RECRUITER',
    });

    res.json(result);
  }),
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const result = await resetPassword(req.body || {});

    res.json(result);
  }),
);

export default router;
