const { test, expect } = require("@playwright/test");

test.describe("TrueHire User Dashboard Testing", () => {
  const user = {
    id: 201,
    name: "Rakshitha R",
    email: "rakshitha@example.com",
    role: "user",
    profile_complete: true,
    created_at: "2024-01-10T10:00:00.000Z",
    registration_number: "TH-USER-201",
  };

  const jobs = [
    {
      id: 1,
      title: "Python Developer",
      company: "AlphaTech",
      location: "Remote",
      posted: "1 day ago",
      type: "Full-time",
      salary: "$90k - $120k",
    },
    {
      id: 2,
      title: "Java Developer",
      company: "BetaWorks",
      location: "New York, NY",
      posted: "2 days ago",
      type: "Full-time",
      salary: "$100k - $140k",
    },
    {
      id: 3,
      title: "Full Stack Developer",
      company: "InsightAI",
      location: "San Francisco, CA",
      posted: "3 days ago",
      type: "Contract",
      salary: "$60/hr - $90/hr",
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

        window.localStorage.setItem(
          "recentActivityLog",
          JSON.stringify([
            {
              id: "activity-1",
              title: "Profile updated",
              description: "Resume refreshed",
              timestamp: Date.now() - 60_000,
            },
          ]),
        );
      },
      { token: fakeJwt, currentUser: user },
    );

    await page.route("**/api/users/profile/me", async (route) => {
      await route.fulfill({ json: { user } });
    });

    await page.route("**/api/jobs", async (route) => {
      await route.fulfill({ json: { jobs } });
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

  const gotoDashboard = async (page) => {
    await page.goto("/overview", { waitUntil: "domcontentloaded" });

    const loadingText = page.getByText(/Loading your overview/i);
    const heading = page.getByRole("heading", { name: /TrueHire Dashboard/i });

    await loadingText.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    await expect(heading).toBeVisible({ timeout: 15000 });
  };

  test("User dashboard loads correctly", async ({ page }) => {
    await gotoDashboard(page);

    await expect(
      page.getByRole("heading", { name: /TrueHire Dashboard/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /Welcome back, Rakshitha R!/i }),
    ).toBeVisible();
  });

  test("Top notification/profile button visible", async ({ page }) => {
    await gotoDashboard(page);

    const menuButton = page.getByRole("button", { name: /Open menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    await expect(page.getByText("Navigate your account", { exact: true })).toBeVisible();
  });

  test("Applications and profile cards visible", async ({ page }) => {
    await gotoDashboard(page);

    await expect(
      page.getByRole("heading", { name: /^Applications$/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Messages$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Saved Jobs$/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Manage Profile$/i }),
    ).toBeVisible();
  });

  test("Quick actions cards visible", async ({ page }) => {
    await gotoDashboard(page);

    await expect(
      page.getByRole("heading", { name: /Quick Actions/i }),
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: /Browse Jobs/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /View Companies/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Career Center/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Sliding Puzzle/i }),
    ).toBeVisible();
  });

  test("Recent activity section visible", async ({ page }) => {
    await gotoDashboard(page);

    await expect(
      page.getByRole("heading", { name: /Recent Activity/i }),
    ).toBeVisible();
    await expect(page.getByText("Profile updated", { exact: true })).toBeVisible();
  });

  test("Latest recruiters jobs visible", async ({ page }) => {
    await gotoDashboard(page);

    await expect(
      page.getByRole("heading", { name: /Latest from Recruiters/i }),
    ).toBeVisible();

    await expect(page.getByText("Python Developer", { exact: true })).toBeVisible();
    await expect(page.getByText("Java Developer", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Full Stack Developer", { exact: true }),
    ).toBeVisible();
  });

  test("Apply buttons clickable", async ({ page }) => {
    await gotoDashboard(page);

    const applyButtons = page.getByRole("link", { name: /^Apply$/i });
    await expect(applyButtons).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      await expect(applyButtons.nth(i)).toBeVisible();
    }
  });
});
