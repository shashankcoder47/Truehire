import { expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class PaymentPage extends BasePage {
  async openSubscriptions() {
    await this.goto('/billing-plans');
  }

  async startSubscriptionPurchase() {
    await this.openSubscriptions();
    await this.page.getByRole('button', { name: /subscribe|upgrade|buy|pay/i }).first().click();
    await expect(this.page.getByText(/razorpay|payment|checkout|subscription/i).first()).toBeVisible({ timeout: 20_000 });
  }

  async assertFailureMessage() {
    await expect(this.page.getByText(/failed|cancelled|payment error|try again/i).first()).toBeVisible({ timeout: 20_000 });
  }
}
