const { test, expect } = require("@playwright/test");

test("TrueHire Homepage Test", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const heroSection = page
    .locator("section")
    .filter({ hasText: /Powered by Truerize AI Matching/i });

  await expect(
    page.getByRole("button", { name: /Go to Home Page/i }),
  ).toBeVisible();

  const loginButton = page.getByRole("button", { name: /^Login$/i });
  const registerButton = page.getByRole("button", { name: /^Register$/i });

  await expect(loginButton).toBeVisible();
  await expect(registerButton).toBeVisible();

  await expect(heroSection.locator("h1")).toBeVisible();
  await expect(
    page.getByText(/Connect with top companies and discover opportunities/i),
  ).toBeVisible();

  await expect(heroSection.getByText("10,000+ Active Jobs", { exact: true })).toBeVisible();
  await expect(heroSection.getByText("500+ Companies", { exact: true })).toBeVisible();
  await expect(
    heroSection.getByRole("heading", { level: 2, name: /Top Companies Hiring/i }),
  ).toBeVisible();

  const companiesLink = heroSection.getByRole("link", { name: /View All Companies/i });
  await expect(companiesLink).toBeVisible();

  await expect(
    page.getByRole("heading", { level: 2, name: /Trusted by Thousands/i }),
  ).toBeVisible();

  await loginButton.click();
  await expect(page.getByText(/Choose login/i)).toBeVisible();
  await expect(page.locator('a[href="/login?role=user"]')).toBeVisible();
  await expect(page.locator('a[href="/login?role=recruiter"]')).toBeVisible();
  await expect(page.locator('a[href="/login?role=admin"]')).toBeVisible();

  await expect(companiesLink).toHaveAttribute("href", "/companies");
});
