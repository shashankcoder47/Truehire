import { z } from 'zod';

export const recruiterRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  companyName: z.string().trim().min(2).max(120),
  companyWebsite: z.string().trim().url().optional(),
  companySize: z.string().trim().max(50).optional(),
  industry: z.string().trim().max(100).optional(),
  companyDescription: z.string().trim().max(2000).optional(),
  headquarters: z.string().trim().max(120).optional(),
});

export const updateCompanySchema = z.object({
  companyName: z.string().trim().min(2).max(120).optional(),
  companyWebsite: z.string().trim().url().optional().nullable(),
  companySize: z.string().trim().max(50).optional().nullable(),
  industry: z.string().trim().max(100).optional().nullable(),
  companyDescription: z.string().trim().max(2000).optional().nullable(),
  headquarters: z.string().trim().max(120).optional().nullable(),
  isVerified: z.boolean().optional(),
});
