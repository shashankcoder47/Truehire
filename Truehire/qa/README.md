# TrueHire Enterprise QA Automation Framework

## Architecture

```text
qa/
  api/                 API clients for auth, jobs, applications, payments, admin
  config/              Environment loader, global setup, global teardown
  fixtures/            Playwright fixtures and upload files
  helpers/             Authentication and file helpers
  load/                Artillery load/stress scripts and processors
  pages/               Playwright Page Object Model classes
  payloads/            CSV payloads for performance tests
  reports/             HTML, JSON, JUnit, Allure, trace, screenshot, video output
  tests/
    api/               Baseline and advanced API automation
    security/          API security automation
    ui/                UI regression and business journey automation
  utils/               Assertions, token manager, data factories, logger, waits
```

## Coverage

- Auth: positive/negative login, validation, JWT, expired/tampered token, unauthorized access, SQLi, XSS, concurrent login.
- Jobs: create/read/update/delete, validation, RBAC, recruiter ownership, candidate restrictions, large payload, duplicate-title behavior, SQLi search.
- Applications: candidate apply, duplicate prevention, tracking, recruiter inbox, admin access, upload validation, file type and size checks.
- Payments: Razorpay order contract, invalid signature, duplicate callback, webhook validation, subscription status, role restrictions.
- Admin: dashboard stats, user/recruiter management, approval queues, jobs and application reports, unauthorized and role validation.
- Security: broken access control, invalid headers, sensitive data exposure, JWT tampering, SQLi, XSS, burst login stability.
- UI: login/register, create/manage jobs, candidate search/tracking/profile, notifications, dashboards, payments, logout.

## Setup

```powershell
npm.cmd install
Set-Location "Truehire\backend"; npm.cmd install
Set-Location "..\frontend"; npm.cmd install
Set-Location "..\.."; npx.cmd playwright install
```

Create `.env` from `.env.example` at the repository root if you want to override URLs or QA credentials. The framework also reads `Truehire/backend/.env` for `JWT_SECRET` when expired-token tests need to sign a test token.

## Run Commands

```powershell
npm.cmd run test:api
npm.cmd run test:api:advanced
npm.cmd run test:security
npm.cmd run test:security:advanced
npm.cmd run test:ui
npm.cmd run test:chrome
npm.cmd run test:headed
npm.cmd run report:html
```

Performance:

```powershell
npm.cmd run load
npm.cmd run load:login
npm.cmd run load:jobs
npm.cmd run load:apply
npm.cmd run load:dashboard
npm.cmd run load:payments
npm.cmd run load:report
```

## Reports

- Playwright HTML: `qa/reports/playwright-html/index.html`
- JUnit: `qa/reports/junit/results.xml`
- JSON: `qa/reports/playwright-json/results.json`
- Traces, videos, screenshots: `qa/reports/test-results`
- Artillery JSON/HTML: `qa/reports/artillery`
- Allure results: `qa/reports/allure-results` when `allure-playwright` is installed.

## Best Practices

- Keep tests role-aware: admin, recruiter, and candidate helpers should never share assumptions.
- Prefer API helpers for setup and cleanup, then assert UI behavior through stable user-facing selectors.
- Use `expectStatus`, `expectSuccessEnvelope`, and schema helpers for consistent assertions.
- Avoid fixed sleeps. Wait for locators, URLs, network responses, or API state.
- Generate unique test data with factories in `qa/utils/test-data.js`.
- Keep destructive operations scoped to records created inside the test.
- Run load tests only against a test/performance environment, never production without approval.
- Store secrets in `.env` locally and GitHub Actions secrets in CI.

## Common Fixes

- `Route not found: POST /auth/login`: set `API_BASE_URL=http://127.0.0.1:5000/api` or rely on the framework normalizer.
- `Invalid email or password`: seed admin with `admin@truehire.com / admin123`; recruiter/candidate QA users are auto-created by the auth helper.
- `spawn EPERM`: run Playwright commands directly in PowerShell, or approve Node worker spawning if using a sandboxed runner.
- Next SWC `EPERM` during install: stop running frontend Node processes, then rerun `npm.cmd install` in `Truehire/frontend`.
- Artillery 401s: update `qa/payloads/*.csv` to credentials present in the target database.
- Razorpay failures: use test-mode Razorpay keys and a non-production payment account.
