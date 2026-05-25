import { test, expect } from '../../fixtures/test-fixtures.js';
import { maliciousPayloads } from '../../utils/test-data.js';

test.describe('Security Validation', () => {
  test('unauthorized access to protected admin API is blocked', async ({ apiClient }) => {
    const response = await apiClient.get('/admin/dashboard/stats');
    expect([401, 403]).toContain(response.status());
  });

  test('invalid JWT token is rejected', async ({ apiClient }) => {
    const response = await apiClient.get('/admin/dashboard/stats', {
      headers: { Authorization: maliciousPayloads.invalidJwt }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('role-based authorization blocks candidate from recruiter APIs', async ({ apiClient, candidateToken }) => {
    const response = await apiClient.get('/recruiters/applications', { token: candidateToken });
    expect([401, 403]).toContain(response.status());
  });

  test('SQL injection payload does not bypass login', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/login', {
      email: maliciousPayloads.sqlInjection,
      password: maliciousPayloads.sqlInjection,
      role: 'ADMIN'
    });
    expect([400, 401, 403, 422]).toContain(response.status());
  });

  test('XSS payload is rejected or safely encoded in job search', async ({ apiClient }) => {
    const response = await apiClient.get(`/jobs?search=${encodeURIComponent(maliciousPayloads.xss)}`);
    expect(response.status(), await response.text()).toBeLessThan(500);
    const body = await response.text();
    expect(body).not.toContain('<script>alert("xss")</script>');
  });
});
