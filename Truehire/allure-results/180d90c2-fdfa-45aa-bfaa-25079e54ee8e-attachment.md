# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\auth.spec.js >> Authentication UI >> logout ends authenticated session
- Location: qa\tests\ui\auth.spec.js:32:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/welcome|overview|jobs|candidate/i).first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByText(/welcome|overview|jobs|candidate/i).first()

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
  1   | import { expect } from '@playwright/test';
  2   | import { BasePage } from './base.page.js';
  3   | import { env } from '../config/env.js';
  4   | 
  5   | const rolePaths = {
  6   |   admin: '/login?role=admin',
  7   |   recruiter: '/login?role=recruiter',
  8   |   candidate: '/login?role=user'
  9   | };
  10  | 
  11  | const landingSignals = {
  12  |   admin: /dashboard|analytics|admin/i,
  13  |   recruiter: /dashboard|jobs|applications|recruiter/i,
  14  |   candidate: /welcome|overview|jobs|candidate/i
  15  | };
  16  | 
  17  | const redirectPaths = {
  18  |   admin: '/admin-dashboard',
  19  |   recruiter: '/recruiter-dashboard',
  20  |   candidate: '/user-dashboard'
  21  | };
  22  | 
  23  | const apiRoles = {
  24  |   admin: 'ADMIN',
  25  |   recruiter: 'RECRUITER',
  26  |   candidate: 'USER'
  27  | };
  28  | 
  29  | export class LoginPage extends BasePage {
  30  |   async open(role = 'candidate') {
  31  |     await this.goto(rolePaths[role] || rolePaths.candidate);
  32  |   }
  33  | 
  34  |   async loginAs(role, credentials) {
  35  |     await this.open(role);
  36  |     await this.fillByLabelOrPlaceholder(/email/i, credentials.email);
  37  |     await this.fillByLabelOrPlaceholder(/password/i, credentials.password);
  38  |     await this.loginByApiInBrowser(role, credentials);
  39  |     await this.goto(redirectPaths[role] || redirectPaths.candidate);
> 40  |     await expect(this.page.getByText(landingSignals[role]).first()).toBeVisible({ timeout: 20_000 });
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  41  |   }
  42  | 
  43  |   async submitInvalidLogin(role, credentials) {
  44  |     await this.open(role);
  45  |     await this.fillByLabelOrPlaceholder(/email/i, credentials.email);
  46  |     await this.fillByLabelOrPlaceholder(/password/i, credentials.password);
  47  |     const response = await this.page.request.post(`${env.apiBaseURL}auth/login`, {
  48  |       data: {
  49  |         email: credentials.email,
  50  |         password: credentials.password,
  51  |         role: apiRoles[role] || 'USER'
  52  |       }
  53  |     });
  54  |     expect(response.status()).toBeGreaterThanOrEqual(400);
  55  |   }
  56  | 
  57  |   async submitLoginForm() {
  58  |     const button = this.page.getByRole('button', { name: /login|sign in/i }).first();
  59  |     await expect(button).toBeVisible();
  60  |     await this.page.addStyleTag({
  61  |       content: 'nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast] { pointer-events: none !important; }'
  62  |     }).catch(() => {});
  63  |     await button.click({ force: true });
  64  |   }
  65  | 
  66  |   async loginByApiInBrowser(role, credentials) {
  67  |     const response = await this.page.request.post(`${env.apiBaseURL}auth/login`, {
  68  |       data: {
  69  |         email: credentials.email,
  70  |         password: credentials.password,
  71  |         role: apiRoles[role] || 'USER'
  72  |       }
  73  |     });
  74  | 
  75  |     expect(response.status(), await response.text()).toBeLessThan(300);
  76  |     const body = await response.json();
  77  |     const user = {
  78  |       ...body.user,
  79  |       role: role === 'candidate' ? 'user' : body.user?.role
  80  |     };
  81  | 
  82  |     await this.page.evaluate(({ token, user, isAdmin }) => {
  83  |       const serializedUser = JSON.stringify(user);
  84  |       for (const storage of [window.sessionStorage, window.localStorage]) {
  85  |         storage.setItem('token', token);
  86  |         storage.setItem('user', serializedUser);
  87  |         if (isAdmin) {
  88  |           storage.setItem('adminToken', token);
  89  |         } else {
  90  |           storage.removeItem('adminToken');
  91  |         }
  92  |       }
  93  |     }, {
  94  |       token: body.token,
  95  |       user,
  96  |       isAdmin: role === 'admin'
  97  |     });
  98  |   }
  99  | }
  100 | 
```