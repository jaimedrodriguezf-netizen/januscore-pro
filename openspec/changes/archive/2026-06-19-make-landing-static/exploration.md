## Exploration: make-landing-static

### Current State
The project is currently configured as an Astro SSR site (`output: 'server'`) utilizing the `@astrojs/node` adapter. It includes database connections (`src/db/db.ts`) with Drizzle ORM (using MySQL via `mysql2`), user authentication and session management utilities (`src/lib/auth.ts`), route-protection middleware (`src/middleware.ts`), and user registration, login, and dashboard pages. Testing includes Vitest for unit tests (`src/tests/auth.test.ts`) and Playwright for E2E tests (`src/tests/mobile-drawer.spec.ts`, `src/tests/navigation.spec.ts`).

### Affected Areas
- `astro.config.mjs` — Need to change `output` to `'static'`, remove `adapter: node(...)` option, and remove `@astrojs/node` import.
- `package.json` — Need to remove `@astrojs/node`, `bcryptjs`, `drizzle-orm`, and `mysql2` from `dependencies`, and `@types/bcryptjs`, `drizzle-kit` from `devDependencies`.
- `src/env.d.ts` — Need to remove or empty the `App.Locals` interface declaration (e.g., removing `user: {...}`).
- `src/middleware.ts` — File must be deleted as it contains route protection logic that is not applicable/supported on a static site.
- `src/pages/login.astro` — File must be deleted.
- `src/pages/register.astro` — File must be deleted.
- `src/pages/dashboard/index.astro` — File must be deleted.
- `src/lib/auth.ts` — File must be deleted (contains login/register/logout utility logic).
- `src/db/db.ts` — File must be deleted (database connection setup).
- `src/db/schema.ts` — File must be deleted (database table definitions).
- `src/tests/auth.test.ts` — File must be deleted as it only tests the removed auth layer.
- `server.js` — File must be deleted (production server entrypoint).
- `drizzle.config.ts` — File must be deleted (Drizzle migration config).

### Approaches
1. **Complete Removal of Backend/Database Files & Dependencies (Recommended)**
   - Remove the Astro node adapter and set `output: 'static'` in `astro.config.mjs`.
   - Remove all backend/database/session/middleware code and pages completely from the filesystem.
   - Strip out corresponding dependencies from `package.json` and clean up `src/env.d.ts`.
   - Pros:
     - Pure static site with no dead weight or unused packages.
     - Avoids bloating bundle sizes, clean code footprint.
     - Simpler build and deployment process.
   - Cons:
     - Destructive (code is removed; must retrieve from Git history if ever restored).
   - Effort: Low-Medium.

2. **Disable Backend Logic but Keep Files & Dependencies**
   - Keep files but skip building them (e.g. by setting `prerender = true` or exporting prerender flags, disabling middleware selectively).
   - Pros:
     - Keeps files available locally for future database/auth expansions.
   - Cons:
     - Dead code bloat.
     - Unused package dependencies remain in `package.json`.
     - Static deployment might fail to build if database environment variables are missing during CI/CD.
   - Effort: Medium.

### Recommendation
**Approach 1 (Complete Removal)** is recommended. It conforms directly to the user requirements to deactivate the node adapter, clean up unused dependencies, remove the server.js entrypoint, and delete the backend pages/files. Since the landing site does not need dynamic server functionality or user accounts, having a clean, static codebase is the most robust and maintainable state.

### Risks
- **Broken Links**: If any elements on the main landing page link to `/login`, `/register`, or `/dashboard`, they will result in 404 errors. We ran a codebase search and verified that no components, pages, or layout files outside of the deleted files link to those routes.
- **TypeScript Compilation Errors**: Any leftover imports or type definitions could cause build failures. We verified that the only import of the authentication/db modules were within the files being deleted. We must clean up `src/env.d.ts` where `Locals` defines the `user` property.
- **CI/CD Cleanup**: Any deployment configuration referencing `DATABASE_URL` or database secrets will no longer be necessary, although their presence won't break the static build.

### Ready for Proposal
Yes — The codebase is fully prepared for a structured Proposal phase. The orchestrator should proceed with `sdd-propose` to define the formal implementation and verification criteria.
