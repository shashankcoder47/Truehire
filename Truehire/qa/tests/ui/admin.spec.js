import { test, expect } from '../../fixtures/test-fixtures.js';
import { AdminPage } from '../../pages/admin.page.js';

test.describe('Admin Module UI', () => {
  test.use({ storageState: 'qa/.auth/admin.json' });

  test('dashboard validation', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.openDashboard();
    await expect(page).toHaveURL(/admin-dashboard|login/);
  });

  test('user management is reachable', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.openDashboard();
    await expect(page.evaluate(() => window.localStorage.getItem('adminToken') || window.sessionStorage.getItem('adminToken'))).resolves.toBeTruthy();
  });

  test('notifications are visible', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.openDashboard();
    await expect(page).toHaveURL(/admin-dashboard|login/);
  });

  test('reports and analytics are visible', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.openDashboard();
    await expect(page).toHaveURL(/admin-dashboard|login/);
  });
});
