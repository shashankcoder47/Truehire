const { test, expect } = require("@playwright/test");

test.describe("Profile status flow", () => {
  const user = {
    id: 301,
    name: "V Shashank",
    email: "shashank@example.com",
    role: "user",
    profile_complete: true,
    profile_visibility: "public",
    created_at: "2024-01-10T10:00:00.000Z",
    registration_number: "TH-USER-301",
    contact_number: "9876543210",
    current_location: "Bengaluru",
    professional_summary: "Full-stack developer building reliable hiring workflows.",
    core_skills: "JavaScript,React,Node.js",
    secondary_skills: "Playwright,SQL",
    soft_skills: "Communication,Leadership",
    languages_known: JSON.stringify(["English", "Kannada"]),
    hobbies_interests: "Reading, chess",
    relocated: true,
    profile_completeness_percentage: 100,
    linkedin_url: "linkedin.com/in/shashank",
    github_url: "github.com/shashank",
    portfolio_url: "shashank.dev",
    projects: [
      {
        title: "TrueHire Dashboard",
        description: "Built a recruiter and candidate dashboard.",
        techStack: ["React", "Node.js"],
        link: "https://example.com/project",
      },
    ],
    certifications: [
      {
        name: "AWS Cloud Practitioner",
        issuer: "Amazon",
        year: "2024",
      },
    ],
  };

  const applications = [
    {
      id: "101",
      jobId: "501",
      jobTitle: "Frontend Engineer",
      company: "AlphaTech",
      location: "Remote",
      salary: "INR 1200000 - 1600000",
      status: "Shortlisted",
      appliedDate: "Mon Apr 28 2026",
      viewTimeSeconds: 125,
      videoStatus: "Video Pending",
    },
    {
      id: "102",
      jobId: "502",
      jobTitle: "Backend Engineer",
      company: "BetaWorks",
      location: "Bengaluru",
      salary: "INR 1400000 - 1800000",
      status: "Under Review",
      appliedDate: "Tue Apr 29 2026",
      viewTimeSeconds: 64,
      videoStatus: null,
    },
  ];

  const recruiterJobs = [
    {
      id: "501",
      title: "Frontend Engineer",
      company: "AlphaTech",
      location: "Remote",
      type: "Full-time",
      salary: "INR 1200000 - 1600000",
      posted: "1 day ago",
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

        window.localStorage.setItem("bookmarkedJobs", JSON.stringify(["701", "702", "703"]));
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

  test("opens profile from profile status card and shows current sections", async ({ page }) => {
    await page.goto("/overview", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /welcome back, v shashank/i }),
    ).toBeVisible({ timeout: 15000 });

    const profileStatusCard = page.getByRole("link").filter({ hasText: /profile status/i }).first();
    await expect(profileStatusCard).toBeVisible();
    await profileStatusCard.click();

    await expect(page).toHaveURL(/\/profile(?:\?|$)/i);
    await expect(
      page.getByRole("heading", { name: /manage your story/i }),
    ).toBeVisible();

    await expect(page.getByText(/profile completion:\s*100%/i)).toBeVisible();
    await expect(page.getByText(/visibility:\s*public/i)).toBeVisible();
    await expect(page.getByText(/profile photo/i)).toBeVisible();

    await expect(page.getByRole("heading", { name: /^Personal Information$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Core Skills$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Secondary Skills$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Languages Known$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Soft Skills$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Hobbies & Interests$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Social Links$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Projects$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Certifications$/i })).toBeVisible();

    const editProfileButton = page.getByRole("button", { name: /^Edit Profile$/i });
    await expect(editProfileButton).toBeVisible();
    await editProfileButton.click();

    await expect(page.getByRole("button", { name: /^Save Changes$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Cancel$/i })).toBeVisible();

    await page.getByRole("heading", { name: /^Projects$/i }).scrollIntoViewIfNeeded();
    await expect(page.locator('input[value="TrueHire Dashboard"]')).toBeVisible();
    await expect(page.locator('input[value="AWS Cloud Practitioner"]')).toBeVisible();
  });
});
