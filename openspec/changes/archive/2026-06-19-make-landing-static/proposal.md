# Proposal: Make Landing Static

## Intent

Convert the Astro application from a Server-Side Rendered (SSR) Node application to a 100% static (SSG) site. This removes the Node server dependency, simplifies hosting on static platforms (specifically Hostinger), and improves performance.

## Scope

### In Scope
- Change Astro output to `'static'` and remove `@astrojs/node` adapter.
- Archive existing database, authentication, and dashboard files by moving them to `src/legacy-auth/`.
- Add an Apache redirect configuration (`public/.htaccess`) to redirect legacy routes (`/login`, `/register`, `/dashboard`) to `/`.
- Uninstall unused dependencies: `@astrojs/node`, `bcryptjs`, `drizzle-orm`, `mysql2`, `@types/bcryptjs`, `drizzle-kit`.
- Clear `App.Locals` in `src/env.d.ts` and verify build.

### Out of Scope
- Dynamic user accounts or login functionality.
- Database maintenance or queries.
- Removing preserved code from version control history.

## Capabilities

### New Capabilities
None

### Modified Capabilities
None

## Approach

1. **Astro Config Update**: Change `output` in `astro.config.mjs` to `'static'` and remove the Node adapter configuration.
2. **Code Archival**: Move files related to database, authentication, and dashboard into `src/legacy-auth/` so they are excluded from the Astro pages build directory.
3. **Apache Redirects**: Create `public/.htaccess` containing redirect rules for the deprecated pages.
4. **Dependency Clean-up**: Uninstall node-specific and auth/db dependencies.
5. **Types Clean-up**: Remove middleware definitions and type definitions for `App.Locals`.
6. **Verification**: Run TypeScript checks, linters, and build testing.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `astro.config.mjs` | Modified | Change `output` to `'static'`, remove adapter |
| `package.json` | Modified | Remove unused runtime/dev dependencies |
| `src/env.d.ts` | Modified | Empty `App.Locals` interface |
| `public/.htaccess` | New | Add rewrite rules redirecting legacy pages to `/` |
| `src/legacy-auth/` | New | Target folder for archived auth, db, and dashboard code |
| `src/pages/` | Modified | Move `login.astro`, `register.astro`, and `dashboard/` |
| `src/middleware.ts` | Removed | Move to `src/legacy-auth/middleware.ts` |
| `src/db/` | Removed | Move database setup/schema to `src/legacy-auth/db/` |
| `src/lib/auth.ts` | Removed | Move auth logic to `src/legacy-auth/lib/auth.ts` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 404 on legacy URLs | Low | Implement redirect rules in `public/.htaccess` |
| Build errors due to missing imports | Low | Verify imports; run typecheck and build locally |

## Rollback Plan

To revert the change:
1. Revert Git changes (`git checkout` or `git revert`).
2. Reinstall packages using `npm install`.
3. Restore config settings in `astro.config.mjs`.

## Dependencies

- None

## Success Criteria

- [ ] Successful static build output (`dist/` contains index.html, no server entrypoint).
- [ ] TypeScript check and ESLint run without errors.
- [ ] `.htaccess` correctly written to the static output directory.
- [ ] No compilation references to `src/legacy-auth/` in the build process.
