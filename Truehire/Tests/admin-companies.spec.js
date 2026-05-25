const { test, expect } = require("@playwright/test");

test.describe("TrueHire Admin Companies Page UI Test", () => {
  const adminUser = {
    id: 1,
    name: "TrueHire Admin",
    email: "admin@truehire.test",
    role: "admin",
  };

  const fakeJwt = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: adminUser.id, role: adminUser.role })).toString("base64url"),
    "test-signature",
  ].join(".");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ token, user }) => {
        for (const storage of [window.sessionStorage, window.localStorage]) {
          storage.setItem("token", token);
          storage.setItem("adminToken", token);
          storage.setItem("user", JSON.stringify(user));
          storage.setItem("userData", JSON.stringify(user));
          storage.setItem("adminData", JSON.stringify(user));
          storage.setItem("role", user.role);
          storage.setItem("isLoggedIn", "true");
          storage.setItem("adminLoggedIn", "true");
        }
      },
      { token: fakeJwt, user: adminUser },
    );

    await page.route("**/api/admin/dashboard/stats", async (route) => {
      await route.fulfill({
        json: {
          stats: { totalUsers: 2, totalRecruiters: 1, totalJobs: 1, totalApplications: 1 },
          recentUsers: [{ id: 11, name: "Rakshitha R", email: "rakshitha@example.com" }],
          recentRecruiters: [{ id: 21, name: "Demo Recruiter", company: "TrueHire Labs" }],
        },
      });
    });

    await page.route("**/api/recruiters/companies", async (route) => {
      await route.fulfill({
        json: {
          companies: [
            {
              id: 61,
              company_name: "TrueHire Labs",
              industry: "Technology",
              company_size: "11-50",
              website: "https://truehire.dev",
              short_overview: "Recruitment software company.",
              description: "Recruitment software company.",
            },
          ],
        },
      });
    });

    await page.route("**/api/admin/users?*", async (route) => {
      await route.fulfill({ json: { users: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } } });
    });

    await page.route("**/api/admin/recruiters?*", async (route) => {
      await route.fulfill({ json: { recruiters: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } } });
    });

    await page.route("**/api/admin/recruiter-approvals?*", async (route) => {
      await route.fulfill({ json: { recruiters: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } } });
    });

    await page.route("**/api/admin/jobs?*", async (route) => {
      await route.fulfill({ json: { jobs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } } });
    });

    await page.route("**/api/admin/applications?*", async (route) => {
      await route.fulfill({ json: { applications: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } } });
    });

    await page.route("**/api/admin/super-admin-count", async (route) => {
      await route.fulfill({ json: { count: 1 } });
    });

    await page.route("**/api/admin/super-admins?*", async (route) => {
      await route.fulfill({ json: { superAdmins: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } } });
    });
  });

  test("Validate navbar, filters, dropdowns, table and buttons", async ({ page }) => {
    await page.goto("/admin-dashboard", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/admin-dashboard$/i, { timeout: 30000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin Command Center/i }),
    ).toBeVisible({ timeout: 30000 });

    const navItems = [
      /Overview/i,
      /Users/i,
      /Recruiters/i,
      /Recruiter Approvals/i,
      /^Companies$/i,
      /Jobs/i,
      /Applications/i,
      /Super Admin/i,
    ];

    for (const item of navItems) {
      await expect(page.getByRole("button", { name: item }).first()).toBeVisible();
    }

    await page.getByRole("button", { name: /^Companies$/i }).first().click();

    await expect(page.getByRole("heading", { level: 3, name: /All Companies/i })).toBeVisible();
    await expect(page.getByText(/Company profiles submitted by recruiters/i)).toBeVisible();

    const searchInput = page.getByPlaceholder(/Company name/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("TrueHire");

    const industryDropdown = page.locator("select").nth(0);
    const sizeDropdown = page.locator("select").nth(1);
    await expect(industryDropdown).toBeVisible();
    await expect(sizeDropdown).toBeVisible();

    const applyBtn = page.getByRole("button", { name: /Apply Filters/i });
    const clearBtn = page.getByRole("button", { name: /Clear Filters/i });
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toBeEnabled();
    await applyBtn.click();

    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toBeEnabled();
    await clearBtn.click();

    await expect(page.getByRole("columnheader", { name: /^Company$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Industry$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Size$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Website$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Overview$/i })).toBeVisible();

    await expect(page.getByText("TrueHire Labs", { exact: true })).toBeVisible();
  });
});
