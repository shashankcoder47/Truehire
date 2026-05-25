const { test, expect } = require("@playwright/test");

test.describe("TrueHire Job Apply Page Testing", () => {
  const user = {
    id: 301,
    name: "Rakshitha",
    email: "rakshitha@gmail.com",
    role: "user",
    profile_complete: true,
    profile_completeness_percentage: 90,
    contact_number: "+919999999999",
    current_location: "Bihar",
    professional_summary: "Experienced developer",
    core_skills: "Python,React,Node.js",
    languages_known: '["English","Hindi"]',
    projects: '["ATS platform"]',
    certifications: '["AWS"]',
    current_salary: 600000,
    expected_salary: 800000,
    soft_skills: "Communication,Ownership",
    hobbies_interests: "Reading",
    relocated: true,
  };

  const job = {
    id: 1,
    title: "Python Developer",
    company: "AFGD",
    employment_type: "Part Time",
    location: "Bihar",
    description: "Build backend services and automation workflows.",
    requirements: "Python\nDjango\nREST APIs",
    benefits: "Health insurance\nFlexible schedule",
  };

  const relatedJobs = [
    job,
    {
      id: 2,
      title: "Frontend Engineer",
      company: "AlphaTech",
      location: "Remote",
      employment_type: "Full Time",
      description: "React development",
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

    await page.route("**/api/jobs/1/view", async (route) => {
      await route.fulfill({ json: { success: true, views_count: 5 } });
    });

    await page.route("**/api/jobs/1/apply", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          application_id: 987,
          message: "Your application has been submitted successfully.",
        },
      });
    });

    await page.route("**/api/jobs/1", async (route) => {
      await route.fulfill({ json: { job } });
    });

    await page.route("**/api/jobs", async (route) => {
      await route.fulfill({ json: { jobs: relatedJobs } });
    });
  });

  const gotoApplyPage = async (page) => {
    await page.goto("/jobs/1/apply", { waitUntil: "domcontentloaded" });

    const loadingText = page.getByText(/Loading job details/i);
    const title = page.getByRole("heading", { name: /Python Developer/i });

    await loadingText.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    await expect(title).toBeVisible({ timeout: 15000 });
  };

  test("Job details page loads correctly", async ({ page }) => {
    await gotoApplyPage(page);

    await expect(
      page.getByRole("heading", { name: /Python Developer/i }),
    ).toBeVisible();
    await expect(page.getByText("AFGD", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Back$/i })).toBeVisible();
  });

  test("Job tags visible", async ({ page }) => {
    await gotoApplyPage(page);

    await expect(page.getByText("Part Time", { exact: true })).toBeVisible();
    await expect(page.getByText("Bihar", { exact: true })).toBeVisible();
  });

  test("Sections visible", async ({ page }) => {
    await gotoApplyPage(page);

    await expect(
      page.getByRole("heading", { name: /Job Description/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Requirements$/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Benefits$/i })).toBeVisible();
  });

  test("Apply form visible", async ({ page }) => {
    await gotoApplyPage(page);

    await expect(
      page.getByRole("heading", { name: /Apply/i }).filter({ hasText: "Professional Form" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Personal Information/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Professional Details/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Resume & Links/i }),
    ).toBeVisible();
  });

  test("Dropdown and inputs visible", async ({ page }) => {
    await gotoApplyPage(page);

    await expect(page.getByPlaceholder("Your full name")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("+91 98xxxxxxx")).toBeVisible();
    await expect(page.locator("select")).toBeVisible();

    await page.locator("select").selectOption("Mid");
    await expect(page.locator("select")).toHaveValue("Mid");
  });

  test("Fill application form", async ({ page }) => {
    await gotoApplyPage(page);

    await page.getByPlaceholder("Your full name").fill("Rakshitha");
    await page.getByPlaceholder("you@example.com").fill("rakshitha@gmail.com");
    await page.getByPlaceholder("+91 98xxxxxxx").fill("+919999999999");
    await page.getByPlaceholder("City, State or Remote").fill("Bihar");
    await page.locator("select").selectOption("Mid");

    await page.getByRole("button", { name: /Submit Application/i }).click();

    await expect(
      page.getByRole("heading", { name: /Application Received/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Your application has been submitted successfully/i),
    ).toBeVisible();
  });

  test("Cancel button click", async ({ page }) => {
    await page.goto("/jobs/1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /Apply Now/i })).toBeVisible();

    await page.getByRole("button", { name: /Apply Now/i }).click();
    await expect(page).toHaveURL(/\/jobs\/1\/apply$/);

    await page.getByRole("button", { name: /^Cancel$/i }).click();
    await expect(page).toHaveURL(/\/jobs\/1$/);
  });
});
