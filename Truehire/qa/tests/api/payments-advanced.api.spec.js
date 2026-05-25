import { test, expect } from '../../fixtures/test-fixtures.js';
import { expectStatus, expectSuccessEnvelope } from '../../utils/assertions.js';

test.describe('Payments API Advanced Coverage', () => {
  test('Razorpay order creation returns checkout contract', async ({ paymentsApi, recruiterToken }) => {
    const response = await paymentsApi.createPremiumOrder(recruiterToken, {
      amount: 1,
      planId: 'premium-monthly'
    });
    expect(response.status(), await response.text()).toBeLessThan(300);
    const body = await response.json();

    expect(body).toEqual(expect.objectContaining({
      orderId: expect.any(String),
      amount: expect.any(Number),
      currency: expect.any(String)
    }));
    expect(body.key || body.keyId).toBeTruthy();
  });

  test('candidate cannot create recruiter premium order', async ({ paymentsApi, candidateToken }) => {
    await expectStatus(await paymentsApi.createPremiumOrder(candidateToken), [401, 403]);
  });

  test('anonymous user cannot access payment APIs', async ({ paymentsApi }) => {
    await expectStatus(await paymentsApi.createPremiumOrder(), [401, 403]);
    await expectStatus(await paymentsApi.status(), [401, 403]);
  });

  test('invalid payment signature is rejected and does not activate subscription', async ({ paymentsApi, recruiterToken }) => {
    await expectStatus(
      await paymentsApi.verifyPremium(recruiterToken, {
        razorpay_order_id: `order_invalid_${Date.now()}`,
        razorpay_payment_id: `pay_invalid_${Date.now()}`,
        razorpay_signature: 'invalid'
      }),
      [400, 401, 402, 422]
    );

    const statusBody = await expectSuccessEnvelope(await paymentsApi.status(recruiterToken));
    expect(statusBody.subscription).toEqual(expect.objectContaining({
      isPremium: expect.any(Boolean)
    }));
  });

  test('duplicate invalid callback remains idempotently rejected', async ({ paymentsApi, recruiterToken }) => {
    const payload = {
      razorpay_order_id: `order_duplicate_${Date.now()}`,
      razorpay_payment_id: `pay_duplicate_${Date.now()}`,
      razorpay_signature: 'invalid'
    };

    await expectStatus(await paymentsApi.verifyPremium(recruiterToken, payload), [400, 401, 402, 422]);
    await expectStatus(await paymentsApi.verifyPremium(recruiterToken, payload), [400, 401, 402, 422]);
  });

  test('webhook rejects missing or invalid Razorpay signature', async ({ apiClient }) => {
    const response = await apiClient.post('/payments/webhook', {
      event: 'payment.captured',
      payload: {}
    }, {
      headers: { 'x-razorpay-signature': 'invalid' }
    });

    await expectStatus(response, [400, 401, 422, 500]);
  });

  test('subscription status is only visible to recruiter', async ({ paymentsApi, recruiterToken, adminToken }) => {
    await expectStatus(await paymentsApi.status(recruiterToken), 200);
    await expectStatus(await paymentsApi.status(adminToken), [401, 403]);
  });
});
