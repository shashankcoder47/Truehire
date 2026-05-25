import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Applications API', () => {
  test('candidate can read own applications', async ({ apiClient, candidateToken }) => {
    const response = await apiClient.get('/jobs/user/applications', { token: candidateToken });
    expect(response.status(), await response.text()).toBeLessThan(300);
  });

  test('recruiter can read received applications', async ({ apiClient, recruiterToken }) => {
    const response = await apiClient.get('/recruiters/applications', { token: recruiterToken });
    expect(response.status(), await response.text()).toBeLessThan(300);
  });

  test('admin applications endpoint is protected', async ({ apiClient }) => {
    const response = await apiClient.get('/admin/applications');
    expect([401, 403]).toContain(response.status());
  });
});
