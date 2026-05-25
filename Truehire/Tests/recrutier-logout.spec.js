import { test, expect } from '@playwright/test';

test.describe('Recruiter Profile Dropdown & Logout', () => {
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

  const setupRecruiterSession = async (page) => {
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
      await route.fulfill({ json: { applications: [] } });
    });
  };

  const gotoDashboard = async (page) => {
    await setupRecruiterSession(page);
    await page.goto('/recruiter-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /Build momentum with a dashboard/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  const profileButton = (page) => page.getByRole('button', { name: /Raksitha R/i });

  test('Open recruiter dropdown and validate options', async ({ page }) => {
    await gotoDashboard(page);

    await profileButton(page).click();

    await expect(page.getByRole('menu', { name: /Recruiter profile menu/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^View Profile$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^Account Settings$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^Logout$/i })).toBeVisible();
  });

  test('Logout functionality works', async ({ page }) => {
    await gotoDashboard(page);

    await profileButton(page).click();

    await Promise.all([
      page.waitForURL(/\/login\?role=recruiter/i, { timeout: 15000, waitUntil: 'commit' }),
      page.getByRole('menuitem', { name: /^Logout$/i }).click(),
    ]);

    await expect(page).toHaveURL(/\/login\?role=recruiter/i);
    await expect(page.getByRole('heading', { name: /^Recruiter Login$/i }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Login$/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Email address$/i })).toBeVisible();
    await expect(page.getByLabel(/^Password$/i)).toBeVisible();
  });
});
