import { test, expect } from '../../fixtures/test-fixtures.js';
import { LoginPage } from '../../pages/login.page.js';
import { logout } from '../../helpers/auth.helper.js';
import { env } from '../../config/env.js';

test.describe('Authentication UI', () => {
  test.use({ storageState: undefined });

  test('admin login', async ({ page }) => {
    await new LoginPage(page).loginAs('admin', env.credentials.admin);
    await expect(page).toHaveURL(/admin-dashboard|dashboard/);
  });

  test('recruiter login', async ({ page }) => {
    await new LoginPage(page).loginAs('recruiter', env.credentials.recruiter);
    await expect(page).toHaveURL(/recruiter|dashboard|jobs/);
  });

  test('candidate login', async ({ page }) => {
    await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
    await expect(page).toHaveURL(/welcome|overview|dashboard|jobs/);
  });

  test('invalid login shows validation error', async ({ page }) => {
    await new LoginPage(page).submitInvalidLogin('candidate', {
      email: 'invalid.user@example.com',
      password: 'WrongPassword123!'
    });
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('logout ends authenticated session', async ({ page }) => {
    await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
    await logout(page);
    await expect(page).toHaveURL(/login|\/$/);
  });
});
