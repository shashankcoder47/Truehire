import { test, expect } from '../../fixtures/test-fixtures.js';
import { buildJob } from '../../utils/test-data.js';
import { expectJobSchema, expectStatus, expectSuccessEnvelope } from '../../utils/assertions.js';
import { withPrisma } from '../../utils/db-helper.js';

async function createSecondaryRecruiter(apiClient) {
  const suffix = Date.now();
  const payload = {
    name: 'QA Ownership Recruiter',
    email: `qa.owner.${suffix}@truehire.com`,
    password: 'ChangeMe123!',
    company: 'TrueHire Ownership Labs'
  };

  await apiClient.post('/auth/register/recruiter', payload);
  const response = await apiClient.post('/auth/login', {
    email: payload.email,
    password: payload.password,
    role: 'RECRUITER'
  });

  const body = await expectSuccessEnvelope(response);
  return body.token;
}

test.describe('Jobs API Advanced Coverage', () => {
  test('create, read, update, delete job and validate database consistency', async ({ jobsApi, recruiterToken }) => {
    const createBody = await expectSuccessEnvelope(await jobsApi.create(recruiterToken, buildJob()));
    const job = createBody.job || createBody.data;
    expectJobSchema(job);

    const dbJob = await withPrisma((prisma) =>
      prisma.jobs.findUnique({ where: { id: BigInt(job.id) }, select: { title: true } })
    );
    if (dbJob) {
      expect(dbJob.title).toBe(job.title);
    }

    const readBody = await expectSuccessEnvelope(await jobsApi.getById(job.id));
    expectJobSchema(readBody.job || readBody.data);

    const updatedTitle = `Updated ${job.title}`;
    const updateBody = await expectSuccessEnvelope(await jobsApi.update(recruiterToken, job.id, { title: updatedTitle }));
    expect(updateBody.data.title).toBe(updatedTitle);

    await expectStatus(await jobsApi.remove(recruiterToken, job.id), [200, 202, 204]);
    await expectStatus(await jobsApi.getById(job.id), 404);
  });

  test('create job validation rejects missing employment type', async ({ apiClient, recruiterToken }) => {
    const invalidJob = buildJob();
    delete invalidJob.employmentType;
    await expectStatus(await apiClient.post('/jobs', invalidJob, { token: recruiterToken }), [400, 422]);
  });

  test('candidate cannot create job', async ({ jobsApi, candidateToken }) => {
    await expectStatus(await jobsApi.create(candidateToken, buildJob()), [401, 403]);
  });

  test('anonymous user cannot create job', async ({ jobsApi }) => {
    await expectStatus(await jobsApi.create(undefined, buildJob()), [401, 403]);
  });

  test('recruiter cannot update another recruiter job', async ({ apiClient, jobsApi, recruiterToken }) => {
    const otherRecruiterToken = await createSecondaryRecruiter(apiClient);
    const createBody = await expectSuccessEnvelope(await jobsApi.create(recruiterToken, buildJob()));
    const job = createBody.job || createBody.data;

    await expectStatus(
      await jobsApi.update(otherRecruiterToken, job.id, { title: 'Unauthorized update attempt' }),
      [403]
    );

    await jobsApi.remove(recruiterToken, job.id);
  });

  test('invalid job id returns not found or validation error', async ({ jobsApi }) => {
    await expectStatus(await jobsApi.getById('999999999'), [404]);
  });

  test('large description payload is rejected by validator', async ({ jobsApi, recruiterToken }) => {
    const response = await jobsApi.create(recruiterToken, buildJob({
      description: 'A'.repeat(9000)
    }));
    await expectStatus(response, [400, 413, 422]);
  });

  test('duplicate job titles are allowed but receive unique ids', async ({ jobsApi, recruiterToken }) => {
    const job = buildJob({ title: `Duplicate Contract ${Date.now()}` });
    const first = await expectSuccessEnvelope(await jobsApi.create(recruiterToken, job));
    const second = await expectSuccessEnvelope(await jobsApi.create(recruiterToken, job));

    expect((first.job || first.data).id).not.toBe((second.job || second.data).id);

    await jobsApi.remove(recruiterToken, (first.job || first.data).id);
    await jobsApi.remove(recruiterToken, (second.job || second.data).id);
  });

  test('SQL injection in search does not break jobs endpoint', async ({ jobsApi }) => {
    const response = await jobsApi.list(`?keyword=${encodeURIComponent("' OR '1'='1")}`);
    expect(response.status(), await response.text()).toBeLessThan(500);
  });
});
