const { test, expect } = require("@playwright/test");

test.describe("Application view details flow", () => {
  const user = {
    id: 201,
    name: "Rakshitha R",
    email: "rakshitha@example.com",
    role: "user",
    profile_complete: true,
    created_at: "2024-01-10T10:00:00.000Z",
    registration_number: "TH-USER-201",
  };

  const applications = [
    {
      id: 101,
      jobId: 501,
      jobTitle: "Data Scientist",
      company: "InsightAI",
      location: "Remote",
      salary: "$120k - $140k",
      appliedDate: "2 days ago",
      status: "Shortlisted",
      viewTimeSeconds: 125,
      videoStatus: "Video Pending",
    },
  ];

  const jobDetailsById = {
    501: {
      id: 501,
      title: "Data Scientist",
      company: "InsightAI",
      location: "Remote",
      employment_type: "Full-time",
      salary_min: "120000",
      salary_max: "140000",
      salary_currency: "USD",
      description: "Build and deploy ML models.",
      requirements: "Python, SQL, statistics",
      benefits: "Health insurance, remote work",
      status: "Active",
    },
  };

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

    await page.route("**/api/jobs", async (route) => {
      await route.fulfill({ json: { jobs: [] } });
    });

    await page.route("**/api/jobs/user/applications", async (route) => {
      await route.fulfill({ json: { applications } });
    });

    await page.route("**/api/jobs/*", async (route) => {
      const url = new URL(route.request().url());
      const maybeId = url.pathname.split("/").pop();
      const job = jobDetailsById[maybeId];

      if (job) {
        await route.fulfill({ json: { job } });
        return;
      }

      await route.continue();
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

  test("opens application details from the dashboard flow", async ({ page }) => {
    await page.goto("/overview", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /welcome back, rakshitha r\b/i }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("link", { name: /track applications/i }).click();

    await expect(page).toHaveURL(/\/applications(?:\?|$)/i);
    await expect(
      page.getByRole("heading", { name: /your career journey, organized/i }),
    ).toBeVisible();

    const viewDetailsBtn = page.getByRole("button", { name: /view details/i });
    await expect(viewDetailsBtn.first()).toBeVisible();
    await viewDetailsBtn.first().click();

    const modal = page.getByRole("dialog").or(page.locator(".fixed.inset-0.z-50").first());
    await expect(modal.getByText("Job Details", { exact: true })).toBeVisible();
    await expect(modal.getByRole("heading", { name: /data scientist/i })).toBeVisible();
    await expect(modal.getByText(/build and deploy ml models/i)).toBeVisible();

    const uploadBtn = modal.getByRole("button", { name: /upload introduction video/i });
    const chooseFile = modal.locator('input[type="file"]');
    const messageRecruiter = modal.getByRole("button", { name: /message recruiter/i });
    const closeBtn = modal.getByLabel(/close/i);

    await expect(uploadBtn).toBeVisible();
    await expect(uploadBtn).toBeDisabled();
    await expect(chooseFile).toBeVisible();
    await expect(messageRecruiter).toBeVisible();
    await expect(closeBtn).toBeVisible();

    await messageRecruiter.click();
    await expect(page).toHaveURL(/\/messages\/101(?:\?|$)/i);
  });
});
