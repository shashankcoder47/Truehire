import { test, expect } from '../../fixtures/test-fixtures.js';
import { expectNoSensitiveAuthData, expectStatus } from '../../utils/assertions.js';
import { buildExpiredToken, tamperJwt } from '../../utils/token-manager.js';

const attackPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>'
];

test.describe('Security Automation Advanced Coverage', () => {
  test('SQL injection payloads are safely handled across public search and login', async ({ apiClient }) => {
    for (const payload of attackPayloads.slice(0, 2)) {
      const jobsResponse = await apiClient.get(`/jobs?keyword=${encodeURIComponent(payload)}`);
      expect(jobsResponse.status(), await jobsResponse.text()).toBeLessThan(500);

      const loginResponse = await apiClient.post('/auth/login', {
        email: payload,
        password: payload,
        role: 'ADMIN'
      });
      await expectStatus(loginResponse, [400, 401, 403, 422]);
    }
  });

  test('XSS payloads are not reflected unsafely in API responses', async ({ apiClient }) => {
    for (const payload of attackPayloads.slice(2)) {
      const response = await apiClient.get(`/jobs?keyword=${encodeURIComponent(payload)}`);
      expect(response.status(), await response.text()).toBeLessThan(500);
      expect(await response.text()).not.toContain(payload);
    }
  });

  test('JWT tampering and expired tokens are blocked', async ({ adminApi, adminToken }) => {
    await expectStatus(await adminApi.dashboard(tamperJwt(adminToken)), [401, 403]);
    await expectStatus(await adminApi.dashboard(buildExpiredToken('ADMIN')), [401, 403]);
  });

  test('broken access control: candidate cannot access recruiter or admin resources', async ({
    apiClient,
    candidateToken,
    adminApi
  }) => {
    await expectStatus(await apiClient.get('/recruiters/applications', { token: candidateToken }), [401, 403]);
    await expectStatus(await adminApi.users(candidateToken), [401, 403]);
  });

  test('invalid authorization headers are rejected', async ({ apiClient }) => {
    const malformedHeaders = [
      { Authorization: 'Basic abc123' },
      { Authorization: 'Bearer' },
      { Authorization: 'Bearer null' },
      { Authorization: 'Bearer undefined' }
    ];

    for (const headers of malformedHeaders) {
      await expectStatus(await apiClient.get('/admin/dashboard/stats', { headers }), [401, 403]);
    }
  });

  test('sensitive data is not exposed by admin listing responses', async ({ adminApi, adminToken }) => {
    const response = await adminApi.users(adminToken);
    await expectStatus(response, 200);
    expectNoSensitiveAuthData(await response.json());
  });

  test('login endpoint remains stable under a small burst below configured rate limit', async ({ authApi }) => {
    const responses = await Promise.all(Array.from({ length: 10 }, () => authApi.login('candidate')));
    for (const response of responses) {
      expect([200, 429]).toContain(response.status());
    }
  });
});
