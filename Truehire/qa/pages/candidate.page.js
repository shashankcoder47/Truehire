import { expect } from '@playwright/test';
import { BasePage } from './base.page.js';
import { fixturePath } from '../helpers/file.helper.js';

export class CandidatePage extends BasePage {
  async openJobs() {
    await this.goto('/jobs');
  }

  async searchJobs(keyword) {
    await this.openJobs();
    const search = this.page.getByPlaceholder(/search|job title|keyword/i).or(this.page.getByLabel(/search|keyword/i)).first();
    await search.fill(keyword);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await expect(this.page.getByText(new RegExp(keyword, 'i')).first()).toBeVisible({ timeout: 15_000 });
  }

  async applyToFirstJob() {
    await this.openJobs();
    await this.page.getByRole('link', { name: /apply|view|details/i }).or(this.page.getByRole('button', { name: /apply/i })).first().click();
    const upload = this.page.locator('input[type="file"]').first();
    if (await upload.count()) {
      await upload.setInputFiles(fixturePath('resume.pdf'));
    }
    await this.page.getByRole('button', { name: /apply|submit/i }).first().click();
    await expect(this.page.getByText(/applied|success|submitted/i).first()).toBeVisible({ timeout: 20_000 });
  }

  async openApplications() {
    await this.goto('/applications');
  }

  async updateProfile(profile) {
    await this.goto('/profile');
    await this.fillByLabelOrPlaceholder(/name/i, profile.name);
    await this.fillByLabelOrPlaceholder(/location/i, profile.location);
    await this.page.getByRole('button', { name: /save|update/i }).click();
    await expect(this.page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 15_000 });
  }
}
