import { test, expect } from '../../fixtures/test-fixtures.js';
import { JobsApi } from '../../api/jobs.api.js';
import { buildJob } from '../../utils/test-data.js';

test.describe('Jobs API CRUD', () => {
  test('GET /api/jobs lists jobs', async ({ apiClient }) => {
    const response = await new JobsApi(apiClient).list('?limit=10');
    expect(response.status(), await response.text()).toBeLessThan(300);
    const body = await response.json();
    expect(Array.isArray(body) || Array.isArray(body.jobs) || Array.isArray(body.data)).toBeTruthy();
  });

  test('recruiter can create, update, and delete a job', async ({ apiClient, recruiterToken }) => {
    const jobs = new JobsApi(apiClient);
    const createResponse = await jobs.create(recruiterToken, buildJob());
    expect(createResponse.status(), await createResponse.text()).toBeLessThan(300);
    const created = await createResponse.json();
    const jobId = created.id || created.job?.id || created.data?.id;
    expect(jobId).toBeTruthy();

    const updateResponse = await jobs.update(recruiterToken, jobId, { title: `Updated ${Date.now()}` });
    expect(updateResponse.status(), await updateResponse.text()).toBeLessThan(300);

    const deleteResponse = await jobs.remove(recruiterToken, jobId);
    expect([200, 202, 204]).toContain(deleteResponse.status());
  });

  test('candidate cannot create a job', async ({ apiClient, candidateToken }) => {
    const response = await new JobsApi(apiClient).create(candidateToken, buildJob());
    expect([401, 403]).toContain(response.status());
  });
});
