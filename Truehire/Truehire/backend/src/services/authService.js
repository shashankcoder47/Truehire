import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { ROLES } from '../constants/roles.js';
import { pool, prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { signAccessToken } from '../utils/jwt.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { sendOtpEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js';
import { ensureSuperAdminRoleColumn } from './superAdminService.js';

const ROLE_MAP = {
  USER: ROLES.USER,
  RECRUITER: ROLES.RECRUITER,
  ADMIN: ROLES.ADMIN,
  SUPER_ADMIN: ROLES.SUPER_ADMIN,
};

const RESET_USER_TYPES = {
  USER: 'USER',
  RECRUITER: 'RECRUITER',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;
const CONFIG_ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const CONFIG_ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || '');
const hasConfiguredAdminLogin = Boolean(CONFIG_ADMIN_EMAIL && CONFIG_ADMIN_PASSWORD);

const normalizeRequestedRole = (value) => {
  const normalized = String(value || ROLES.USER).trim().toUpperCase();
  const role = ROLE_MAP[normalized];

  if (!role) {
    throw new ApiError(400, 'Invalid role. Allowed values: USER, RECRUITER, ADMIN, SUPER_ADMIN');
  }

  return role;
};

const normalizePublicRegisterRole = (value) => {
  const role = normalizeRequestedRole(value || ROLES.USER);

  if (![ROLES.USER, ROLES.RECRUITER].includes(role)) {
    throw new ApiError(403, 'Admin accounts cannot be created from public registration');
  }

  return role;
};

const formatFrontendRole = (role) => String(role || ROLES.USER).toLowerCase();

const buildUserPayload = (record, role) => ({
  id: String(record.id),
  fullName: record.name,
  name: record.name,
  email: record.email,
  role: formatFrontendRole(role),
});

const buildAuthResponse = (record, role) => ({
  success: true,
  user: buildUserPayload(record, role),
  token: signAccessToken({
    userId: String(record.id),
    sub: String(record.id),
    email: record.email,
    role: formatFrontendRole(role),
  }),
  role: formatFrontendRole(role),
});

const assertRecruiterApproved = (recruiter) => {
  const approvalStatus = String(recruiter?.approval_status || 'PENDING').trim().toUpperCase();

  if (approvalStatus === 'APPROVED') {
    return;
  }

  if (approvalStatus === 'REJECTED') {
    throw new ApiError(
      403,
      recruiter?.approval_rejection_reason
        ? `Recruiter account rejected: ${recruiter.approval_rejection_reason}`
        : 'Recruiter account has been rejected by admin',
    );
  }

  throw new ApiError(403, 'Recruiter account is pending admin approval');
};

const getErrorStatusCode = (error) => error?.statusCode ?? error?.status;

const isAuthFallbackError = (error) =>
  error instanceof ApiError && [401, 403].includes(getErrorStatusCode(error));

const logAdminAuthDebug = (message, details = {}) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.log(`[admin-auth] ${message}`, details);
};

const buildCustomAuthResponse = ({ tokenPayload, user }) => ({
  success: true,
  user,
  token: signAccessToken(tokenPayload),
});

const queueWelcomeEmail = ({ email, name, roleLabel, loginPath }) => {
  sendWelcomeEmail({ to: email, name, roleLabel, loginPath }).catch((error) => {
    console.error('Welcome email failed:', error?.message || error);
  });
};

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

const getPasswordResetPath = (userType) =>
  userType === RESET_USER_TYPES.RECRUITER ? '/recruiter-reset-password' : '/reset-password';

const getPasswordResetUrl = (userType, token) =>
  `${env.frontendUrl}${getPasswordResetPath(userType)}?token=${encodeURIComponent(token)}`;

const registerAppUser = async ({ name, email, password, role }) => {
  const existingUser = await prisma.users.findFirst({
    where: {
      email,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const hashedPassword = await hashPassword(password);

  let user;
  try {
    user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new ApiError(409, 'An account with this email already exists');
    }
    throw error;
  }

  queueWelcomeEmail({
    email,
    name,
    roleLabel: String(role || 'user').toLowerCase(),
    loginPath: '/login',
  });

  return buildAuthResponse(user, role);
};

const registerRecruiterAccount = async ({ name, email, password, company }) => {
  const existingRecruiter = await prisma.recruiters.findFirst({
    where: {
      email,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (existingRecruiter) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const hashedPassword = await hashPassword(password);

  let recruiter;
  try {
    recruiter = await prisma.recruiters.create({
      data: {
        name,
        email,
        password: hashedPassword,
        company: company || null,
        company_name: company || null,
        role: ROLES.RECRUITER,
        approval_status: 'PENDING',
        approval_rejection_reason: null,
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new ApiError(409, 'An account with this email already exists');
    }
    throw error;
  }

  return buildAuthResponse(recruiter, ROLES.RECRUITER);
};

const getRows = async (query, values = []) => {
  const [rows] = await pool.execute(query, values);
  return rows;
};

const getFirstRow = async (query, values = []) => {
  const rows = await getRows(query, values);
  return rows[0] || null;
};

const accountExistsByEmail = async (email) => {
  const [user, recruiter, admin] = await Promise.all([
    getFirstRow('SELECT id FROM users WHERE email = ? LIMIT 1', [email]),
    getFirstRow('SELECT id FROM recruiters WHERE email = ? LIMIT 1', [email]),
    getFirstRow('SELECT id FROM admins WHERE email = ? LIMIT 1', [email]).catch(() => null),
  ]);

  return Boolean(user || recruiter || admin);
};

const registerAppUserWithMysql = async ({ name, email, password }) => {
  if (await accountExistsByEmail(email)) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const hashedPassword = await hashPassword(password);
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [name, email, hashedPassword, ROLES.USER],
  );

  const user = await getFirstRow('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1', [result.insertId]);

  queueWelcomeEmail({
    email,
    name,
    roleLabel: 'user',
    loginPath: '/login',
  });

  return buildAuthResponse(user, ROLES.USER);
};

const registerRecruiterWithMysql = async ({ name, email, password, company }) => {
  if (await accountExistsByEmail(email)) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const hashedPassword = await hashPassword(password);
  const [result] = await pool.execute(
    `INSERT INTO recruiters (
       name, email, password, company, company_name, role, approval_status,
       approval_rejection_reason, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NULL, NOW(), NOW())`,
    [name, email, hashedPassword, company || null, company || null, ROLES.RECRUITER],
  );

  const recruiter = await getFirstRow(
    'SELECT id, name, email, role, approval_status FROM recruiters WHERE id = ? LIMIT 1',
    [result.insertId],
  );

  return buildAuthResponse(recruiter, ROLES.RECRUITER);
};

export const register = async (payload, explicitRole) => {
  const role = normalizePublicRegisterRole(explicitRole || payload.role);
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  const company = String(payload.company || '').trim();

  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email, and password are required');
  }

  if (role === ROLES.RECRUITER) {
    if (!company) {
      throw new ApiError(400, 'company is required for recruiter registration');
    }
    return registerRecruiterWithMysql({ name, email, password, company });
  }

  return registerAppUserWithMysql({ name, email, password });
};

export const loginWithGoogle = async ({ token, credential }) => {
  const idToken = String(token || credential || '').trim();

  if (!idToken) {
    throw new ApiError(400, 'Google credential is required');
  }

  if (!googleClient || !env.googleClientId) {
    throw new ApiError(500, 'Google login is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  const googleId = String(payload?.sub || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const name = String(payload?.name || email.split('@')[0] || 'User').trim();

  if (!googleId || !email) {
    throw new ApiError(400, 'Unable to verify Google account');
  }

  let user = await prisma.users.findFirst({
    where: {
      OR: [{ google_id: googleId }, { email }],
    },
  });

  if (user && String(user.role || '').toUpperCase() !== ROLES.USER) {
    throw new ApiError(403, 'Google login is only available for user accounts on this page');
  }

  if (!user) {
    user = await prisma.users.create({
      data: {
        name,
        email,
        role: ROLES.USER,
        google_id: googleId,
        login_type: 'GOOGLE',
      },
    });
  } else {
    user = await prisma.users.update({
      where: { id: user.id },
      data: {
        name: user.name || name,
        google_id: user.google_id || googleId,
        login_type: 'GOOGLE',
      },
    });
  }

  return buildAuthResponse(user, ROLES.USER);
};

const loginUserAccount = async ({ email, password, role }) => {
  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (String(user.role || '').toUpperCase() !== role) {
    throw new ApiError(403, `This account is not registered as ${role}`);
  }

  if (!user.password) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return buildAuthResponse(user, role);
};

const loginRecruiterAccount = async ({ email, password }) => {
  const recruiter = await prisma.recruiters.findUnique({
    where: { email },
  });

  if (!recruiter || !recruiter.password) {
    throw new ApiError(401, 'Invalid email or password');
  }

  assertRecruiterApproved(recruiter);

  const isPasswordValid = await comparePassword(password, recruiter.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return buildAuthResponse(recruiter, ROLES.RECRUITER);
};

const authenticateRecruiterLikeAccount = async ({ email, password }) => {
  const recruiter = await prisma.recruiters.findUnique({
    where: { email },
  });

  if (recruiter?.password) {
    const isPasswordValid = await comparePassword(password, recruiter.password);
    if (isPasswordValid) {
      assertRecruiterApproved(recruiter);
      return {
        kind: 'recruiter',
        record: recruiter,
      };
    }
  }

  const subRecruiter = await prisma.sub_recruiters.findUnique({
    where: { email },
  });

  if (!subRecruiter?.password) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, subRecruiter.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return {
    kind: 'sub_recruiter',
    record: subRecruiter,
  };
};

const loginAdminAccount = async ({ email, password }) => {
  logAdminAuthDebug('ADMIN login attempt received', { email });

  if (hasConfiguredAdminLogin && email === CONFIG_ADMIN_EMAIL && password === CONFIG_ADMIN_PASSWORD) {
    logAdminAuthDebug('ADMIN configured credentials matched', { email });
    return buildCustomAuthResponse({
      tokenPayload: {
        userId: '0',
        sub: '0',
        id: '0',
        email: CONFIG_ADMIN_EMAIL,
        role: ROLES.ADMIN,
      },
      user: {
        id: '0',
        name: 'TrueHire Admin',
        email: CONFIG_ADMIN_EMAIL,
        role: formatFrontendRole(ROLES.ADMIN),
      },
    });
  }

  let admin = await prisma.users.findUnique({
    where: { email },
  });

  logAdminAuthDebug('ADMIN users table lookup complete', {
    email,
    found: Boolean(admin),
    role: admin?.role || null,
  });

  if (admin) {
    if (String(admin.role || '').toUpperCase() !== ROLES.ADMIN) {
      throw new ApiError(403, 'This account is not registered as ADMIN');
    }

    const isPasswordValid = await comparePassword(password, admin.password || '');
    logAdminAuthDebug('ADMIN users table bcrypt compare complete', {
      email,
      isMatch: isPasswordValid,
    });

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const response = buildAuthResponse(admin, ROLES.ADMIN);
    logAdminAuthDebug('ADMIN users table JWT generated', {
      email,
      role: response.user.role,
      tokenGenerated: Boolean(response.token),
    });
    return response;
  }

  const legacyAdmin = await prisma.admins.findUnique({
    where: { email },
  });

  logAdminAuthDebug('ADMIN legacy admins table lookup complete', {
    email,
    found: Boolean(legacyAdmin),
    role: legacyAdmin?.role || null,
  });

  if (legacyAdmin) {
    const isPasswordValid = await comparePassword(password, legacyAdmin.password || '');
    logAdminAuthDebug('ADMIN legacy admins table bcrypt compare complete', {
      email,
      isMatch: isPasswordValid,
    });

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const response = buildAuthResponse(legacyAdmin, ROLES.ADMIN);
    logAdminAuthDebug('ADMIN legacy admins table JWT generated', {
      email,
      role: response.user.role,
      tokenGenerated: Boolean(response.token),
    });
    return response;
  }

  throw new ApiError(401, 'Invalid email or password');
};

const loginSuperAdminAccount = async ({ email, password }) => {
  await ensureSuperAdminRoleColumn();
  logAdminAuthDebug('SUPER_ADMIN login fallback attempt received', { email });

  const superAdmin = await prisma.super_admins.findUnique({
    where: { email },
  });

  logAdminAuthDebug('SUPER_ADMIN table lookup complete', {
    email,
    found: Boolean(superAdmin),
    role: 'SUPER_ADMIN',
    hasPasswordHash: Boolean(superAdmin?.password),
    passwordHashPrefix: superAdmin?.password ? String(superAdmin.password).slice(0, 7) : null,
  });

  if (!superAdmin || !superAdmin.password) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, superAdmin.password);
  logAdminAuthDebug('SUPER_ADMIN bcrypt compare complete', {
    email,
    isMatch: isPasswordValid,
  });

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const response = buildAuthResponse(superAdmin, ROLES.SUPER_ADMIN);
  logAdminAuthDebug('SUPER_ADMIN JWT generated', {
    email,
    role: response.user.role,
    tokenGenerated: Boolean(response.token),
  });
  return response;
};

const verifyPasswordForRecord = async (record, password) => {
  if (!record?.password) return false;
  return comparePassword(password, record.password);
};

const buildMysqlAuthResponse = (record, role) => buildAuthResponse(record, role);

const findUserAuthAccount = async (email, password) => {
  const user = await getFirstRow(
    'SELECT id, name, email, password, role, status FROM users WHERE email = ? LIMIT 1',
    [email],
  );

  if (!user || !(await verifyPasswordForRecord(user, password))) {
    return null;
  }

  const role = String(user.role || ROLES.USER).trim().toUpperCase();
  if (![ROLES.USER, ROLES.ADMIN].includes(role)) {
    return null;
  }

  if (user.status && String(user.status).trim().toUpperCase() !== 'ACTIVE') {
    throw new ApiError(403, 'Account is not active');
  }

  return buildMysqlAuthResponse(user, role);
};

const findRecruiterAuthAccount = async (email, password) => {
  const recruiter = await getFirstRow(
    `SELECT id, name, email, password, role, approval_status, approval_rejection_reason
     FROM recruiters
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  if (!recruiter || !(await verifyPasswordForRecord(recruiter, password))) {
    return null;
  }

  assertRecruiterApproved(recruiter);
  return buildMysqlAuthResponse(recruiter, ROLES.RECRUITER);
};

const findAdminAuthAccount = async (email, password) => {
  if (hasConfiguredAdminLogin && email === CONFIG_ADMIN_EMAIL && password === CONFIG_ADMIN_PASSWORD) {
    return buildCustomAuthResponse({
      tokenPayload: {
        userId: '0',
        sub: '0',
        id: '0',
        email: CONFIG_ADMIN_EMAIL,
        role: 'admin',
      },
      user: {
        id: '0',
        name: 'TrueHire Admin',
        email: CONFIG_ADMIN_EMAIL,
        role: 'admin',
      },
    });
  }

  const admin = await getFirstRow(
    'SELECT id, name, email, password, role, status FROM admins WHERE email = ? LIMIT 1',
    [email],
  ).catch(() => null);

  if (!admin || !(await verifyPasswordForRecord(admin, password))) {
    return null;
  }

  if (admin.status && String(admin.status).trim().toUpperCase() !== 'ACTIVE') {
    throw new ApiError(403, 'Admin account is not active');
  }

  return buildMysqlAuthResponse(admin, ROLES.ADMIN);
};

const findSuperAdminAuthAccount = async (email, password) => {
  const superAdmin = await getFirstRow(
    'SELECT id, name, email, password FROM super_admins WHERE email = ? LIMIT 1',
    [email],
  ).catch(() => null);

  if (!superAdmin || !(await verifyPasswordForRecord(superAdmin, password))) {
    return null;
  }

  return buildMysqlAuthResponse(superAdmin, ROLES.SUPER_ADMIN);
};

const findAccountByCredentials = async ({ email, password, role }) => {
  const requestedRole = role ? normalizeRequestedRole(role) : null;

  if (!requestedRole || requestedRole === ROLES.USER || requestedRole === ROLES.ADMIN) {
    const userResult = await findUserAuthAccount(email, password);
    if (userResult && (!requestedRole || String(userResult.role).toUpperCase().replace(/-/g, '_') === requestedRole)) {
      return userResult;
    }
  }

  if (!requestedRole || requestedRole === ROLES.RECRUITER) {
    const recruiterResult = await findRecruiterAuthAccount(email, password);
    if (recruiterResult) return recruiterResult;
  }

  if (!requestedRole || requestedRole === ROLES.ADMIN) {
    const adminResult = await findAdminAuthAccount(email, password);
    if (adminResult) return adminResult;
  }

  if (!requestedRole || requestedRole === ROLES.SUPER_ADMIN || requestedRole === ROLES.ADMIN) {
    const superAdminResult = await findSuperAdminAuthAccount(email, password);
    if (superAdminResult) return superAdminResult;
  }

  return null;
};

const getResetAccountByEmail = async (email, userType) => {
  if (userType === RESET_USER_TYPES.RECRUITER) {
    const recruiter = await prisma.recruiters.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!recruiter) {
      throw new ApiError(404, 'Recruiter account not found');
    }

    return recruiter;
  }

  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user || String(user.role || '').toUpperCase() !== ROLES.USER) {
    throw new ApiError(404, 'User account not found');
  }

  return user;
};

const updatePasswordByResetToken = async ({ token, newPassword }) => {
  const resetToken = await prisma.reset_tokens.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expires_at <= new Date()) {
    throw new ApiError(400, 'Reset link is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);

  if (resetToken.user_type === RESET_USER_TYPES.RECRUITER) {
    await prisma.recruiters.update({
      where: { id: resetToken.user_id },
      data: { password: passwordHash },
    });
  } else {
    await prisma.users.update({
      where: { id: resetToken.user_id },
      data: { password: passwordHash },
    });
  }

  await prisma.reset_tokens.delete({
    where: { token },
  });

  return {
    success: true,
    message: 'Password reset successfully',
  };
};

export const sendRecruiterOtp = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new ApiError(400, 'email and password are required');
  }

  await authenticateRecruiterLikeAccount({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  const otp = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otp_codes.deleteMany({
    where: { email: normalizedEmail },
  });

  await prisma.otp_codes.create({
    data: {
      email: normalizedEmail,
      otp_code: otp,
      expires_at: expiresAt,
    },
  });

  try {
    await sendOtpEmail({
      to: normalizedEmail,
      otp,
    });
  } catch (error) {
    await prisma.otp_codes.deleteMany({
      where: { email: normalizedEmail },
    });

    throw new ApiError(500, error.message || 'Failed to send OTP email');
  }

  return {
    success: true,
    message: 'OTP sent successfully',
  };
};

export const verifyRecruiterOtp = async ({ email, otp }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedOtp = String(otp || '').trim();

  if (!normalizedEmail || !normalizedOtp) {
    throw new ApiError(400, 'email and otp are required');
  }

  const otpRecord = await prisma.otp_codes.findFirst({
    where: {
      email: normalizedEmail,
      otp_code: normalizedOtp,
      expires_at: {
        gt: new Date(),
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!otpRecord) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  await prisma.otp_codes.deleteMany({
    where: { email: normalizedEmail },
  });

  const recruiter = await prisma.recruiters.findUnique({
    where: { email: normalizedEmail },
  });

  if (recruiter) {
    assertRecruiterApproved(recruiter);
    return buildAuthResponse(recruiter, ROLES.RECRUITER);
  }

  const subRecruiter = await prisma.sub_recruiters.findUnique({
    where: { email: normalizedEmail },
  });

  if (!subRecruiter) {
    throw new ApiError(404, 'Recruiter account not found');
  }

  return buildCustomAuthResponse({
    tokenPayload: {
      userId: String(subRecruiter.recruiter_id),
      sub: String(subRecruiter.recruiter_id),
      email: subRecruiter.email,
      role: ROLES.RECRUITER,
      subRecruiterId: String(subRecruiter.id),
    },
    user: {
      id: String(subRecruiter.id),
      name: subRecruiter.name,
      email: subRecruiter.email,
      role: 'sub-recruiter',
      mainRecruiterId: String(subRecruiter.recruiter_id),
    },
  });
};

export const sendForgotPasswordEmail = async ({ email, userType }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new ApiError(400, 'email is required');
  }

  const account = await getResetAccountByEmail(normalizedEmail, userType);
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const resetUrl = getPasswordResetUrl(userType, token);

  await prisma.reset_tokens.deleteMany({
    where: {
      email: normalizedEmail,
      user_type: userType,
    },
  });

  await prisma.reset_tokens.create({
    data: {
      token,
      user_id: account.id,
      user_type: userType,
      email: normalizedEmail,
      expires_at: expiresAt,
    },
  });

  try {
    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: account.name,
      resetUrl,
    });
  } catch (error) {
    await prisma.reset_tokens.deleteMany({
      where: {
        email: normalizedEmail,
        user_type: userType,
      },
    });

    throw new ApiError(500, error.message || 'Failed to send reset email');
  }

  return {
    success: true,
    message: 'Password reset link sent successfully',
  };
};

export const resetPassword = async ({ token, newPassword }) => {
  const normalizedToken = String(token || '').trim();
  const normalizedPassword = String(newPassword || '');

  if (!normalizedToken || !normalizedPassword) {
    throw new ApiError(400, 'token and newPassword are required');
  }

  return updatePasswordByResetToken({
    token: normalizedToken,
    newPassword: normalizedPassword,
  });
};

export const login = async ({ email, password, role }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new ApiError(400, 'email and password are required');
  }

  const result = await findAccountByCredentials({
    email: normalizedEmail,
    password: normalizedPassword,
    role,
  });

  if (!result) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return result;
};

export const getCurrentUser = async ({ userId, email, role }) => {
  const normalizedRole = String(role || '').trim().toLowerCase().replace(/_/g, '-');
  const id = String(userId || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!id && !normalizedEmail) {
    throw new ApiError(401, 'Invalid authentication token');
  }

  let table = 'users';
  let responseRole = ROLES.USER;

  if (normalizedRole === 'recruiter' || normalizedRole === 'sub-recruiter') {
    table = 'recruiters';
    responseRole = ROLES.RECRUITER;
  } else if (normalizedRole === 'admin') {
    table = 'admins';
    responseRole = ROLES.ADMIN;
  } else if (normalizedRole === 'super-admin') {
    table = 'super_admins';
    responseRole = ROLES.SUPER_ADMIN;
  }

  const record = id === '0' && hasConfiguredAdminLogin
    ? { id: '0', name: 'TrueHire Admin', email: normalizedEmail || CONFIG_ADMIN_EMAIL }
    : await getFirstRow(
        `SELECT id, name, email FROM ${table} WHERE ${id ? 'id = ?' : 'email = ?'} LIMIT 1`,
        [id || normalizedEmail],
      ).catch(() => null);

  if (!record) {
    throw new ApiError(404, 'Account not found');
  }

  return {
    user: buildUserPayload(record, responseRole),
    role: formatFrontendRole(responseRole),
  };
};

export const adminLogin = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new ApiError(400, 'email and password are required');
  }

  try {
    return await loginAdminAccount({
      email: normalizedEmail,
      password: normalizedPassword,
    });
  } catch (error) {
    if (!isAuthFallbackError(error)) {
      throw error;
    }

    logAdminAuthDebug('/api/admin/login ADMIN auth failed, trying SUPER_ADMIN fallback', {
      email: normalizedEmail,
      statusCode: getErrorStatusCode(error),
      message: error.message,
    });

    return loginSuperAdminAccount({
      email: normalizedEmail,
      password: normalizedPassword,
    });
  }
};
