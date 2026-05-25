import { request, test as setup, expect } from '@playwright/test';
import { env } from '../config/env.js';
import { ApiClient } from '../api/api-client.js';
import { AuthApi } from '../api/auth.api.js';

const roles = [
  ['admin', 'qa/.auth/admin.json'],
  ['recruiter', 'qa/.auth/recruiter.json'],
  ['candidate', 'qa/.auth/candidate.json']
];

async function loginByApi(role) {
  const context = await request.newContext({ baseURL: env.apiBaseURL });
  const apiClient = new ApiClient(context);
  const authApi = new AuthApi(apiClient);

  try {
    let response = await authApi.login(role);
    if (response.status() === 401 && role !== 'admin') {
      await authApi.register(role);
      response = await authApi.login(role);
    }

    expect(response.status(), await response.text()).toBeLessThan(300);
    const body = await response.json();
    expect(body.token).toBeTruthy();
    expect(body.user).toBeTruthy();
    return body;
  } finally {
    await context.dispose();
  }
}

for (const [role, storagePath] of roles) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const auth = await loginByApi(role);
    const user = {
      ...auth.user,
      role: role === 'candidate' ? 'user' : auth.user.role
    };

    await page.goto('/');
    await page.evaluate(({ token, user, isAdmin }) => {
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
      token: auth.token,
      user,
      isAdmin: role === 'admin'
    });

    await page.context().storageState({ path: storagePath });
  });
}
