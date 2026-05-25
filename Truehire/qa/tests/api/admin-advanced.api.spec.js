import { test, expect } from '../../fixtures/test-fixtures.js';
import { expectNoSensitiveAuthData, expectStatus, expectSuccessEnvelope } from '../../utils/assertions.js';

test.describe('Admin API Advanced Coverage', () => {
  test('dashboard stats contains enterprise summary metrics', async ({ adminApi, adminToken }) => {
    const body = await expectSuccessEnvelope(await adminApi.dashboard(adminToken));
    expect(body.stats).toEqual(expect.objectContaining({
      totalUsers: expect.any(Number),
      totalRecruiters: expect.any(Number),
      totalJobs: expect.any(Number),
      totalApplications: expect.any(Number)
    }));
  });

  test('user management list is paginated and hides sensitive data', async ({ adminApi, adminToken }) => {
    const body = await expectSuccessEnvelope(await adminApi.users(adminToken, '?page=1&limit=5'));
    expect(Array.isArray(body.users)).toBeTruthy();
    expect(body.pagination).toEqual(expect.objectContaining({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number)
    }));
    expectNoSensitiveAuthData(body);
  });

  test('recruiter management and approval queues are admin-only', async ({ adminApi, adminToken, recruiterToken }) => {
    await expectStatus(await adminApi.recruiters(adminToken), 200);
    await expectStatus(await adminApi.approvals(adminToken), 200);
    await expectStatus(await adminApi.recruiters(recruiterToken), [401, 403]);
    await expectStatus(await adminApi.approvals(recruiterToken), [401, 403]);
  });

  test('admin jobs endpoint can serve report-style data', async ({ adminApi, adminToken }) => {
    const body = await expectSuccessEnvelope(await adminApi.jobs(adminToken, '?page=1&limit=10&status=OPEN'));
    expect(Array.isArray(body.jobs)).toBeTruthy();
    expect(body.pagination).toBeTruthy();
  });

  test('admin applications endpoint can serve application reports', async ({ adminApi, adminToken }) => {
    const body = await expectSuccessEnvelope(await adminApi.applications(adminToken, '?page=1&limit=10'));
    expect(Array.isArray(body.applications)).toBeTruthy();
    expect(body.pagination).toBeTruthy();
  });

  test('unauthorized admin endpoints are blocked', async ({ adminApi }) => {
    await expectStatus(await adminApi.dashboard(), [401, 403]);
    await expectStatus(await adminApi.users(), [401, 403]);
  });

  test('candidate cannot access admin reports', async ({ adminApi, candidateToken }) => {
    await expectStatus(await adminApi.dashboard(candidateToken), [401, 403]);
    await expectStatus(await adminApi.jobs(candidateToken), [401, 403]);
    await expectStatus(await adminApi.applications(candidateToken), [401, 403]);
  });
});
