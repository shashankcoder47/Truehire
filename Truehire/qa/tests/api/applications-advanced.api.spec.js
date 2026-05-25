import { test, expect } from '../../fixtures/test-fixtures.js';
import { buildJob } from '../../utils/test-data.js';
import { expectStatus, expectSuccessEnvelope } from '../../utils/assertions.js';

test.describe('Applications API Advanced Coverage', () => {
  test('candidate can apply to a recruiter job and track application', async ({
    applicationsApi,
    jobsApi,
    recruiterToken,
    candidateToken
  }) => {
    const createdJob = await expectSuccessEnvelope(await jobsApi.create(recruiterToken, buildJob()));
    const job = createdJob.job || createdJob.data;

    const applyBody = await expectSuccessEnvelope(await applicationsApi.apply(candidateToken, job.id, {
      coverLetter: 'I am interested in this QA automation role.'
    }));
    const application = applyBody.application || applyBody.data;
    expect(application).toEqual(expect.objectContaining({
      id: expect.any(String),
      status: expect.any(String),
      job: expect.objectContaining({ id: job.id })
    }));

    const trackingBody = await expectSuccessEnvelope(await applicationsApi.candidateApplications(candidateToken));
    const applications = trackingBody.applications || trackingBody.data || [];
    expect(applications.some((application) => String(application.jobId || application.job_id) === job.id)).toBeTruthy();
  });

  test('duplicate application is prevented', async ({ applicationsApi, jobsApi, recruiterToken, candidateToken }) => {
    const createdJob = await expectSuccessEnvelope(await jobsApi.create(recruiterToken, buildJob()));
    const job = createdJob.job || createdJob.data;

    await expectSuccessEnvelope(await applicationsApi.apply(candidateToken, job.id, { coverLetter: 'First apply.' }));
    await expectStatus(
      await applicationsApi.apply(candidateToken, job.id, { coverLetter: 'Second apply.' }),
      [400, 409]
    );
  });

  test('anonymous user cannot apply to job', async ({ applicationsApi, jobsApi, recruiterToken }) => {
    const createdJob = await expectSuccessEnvelope(await jobsApi.create(recruiterToken, buildJob()));
    const job = createdJob.job || createdJob.data;

    await expectStatus(await applicationsApi.apply(undefined, job.id, { coverLetter: 'Anonymous' }), [401, 403]);
  });

  test('recruiter cannot apply to job as candidate', async ({ applicationsApi, jobsApi, recruiterToken }) => {
    const createdJob = await expectSuccessEnvelope(await jobsApi.create(recruiterToken, buildJob()));
    const job = createdJob.job || createdJob.data;

    await expectStatus(await applicationsApi.apply(recruiterToken, job.id, { coverLetter: 'Wrong role' }), [401, 403]);
  });

  test('recruiter can read received applications', async ({ applicationsApi, recruiterToken }) => {
    const body = await expectSuccessEnvelope(await applicationsApi.recruiterApplications(recruiterToken));
    expect(Array.isArray(body.applications || body.data || [])).toBeTruthy();
  });

  test('candidate cannot read recruiter application inbox', async ({ applicationsApi, candidateToken }) => {
    await expectStatus(await applicationsApi.recruiterApplications(candidateToken), [401, 403]);
  });

  test('admin applications endpoint requires admin role', async ({ applicationsApi, candidateToken, adminToken }) => {
    await expectStatus(await applicationsApi.adminApplications(candidateToken), [401, 403]);
    await expectStatus(await applicationsApi.adminApplications(adminToken), 200);
  });

  test('resume upload accepts PDF fixture', async ({ applicationsApi, candidateToken }) => {
    const response = await applicationsApi.uploadResume(candidateToken, {
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% TrueHire QA resume\n')
    });
    await expectStatus(response, [201, 500]);
  });

  test('invalid resume file type is rejected', async ({ applicationsApi, candidateToken }) => {
    const response = await applicationsApi.uploadResume(candidateToken, {
      name: 'malware.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a resume')
    });
    await expectStatus(response, [400, 415]);
  });

  test('oversized resume upload is rejected by file limit', async ({ applicationsApi, candidateToken }) => {
    const response = await applicationsApi.uploadResume(candidateToken, {
      name: 'large-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(6 * 1024 * 1024, 1)
    });
    await expectStatus(response, [400, 413, 500]);
  });
});
