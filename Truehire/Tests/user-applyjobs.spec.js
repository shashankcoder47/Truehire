const { test, expect } = require("@playwright/test");

test.describe("Apply Job Flow Test", () => {
  const user = {
    id: 401,
    name: "Shashank V",
    email: "shashank@example.com",
    role: "user",
    profile_complete: true,
    profile_completeness_percentage: 92,
    contact_number: "9876543210",
    current_location: "Bangalore",
    professional_summary: "Data-focused candidate",
    core_skills: "Python,SQL,Machine Learning",
    languages_known: '["English","Hindi"]',
    projects: '["Demand forecasting","Applicant insights"]',
    certifications: '["Google Data Analytics"]',
    current_salary: 300000,
    expected_salary: 500000,
    soft_skills: "Communication,Problem solving",
    hobbies_interests: "Reading",
    relocated: true,
  };

  const job = {
    id: 6,
    title: "Data scientist",
    company: "truerize",
    employment_type: "FULL_TIME",
    location: "qwe",
    description: "Build models, analyze hiring data, and improve candidate-job matching.",
    requirements: "Python\nSQL\nMachine Learning",
    benefits: "Flexible hours\nLearning budget",
  };

  const dashboardJobs = [
    {
      id: 6,
      title: "Data scientist",
      company: "truerize",
      location: "qwe",
      posted: "1 day ago",
      type: "Full-time",
      salary: "INR 6L - 8L",
    },
  ];

  const fakeJwt = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: user.id, role: user.role })).toString("base64url"),
    "test-signature",
  ].join(".");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ token, currentUser }) => {
        for (const storage of [window.sessionStorage, window.localStorage]) {
          storage.setItem("token", token);
          storage.setItem("user", JSON.stringify(currentUser));
          storage.setItem("userData", JSON.stringify(currentUser));
          storage.setItem("role", currentUser.role);
          storage.setItem("isLoggedIn", "true");
        }
      },
      { token: fakeJwt, currentUser: user },
    );

    await page.route("**/api/users/profile/me", async (route) => {
      await route.fulfill({ json: { user } });
    });

    await page.route("**/api/jobs/6/view", async (route) => {
      await route.fulfill({ json: { success: true, views_count: 8 } });
    });

    await page.route("**/api/jobs/6/apply", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          application_id: 1006,
          message: "Your application has been submitted successfully.",
        },
      });
    });

    await page.route("**/api/jobs/6", async (route) => {
      await route.fulfill({ json: { job } });
    });

    await page.route("**/api/jobs", async (route) => {
      await route.fulfill({ json: { jobs: dashboardJobs } });
    });

    await page.route("**/api/notifications", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          notifications: [],
          unreadCount: 0,
        },
      });
    });

    await page.route("**/api/notifications/unread-count", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          unreadCount: 0,
        },
      });
    });
  });

  test("dashboard to apply submission flow works", async ({ page }) => {
    await page.goto("/overview", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Latest from Recruiters/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Data scientist/i).first()).toBeVisible();

    await page.getByRole("link", { name: /^Apply$/i }).first().click();

    await expect(page).toHaveURL(/\/jobs\/6\/apply$/);
    await expect(page.getByText(/Application Preview/i)).toBeVisible();
    await expect(page.getByText(/Data scientist/i).first()).toBeVisible();

    const visibleInputs = page.locator('input:not([type="file"])');

    await visibleInputs.nth(0).fill("Shashank V");
    await visibleInputs.nth(1).fill("shashank@example.com");
    await visibleInputs.nth(2).fill("9876543210");
    await visibleInputs.nth(3).fill("Bangalore");
    await page.locator("select").selectOption("Entry");
    await visibleInputs.nth(4).fill("300000");
    await visibleInputs.nth(5).fill("500000");
    await visibleInputs.nth(6).fill("Immediate");

    await page.setInputFiles('input[type="file"]', {
      name: "resume.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("dummy resume content"),
    });

    await expect(page.getByRole("button", { name: /Submit Application/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Cancel$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Back$/i })).toBeVisible();

    await page.getByRole("button", { name: /Submit Application/i }).click();

    await expect(page.getByRole("heading", { name: /Application Received/i })).toBeVisible();
    await expect(page.getByText(/Your application has been submitted successfully/i)).toBeVisible();
  });
});
