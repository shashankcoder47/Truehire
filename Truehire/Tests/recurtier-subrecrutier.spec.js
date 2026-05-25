import { test, expect } from '@playwright/test';

test.describe('Sub-Recruiters Module', () => {
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

  const setupRecruiterSession = async (page, subRecruiters = []) => {
    let createdSubRecruiters = [...subRecruiters];

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

    await page.route('**/api/jobs/recruiter/my-jobs', async (route) => {
      await route.fulfill({ json: { jobs: [] } });
    });

    await page.route('**/api/recruiter/jobs', async (route) => {
      await route.fulfill({ json: { jobs: [] } });
    });

    await page.route('**/api/recruiters/applications', async (route) => {
      await route.fulfill({ json: { applications: [] } });
    });

    await page.route('**/api/recruiters/*/sub-recruiters', async (route) => {
      await route.fulfill({ json: { sub_recruiters: createdSubRecruiters } });
    });

    await page.route('**/api/recruiters/sub-recruiters', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      createdSubRecruiters = [
        ...createdSubRecruiters,
        { id: createdSubRecruiters.length + 1, ...payload },
      ];

      await route.fulfill({
        json: {
          message: 'Sub-recruiter added successfully',
        },
      });
    });
  };

  const gotoSubRecruiters = async (page, { openAdd = false, subRecruiters = [] } = {}) => {
    await setupRecruiterSession(page, subRecruiters);

    const url = openAdd ? '/sub-recruiters?openAdd=1' : '/sub-recruiters';
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /^Sub-Recruiters$/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  const getForm = (page) =>
    page.locator('form').filter({ has: page.getByPlaceholder('Enter full name') });

  test('Navigate to Sub-Recruiters page', async ({ page }) => {
    await gotoSubRecruiters(page);

    await expect(page.getByRole('heading', { name: /^Sub-Recruiters$/i })).toBeVisible();
    await expect(page.getByText('No sub-recruiters yet')).toBeVisible();
  });

  test('Validate form inputs are visible', async ({ page }) => {
    await gotoSubRecruiters(page, { openAdd: true });

    await expect(page.getByText('Add New Sub-Recruiter')).toBeVisible();
    await expect(page.getByPlaceholder('Enter full name')).toBeVisible();
    await expect(page.getByPlaceholder('Enter email address')).toBeVisible();
    await expect(page.getByPlaceholder('Enter password (min 6 characters)')).toBeVisible();
  });

  test('Validate Add Sub-Recruiter buttons', async ({ page }) => {
    await gotoSubRecruiters(page);

    const pageAddButton = page.getByRole('button', { name: /^Add Sub-Recruiter$/i }).first();
    const emptyStateButton = page.getByRole('button', { name: /Add Your First Sub-Recruiter/i });

    await expect(pageAddButton).toBeVisible();
    await expect(pageAddButton).toBeEnabled();
    await expect(emptyStateButton).toBeVisible();
    await expect(emptyStateButton).toBeEnabled();
  });

  test('Submit empty form and keep browser validation active', async ({ page }) => {
    let postCalled = false;
    await setupRecruiterSession(page);

    await page.unroute('**/api/recruiters/sub-recruiters');
    await page.route('**/api/recruiters/sub-recruiters', async (route) => {
      postCalled = true;
      await route.fulfill({ json: { message: 'Sub-recruiter added successfully' } });
    });

    await page.goto('/sub-recruiters?openAdd=1', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /^Sub-Recruiters$/i })).toBeVisible({ timeout: 15000 });

    const nameInput = page.getByPlaceholder('Enter full name');
    const emailInput = page.getByPlaceholder('Enter email address');
    const passwordInput = page.getByPlaceholder('Enter password (min 6 characters)');
    const submitButton = getForm(page).getByRole('button', { name: /^Add Sub-Recruiter$/i });

    await submitButton.click();

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    expect(await nameInput.evaluate((input) => input.matches(':invalid'))).toBeTruthy();
    expect(await emailInput.evaluate((input) => input.matches(':invalid'))).toBeTruthy();
    expect(await passwordInput.evaluate((input) => input.matches(':invalid'))).toBeTruthy();
    expect(postCalled).toBeFalsy();
  });

  test('Fill and submit form', async ({ page }) => {
    await gotoSubRecruiters(page, { openAdd: true });

    await page.getByPlaceholder('Enter full name').fill('Test User');
    await page.getByPlaceholder('Enter email address').fill('testuser@mail.com');
    await page.getByPlaceholder('Enter password (min 6 characters)').fill('123456');

    await getForm(page).getByRole('button', { name: /^Add Sub-Recruiter$/i }).click();

    await expect(page.getByText('No sub-recruiters yet')).toBeHidden();
    await expect(page.getByText('Test User')).toBeVisible();
    await expect(page.getByText('testuser@mail.com')).toBeVisible();
  });

  test('Cancel button works', async ({ page }) => {
    await gotoSubRecruiters(page, { openAdd: true });

    await page.getByPlaceholder('Enter full name').fill('Draft User');
    await page.getByRole('button', { name: /^Cancel$/i }).click();

    await expect(page.getByText('Add New Sub-Recruiter')).toBeHidden();
    await expect(page.getByText('No sub-recruiters yet')).toBeVisible();
  });

  test('Check empty state UI', async ({ page }) => {
    await gotoSubRecruiters(page);

    await expect(page.getByText('No sub-recruiters yet')).toBeVisible();
    await expect(
      page.getByText('Add team members to help manage your recruitment process.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Your First Sub-Recruiter/i })).toBeVisible();
  });

  test('Click Add Your First Sub-Recruiter button', async ({ page }) => {
    await gotoSubRecruiters(page);

    await page.getByRole('button', { name: /Add Your First Sub-Recruiter/i }).click();

    await expect(page.getByText('Add New Sub-Recruiter')).toBeVisible();
    await expect(page.getByPlaceholder('Enter full name')).toBeVisible();
  });
});
