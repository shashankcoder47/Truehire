# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\advanced-flows.spec.js >> Advanced UI Journeys >> page objects can submit profile data without fixed waits
- Location: qa\tests\ui\advanced-flows.spec.js:71:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /profile|login/
Received string:  "http://localhost:3000/user-dashboard"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    - waiting for" http://localhost:3000/user-dashboard" navigation to finish...
    - navigated to "http://localhost:3000/user-dashboard"
    12 × unexpected value "http://localhost:3000/user-dashboard"

```

# Page snapshot

```yaml
- generic:
  - generic [active]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - navigation [ref=e6]:
            - button "previous" [disabled] [ref=e7]:
              - img "previous" [ref=e8]
            - generic [ref=e10]:
              - generic [ref=e11]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e12]:
              - img "next" [ref=e13]
          - img
        - generic [ref=e15]:
          - link "Next.js 16.1.6 (stale) Webpack" [ref=e16] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
            - img [ref=e17]
            - generic "There is a newer version (16.2.4) available, upgrade recommended!" [ref=e19]: Next.js 16.1.6 (stale)
            - generic [ref=e20]: Webpack
          - img
      - dialog "Runtime TypeError" [ref=e22]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e29]: Runtime TypeError
              - generic [ref=e30]:
                - button "Copy Error Info" [ref=e31] [cursor=pointer]:
                  - img [ref=e32]
                - button "No related documentation found" [disabled] [ref=e34]:
                  - img [ref=e35]
                - button "Attach Node.js inspector" [ref=e37] [cursor=pointer]:
                  - img [ref=e38]
            - generic [ref=e47]: Cannot read properties of null (reading 'parentNode')
          - generic [ref=e49]:
            - generic [ref=e50]:
              - paragraph [ref=e51]:
                - text: Call Stack
                - generic [ref=e52]: "17"
              - button "Show 14 ignore-listed frame(s)" [ref=e53] [cursor=pointer]:
                - text: Show 14 ignore-listed frame(s)
                - img [ref=e54]
            - generic [ref=e56]:
              - generic [ref=e57]: (pages-dir-browser)/./src/styles/globals.css
              - text: .next\dev\static\chunks\pages\_app.js (158:1)
            - generic [ref=e58]:
              - generic [ref=e59]: eval
              - text: ./src/pages/_app.js
            - generic [ref=e60]:
              - generic [ref=e61]: (pages-dir-browser)/./src/pages/_app.js
              - text: .next\dev\static\chunks\pages\_app.js (137:1)
        - generic [ref=e62]: "1"
        - generic [ref=e63]: "2"
    - generic [ref=e68] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e69]:
        - img [ref=e70]
      - generic [ref=e73]:
        - button "Open issues overlay" [ref=e74]:
          - generic [ref=e75]:
            - generic [ref=e76]: "0"
            - generic [ref=e77]: "1"
          - generic [ref=e78]: Issue
        - button "Collapse issues badge" [ref=e79]:
          - img [ref=e80]
  - alert [ref=e82]
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
  18 |     await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  19 | 
  20 |     await loginPage.loginAs('candidate', env.credentials.candidate);
  21 |     await expect(page).toHaveURL(/user-dashboard|dashboard/);
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
  35 |     await expect(page).toHaveURL(/post-job|login/);
  36 |     await recruiter.openManageJobs();
  37 |     await expect(page).toHaveURL(/active-jobs|login/);
  38 |   });
  39 | 
  40 |   test('candidate can search, track applications, and update profile page', async ({ page }) => {
  41 |     await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
  42 |     const candidate = new CandidatePage(page);
  43 |     await candidate.openJobs();
  44 |     await expect(page).toHaveURL(/jobs/);
  45 |     await candidate.openApplications();
  46 |     await expect(page).toHaveURL(/applications|login/);
  47 |     await candidate.goto('/profile');
  48 |     await expect(page).toHaveURL(/profile|login/);
  49 |   });
  50 | 
  51 |   test('payment page exposes subscription purchase controls', async ({ page }) => {
  52 |     await new LoginPage(page).loginAs('recruiter', env.credentials.recruiter);
  53 |     await new PaymentPage(page).openSubscriptions();
  54 |     await expect(page).toHaveURL(/billing-plans|login/);
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
  65 |     await page.goto('/notifications');
  66 |     await expect(page).toHaveURL(/notifications|login/);
  67 |     await page.goto('/overview');
  68 |     await expect(page).toHaveURL(/overview|login/);
  69 |   });
  70 | 
  71 |   test('page objects can submit profile data without fixed waits', async ({ page }) => {
  72 |     await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
  73 |     const candidate = new CandidatePage(page);
  74 |     await candidate.goto('/profile');
> 75 |     await expect(page).toHaveURL(/profile|login/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  76 |   });
  77 | });
  78 | 
```