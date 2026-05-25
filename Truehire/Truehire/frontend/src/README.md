## Frontend Structure

This frontend is being standardized toward a production-style layout.

Preferred folders:

- `features/*`: domain-owned frontend entry points for home, jobs, admin, recruiter, and user
- `Portal`: flat shared UI for reusable presentation pieces like header, footer, hero, job cards, stats, and testimonials
- `context`: React context providers
- `lib/api`: canonical API client entry points
- `pages`: route files only
- `services`: compatibility layer for older imports
- `utils`: pure helpers and utilities

Compatibility notes:

- Shared UI now lives directly under `Portal`, not nested `layout`, `jobs`, `admin`, or `ui` folders.
- New code should prefer `features/*`, `Portal/*`, and `lib/api`.
- High-traffic routes should use thin wrappers in `pages` that re-export feature page modules.

