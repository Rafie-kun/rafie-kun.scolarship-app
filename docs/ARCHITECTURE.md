# ScholarPath — Architecture (ARCHITECTURE.md)

> Phase 1 · Branch `scholarpath-v2` · Status: DECIDED, implementation starts Phase 2
> Read with: `docs/SPEC.md`, `docs/AUDIT.md`, `docs/MIGRATION.md`

## 1. Decision summary

| Area | Decision | Alternative rejected |
|---|---|---|
| App framework | **Next.js App Router** (route groups `(marketing) (catalog) (app) (admin)`, RSC for catalog, Route Handlers `/api/v1/*`) | Keep Vite SPA — rejected: no SSR/SEO, no server components, hash routing unroutable/unindexable, SPEC §10/§44 require it |
| API style | **Next.js Route Handlers → service layer `src/server/services` → repository layer `src/server/db`**; pure logic in `src/lib/*` shared with tests; zod I/O; `{ error: { code, message, fields?, requestId } }`; cursor pagination (catalog, max 50), offset (admin) | Keep Express monolith in same process — kept only as **legacy reference** (`legacy-v1` tag, frozen) until migration verified (§50); folding into handlers fixes ESM/`__dirname`/`vercel.json` bundling pain |
| Database | **PostgreSQL + Drizzle ORM**, UUID v7 PKs, `timestamptz`, `numeric(14,2)` + ISO currency, PG enums/lookups, explicit FK `ON DELETE`, GIN `tsvector` + `pg_trgm`, partial indexes | better-sqlite3 (ephemeral on Vercel — AUDIT §0 confirmed), `@libsql/client`/Turso stub (not wired) |
| Auth | **Auth.js v5 (NextAuth)** — credentials (argon2id) + Google OAuth, email verification, short-lived reset tokens, httpOnly `SameSite=Lax` rotation, revocation UI, TOTP MFA (required editor/admin), lockout/backoff, generic errors | Better Auth (credible second choice; Auth.js wins on OAuth/MFA ecosystem + SPEC §39 naming). Custom JWT deleted after migration (AUDIT F33 flaws) |
| File storage | **Private S3-compatible bucket (R2/Supabase/S3)** — random keys, MIME allowlist + magic bytes, 15 MB cap, signed URLs ≤5 min, ownership checks, access log, malware-scan hook | Base64-in-SQLite (`profiles.resumePdf`) — rejected (bloat, no privacy model) |
| AI | **`AiProvider` interface, Gemini default** (`GEMINI_MODEL`, default `gemini-3.6-flash`), server-only keys, SSE streaming, tool-calling into DB only, citations + Verified/Estimated/AI labels, budgets/rate limits, injection defense | Direct client calls + `x-gemini-key` header + memory-only answers — rejected (§0.8, AUDIT F12) |
| Rate limiting | **Durable store (Upstash Redis or Postgres)** per-IP + per-user buckets (auth/search/AI/uploads/imports), 429 + `Retry-After` | In-memory per-instance (spoofable, lost on scale) — rejected |
| Email / jobs | Transactional email provider + **Vercel Cron → secured (`CRON_SECRET`) job routes** (deadline reminders, digest, expiry sweeps, import schedules) | `node-cron` inside web process + `web-push`-never-sends — rejected on serverless |
| Deploy | **Vercel (Next.js) + managed Postgres (Neon/Supabase) pooled+direct + R2/Supabase storage + Upstash + email + cron**; local = Docker Compose Postgres; preview per-PR w/ branch DB; migrations in CI/deploy, never at request time; `/api/health` | Single-container Express + file SQLite everywhere — kept for legacy only |

## 2. ADRs

### ADR-001 — Consolidate into Next.js App Router (preferred per SPEC §49)
Context: Vite hash-SPA cannot do SSR/SEO/structured-data/sitemaps; Express+Vite in one process causes the ESM/`__dirname`/native/`vercel.json` workarounds documented in AUDIT §7.
Decision: greenfield Next.js app in this repo (`scholarpath-v2`), legacy frozen under `legacy-v1` tag + `/migration/legacy-export/`. Every legacy `#/x` gets a 301 map (§50.5).
Consequences: rewrite of shell/routing; catalog pages become RSC + ISR; API moves to `/api/v1/*` with versioning.

### ADR-002 — PostgreSQL + Drizzle
Context: SQLite ephemeral on Vercel; no FK discipline; JSON-file divergence (`universities.json` vs DB, `internships.json` vs `jobs.json`).
Decision: Drizzle (SQL-first, best PG index/FK control, cheap `EXPLAIN`-driven tuning) over Prisma (heavier migrations, weaker partial/GIN ergonomics). Schema = SPEC §37 verbatim; ERD (Mermaid) in `docs/DB.md` from Phase 2.
Consequences: Docker Compose local PG; pooled (`DATABASE_URL`) + direct (`DATABASE_URL_UNPOOLED`) for migrations; RLS as defense-in-depth where host supports it.

### ADR-003 — Auth.js v5
Context: custom JWT has 6 HIGH/MED findings (AUDIT §6: localStorage copy, no verify/reset/OAuth, ephemeral-secret footgun, no MFA/lockout).
Decision: Auth.js v5 + `admin_users(role: editor|admin, mfa_enabled)` + `audit_logs`. Anonymous catalog browsing; account required for save/match (local preview merges at sign-up).
Consequences: argon2id password hashes (legacy bcrypt NOT migrated — users reset, §50.4); session revocation UI; `middleware` coarse gating + service-level ownership checks.

### ADR-004 — Private object storage
Per SPEC §28 non-negotiables; see table above.

### ADR-005 — AiProvider abstraction + grounded tools
Per SPEC §29 tool list (`get_profile_summary`, `search_programs`, `get_program`, `evaluate_program_match`, `search_scholarships`, `evaluate_scholarship_eligibility`, `get_deadlines`, `get_applications`, `get_missing_documents`, `calculate_budget`, `get_visa_guide`, `get_country`); every claim cites `{id, source, source_url, last_verified, verification_status}`; golden-question harness (≥30) in CI with mocked provider.

## 3. Target topology

```
Browser (RSC + islands: palette, kanban, chat, budget table)
  → Vercel Next.js (marketing|catalog[RSC/ISR]|app|admin)
  → /api/v1/* Route Handlers (zod → services → repositories → Drizzle → PG pooled)
  → Postgres (Neon/Supabase) · R2/Supabase Storage (private) · Upstash (limits)
  → Vercel Cron → job routes (CRON_SECRET) → notifications/email
  → Gemini (server-only) via AiProvider
Legacy: Express+SQLite frozen (legacy-v1) until regression 100% + cutover + rollback doc
```

## 4. Module map (to build)

- `src/lib/matching/` (program tiers §21), `src/lib/scholarship-match/` (§22), `src/lib/budget/` (§23 formulas+rounding), `src/lib/next-action/` (§13 ranking), `src/lib/grades/` (scale compare + `not_comparable`), `src/lib/deadlines/` (tz math), `src/lib/import-*/` (validation/dedupe) — all pure + ≥90% cover on matching/budget/grades.
- `src/server/services/*`, `src/server/db/*` (user-scoped queries only), `src/components/*` (shadcn/ui restyled, tokens §11.2), `src/app/**` route groups (§10).
- `docs/`: `SPEC` (done) · `AUDIT` (done) · `ARCHITECTURE` (this) · `MIGRATION` (skeleton) · `DB.md+ERD` (P2) · `api.md/OpenAPI` (P2→) · `RELEASE.md` (P21) · `FINAL_VALIDATION.md` (P20–21) · `phases/phase-NN.md` (each gate) · `adr/` (ADRs above).

## 5. Env (names only — values never in repo)

Per SPEC §48: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, `AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `EMAIL_SERVER`/`RESEND_API_KEY`, `EMAIL_FROM`, `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `GEMINI_API_KEY` (+`AI_MODEL`), `FX_PROVIDER`, `FX_API_KEY`, `RATE_LIMIT_REDIS_URL`/`RATE_LIMIT_REDIS_TOKEN`, `CRON_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `NEXT_PUBLIC_APP_URL` (only public var), `SENTRY_DSN` (opt). Zod-validated at boot, fail fast. `.env.example` (names only) lands in Phase 2.

## 6. Conflicts decided (§0.10 log)

1. SPEC assumes Next.js+Express hybrid; repo is Vite+Express monolith → prefer SPEC intent (ADR-001), record here. 2. SPEC's 12-item sidebar vs 23+1 found → preserve all 12 per §3, extras get PRESERVE/IMPROVE/MERGE/REMOVE verdicts in AUDIT §9 (nothing silent). 3. SPEC wants Postgres now; repo runs SQLite → freeze SQLite data, migrate per §50 (MIGRATION.md). 4. SPEC bans % admission language; repo ships it (F08/F09) → REPLACE output, keep routes (§2.4).
