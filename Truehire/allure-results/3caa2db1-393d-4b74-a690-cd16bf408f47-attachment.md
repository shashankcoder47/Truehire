# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\auth.spec.js >> Authentication UI >> candidate login
- Location: qa\tests\ui\auth.spec.js:19:3

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://localhost:3000/user-dashboard
Call log:
  - navigating to "http://localhost:3000/user-dashboard", waiting until "load"

```

# Page snapshot

```yaml
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
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | import { waitForAppReady } from '../utils/waits.js';
  3  | 
  4  | export class BasePage {
  5  |   constructor(page) {
  6  |     this.page = page;
  7  |   }
  8  | 
  9  |   async goto(path) {
> 10 |     await this.page.goto(path);
     |                     ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3000/user-dashboard
  11 |     await waitForAppReady(this.page);
  12 |   }
  13 | 
  14 |   async fillByLabelOrPlaceholder(name, value) {
  15 |     const locator = this.page.getByLabel(name).or(this.page.getByPlaceholder(name)).first();
  16 |     await expect(locator, `Input not found: ${name}`).toBeVisible();
  17 |     await locator.fill(value);
  18 |   }
  19 | 
  20 |   async clickButton(name) {
  21 |     const button = this.page.getByRole('button', { name }).first();
  22 |     await expect(button, `Button not found: ${name}`).toBeVisible();
  23 |     await button.click();
  24 |   }
  25 | 
  26 |   async expectPageSignal(pattern) {
  27 |     await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 15_000 });
  28 |   }
  29 | 
  30 |   async selectOption(label, value) {
  31 |     const field = this.page.getByLabel(label).first();
  32 |     await expect(field, `Dropdown not found: ${label}`).toBeVisible();
  33 |     await field.selectOption(value);
  34 |   }
  35 | 
  36 |   async expectToast(pattern) {
  37 |     await expect(this.page.getByRole('status').or(this.page.getByText(pattern)).first()).toBeVisible({
  38 |       timeout: 15_000
  39 |     });
  40 |   }
  41 | 
  42 |   async confirmModal(action = /confirm|yes|delete|ok/i) {
  43 |     const dialogButton = this.page.getByRole('button', { name: action }).first();
  44 |     await expect(dialogButton).toBeVisible({ timeout: 10_000 });
  45 |     await dialogButton.click();
  46 |   }
  47 | 
  48 |   async waitForApiResponse(urlPattern, action) {
  49 |     const [response] = await Promise.all([
  50 |       this.page.waitForResponse((res) => urlPattern.test(res.url()), { timeout: 20_000 }),
  51 |       action()
  52 |     ]);
  53 |     return response;
  54 |   }
  55 | }
  56 | 
```