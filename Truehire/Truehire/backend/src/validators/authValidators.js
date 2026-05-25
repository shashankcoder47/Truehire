import { z } from 'zod';
import { ROLES } from '../constants/roles.js';

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(64, 'Password must be less than 64 characters long');

export const roleSchema = z.enum([ROLES.USER, ROLES.RECRUITER, ROLES.ADMIN, ROLES.SUPER_ADMIN]);
export const publicRegisterRoleSchema = z.enum([ROLES.USER, ROLES.RECRUITER]);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    email: z.string().email(),
    password: passwordRule,
    role: publicRegisterRoleSchema.default(ROLES.USER),
    company: z.string().trim().min(2).max(120).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === ROLES.RECRUITER && !data.company) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'company is required for recruiter registration',
        path: ['company'],
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: roleSchema.optional(),
});
