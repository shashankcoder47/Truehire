import { prisma } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

const normalizeReview = (review) => {
  if (!review) return null;

  return {
    ...review,
    id: Number(review.id),
    user_id: review.user_id == null ? null : Number(review.user_id),
    rating: Number(review.rating),
  };
};

export const getReviews = async () => {
  const reviews = await prisma.user_reviews.findMany({
    select: {
      id: true,
      user_id: true,
      rating: true,
      review_message: true,
      user_name: true,
      job_title: true,
      company_name: true,
      profile_image: true,
      created_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 100,
  });

  return reviews.map(normalizeReview);
};

export const createReview = async (userId, payload) => {
  const normalizedUserId = Number(userId);
  const rating = Number(payload?.rating);
  const reviewMessage = String(payload?.review_message || '').trim();
  const userName = String(payload?.user_name || '').trim();
  const jobTitle = String(payload?.job_title || '').trim();
  const companyName = String(payload?.company_name || '').trim();
  const profileImage = payload?.profile_image ? String(payload.profile_image).trim() : null;

  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  if (!reviewMessage) {
    throw new ApiError(400, 'Review message is required');
  }

  if (!userName) {
    throw new ApiError(400, 'User name is required');
  }

  await prisma.user_reviews.deleteMany({
    where: {
      user_id: normalizedUserId,
    },
  });

  const createdReview = await prisma.user_reviews.create({
    data: {
      user_id: normalizedUserId,
      rating,
      review_message: reviewMessage,
      user_name: userName,
      job_title: jobTitle || null,
      company_name: companyName || null,
      profile_image: profileImage || null,
    },
    select: {
      id: true,
      user_id: true,
      rating: true,
      review_message: true,
      user_name: true,
      job_title: true,
      company_name: true,
      profile_image: true,
      created_at: true,
    },
  });

  return normalizeReview(createdReview);
};
