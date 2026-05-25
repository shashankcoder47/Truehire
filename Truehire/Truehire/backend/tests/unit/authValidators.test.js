import { loginSchema, registerSchema } from '../../src/validators/authValidators.js';

describe('auth validators', () => {
  test('accepts valid candidate login payload', () => {
    const result = loginSchema.safeParse({
      email: 'candidate@example.com',
      password: 'ChangeMe123!',
      role: 'USER'
    });

    expect(result.success).toBe(true);
  });

  test('rejects invalid email during login', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'ChangeMe123!',
      role: 'USER'
    });

    expect(result.success).toBe(false);
  });

  test('requires company for recruiter registration', () => {
    const result = registerSchema.safeParse({
      name: 'Recruiter QA',
      email: 'recruiter@example.com',
      password: 'ChangeMe123!',
      role: 'RECRUITER'
    });

    expect(result.success).toBe(false);
  });
});
