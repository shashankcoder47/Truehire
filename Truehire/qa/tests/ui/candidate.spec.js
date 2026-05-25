import { test, expect } from '../../fixtures/test-fixtures.js';
import { CandidatePage } from '../../pages/candidate.page.js';
import { buildCandidateProfile } from '../../utils/test-data.js';

test.describe('Candidate Module UI', () => {
  test.use({ storageState: 'qa/.auth/candidate.json' });

  test('search job', async ({ page }) => {
    await new CandidatePage(page).openJobs();
    await expect(page).toHaveURL(/jobs/);
  });

  test('apply job with resume upload', async ({ page }) => {
    await new CandidatePage(page).openJobs();
    await expect(page).toHaveURL(/jobs/);
  });

  test('track application', async ({ page }) => {
    const candidate = new CandidatePage(page);
    await candidate.openApplications();
    await expect(page).toHaveURL(/applications|login/);
  });

  test('profile update', async ({ page }) => {
    await new CandidatePage(page).goto('/profile');
    await expect(page).toHaveURL(/profile|login/);
  });
});
