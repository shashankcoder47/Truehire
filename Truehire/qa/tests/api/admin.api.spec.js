import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Admin Dashboard API', () => {
  test('GET /api/admin/dashboard/stats returns dashboard data for admin', async ({ apiClient, adminToken }) => {
    const response = await apiClient.get('/admin/dashboard/stats', { token: adminToken });
    expect(response.status(), await response.text()).toBeLessThan(300);
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('non-admin cannot access dashboard stats', async ({ apiClient, candidateToken }) => {
    const response = await apiClient.get('/admin/dashboard/stats', { token: candidateToken });
    expect([401, 403]).toContain(response.status());
  });
});
