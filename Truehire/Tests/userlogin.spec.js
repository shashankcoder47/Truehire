// File: user-login.spec.js
// Run: npx playwright test user-login.spec.js

const { test, expect } = require("@playwright/test");

test.describe("TrueHire User Login Page Testing", () => {
  const gotoUserLogin = async (page) => {
    await page.goto("/login?role=user", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /^User Login$/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("User login page loads correctly", async ({ page }) => {
    await gotoUserLogin(page);

    // Logo
    await expect(page.getByText(/TRUEHIRE/i)).toBeVisible();

    // Heading
    await expect(
      page.getByRole("heading", { level: 1, name: /^User Login$/i }),
    ).toBeVisible();

    // Description
    await expect(
      page
        .getByText(
          /Sign in to continue your job search and track applications\./i,
        )
        .first(),
    ).toBeVisible();
  });

  test("All inputs visible", async ({ page }) => {
    await gotoUserLogin(page);

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Checkbox
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });

  test("All buttons visible", async ({ page }) => {
    await gotoUserLogin(page);

    await expect(page.getByRole("button", { name: /^Login$/i })).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Continue with Google/i }),
    ).toBeVisible();
  });

  test("Links visible", async ({ page }) => {
    await gotoUserLogin(page);

    await expect(page.getByText(/Forgot password/i)).toBeVisible();
    await expect(page.getByText(/Create a new account/i)).toBeVisible();
    await expect(page.getByText(/Back to Home/i)).toBeVisible();
  });

  test("Show password checkbox click", async ({ page }) => {
    await gotoUserLogin(page);

    const checkbox = page.locator('input[type="checkbox"]');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test("Fill login form and click login", async ({ page }) => {
    await gotoUserLogin(page);

    await page.locator('input[type="email"]').fill("test@gmail.com");
    await page.locator('input[type="password"]').fill("123456");

    await page.getByRole("button", { name: /^Login$/i }).click();
  });

  test("Google button click", async ({ page }) => {
    await gotoUserLogin(page);

    await page
      .getByRole("button", {
        name: /Sign in with Google/i,
      })
      .first()
      .click({ force: true });
  });
});
