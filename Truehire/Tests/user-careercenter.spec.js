const { test, expect } = require("@playwright/test");

test.describe("TrueHire Career Resources Page UI Test", () => {
  const gotoCareerResourcesPage = async (page) => {
    await page.goto("/career-resources", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Advance your career journey/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Validate dropdowns, buttons, links and cards", async ({ page }) => {
    await gotoCareerResourcesPage(page);

    await expect(page.getByRole("button", { name: /Go to Home Page/i })).toBeVisible();

    const loginBtn = page.locator('button:has-text("Login"), a:has-text("Login")').first();
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeEnabled();

    const registerBtn = page.locator('button:has-text("Register"), a:has-text("Register")').first();
    await expect(registerBtn).toBeVisible();
    await expect(registerBtn).toBeEnabled();

    await expect(page.getByText(/Playbooks, labs, mentorship/i)).toBeVisible();
    await expect(page.getByText(/Guides for every career stage/i)).toBeVisible();
    await expect(page.getByText(/Same immersive experience/i)).toBeVisible();

    const viewAllLink = page.locator('a[href="/learning-hub"]', { hasText: /View All Resources/i }).first();
    await expect(viewAllLink).toBeVisible();
    await expect(viewAllLink).toHaveAttribute("href", "/learning-hub");

    const resumeCardLink = page.locator('a[href="/resume-guide"]').first();
    await expect(resumeCardLink).toBeVisible();
    await expect(resumeCardLink.getByRole("heading", { name: /Resume Writing Guide/i })).toBeVisible();
    await expect(resumeCardLink.getByText(/Open playbook/i)).toBeVisible();
    await expect(resumeCardLink).toHaveAttribute("href", "/resume-guide");

    const interviewCardLink = page.locator('a[href="/interview-practice"]').first();
    await expect(interviewCardLink).toBeVisible();
    await expect(interviewCardLink.getByRole("heading", { name: /Interview Practice/i })).toBeVisible();
    await expect(interviewCardLink.getByText(/Open playbook/i)).toBeVisible();
    await expect(interviewCardLink).toHaveAttribute("href", "/interview-practice");
  });
});
