import { expect } from '@playwright/test';
import { waitForAppReady } from '../utils/waits.js';

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path) {
    try {
      await this.page.goto(path);
    } catch (error) {
      if (!String(error?.message || '').includes('ERR_ABORTED')) {
        throw error;
      }
    }
    await waitForAppReady(this.page);
  }

  async fillByLabelOrPlaceholder(name, value) {
    const locator = this.page.getByLabel(name).or(this.page.getByPlaceholder(name)).first();
    await expect(locator, `Input not found: ${name}`).toBeVisible();
    await locator.fill(value);
  }

  async clickButton(name) {
    const button = this.page.getByRole('button', { name }).first();
    await expect(button, `Button not found: ${name}`).toBeVisible();
    await button.click();
  }

  async expectPageSignal(pattern) {
    await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 15_000 });
  }

  async selectOption(label, value) {
    const field = this.page.getByLabel(label).first();
    await expect(field, `Dropdown not found: ${label}`).toBeVisible();
    await field.selectOption(value);
  }

  async expectToast(pattern) {
    await expect(this.page.getByRole('status').or(this.page.getByText(pattern)).first()).toBeVisible({
      timeout: 15_000
    });
  }

  async confirmModal(action = /confirm|yes|delete|ok/i) {
    const dialogButton = this.page.getByRole('button', { name: action }).first();
    await expect(dialogButton).toBeVisible({ timeout: 10_000 });
    await dialogButton.click();
  }

  async waitForApiResponse(urlPattern, action) {
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => urlPattern.test(res.url()), { timeout: 20_000 }),
      action()
    ]);
    return response;
  }
}
