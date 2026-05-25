import { z } from 'zod';

const nullableTrimmedString = (max) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      return trimmed.slice(0, max);
    });

const nullableNumber = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

const nullableBoolean = z
  .union([z.boolean(), z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const normalized = String(value).trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    return null;
  });

const nullableJsonText = z
  .union([z.string(), z.array(z.any()), z.object({}).passthrough(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }
    return JSON.stringify(value);
  });

const profileVisibility = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (normalized === 'public') return 'PUBLIC';
    if (normalized === 'private') return 'PRIVATE';
    if (normalized === 'recruiters only' || normalized === 'recruiters_only' || normalized === 'recruiter only') {
      return 'RECRUITERS_ONLY';
    }
    return 'PUBLIC';
  });

export const updateUserProfileSchema = z.object({
  name: nullableTrimmedString(150),
  contact_number: nullableTrimmedString(20),
  desired_job_role: nullableTrimmedString(150),
  current_location: nullableTrimmedString(150),
  professional_summary: nullableTrimmedString(2000),
  core_skills: nullableJsonText,
  date_of_birth: z.union([z.string(), z.null()]).optional(),
  secondary_skills: nullableJsonText,
  languages_known: nullableJsonText,
  soft_skills: nullableJsonText,
  projects: nullableJsonText,
  certifications: nullableJsonText,
  current_salary: nullableNumber,
  expected_salary: nullableNumber,
  salary_confidential: nullableBoolean,
  linkedin_url: nullableTrimmedString(300),
  github_url: nullableTrimmedString(300),
  portfolio_url: nullableTrimmedString(300),
  hobbies_interests: nullableTrimmedString(2000),
  relocated: nullableBoolean,
  profile_visibility: profileVisibility,
  profile_photo: nullableTrimmedString(500),
});
