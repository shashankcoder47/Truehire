const { test, expect } = require("@playwright/test");

test.describe("TrueHire Companies Page UI Test", () => {
  const companies = [
    {
      id: 1,
      company_name: "TrueHire Labs",
      industry: "Technology",
      company_size: "11-50",
      category: "Software",
      company_logo: "/logos/truehire.png",
      short_overview: "Demo recruiter account used for local development.",
      detailed_description: "TrueHire Labs helps companies manage modern hiring workflows.",
      website: "https://truehire.dev",
    },
    {
      id: 2,
      company_name: "Cognizant",
      industry: "Consulting",
      company_size: "1000+",
      category: "Services",
      company_logo: "/logos/cognizant.png",
    },
    {
      id: 3,
      company_name: "HCL",
      industry: "Technology",
      company_size: "501-1000",
      category: "Services",
      company_logo: "/logos/hcl.png",
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/recruiters/companies/ratings", async (route) => {
      await route.fulfill({ json: { ratings: [] } });
    });

    await page.route("**/api/recruiters/companies", async (route) => {
      await route.fulfill({ json: { companies } });
    });
  });

  const gotoCompaniesPage = async (page) => {
    await page.goto("/companies", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Discover Leading Companies/i }),
    ).toBeVisible({ timeout: 15000 });
  };

  test("Validate filters, buttons and company cards", async ({ page }) => {
    await gotoCompaniesPage(page);

    await expect(
      page.getByRole("button", { name: /Go to Home Page/i }),
    ).toBeVisible();

    const searchBox = page.getByLabel(/Search Companies/i);
    await expect(searchBox).toBeVisible();
    await searchBox.fill("TrueHire");

    await expect(page.getByText("TrueHire Labs", { exact: true })).toBeVisible();
    await expect(page.getByText("Cognizant", { exact: true })).toBeHidden();

    const industryDropdown = page.getByLabel(/Industry/i);
    await expect(industryDropdown).toBeVisible();
    await industryDropdown.selectOption("Technology");

    const sizeDropdown = page.getByLabel(/Company Size/i);
    await expect(sizeDropdown).toBeVisible();
    await sizeDropdown.selectOption("11-50");

    const categoryDropdown = page.getByLabel(/Company Category/i);
    await expect(categoryDropdown).toBeVisible();
    await categoryDropdown.selectOption("Software");

    await expect(page.getByText(/Displaying\s+1\s+companies/i)).toBeVisible();

    const resetBtn = page.getByRole("button", { name: /Reset Filters/i }).first();
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    await expect(page.getByText("Cognizant", { exact: true })).toBeVisible();
    await expect(page.getByText("HCL", { exact: true })).toBeVisible();
    await expect(page.getByText("TrueHire Labs", { exact: true }).first()).toBeVisible();

    const truehireCard = page.locator("article").filter({
      has: page.getByRole("heading", { name: "TrueHire Labs" }),
    });
    await expect(truehireCard).toBeVisible();
    await expect(truehireCard.getByRole("link", { name: /Visit Website/i })).toBeVisible();

    const viewJobsButton = truehireCard.getByRole("button", { name: /View Jobs/i });
    await expect(viewJobsButton).toBeVisible();
    await viewJobsButton.click();

    await expect(page).toHaveURL(/\/companies\/1\/jobs$/);
  });
});
