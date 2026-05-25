# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\advanced-flows.spec.js >> Advanced UI Journeys >> login page validates invalid credentials and then allows candidate login
- Location: qa\tests\ui\advanced-flows.spec.js:12:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/invalid|incorrect|failed|not found/i).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText(/invalid|incorrect|failed|not found/i).first()
    - waiting for" http://localhost:3000/login?role=user" navigation to finish...
    - navigated to "http://localhost:3000/login?role=user"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - link "TrueHire logoTrueHire" [ref=e7] [cursor=pointer]:
        - /url: /
        - img "TrueHire logo" [ref=e9]
        - text: TrueHire
      - paragraph [ref=e10]: User Login
      - heading "User Login" [level=1] [ref=e11]
      - paragraph [ref=e12]: Sign in to continue your job search and track applications.
    - generic [ref=e13]:
      - generic [ref=e14]:
        - paragraph [ref=e15]: User login
        - heading "User Login" [level=2] [ref=e16]
        - paragraph [ref=e17]: Sign in to continue your job search and track applications.
      - generic [ref=e18]:
        - generic [ref=e19]:
          - text: Email address
          - textbox "Email address" [ref=e20]:
            - /placeholder: Enter your email
        - generic [ref=e21]:
          - generic [ref=e22]:
            - text: Password
            - link "Forgot password?" [ref=e23] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "Password" [ref=e24]:
            - /placeholder: Enter your password
          - generic [ref=e25]:
            - checkbox "Show password" [ref=e26]
            - text: Show password
        - button "Login" [ref=e27]
        - generic [ref=e29]: Or continue with
        - button "Continue with Google" [ref=e31]:
          - img [ref=e32]
          - text: Continue with Google
        - generic [ref=e39]:
          - link "Create a new account" [ref=e40] [cursor=pointer]:
            - /url: /register
          - link "Back to Home" [ref=e41] [cursor=pointer]:
            - /url: /
  - generic [active]:
    - generic [ref=e44]:
      - generic [ref=e45]:
        - generic [ref=e46]:
          - navigation [ref=e47]:
            - button "previous" [disabled] [ref=e48]:
              - img "previous" [ref=e49]
            - generic [ref=e51]:
              - generic [ref=e52]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e53]:
              - img "next" [ref=e54]
          - img
        - generic [ref=e56]:
          - link "Next.js 16.1.6 (stale) Webpack" [ref=e57] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
            - img [ref=e58]
            - generic "There is a newer version (16.2.4) available, upgrade recommended!" [ref=e60]: Next.js 16.1.6 (stale)
            - generic [ref=e61]: Webpack
          - img
      - dialog "Runtime TypeError" [ref=e63]:
        - generic [ref=e66]:
          - generic [ref=e67]:
            - generic [ref=e68]:
              - generic [ref=e70]: Runtime TypeError
              - generic [ref=e71]:
                - button "Copy Error Info" [ref=e72] [cursor=pointer]:
                  - img [ref=e73]
                - button "No related documentation found" [disabled] [ref=e75]:
                  - img [ref=e76]
                - button "Attach Node.js inspector" [ref=e78] [cursor=pointer]:
                  - img [ref=e79]
            - generic [ref=e88]: Cannot read properties of null (reading 'parentNode')
          - generic [ref=e90]:
            - generic [ref=e91]:
              - paragraph [ref=e92]:
                - text: Call Stack
                - generic [ref=e93]: "17"
              - button "Show 14 ignore-listed frame(s)" [ref=e94] [cursor=pointer]:
                - text: Show 14 ignore-listed frame(s)
                - img [ref=e95]
            - generic [ref=e97]:
              - generic [ref=e98]: (pages-dir-browser)/./src/styles/globals.css
              - text: .next\dev\static\chunks\pages\_app.js (158:1)
            - generic [ref=e99]:
              - generic [ref=e100]: eval
              - text: ./src/pages/_app.js
            - generic [ref=e101]:
              - generic [ref=e102]: (pages-dir-browser)/./src/pages/_app.js
              - text: .next\dev\static\chunks\pages\_app.js (137:1)
        - generic [ref=e103]: "1"
        - generic [ref=e104]: "2"
    - generic [ref=e109] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e110]:
        - img [ref=e111]
      - generic [ref=e114]:
        - button "Open issues overlay" [ref=e115]:
          - generic [ref=e116]:
            - generic [ref=e117]: "0"
            - generic [ref=e118]: "1"
          - generic [ref=e119]: Issue
        - button "Collapse issues badge" [ref=e120]:
          - img [ref=e121]
  - alert [ref=e123]
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
> 18 |     await expect(page.getByText(/invalid|incorrect|failed|not found/i).first()).toBeVisible({ timeout: 15_000 });
     |                                                                                 ^ Error: expect(locator).toBeVisible() failed
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
  65 |     await page.goto('/notifications');
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