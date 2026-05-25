import { expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class AdminPage extends BasePage {
  async openDashboard() {
    await this.goto('/admin-dashboard');
  }

  async assertDashboard() {
    await expect(this.page.getByText(/dashboard|analytics|users|recruiters/i).first()).toBeVisible();
  }

  async openUsers() {
    await this.page.getByRole('link', { name: /users|user management/i }).or(this.page.getByText(/user management/i)).first().click();
  }

  async openNotifications() {
    await this.page.getByRole('link', { name: /notifications/i }).or(this.page.getByText(/notifications/i)).first().click();
  }

  async openReports() {
    await this.page.getByRole('link', { name: /reports|analytics/i }).or(this.page.getByText(/reports|analytics/i)).first().click();
  }
}
