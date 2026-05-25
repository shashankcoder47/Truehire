# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\payments.api.spec.js >> Payments API >> subscription status requires recruiter authentication
- Location: qa\tests\api\payments.api.spec.js:5:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 404
Received array: [401, 403]
```

# Test source

```ts
  1  | import { test, expect } from '../../fixtures/test-fixtures.js';
  2  | import { PaymentsApi } from '../../api/payments.api.js';
  3  | 
  4  | test.describe('Payments API', () => {
  5  |   test('subscription status requires recruiter authentication', async ({ apiClient }) => {
  6  |     const response = await new PaymentsApi(apiClient).status();
> 7  |     expect([401, 403]).toContain(response.status());
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  8  |   });
  9  | 
  10 |   test('recruiter can request premium order', async ({ apiClient, recruiterToken }) => {
  11 |     const response = await new PaymentsApi(apiClient).createPremiumOrder(recruiterToken);
  12 |     expect(response.status(), await response.text()).toBeLessThan(300);
  13 |     const body = await response.json();
  14 |     expect(body.orderId || body.id || body.order?.id || body.data?.orderId).toBeTruthy();
  15 |   });
  16 | 
  17 |   test('invalid payment verification is rejected', async ({ apiClient, recruiterToken }) => {
  18 |     const response = await new PaymentsApi(apiClient).verifyPremium(recruiterToken, {
  19 |       razorpay_order_id: 'order_invalid',
  20 |       razorpay_payment_id: 'pay_invalid',
  21 |       razorpay_signature: 'invalid'
  22 |     });
  23 |     expect([400, 401, 402, 422]).toContain(response.status());
  24 |   });
  25 | });
  26 | 
```