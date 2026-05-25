import { test, expect } from '@playwright/test';

test.describe('Recruiter Profile Page Tests', () => {
  const recruiter = {
    id: 101,
    name: 'Raksitha R',
    email: 'raksitha@example.com',
    role: 'recruiter',
    phone_number: '9876543210',
    company_name: 'TrueHire QA',
    category: 'Hiring',
    industry: 'Technology',
    company_size: '11-50',
    year_founded: '2020',
    website: 'https://truehire.example.com',
    headquarters_location: 'Bangalore',
    short_overview: 'We help teams hire faster.',
    detailed_description: 'QA recruiter profile used for Playwright coverage.',
    linkedin: 'https://linkedin.com/company/truehire',
    instagram: '',
    facebook: '',
    subscription_status: 'Free',
    subscription_expiry: null,
    job_post_limit: 3,
    updated_at: '2026-04-28T10:00:00.000Z',
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
      if (route.request().method() === 'PUT') {
        const payload = route.request().postDataJSON();
        await route.fulfill({ json: { recruiter: { ...recruiter, ...payload } } });
        return;
      }

      await route.fulfill({ json: { recruiter } });
    });

    await page.route('http://localhost:5000/api/recruiters/profile/me', async (route) => {
      if (route.request().method() === 'PUT') {
        const payload = route.request().postDataJSON();
        await route.fulfill({ json: { recruiter: { ...recruiter, ...payload } } });
        return;
      }

      await route.fulfill({ json: { recruiter } });
    });

    await page.route('http://localhost:5000/api/recruiters/profile/logo', async (route) => {
      await route.fulfill({ json: { logoUrl: 'https://example.com/logo.png' } });
    });

    await page.goto('/recruiter-profile');
    await expect(
      page.getByRole('heading', { name: 'Recruiter Profile' }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('Verify page loads and main elements visible', async ({ page }) => {
    await expect(page.getByText('Manage your information')).toBeVisible();
    await expect(page.getByText(/\d+%/)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Edit$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Personal Info/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Company Info/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Subscription/i })).toBeVisible();
  });

  test('Verify tabs switching (Personal, Company, Subscription)', async ({ page }) => {
    const personalTab = page.getByRole('button', { name: /Personal Info/i });
    const companyTab = page.getByRole('button', { name: /Company Info/i });
    const subscriptionTab = page.getByRole('button', { name: /Subscription/i });

    await companyTab.click();
    await expect(page.getByText('Company Logo')).toBeVisible();
    await expect(page.getByText('Company Name')).toBeVisible();
    await expect(page.getByText('Industry')).toBeVisible();

    await subscriptionTab.click();
    await expect(page.getByRole('heading', { name: /Subscription Information/i })).toBeVisible();
    await expect(page.getByText(/Status:/i)).toBeVisible();
    await expect(page.getByText(/Job Posts Left:/i)).toBeVisible();

    await personalTab.click();
    await expect(page.getByText('Full Name')).toBeVisible();
    await expect(page.getByText('Email Address')).toBeVisible();
  });

  test('Verify personal info fields are displayed', async ({ page }) => {
    await expect(page.getByText('Full Name')).toBeVisible();
    await expect(page.getByText('Email Address')).toBeVisible();
    await expect(page.getByText('Job Role')).toBeVisible();
    await expect(page.getByText(recruiter.name)).toBeVisible();
    await expect(page.getByText(recruiter.email)).toBeVisible();
    await expect(page.getByText(recruiter.role, { exact: true })).toBeVisible();
  });

  test('Edit button interaction', async ({ page }) => {
    await page.getByRole('button', { name: /^Edit$/i }).click();

    await expect(page.getByRole('button', { name: /^Save$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Cancel$/i })).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="phone_number"]')).toBeVisible();
  });
});
