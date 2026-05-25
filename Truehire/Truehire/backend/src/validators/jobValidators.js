import { z } from 'zod';

const employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'];
const experienceLevels = ['ENTRY_LEVEL', 'INTERNSHIP_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'EXECUTIVE_LEVEL'];

const emptyStringToUndefined = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};

const parseOptionalInteger = z.preprocess((value) => {
  const normalized = emptyStringToUndefined(value);
  if (normalized === undefined) return undefined;
  if (typeof normalized === 'number') return normalized;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : normalized;
}, z.number().int().nonnegative().optional());

const parseOptionalNumber = z.preprocess((value) => {
  const normalized = emptyStringToUndefined(value);
  if (normalized === undefined) return undefined;
  if (typeof normalized === 'number') return normalized;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : normalized;
}, z.number().nonnegative().optional());

const parseOptionalDate = z.preprocess((value) => {
  const normalized = emptyStringToUndefined(value);
  if (normalized === undefined) return undefined;

  if (normalized instanceof Date) {
    return normalized.toISOString();
  }

  const raw = String(normalized).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }

  return raw;
}, z.string().datetime().optional());

const normalizeEmploymentType = z.preprocess((value) => {
  const normalized = emptyStringToUndefined(value);
  if (normalized === undefined) return undefined;

  return String(normalized).trim().toUpperCase().replace(/[\s-]+/g, '_');
}, z.enum(employmentTypes));

const normalizeExperienceLevel = z.preprocess((value) => {
  const normalized = emptyStringToUndefined(value);
  if (normalized === undefined) return undefined;

  return String(normalized).trim().toUpperCase().replace(/[\s-]+/g, '_');
}, z.enum(experienceLevels).optional());

const textListField = z.preprocess((value) => {
  const normalized = emptyStringToUndefined(value);
  if (normalized === undefined) return undefined;

  if (Array.isArray(normalized)) {
    return normalized.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(normalized)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}, z.array(z.string().trim().min(1)).optional());

export const jobIdParamSchema = z.object({
  jobId: z.coerce.number().int().positive(),
});

const jobBodySchema = z.object({
  title: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().min(20).max(8000),
  location: z.string().trim().min(2).max(120),
  employmentType: normalizeEmploymentType,
  experienceLevel: normalizeExperienceLevel,
  salaryMin: parseOptionalNumber,
  salaryMax: parseOptionalNumber,
  salaryCurrency: z.string().trim().min(1).max(10).optional(),
  requirements: textListField,
  benefits: z.string().trim().max(4000).optional(),
  skillsRequired: z.string().trim().max(2000).optional(),
  minExperienceYears: parseOptionalNumber,
  matchPercentage: z.preprocess((value) => {
    const normalized = emptyStringToUndefined(value);
    if (normalized === undefined) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : normalized;
  }, z.number().min(0).max(100).optional()),
  maxApplicants: parseOptionalInteger,
  applicationDue: parseOptionalDate,
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'PAUSED']).optional(),
  isFeatured: z.preprocess((value) => value === 'true' || value === true, z.boolean().optional()),
  isUrgent: z.preprocess((value) => value === 'true' || value === true, z.boolean().optional()),
});

const withSalaryValidation = (schema) =>
  schema.superRefine((data, ctx) => {
    if (
      typeof data.salaryMin === 'number' &&
      typeof data.salaryMax === 'number' &&
      data.salaryMax < data.salaryMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'salaryMax must be greater than or equal to salaryMin',
        path: ['salaryMax'],
      });
    }
  });

export const createJobSchema = withSalaryValidation(jobBodySchema);

export const updateJobSchema = withSalaryValidation(jobBodySchema.partial());

export const applyJobSchema = z.object({
  coverLetter: z.string().trim().max(3000).optional(),
});
