# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\payment.spec.js >> Payment Module UI >> razorpay payment flow starts checkout
- Location: qa\tests\ui\payment.spec.js:7:3

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /subscribe|upgrade|buy|pay/i }).first()

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
  2  | import { BasePage } from './base.page.js';
  3  | 
  4  | export class PaymentPage extends BasePage {
  5  |   async openSubscriptions() {
  6  |     await this.goto('/billing-plans');
  7  |   }
  8  | 
  9  |   async startSubscriptionPurchase() {
  10 |     await this.openSubscriptions();
> 11 |     await this.page.getByRole('button', { name: /subscribe|upgrade|buy|pay/i }).first().click();
     |                                                                                         ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  12 |     await expect(this.page.getByText(/razorpay|payment|checkout|subscription/i).first()).toBeVisible({ timeout: 20_000 });
  13 |   }
  14 | 
  15 |   async assertFailureMessage() {
  16 |     await expect(this.page.getByText(/failed|cancelled|payment error|try again/i).first()).toBeVisible({ timeout: 20_000 });
  17 |   }
  18 | }
  19 | 
```