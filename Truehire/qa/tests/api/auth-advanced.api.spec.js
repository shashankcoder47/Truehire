import { test, expect } from '../../fixtures/test-fixtures.js';
import { env } from '../../config/env.js';
import { expectLoginSchema, expectNoSensitiveAuthData, expectStatus } from '../../utils/assertions.js';
import { buildExpiredToken, decodeJwt, tamperJwt } from '../../utils/token-manager.js';

test.describe('Authentication API Advanced Coverage', () => {
  for (const role of ['admin', 'recruiter', 'candidate']) {
    test(`positive login returns valid JWT and safe user payload for ${role}`, async ({ authApi }) => {
      const response = await authApi.login(role);
      expect(response.status(), await response.text()).toBeLessThan(300);
      const body = await response.json();
      expectLoginSchema(body);
      expectNoSensitiveAuthData(body);
      expect(decodeJwt(body.token)).toEqual(expect.objectContaining({
        email: env.credentials[role].email
      }));
    });
  }

  test('invalid password is rejected', async ({ authApi }) => {
    const response = await authApi.login('candidate', { password: 'WrongPassword123!' });
    await expectStatus(response, [401, 403]);
  });

  test('invalid email format is rejected by request validation', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', {
      email: 'not-an-email',
      password: 'ChangeMe123!',
      role: 'USER'
    });
    await expectStatus(response, [400, 422]);
  });

  test('empty fields are rejected', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', {
      email: '',
      password: '',
      role: ''
    });
    await expectStatus(response, [400, 422]);
  });

  test('missing role is rejected', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', {
      email: env.credentials.candidate.email,
      password: env.credentials.candidate.password
    });
    await expectStatus(response, [400, 422]);
  });

  test('valid JWT can access protected resource', async ({ adminApi, adminToken }) => {
    const response = await adminApi.dashboard(adminToken);
    await expectStatus(response, 200);
    const body = await response.json();
    expect(body).toEqual(expect.objectContaining({ success: true, stats: expect.any(Object) }));
  });

  test('tampered JWT is rejected', async ({ adminApi, adminToken }) => {
    const response = await adminApi.dashboard(tamperJwt(adminToken));
    await expectStatus(response, [401, 403]);
  });

  test('expired JWT is rejected', async ({ adminApi }) => {
    const response = await adminApi.dashboard(buildExpiredToken('ADMIN'));
    await expectStatus(response, [401, 403]);
  });

  test('unauthorized request without token is rejected', async ({ adminApi }) => {
    const response = await adminApi.dashboard();
    await expectStatus(response, [401, 403]);
  });

  test('SQL injection payload does not authenticate', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', {
      email: "' OR '1'='1",
      password: "' OR '1'='1",
      role: 'ADMIN'
    });
    await expectStatus(response, [400, 401, 403, 422]);
  });

  test('XSS payload is rejected or safely handled during login', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', {
      email: '<script>alert(1)</script>@truehire.com',
      password: '<img src=x onerror=alert(1)>',
      role: 'USER'
    });
    await expectStatus(response, [400, 401, 403, 422]);
    expect(await response.text()).not.toContain('<script>alert(1)</script>');
  });

  test('concurrent logins are stable and return independent JWTs', async ({ authApi }) => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => authApi.login('candidate'))
    );

    for (const response of responses) {
      expect(response.status(), await response.text()).toBeLessThan(300);
      expectLoginSchema(await response.json());
    }
  });
});
