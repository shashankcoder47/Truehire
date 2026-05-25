import { test as base, expect, request } from '@playwright/test';
import { env } from '../config/env.js';
import { ApiClient } from '../api/api-client.js';
import { AuthApi } from '../api/auth.api.js';
import { JobsApi } from '../api/jobs.api.js';
import { ApplicationsApi } from '../api/applications.api.js';
import { PaymentsApi } from '../api/payments.api.js';
import { AdminApi } from '../api/admin.api.js';

export const test = base.extend({
  apiClient: async ({}, use) => {
    const context = await request.newContext({ baseURL: env.apiBaseURL });
    await use(new ApiClient(context));
    await context.dispose();
  },
  authApi: async ({ apiClient }, use) => {
    await use(new AuthApi(apiClient));
  },
  jobsApi: async ({ apiClient }, use) => {
    await use(new JobsApi(apiClient));
  },
  applicationsApi: async ({ apiClient }, use) => {
    await use(new ApplicationsApi(apiClient));
  },
  paymentsApi: async ({ apiClient }, use) => {
    await use(new PaymentsApi(apiClient));
  },
  adminApi: async ({ apiClient }, use) => {
    await use(new AdminApi(apiClient));
  },
  adminToken: async ({ authApi }, use) => {
    await use(await authApi.loginAndGetToken('admin'));
  },
  recruiterToken: async ({ authApi }, use) => {
    await use(await authApi.loginAndGetToken('recruiter'));
  },
  candidateToken: async ({ authApi }, use) => {
    await use(await authApi.loginAndGetToken('candidate'));
  }
});

export { expect };
