# ScholarPath — Future Roadmap

_Last updated: 2026-08-26 (commit 9b82701 — all Next 10 shipped, see below)_
_Theme: Single official Minecraft night mode (deepslate), plain-English UI._

---

## What Just Shipped (Aug 2026 — 20+ Features)

| Phase | Features | Commit |
|---|---|---|
| Hotfix | Vercel 500 fix (lazy-load `pdf-parse`) | `68b7e22` |
| Phase 1 | **#1 Eligibility badges** on scholarship cards (GPA/country/degree) · **#2 Kanban board** for applications + **#8 Merged document checklist** | `d0cea4a` → `806ab6b` |
| Phase 2 | **#6 Country Matcher Quiz** (5 Qs → ranked countries) · **#27 Reddit/official-source links** · **#25 University reviews by internationals** | `c900760` |
| Phase 3 | **#21 IELTS/TOEFL 10-min drill** (band estimate) · **#22 Mock Visa Interview** (AI-scored, country-specific) | `39fdf21` |
| Phase 4 | **#29 Study Group Finder** (grouped counts + Join) · **#23 Pre-departure Checklist** (per-country, localStorage) · **#30 PWA** (manifest + sw.js shell cache + 14-day deadline push) | `d29becd` |
| Phase 5 | **Plagiarism/AI check** for SOPs (`POST /api/gemini/plagiarism-check`) · **Flight Price Watcher** (seasonality bars) · **Housing Board** (dorm/private/shared) | `ba01612` |
| Phase 6 | **Success Stories Wall** (verified ★) · **Recommender Kit** (one-click email draft) · **Visual calendar month-grid** (DeadlineCalendar List/Grid toggle) · **Per-country document templates** (Germany/US/UK/Canada/Australia) · **VAPID push** (`routes/push.ts` + `web-push`) · **Direct DAAD scraper** (`cheerio` on daad.de) · **Multi-language UI** (`LanguageContext` en/bn) | `9b82701` |
| Phase 7 | **AI rate-limiting** (10/min per IP+user) · **Essay template library** (5 annotated winning SOPs) · **PWA install prompt** | `c1fb0af` |
| Earlier | Night theme (deepslate) + XP fix + AI guardrail + real resume parsing + Visa timeline + living-cost panel | `c6cb2be` |

How to test each locally (`npm run dev` → http://localhost:3000):
- **#1**: Scholarships → any card shows Eligible/Conditional badge.
- **#2/#8**: Applications → toggle List/Kanban, drag a card, see Master Checklist + per-country template below.
- **#6**: Universities → Country Matcher (new nav) → answer 5 → see ranked list with living costs.
- **#27**: Scholarship card footer → Official source + Discuss on Reddit links.
- **#25**: Universities → open a university → Student Reviews section → post a 1-5 star review.
- **#21**: IELTS Practice (nav) → Start → 10 Qs → band.
- **#22**: Visa Guide → Mock Visa Interview tab → pick country → interview turns with scores.
- **#29**: Study Groups (nav) → Join a group → creates a community post.
- **#23**: Pre-Departure (nav) → pick destination → check off tasks + see Flight Price Watcher below.
- **#30**: Installable PWA — browser shows Install prompt; deadlines within 14 days trigger a Notification if permission granted.
- **Plagiarism**: WritingVault → paste SOP → Check Plagiarism / AI Patterns → Markdown result.
- **Housing**: Universities → open a university → Housing Board (3 cards) below living costs.
- **Success Stories**: New nav → filter Verified, Share Your Story.
- **Recommender Kit**: Professor Finder modal → Recommender Kit section.
- **Calendar Grid**: Scholarships → Deadlines Calendar → toggle List / Month Grid.

**Auto-update (always on):** Scholarships + internships + universities + part-time jobs scrape hourly (`scripts/scheduler.ts` cron `0 * * * *` + on-boot) → deduped merge into `public/data/*.json` + weekly GitHub Action. Manual: Scholarships/Internships header → "Check for new listings" → `POST /api/scraper/trigger` (auth). DAAD direct scrape included.

---

## Next Ideas (Backlog — Pick Next)

**Quick wins left:**
- Flight price watcher already has seasonality; next: integrate Google Flights API for live prices if you have a key
- Housing board uses `cost_of_living.json` estimates; next: scrape real dorm listings per university

**Medium:**
- Scholarship timeline calendar already has List/Grid + ICS; next: add Google Calendar OAuth auto-sync
- Document checklist already has per-country templates; next: generate a fillable PDF checklist per tracked set

**Heavier (still open):**
- Direct scraper for scholarshipportal.com (bigger coverage than RSS-only, needs per-site cheerio parsers — DAAD direct is done, scholarshipportal next)
- Multi-language UI is scaffolded (`LanguageContext` en/bn); next: translate all nav labels via `t()` and add Hindi/Arabic files

---

## Technical Roadmap

- **Vercel persistence**: File DB is `ephemeral-tmp` on Vercel (health reports it). For true cross-instance persistence, set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` and migrate `db/index.ts` to `@libsql/client` (already installed). Until then, Render/Railway/Docker (`docker compose up --build`) is recommended for production accounts (see `DEPLOYMENT.md`).
- **Security**: All user-isolated routes already filter by JWT username; XP capped server-side; profile updates field-whitelisted. Next: add rate-limiting to `/api/professors/search` and `/api/mock-visa/interview` (AI-costly).
- **Perf**: Current code-splitting is per-view via `React.lazy`; next: add `React.lazy` for heavy modals (ProfessorFinder, DeadlineCalendar) if bundle grows.
- **Testing**: Add Vitest + Playwright smoke (register → track scholarship → kanban drag → checklist done). Currently manual smoke via `/api/health` + meta endpoints.
- **Docs**: `Guide.md` rewritten; `DEPLOYMENT.md` covers Docker/Render. Keep `future.md` as the living roadmap — update after each phase.

---

## How to Run / Verify Before Any Commit

```bash
npm run lint   # must be clean (tsc --noEmit)
npm run build  # must succeed (vite + esbuild + copy-data)
# then boot:
NODE_ENV=production JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") node dist/server.cjs
curl http://localhost:3000/api/health
curl http://localhost:3000/api/scholarships/meta
curl http://localhost:3000/api/jobs/internships/meta
```

No `public/data/*.json` scrape artifacts are ever committed (`git restore public/data/*.json` before commit).

---

## Wishlist from User (Already Addressed or Queued)

- [x] All scholarships found online + how to apply per listing (RSS scraper + official source links)
- [x] Internships + part-time jobs auto-updating (RSS scraper, 4th source added)
- [x] Visa guide asks citizenship, shows processing time + step-by-step timeline
- [x] University cards show website + apply portal + living costs (dorm vs private)
- [x] AI only helps with academics (guardrail prompt), plus college letters / credit transfer / bachelor→master guidance
- [x] Security: users cannot see others' private data (JWT isolation, field whitelist, XP cap)
- [x] Official Minecraft assets only, dark night mode
- [ ] Remaining: essay templates, recommender kit, flight watcher, housing, success stories, direct scrapers, i18n — see Next 10 above.
