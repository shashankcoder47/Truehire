const { test, expect } = require("@playwright/test");

test.describe("Admin Login Page", () => {
  const gotoAdminLogin = async (page) => {
    await page.goto("/login?role=admin", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /^Admin Login$/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("should display all fields and buttons", async ({ page }) => {
    await gotoAdminLogin(page);

    await expect(
      page.getByRole("heading", { level: 1, name: /^Admin Login$/i }),
    ).toBeVisible();

    await expect(page.getByRole("textbox", { name: /^Email address$/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /^Password$/i })).toBeVisible();

    await expect(
      page.getByRole("checkbox", { name: /Show password/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Login$/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Back to Home/i }),
    ).toBeVisible();
  });

  test("should allow show password checkbox interaction", async ({ page }) => {
    await gotoAdminLogin(page);

    const passwordInput = page.getByRole("textbox", { name: /^Password$/i });
    const checkbox = page.getByRole("checkbox", { name: /Show password/i });

    await expect(passwordInput).toHaveAttribute("type", "password");
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("should fill form and click login button", async ({ page }) => {
    await gotoAdminLogin(page);

    await page.getByRole("textbox", { name: /^Email address$/i }).fill("admin@test.com");
    await page.getByRole("textbox", { name: /^Password$/i }).fill("123456");

    await page.getByRole("button", { name: /^Login$/i }).click();
  });

  test("should navigate using Back to Home link", async ({ page }) => {
    await gotoAdminLogin(page);

    await page.getByRole("link", { name: /Back to Home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
