# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\auth.spec.js >> Authentication UI >> invalid login shows validation error
- Location: qa\tests\ui\auth.spec.js:24:3

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

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
            - text: invalid.user@example.com
        - generic [ref=e21]:
          - generic [ref=e22]:
            - text: Password
            - link "Forgot password?" [ref=e23] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "Password" [ref=e24]:
            - /placeholder: Enter your password
            - text: WrongPassword123!
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
  - generic:
    - generic:
      - generic:
        - generic:
          - generic:
            - generic:
              - button "Open Next.js Dev Tools":
                - img
              - generic:
                - button "Open issues overlay":
                  - generic:
                    - generic: "0"
                    - generic: "1"
                  - generic: Issue
                - button "Collapse issues badge":
                  - img
  - alert [ref=e42]
```

# Test source

```ts
  1  | import { test, expect } from '../../fixtures/test-fixtures.js';
  2  | import { LoginPage } from '../../pages/login.page.js';
  3  | import { logout } from '../../helpers/auth.helper.js';
  4  | import { env } from '../../config/env.js';
  5  | 
  6  | test.describe('Authentication UI', () => {
  7  |   test.use({ storageState: undefined });
  8  | 
  9  |   test('admin login', async ({ page }) => {
  10 |     await new LoginPage(page).loginAs('admin', env.credentials.admin);
  11 |     await expect(page).toHaveURL(/admin-dashboard|dashboard/);
  12 |   });
  13 | 
  14 |   test('recruiter login', async ({ page }) => {
  15 |     await new LoginPage(page).loginAs('recruiter', env.credentials.recruiter);
  16 |     await expect(page).toHaveURL(/recruiter|dashboard|jobs/);
  17 |   });
  18 | 
  19 |   test('candidate login', async ({ page }) => {
  20 |     await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
  21 |     await expect(page).toHaveURL(/welcome|overview|dashboard|jobs/);
  22 |   });
  23 | 
  24 |   test('invalid login shows validation error', async ({ page }) => {
  25 |     await new LoginPage(page).submitInvalidLogin('candidate', {
  26 |       email: 'invalid.user@example.com',
  27 |       password: 'WrongPassword123!'
  28 |     });
> 29 |     await expect(page.getByText(/invalid|incorrect|failed|not found/i).first()).toBeVisible({ timeout: 15_000 });
     |                                                                                 ^ Error: expect(locator).toBeVisible() failed
  30 |   });
  31 | 
  32 |   test('logout ends authenticated session', async ({ page }) => {
  33 |     await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
  34 |     await logout(page);
  35 |     await expect(page).toHaveURL(/login|\/$/);
  36 |   });
  37 | });
  38 | 
```