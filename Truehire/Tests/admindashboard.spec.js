const { test, expect } = require("@playwright/test");

test.describe("TrueHire Admin Command Center Testing", () => {
  const adminUser = {
    id: 1,
    name: "TrueHire Admin",
    email: "admin@truehire.test",
    role: "admin",
  };

  const dashboardStats = {
    stats: {
      totalUsers: 128,
      totalRecruiters: 24,
      totalJobs: 73,
      totalApplications: 412,
    },
    recentUsers: [
      { id: 101, name: "Ava Johnson", email: "ava@example.com", role: "user" },
      { id: 102, name: "Liam Patel", email: "liam@example.com", role: "user" },
    ],
    recentRecruiters: [
      { id: 201, name: "Mia Recruiter", company: "TrueHire Labs" },
      { id: 202, name: "Noah Hiring", company: "Orbit Careers" },
    ],
  };

  const usersResponse = {
    users: [
      {
        id: 11,
        name: "Ava Johnson",
        email: "ava@example.com",
        registration_number: "USR-001",
        status: "Active",
        role: "user",
        created_at: "2026-04-20T10:00:00.000Z",
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const recruitersResponse = {
    recruiters: [
      {
        id: 21,
        name: "Mia Recruiter",
        email: "mia@truehirelabs.test",
        company: "TrueHire Labs",
        approval_status: "APPROVED",
        status: "Active",
        created_at: "2026-04-18T10:00:00.000Z",
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const approvalsResponse = {
    recruiters: [
      {
        id: 31,
        name: "Nora Pending",
        email: "nora@orbit.test",
        official_email: "nora@orbit.test",
        company_name: "Orbit Careers",
        approval_status: "Pending Approval",
        created_at: "2026-04-19T10:00:00.000Z",
        documents: [],
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const jobsResponse = {
    jobs: [
      {
        id: 41,
        title: "Frontend Engineer",
        company: "TrueHire Labs",
        status: "Active",
        created_at: "2026-04-17T10:00:00.000Z",
      },
    ],
    pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
  };

  const applicationsResponse = {
    applications: [
      {
        id: 51,
        applicant_name: "Ava Johnson",
        job_title: "Frontend Engineer",
        status: "Applied",
        created_at: "2026-04-21T10:00:00.000Z",
      },
    ],
    pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
  };

  const companiesResponse = {
    companies: [
      {
        id: 61,
        company_name: "TrueHire Labs",
        industry: "Technology",
        company_size: "11-50 employees",
        company_logo: null,
        short_overview: "Recruitment software company.",
        description: "Recruitment software company.",
        created_at: "2026-04-16T10:00:00.000Z",
      },
    ],
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
      await route.fulfill({ json: dashboardStats });
    });

    await page.route("**/api/admin/users?*", async (route) => {
      await route.fulfill({ json: usersResponse });
    });

    await page.route("**/api/admin/recruiters?*", async (route) => {
      await route.fulfill({ json: recruitersResponse });
    });

    await page.route("**/api/admin/recruiter-approvals?*", async (route) => {
      await route.fulfill({ json: approvalsResponse });
    });

    await page.route("**/api/admin/jobs?*", async (route) => {
      await route.fulfill({ json: jobsResponse });
    });

    await page.route("**/api/admin/applications?*", async (route) => {
      await route.fulfill({ json: applicationsResponse });
    });

    await page.route("**/api/recruiters/companies", async (route) => {
      await route.fulfill({ json: companiesResponse });
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
              name: "Primary Super Admin",
              email: "superadmin@truehire.test",
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
  });

  const gotoAdminDashboard = async (page) => {
    await page.goto("/admin-dashboard", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin Command Center/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Admin page loads correctly", async ({ page }) => {
    await gotoAdminDashboard(page);

    await expect(
      page.getByRole("heading", { level: 1, name: /Admin Command Center/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /TrueHire Admin/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: /Run platform oversight from a workspace built for decisions/i,
      }),
    ).toBeVisible();
  });

  test("Main action buttons visible", async ({ page }) => {
    await gotoAdminDashboard(page);

    await expect(
      page.getByRole("button", { name: /^Review Approvals$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Manage Users$/i }),
    ).toBeVisible();
  });

  test("Top profile dropdown clickable", async ({ page }) => {
    await gotoAdminDashboard(page);

    const profileButton = page.getByRole("button", { name: /TrueHire Admin/i });
    await expect(profileButton).toBeVisible();

    await profileButton.click();
    await expect(page.getByText(/^Logout$/i)).toBeVisible();
  });

  test("Navigation tabs visible", async ({ page }) => {
    await gotoAdminDashboard(page);

    await expect(page.getByRole("button", { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Users \(/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Recruiters \(/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Recruiter Approvals/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Companies$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Jobs \(/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Applications$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Super Admin/i })).toBeVisible();
  });

  test("Platform snapshot cards visible", async ({ page }) => {
    await gotoAdminDashboard(page);

    await expect(page.getByText(/Registered Users/i)).toBeVisible();
    await expect(page.getByText(/Recruiter Accounts/i)).toBeVisible();
    await expect(page.getByText(/Live Job Records/i)).toBeVisible();
    await expect(page.getByText(/Applications Logged/i)).toBeVisible();
  });

  test("Operational focus cards visible", async ({ page }) => {
    await gotoAdminDashboard(page);

    await expect(page.getByText(/User base/i)).toBeVisible();
    await expect(page.getByText(/Recruiter pipeline/i)).toBeVisible();
    await expect(page.getByText(/Marketplace health/i)).toBeVisible();
  });

  test("Latest activity tables visible", async ({ page }) => {
    await gotoAdminDashboard(page);

    await expect(
      page.getByRole("heading", { level: 2, name: /Latest Activity/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: /Recent Users/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: /Recent Recruiters/i }),
    ).toBeVisible();
  });

  test("Quick action buttons switch tabs", async ({ page }) => {
    await gotoAdminDashboard(page);

    await page.getByRole("button", { name: /^Review Approvals$/i }).click();
    await expect(
      page.getByRole("heading", { level: 3, name: /Recruiter Approvals/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /^Manage Users$/i }).click();
    await expect(
      page.getByRole("heading", { level: 3, name: /All Users/i }),
    ).toBeVisible();
    await expect(page.getByText(/USR-001/i)).toBeVisible();
  });
});
