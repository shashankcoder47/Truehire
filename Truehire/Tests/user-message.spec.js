const { test, expect } = require("@playwright/test");

test.describe("TrueHire Inbox Page UI Test", () => {
  const user = {
    id: 501,
    name: "Rakshitha",
    email: "rakshitha@example.com",
    role: "user",
    profile_complete: true,
  };

  const conversations = [
    {
      applicationId: 101,
      jobId: 11,
      jobTitle: "Python Developer",
      jobCompany: "AFGD",
      jobLocation: "Bihar",
      recruiterName: "Asha Recruiter",
      lastMessage: "Thanks for applying. Can we schedule a call?",
      lastMessageAt: "2026-04-26T10:00:00.000Z",
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

    await page.route("**/api/messages/conversations", async (route) => {
      await route.fulfill({
        json: {
          conversations,
          totalUnread: 2,
        },
      });
    });
  });

  const gotoInboxPage = async (page) => {
    await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Your conversations/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Validate dropdowns, buttons, and page elements", async ({ page }) => {
    await gotoInboxPage(page);

    await expect(
      page.getByRole("button", { name: /Go to Home Page/i }),
    ).toBeVisible();

    const unreadBadge = page.locator("span").filter({ hasText: /Unread/i }).first();
    await expect(unreadBadge).toBeVisible();
    await expect(unreadBadge).toContainText("2");

    const refreshBtn = page.getByRole("button", { name: /^Refresh$/i });
    await expect(refreshBtn).toBeVisible();
    await expect(refreshBtn).toBeEnabled();
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
    await expect(conversationRow.locator("span").filter({ hasText: /^2$/ })).toBeVisible();
    await expect(conversationRow.getByText("Open", { exact: true })).toBeVisible();
  });
});
