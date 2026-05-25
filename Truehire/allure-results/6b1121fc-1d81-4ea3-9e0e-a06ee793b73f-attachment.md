# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\jobs.api.spec.js >> Jobs API CRUD >> candidate cannot create a job
- Location: qa\tests\api\jobs.api.spec.js:28:3

# Error details

```
Error: {"success":false,"message":"Invalid email or password"}

expect(received).toBeLessThan(expected)

Expected: < 300
Received:   401
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | import { env } from '../config/env.js';
  3  | 
  4  | export class AuthApi {
  5  |   constructor(apiClient) {
  6  |     this.api = apiClient;
  7  |   }
  8  | 
  9  |   async login(role, overrides = {}) {
  10 |     const credentials = { ...env.credentials[role], ...overrides };
  11 |     const apiRole = {
  12 |       admin: 'ADMIN',
  13 |       recruiter: 'RECRUITER',
  14 |       candidate: 'USER',
  15 |       user: 'USER'
  16 |     }[role] || role;
  17 | 
  18 |     return this.api.post('/auth/login', {
  19 |       email: credentials.email,
  20 |       password: credentials.password,
  21 |       role: apiRole
  22 |     });
  23 |   }
  24 | 
  25 |   async loginAndGetToken(role) {
  26 |     const response = await this.login(role);
> 27 |     expect(response.status(), await response.text()).toBeLessThan(300);
     |                                                      ^ Error: {"success":false,"message":"Invalid email or password"}
  28 |     const body = await response.json();
  29 |     const token = body.token || body.accessToken || body.jwt || body.data?.token;
  30 |     expect(token, `No JWT token returned for ${role} login`).toBeTruthy();
  31 |     return token;
  32 |   }
  33 | }
  34 | 
```