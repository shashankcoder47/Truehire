const { test, expect } = require("@playwright/test");

test.describe("TrueHire Recruiter Approvals Page UI Test", () => {
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

    await page.route("**/api/admin/recruiter-approvals?*", async (route) => {
      await route.fulfill({
        json: {
          recruiters: [
            {
              id: 31,
              name: "Rakshitha R",
              email: "rakshu@truehire.test",
              official_email: "rakshu@truehire.test",
              company_name: "Rakshu",
              approval_status: "Pending Approval",
              created_at: "2026-04-19T10:00:00.000Z",
              documents: [
                {
                  id: "doc-1",
                  doc_type: "Business License",
                  file_path: "/uploads/doc.pdf",
                  status: "Pending",
                },
              ],
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      });
    });

    await page.route("**/api/admin/users?*", async (route) => {
      await route.fulfill({
        json: {
          users: [{ id: 11, name: "Rakshitha R", email: "rakshitha@example.com", registration_number: "USR-001" }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      });
    });

    await page.route("**/api/admin/recruiters?*", async (route) => {
      await route.fulfill({
        json: {
          recruiters: [{ id: 21, name: "Demo Recruiter", company: "TrueHire Labs", approval_status: "APPROVED" }],
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
        json: { companies: [{ id: 61, company_name: "TrueHire Labs", industry: "Technology", company_size: "11-50" }] },
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

  test("Validate filters, dropdowns, cards, buttons and textareas", async ({ page }) => {
    await page.goto("/admin-dashboard", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/admin-dashboard$/i, { timeout: 30000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin Command Center/i }),
    ).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /Recruiter Approvals/i }).first().click();

    await expect(
      page.getByRole("heading", { level: 3, name: /Recruiter Approvals/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Review recruiter registrations before full access is granted\./i),
    ).toBeVisible();

    const searchInput = page.getByPlaceholder(/Name, company, or email/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Rakshitha");

    const statusDropdown = page.locator("select").first();
    await expect(statusDropdown).toBeVisible();

    const applyBtn = page.getByRole("button", { name: /Apply Filters/i });
    const clearBtn = page.getByRole("button", { name: /Clear Filters/i });
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toBeEnabled();
    await applyBtn.click();

    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toBeEnabled();
    await clearBtn.click();

    await expect(page.getByText("Rakshitha R", { exact: true })).toBeVisible();
    await expect(page.getByText("Rakshu", { exact: true })).toBeVisible();
    const approvalCard = page
      .locator("div.rounded-xl")
      .filter({ has: page.getByText("Rakshitha R", { exact: true }) })
      .first();
    await expect(approvalCard.getByText("Pending Approval", { exact: true })).toBeVisible();

    const viewDoc = page.getByRole("link", { name: /View document/i }).first();
    await expect(viewDoc).toBeVisible();

    const reasonBox = page.locator("textarea").first();
    await expect(reasonBox).toBeVisible();
    await reasonBox.fill("Incomplete verification documents.");

    const approveBtn = page.getByRole("button", { name: /^Approve$/i }).first();
    const rejectBtn = page.getByRole("button", { name: /^Reject$/i }).first();
    await expect(approveBtn).toBeVisible();
    await expect(approveBtn).toBeEnabled();
    await expect(rejectBtn).toBeVisible();
    await expect(rejectBtn).toBeEnabled();
  });
});
