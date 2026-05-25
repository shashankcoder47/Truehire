const { test, expect } = require("@playwright/test");

test.describe("TrueHire Sliding Puzzle Page UI Test", () => {
  const user = {
    id: 701,
    name: "Puzzle User",
    email: "puzzle.user@example.com",
    role: "user",
    profile_complete: true,
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
  });

  const gotoSlidingPuzzlePage = async (page) => {
    await page.goto("/sliding-puzzle", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /^Sliding Puzzle$/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Validate buttons, puzzle board and controls", async ({ page }) => {
    await gotoSlidingPuzzlePage(page);

    const backBtn = page.getByRole("button", { name: /Back to Overview/i });
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toBeEnabled();

    const startBtn = page.getByRole("button", { name: /Start \/ Shuffle/i });
    const restartBtn = page.getByRole("button", { name: /^Restart$/i });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();
    await expect(restartBtn).toBeVisible();
    await expect(restartBtn).toBeEnabled();

    await expect(page.getByText(/^Moves$/i)).toBeVisible();
    await expect(page.getByText(/^Time$/i)).toBeVisible();
    await expect(page.getByText(/^Status$/i)).toBeVisible();

    for (let i = 1; i <= 15; i += 1) {
      await expect(page.getByRole("button", { name: String(i), exact: true }).first()).toBeVisible();
    }

    const upBtn = page.getByRole("button", { name: /^Up$/i });
    const leftBtn = page.getByRole("button", { name: /^Left$/i });
    const downBtn = page.getByRole("button", { name: /^Down$/i });
    const rightBtn = page.getByRole("button", { name: /^Right$/i });

    await expect(upBtn).toBeVisible();
    await expect(leftBtn).toBeVisible();
    await expect(downBtn).toBeVisible();
    await expect(rightBtn).toBeVisible();

    await startBtn.click();
    await expect(page.getByText(/^In Progress$/i)).toBeVisible();

    await upBtn.click();
    await leftBtn.click();
    await downBtn.click();
    await rightBtn.click();

    await restartBtn.click();
    await expect(page.getByText(/^Ready$|^In Progress$|^Solved$/i)).toBeVisible();
  });
});
