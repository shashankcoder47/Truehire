import { expect } from '@playwright/test';

export class ApiClient {
  constructor(requestContext) {
    this.request = requestContext;
  }

  path(pathname) {
    return String(pathname).replace(/^\/+/, '');
  }

  authHeaders(token, extra = {}) {
    return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
  }

  async get(path, { token, headers, ...options } = {}) {
    return this.request.get(this.path(path), { headers: this.authHeaders(token, headers), ...options });
  }

  async post(path, data, { token, headers, ...options } = {}) {
    return this.request.post(this.path(path), { data, headers: this.authHeaders(token, headers), ...options });
  }

  async put(path, data, { token, headers, ...options } = {}) {
    return this.request.put(this.path(path), { data, headers: this.authHeaders(token, headers), ...options });
  }

  async patch(path, data, { token, headers, ...options } = {}) {
    return this.request.patch(this.path(path), { data, headers: this.authHeaders(token, headers), ...options });
  }

  async delete(path, { token, headers, ...options } = {}) {
    return this.request.delete(this.path(path), { headers: this.authHeaders(token, headers), ...options });
  }

  async expectOk(response) {
    expect(response.status(), await response.text()).toBeGreaterThanOrEqual(200);
    expect(response.status(), await response.text()).toBeLessThan(300);
    return response.json().catch(() => ({}));
  }
}
