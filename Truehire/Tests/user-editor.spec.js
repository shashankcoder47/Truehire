const { test, expect } = require("@playwright/test");

test.describe("Edit Profile Flow", () => {
  const user = {
    id: 201,
    name: "Rakshitha R",
    email: "rakshitha@example.com",
    role: "user",
    profile_complete: true,
    created_at: "2024-01-10T10:00:00.000Z",
    registration_number: "TH-USER-201",
    current_location: "Bengaluru, India",
    professional_summary: "Frontend-focused engineer building polished job search flows.",
    core_skills: ["React", "Next.js", "Playwright"],
    secondary_skills: ["Node.js", "REST APIs"],
    languages_known: ["English", "Kannada"],
    soft_skills: ["Communication", "Collaboration"],
    hobbies_interests: "Reading, sketching",
    profile_completeness_percentage: 82,
    socialLinks: {
      linkedin: "https://linkedin.com/in/rakshitha",
      github: "https://github.com/rakshitha",
      portfolio: "https://rakshitha.dev",
    },
    projects: [
      {
        title: "TrueHire Dashboard",
        description: "Improved job seeker workflows.",
        techStack: ["React", "Playwright"],
        link: "https://example.com/dashboard",
      },
    ],
    certifications: [
      {
        name: "AWS Cloud Practitioner",
        issuer: "AWS",
        year: "2024",
      },
    ],
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
      if (route.request().method() === "PUT") {
        await route.fulfill({ json: { success: true, user } });
        return;
      }

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

    await page.goto("/overview", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: /edit profile/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("Click Edit Profile and validate profile page UI", async ({ page }) => {
    await page.getByRole("button", { name: /edit profile/i }).click();

    await expect(page).toHaveURL(/\/profile(?:\?|$)/i);
    await expect(page.getByRole("heading", { name: /manage your story/i })).toBeVisible();
    await expect(page.getByText(/profile completion/i)).toBeVisible();

    await expect(page.getByRole("heading", { name: /personal information/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /core skills/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /secondary skills/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /languages known/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /soft skills/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /hobbies & interests/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /social links/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /certifications/i })).toBeVisible();

    await expect(page.getByRole("button", { name: /edit profile/i })).toBeVisible();
    await page.getByRole("button", { name: /edit profile/i }).click();

    await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add project/i })).toBeVisible();
  });
});
