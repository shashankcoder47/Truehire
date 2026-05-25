const { test, expect } = require("@playwright/test");

const clickAndWaitForUrl = async (page, locator, urlPattern) => {
  await expect(locator).toBeVisible({ timeout: 15000 });
  await Promise.all([
    page.waitForURL(urlPattern, { timeout: 20000 }),
    locator.click({ force: true }),
  ]);
};

test.describe("Recruiter Login Page", () => {
  const gotoRecruiterLogin = async (page) => {
    await page.goto("/login?role=recruiter", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { level: 1, name: /^Recruiter Login$/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("should display all fields, buttons, and links", async ({ page }) => {
    await gotoRecruiterLogin(page);

    await expect(
      page.getByRole("heading", { level: 1, name: /^Recruiter Login$/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("textbox", { name: /^Email address$/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("textbox", { name: /^Password$/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("checkbox", { name: /Show password/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Forgot password\?/i }),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: /^Login$/i })).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Create a new account/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Back to Home/i }),
    ).toBeVisible();
  });

  test("should toggle show password checkbox", async ({ page }) => {
    await gotoRecruiterLogin(page);

    const passwordInput = page.getByRole("textbox", { name: /^Password$/i });
    const checkbox = page.getByRole("checkbox", { name: /Show password/i });

    await expect(passwordInput).toHaveAttribute("type", "password");
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("should fill login form and click login", async ({ page }) => {
    await gotoRecruiterLogin(page);

    await page
      .getByRole("textbox", { name: /^Email address$/i })
      .fill("recruiter@test.com");
    await page.getByRole("textbox", { name: /^Password$/i }).fill("123456");

    await page.getByRole("button", { name: /^Login$/i }).click();
  });

  test("should open forgot password link", async ({ page }) => {
    await gotoRecruiterLogin(page);

    await clickAndWaitForUrl(
      page,
      page.getByRole("link", { name: /Forgot password\?/i }),
      /forgot-password|recruiter-forgot-password/i,
    );
    await expect(
      page.getByRole("heading", { name: /Forgot your password\?/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("should open create new account link", async ({ page }) => {
    await gotoRecruiterLogin(page);

    await clickAndWaitForUrl(
      page,
      page.getByRole("link", { name: /Create a new account/i }),
      /register/i,
    );
  });

  test("should go back to home", async ({ page }) => {
    await gotoRecruiterLogin(page);

    await clickAndWaitForUrl(
      page,
      page.getByRole("link", { name: /Back to Home/i }),
      /\/$/,
    );
  });
});
