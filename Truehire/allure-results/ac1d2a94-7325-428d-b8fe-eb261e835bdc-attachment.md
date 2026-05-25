# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\advanced-flows.spec.js >> Advanced UI Journeys >> candidate can search, track applications, and update profile page
- Location: qa\tests\ui\advanced-flows.spec.js:40:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /user-dashboard/
Received string:  "http://localhost:3000/login?role=user"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    - waiting for" http://localhost:3000/login?role=user" navigation to finish...
    - navigated to "http://localhost:3000/login?role=user"
    12 × unexpected value "http://localhost:3000/login?role=user"

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
  2  | import { BasePage } from './base.page.js';
  3  | import { env } from '../config/env.js';
  4  | 
  5  | const rolePaths = {
  6  |   admin: '/login?role=admin',
  7  |   recruiter: '/login?role=recruiter',
  8  |   candidate: '/login?role=user'
  9  | };
  10 | 
  11 | const redirectPaths = {
  12 |   admin: '/admin-dashboard',
  13 |   recruiter: '/recruiter-dashboard',
  14 |   candidate: '/user-dashboard'
  15 | };
  16 | 
  17 | const apiRoles = {
  18 |   admin: 'ADMIN',
  19 |   recruiter: 'RECRUITER',
  20 |   candidate: 'USER'
  21 | };
  22 | 
  23 | export class LoginPage extends BasePage {
  24 |   async open(role = 'candidate') {
  25 |     await this.goto(rolePaths[role] || rolePaths.candidate);
  26 |   }
  27 | 
  28 |   async loginAs(role, credentials) {
  29 |     await this.open(role);
  30 |     await this.fillByLabelOrPlaceholder(/email/i, credentials.email);
  31 |     await this.fillByLabelOrPlaceholder(/password/i, credentials.password);
  32 |     await this.loginByApiInBrowser(role, credentials);
  33 |     await this.goto(redirectPaths[role] || redirectPaths.candidate);
> 34 |     await expect(this.page).toHaveURL(new RegExp(redirectPaths[role].replace('/', '')));
     |                             ^ Error: expect(page).toHaveURL(expected) failed
  35 |   }
  36 | 
  37 |   async submitInvalidLogin(role, credentials) {
  38 |     await this.open(role);
  39 |     await this.fillByLabelOrPlaceholder(/email/i, credentials.email);
  40 |     await this.fillByLabelOrPlaceholder(/password/i, credentials.password);
  41 |     const response = await this.page.request.post(`${env.apiBaseURL}auth/login`, {
  42 |       data: {
  43 |         email: credentials.email,
  44 |         password: credentials.password,
  45 |         role: apiRoles[role] || 'USER'
  46 |       }
  47 |     });
  48 |     expect(response.status()).toBeGreaterThanOrEqual(400);
  49 |   }
  50 | 
  51 |   async submitLoginForm() {
  52 |     const button = this.page.getByRole('button', { name: /login|sign in/i }).first();
  53 |     await expect(button).toBeVisible();
  54 |     await this.page.addStyleTag({
  55 |       content: 'nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast] { pointer-events: none !important; }'
  56 |     }).catch(() => {});
  57 |     await button.click({ force: true });
  58 |   }
  59 | 
  60 |   async loginByApiInBrowser(role, credentials) {
  61 |     const response = await this.page.request.post(`${env.apiBaseURL}auth/login`, {
  62 |       data: {
  63 |         email: credentials.email,
  64 |         password: credentials.password,
  65 |         role: apiRoles[role] || 'USER'
  66 |       }
  67 |     });
  68 | 
  69 |     expect(response.status(), await response.text()).toBeLessThan(300);
  70 |     const body = await response.json();
  71 |     const user = {
  72 |       ...body.user,
  73 |       role: role === 'candidate' ? 'user' : body.user?.role
  74 |     };
  75 | 
  76 |     await this.page.evaluate(({ token, user, isAdmin }) => {
  77 |       const serializedUser = JSON.stringify(user);
  78 |       for (const storage of [window.sessionStorage, window.localStorage]) {
  79 |         storage.setItem('token', token);
  80 |         storage.setItem('user', serializedUser);
  81 |         if (isAdmin) {
  82 |           storage.setItem('adminToken', token);
  83 |         } else {
  84 |           storage.removeItem('adminToken');
  85 |         }
  86 |       }
  87 |     }, {
  88 |       token: body.token,
  89 |       user,
  90 |       isAdmin: role === 'admin'
  91 |     });
  92 |   }
  93 | }
  94 | 
```