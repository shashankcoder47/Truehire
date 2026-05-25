import { test, expect } from '@playwright/test';

test.describe('View Details Flow', () => {
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

  const application = {
    applicationId: 'APP-1001',
    id: 'APP-1001',
    userId: '501',
    candidateName: 'Ananya Rao',
    candidateEmail: 'ananya.rao@example.com',
    candidatePhone: '9876543210',
    jobId: '301',
    jobTitle: 'Backend Developer',
    jobCompany: 'TrueHire QA',
    jobLocation: 'Bangalore',
    location: 'Bangalore',
    status: 'Under Review',
    appliedAt: '2026-04-28T10:30:00.000Z',
    intro_video_url: null,
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
      await route.fulfill({ json: { jobs: [] } });
    });

    await page.route('**/api/recruiter/jobs', async (route) => {
      await route.fulfill({ json: { jobs: [] } });
    });

    await page.route('**/api/recruiters/applications', async (route) => {
      await route.fulfill({ json: { applications: [application] } });
    });

    await page.goto('/review-applications');
    await expect(
      page.getByRole('heading', { name: /^Applications$/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('Click View Details and validate result', async ({ page }) => {
    const viewDetailsBtn = page.getByRole('button', { name: /view details/i });

    await expect(viewDetailsBtn.first()).toBeVisible({ timeout: 15000 });
    await viewDetailsBtn.first().click();

    const modal = page.locator('div.fixed.inset-0.z-50').last();

    await expect(
      modal.getByRole('heading', { name: /Applicant Details/i }),
    ).toBeVisible({ timeout: 15000 });

    await expect(modal.getByText(/Backend Developer at TrueHire QA/i)).toBeVisible();
    await expect(modal.getByText(/^Under Review$/i)).toBeVisible();
    await expect(modal.getByRole('button', { name: /Close/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /View Profile/i })).toBeVisible();
  });
});
