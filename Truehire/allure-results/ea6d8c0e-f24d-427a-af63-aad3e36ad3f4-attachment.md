# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\recruiter.spec.js >> Recruiter Module UI >> delete job prompts confirmation
- Location: qa\tests\ui\recruiter.spec.js:21:3

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /delete|close/i }).first()
    - waiting for" http://localhost:3000/active-jobs" navigation to finish...

```

# Test source

```ts
  1  | import { test, expect } from '../../fixtures/test-fixtures.js';
  2  | import { RecruiterPage } from '../../pages/recruiter.page.js';
  3  | import { buildJob } from '../../utils/test-data.js';
  4  | 
  5  | test.describe('Recruiter Module UI', () => {
  6  |   test.use({ storageState: 'qa/.auth/recruiter.json' });
  7  | 
  8  |   test('create job', async ({ page }) => {
  9  |     await new RecruiterPage(page).createJob(buildJob());
  10 |   });
  11 | 
  12 |   test('edit job from manage jobs', async ({ page }) => {
  13 |     const recruiter = new RecruiterPage(page);
  14 |     await recruiter.openManageJobs();
  15 |     await page.getByRole('button', { name: /edit/i }).or(page.getByRole('link', { name: /edit/i })).first().click();
  16 |     await page.getByLabel(/title|job title/i).or(page.getByPlaceholder(/title|job title/i)).first().fill(buildJob().title);
  17 |     await page.getByRole('button', { name: /save|update/i }).click();
  18 |     await expect(page.getByText(/updated|success|saved/i).first()).toBeVisible({ timeout: 20_000 });
  19 |   });
  20 | 
  21 |   test('delete job prompts confirmation', async ({ page }) => {
  22 |     const recruiter = new RecruiterPage(page);
  23 |     await recruiter.openManageJobs();
  24 |     page.once('dialog', dialog => dialog.accept());
> 25 |     await page.getByRole('button', { name: /delete|close/i }).first().click();
     |                                                                       ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  26 |     await expect(page.getByText(/deleted|closed|removed|success/i).first()).toBeVisible({ timeout: 20_000 });
  27 |   });
  28 | 
  29 |   test('review applications', async ({ page }) => {
  30 |     const recruiter = new RecruiterPage(page);
  31 |     await recruiter.openApplications();
  32 |     await expect(page.getByText(/applications|candidate|status|resume/i).first()).toBeVisible();
  33 |   });
  34 | 
  35 |   test('schedule interview', async ({ page }) => {
  36 |     const recruiter = new RecruiterPage(page);
  37 |     await recruiter.openApplications();
  38 |     await recruiter.scheduleInterview();
  39 |   });
  40 | });
  41 | 
```