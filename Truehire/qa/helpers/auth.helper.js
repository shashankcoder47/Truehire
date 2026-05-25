export async function logout(page) {
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).or(page.getByText(/logout|sign out/i)).first();
  if (await logoutButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL(/login|\/$/, { timeout: 15_000 }).catch(() => {});
    return;
  }

  await page.evaluate(() => {
    for (const storage of [window.sessionStorage, window.localStorage]) {
      storage.removeItem('token');
      storage.removeItem('adminToken');
      storage.removeItem('user');
    }
  });
  await page.goto('/login');
}
