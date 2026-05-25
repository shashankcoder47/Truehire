const { test, expect } = require("@playwright/test");

test.describe("TrueHire Profile Page UI Test", () => {
  const user = {
    id: 701,
    name: "Rakshitha R",
    email: "rakshitha@example.com",
    role: "user",
    profile_complete: true,
    contact_number: "9876543210",
    current_location: "Pune",
    professional_summary: "Experienced frontend engineer building polished user experiences.",
    core_skills: "React,JavaScript,Node.js",
    secondary_skills: "Testing,Accessibility",
    soft_skills: "Communication,Ownership",
    languages_known: '["English","Hindi"]',
    projects: JSON.stringify([
      {
        title: "ATS Platform",
        description: "Built a hiring workflow dashboard.",
        techStack: ["React", "Node.js"],
        link: "https://example.com/ats",
      },
    ]),
    certifications: JSON.stringify([
      {
        name: "AWS Cloud Practitioner",
        issuer: "Amazon",
        year: "2025",
      },
    ]),
    hobbies_interests: "Reading",
    relocated: true,
    profile_visibility: "public",
    profile_completeness_percentage: 88,
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

    await page.route("**/api/connections/**", async (route) => {
      await route.fulfill({ json: { data: [] } });
    });
  });

  const gotoProfilePage = async (page) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Manage Your Story/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Validate profile sections and seeded user data", async ({ page }) => {
    await gotoProfilePage(page);

    await expect(
      page.getByRole("button", { name: /Go to Home Page/i }),
    ).toBeVisible();

    await expect(page.getByText("Rakshitha R", { exact: true })).toBeVisible();
    await expect(page.getByText("Pune", { exact: true })).toBeVisible();
    await expect(page.getByText(/Visibility:\s*public/i)).toBeVisible();
    await expect(page.getByText(/Profile Completion:\s*\d+%/i)).toBeVisible();

    await expect(
      page.getByRole("heading", { level: 2, name: /Personal Information/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: /Core Skills/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: /Projects/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: /Certifications/i }),
    ).toBeVisible();

    await expect(page.getByText("React", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("JavaScript", { exact: true })).toBeVisible();
    await expect(page.getByText("Node.js", { exact: true }).first()).toBeVisible();

    await expect(page.getByText("ATS Platform", { exact: true })).toBeVisible();
    await expect(page.getByText(/Built a hiring workflow dashboard\./i)).toBeVisible();
    await expect(page.getByText("AWS Cloud Practitioner", { exact: true })).toBeVisible();
    await expect(page.getByText("Amazon", { exact: true })).toBeVisible();
    await expect(page.getByText("2025", { exact: true })).toBeVisible();
  });
});
