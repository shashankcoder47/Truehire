import { Router } from 'express';
import multer from 'multer';
import { pool, prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { persistUploadedFiles } from '../utils/upload.js';
import {
  getOrCreateDirectConversation,
  getOrCreateCompanyDirectConversation,
  listDirectConversations,
  listDirectMessages,
  markDirectMessagesRead,
  sendDirectMessage,
  updateDirectMessage,
  deleteDirectMessage,
} from '../services/directMessageService.js';
import { createDirectMessageNotification } from '../services/notificationService.js';

const router = Router();

const ROLE = {
  USER: 'USER',
  RECRUITER: 'RECRUITER',
};

const attachmentStorage = multer.memoryStorage();

const allowedAttachmentMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedAttachmentMimeTypes.has(file.mimetype)) {
      callback(new Error('Only PDF, DOC, DOCX, PNG, or JPG files are allowed.'));
      return;
    }

    callback(null, true);
  },
});

const getRoleFromAuth = (req) => {
  const role = String(req.auth?.role || '').toUpperCase();
  return role === ROLE.RECRUITER ? ROLE.RECRUITER : role === ROLE.USER ? ROLE.USER : null;
};

const ensureUserActor = (req, res) => {
  if (getRoleFromAuth(req) !== ROLE.USER) {
    res.status(403).json({ message: 'User messaging is available only to user accounts' });
    return false;
  }
  return true;
};

const ensureDirectActor = (req, res) => {
  const role = getRoleFromAuth(req);
  if (![ROLE.USER, ROLE.RECRUITER].includes(role)) {
    res.status(403).json({ message: 'Direct messaging is available only to user and recruiter accounts' });
    return null;
  }
  return role;
};

const normalizePositiveId = (value, label) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { error: `Invalid ${label}` };
  }
  return { value: parsed };
};

const getCompanyMessageEligibility = async (userId, companyId) => {
  const [[companyRows], [followRows], [accessRows]] = await Promise.all([
    pool.execute(
      'SELECT id, company, company_name, name FROM recruiters WHERE id = ? LIMIT 1',
      [companyId],
    ),
    pool.execute(
      'SELECT id FROM company_followers WHERE user_id = ? AND company_id = ? LIMIT 1',
      [userId, companyId],
    ),
    pool.execute(
      `SELECT id, status, expires_at
       FROM user_company_message_access
       WHERE user_id = ? AND recruiter_id = ?
       LIMIT 1`,
      [userId, companyId],
    ),
  ]);

  const access = accessRows[0] || null;
  const expiresAt = access?.expires_at ? new Date(access.expires_at) : null;
  return {
    company: companyRows[0] || null,
    isFollowing: followRows.length > 0,
    hasAccess: Boolean(access)
      && String(access.status || '').toUpperCase() === 'ACTIVE'
      && (!expiresAt || expiresAt > new Date()),
    expiresAt,
  };
};

router.post(
  '/conversation/:userId',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!ensureUserActor(req, res)) return;
    const conversation = await getOrCreateDirectConversation(req.auth.sub, req.params.userId);
    res.status(201).json({ success: true, conversationId: String(conversation.id) });
  }),
);

router.post(
  '/company/:companyId/conversation',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!ensureUserActor(req, res)) return;

    const parsedCompanyId = normalizePositiveId(req.params.companyId, 'company id');
    if (parsedCompanyId.error) return res.status(400).json({ message: parsedCompanyId.error });

    const userId = Number(req.auth.sub);
    const eligibility = await getCompanyMessageEligibility(userId, parsedCompanyId.value);

    if (!eligibility.company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!eligibility.isFollowing) {
      return res.status(403).json({ message: 'Follow this company before messaging the recruiter' });
    }

    if (!eligibility.hasAccess) {
      return res.status(402).json({
        message: 'Premium subscription is required to message this recruiter',
        requiresPayment: true,
      });
    }

    const conversation = await getOrCreateCompanyDirectConversation(userId, parsedCompanyId.value);
    res.status(201).json({ success: true, conversationId: String(conversation.id) });
  }),
);

router.get(
  '/direct/:conversationId',
  authenticate,
  asyncHandler(async (req, res) => {
    const actorType = ensureDirectActor(req, res);
    if (!actorType) return;
    const messages = await listDirectMessages(req.params.conversationId, req.auth.sub, actorType);
    res.json({ success: true, messages });
  }),
);

router.post(
  '/direct/:conversationId',
  authenticate,
  asyncHandler(async (req, res) => {
    const actorType = ensureDirectActor(req, res);
    if (!actorType) return;
    const message = await sendDirectMessage({
      conversationId: req.params.conversationId,
      senderId: req.auth.sub,
      senderType: actorType,
      message: req.body.message,
      replyToMessageId: req.body.replyToMessageId,
    });
    const sender = actorType === ROLE.RECRUITER
      ? await prisma.recruiters.findUnique({
          where: { id: BigInt(req.auth.sub) },
          select: { name: true, company: true, company_name: true },
        })
      : await prisma.users.findUnique({
          where: { id: BigInt(req.auth.sub) },
          select: { name: true },
        });
    if (message.receiverType === 'user') {
      await createDirectMessageNotification({
        receiverId: message.receiverId,
        senderId: req.auth.sub,
        senderName: sender?.company_name || sender?.company || sender?.name,
        conversationId: req.params.conversationId,
      });
    }
    res.status(201).json({ success: true, message });
  }),
);

router.patch(
  '/direct/:conversationId/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const actorType = ensureDirectActor(req, res);
    if (!actorType) return;
    const readCount = await markDirectMessagesRead(req.params.conversationId, req.auth.sub, actorType);
    res.json({ success: true, readCount });
  }),
);

router.patch(
  '/direct/:conversationId/:messageId',
  authenticate,
  asyncHandler(async (req, res) => {
    const actorType = ensureDirectActor(req, res);
    if (!actorType) return;
    const message = await updateDirectMessage({
      conversationId: req.params.conversationId,
      messageId: req.params.messageId,
      userId: req.auth.sub,
      actorType,
      message: req.body.message,
    });
    res.json({ success: true, message });
  }),
);

router.delete(
  '/direct/:conversationId/:messageId',
  authenticate,
  asyncHandler(async (req, res) => {
    const actorType = ensureDirectActor(req, res);
    if (!actorType) return;
    await deleteDirectMessage({
      conversationId: req.params.conversationId,
      messageId: req.params.messageId,
      userId: req.auth.sub,
      actorType,
    });
    res.json({ success: true });
  }),
);

const normalizeRoleForResponse = (role) => String(role || '').toLowerCase();

const normalizeReadStatus = (value) => (value ? 'read' : 'sent');

const buildApplicationSummary = (row) => ({
  applicationId: Number(row.applicationId),
  jobId: Number(row.jobId),
  recruiterId: Number(row.recruiterId),
  userId: Number(row.userId),
  applicationStatus: row.applicationStatus || 'APPLIED',
  recruiterName: row.recruiterName || 'Recruiter',
  recruiterEmail: row.recruiterEmail || null,
  userName: row.userName || 'Candidate',
  userEmail: row.userEmail || null,
  jobTitle: row.jobTitle || 'Job',
  jobCompany: row.jobCompany || 'Company',
  jobLocation: row.jobLocation || 'Remote',
  applicationResumePath: row.applicationResumePath || null,
  userResumeFile: row.userResumeFile || null,
  userCoreSkills: row.userCoreSkills || null,
  userExperienceYears: row.userExperienceYears != null ? Number(row.userExperienceYears) : null,
  userExperienceMonths: row.userExperienceMonths != null ? Number(row.userExperienceMonths) : null,
  applicationExperienceLevel: row.applicationExperienceLevel || null,
});

const fetchApplicationContext = async (applicationId) => {
  const rows = await prisma.$queryRaw`
    SELECT
      ja.id AS applicationId,
      ja.job_id AS jobId,
      ja.user_id AS userId,
      ja.status AS applicationStatus,
      j.recruiter_id AS recruiterId,
      j.title AS jobTitle,
      j.company AS jobCompany,
      j.location AS jobLocation,
      r.name AS recruiterName,
      r.email AS recruiterEmail,
      u.name AS userName,
      u.email AS userEmail,
      a.resume_path AS applicationResumePath,
      u.resume_file AS userResumeFile,
      u.core_skills AS userCoreSkills,
      u.total_experience_years AS userExperienceYears,
      u.total_experience_months AS userExperienceMonths,
      a.experience_level AS applicationExperienceLevel
    FROM job_applications ja
    JOIN jobs j ON j.id = ja.job_id
    JOIN recruiters r ON r.id = j.recruiter_id
    JOIN users u ON u.id = ja.user_id
    LEFT JOIN applications a ON a.job_id = ja.job_id AND a.user_id = ja.user_id
    WHERE ja.id = ${BigInt(applicationId)}
    LIMIT 1
  `;

  return rows[0] ? buildApplicationSummary(rows[0]) : null;
};

const ensureMessageAccess = (req, application) => {
  const role = getRoleFromAuth(req);
  if (!role) {
    return { ok: false, status: 403, message: 'Access denied' };
  }

  const actorId = Number(req.auth.sub);

  if (role === ROLE.USER && Number(application.userId) !== actorId) {
    return { ok: false, status: 403, message: 'Access denied' };
  }

  if (role === ROLE.RECRUITER && Number(application.recruiterId) !== actorId) {
    return { ok: false, status: 403, message: 'Access denied' };
  }

  return { ok: true, role };
};

const getUnreadCountForConversation = async (applicationId, receiverId, receiverRole) => {
  return prisma.application_messages.count({
    where: {
      application_id: BigInt(applicationId),
      receiver_id: BigInt(receiverId),
      receiver_role: receiverRole,
      read_status: false,
    },
  });
};

router.get(
  '/conversations',
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.query.type === 'direct') {
      const actorType = ensureDirectActor(req, res);
      if (!actorType) return;
      const conversations = await listDirectConversations(req.auth.sub, actorType);
      const totalUnread = conversations.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0);
      return res.json({ success: true, conversations, totalUnread });
    }
    const role = getRoleFromAuth(req);

    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const actorId = BigInt(req.auth.sub);
    const conversations = await prisma.application_conversations.findMany({
      where: role === ROLE.USER ? { user_id: actorId } : { recruiter_id: actorId },
      orderBy: [
        { last_message_at: 'desc' },
        { updated_at: 'desc' },
      ],
      select: {
        id: true,
        application_id: true,
        job_id: true,
        recruiter_id: true,
        user_id: true,
        last_message_at: true,
        updated_at: true,
        job_applications: {
          select: {
            status: true,
          },
        },
        jobs: {
          select: {
            title: true,
            company: true,
            location: true,
          },
        },
        users: {
          select: {
            name: true,
          },
        },
        recruiters: {
          select: {
            name: true,
          },
        },
        application_messages: {
          orderBy: [
            { created_at: 'desc' },
            { id: 'desc' },
          ],
          take: 1,
          select: {
            message: true,
            sender_role: true,
          },
        },
      },
    });

    const normalizedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await getUnreadCountForConversation(
          conversation.application_id,
          actorId,
          role,
        );
        const lastMessage = conversation.application_messages?.[0] || null;

        return {
          conversationId: Number(conversation.id),
          applicationId: Number(conversation.application_id),
          jobId: Number(conversation.job_id),
          userId: Number(conversation.user_id),
          recruiterId: Number(conversation.recruiter_id),
          lastMessageAt: conversation.last_message_at,
          lastMessage: lastMessage?.message || '',
          lastSenderRole: normalizeRoleForResponse(lastMessage?.sender_role),
          applicationStatus: conversation.job_applications?.status || 'APPLIED',
          jobTitle: conversation.jobs?.title || 'Job',
          jobCompany: conversation.jobs?.company || 'Company',
          jobLocation: conversation.jobs?.location || 'Remote',
          userName: conversation.users?.name || 'Candidate',
          recruiterName: conversation.recruiters?.name || 'Recruiter',
          unreadCount,
        };
      }),
    );

    const totalUnread = normalizedConversations.reduce(
      (sum, item) => sum + Number(item.unreadCount || 0),
      0,
    );

    res.json({
      success: true,
      conversations: normalizedConversations,
      totalUnread,
    });
  }),
);

router.get(
  '/conversations/:applicationId',
  authenticate,
  asyncHandler(async (req, res) => {
    const applicationId = Number(req.params.applicationId);

    if (!Number.isFinite(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await fetchApplicationContext(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const conversation = await prisma.application_conversations.findFirst({
      where: {
        application_id: BigInt(applicationId),
      },
      select: {
        id: true,
        application_id: true,
        job_id: true,
        recruiter_id: true,
        user_id: true,
        last_message_id: true,
        last_message_at: true,
        recruiter_notes: true,
        user_last_seen_message_id: true,
        user_seen_at: true,
        recruiter_last_seen_message_id: true,
        recruiter_seen_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    const messages = await prisma.application_messages.findMany({
      where: {
        application_id: BigInt(applicationId),
      },
      orderBy: [
        { created_at: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        conversation_id: true,
        application_id: true,
        job_id: true,
        sender_id: true,
        sender_role: true,
        receiver_id: true,
        receiver_role: true,
        message: true,
        read_status: true,
        read_at: true,
        is_pinned: true,
        pinned_at: true,
        pinned_by_role: true,
        pinned_by_id: true,
        created_at: true,
        application_message_attachments: {
          orderBy: {
            created_at: 'asc',
          },
          select: {
            id: true,
            file_path: true,
            file_name: true,
            file_type: true,
            file_size: true,
            created_at: true,
          },
        },
      },
    });

    res.json({
      success: true,
      conversation: conversation
        ? {
            ...conversation,
            id: Number(conversation.id),
            application_id: Number(conversation.application_id),
            job_id: Number(conversation.job_id),
            recruiter_id: Number(conversation.recruiter_id),
            user_id: Number(conversation.user_id),
            last_message_id: conversation.last_message_id != null ? Number(conversation.last_message_id) : null,
            user_last_seen_message_id:
              conversation.user_last_seen_message_id != null
                ? Number(conversation.user_last_seen_message_id)
                : null,
            recruiter_last_seen_message_id:
              conversation.recruiter_last_seen_message_id != null
                ? Number(conversation.recruiter_last_seen_message_id)
                : null,
          }
        : null,
      application,
      messages: messages.map((message) => ({
        id: Number(message.id),
        conversationId: Number(message.conversation_id),
        applicationId: Number(message.application_id),
        jobId: Number(message.job_id),
        senderId: Number(message.sender_id),
        senderRole: normalizeRoleForResponse(message.sender_role),
        receiverId: Number(message.receiver_id),
        receiverRole: normalizeRoleForResponse(message.receiver_role),
        message: message.message,
        readStatus: normalizeReadStatus(Boolean(message.read_status)),
        readAt: message.read_at,
        isPinned: Boolean(message.is_pinned),
        pinnedAt: message.pinned_at,
        pinnedByRole: normalizeRoleForResponse(message.pinned_by_role),
        pinnedById: message.pinned_by_id != null ? Number(message.pinned_by_id) : null,
        createdAt: message.created_at,
        attachments: message.application_message_attachments.map((attachment) => ({
          id: Number(attachment.id),
          filePath: attachment.file_path,
          fileName: attachment.file_name,
          fileType: attachment.file_type,
          fileSize: attachment.file_size != null ? Number(attachment.file_size) : null,
          createdAt: attachment.created_at,
        })),
      })),
    });
  }),
);

router.post(
  '/conversations/:applicationId/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const applicationId = Number(req.params.applicationId);

    if (!Number.isFinite(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await fetchApplicationContext(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const receiverId = BigInt(req.auth.sub);
    const receiverRole = access.role;

    const conversation = await prisma.application_conversations.findFirst({
      where: {
        application_id: BigInt(applicationId),
      },
      select: {
        id: true,
        last_message_id: true,
      },
    });

    await prisma.application_messages.updateMany({
      where: {
        application_id: BigInt(applicationId),
        receiver_id: receiverId,
        receiver_role: receiverRole,
        read_status: false,
      },
      data: {
        read_status: true,
        read_at: new Date(),
      },
    });

    if (conversation?.id && conversation?.last_message_id) {
      if (receiverRole === ROLE.USER) {
        await prisma.application_conversations.update({
          where: { id: conversation.id },
          data: {
            user_last_seen_message_id: conversation.last_message_id,
            user_seen_at: new Date(),
          },
        });
      } else {
        await prisma.application_conversations.update({
          where: { id: conversation.id },
          data: {
            recruiter_last_seen_message_id: conversation.last_message_id,
            recruiter_seen_at: new Date(),
          },
        });
      }
    }

    const unreadCount = await getUnreadCountForConversation(applicationId, receiverId, receiverRole);
    const totalUnread = await prisma.application_messages.count({
      where: {
        receiver_id: receiverId,
        receiver_role: receiverRole,
        read_status: false,
      },
    });

    res.json({
      success: true,
      unreadCount,
      totalUnread,
    });
  }),
);

router.post(
  '/conversations/:applicationId/messages',
  authenticate,
  attachmentUpload.array('attachments', 5),
  asyncHandler(async (req, res) => {
    await persistUploadedFiles(Array.isArray(req.files) ? req.files : [], 'message-attachments');

    const applicationId = Number(req.params.applicationId);

    if (!Number.isFinite(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await fetchApplicationContext(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const messageText = String(req.body?.message || '').trim();
    if (!messageText) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const senderRole = access.role;
    const receiverRole = senderRole === ROLE.USER ? ROLE.RECRUITER : ROLE.USER;
    const senderId = BigInt(req.auth.sub);
    const receiverId = BigInt(senderRole === ROLE.USER ? application.recruiterId : application.userId);

    const conversation =
      (await prisma.application_conversations.findFirst({
        where: { application_id: BigInt(applicationId) },
        select: { id: true },
      })) ||
      (await prisma.application_conversations.create({
        data: {
          application_id: BigInt(applicationId),
          job_id: BigInt(application.jobId),
          recruiter_id: BigInt(application.recruiterId),
          user_id: BigInt(application.userId),
        },
        select: { id: true },
      }));

    const createdMessage = await prisma.$transaction(async (tx) => {
      const message = await tx.application_messages.create({
        data: {
          conversation_id: conversation.id,
          application_id: BigInt(applicationId),
          job_id: BigInt(application.jobId),
          sender_id: senderId,
          sender_role: senderRole,
          receiver_id: receiverId,
          receiver_role: receiverRole,
          message: messageText,
          read_status: false,
        },
        select: {
          id: true,
          conversation_id: true,
          application_id: true,
          job_id: true,
          sender_id: true,
          sender_role: true,
          receiver_id: true,
          receiver_role: true,
          message: true,
          read_status: true,
          read_at: true,
          is_pinned: true,
          pinned_at: true,
          pinned_by_role: true,
          pinned_by_id: true,
          created_at: true,
        },
      });

      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length > 0) {
        await tx.application_message_attachments.createMany({
          data: files.map((file) => ({
            message_id: message.id,
            file_path: file.path,
            file_name: file.originalname,
            file_type: file.mimetype,
            file_size: BigInt(file.size),
          })),
        });
      }

      await tx.application_conversations.update({
        where: { id: conversation.id },
        data: {
          last_message_id: message.id,
          last_message_at: message.created_at,
          updated_at: new Date(),
        },
      });

      return message;
    });

    const createdAttachments = await prisma.application_message_attachments.findMany({
      where: {
        message_id: createdMessage.id,
      },
      orderBy: {
        created_at: 'asc',
      },
      select: {
        id: true,
        file_path: true,
        file_name: true,
        file_type: true,
        file_size: true,
        created_at: true,
      },
    });

    res.json({
      success: true,
      message: {
        id: Number(createdMessage.id),
        conversationId: Number(createdMessage.conversation_id),
        applicationId: Number(createdMessage.application_id),
        jobId: Number(createdMessage.job_id),
        senderId: Number(createdMessage.sender_id),
        senderRole: normalizeRoleForResponse(createdMessage.sender_role),
        receiverId: Number(createdMessage.receiver_id),
        receiverRole: normalizeRoleForResponse(createdMessage.receiver_role),
        message: createdMessage.message,
        readStatus: normalizeReadStatus(Boolean(createdMessage.read_status)),
        readAt: createdMessage.read_at,
        isPinned: Boolean(createdMessage.is_pinned),
        pinnedAt: createdMessage.pinned_at,
        pinnedByRole: normalizeRoleForResponse(createdMessage.pinned_by_role),
        pinnedById: createdMessage.pinned_by_id != null ? Number(createdMessage.pinned_by_id) : null,
        createdAt: createdMessage.created_at,
        attachments: createdAttachments.map((attachment) => ({
          id: Number(attachment.id),
          filePath: attachment.file_path,
          fileName: attachment.file_name,
          fileType: attachment.file_type,
          fileSize: attachment.file_size != null ? Number(attachment.file_size) : null,
          createdAt: attachment.created_at,
        })),
      },
    });
  }),
);

router.post(
  '/conversations/:applicationId/pins',
  authenticate,
  asyncHandler(async (req, res) => {
    const applicationId = Number(req.params.applicationId);
    const messageId = Number(req.body?.messageId);
    const pinned = Boolean(req.body?.pinned);

    if (!Number.isFinite(applicationId) || !Number.isFinite(messageId)) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const application = await fetchApplicationContext(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const targetMessage = await prisma.application_messages.findFirst({
      where: {
        id: BigInt(messageId),
        application_id: BigInt(applicationId),
      },
      select: {
        id: true,
        conversation_id: true,
      },
    });

    if (!targetMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (pinned) {
      const pinnedCount = await prisma.application_messages.count({
        where: {
          conversation_id: targetMessage.conversation_id,
          is_pinned: true,
        },
      });

      if (pinnedCount >= 3) {
        return res.status(400).json({ message: 'Only 3 pinned messages are allowed per conversation' });
      }
    }

    const updatedMessage = await prisma.application_messages.update({
      where: { id: targetMessage.id },
      data: pinned
        ? {
            is_pinned: true,
            pinned_at: new Date(),
            pinned_by_role: access.role,
            pinned_by_id: BigInt(req.auth.sub),
          }
        : {
            is_pinned: false,
            pinned_at: null,
            pinned_by_role: null,
            pinned_by_id: null,
          },
      select: {
        id: true,
        is_pinned: true,
        pinned_at: true,
        pinned_by_role: true,
        pinned_by_id: true,
      },
    });

    res.json({
      success: true,
      message: {
        id: Number(updatedMessage.id),
        isPinned: Boolean(updatedMessage.is_pinned),
        pinnedAt: updatedMessage.pinned_at,
        pinnedByRole: normalizeRoleForResponse(updatedMessage.pinned_by_role),
        pinnedById: updatedMessage.pinned_by_id != null ? Number(updatedMessage.pinned_by_id) : null,
      },
    });
  }),
);

router.patch(
  '/conversations/:applicationId/notes',
  authenticate,
  asyncHandler(async (req, res) => {
    const applicationId = Number(req.params.applicationId);

    if (!Number.isFinite(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await fetchApplicationContext(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (access.role !== ROLE.RECRUITER) {
      return res.status(403).json({ message: 'Recruiter access required.' });
    }

    await prisma.application_conversations.updateMany({
      where: {
        application_id: BigInt(applicationId),
      },
      data: {
        recruiter_notes: req.body?.notes ? String(req.body.notes) : null,
        updated_at: new Date(),
      },
    });

    res.json({ success: true });
  }),
);

export default router;
