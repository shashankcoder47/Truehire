const { test, expect } = require("@playwright/test");

test.describe("TrueHire Recruiter Overview UI Test", () => {
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

  const gotoOverview = async (page) => {
    await page.goto("/recruiter-dashboard", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /Build momentum with a dashboard/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Validate navbar buttons, cards and recruiter overview elements", async ({ page }) => {
    await gotoOverview(page);

    await expect(page.getByRole("button", { name: /Go to Home Page/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Raksitha R/i })).toBeVisible();

    await expect(page.getByRole("button", { name: /Post a New Job/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Review Pipeline/i })).toBeVisible();

    const menuButtons = [
      /Post Job/i,
      /Manage Jobs/i,
      /Review Applications/i,
      /Add Sub-Recruiter/i,
    ];

    for (const name of menuButtons) {
      const btn = page.getByRole("button", { name }).first();
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    }

    await expect(page.getByText("Active Roles", { exact: true })).toBeVisible();
    await expect(page.getByText("Fresh Applicants", { exact: true })).toBeVisible();
    await expect(page.getByText("Pending Review", { exact: true })).toBeVisible();
    await expect(page.getByText("Profile Strength", { exact: true })).toBeVisible();
  });
});
