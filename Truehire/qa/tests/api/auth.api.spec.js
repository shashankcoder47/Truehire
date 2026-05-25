import { test, expect } from '../../fixtures/test-fixtures.js';
import { env } from '../../config/env.js';

test.describe('Auth API', () => {
  test('POST /api/auth/login returns JWT for admin', async ({ authApi }) => {
    await expect(authApi.loginAndGetToken('admin')).resolves.toBeTruthy();
  });

  test('POST /api/auth/login returns JWT for recruiter', async ({ authApi }) => {
    await expect(authApi.loginAndGetToken('recruiter')).resolves.toBeTruthy();
  });

  test('POST /api/auth/login returns JWT for candidate', async ({ authApi }) => {
    await expect(authApi.loginAndGetToken('candidate')).resolves.toBeTruthy();
  });

  test('invalid credentials are rejected', async ({ authApi }) => {
    const response = await authApi.login('candidate', { email: env.credentials.candidate.email, password: 'bad-password' });
    expect([400, 401, 403, 404, 422]).toContain(response.status());
  });

  test('missing required fields return validation error', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', { email: '' });
    expect([400, 401, 422]).toContain(response.status());
  });
});
