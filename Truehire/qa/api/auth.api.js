import { expect } from '@playwright/test';
import { env } from '../config/env.js';

export class AuthApi {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async login(role, overrides = {}) {
    const credentials = { ...env.credentials[role], ...overrides };
    const apiRole = {
      admin: 'ADMIN',
      recruiter: 'RECRUITER',
      candidate: 'USER',
      user: 'USER'
    }[role] || role;

    return this.api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      role: apiRole
    });
  }

  async loginAndGetToken(role) {
    let response = await this.login(role);

    if (response.status() === 401 && role !== 'admin') {
      await this.register(role);
      response = await this.login(role);
    }

    expect(response.status(), await response.text()).toBeLessThan(300);
    const body = await response.json();
    const token = body.token || body.accessToken || body.jwt || body.data?.token;
    expect(token, `No JWT token returned for ${role} login`).toBeTruthy();
    return token;
  }

  async register(role) {
    const credentials = env.credentials[role];
    const payload = {
      name: role === 'recruiter' ? 'QA Recruiter' : 'QA Candidate',
      email: credentials.email,
      password: credentials.password
    };

    if (role === 'recruiter') {
      payload.company = 'TrueHire QA Labs';
    }

    const registerPath = role === 'recruiter' ? '/auth/register/recruiter' : '/auth/register/user';
    const response = await this.api.post(registerPath, payload);

    if (![200, 201, 409].includes(response.status())) {
      expect(response.status(), await response.text()).toBeLessThan(300);
    }

    return response;
  }
}
