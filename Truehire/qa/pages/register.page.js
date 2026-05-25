import { expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class RegisterPage extends BasePage {
  async openCandidateRegister() {
    await this.goto('/register');
  }

  async registerCandidate(candidate) {
    await this.openCandidateRegister();
    await this.fillByLabelOrPlaceholder(/name/i, candidate.name);
    await this.fillByLabelOrPlaceholder(/email/i, candidate.email);
    await this.fillByLabelOrPlaceholder(/password/i, candidate.password);
    await this.page.getByRole('button', { name: /register|sign up|create account/i }).click();
    await expect(this.page.getByText(/success|login|verify|registered/i).first()).toBeVisible({ timeout: 20_000 });
  }
}
