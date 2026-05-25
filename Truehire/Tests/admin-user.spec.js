const { test, expect } = require("@playwright/test");

test.describe("TrueHire Admin Users Page UI Test", () => {
  const adminUser = {
    id: 1,
    name: "TrueHire Admin",
    email: "admin@truehire.test",
    role: "admin",
  };

  const usersResponse = {
    users: [
      {
        id: 11,
        name: "Rakshitha R",
        email: "rakshitha@example.com",
        registration_number: "USR-001",
        status: "Active",
        role: "user",
        created_at: "2026-04-20T10:00:00.000Z",
      },
      {
        id: 12,
        name: "Demo User",
        email: "demo@example.com",
        registration_number: "USR-002",
        status: "Active",
        role: "user",
        created_at: "2026-04-19T10:00:00.000Z",
      },
    ],
    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
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
          recentRecruiters: [{ id: 21, name: "Mia Recruiter", company: "TrueHire Labs" }],
        },
      });
    });

    await page.route("**/api/admin/users?*", async (route) => {
      await route.fulfill({ json: usersResponse });
    });

    await page.route("**/api/admin/recruiters?*", async (route) => {
      await route.fulfill({
        json: {
          recruiters: [{ id: 21, name: "Mia", company: "TrueHire Labs", approval_status: "APPROVED" }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      });
    });

    await page.route("**/api/admin/recruiter-approvals?*", async (route) => {
      await route.fulfill({
        json: {
          recruiters: [{ id: 31, name: "Nora", company_name: "Orbit", approval_status: "Pending Approval" }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      });
    });

    await page.route("**/api/admin/jobs?*", async (route) => {
      await route.fulfill({
        json: {
          jobs: [{ id: 41, title: "Frontend Engineer", company: "TrueHire Labs", status: "Active" }],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        },
      });
    });

    await page.route("**/api/admin/applications?*", async (route) => {
      await route.fulfill({
        json: {
          applications: [{ id: 51, applicant_name: "Ava", job_title: "Frontend Engineer", status: "Applied" }],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        },
      });
    });

    await page.route("**/api/recruiters/companies", async (route) => {
      await route.fulfill({
        json: {
          companies: [{ id: 61, company_name: "TrueHire Labs", industry: "Technology", company_size: "11-50" }],
        },
      });
    });

    await page.route("**/api/admin/super-admin-count", async (route) => {
      await route.fulfill({ json: { count: 1 } });
    });

    await page.route("**/api/admin/super-admins?*", async (route) => {
      await route.fulfill({
        json: {
          superAdmins: [{ id: 71, name: "Primary Super Admin", email: "superadmin@truehire.test", role: "super_admin" }],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        },
      });
    });
  });

  test("Validate navbar, filters, table and buttons", async ({ page }) => {
    await page.goto("/admin-dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1, name: /Admin Command Center/i })).toBeVisible({ timeout: 15000 });

    const navButtons = [
      /Overview/i,
      /Users/i,
      /Recruiters/i,
      /Recruiter Approvals/i,
      /^Companies$/i,
      /Jobs/i,
      /Applications/i,
      /Super Admin/i,
    ];

    for (const name of navButtons) {
      await expect(page.getByRole("button", { name }).first()).toBeVisible();
    }

    await page.getByRole("button", { name: /Users/i }).first().click();
    await expect(page.getByRole("heading", { level: 3, name: /All Users/i })).toBeVisible();

    const searchInput = page.getByPlaceholder(/Name or email/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Rakshitha");

    const statusDropdown = page.locator("select").first();
    await expect(statusDropdown).toBeVisible();

    const fromDate = page.locator('input[type="date"]').nth(0);
    const toDate = page.locator('input[type="date"]').nth(1);
    await expect(fromDate).toBeVisible();
    await expect(toDate).toBeVisible();
    await fromDate.fill("2026-04-01");
    await toDate.fill("2026-04-30");

    const regId = page.getByPlaceholder(/registration number/i);
    await expect(regId).toBeVisible();
    await regId.fill("USR-001");

    const applyBtn = page.getByRole("button", { name: /Apply Filters/i });
    const clearBtn = page.getByRole("button", { name: /Clear Filters/i });
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toBeEnabled();
    await applyBtn.click();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    await expect(page.getByRole("columnheader", { name: /^Name$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Email$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Status$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Role$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Actions$/i })).toBeVisible();

    await expect(page.getByText("Rakshitha R", { exact: true })).toBeVisible();
    await expect(page.getByText("Demo User", { exact: true })).toBeVisible();

    const deleteBtn = page.getByRole("button", { name: /Delete/i }).first();
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toBeEnabled();
  });
});
