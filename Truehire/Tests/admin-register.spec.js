const { test, expect } = require("@playwright/test");

const gotoRecruiterRegister = async (page) => {
  await page.goto("/recruiter-register", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { level: 1, name: /Join as Recruiter/i }),
  ).toBeVisible({ timeout: 15000 });
};

const completeStep1 = async (page) => {
  await page.getByLabel(/Full Name/i).fill("Rakshitha");
  await page.getByLabel(/Official Work Email ID/i).fill("hr@company.com");
  await page.getByLabel(/Mobile Number/i).fill("9876543210");
  await page.getByRole("button", { name: /^Continue$/i }).click();
};

const completeStep2 = async (page) => {
  await expect(
    page.getByLabel(/Company Legal( \/ Registered)? Name/i),
  ).toBeVisible();
  await page
    .getByLabel(/Company Legal( \/ Registered)? Name/i)
    .fill("TrueHire Pvt Ltd");
  await page.getByLabel(/Company Website URL/i).fill("https://company.com");
  await page.getByLabel(/Industry Type/i).selectOption({ index: 1 });
  await page.getByLabel(/Company Size/i).selectOption({ index: 1 });
  await page.getByLabel(/^City$/i).fill("Bangalore");
  await page.getByLabel(/^State$/i).fill("Karnataka");
  await page.getByLabel(/^Country$/i).fill("India");
  await page
    .getByLabel(/Company Description \/ Profile/i)
    .fill("Software hiring company");
  await page.getByRole("button", { name: /Save & Continue/i }).click();
};

const completeStep3 = async (page) => {
  await expect(page.getByLabel(/Document Type/i)).toBeVisible();
  await page.getByLabel(/Document Type/i).selectOption({ index: 1 });
  await page.getByLabel(/Upload File/i).setInputFiles({
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% test pdf\n"),
  });
  await page.getByRole("button", { name: /Queue Document/i }).click();
  await expect(page.getByText(/Document queued/i)).toBeVisible();
  await page
    .getByRole("button", { name: /Continue to Company & Security/i })
    .click();
};

test.describe("TrueHire Recruiter Multi-Step Registration Testing", () => {
  test("Step 1 - Personal Info", async ({ page }) => {
    await gotoRecruiterRegister(page);

    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Official Work Email ID/i)).toBeVisible();
    await expect(page.getByLabel(/Mobile Number/i)).toBeVisible();

    await completeStep1(page);
    await expect(
      page.getByLabel(/Company Legal( \/ Registered)? Name/i),
    ).toBeVisible();
  });

  test("Step 2 - Company Details", async ({ page }) => {
    await gotoRecruiterRegister(page);
    await completeStep1(page);
    await completeStep2(page);

    await expect(page.getByLabel(/Document Type/i)).toBeVisible();
  });

  test("Step 3 - Verification", async ({ page }) => {
    await gotoRecruiterRegister(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page);

    await expect(page.getByLabel(/^Company Name$/i)).toBeVisible();
  });

  test("Step 4 - Security & Create Account", async ({ page }) => {
    await page.route("**/auth/register/recruiter", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "test-token",
          user: {
            id: 1,
            name: "Rakshitha",
            email: "hr@company.com",
            role: "recruiter",
            company: "TrueHire Pvt Ltd",
          },
        }),
      });
    });

    await page.route("**/recruiters/profile/me", async (route) => {
      const method = route.request().method();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            recruiter: {
              id: 1,
              name: "Rakshitha",
              email: "hr@company.com",
              role: "recruiter",
              company: "TrueHire Pvt Ltd",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
        }),
      });
    });

    await page.route("**/recruiters/verification", async (route) => {
      const method = route.request().method();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "Pending",
            documents: [],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
        }),
      });
    });

    await gotoRecruiterRegister(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page);

    await expect(page.getByLabel(/^Company Name$/i)).toBeVisible();
    await page.getByLabel(/^Company Name$/i).fill("TrueHire Pvt Ltd");
    await page.getByLabel(/Company Image/i).setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from("png"),
    });
    await page.getByLabel(/^Password$/i).fill("Pass1234");
    await page.getByLabel(/Confirm Password/i).fill("Pass1234");

    await page.getByRole("button", { name: /Create Account/i }).click();
    await expect(page.getByText(/Your account is under review/i)).toBeVisible();
  });

  test("Back buttons visible on steps", async ({ page }) => {
    await gotoRecruiterRegister(page);
    await completeStep1(page);
    await expect(page.getByRole("button", { name: /^Back$/i })).toBeVisible();

    await completeStep2(page);
    await expect(page.getByRole("button", { name: /^Back$/i })).toBeVisible();

    await completeStep3(page);
    await expect(page.getByRole("button", { name: /^Back$/i })).toBeVisible();
  });
});
