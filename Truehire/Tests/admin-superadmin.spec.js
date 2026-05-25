const { test, expect } = require("@playwright/test");

test.describe("TrueHire Admin Super Admin Page UI Test", () => {
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

    await page.route("**/api/admin/super-admin-count", async (route) => {
      await route.fulfill({ json: { count: 1 } });
    });

    await page.route("**/api/admin/super-admins?*", async (route) => {
      await route.fulfill({
        json: {
          superAdmins: [
            {
              id: 71,
              name: "Demo Super Admin",
              email: "superadmin@truehire.dev",
              role: "super_admin",
              status: "Active",
              created_at: "2026-04-10T10:00:00.000Z",
              last_login: "2026-04-23T10:00:00.000Z",
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

    await page.route("**/api/admin/jobs?*", async (route) => {
      await route.fulfill({ json: { jobs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } } });
    });

    await page.route("**/api/admin/applications?*", async (route) => {
      await route.fulfill({ json: { applications: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } } });
    });

    await page.route("**/api/recruiters/companies", async (route) => {
      await route.fulfill({ json: { companies: [] } });
    });
  });

  test("Validate count card, list, form fields and buttons", async ({ page }) => {
    await page.goto("/admin-dashboard", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/admin-dashboard$/i, { timeout: 30000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin Command Center/i }),
    ).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /Super Admin/i }).first().click();

    await expect(page.getByRole("heading", { level: 3, name: /All Super Admins/i })).toBeVisible();
    await expect(page.getByText(/Manage Super Admin accounts/i)).toBeVisible();

    await expect(page.getByText(/Current Super Admin Count/i)).toBeVisible();
    await expect(page.getByText(/1\s*\/\s*2/i)).toBeVisible();

    await expect(page.getByText("Demo Super Admin", { exact: true })).toBeVisible();
    await expect(page.getByText("superadmin@truehire.dev", { exact: true })).toBeVisible();

    const deleteBtn = page.getByRole("button", { name: /Delete/i }).first();
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toBeEnabled();

    await expect(page.getByText(/Create New Super Admin/i)).toBeVisible();

    const nameInput = page.getByPlaceholder(/Enter full name/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill("John Admin");

    const emailInput = page.getByPlaceholder(/Enter email address/i);
    await expect(emailInput).toBeVisible();
    await emailInput.fill("johnadmin@test.com");

    const passwordInput = page.getByPlaceholder(/Enter password/i);
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill("Admin123");

    const confirmPassword = page.getByPlaceholder(/Confirm password/i);
    await expect(confirmPassword).toBeVisible();
    await confirmPassword.fill("Admin123");

    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();
    await checkbox.check();

    const createBtn = page.getByRole("button", { name: /Create Super Admin/i });
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });
});
