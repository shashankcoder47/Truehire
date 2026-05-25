import { prisma } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';
import {
  createFollowBackNotification,
  createFriendRequestAcceptedNotification,
  createFriendRequestNotification,
} from './notificationService.js';
import { followUser, getFollowStats } from './followService.js';

const toBigIntId = (value, fieldName = 'user id') => {
  try {
    const normalized = BigInt(value);
    if (normalized <= 0n) throw new Error('non-positive');
    return normalized;
  } catch {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const serializeSuggestion = (user) => ({
  id: user.id.toString(),
  name: user.name,
  email: user.email,
  profileImage: user.profile_photo,
  desiredJobRole: user.desired_job_role,
  currentLocation: user.current_location,
  createdAt: user.created_at,
});

export const getFriendSuggestions = async (currentUserId, limit = 10) => {
  const userId = toBigIntId(currentUserId);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);

  const suggestions = await prisma.users.findMany({
    where: {
      id: { not: userId },
      role: 'USER',
      user_connections_user_connections_sender_idTousers: {
        none: {
          OR: [
            { receiver_id: userId, status: { in: ['pending', 'accepted'] } },
          ],
        },
      },
      user_connections_user_connections_receiver_idTousers: {
        none: {
          OR: [
            { sender_id: userId, status: { in: ['pending', 'accepted'] } },
          ],
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: safeLimit,
    select: {
      id: true,
      name: true,
      email: true,
      profile_photo: true,
      desired_job_role: true,
      current_location: true,
      created_at: true,
    },
  });

  return suggestions.map(serializeSuggestion);
};

export const sendFriendRequest = async (senderId, receiverId) => {
  const normalizedSenderId = toBigIntId(senderId, 'sender id');
  const normalizedReceiverId = toBigIntId(receiverId, 'receiver id');

  if (normalizedSenderId === normalizedReceiverId) {
    throw new ApiError(400, 'You cannot send a friend request to yourself');
  }

  const receiver = await prisma.users.findUnique({
    where: { id: normalizedReceiverId },
    select: { id: true, role: true },
  });

  if (!receiver || receiver.role !== 'USER') {
    throw new ApiError(404, 'Receiver user not found');
  }

  const sender = await prisma.users.findUnique({
    where: { id: normalizedSenderId },
    select: { id: true, name: true, role: true },
  });

  if (!sender || sender.role !== 'USER') {
    throw new ApiError(404, 'Sender user not found');
  }

  const pairKey = [normalizedSenderId, normalizedReceiverId]
    .sort((a, b) => (a < b ? -1 : 1))
    .join(':');

  const existing = await prisma.user_connections.findFirst({
    where: {
      OR: [
        { sender_id: normalizedSenderId, receiver_id: normalizedReceiverId },
        { sender_id: normalizedReceiverId, receiver_id: normalizedSenderId },
      ],
    },
    orderBy: { id: 'desc' },
  });

  if (existing) {
    if (existing.status === 'accepted') {
      throw new ApiError(409, 'You are already friends with this user');
    }
    if (existing.status === 'pending') {
      throw new ApiError(409, 'A friend request is already pending');
    }

    const request = await prisma.user_connections.update({
      where: { id: existing.id },
      data: {
        sender_id: normalizedSenderId,
        receiver_id: normalizedReceiverId,
        status: 'pending',
      },
      select: {
        id: true,
        sender_id: true,
        receiver_id: true,
        status: true,
        created_at: true,
      },
    });

    const normalizedRequest = {
      id: request.id.toString(),
      senderId: request.sender_id.toString(),
      receiverId: request.receiver_id.toString(),
      status: request.status,
      createdAt: request.created_at,
    };

    await createFriendRequestNotification({
      receiverId: normalizedReceiverId,
      senderId: normalizedSenderId,
      senderName: sender.name,
      requestId: request.id,
    });

    return normalizedRequest;
  }

  try {
    const request = await prisma.user_connections.create({
      data: {
        sender_id: normalizedSenderId,
        receiver_id: normalizedReceiverId,
        status: 'pending',
        pair_key: pairKey,
      },
      select: {
        id: true,
        sender_id: true,
        receiver_id: true,
        status: true,
        created_at: true,
      },
    });

    const normalizedRequest = {
      id: request.id.toString(),
      senderId: request.sender_id.toString(),
      receiverId: request.receiver_id.toString(),
      status: request.status,
      createdAt: request.created_at,
    };

    await createFriendRequestNotification({
      receiverId: normalizedReceiverId,
      senderId: normalizedSenderId,
      senderName: sender.name,
      requestId: request.id,
    });

    return normalizedRequest;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new ApiError(409, 'A friend request already exists for this user pair');
    }
    throw error;
  }
};

export const getMyFriends = async (currentUserId) => {
  const userId = toBigIntId(currentUserId);
  const rows = await prisma.user_connections.findMany({
    where: {
      status: 'accepted',
      OR: [{ sender_id: userId }, { receiver_id: userId }],
    },
    orderBy: { created_at: 'desc' },
    include: {
      users_user_connections_sender_idTousers: {
        select: { id: true, name: true, email: true, profile_photo: true },
      },
      users_user_connections_receiver_idTousers: {
        select: { id: true, name: true, email: true, profile_photo: true },
      },
    },
  });

  return rows.map((row) => {
    const friend =
      row.sender_id === userId
        ? row.users_user_connections_receiver_idTousers
        : row.users_user_connections_sender_idTousers;

    return {
      id: row.id.toString(),
      user_id: friend.id.toString(),
      name: friend.name,
      email: friend.email,
      profileImage: friend.profile_photo,
      status: row.status,
      created_at: row.created_at,
    };
  });
};

export const getPendingFriendRequests = async (currentUserId) => {
  const userId = toBigIntId(currentUserId);
  const rows = await prisma.user_connections.findMany({
    where: {
      receiver_id: userId,
      status: 'pending',
    },
    orderBy: { created_at: 'desc' },
    include: {
      users_user_connections_sender_idTousers: {
        select: { id: true, name: true, email: true, profile_photo: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id.toString(),
    sender_id: row.sender_id.toString(),
    receiver_id: row.receiver_id.toString(),
    status: row.status,
    created_at: row.created_at,
    sender_name: row.users_user_connections_sender_idTousers.name,
    sender_email: row.users_user_connections_sender_idTousers.email,
    sender_profile_image: row.users_user_connections_sender_idTousers.profile_photo,
  }));
};

export const getFriendStatus = async (currentUserId, targetUserId) => {
  const userId = toBigIntId(currentUserId);
  const targetId = toBigIntId(targetUserId, 'target user id');

  if (userId === targetId) {
    return { status: 'self', requestId: null };
  }

  const row = await prisma.user_connections.findFirst({
    where: {
      OR: [
        { sender_id: userId, receiver_id: targetId },
        { sender_id: targetId, receiver_id: userId },
      ],
    },
    orderBy: { id: 'desc' },
  });

  if (!row) {
    return { status: 'none', requestId: null };
  }

  if (row.status === 'accepted') {
    return { status: 'connected', requestId: row.id.toString() };
  }

  if (row.status === 'pending') {
    return {
      status: row.sender_id === userId ? 'pending_outgoing' : 'pending_incoming',
      requestId: row.id.toString(),
    };
  }

  return { status: row.status, requestId: row.id.toString() };
};

export const getFriendStats = async (currentUserId) => {
  return getFollowStats(currentUserId);
};

export const updateFriendRequest = async (requestId, currentUserId, nextStatus) => {
  const normalizedRequestId = toBigIntId(requestId, 'request id');
  const userId = toBigIntId(currentUserId);

  const request = await prisma.user_connections.findUnique({
    where: { id: normalizedRequestId },
  });

  if (!request) {
    throw new ApiError(404, 'Friend request not found');
  }

  if (request.receiver_id !== userId) {
    throw new ApiError(403, 'Only the receiver can update this request');
  }

  if (request.status !== 'pending') {
    throw new ApiError(400, `This request is already ${request.status}`);
  }

  const updated = await prisma.user_connections.update({
    where: { id: normalizedRequestId },
    data: { status: nextStatus },
  });

  if (nextStatus === 'accepted') {
    const [sender, receiver] = await Promise.all([
      prisma.users.findUnique({ where: { id: request.sender_id }, select: { name: true } }),
      prisma.users.findUnique({ where: { id: request.receiver_id }, select: { name: true } }),
    ]);
    await followUser(request.sender_id.toString(), request.receiver_id.toString());
    await Promise.all([
      createFriendRequestAcceptedNotification({
        senderId: request.sender_id,
        receiverId: request.receiver_id,
        receiverName: receiver?.name,
        requestId: request.id,
      }),
      createFollowBackNotification({
        receiverId: request.receiver_id,
        senderId: request.sender_id,
        senderName: sender?.name,
        requestId: request.id,
      }),
    ]);
  }

  return {
    id: updated.id.toString(),
    senderId: updated.sender_id.toString(),
    receiverId: updated.receiver_id.toString(),
    status: updated.status,
  };
};
