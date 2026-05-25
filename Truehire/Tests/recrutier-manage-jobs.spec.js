import { test, expect } from '@playwright/test';

test.describe('Manage Jobs Button Test', () => {
  const recruiter = {
    id: 101,
    name: 'Raksitha R',
    email: 'raksitha@example.com',
    role: 'recruiter',
    company_name: 'TrueHire QA',
    subscription_status: 'Free',
    job_post_limit: 3,
    job_post_limit_total: 5,
  };

  const fakeJwt = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: recruiter.id, role: recruiter.role })).toString('base64url'),
    'test-signature',
  ].join('.');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ token, user }) => {
        for (const storage of [window.sessionStorage, window.localStorage]) {
          storage.setItem('token', token);
          storage.setItem('user', JSON.stringify(user));
          storage.setItem('userData', JSON.stringify(user));
          storage.setItem('role', user.role);
          storage.setItem('isLoggedIn', 'true');
          storage.setItem('recruiterLoggedIn', 'true');
          storage.setItem('recruiterData', JSON.stringify(user));
        }
      },
      { token: fakeJwt, user: recruiter },
    );

    await page.route('**/api/recruiters/profile/me', async (route) => {
      await route.fulfill({ json: { recruiter } });
    });

    await page.route('**/api/recruiters/verification', async (route) => {
      await route.fulfill({ json: { status: 'Pending', documents: [] } });
    });

    await page.route('**/api/recruiters/notifications', async (route) => {
      await route.fulfill({ json: { notifications: [], unreadCount: 0 } });
    });

    await page.route('**/api/recruiters/*/sub-recruiters', async (route) => {
      await route.fulfill({ json: { sub_recruiters: [] } });
    });

    await page.route('**/api/jobs/recruiter/my-jobs', async (route) => {
      await route.fulfill({
        json: {
          jobs: [
            {
              id: 301,
              title: 'Backend Developer',
              company: 'TrueHire Pvt Ltd',
              location: 'Bangalore',
              status: 'Active',
              employment_type: 'Full-time',
              applications_count: 4,
            },
          ],
        },
      });
    });

    await page.route('**/api/recruiter/jobs', async (route) => {
      await route.fulfill({ json: { jobs: [] } });
    });

    await page.route('**/api/recruiters/applications', async (route) => {
      await route.fulfill({ json: { applications: [] } });
    });

    await page.goto('/recruiter-dashboard');
    await expect(
      page.getByRole('heading', { name: /Build momentum with a dashboard/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('Validate Manage Jobs card and navigation', async ({ page }) => {
    const manageJobsCard = page.getByRole('button', { name: /Manage Jobs/i });

    await expect(manageJobsCard).toBeVisible();
    await expect(
      manageJobsCard.getByText('Keep active openings sharp, updated, and visible to the right candidates.'),
    ).toBeVisible();
    await expect(manageJobsCard.getByText('Open', { exact: true })).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/manage-jobs$/, { timeout: 15000 }),
      manageJobsCard.click(),
    ]);

    await expect(page.getByRole('button', { name: 'My Jobs' })).toHaveClass(/tab-pill-active/);
    await expect(page.getByRole('heading', { name: /My Job Postings/i })).toBeVisible();
  });
});
