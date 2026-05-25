import { prisma } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  profile_completeness_percentage: true,
  profile_photo: true,
  date_of_birth: true,
  contact_number: true,
  current_location: true,
  professional_summary: true,
  core_skills: true,
  secondary_skills: true,
  languages_known: true,
  soft_skills: true,
  projects: true,
  certifications: true,
  current_salary: true,
  expected_salary: true,
  salary_confidential: true,
  linkedin_url: true,
  github_url: true,
  portfolio_url: true,
  hobbies_interests: true,
  relocated: true,
  profile_visibility: true,
  desired_job_role: true,
  resume_headline: true,
  resume_file: true,
  profile_complete: true,
  created_at: true,
  updated_at: true,
};

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
};

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const parseJsonList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }
  return [];
};

const calculateProfileCompleteness = (user = {}) => {
  const sections = [
    {
      weight: 20,
      fields: [
        user.name,
        user.email,
        user.contact_number,
        user.current_location,
        user.profile_photo,
      ],
    },
    {
      weight: 20,
      fields: [
        user.professional_summary,
        parseList(user.core_skills),
        parseJsonList(user.languages_known),
      ],
    },
    {
      weight: 20,
      fields: [
        parseJsonList(user.projects),
        parseJsonList(user.certifications),
      ],
    },
    {
      weight: 10,
      fields: [user.hobbies_interests],
    },
    {
      weight: 10,
      fields: [user.relocated],
    },
    {
      weight: 20,
      fields: [
        user.current_salary,
        user.expected_salary,
        parseList(user.soft_skills),
      ],
    },
  ];

  let total = 0;
  sections.forEach((section) => {
    const filled = section.fields.filter(hasValue).length;
    total += (filled / section.fields.length) * section.weight;
  });

  return Math.round(Math.max(0, Math.min(100, total)));
};

const normalizeUser = (user) => {
  if (!user) return null;

  const profileCompleteness = Number(user.profile_completeness_percentage || 0);

  return {
    ...user,
    id: String(user.id),
    role: String(user.role || 'USER').toLowerCase(),
    profile_visibility: user.profile_visibility ? String(user.profile_visibility).toLowerCase() : null,
    profile_completeness_percentage: profileCompleteness,
    profileCompleteness: profileCompleteness,
  };
};

const normalizeUserId = (userId) => {
  if (userId === null || userId === undefined || userId === '') {
    throw new ApiError(401, 'Authentication token is missing a user identifier');
  }

  try {
    return BigInt(userId);
  } catch (error) {
    throw new ApiError(401, 'Authentication token contains an invalid user identifier');
  }
};

export const getProfile = async (userId) => {
  const normalizedUserId = normalizeUserId(userId);
  const user = await prisma.users.findUnique({
    where: { id: normalizedUserId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const profileCompleteness = calculateProfileCompleteness(user);
  if (Number(user.profile_completeness_percentage || 0) !== profileCompleteness) {
    const updatedUser = await prisma.users.update({
      where: { id: normalizedUserId },
      data: {
        profile_completeness_percentage: profileCompleteness,
        profile_complete: profileCompleteness >= 80,
      },
      select: publicUserSelect,
    });

    return normalizeUser(updatedUser);
  }

  return normalizeUser(user);
};

export const upsertProfile = async (userId, payload) => {
  const normalizedPayload = { ...payload };

  if (normalizedPayload.date_of_birth !== undefined) {
    normalizedPayload.date_of_birth = normalizedPayload.date_of_birth
      ? new Date(normalizedPayload.date_of_birth)
      : null;
  }

  const normalizedUserId = normalizeUserId(userId);
  const existingUser = await prisma.users.findUnique({
    where: { id: normalizedUserId },
    select: publicUserSelect,
  });

  if (!existingUser) {
    throw new ApiError(404, 'User profile not found');
  }

  const projectedUser = { ...existingUser, ...normalizedPayload };
  const profileCompleteness = calculateProfileCompleteness(projectedUser);

  const user = await prisma.users.update({
    where: { id: normalizedUserId },
    data: {
      ...normalizedPayload,
      profile_completeness_percentage: profileCompleteness,
      profile_complete: profileCompleteness >= 80,
    },
    select: publicUserSelect,
  });

  return normalizeUser(user);
};

export const updateProfilePhoto = async (userId, filePath) => {
  if (!filePath) {
    throw new ApiError(400, 'No file uploaded');
  }

  const normalizedUserId = normalizeUserId(userId);
  const existingUser = await prisma.users.findUnique({
    where: { id: normalizedUserId },
    select: publicUserSelect,
  });

  if (!existingUser) {
    throw new ApiError(404, 'User profile not found');
  }

  const projectedUser = { ...existingUser, profile_photo: filePath };
  const profileCompleteness = calculateProfileCompleteness(projectedUser);

  const user = await prisma.users.update({
    where: { id: normalizedUserId },
    data: {
      profile_photo: filePath,
      profile_completeness_percentage: profileCompleteness,
      profile_complete: profileCompleteness >= 80,
    },
    select: publicUserSelect,
  });

  return normalizeUser(user);
};

export const updateProfileResume = async (userId, filePath) => {
  if (!filePath) {
    throw new ApiError(400, 'No file uploaded');
  }

  const normalizedUserId = normalizeUserId(userId);
  const existingUser = await prisma.users.findUnique({
    where: { id: normalizedUserId },
    select: publicUserSelect,
  });

  if (!existingUser) {
    throw new ApiError(404, 'User profile not found');
  }

  const user = await prisma.users.update({
    where: { id: normalizedUserId },
    data: {
      resume_file: filePath,
    },
    select: publicUserSelect,
  });

  return normalizeUser(user);
};
