
// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// /* ===========================================================
//    VERIFY TOKEN — FIXED
//    - Handles missing token properly
//    - Handles malformed tokens without crashing
//    - Ensures req.user is always set ONLY if valid
// =========================================================== */
// const verifyToken = (req, res, next) => {
//   try {
//     let token =
//       req.header('Authorization') ||
//       req.header('x-admin-token') ||
//       req.header('x-access-token');

//     if (!token) {
//       return res.status(401).json({ message: 'Access denied. No token provided.' });
//     }

//     // Support formats:
//     // "Bearer <token>"
//     // "<token>"
//     if (token.startsWith('Bearer ')) {
//       token = token.replace('Bearer ', '');
//     }

//     const decoded = jwt.verify(token, JWT_SECRET);

//     // SAFETY FIX — ensure decoded has id & role
//     if (!decoded || !decoded.id) {
//       return res.status(401).json({ message: 'Invalid user token.' });
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     console.error('Token verification error:', error.message);
//     return res.status(401).json({ message: 'Invalid token.' });
//   }
// };

// /* ===========================================================
//    REQUIRE AUTH
// =========================================================== */
// const requireAuth = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({ message: 'Authentication required.' });
//   }
//   next();
// };

// /* ===========================================================
//    REQUIRE ADMIN
// =========================================================== */
// const requireAdmin = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({ message: 'Authentication required.' });
//   }

//   if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
//     return res.status(403).json({ message: 'Admin access required.' });
//   }

//   next();
// };

// /* ===========================================================
//    REQUIRE SUPER ADMIN
// =========================================================== */
// const requireSuperAdmin = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({ message: 'Authentication required.' });
//   }

//   if (req.user.role !== 'super_admin') {
//     return res.status(403).json({ message: 'Super admin access required.' });
//   }

//   next();
// };

// /* ===========================================================
//    REQUIRE RECRUITER
// =========================================================== */
// const requireRecruiter = (req, res, next) => {
//   if (
//     !req.user ||
//     (req.user.role !== 'recruiter' && req.user.role !== 'sub-recruiter')
//   ) {
//     return res.status(403).json({ message: 'Recruiter access required.' });
//   }
//   next();
// };

// /* ===========================================================
//    REQUIRE USER — FIXED
//    - Prevents false "User access required" when token role missing
// =========================================================== */
// const requireUser = (req, res, next) => {
//   if (!req.user || req.user.role !== 'user') {
//     return res.status(403).json({ message: 'User access required.' });
//   }
//   next();
// };

// /* ===========================================================
//    GENERATE TOKEN — FIXED
//    - Always includes correct role/id
// =========================================================== */
// const generateToken = (user) => {
//   const tokenData = {
//     id: user.id,
//     email: user.email,
//     role: user.role
//   };

//   if (user.role === 'sub-recruiter' && user.mainRecruiterId) {
//     tokenData.mainRecruiterId = user.mainRecruiterId;
//   }

//   if (user.role === 'sub-recruiter' && user.subRecruiterId) {
//     tokenData.subRecruiterId = user.subRecruiterId;
//   }

//   return jwt.sign(tokenData, JWT_SECRET, { expiresIn: '24h' });
// };

// module.exports = {
//   verifyToken,
//   requireAuth,
//   requireAdmin,
//   requireSuperAdmin,
//   requireRecruiter,
//   requireUser,
//   generateToken
// };
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}

/* ===========================================================
   VERIFY TOKEN — FINAL FIXED VERSION
   ✔ Supports adminToken
   ✔ Supports recruiter/user tokens
   ✔ Accepts both Bearer and raw token
=========================================================== */
const verifyToken = (req, res, next) => {
  try {
    let token =
      req.header('Authorization') ||
      req.header('x-admin-token') ||
      req.header('x-access-token');

    // If no token header found → try reading adminToken manually
    if (!token && req.headers && req.headers.admintoken) {
      token = req.headers.admintoken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Handle "Bearer <token>" format
    if (token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid user token.' });
    }

    if (decoded.role === 'sub_recruiter') {
      decoded.role = 'sub-recruiter';
    }
    if (decoded.role === 'sub-recruiter' && decoded.parentRecruiterId && !decoded.mainRecruiterId) {
      decoded.mainRecruiterId = decoded.parentRecruiterId;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

/* ===========================================================
   VERIFY TOKEN (OPTIONAL)
   - If token is present and valid, sets req.user
   - If token missing/invalid, continues as guest
=========================================================== */
const verifyTokenOptional = (req, res, next) => {
  try {
    let token =
      req.header('Authorization') ||
      req.header('x-admin-token') ||
      req.header('x-access-token');

    if (!token && req.headers && req.headers.admintoken) {
      token = req.headers.admintoken;
    }

    if (!token) {
      return next();
    }

    if (token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return next();
    }

    if (decoded.role === 'sub_recruiter') {
      decoded.role = 'sub-recruiter';
    }
    if (decoded.role === 'sub-recruiter' && decoded.parentRecruiterId && !decoded.mainRecruiterId) {
      decoded.mainRecruiterId = decoded.parentRecruiterId;
    }

    req.user = decoded;
  } catch (_) {
    // Intentionally ignore invalid token for optional auth routes.
  }
  return next();
};

/* ===========================================================
   REQUIRE AUTH
=========================================================== */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  next();
};

/* ===========================================================
   REQUIRE ADMIN
=========================================================== */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
};

/* ===========================================================
   REQUIRE SUPER ADMIN
=========================================================== */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }

  next();
};

/* ===========================================================
   REQUIRE RECRUITER
=========================================================== */
const requireRecruiter = (req, res, next) => {
  if (
    !req.user ||
    (req.user.role !== 'recruiter' && req.user.role !== 'sub-recruiter')
  ) {
    return res.status(403).json({ message: 'Recruiter access required.' });
  }
  next();
};

/* ===========================================================
   REQUIRE USER
=========================================================== */
const requireUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({ message: 'User access required.' });
  }
  next();
};

/* ===========================================================
   GENERATE TOKEN
=========================================================== */
const generateToken = (user) => {
  const tokenData = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const isSubRecruiter = user.role === 'sub-recruiter' || user.role === 'sub_recruiter';
  if (isSubRecruiter) {
    if (user.mainRecruiterId || user.parentRecruiterId) {
      tokenData.mainRecruiterId = user.mainRecruiterId || user.parentRecruiterId;
    }
    if (user.parentRecruiterId || user.mainRecruiterId) {
      tokenData.parentRecruiterId = user.parentRecruiterId || user.mainRecruiterId;
    }
    if (user.subRecruiterId) {
      tokenData.subRecruiterId = user.subRecruiterId;
    }
  }

  return jwt.sign(tokenData, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  verifyToken,
  verifyTokenOptional,
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  requireRecruiter,
  requireUser,
  generateToken
};
