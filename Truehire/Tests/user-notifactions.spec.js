const { test, expect } = require("@playwright/test");

test.describe("Notifications / Inbox Flow Test", () => {
  const user = {
    id: 801,
    name: "V Shashank",
    email: "shashank@example.com",
    role: "user",
    profile_complete: true,
    created_at: "2024-01-10T10:00:00.000Z",
    registration_number: "TH-USER-801",
  };

  const recruiterJobs = [
    {
      id: "501",
      title: "Python Developer",
      company: "AFGD",
      location: "Bihar",
      type: "Full-time",
      salary: "INR 600000 - 900000",
      posted: "1 day ago",
    },
  ];

  const applications = [
    {
      id: "101",
      jobId: "501",
      jobTitle: "Python Developer",
      company: "AFGD",
      location: "Bihar",
      salary: "INR 600000 - 900000",
      status: "Shortlisted",
      appliedDate: "Mon Apr 28 2026",
      viewTimeSeconds: 125,
      videoStatus: "Video Pending",
    },
  ];

  const notifications = [
    {
      id: "901",
      message: "A recruiter sent you a message about Python Developer.",
      status: "unread",
      createdAt: "2026-05-03T10:00:00.000Z",
      metadata: {
        title: "New recruiter message",
        actions: {
          primary: {
            label: "Open Inbox",
            href: "/inbox",
          },
        },
      },
    },
  ];

  const conversations = [
    {
      applicationId: 101,
      jobId: 501,
      jobTitle: "Python Developer",
      jobCompany: "AFGD",
      jobLocation: "Bihar",
      recruiterName: "Asha Recruiter",
      lastMessage: "Thanks for applying. Can we schedule a call?",
      lastMessageAt: "2026-05-03T11:00:00.000Z",
      unreadCount: 2,
      applicationStatus: "APPLIED",
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
      },
      { token: fakeJwt, currentUser: user },
    );

    await page.route("**/api/users/profile/me", async (route) => {
      await route.fulfill({ json: { user } });
    });

    await page.route("**/api/jobs/user/applications", async (route) => {
      await route.fulfill({ json: { success: true, applications } });
    });

    await page.route("**/api/jobs", async (route) => {
      await route.fulfill({ json: { success: true, jobs: recruiterJobs } });
    });

    await page.route("**/api/notifications", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          notifications,
          unreadCount: 1,
        },
      });
    });

    await page.route("**/api/notifications/unread-count", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          unreadCount: 1,
        },
      });
    });

    await page.route("**/api/messages/conversations", async (route) => {
      await route.fulfill({
        json: {
          conversations,
          totalUnread: 2,
        },
      });
    });
  });

  test("opens inbox from notifications card and validates conversation actions", async ({ page }) => {
    await page.goto("/overview", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /welcome back, v shashank/i }),
    ).toBeVisible({ timeout: 15000 });

    const notificationsCard = page.getByRole("link").filter({ hasText: /notifications/i }).first();
    await expect(notificationsCard).toBeVisible();
    await notificationsCard.click();

    await expect(page).toHaveURL(/\/inbox(?:\?|$)/i);
    await expect(
      page.getByRole("heading", { level: 1, name: /your conversations/i }),
    ).toBeVisible();

    const unreadBadge = page.getByText(/Unread\s*2/i).first();
    const refreshBtn = page.getByRole("button", { name: /^Refresh$/i });

    await expect(unreadBadge).toBeVisible();
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    await expect(
      page.getByText(/Messages with recruiters per application\./i),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Python Developer/i })).toBeVisible();
    await expect(page.getByText("AFGD", { exact: true })).toBeVisible();
    await expect(page.getByText(/Thanks for applying\. Can we schedule a call\?/i)).toBeVisible();

    const conversationRow = page.getByRole("button", {
      name: /Python Developer.*Asha Recruiter/i,
    });
    await expect(conversationRow).toBeVisible();
    await expect(conversationRow).toContainText("2");
    await expect(conversationRow).toContainText("Open");

    await conversationRow.click();
    await expect(page).toHaveURL(/\/messages\/101(?:\?|$)/i);
  });
});
