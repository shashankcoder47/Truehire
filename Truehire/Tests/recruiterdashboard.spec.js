// File: recruiter-dashboard.spec.js
// Run: npx playwright test recruiter-dashboard.spec.js

const { test, expect } = require("@playwright/test");

const clickAndWaitForUrl = async (page, locator, urlPattern) => {
  await expect(locator).toBeVisible({ timeout: 15000 });
  await Promise.all([
    page.waitForURL(urlPattern, { timeout: 20000, waitUntil: "commit" }),
    locator.click({ force: true }),
  ]);
};

test.describe("TrueHire Recruiter Dashboard Testing", () => {
  const recruiter = {
    id: 101,
    name: "Raksitha R",
    email: "raksitha@example.com",
    role: "recruiter",
    company_name: "TrueHire QA",
    subscription_status: "Free",
    job_post_limit: 3,
    job_post_limit_total: 5,
  };

  const fakeJwt = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: recruiter.id, role: recruiter.role })).toString("base64url"),
    "test-signature",
  ].join(".");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ token, user }) => {
        for (const storage of [window.sessionStorage, window.localStorage]) {
          storage.setItem("token", token);
          storage.setItem("user", JSON.stringify(user));
          storage.setItem("userData", JSON.stringify(user));
          storage.setItem("role", user.role);
          storage.setItem("isLoggedIn", "true");
          storage.setItem("recruiterLoggedIn", "true");
          storage.setItem("recruiterData", JSON.stringify(user));
        }
      },
      { token: fakeJwt, user: recruiter },
    );

    await page.route("**/api/recruiters/profile/me", async (route) => {
      await route.fulfill({ json: { recruiter } });
    });

    await page.route("**/api/recruiters/verification", async (route) => {
      await route.fulfill({ json: { status: "Pending", documents: [] } });
    });

    await page.route("**/api/recruiters/notifications", async (route) => {
      await route.fulfill({ json: { notifications: [], unreadCount: 0 } });
    });

    await page.route("**/api/recruiters/*/sub-recruiters", async (route) => {
      await route.fulfill({ json: { sub_recruiters: [] } });
    });

    await page.route("**/api/jobs/recruiter/my-jobs", async (route) => {
      await route.fulfill({ json: { jobs: [] } });
    });

    await page.route("**/api/recruiter/jobs", async (route) => {
      await route.fulfill({ json: { jobs: [] } });
    });

    await page.route("**/api/recruiters/applications", async (route) => {
      await route.fulfill({ json: { applications: [] } });
    });
  });

  const gotoDashboard = async (page) => {
    await page.goto("/recruiter-dashboard");
    await expect(
      page.getByRole("heading", {
        name: /Build momentum with a dashboard/i,
      }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Dashboard loads with buttons and cards", async ({ page }) => {
    await gotoDashboard(page);

    // Navbar Logo
    await expect(
      page.getByRole("button", { name: /Go to Home Page/i }),
    ).toBeVisible();

    // Main Heading
    await expect(
      page.getByRole("heading", {
        name: /Build momentum with a dashboard/i,
      }),
    ).toBeVisible();

    // Main Buttons
    await expect(
      page.getByRole("button", { name: /Post a New Job/i }),
    ).toBeVisible();

    // Stats Cards
    await expect(page.getByText("Active Roles", { exact: true })).toBeVisible();
    await expect(page.getByText("Fresh Applicants", { exact: true })).toBeVisible();
    await expect(page.getByText("Pending Review", { exact: true })).toBeVisible();
    await expect(page.getByText("Profile Strength", { exact: true })).toBeVisible();
  });

  test("Profile button exists", async ({ page }) => {
    await gotoDashboard(page);

    const profile = page.getByRole("button", { name: /Raksitha R/i });
    await expect(profile).toBeVisible();
  });

  test("Quick Action Cards visible", async ({ page }) => {
    await gotoDashboard(page);

    await expect(page.getByRole("button", { name: /Post Job/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Manage Jobs/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Review Applications/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add Sub-Recruiter/i })).toBeVisible();
  });

  test("Open buttons clickable", async ({ page }) => {
    await gotoDashboard(page);

    const openButtons = page.getByText("Open", { exact: true });

    const count = await openButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(openButtons.nth(i)).toBeVisible();
    }
  });

  test("Quick action cards navigate to separate pages", async ({ page }) => {
    await gotoDashboard(page);

    await clickAndWaitForUrl(
      page,
      page.getByRole("button", { name: /Manage Jobs/i }),
      /\/manage-jobs$/,
    );

    await page.goto("/recruiter-dashboard");
    await clickAndWaitForUrl(
      page,
      page.getByRole("button", { name: /Review Applications/i }),
      /\/review-applications$/,
    );

    await page.goto("/recruiter-dashboard");
    await clickAndWaitForUrl(
      page,
      page.getByRole("button", { name: /Add Sub-Recruiter/i }),
      /\/sub-recruiters\?openAdd=1$/,
    );
  });

  test("Post New Job button click", async ({ page }) => {
    await gotoDashboard(page);

    await clickAndWaitForUrl(
      page,
      page.getByRole("button", { name: /Post a New Job/i }),
      /\/post-job/,
    );
  });
});
