const { test, expect } = require("@playwright/test");

test.describe("TrueHire Applications Page UI Test", () => {
  const user = {
    id: 401,
    name: "Rakshitha",
    email: "rakshitha@example.com",
    role: "user",
    profile_complete: true,
  };

  const applications = [
    {
      id: 101,
      jobId: 101,
      jobTitle: "Python Developer",
      company: "AFGD",
      location: "Bihar",
      status: "APPLIED",
      appliedDate: "2 days ago",
      viewTimeSeconds: 90,
    },
  ];

  const job = {
    id: 101,
    title: "Python Developer",
    company: "AFGD",
    location: "Bihar",
    employment_type: "Part Time",
    description: "Build backend services and automation workflows.",
    requirements: "Python\nDjango\nREST APIs",
    benefits: "Health insurance\nFlexible schedule",
    status: "Active",
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

    await page.route("**/api/jobs/user/applications", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ json: { success: true } });
        return;
      }

      await route.fulfill({ json: { applications } });
    });

    await page.route("**/api/jobs/user/applications/101", async (route) => {
      await route.fulfill({ json: { success: true } });
    });

    await page.route("**/api/jobs/101", async (route) => {
      await route.fulfill({ json: { job } });
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
  });

  const gotoApplicationsPage = async (page) => {
    await page.goto("/applications", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Your Career Journey, Organized/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Check application actions", async ({ page }) => {
    await gotoApplicationsPage(page);

    const dashboardBtn = page.getByRole("button", { name: /Back to Dashboard/i });
    await expect(dashboardBtn).toBeVisible();
    await expect(dashboardBtn).toBeEnabled();

    await expect(page.getByText("Python Developer", { exact: true })).toBeVisible();
    await expect(page.getByText("AFGD", { exact: true })).toBeVisible();
    await expect(page.getByText("APPLIED", { exact: true })).toBeVisible();

    const viewDetailsBtn = page.getByRole("button", { name: /View Details/i });
    await expect(viewDetailsBtn).toBeVisible();
    await expect(viewDetailsBtn).toBeEnabled();
    await viewDetailsBtn.click();

    await expect(page.getByRole("heading", { name: /Python Developer/i }).nth(1)).toBeVisible();
    await expect(page.getByText(/Build backend services and automation workflows\./i)).toBeVisible();
    await page.getByLabel("Close").click();
    await expect(page.getByLabel("Close")).toBeHidden();

    page.once("dialog", (dialog) => dialog.accept());

    const withdrawBtn = page.getByRole("button", { name: /^Withdraw$/i });
    await expect(withdrawBtn).toBeVisible();
    await expect(withdrawBtn).toBeEnabled();
    await withdrawBtn.click();

    await expect(page.getByText("Python Developer", { exact: true })).toBeHidden();
    await expect(page.getByRole("heading", { name: /No applications yet/i })).toBeVisible();
  });
});
