# Tasks: Make Landing Static

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 50-80 lines (excluding git renames) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Convert application to static, archive dynamic features, clean packages, and verify static build | PR 1 | Base branch; tests and redirection included |

## Phase 1: Archival/Infrastructure

- [x] 1.1 Move `src/pages/login.astro` to `src/legacy-auth/pages/login.astro`
- [x] 1.2 Move `src/pages/register.astro` to `src/legacy-auth/pages/register.astro`
- [x] 1.3 Move `src/pages/dashboard/index.astro` to `src/legacy-auth/pages/dashboard/index.astro`
- [x] 1.4 Move `src/middleware.ts` to `src/legacy-auth/middleware.ts`
- [x] 1.5 Move `src/lib/auth.ts` to `src/legacy-auth/lib/auth.ts`
- [x] 1.6 Move `src/db/db.ts` to `src/legacy-auth/db/db.ts`
- [x] 1.7 Move `src/db/schema.ts` to `src/legacy-auth/db/schema.ts`
- [x] 1.8 Move `src/tests/auth.test.ts` to `src/legacy-auth/tests/auth.test.ts`
- [x] 1.9 Move `server.js` to `src/legacy-auth/server.js`
- [x] 1.10 Move `drizzle.config.ts` to `src/legacy-auth/drizzle.config.ts`

## Phase 2: Configuration & Types

- [x] 2.1 Modify `astro.config.mjs` to remove `@astrojs/node` adapter import and call, and set `output: 'static'`
- [x] 2.2 Modify `src/env.d.ts` to empty the `App.Locals` interface definition and add eslint disable comment to ignore empty object type lint warning
- [x] 2.3 Modify `tsconfig.json` to add `"src/legacy-auth"` to the `"exclude"` configuration array
- [x] 2.4 Exclude `src/legacy-auth/**` in `vitest.config.ts`

## Phase 3: Redirect Rules

- [x] 3.1 Create `public/.htaccess` with rewrite rules returning a 301 Permanent Redirect to `/` for request paths `/login`, `/register`, and `/dashboard`
- [x] 3.2 Create `src/tests/siteData.test.ts` asserting basic static site properties to keep unit test suite active

## Phase 4: Package Cleanup

- [x] 4.1 Uninstall unused dependencies `@astrojs/node`, `bcryptjs`, `drizzle-orm`, `mysql2`, `@types/bcryptjs`, `drizzle-kit` from `package.json` and prune `node_modules`

## Phase 5: Verification & Testing

- [x] 5.1 Run `npm run typecheck` or `npx astro check` to verify TypeScript and Astro build check success
- [x] 5.2 Run `npm run build` (or `npx astro build`) to generate static build in `dist/`
- [x] 5.3 Verify `dist/` directory contains no Node server or SSR entry point files
- [x] 5.4 Verify `dist/.htaccess` is correctly copied and contains the legacy redirect rules
