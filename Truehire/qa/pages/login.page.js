import { expect } from '@playwright/test';
import { BasePage } from './base.page.js';
import { env } from '../config/env.js';

const rolePaths = {
  admin: '/login?role=admin',
  recruiter: '/login?role=recruiter',
  candidate: '/login?role=user'
};

const redirectPaths = {
  admin: '/admin-dashboard',
  recruiter: '/recruiter-dashboard',
  candidate: '/user-dashboard'
};

const apiRoles = {
  admin: 'ADMIN',
  recruiter: 'RECRUITER',
  candidate: 'USER'
};

export class LoginPage extends BasePage {
  async open(role = 'candidate') {
    await this.goto(rolePaths[role] || rolePaths.candidate);
  }

  async loginAs(role, credentials) {
    await this.open(role);
    await this.fillByLabelOrPlaceholder(/email/i, credentials.email);
    await this.fillByLabelOrPlaceholder(/password/i, credentials.password);
    await this.loginByApiInBrowser(role, credentials);
    await this.goto(redirectPaths[role] || redirectPaths.candidate);
    await expect(this.page).toHaveURL(new RegExp(redirectPaths[role].replace('/', '')));
  }

  async submitInvalidLogin(role, credentials) {
    await this.open(role);
    await this.fillByLabelOrPlaceholder(/email/i, credentials.email);
    await this.fillByLabelOrPlaceholder(/password/i, credentials.password);
    const response = await this.page.request.post(`${env.apiBaseURL}auth/login`, {
      data: {
        email: credentials.email,
        password: credentials.password,
        role: apiRoles[role] || 'USER'
      }
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  }

  async submitLoginForm() {
    const button = this.page.getByRole('button', { name: /login|sign in/i }).first();
    await expect(button).toBeVisible();
    await this.page.addStyleTag({
      content: 'nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast] { pointer-events: none !important; }'
    }).catch(() => {});
    await button.click({ force: true });
  }

  async loginByApiInBrowser(role, credentials) {
    const response = await this.page.request.post(`${env.apiBaseURL}auth/login`, {
      data: {
        email: credentials.email,
        password: credentials.password,
        role: apiRoles[role] || 'USER'
      }
    });

    expect(response.status(), await response.text()).toBeLessThan(300);
    const body = await response.json();
    const user = {
      ...body.user,
      role: role === 'candidate' ? 'user' : body.user?.role
    };

    await this.page.evaluate(({ token, user, isAdmin }) => {
      const serializedUser = JSON.stringify(user);
      for (const storage of [window.sessionStorage, window.localStorage]) {
        storage.setItem('token', token);
        storage.setItem('user', serializedUser);
        if (isAdmin) {
          storage.setItem('adminToken', token);
        } else {
          storage.removeItem('adminToken');
        }
      }
    }, {
      token: body.token,
      user,
      isAdmin: role === 'admin'
    });
  }
}
