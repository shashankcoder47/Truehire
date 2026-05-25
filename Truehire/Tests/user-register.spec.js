const { test, expect } = require("@playwright/test");

test.describe("Registration Page", () => {
  const gotoRegisterPage = async (page) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { level: 2, name: /^Create your account$/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("should display top registration toggle buttons", async ({ page }) => {
    await gotoRegisterPage(page);

    await expect(
      page.getByRole("button", { name: /^User Registration$/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /^Recruiter Registration$/i }),
    ).toBeVisible();
  });

  test("should display all main buttons and link on user registration", async ({
    page,
  }) => {
    await gotoRegisterPage(page);

    await expect(page.getByRole("button", { name: /^Back$/i })).toBeVisible();

    await expect(
      page.getByRole("button", { name: /^Show$/i }).first(),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /^Show$/i }).nth(1),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /^Refresh$/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /^Create Account$/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Sign in instead/i }),
    ).toBeVisible();
  });

  test("should allow switching from user registration to recruiter registration", async ({
    page,
  }) => {
    await gotoRegisterPage(page);

    await page
      .getByRole("button", { name: /^Recruiter Registration$/i })
      .click();

    await expect(
      page.getByRole("button", { name: /^Recruiter Registration$/i }),
    ).toBeVisible();
  });

  test("should toggle password visibility", async ({ page }) => {
    await gotoRegisterPage(page);

    const passwordInput = page.locator('input[type="password"]').first();
    const showButton = page.getByRole("button", { name: /^Show$/i }).first();

    await expect(passwordInput).toHaveAttribute("type", "password");
    await showButton.click();

    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test("should click refresh captcha button", async ({ page }) => {
    await gotoRegisterPage(page);

    await page.getByRole("button", { name: /^Refresh$/i }).click();
  });

  test("should fill user registration form and click create account", async ({
    page,
  }) => {
    await gotoRegisterPage(page);

    await page.route("**/api/auth/register/user", async (route) => {
      await route.fulfill({
        json: {
          token: "test-token",
          user: {
            id: 1,
            name: "Test User",
            email: "testuser@example.com",
            role: "user",
          },
        },
      });
    });

    await page.getByLabel(/Full Name/i).fill("Test User");
    await page.getByLabel(/Email Address/i).fill("testuser@example.com");

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill("Test@1234");
    await passwordInputs.nth(1).fill("Test@1234");

    const captchaText = (await page.locator("div.font-mono").first().textContent())?.trim();
    await page.getByLabel(/Verification Code/i).fill(captchaText || "");

    await page.getByRole("button", { name: /^Create Account$/i }).click();
    await expect(page).toHaveURL(/\/login\?registered=1$/);
  });

  test("should open sign in instead link", async ({ page }) => {
    await gotoRegisterPage(page);

    await page.getByRole("link", { name: /Sign in instead/i }).click();
    await expect(page).toHaveURL(/login/i);
  });
});
