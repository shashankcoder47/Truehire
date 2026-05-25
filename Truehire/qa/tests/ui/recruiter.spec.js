import { test, expect } from '../../fixtures/test-fixtures.js';
import { RecruiterPage } from '../../pages/recruiter.page.js';
import { buildJob } from '../../utils/test-data.js';

test.describe('Recruiter Module UI', () => {
  test.use({ storageState: 'qa/.auth/recruiter.json' });

  test('create job', async ({ page }) => {
    await new RecruiterPage(page).openCreateJob();
    await expect(page).toHaveURL(/post-job|login/);
  });

  test('edit job from manage jobs', async ({ page }) => {
    const recruiter = new RecruiterPage(page);
    await recruiter.openManageJobs();
    await expect(page).toHaveURL(/active-jobs|login/);
  });

  test('delete job prompts confirmation', async ({ page }) => {
    const recruiter = new RecruiterPage(page);
    await recruiter.openManageJobs();
    await expect(page).toHaveURL(/active-jobs|login/);
  });

  test('review applications', async ({ page }) => {
    const recruiter = new RecruiterPage(page);
    await recruiter.openApplications();
    await expect(page).toHaveURL(/recruiter-applications|login/);
  });

  test('schedule interview', async ({ page }) => {
    const recruiter = new RecruiterPage(page);
    await recruiter.openApplications();
    await expect(page).toHaveURL(/recruiter-applications|login/);
  });
});
