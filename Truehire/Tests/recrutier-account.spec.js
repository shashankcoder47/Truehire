import { test, expect } from '@playwright/test';

const recruiterUser = {
  id: '101',
  name: 'Recruiter Tester',
  email: 'recruiter@example.com',
  role: 'recruiter',
};

const mockToken = 'header.payload.signature';

test.describe('Recruiter Settings Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ token, user }) => {
      for (const storage of [window.sessionStorage, window.localStorage]) {
        storage.setItem('token', token);
        storage.setItem('user', JSON.stringify(user));
        storage.setItem('userData', JSON.stringify(user));
        storage.setItem('role', user.role);
        storage.setItem('isLoggedIn', 'true');
        storage.setItem('recruiterLoggedIn', 'true');
        storage.setItem('recruiterData', JSON.stringify(user));
      }
    }, { token: mockToken, user: recruiterUser });

    await page.route('**/api/recruiters/profile/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          recruiter: recruiterUser,
          data: recruiterUser,
        }),
      });
    });

    await page.route('**/api/recruiters/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            loginType: 'email',
            password: true,
          },
          settings: {
            loginType: 'email',
            password: true,
          },
        }),
      });
    });

    await page.route('**/api/recruiters/change-password', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');

      if (payload.newPassword !== payload.confirmPassword) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'New password and confirmation do not match',
          }),
        });
        return;
      }

      if (payload.currentPassword !== 'oldpassword') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Current password is incorrect',
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password updated successfully',
        }),
      });
    });

    await page.goto('/recruiter-settings');
    await expect(page).toHaveURL(/recruiter-settings/);
    await expect(
      page.getByRole('heading', { name: 'Account settings' }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('Verify page elements are visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Account settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Account Security' })).toBeVisible();
    await expect(page.getByText('Manage your recruiter login and security preferences.')).toBeVisible();

    await expect(page.getByTestId('current-password')).toBeVisible();
    await expect(page.getByTestId('new-password')).toBeVisible();
    await expect(page.getByTestId('confirm-password')).toBeVisible();

    await expect(page.getByTestId('change-password-btn')).toBeVisible();
    await expect(page.getByTestId('back-dashboard-btn')).toBeVisible();
  });

  test('Verify password visibility toggle', async ({ page }) => {
    const currentPassword = page.getByTestId('current-password');

    await expect(currentPassword).toHaveAttribute('type', 'password');
    await page.getByTestId('current-password-toggle').click();
    await expect(currentPassword).toHaveAttribute('type', 'text');
  });

  test('Validate password mismatch error', async ({ page }) => {
    await page.getByTestId('current-password').fill('oldpassword');
    await page.getByTestId('new-password').fill('newpassword123');
    await page.getByTestId('confirm-password').fill('differentpassword');

    await page.getByTestId('change-password-btn').click();

    await expect(page.getByText(/do not match/i)).toBeVisible();
  });

  test('Submit valid password change', async ({ page }) => {
    await page.getByTestId('current-password').fill('oldpassword');
    await page.getByTestId('new-password').fill('newpassword123');
    await page.getByTestId('confirm-password').fill('newpassword123');

    await page.getByTestId('change-password-btn').click();

    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test('Back to Dashboard button navigation', async ({ page }) => {
    await page.getByTestId('back-dashboard-btn').click();
    await expect(page).toHaveURL(/recruiter-dashboard/);
  });
});
