# Design: Make Landing Static

## Technical Approach

Convert the Astro application from dynamic Server-Side Rendering (SSR) to a 100% static (SSG) site. The transition involves modifying the output mode, removing Node runtime adapters, cleaning up backend dependencies, archiving legacy dynamic feature code (database, authentication, dashboard), and implementing Apache redirects for legacy URLs. This satisfies requirements in `proposal.md` and `specs/general/spec.md`.

## Architecture Decisions

### Decision: Static Site Generation Mode

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Option A: Output `static` (Astro default) | Removes all Node adapter code, zero runtime server overhead, fits static hosting. | **Chosen**. Provides maximum performance and security. |
| Option B: Output `server` or `hybrid` | Requires a running Node process and active database connection, which is incompatible with static landing page requirements. | Rejected. |

### Decision: Legacy Auth/DB Code Archival

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Option A: Move to `src/legacy-auth/` | Retains all dynamic code (pages, db config, tests) in a dedicated local folder for reference, but excludes it from building/typechecking. | **Chosen**. Preserves legacy context without build pollution. |
| Option B: Immediate permanent deletion | Kept in Git history, but requires retrieval from past commits if any logic needs to be referenced. | Rejected. |

### Decision: Legacy Page Redirection

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Option A: Apache `.htaccess` redirects | High-performance 301 redirects handled directly by the web server (Hostinger). Fast, SEO-friendly, and no blank pages loaded. | **Chosen**. |
| Option B: Client-side JS redirects | Requires loading a static page first and executing client JS. Slow and poor UX. | Rejected. |

## Data Flow

Legacy dynamic requests (`/login`, `/register`, `/dashboard`) are intercepted at the server level using Apache redirects and permanently routed (301) to the root `/` page. All permitted static assets and `/` are served directly.

```
Legacy dynamic requests:
Client ──[GET /login]──→ [ Apache Server (.htaccess) ] ──[301 Redirect]──→ Client (loads /)

Static assets & Home:
Client ──[GET /]───────→ [ Apache Server ] ──[Serve static index.html]──→ Client
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `astro.config.mjs` | Modify | Change output to `static` and remove Node adapter import and usage. |
| `src/env.d.ts` | Modify | Empty `App.Locals` interface (remove `user` definition). |
| `tsconfig.json` | Modify | Add `"src/legacy-auth"` to `"exclude"` list to prevent typecheck failures on archived files. |
| `package.json` | Modify | Remove unused dependencies (`@astrojs/node`, `bcryptjs`, `drizzle-orm`, `mysql2`) and devDependencies (`@types/bcryptjs`, `drizzle-kit`). |
| `public/.htaccess` | Create | Configure Apache 301 redirects from `/login`, `/register`, `/dashboard` to `/`. |
| `src/pages/login.astro` | Archive | Move to `src/legacy-auth/pages/login.astro` |
| `src/pages/register.astro` | Archive | Move to `src/legacy-auth/pages/register.astro` |
| `src/pages/dashboard/index.astro` | Archive | Move to `src/legacy-auth/pages/dashboard/index.astro` |
| `src/middleware.ts` | Archive | Move to `src/legacy-auth/middleware.ts` |
| `src/lib/auth.ts` | Archive | Move to `src/legacy-auth/lib/auth.ts` |
| `src/db/db.ts` | Archive | Move to `src/legacy-auth/db/db.ts` |
| `src/db/schema.ts` | Archive | Move to `src/legacy-auth/db/schema.ts` |
| `src/tests/auth.test.ts` | Archive | Move to `src/legacy-auth/tests/auth.test.ts` |
| `server.js` | Archive | Move to `src/legacy-auth/server.js` |
| `drizzle.config.ts` | Archive | Move to `src/legacy-auth/drizzle.config.ts` |

## Interfaces / Contracts

The `App.Locals` interface is simplified to a blank structure since middleware and user authentication are deprecated:

```typescript
declare namespace App {
  interface Locals {}
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit / Compilation | Typecheck integrity | Run `npm run typecheck` to verify that the project compilation ignores `src/legacy-auth/` and passes with empty `App.Locals`. |
| Build Integration | Static Build Output | Run `npm run build` to confirm successful compilation to `dist/` without generating Node server files. |
| Configuration | Redirect file presence | Verify `dist/.htaccess` is correctly copied and matches redirection spec. |

## Migration / Rollout

No database migration is required. The static assets and `.htaccess` file will be deployed to the Hostinger Apache document root.

## Open Questions

None.
