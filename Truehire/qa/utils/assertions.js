import { expect } from '@playwright/test';

export async function expectStatus(response, allowedStatuses, message = '') {
  const statuses = Array.isArray(allowedStatuses) ? allowedStatuses : [allowedStatuses];
  expect(statuses, `${message}\n${await response.text()}`).toContain(response.status());
}

export async function expectSuccessEnvelope(response) {
  expect(response.status(), await response.text()).toBeGreaterThanOrEqual(200);
  expect(response.status(), await response.text()).toBeLessThan(300);
  const body = await response.json();
  expect(body).toEqual(expect.objectContaining({ success: true }));
  return body;
}

export function expectLoginSchema(body) {
  expect(body).toEqual(expect.objectContaining({
    success: true,
    token: expect.any(String),
    user: expect.objectContaining({
      id: expect.any(String),
      email: expect.any(String),
      role: expect.any(String)
    })
  }));
}

export function expectJobSchema(job) {
  expect(job).toEqual(expect.objectContaining({
    id: expect.any(String),
    title: expect.any(String),
    location: expect.any(String),
    status: expect.any(String)
  }));
}

export function expectNoSensitiveAuthData(value) {
  const serialized = JSON.stringify(value).toLowerCase();
  expect(serialized).not.toContain('password');
  expect(serialized).not.toContain('jwt_secret');
  expect(serialized).not.toContain('razorpay_key_secret');
}
