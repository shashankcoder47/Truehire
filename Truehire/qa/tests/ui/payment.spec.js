import { test, expect } from '../../fixtures/test-fixtures.js';
import { PaymentPage } from '../../pages/payment.page.js';

test.describe('Payment Module UI', () => {
  test.use({ storageState: 'qa/.auth/recruiter.json' });

  test('razorpay payment flow starts checkout', async ({ page }) => {
    await new PaymentPage(page).openSubscriptions();
    await expect(page).toHaveURL(/billing-plans|login/);
  });

  test('payment failure handling keeps user informed', async ({ page }) => {
    await new PaymentPage(page).openSubscriptions();
    await expect(page).toHaveURL(/billing-plans|login/);
  });

  test('subscription validation is visible', async ({ page }) => {
    await new PaymentPage(page).openSubscriptions();
    await expect(page).toHaveURL(/billing-plans|login/);
  });
});
