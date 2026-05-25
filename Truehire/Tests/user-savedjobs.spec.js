const { test, expect } = require("@playwright/test");

test.describe("TrueHire Saved Jobs Page UI Test", () => {
  const user = {
    id: 601,
    name: "Rakshitha",
    email: "rakshitha@example.com",
    role: "user",
    profile_complete: true,
  };

  const savedJob = {
    id: 101,
    title: "Python Developer",
    company: "AFGD",
    location: "Bihar",
    min_salary: 600000,
    max_salary: 900000,
    experience_level: "Mid",
    employment_type: "Part Time",
    status: "Saved",
    description: "Build backend services and automation workflows.",
    requirements: "Python\nDjango\nREST APIs",
    benefits: "Health insurance\nFlexible schedule",
  };

  const fakeJwt = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: user.id, role: user.role })).toString("base64url"),
    "test-signature",
  ].join(".");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ token, currentUser, bookmarkedJob }) => {
        for (const storage of [window.sessionStorage, window.localStorage]) {
          storage.setItem("token", token);
          storage.setItem("user", JSON.stringify(currentUser));
          storage.setItem("userData", JSON.stringify(currentUser));
          storage.setItem("role", currentUser.role);
          storage.setItem("isLoggedIn", "true");
        }

        window.localStorage.setItem("bookmarkedJobs", JSON.stringify([bookmarkedJob.id]));
        window.localStorage.setItem("bookmarkedJobItems", JSON.stringify([bookmarkedJob]));
      },
      { token: fakeJwt, currentUser: user, bookmarkedJob: savedJob },
    );

    await page.route("**/api/users/profile/me", async (route) => {
      await route.fulfill({ json: { user } });
    });

    await page.route("**/api/jobs?limit=1000", async (route) => {
      await route.fulfill({ json: { jobs: [savedJob] } });
    });

    await page.route("**/api/jobs/101", async (route) => {
      await route.fulfill({ json: { job: savedJob } });
    });
  });

  const gotoSavedJobsPage = async (page) => {
    await page.goto("/saved-jobs", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Your Favorite Opportunities/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Validate buttons and saved job content", async ({ page }) => {
    await gotoSavedJobsPage(page);

    await expect(
      page.getByRole("button", { name: /Go to Home Page/i }),
    ).toBeVisible();

    await expect(page.getByRole("heading", { level: 2, name: /Saved Roles/i })).toBeVisible();
    await expect(page.getByText("Python Developer", { exact: true })).toBeVisible();
    await expect(page.getByText("AFGD", { exact: true })).toBeVisible();
    await expect(page.getByText(/Saved jobs: 1/i)).toBeVisible();
    await expect(page.getByText(/Active bookmarks: 1/i)).toBeVisible();

    const viewDetailsBtn = page.getByRole("button", { name: /View Details/i });
    await expect(viewDetailsBtn).toBeVisible();
    await expect(viewDetailsBtn).toBeEnabled();
    await viewDetailsBtn.click();

    await expect(page.getByText(/Build backend services and automation workflows\./i)).toBeVisible();
    await expect(page.getByText(/^Requirements$/i)).toBeVisible();
    await page.getByLabel("Close").click();
    await expect(page.getByLabel("Close")).toBeHidden();

    const viewApplicationsLink = page.getByRole("link", { name: /View Applications/i });
    await expect(viewApplicationsLink).toBeVisible();
    await expect(viewApplicationsLink).toHaveAttribute("href", "/applications");

    const removeBtn = page.getByRole("button", { name: /^Remove$/i });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    await expect(page.getByText(/Saved jobs: 0/i)).toBeVisible();
    await expect(page.getByText(/No saved jobs yet/i)).toBeVisible();

    const browseJobsBtn = page.getByRole("button", { name: /Browse Jobs/i });
    await expect(browseJobsBtn).toBeVisible();
  });
});
