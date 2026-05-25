import { test, expect } from '@playwright/test';

test.describe('Job Posting Page Tests', () => {
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
      await route.fulfill({
        json: {
          recruiter: {
            ...recruiter,
            is_premium: false,
            premium_expiry_at: null,
          },
        },
      });
    });

    await page.route('**/api/jobs/recruiter/my-jobs', async (route) => {
      await route.fulfill({ json: { jobs: [] } });
    });

    await page.route('**/api/jobs', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          json: {
            success: true,
            job: {
              id: 501,
              title: 'Backend Developer',
            },
          },
        });
        return;
      }

      await route.fallback();
    });

    await page.goto('/post-job');
    await expect(
      page.getByRole('heading', { name: /Create a Job Posting/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('Fill job details and validate dropdowns & buttons', async ({ page }) => {
    await page.locator('input[name="title"]').fill('Backend Developer');
    await page.locator('input[name="company"]').fill('TrueHire Pvt Ltd');

    await page.locator('select[name="category"]').selectOption({ label: 'IT & Technology' });
    await page.locator('input[name="location"]').fill('Bangalore');

    await page.locator('select[name="type"]').selectOption('FULL_TIME');
    await page.locator('input[name="deadline"]').fill('2026-05-01');
    await page.locator('input[name="contact_email"]').fill('hr@truehire.com');

    await page.locator('select[name="experience_level"]').selectOption('MID_LEVEL');
    await page.locator('input[name="max_applicants"]').fill('50');
    await page.locator('input[name="salary_from_lpa"]').fill('5');
    await page.locator('input[name="salary_to_lpa"]').fill('10');

    await page.locator('textarea[name="description"]')
      .fill('Develop scalable backend systems using Node.js and distributed services.');

    await page.locator('textarea[name="requirements"]').fill('Node.js, Prisma, MySQL');

    await page.locator('textarea[name="benefits"]').fill('Health insurance, Remote work');

    await page.getByLabel('I agree to the Salary Terms').check();

    const urgentBtn = page.getByRole('button', { name: /Mark as Urgent Hiring/i });
    const postBtn = page.getByRole('button', { name: /^Post Job$/i });

    await expect(urgentBtn).toBeVisible();
    await expect(postBtn).toBeVisible();

    await urgentBtn.click();
    await expect(
      page.getByRole('button', { name: /Urgent Hiring Enabled/i }),
    ).toBeVisible();

    await postBtn.click();

    await expect(page.getByText(/Job posted successfully\./i)).toBeVisible();
    await expect(page).toHaveURL(/\/recruiter-dashboard$/, { timeout: 5000 });
  });
});
