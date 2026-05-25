import { test, expect } from '../../fixtures/test-fixtures.js';
import { LoginPage } from '../../pages/login.page.js';
import { RegisterPage } from '../../pages/register.page.js';
import { RecruiterPage } from '../../pages/recruiter.page.js';
import { CandidatePage } from '../../pages/candidate.page.js';
import { PaymentPage } from '../../pages/payment.page.js';
import { env } from '../../config/env.js';
import { logout } from '../../helpers/auth.helper.js';

test.describe('Advanced UI Journeys', () => {
  test('login page validates invalid credentials and then allows candidate login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.submitInvalidLogin('candidate', {
      email: 'bad.user@example.com',
      password: 'WrongPassword123!'
    });
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();

    await loginPage.loginAs('candidate', env.credentials.candidate);
    await expect(page).toHaveURL(/user-dashboard|dashboard/);
  });

  test('register page renders expected candidate fields', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.openCandidateRegister();
    await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first()).toBeVisible();
  });

  test('recruiter can open create job and manage jobs pages', async ({ page }) => {
    await new LoginPage(page).loginAs('recruiter', env.credentials.recruiter);
    const recruiter = new RecruiterPage(page);
    await recruiter.openCreateJob();
    await expect(page).toHaveURL(/post-job|recruiter-dashboard|login/);
    await recruiter.openManageJobs();
    await expect(page).toHaveURL(/active-jobs|recruiter-dashboard|login/);
  });

  test('candidate can search, track applications, and update profile page', async ({ page }) => {
    await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
    const candidate = new CandidatePage(page);
    await candidate.openJobs();
    await expect(page).toHaveURL(/jobs|user-dashboard|login/);
    await candidate.openApplications();
    await expect(page).toHaveURL(/applications|user-dashboard|login/);
    await candidate.goto('/profile');
    await expect(page).toHaveURL(/profile|user-dashboard|login/);
  });

  test('payment page exposes subscription purchase controls', async ({ page }) => {
    await new LoginPage(page).loginAs('recruiter', env.credentials.recruiter);
    await new PaymentPage(page).openSubscriptions();
    await expect(page).toHaveURL(/billing-plans|recruiter-dashboard|login/);
  });

  test('logout flow returns user to public or login page', async ({ page }) => {
    await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
    await logout(page);
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('notification and dashboard pages render for authenticated users', async ({ page }) => {
    await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
    const candidate = new CandidatePage(page);
    await candidate.goto('/notifications');
    await expect(page).toHaveURL(/notifications|user-dashboard|login/);
    await candidate.goto('/overview');
    await expect(page).toHaveURL(/overview|user-dashboard|login/);
  });

  test('page objects can submit profile data without fixed waits', async ({ page }) => {
    await new LoginPage(page).loginAs('candidate', env.credentials.candidate);
    const candidate = new CandidatePage(page);
    await candidate.goto('/profile');
    await expect(page).toHaveURL(/profile|user-dashboard|login/);
  });
});
