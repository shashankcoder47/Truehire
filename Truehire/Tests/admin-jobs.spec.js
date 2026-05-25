const { test, expect } = require("@playwright/test");

test.describe("TrueHire Admin Jobs Page UI Test", () => {
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

    await page.route("**/api/admin/jobs?*", async (route) => {
      await route.fulfill({
        json: {
          jobs: [
            {
              id: 41,
              title: "Python Developer",
              company_name: "TrueHire Labs",
              location: "Bangalore",
              status: "Active",
              created_at: "2026-04-17T10:00:00.000Z",
              application_count: 3,
            },
          ],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
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

    await page.route("**/api/admin/applications?*", async (route) => {
      await route.fulfill({ json: { applications: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } } });
    });

    await page.route("**/api/recruiters/companies", async (route) => {
      await route.fulfill({ json: { companies: [] } });
    });

    await page.route("**/api/admin/super-admin-count", async (route) => {
      await route.fulfill({ json: { count: 1 } });
    });

    await page.route("**/api/admin/super-admins?*", async (route) => {
      await route.fulfill({ json: { superAdmins: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } } });
    });
  });

  test("Validate filters, dropdowns, inputs and buttons", async ({ page }) => {
    await page.goto("/admin-dashboard", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/admin-dashboard$/i, { timeout: 30000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin Command Center/i }),
    ).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /Jobs/i }).first().click();

    await expect(page.getByRole("heading", { level: 3, name: /All Jobs/i })).toBeVisible();

    const keywordInput = page.getByPlaceholder(/Job title, description, or requirements/i);
    await expect(keywordInput).toBeVisible();
    await keywordInput.fill("Python Developer");

    const companyInput = page.getByPlaceholder(/Search by company name/i);
    await expect(companyInput).toBeVisible();
    await companyInput.fill("TrueHire");

    const locationInput = page.getByPlaceholder(/Search by location/i);
    await expect(locationInput).toBeVisible();
    await locationInput.fill("Bangalore");

    const statusDropdown = page.locator("select").first();
    await expect(statusDropdown).toBeVisible();

    const fromDate = page.locator('input[type="date"]').nth(0);
    const toDate = page.locator('input[type="date"]').nth(1);
    await expect(fromDate).toBeVisible();
    await expect(toDate).toBeVisible();
    await fromDate.fill("2026-04-01");
    await toDate.fill("2026-04-30");

    const applyBtn = page.getByRole("button", { name: /Apply Filters/i });
    const clearBtn = page.getByRole("button", { name: /Clear Filters/i });
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toBeEnabled();
    await applyBtn.click();

    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toBeEnabled();
    await clearBtn.click();

    await expect(page.getByText("Python Developer", { exact: true })).toBeVisible();
    await expect(page.getByText("TrueHire Labs", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Delete/i }).first()).toBeVisible();
  });
});
