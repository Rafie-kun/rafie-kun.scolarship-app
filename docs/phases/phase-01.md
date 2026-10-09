# Phase 01 report — Repository audit + architecture

> SPEC §51 Phase 1 · Branch `scholarpath-v2` · 2026-10-09

## Scope
SPEC §51-P1 + §2: full audit before any feature code; `ARCHITECTURE.md` (ADRs), `MIGRATION.md` skeleton, regression checklist. No feature code.

## Deliverables
- `docs/SPEC.md` — verbatim SPEC (SHA256 `232BE7E0…88E2`, matches source file)
- `docs/AUDIT.md` — route map (23 visible + 1 hidden `#/mock-visa` + embedded orphans), 34 feature records (F01–F34, SPEC §2.2 template), component tree, data-source map (SQLite + 10 JSON + Gemini + FX + 20 localStorage keys), env list, 11 security findings (2 critical), perf + a11y baselines, verdict table, regression checklist R01–R33
- `docs/ARCHITECTURE.md` — Next.js App Router + PG/Drizzle + Auth.js v5 + private storage + AiProvider decisions (ADR-001…005), topology, module map, §0.10 conflicts
- `docs/MIGRATION.md` — §50 skeleton (freeze, mapping draft, verification rules, redirect stubs, counts table)
- This report. Regression checklist lives in `AUDIT.md` §10 (single source of truth).

## Checks
- `npm ci --no-audit`: PASS (450 packages, 18s; 3 deprecated warnings: whatwg-encoding, prebuild-install, node-domexception)
- `npm run lint` (`tsc --noEmit`): PASS, zero errors (note: `strict:false,noImplicitAny:false` — weak; tighten in Phase 2)
- Unit/integration/E2E: N/A (0 test files — documented gap, harness starts Phase 2/4)
- Production build: PASS (`npm run build` 10.7s; 2965 modules; 6 CSS-optimizer warnings on arbitrary-value selectors — non-blocking). Perf baseline captured: `index-D-zAbZqE.js` 431KB/133KB gzip, `PerformanceAnalyticsView` 411KB/118KB gzip, `jspdf` 390KB/128KB gzip, `html2canvas` 202KB/48KB gzip — all over the §45 ~200KB-gzip budget; code-splitting + lazy PDF/chart libs start Phase 3. `dist/server.cjs` 221KB.
- Route/interaction checks: STATIC audit complete (every nav + hidden route accounted); live click-through at desktop+mobile NOT done (deps were installing) → carried as gate exception, must close before Phase 2 feature work
- Earlier-phase regression: N/A (first phase)

## Decisions (§0.10)
1. No-Next.js reality → prefer SPEC intent (Next.js greenfield, legacy frozen). 2. 23+1 routes vs SPEC-12 → all 12 preserved per §3, extras verdict-tagged. 3. SQLite→PG via §50 freeze+migrate. 4. `%`-chance outputs (F08/F09) → REPLACE with §21 tiers.

## Known gaps (→ Phase 2)
1. Live click-through + axe + bundle-size numbers pending (`npm run build` + Playwright/axe). 2. `docs/DB.md+ERD`, `docs/api.md`, `.env.example` names-only, `legacy-v1` tag + `/migration/legacy-export/` land in Phase 2. 3. Secrets scan was grep-based (no history scan) — full `gitleaks`-style pass in Phase 20. 4. FX/scraper/seed row counts TBD at export.

## Files changed
- `docs/SPEC.md` (new, verbatim), `docs/AUDIT.md` (new), `docs/ARCHITECTURE.md` (new), `docs/MIGRATION.md` (new), `docs/phases/phase-01.md` (new)

## Gate
PASS (static audit + docs + lint + build green). Live click-through at desktop+mobile widths remains open — must close during Phase 2 setup (run app, click every route per AUDIT §10, record behavior deltas) before Phase 2 feature code. Do not start Phase 2 feature work until then.
