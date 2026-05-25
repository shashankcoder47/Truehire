# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\payments-advanced.api.spec.js >> Payments API Advanced Coverage >> Razorpay order creation returns checkout contract
- Location: qa\tests\api\payments-advanced.api.spec.js:5:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 6

- ObjectContaining {
-   "success": true,
+ Object {
+   "amount": 100,
+   "currency": "INR",
+   "key": "rzp_test_S0UbXnsKz7vddk",
+   "keyId": "rzp_test_S0UbXnsKz7vddk",
+   "orderId": "order_Sm1ThexmovjTw7",
  }
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | 
  3  | export async function expectStatus(response, allowedStatuses, message = '') {
  4  |   const statuses = Array.isArray(allowedStatuses) ? allowedStatuses : [allowedStatuses];
  5  |   expect(statuses, `${message}\n${await response.text()}`).toContain(response.status());
  6  | }
  7  | 
  8  | export async function expectSuccessEnvelope(response) {
  9  |   expect(response.status(), await response.text()).toBeGreaterThanOrEqual(200);
  10 |   expect(response.status(), await response.text()).toBeLessThan(300);
  11 |   const body = await response.json();
> 12 |   expect(body).toEqual(expect.objectContaining({ success: true }));
     |                ^ Error: expect(received).toEqual(expected) // deep equality
  13 |   return body;
  14 | }
  15 | 
  16 | export function expectLoginSchema(body) {
  17 |   expect(body).toEqual(expect.objectContaining({
  18 |     success: true,
  19 |     token: expect.any(String),
  20 |     user: expect.objectContaining({
  21 |       id: expect.any(String),
  22 |       email: expect.any(String),
  23 |       role: expect.any(String)
  24 |     })
  25 |   }));
  26 | }
  27 | 
  28 | export function expectJobSchema(job) {
  29 |   expect(job).toEqual(expect.objectContaining({
  30 |     id: expect.any(String),
  31 |     title: expect.any(String),
  32 |     location: expect.any(String),
  33 |     status: expect.any(String)
  34 |   }));
  35 | }
  36 | 
  37 | export function expectNoSensitiveAuthData(value) {
  38 |   const serialized = JSON.stringify(value).toLowerCase();
  39 |   expect(serialized).not.toContain('password');
  40 |   expect(serialized).not.toContain('jwt_secret');
  41 |   expect(serialized).not.toContain('razorpay_key_secret');
  42 | }
  43 | 
```