# Phase 02 — Database + Authentication + Catalog Sync

> SPEC §51 Phase 2 · Branch `scholarpath-v2` · 2026-10-25

## Scope (as built)
- Postgres via Docker Compose (`scholarpath_db`), direct + pooled connection strings
- Drizzle ORM schema: identity, RBAC, audit, governance, data ingestion, catalog
- Generated SQL migrations (single `0000_*.sql`)
- Auth.js v5 (`@auth/nextjs`): email + password credentials, optional Google OAuth
- Registration endpoint (`POST /api/v1/auth/register`), session includes `id` + `role`
- Coarse middleware gate for `/app/*` and `/admin/*` (session cookie presence only;
  real authorization must stay server-side)
- Catalog auto-sync: legacy JSON → Postgres, idempotent upserts, run log, stale-row prune
- Starter admissions guides generated per university, marked `needs_review`
- Public catalog pages: `/scholarships`, `/scholarships/[slug]`, `/opportunities`,
  `/apply`, `/apply/[slug]`
- Secured cron endpoint: `GET|POST /api/v1/cron/sync` (`Authorization: Bearer $CRON_SECRET`)

## Deliberately deferred (not claimed as done)
- Email verification and password reset (need a transactional email provider)
- Durable rate limiting (needs Redis/Upstash credentials)
- Role checks beyond the coarse middleware gate (no `/admin` UI yet)
- Google OAuth is wired but disabled unless `GOOGLE_CLIENT_ID`/`SECRET` are set
- Unique constraint on university name/provider (dedupe is currently done at import)

## Data notes (important)
The legacy catalog was heavily duplicated:

| Source file | Rows | Unique programs |
| --- | --- | --- |
| `universities.json` | 253 | 61 |
| `scholarships.json` | 100 | 7 |
| `internships.json` | 8 | 8 |

The sync now collapses rows by natural key (name) and imports one record per program.
Everything is imported as `needs_review`; nothing is auto-marked `verified`.
The sync never overwrites a row an editor has verified, and it prunes imported rows
that disappear from the source while preserving verified rows.

## Commands
```bash
docker compose up -d scholarpath_db   # local Postgres
npx drizzle-kit generate              # create SQL migration
npx drizzle-kit migrate               # apply migrations
npm run sync:catalog                  # import/refresh catalog (idempotent)
npm run dev:next                      # Next.js dev server
npm run build:next && npm run start:next
```

## Deployment note
The repo still serves the legacy Vite/Express app via `vercel.json`. The Next.js app
has its own config (`vercel.next.json`) with the 6-hourly cron. Do not point a Vercel
project at both configs at once; switching the root project to `vercel.next.json` is
the cutover step and belongs to a later phase.

## Gate evidence (2026-10-25, local)
- `npm run lint` → clean (`tsc --noEmit`)
- `npm run build` → legacy Vite/Express build succeeds
- `npm run build:next` → 11 routes compiled, middleware 34.3 kB
- `npx drizzle-kit migrate` → applied successfully to fresh local Postgres
- `npm run sync:catalog` (first run) → 61 universities, 7 scholarships, 8 opportunities,
  61 admissions guides, 0 errors
- `npm run sync:catalog` (second run) → 0 added, all updated → idempotent
- Smoke checks (HTTP 200): `/`, `/scholarships`, `/scholarships/[slug]`,
  `/opportunities`, `/apply`, `/apply/[slug]`, `/api/auth/signin`
- Cron: unauthenticated → 401, `Bearer $CRON_SECRET` → 200 with counts
- Auth: register → 201, duplicate → 409, weak password → 422,
  credentials login → session `{ id, role }`, wrong password → `CredentialsSignin`
- Middleware: anonymous `/app` and `/admin` → 307 redirect
- Pagination: 50 + 11 universities, no overlap; 7 scholarships on one page

## Known constraints
- No feature code beyond Phase 2 scope (SPEC 0.2: one phase at a time)
- Never delete existing SQLite data or legacy code until migration verified (SPEC 0.3)
- `DATABASE_URL_UNPOOLED` is used for migrations and sync; no destructive commands
  are run against non-local databases
