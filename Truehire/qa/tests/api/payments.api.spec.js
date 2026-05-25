import { test, expect } from '../../fixtures/test-fixtures.js';
import { PaymentsApi } from '../../api/payments.api.js';

test.describe('Payments API', () => {
  test('subscription status requires recruiter authentication', async ({ apiClient }) => {
    const response = await new PaymentsApi(apiClient).status();
    expect([401, 403]).toContain(response.status());
  });

  test('recruiter can request premium order', async ({ apiClient, recruiterToken }) => {
    const response = await new PaymentsApi(apiClient).createPremiumOrder(recruiterToken);
    expect(response.status(), await response.text()).toBeLessThan(300);
    const body = await response.json();
    expect(body.orderId || body.id || body.order?.id || body.data?.orderId).toBeTruthy();
  });

  test('invalid payment verification is rejected', async ({ apiClient, recruiterToken }) => {
    const response = await new PaymentsApi(apiClient).verifyPremium(recruiterToken, {
      razorpay_order_id: 'order_invalid',
      razorpay_payment_id: 'pay_invalid',
      razorpay_signature: 'invalid'
    });
    expect([400, 401, 402, 422]).toContain(response.status());
  });
});
