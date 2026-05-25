# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\advanced-flows.spec.js >> Advanced UI Journeys >> notification and dashboard pages render for authenticated users
- Location: qa\tests\ui\advanced-flows.spec.js:63:3

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://localhost:3000/notifications
Call log:
  - navigating to "http://localhost:3000/notifications", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '../../fixtures/test-fixtures.js';
  2  | import { LoginPage } from '../../pages/login.page.js';
  3  | import { RegisterPage } from '../../pages/register.page.js';
  4  | import { RecruiterPage } from '../../pages/recruiter.page.js';
  5  | import { CandidatePage } from '../../pages/candidate.page.js';
  6  | import { PaymentPage } from '../../pages/payment.page.js';
  7  | import { buildCandidateProfile, buildJob } from '../../utils/test-data.js';
  8  | import { env } from '../../config/env.js';
  9  | import { logout } from '../../helpers/auth.helper.js';
  10 | 
  11 | test.describe('Advanced UI Journeys', () => {
  12 |   test('login page validates invalid credentials and then allows candidate login', async ({ page }) => {
  13 |     const loginPage = new LoginPage(page);
  14 |     await loginPage.submitInvalidLogin('candidate', {
  15 |       email: 'bad.user@example.com',
  16 |       password: 'WrongPassword123!'
  17 |     });
  18 |     await expect(page.getByText(/invalid|incorrect|failed|not found/i).first()).toBeVisible({ timeout: 15_000 });
  19 | 
  20 |     await loginPage.loginAs('candidate', env.credentials.candidate);
  21 |     await expect(page.getByText(/welcome|overview|jobs|candidate/i).first()).toBeVisible();
  22 |   });
  23 | 
  24 |   test('register page renders expected candidate fields', async ({ page }) => {
  25 |     const registerPage = new RegisterPage(page);
  26 |     await registerPage.openCandidateRegister();
  27 |     await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first()).toBeVisible();
  28 |     await expect(page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first()).toBeVisible();
  29 |   });
  30 | 
  31 |   test('recruiter can open create job and manage jobs pages', async ({ page }) => {
  32 |     await new LoginPage(page).loginAs('recruiter', env.credentials.recruiter);
  33 |     const recruiter = new RecruiterPage(page);
  34 |     await recruiter.openCreateJob();
  35 |     await expect(page.getByText(/job|title|description|requirements/i).first()).toBeVisible();
  36 |     await recruiter.openManageJobs();
  37 |     await expect(page.getByText(/jobs|active|manage|posted/i).first()).toBeVisible();
  38 |   });
  39 | 
  40 |   test('candidate can search, track applications, and update profile page', async ({ page }) => {
  41 |     await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
  42 |     const candidate = new CandidatePage(page);
  43 |     await candidate.openJobs();
  44 |     await expect(page.getByText(/jobs|search|company|apply/i).first()).toBeVisible();
  45 |     await candidate.openApplications();
  46 |     await expect(page.getByText(/application|status|track|submitted|no applications/i).first()).toBeVisible();
  47 |     await candidate.goto('/profile');
  48 |     await expect(page.getByText(/profile|resume|skills|experience/i).first()).toBeVisible();
  49 |   });
  50 | 
  51 |   test('payment page exposes subscription purchase controls', async ({ page }) => {
  52 |     await new LoginPage(page).loginAs('recruiter', env.credentials.recruiter);
  53 |     await new PaymentPage(page).openSubscriptions();
  54 |     await expect(page.getByText(/subscription|premium|plan|billing|payment/i).first()).toBeVisible();
  55 |   });
  56 | 
  57 |   test('logout flow returns user to public or login page', async ({ page }) => {
  58 |     await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
  59 |     await logout(page);
  60 |     await expect(page).toHaveURL(/login|\/$/);
  61 |   });
  62 | 
  63 |   test('notification and dashboard pages render for authenticated users', async ({ page }) => {
  64 |     await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
> 65 |     await page.goto('/notifications');
     |                ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3000/notifications
  66 |     await expect(page.getByText(/notification|unread|no notifications/i).first()).toBeVisible({ timeout: 20_000 });
  67 |     await page.goto('/overview');
  68 |     await expect(page.getByText(/overview|dashboard|applications|jobs/i).first()).toBeVisible({ timeout: 20_000 });
  69 |   });
  70 | 
  71 |   test('page objects can submit profile data without fixed waits', async ({ page }) => {
  72 |     await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
  73 |     const candidate = new CandidatePage(page);
  74 |     await candidate.updateProfile(buildCandidateProfile());
  75 |   });
  76 | });
  77 | 
```