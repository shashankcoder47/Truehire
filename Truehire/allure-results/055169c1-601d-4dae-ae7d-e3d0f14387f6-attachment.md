# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\candidate.spec.js >> Candidate Module UI >> profile update
- Location: qa\tests\ui\candidate.spec.js:22:3

# Error details

```
Error: Input not found: /name/i

expect(locator).toBeVisible() failed

Locator: getByLabel(/name/i).or(getByPlaceholder(/name/i)).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Input not found: /name/i with timeout 10000ms
  - waiting for getByLabel(/name/i).or(getByPlaceholder(/name/i)).first()

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
  1  | import { expect } from '@playwright/test';
  2  | import { waitForAppReady } from '../utils/waits.js';
  3  | 
  4  | export class BasePage {
  5  |   constructor(page) {
  6  |     this.page = page;
  7  |   }
  8  | 
  9  |   async goto(path) {
  10 |     try {
  11 |       await this.page.goto(path);
  12 |     } catch (error) {
  13 |       if (!String(error?.message || '').includes('ERR_ABORTED')) {
  14 |         throw error;
  15 |       }
  16 |     }
  17 |     await waitForAppReady(this.page);
  18 |   }
  19 | 
  20 |   async fillByLabelOrPlaceholder(name, value) {
  21 |     const locator = this.page.getByLabel(name).or(this.page.getByPlaceholder(name)).first();
> 22 |     await expect(locator, `Input not found: ${name}`).toBeVisible();
     |                                                       ^ Error: Input not found: /name/i
  23 |     await locator.fill(value);
  24 |   }
  25 | 
  26 |   async clickButton(name) {
  27 |     const button = this.page.getByRole('button', { name }).first();
  28 |     await expect(button, `Button not found: ${name}`).toBeVisible();
  29 |     await button.click();
  30 |   }
  31 | 
  32 |   async expectPageSignal(pattern) {
  33 |     await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 15_000 });
  34 |   }
  35 | 
  36 |   async selectOption(label, value) {
  37 |     const field = this.page.getByLabel(label).first();
  38 |     await expect(field, `Dropdown not found: ${label}`).toBeVisible();
  39 |     await field.selectOption(value);
  40 |   }
  41 | 
  42 |   async expectToast(pattern) {
  43 |     await expect(this.page.getByRole('status').or(this.page.getByText(pattern)).first()).toBeVisible({
  44 |       timeout: 15_000
  45 |     });
  46 |   }
  47 | 
  48 |   async confirmModal(action = /confirm|yes|delete|ok/i) {
  49 |     const dialogButton = this.page.getByRole('button', { name: action }).first();
  50 |     await expect(dialogButton).toBeVisible({ timeout: 10_000 });
  51 |     await dialogButton.click();
  52 |   }
  53 | 
  54 |   async waitForApiResponse(urlPattern, action) {
  55 |     const [response] = await Promise.all([
  56 |       this.page.waitForResponse((res) => urlPattern.test(res.url()), { timeout: 20_000 }),
  57 |       action()
  58 |     ]);
  59 |     return response;
  60 |   }
  61 | }
  62 | 
```