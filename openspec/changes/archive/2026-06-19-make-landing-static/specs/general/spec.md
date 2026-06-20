# Delta for General

## ADDED Requirements

### Requirement: Static Site Generation

The application MUST compile to a 100% static site (SSG) with no Server-Side Rendering (SSR) runtime dependencies or server entry points.

#### Scenario: Build Output is Static

- GIVEN the Astro config is output: 'static'
- WHEN the build command `npm run build` is run
- THEN the build output MUST reside in a static directory
- AND no Node.js server entry point or SSR adapter files MUST be created

### Requirement: Server-Level Redirects

The application MUST redirect legacy dynamically routed requests to the home page via server redirection.

#### Scenario: Redirection of Archived Routes

- GIVEN an Apache server hosting the static files
- WHEN a client requests `/login`, `/register`, or `/dashboard`
- THEN the server MUST return a 301 Permanent Redirect pointing to `/`

#### Scenario: Direct Access to Permitted Pages

- GIVEN an Apache server hosting the static files
- WHEN a client requests `/` or static assets
- THEN the server MUST serve the requested asset directly without redirection

## MODIFIED Requirements

None

## REMOVED Requirements

### Requirement: Dynamic User Authentication and Session Verification

(Reason: Deprecation of user registration, login, and private dashboard capabilities to support static landing site hosting.)
(Migration: Dynamic pages, authentication helper modules, database initialization/schemas, and middleware are archived in `src/legacy-auth/`.)

#### Scenario: Legacy Session Verification Bypass

- GIVEN the application middleware and session checking are removed
- WHEN a user makes any request
- THEN no session cookie validation or database connection check MUST occur
