import { Router } from 'express';
import { prisma } from '../config/database.js';
import { adminLogin } from '../services/authService.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword } from '../utils/password.js';
import { sendEmail } from '../utils/email.js';
import { env } from '../config/env.js';
import { ensureSuperAdminRoleColumn } from '../services/superAdminService.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = await adminLogin(req.body || {});

    res.json({
      success: true,
      message: 'Admin login successful',
      user: result.user,
      token: result.token,
    });
  }),
);

router.use(authenticate);
router.use(adminOnly);

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.max(Math.ceil(total / limit), 1),
});

const containsFilter = (value) => {
  const normalized = String(value || '').trim();
  return normalized ? { contains: normalized } : undefined;
};

const normalizeRecruiterApprovalStatus = (value) => {
  const normalized = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

  if (!normalized) return undefined;
  if (normalized === 'PENDING' || normalized === 'PENDING_APPROVAL') return 'PENDING';
  if (normalized === 'APPROVED' || normalized === 'ACCEPTED') return 'APPROVED';
  if (normalized === 'REJECTED' || normalized === 'DECLINED') return 'REJECTED';

  return undefined;
};

const toTitleCase = (value) =>
  String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const cleanupUserOwnedSocialData = async (tx, userId) => {
  await tx.$executeRawUnsafe('DELETE FROM post_comment_likes WHERE user_id = ? AND author_role = ?', userId, 'USER');
  await tx.$executeRawUnsafe('DELETE FROM post_comments WHERE user_id = ? AND author_role = ?', userId, 'USER');
  await tx.$executeRawUnsafe('DELETE FROM company_post_views WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM post_likes WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM company_followers WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM company_network WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM company_status_views WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM pulse_updates WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM weekly_job_alert_logs WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM user_direct_messages WHERE sender_id = ? OR receiver_id = ?', userId, userId);
  await tx.$executeRawUnsafe('DELETE FROM favourite_notifications WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM job_recommendation_emails WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM work_experience WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM education WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM support_tickets WHERE user_id = ?', userId);
  await tx.$executeRawUnsafe('DELETE FROM job_views WHERE user_id = ?', userId);

  await tx.$executeRawUnsafe(
    'DELETE FROM user_post_comment_likes WHERE user_id = ? OR comment_id IN (SELECT id FROM user_post_comments WHERE user_id = ? OR post_id IN (SELECT id FROM user_posts WHERE user_id = ?))',
    userId,
    userId,
    userId,
  );
  await tx.$executeRawUnsafe(
    'DELETE FROM user_post_comments WHERE user_id = ? OR post_id IN (SELECT id FROM user_posts WHERE user_id = ?)',
    userId,
    userId,
  );
  await tx.$executeRawUnsafe(
    'DELETE FROM user_post_likes WHERE user_id = ? OR post_id IN (SELECT id FROM user_posts WHERE user_id = ?)',
    userId,
    userId,
  );
  await tx.$executeRawUnsafe(
    'DELETE FROM user_post_shares WHERE user_id = ? OR post_id IN (SELECT id FROM user_posts WHERE user_id = ?)',
    userId,
    userId,
  );
  await tx.$executeRawUnsafe(
    'DELETE FROM user_post_media WHERE post_id IN (SELECT id FROM user_posts WHERE user_id = ?)',
    userId,
  );
  await tx.$executeRawUnsafe('DELETE FROM user_posts WHERE user_id = ?', userId);

  await tx.$executeRawUnsafe(
    'DELETE FROM user_direct_conversation_messages WHERE sender_id = ? OR receiver_id = ? OR conversation_id IN (SELECT id FROM user_direct_conversations WHERE user1_id = ? OR user2_id = ?)',
    userId,
    userId,
    userId,
    userId,
  );
  await tx.$executeRawUnsafe('DELETE FROM user_direct_conversations WHERE user1_id = ? OR user2_id = ?', userId, userId);
};

const cleanupRecruiterOwnedSocialData = async (tx, recruiterId) => {
  await tx.$executeRawUnsafe('DELETE FROM post_comment_likes WHERE user_id = ? AND author_role = ?', recruiterId, 'RECRUITER');
  await tx.$executeRawUnsafe('DELETE FROM post_comments WHERE user_id = ? AND author_role = ?', recruiterId, 'RECRUITER');
  await tx.$executeRawUnsafe('DELETE FROM company_status_views WHERE status_id IN (SELECT id FROM company_statuses WHERE recruiter_id = ? OR company_id = ?)', recruiterId, recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM company_statuses WHERE recruiter_id = ? OR company_id = ?', recruiterId, recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM company_post_views WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?)', recruiterId, recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM post_likes WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?)', recruiterId, recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM post_comment_likes WHERE comment_id IN (SELECT id FROM post_comments WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?))', recruiterId, recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM post_comments WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?)', recruiterId, recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM company_post_media WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?)', recruiterId, recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM company_posts WHERE recruiter_id = ? OR company_id = ?', recruiterId, recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM company_followers WHERE company_id = ?', recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM company_network WHERE company_id = ?', recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM saved_companies WHERE company_id = ?', recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM favourite_companies WHERE company_id = ?', recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM support_tickets WHERE recruiter_id = ?', recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM job_views WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = ?)', recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM job_recommendation_emails WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = ?)', recruiterId);
  await tx.$executeRawUnsafe('DELETE FROM reset_tokens WHERE user_id = ? AND user_type = ?', recruiterId, 'RECRUITER');
};

const normalizeVerificationDocumentStatus = (value) => {
  const normalized = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

  if (!normalized) return undefined;
  if (normalized === 'PENDING') return 'PENDING';
  if (normalized === 'VERIFIED' || normalized === 'APPROVED') return 'APPROVED';
  if (normalized === 'REJECTED') return 'REJECTED';

  return undefined;
};

const buildRecruiterApprovalEmail = ({ name, company }) => `
  <div style="background:#f4f6fb;padding:32px 16px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:24px;text-align:center;color:#fff;">
        <h1 style="margin:0;font-size:24px;">Recruiter Account Approved</h1>
        <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">TrueHire Recruiter Portal</p>
      </div>
      <div style="padding:28px;color:#1f2937;">
        <p style="margin:0 0 12px;font-size:16px;">Hi ${name || 'Recruiter'},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          Your recruiter account${company ? ` for <strong>${company}</strong>` : ''} has been approved.
          You can now log in and access the platform.
        </p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${env.frontendUrl}/login" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#16a34a;color:#fff;text-decoration:none;font-weight:600;">
            Log in to TrueHire
          </a>
        </div>
        <p style="margin:0;font-size:13px;color:#6b7280;">If you have any questions, reply to this email and our team will help.</p>
      </div>
      <div style="border-top:1px solid #e5e7eb;padding:16px;text-align:center;font-size:12px;color:#94a3b8;background:#f9fafb;">
        &copy; ${new Date().getFullYear()} TrueHire. All rights reserved.
      </div>
    </div>
  </div>
`;

const parseBigIntId = (value) => {
  try {
    return BigInt(String(value));
  } catch (_error) {
    return null;
  }
};

const normalizeDedupeText = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const dedupeByKey = (items, getKey) => {
  const seen = new Set();
  const uniqueItems = [];

  for (const item of items || []) {
    const key = getKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
};

const dedupeUsers = (users = []) =>
  dedupeByKey(users, (user) =>
    normalizeDedupeText(user.name)
      ? `${normalizeDedupeText(user.name)}|${normalizeDedupeText(user.role)}`
      : normalizeDedupeText(user.email),
  );

const dedupeRecruiters = (recruiters = []) =>
  dedupeByKey(recruiters, (recruiter) =>
    normalizeDedupeText(recruiter.email) ||
    `${normalizeDedupeText(recruiter.name)}|${normalizeDedupeText(recruiter.company_name || recruiter.company)}`,
  );

router.get(
  '/dashboard/stats',
  asyncHandler(async (_req, res) => {
    const [totalUsers, totalRecruiters, totalJobs, totalApplications, recentUsers, recentRecruiters] =
      await Promise.all([
        prisma.users.count(),
        prisma.recruiters.count(),
        prisma.jobs.count(),
        prisma.job_applications.count(),
        prisma.users.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: 5,
        }),
        prisma.recruiters.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: 5,
        }),
      ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalRecruiters,
        totalJobs,
        totalApplications,
      },
      recentUsers: dedupeUsers(recentUsers).slice(0, 5).map((user) => ({
        ...user,
        id: String(user.id),
        role: String(user.role || '').toLowerCase(),
      })),
      recentRecruiters: dedupeRecruiters(recentRecruiters).slice(0, 5).map((recruiter) => ({
        ...recruiter,
        id: String(recruiter.id),
      })),
    });
  }),
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const search = String(req.query.search || '').trim();
    const role = String(req.query.role || '').trim().toUpperCase();
    const status = String(req.query.status || '').trim().toUpperCase();

    const where = {
      ...(search
        ? {
            OR: [
              { name: containsFilter(search) },
              { email: containsFilter(search) },
            ],
          }
        : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    };

    const fetchTake = Math.min(limit * 5, 500);
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          email_verified: true,
          created_at: true,
          profile_complete: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: fetchTake,
      }),
      prisma.users.count({ where }),
    ]);
    const uniqueUsers = dedupeUsers(users).slice(0, limit);

    res.json({
      success: true,
      users: uniqueUsers.map((user) => ({
        ...user,
        id: String(user.id),
        role: String(user.role || '').toLowerCase(),
        status: String(user.status || '').toLowerCase(),
      })),
      pagination: buildPagination(page, limit, total),
    });
  }),
);

router.get(
  '/recruiters',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim().toUpperCase();
    const location = String(req.query.location || '').trim();

    const where = {
      ...(search
        ? {
            OR: [
              { name: containsFilter(search) },
              { email: containsFilter(search) },
              { company: containsFilter(search) },
              { company_name: containsFilter(search) },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(location ? { headquarters_location: containsFilter(location) } : {}),
    };

    const fetchTake = Math.min(limit * 5, 500);
    const [recruiters, total] = await Promise.all([
      prisma.recruiters.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          company_name: true,
          role: true,
          status: true,
          approval_status: true,
          created_at: true,
          phone_number: true,
          headquarters_location: true,
          profile_complete: true,
          company_profile_complete: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: fetchTake,
      }),
      prisma.recruiters.count({ where }),
    ]);
    const uniqueRecruiters = dedupeRecruiters(recruiters).slice(0, limit);

    res.json({
      success: true,
      recruiters: uniqueRecruiters.map((recruiter) => ({
        ...recruiter,
        id: String(recruiter.id),
        role: String(recruiter.role || '').toLowerCase(),
        status: String(recruiter.status || '').toLowerCase(),
        approval_status: String(recruiter.approval_status || '').toUpperCase(),
      })),
      pagination: buildPagination(page, limit, total),
    });
  }),
);

router.get(
  '/recruiter-approvals',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const search = String(req.query.search || '').trim();
    const status = normalizeRecruiterApprovalStatus(req.query.status || 'PENDING');

    const where = {
      ...(search
        ? {
            OR: [
              { name: containsFilter(search) },
              { email: containsFilter(search) },
              { company: containsFilter(search) },
              { company_name: containsFilter(search) },
            ],
          }
        : {}),
      ...(status ? { approval_status: status } : {}),
    };

    const [recruiters, total] = await Promise.all([
      prisma.recruiters.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          official_email: true,
          company: true,
          company_name: true,
          approval_status: true,
          approval_rejection_reason: true,
          created_at: true,
          recruiter_verification_documents: {
            select: {
              id: true,
              doc_type: true,
              file_path: true,
              status: true,
              rejection_reason: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.recruiters.count({ where }),
    ]);

    res.json({
      success: true,
      recruiters: recruiters.map((recruiter) => {
        const { recruiter_verification_documents, ...safeRecruiter } = recruiter;

        return {
        ...safeRecruiter,
        id: String(recruiter.id),
        approval_status: toTitleCase(recruiter.approval_status || 'PENDING'),
        documents: (recruiter_verification_documents || []).map((doc) => ({
          ...doc,
          id: String(doc.id),
          status: toTitleCase(doc.status || 'PENDING'),
        })),
      };
      }),
      pagination: buildPagination(page, limit, total),
    });
  }),
);

router.put(
  '/recruiters/:id/approval',
  asyncHandler(async (req, res) => {
    const recruiterId = parseBigIntId(req.params.id);
    const status = normalizeRecruiterApprovalStatus(req.body?.status);
    const rejectionReason = String(req.body?.reason || '').trim() || null;
    const reviewedBy = parseBigIntId(req.auth?.sub);

    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recruiter id',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status',
      });
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const recruiter = await prisma.recruiters.findUnique({
      where: { id: recruiterId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        company_name: true,
        approval_status: true,
      },
    });

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found',
      });
    }

    const now = new Date();
    const documentStatus = normalizeVerificationDocumentStatus(status);

    await prisma.$transaction([
      prisma.recruiters.update({
        where: { id: recruiterId },
        data: {
          approval_status: status,
          approval_rejection_reason: status === 'REJECTED' ? rejectionReason : null,
          approval_reviewed_at: now,
          approval_reviewed_by: reviewedBy,
        },
      }),
      prisma.recruiter_verification_documents.updateMany({
        where: { recruiter_id: recruiterId },
        data: {
          status: documentStatus,
          rejection_reason: status === 'REJECTED' ? rejectionReason : null,
          reviewed_at: now,
        },
      }),
    ]);

    const shouldSendApprovalEmail =
      status === 'APPROVED' && String(recruiter.approval_status || '').toUpperCase() !== 'APPROVED';

    if (shouldSendApprovalEmail && recruiter.email) {
      try {
        await sendEmail({
          to: recruiter.email,
          subject: 'Your TrueHire recruiter account is approved',
          html: buildRecruiterApprovalEmail({
            name: recruiter.name,
            company: recruiter.company_name || recruiter.company || '',
          }),
        });
      } catch (emailError) {
        console.error('Recruiter approval email failed:', emailError?.message || emailError);
      }
    }

    res.json({
      success: true,
      message: `Recruiter ${toTitleCase(status).toLowerCase()} successfully`,
      recruiterId: String(recruiter.id),
      status: toTitleCase(status),
    });
  }),
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const userId = parseBigIntId(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await prisma.$transaction(async (tx) => {
      const numericUserId = Number(userId);
      const [jobApplications, applications] = await Promise.all([
        tx.job_applications.findMany({
          where: { user_id: userId },
          select: { id: true, job_id: true },
        }),
        tx.applications.findMany({
          where: { user_id: userId },
          select: { id: true },
        }),
      ]);

      const jobApplicationIds = jobApplications.map((application) => application.id);
      const applicationIds = applications.map((application) => application.id);
      const jobIds = [...new Set(jobApplications.map((application) => application.job_id))];

      const conversations =
        jobApplicationIds.length || applicationIds.length
          ? await tx.application_conversations.findMany({
              where: {
                OR: [
                  { user_id: userId },
                  ...(jobApplicationIds.length ? [{ application_id: { in: jobApplicationIds } }] : []),
                ],
              },
              select: { id: true },
            })
          : [];

      const conversationIds = conversations.map((conversation) => conversation.id);

      const messages =
        jobApplicationIds.length || conversationIds.length || jobIds.length
          ? await tx.application_messages.findMany({
              where: {
                OR: [
                  ...(jobApplicationIds.length ? [{ application_id: { in: jobApplicationIds } }] : []),
                  ...(conversationIds.length ? [{ conversation_id: { in: conversationIds } }] : []),
                  ...(jobIds.length ? [{ job_id: { in: jobIds } }] : []),
                ],
              },
              select: { id: true },
            })
          : [];

      const messageIds = messages.map((message) => message.id);

      if (messageIds.length) {
        await tx.application_message_attachments.deleteMany({
          where: { message_id: { in: messageIds } },
        });
      }

      if (messages.length) {
        await tx.application_messages.deleteMany({
          where: { id: { in: messageIds } },
        });
      }

      if (conversationIds.length) {
        await tx.application_conversations.deleteMany({
          where: { id: { in: conversationIds } },
        });
      }

      if (applicationIds.length) {
        await tx.user_notifications.deleteMany({
          where: { application_id: { in: applicationIds } },
        });

        await tx.recruiter_notifications.deleteMany({
          where: { application_id: { in: applicationIds } },
        });
      }

      await Promise.all([
        tx.user_notifications.deleteMany({ where: { user_id: userId } }),
        tx.introduction_videos.deleteMany({ where: { user_id: userId } }),
        tx.resumes.deleteMany({ where: { user_id: userId } }),
        tx.company_ratings.deleteMany({ where: { user_id: userId } }),
        tx.saved_jobs.deleteMany({ where: { user_id: userId } }),
        tx.saved_companies.deleteMany({ where: { user_id: userId } }),
        tx.favourite_companies.deleteMany({ where: { user_id: userId } }),
        tx.user_connections.deleteMany({
          where: {
            OR: [{ sender_id: userId }, { receiver_id: userId }],
          },
        }),
        tx.user_direct_messages.deleteMany({
          where: {
            OR: [{ sender_id: userId }, { receiver_id: userId }],
          },
        }),
        tx.reset_tokens.deleteMany({ where: { user_id: userId } }),
        ...(Number.isSafeInteger(numericUserId)
          ? [tx.user_reviews.deleteMany({ where: { user_id: numericUserId } })]
          : []),
      ]);

      if (applicationIds.length) {
        await tx.applications.deleteMany({
          where: { id: { in: applicationIds } },
        });
      }

      if (jobApplicationIds.length) {
        await tx.job_applications.deleteMany({
          where: { id: { in: jobApplicationIds } },
        });
      }

      if (jobIds.length) {
        await Promise.all(
          jobIds.map((jobId) =>
            tx.jobs.update({
              where: { id: jobId },
              data: {
                applications_count: {
                  decrement: jobApplications.filter((application) => application.job_id === jobId).length,
                },
              },
            }),
          ),
        );
      }

      await Promise.all([
        tx.certifications.deleteMany({ where: { user_id: userId } }),
        tx.projects.deleteMany({ where: { user_id: userId } }),
      ]);

      await cleanupUserOwnedSocialData(tx, userId);

      await tx.users.delete({
        where: { id: userId },
      });
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedId: String(user.id),
    });
  }),
);

router.get(
  '/jobs',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const keyword = String(req.query.keyword || '').trim();
    const company = String(req.query.company || '').trim();
    const location = String(req.query.location || '').trim();
    const status = String(req.query.status || '').trim().toUpperCase();

    const where = {
      ...(keyword ? { title: containsFilter(keyword) } : {}),
      ...(company ? { company: containsFilter(company) } : {}),
      ...(location ? { location: containsFilter(location) } : {}),
      ...(status ? { status } : {}),
    };

    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        where,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          status: true,
          employment_type: true,
          created_at: true,
          recruiter_id: true,
          applications_count: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobs.count({ where }),
    ]);

    res.json({
      success: true,
      jobs: jobs.map((job) => ({
        ...job,
        id: String(job.id),
        recruiter_id: job.recruiter_id ? String(job.recruiter_id) : null,
        status: String(job.status || '').toLowerCase(),
      })),
      pagination: buildPagination(page, limit, total),
    });
  }),
);

router.get(
  '/applications',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const status = String(req.query.status || '').trim().toUpperCase();

    const where = {
      ...(status ? { status } : {}),
    };

    const [applications, total] = await Promise.all([
      prisma.job_applications.findMany({
        where,
        select: {
          id: true,
          user_id: true,
          job_id: true,
          status: true,
          applied_at: true,
          updated_at: true,
          users: {
            select: {
              name: true,
              email: true,
            },
          },
          jobs: {
            select: {
              title: true,
              company: true,
              recruiters: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { applied_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.job_applications.count({ where }),
    ]);

    res.json({
      success: true,
      applications: applications.map((application) => ({
        ...application,
        id: String(application.id),
        user_id: String(application.user_id),
        job_id: String(application.job_id),
        status: String(application.status || '').toLowerCase(),
        job_title: application.jobs?.title || '',
        company: application.jobs?.company || '',
        user_name: application.users?.name || '',
        user_email: application.users?.email || '',
        recruiter_name: application.jobs?.recruiters?.name || '',
      })),
      pagination: buildPagination(page, limit, total),
    });
  }),
);

router.get(
  '/admins',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);

    const [admins, total] = await Promise.all([
      prisma.admins.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.admins.count(),
    ]);

    res.json({
      success: true,
      admins: admins.map((admin) => ({
        ...admin,
        id: String(admin.id),
        role: String(admin.role || '').toLowerCase(),
      })),
      pagination: buildPagination(page, limit, total),
    });
  }),
);

router.get(
  '/super-admins',
  asyncHandler(async (req, res) => {
    await ensureSuperAdminRoleColumn();

    const { page, limit, skip } = parsePagination(req.query);

    const [superAdmins, total] = await Promise.all([
      prisma.$queryRaw`
        SELECT id, name, email, role, status, created_at, updated_at
        FROM super_admins
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      prisma.super_admins.count(),
    ]);

    res.json({
      success: true,
      superAdmins: superAdmins.map((admin) => ({
        ...admin,
        id: String(admin.id),
        role: String(admin.role || 'SUPER_ADMIN').toLowerCase(),
        status: String(admin.status || '').toLowerCase(),
      })),
      pagination: buildPagination(page, limit, total),
    });
  }),
);

router.get(
  '/super-admin-count',
  asyncHandler(async (_req, res) => {
    const count = await prisma.super_admins.count();

    res.json({
      success: true,
      count,
    });
  }),
);

router.post(
  '/create-super-admin',
  asyncHandler(async (req, res) => {
    await ensureSuperAdminRoleColumn();

    const name = String(req.body?.fullName || req.body?.name || '').trim();
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, password, and confirm password are required',
      });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirm password do not match',
      });
    }

    const currentCount = await prisma.super_admins.count();
    if (currentCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Maximum number of Super Admin accounts reached',
      });
    }

    const [existingSuperAdmin, existingAdmin, existingUser] = await Promise.all([
      prisma.super_admins.findUnique({
        where: { email },
        select: { id: true },
      }),
      prisma.admins.findUnique({
        where: { email },
        select: { id: true },
      }),
      prisma.users.findUnique({
        where: { email },
        select: { id: true },
      }),
    ]);

    if (existingSuperAdmin || existingAdmin || existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const hashedPassword = await hashPassword(password);
    console.log('[admin-auth] SUPER_ADMIN create password hashed', {
      email,
      hashPrefix: hashedPassword.slice(0, 7),
      hashLength: hashedPassword.length,
    });

    await prisma.$executeRaw`
      INSERT INTO super_admins (name, email, password, role, created_at, updated_at)
      VALUES (${name}, ${email}, ${hashedPassword}, 'SUPER_ADMIN', NOW(), NOW())
    `;

    const superAdmin = await prisma.$queryRaw`
      SELECT id, name, email, role, status, created_at
      FROM super_admins
      WHERE email = ${email}
      LIMIT 1
    `;

    const createdSuperAdmin = superAdmin[0];
    console.log('[admin-auth] SUPER_ADMIN stored in DB', {
      id: createdSuperAdmin ? String(createdSuperAdmin.id) : null,
      email: createdSuperAdmin?.email || null,
      role: createdSuperAdmin?.role || null,
      created: Boolean(createdSuperAdmin),
    });

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      superAdmin: {
        ...createdSuperAdmin,
        id: String(createdSuperAdmin.id),
        fullName: createdSuperAdmin.name,
        role: String(createdSuperAdmin.role || 'SUPER_ADMIN').toLowerCase(),
        status: String(createdSuperAdmin.status || '').toLowerCase(),
      },
    });
  }),
);

router.delete(
  '/recruiters/:id',
  asyncHandler(async (req, res) => {
    const recruiterId = parseBigIntId(req.params.id);

    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recruiter id',
      });
    }

    const recruiter = await prisma.recruiters.findUnique({
      where: { id: recruiterId },
      select: { id: true, name: true },
    });

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found',
      });
    }

    await prisma.$transaction(async (tx) => {
      const jobs = await tx.jobs.findMany({
        where: { recruiter_id: recruiterId },
        select: { id: true },
      });

      const jobIds = jobs.map((job) => job.id);

      const [jobApplications, applications] = await Promise.all([
        jobIds.length
          ? tx.job_applications.findMany({
              where: { job_id: { in: jobIds } },
              select: { id: true },
            })
          : Promise.resolve([]),
        jobIds.length
          ? tx.applications.findMany({
              where: { job_id: { in: jobIds } },
              select: { id: true },
            })
          : Promise.resolve([]),
      ]);

      const jobApplicationIds = jobApplications.map((application) => application.id);
      const applicationIds = applications.map((application) => application.id);

      const conversations = jobIds.length
        ? await tx.application_conversations.findMany({
            where: {
              OR: [
                { recruiter_id: recruiterId },
                { job_id: { in: jobIds } },
                ...(jobApplicationIds.length ? [{ application_id: { in: jobApplicationIds } }] : []),
              ],
            },
            select: { id: true },
          })
        : [];

      const conversationIds = conversations.map((conversation) => conversation.id);

      const messages =
        jobIds.length || conversationIds.length || jobApplicationIds.length
          ? await tx.application_messages.findMany({
              where: {
                OR: [
                  ...(jobIds.length ? [{ job_id: { in: jobIds } }] : []),
                  ...(conversationIds.length ? [{ conversation_id: { in: conversationIds } }] : []),
                  ...(jobApplicationIds.length ? [{ application_id: { in: jobApplicationIds } }] : []),
                ],
              },
              select: { id: true },
            })
          : [];

      const messageIds = messages.map((message) => message.id);

      if (messageIds.length) {
        await tx.application_message_attachments.deleteMany({
          where: { message_id: { in: messageIds } },
        });
      }

      if (messages.length) {
        await tx.application_messages.deleteMany({
          where: { id: { in: messageIds } },
        });
      }

      if (conversationIds.length) {
        await tx.application_conversations.deleteMany({
          where: { id: { in: conversationIds } },
        });
      }

      if (jobIds.length) {
        await tx.introduction_videos.deleteMany({
          where: {
            OR: [
              { recruiter_id: recruiterId },
              { job_id: { in: jobIds } },
              ...(jobApplicationIds.length ? [{ application_id: { in: jobApplicationIds } }] : []),
            ],
          },
        });

        await tx.saved_jobs.deleteMany({
          where: { job_id: { in: jobIds } },
        });
      }

      if (applicationIds.length) {
        await tx.user_notifications.deleteMany({
          where: { application_id: { in: applicationIds } },
        });

        await tx.recruiter_notifications.deleteMany({
          where: {
            OR: [
              { recruiter_id: recruiterId },
              { application_id: { in: applicationIds } },
            ],
          },
        });
      } else {
        await tx.recruiter_notifications.deleteMany({
          where: { recruiter_id: recruiterId },
        });
      }

      if (applicationIds.length) {
        await tx.applications.deleteMany({
          where: { id: { in: applicationIds } },
        });
      }

      if (jobApplicationIds.length) {
        await tx.job_applications.deleteMany({
          where: { id: { in: jobApplicationIds } },
        });
      }

      await Promise.all([
        tx.recruiter_activity_logs.deleteMany({ where: { recruiter_id: recruiterId } }),
        tx.recruiter_subscriptions.deleteMany({ where: { recruiter_id: recruiterId } }),
        tx.recruiter_verification_documents.deleteMany({ where: { recruiter_id: recruiterId } }),
        tx.payments.deleteMany({ where: { recruiter_id: recruiterId } }),
        tx.company_ratings.deleteMany({ where: { company_id: recruiterId } }),
        tx.companies.deleteMany({ where: { recruiter_id: recruiterId } }),
        tx.sub_recruiters.deleteMany({ where: { recruiter_id: recruiterId } }),
      ]);

      await cleanupRecruiterOwnedSocialData(tx, recruiterId);

      if (jobIds.length) {
        await tx.jobs.deleteMany({
          where: { id: { in: jobIds } },
        });
      }

      await tx.recruiters.delete({
        where: { id: recruiterId },
      });
    });

    res.json({
      success: true,
      message: 'Recruiter deleted successfully',
      deletedId: String(recruiter.id),
    });
  }),
);

router.delete(
  '/super-admins/:id',
  asyncHandler(async (req, res) => {
    const superAdminId = parseBigIntId(req.params.id);

    if (!superAdminId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid super admin id',
      });
    }

    const existingSuperAdmin = await prisma.super_admins.findUnique({
      where: { id: superAdminId },
      select: { id: true, name: true },
    });

    if (!existingSuperAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super admin not found',
      });
    }

    await prisma.super_admins.delete({
      where: { id: superAdminId },
    });

    res.json({
      success: true,
      message: 'Super admin deleted successfully',
      deletedId: String(existingSuperAdmin.id),
    });
  }),
);

export default router;
