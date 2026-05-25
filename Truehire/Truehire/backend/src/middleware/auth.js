import { ROLES } from '../constants/roles.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.split(' ')[1];
};

const normalizeRole = (role) => {
  if (role === null || role === undefined) {
    return null;
  }

  return String(role)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
};

const normalizeAuthPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }

  const normalizedSub = payload.sub ?? payload.userId ?? payload.id ?? null;

  if (normalizedSub === null || normalizedSub === undefined || normalizedSub === '') {
    throw new ApiError(401, 'Authentication token is missing a user identifier');
  }

  return {
    ...payload,
    sub: String(normalizedSub),
    userId: String(payload.userId ?? normalizedSub),
    id: String(payload.id ?? normalizedSub),
    role: normalizeRole(payload.role),
  };
};

export const authenticate = (req, _res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      throw new ApiError(401, 'Authentication token is required');
    }

    req.auth = normalizeAuthPayload(verifyAccessToken(token));
    req.user = req.auth;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid or expired authentication token'));
  }
};

export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.auth) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!normalizedAllowedRoles.includes(normalizeRole(req.auth.role))) {
    return next(new ApiError(403, 'You do not have permission to access this resource'));
  }

  next();
};

export const userOnly = authorize(ROLES.USER);
export const recruiterOnly = authorize(ROLES.RECRUITER);
export const adminOnly = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);
