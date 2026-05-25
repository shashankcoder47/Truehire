import { expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class RecruiterPage extends BasePage {
  async openDashboard() {
    await this.goto('/recruiter-dashboard');
  }

  async openCreateJob() {
    await this.goto('/post-job');
  }

  async createJob(job) {
    await this.openCreateJob();
    await this.fillByLabelOrPlaceholder(/title|job title/i, job.title);
    await this.fillByLabelOrPlaceholder(/company/i, job.company);
    await this.fillByLabelOrPlaceholder(/location/i, job.location);
    await this.fillByLabelOrPlaceholder(/description/i, job.description);
    await this.fillByLabelOrPlaceholder(/requirements/i, job.requirements);
    await this.page.getByRole('button', { name: /post|create|submit/i }).click();
    await expect(this.page.getByText(/success|created|posted/i).first()).toBeVisible({ timeout: 20_000 });
  }

  async openManageJobs() {
    await this.goto('/active-jobs');
  }

  async openApplications() {
    await this.goto('/recruiter-applications');
  }

  async scheduleInterview() {
    await this.page.getByRole('button', { name: /schedule/i }).first().click();
    await expect(this.page.getByText(/interview|schedule/i).first()).toBeVisible();
  }
}
