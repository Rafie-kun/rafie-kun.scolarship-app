# Somnia — Phase 1 Repository Audit (AUDIT.md)

> Branch: `scholarpath-v2` · Date: 2026-10-09 · Auditor: OpenCode (Muse Spark)
> Method: static source read (no edits) + 4 parallel subagent sweeps (frontend / backend / AI+matching+data / config+build) + hash verification of `docs/SPEC.md`.
> SPEC §1 "known facts" below are marked CONFIRMED / CORRECTED.
> Running-app click-through at desktop+mobile widths was NOT done in this pass (deps installing in background) — marked as open gate item in `docs/phases/phase-01.md`.

## 0. SPEC §1 verification

| SPEC claim | Finding |
|---|---|
| Client-rendered SPA, title "Somnia - AI-Powered Scholarship & Admissions Platform", meta mentions fully-funded/scholarships/coaching/SOP/simulator/mock-interview, theme `#110f0d` | CONFIRMED — `index.html` SPA `src=/src/main.tsx`, SEO/OG/Twitter, `theme-color #110f0d` |
| TS + Next.js + Express API, `better-sqlite3`, Gemini | CORRECTED — **no Next.js**. Stack is **React 19 SPA (Vite 6) + Express 4 API in one process** (`server.ts`, bundled to `dist/server.cjs`). `better-sqlite3` YES, `@google/genai` YES (Gemini). `api/index.ts` is a 3-line Vercel shim importing `../server.js` |
| SQLite on Vercel ephemeral → move to Postgres | CONFIRMED — `db/index.ts` uses file `data/app.db`, `/tmp/scholarpath-data/app.db` on Vercel, `:memory:` fallback. `TURSO_*` env is stub-log only, not wired. Docker/Render with persistent disk is the durable path today |
| Dark warm-black + yellow accent, textured bg, beveled chrome, scrollbar + selected-nav outline, per-section colored icons | CONFIRMED — `src/App.tsx` Minecraft HUD/sidebar, `src/index.css`, `ThemeContext` fixed `minecraft/overworld` theme |
| Sidebar 12 items in SPEC order | CORRECTED — sidebar has **23 visible items + 1 hidden route**. SPEC's 12 all exist, in the same relative order, but interleaved with 11 more (IELTS, Advanced Search, Roadmap, Community, Study Groups, Pre-Departure, Mentors, Theme Settings, Export, Profile, Counselling position differs). Full map §1 |

## 1. Route map (SPA hash routing — no react-router)

`src/main.tsx` → `src/App.tsx`: `getTabFromHash()` + `VALID_TAB_IDS` + `renderSandbox()` switch + `handleTabChange()`. All routes are `#/<tab>`. Deep links / slugs / SSR do not exist. Unknown hash falls back to overview.

| # | `#/route` | Sidebar label | Component (file) | Hidden? |
|---|---|---|---|---|
| 1 | `#/overview` | Overview | `OverviewRecommendationsView.tsx` | no |
| 2 | `#/analytics` | Performance Analytics | `PerformanceAnalyticsView.tsx` | no |
| 3 | `#/scholarships` | Scholarship Finder | `ScholarshipsView.tsx` | no |
| 4 | `#/internships` | Internship Finder | `InternshipExplorer.tsx` | no |
| 5 | `#/universities` | Universities | `UniversitiesView.tsx` | no |
| 6 | `#/matcher` | Country Matcher | `CountryMatcherQuiz.tsx` | no |
| 7 | `#/ielts` | IELTS Practice | `IeltsToeflPractice.tsx` | no (extra vs SPEC) |
| 8 | `#/search` | Advanced Search | `AdvancedSearch.tsx` | no (extra) |
| 9 | `#/applications` | Applications Tracker | `ApplicationsView.tsx` | no |
| 10 | `#/simulator` | Admissions Calculator | `DreamUniversityView.tsx` | no |
| 11 | `#/chances` | Will I Get In? | `AdmissionWizard.tsx` | no |
| 12 | `#/writing` | Document Center | `WritingVaultView.tsx` | no |
| 13 | `#/cv` | CV Builder | `CVBuilder.tsx` | no |
| 14 | `#/counselling` | AI Chat Assistant | `CounsellingView.tsx` | no |
| 15 | `#/budget` | Budget Planner | `BudgetPlanner.tsx` | no (extra) |
| 16 | `#/visa` | Visa Guide | `VisaGuide.tsx` (embeds MockVisa tab) | no (extra) |
| 17 | `#/learning` | Roadmap | `RoadmapView.tsx` | no (extra) |
| 18 | `#/community` | Community Forum | `CommunityView.tsx` | no (extra) |
| 19 | `#/study-groups` | Study Groups | `StudyGroupFinder.tsx` | no (extra) |
| 20 | `#/predeparture` | Pre-Departure | `PreDepartureChecklist.tsx` | no (extra) |
| 21 | `#/mentors` | Mentors | `MentorView.tsx` | no (extra) |
| 22 | `#/customize` | Theme Settings | `CustomizeView.tsx` | no (extra) |
| 23 | `#/export` | Export Center | `ExportCenterView.tsx` | no (extra) |
| 24 | `#/profile` | Profile | `ProfileView.tsx` | no (extra) |
| H1 | `#/mock-visa` | — (no nav entry) | `MockVisaInterview.tsx` | **YES hidden**, also embedded as `VisaGuide` tab |
| API | `/api/*` | — | `server.ts` + `routes/*.ts` (23 files) | server, see §4 |

Embedded-only (no route): `ProfessorFinder`, `HousingBoard` (inside Universities modal), `DeadlineCalendar` (inside Scholarships), `CertificateAnalyzer` (inside Profile), `EssayTemplates` (inside WritingVault), `RecommenderKit` (orphan), `FlightPriceWatcher` (inside PreDeparture), `LearningPathView` (orphan, superseded by Roadmap), `CareerCompass` (orphan, calls `GET /api/jobs`), `SuccessStoriesWall` (orphan), `AIAdvisor/{Scholarship,University,Budget}Advisor` (inside Counselling), `OnboardingWizard/*` + `AcademicOnboardingWizard` (inside Profile/Login/App), `StreakLog`, `NotificationsBell`, `SyncStatusDrawer`, `CurrencySwitcher`, `QuickNotesWidget`, `GlobalSearch` (Ctrl+K palette), `AIAssistant` (floating bubble).

Legacy URL redirects: none exist (hash SPA has no server routes to redirect). SPEC §10/§50 redirect map is greenfield work.

## 2. Feature inventory (SPEC §2.2 template — every feature)

### F01 — Overview
- Where: `#/overview` · `src/components/OverviewRecommendationsView.tsx`
- What: dashboard — profile stats, top scholarships/unis, notifications, daily-check-in +15XP, `StreakLog` embed
- Inputs: `GET /api/profile, /api/scholarships, /api/universities, /api/notifications`, `profile-updated` events
- Outputs: `POST /api/profile/reward`, navigation via `onNavigate(view)`
- User flow: land → see stats/recs → claim bonus → navigate
- Dependencies: AuthContext profile, react, `StreakLog`
- Data source: REAL API with `safeFetchJson` `[]` fallbacks
- Reality: REAL (graceful degradation)
- Verdict: IMPROVE (→ SPEC §13 command center + Next Action engine)
- Reason: real shell but static summary, no deterministic next-action, no per-module empty/error states
- Regression: open app → Overview shows profile name + ≥1 recommendation module; claim daily bonus grants +15XP once/day

### F02 — Performance Analytics
- Where: `#/analytics` · `src/components/PerformanceAnalyticsView.tsx`
- What: Recharts GPA area/bar/pie, task completion + status distribution, add/delete GPA terms
- Inputs: `GET /api/applications`; `localStorage scholarpath_gpa_trends_<user>`; `getMockApplications()` fallback
- Outputs: writes GPA trends to localStorage
- User flow: view charts → add GPA term → see curve update
- Dependencies: recharts, mockDataService
- Data source: HYBRID — real applications + local GPA (seeds 2 points only if `hasCompletedOnboarding`, else locked EmptyState)
- Reality: CALCULATED + LOCAL (no fake larping — verified empty-state guard `:39-59`)
- Verdict: REBUILD (→ SPEC §14)
- Reason: local-only GPA, no requirement matrix/competitiveness/readiness, no chart↔table toggle, decorative-risk charts
- Regression: with onboarding complete, add GPA term 3.7 → curve gains a point and persists after reload

### F03 — Scholarship Finder
- Where: `#/scholarships` · `src/components/ScholarshipsView.tsx`
- What: paginated/filtered catalog (search, GPA min/max, degree, funding, country, upcoming-only, sort), recommender tab (`/api/best-scholarships`), freshness (`/api/scholarships/meta`), scraper refresh (`POST /api/scraper/trigger`), track→application, Reddit/official links, `DeadlineCalendar` modal
- Inputs: `GET /api/scholarships?page&limit&sortBy`, `/api/universities`, `/api/applications`; fallback `GET /data/scholarships.json`
- Outputs: `POST /api/applications` or `saveMockApplications()`
- User flow: filter → open card → track → appears in Applications
- Dependencies: `DeadlineCalendar`, AuthContext `authorizedFetch`
- Data source: REAL primary + STATIC JSON fallback + LOCAL mock for tracking
- Reality: REAL (with honest fallback)
- Verdict: REBUILD (→ SPEC §16 engine w/ structured eligibility)
- Reason: no eligibility rules model, no verification badges, no save/compare, filters client-assisted
- Regression: filter `degree=Masters` → list shrinks; Track on a card creates an application visible in `#/applications`

### F04 — Internship Finder
- Where: `#/internships` · `src/components/InternshipExplorer.tsx`
- What: filterable internships (search/region/type/remote), currency-converted stipends, apply-link w/ Google fallback, freshness + scraper trigger
- Inputs: `GET /data/internships.json`, `GET /api/jobs/internships/meta`
- Outputs: `POST /api/scraper/trigger`, `window.open(url)`
- User flow: filter → open → apply externally
- Dependencies: ThemeContext `convertAmount`
- Data source: STATIC catalog + REAL meta
- Reality: STATIC
- Verdict: IMPROVE→EXPAND (→ SPEC §17 Opportunities; MERGE search architecture with Scholarships)
- Reason: static-only catalog, 2-row `jobs.json` placeholder, no save/tracker linkage
- Regression: search "software" + Remote-only → ≥1 card with converted stipend and working apply link

### F05 — Universities
- Where: `#/universities` · `src/components/UniversitiesView.tsx` (+ `ProfessorFinder`, `HousingBoard` embeds)
- What: paginated catalog + recommender (`/api/best-universities`), country/type/housing filters, detail modal w/ living-cost math + reviews + Reddit link
- Inputs: `GET /api/universities?search&country…`, fallback `GET /data/universities.json`; `GET /data/cost_of_living.json`; `GET/POST /api/university-reviews`
- Outputs: `POST /api/university-reviews`
- User flow: search/filter → open modal → read costs → post review
- Dependencies: SQLite `universities` table, JSON fallback
- Data source: REAL primary + STATIC fallback (catalog/costs); REAL reviews
- Reality: REAL
- Verdict: IMPROVE→EXPAND (→ SPEC §18 directory + §19 programs; programs table does not exist yet)
- Reason: no programs model, no verification/source display, modal not routable/SEO
- Regression: search "Toronto" → ≥1 result; posting a review with rating persists and re-renders

### F06 — Country Matcher
- Where: `#/matcher` · `src/components/CountryMatcherQuiz.tsx`
- What: 5-question quiz (budget/weather/language/field/lifestyle) → scored top-5 with monthly cost + visa snippet + progress bar
- Inputs: hardcoded `QUESTIONS` + `GET /data/cost_of_living.json`, `/data/visa_guide.json`
- Outputs: ranked list (client `useMemo` scoring, 1 vote per answer)
- User flow: answer 5 → see top-5 → open visa/costs
- Dependencies: none (local JSON)
- Data source: STATIC
- Reality: STATIC/CALCULATED tally
- Verdict: REBUILD→EXPAND (→ SPEC §20; keep "Find my countries" flow)
- Reason: unweighted votes, no scholarships/country-facts model, no weights/breakdown/compare, no sources
- Regression: answer all 5 → top-5 list with monthly cost figures and a visa snippet each

### F07 — Applications Tracker
- Where: `#/applications` · `src/components/ApplicationsView.tsx`
- What: kanban/list, select app, checklist CRUD, markdown notes w/ toolbar+preview, merged master checklist (`documentTemplates`), confetti on Won, offline badge
- Inputs: `GET /api/applications`, fallback `getMockApplications(user)`
- Outputs: `POST /api/applications`, `PUT/DELETE /api/applications/:id` or local mock
- User flow: add (incl. from Scholarships) → checklist/notes → move status → Won confetti
- Dependencies: mockDataService, documentTemplates
- Data source: REAL primary + LOCAL MOCK fallback
- Reality: REAL (degraded offline)
- Verdict: REBUILD (→ SPEC §26: statuses/history/tasks/essays/recs + 4 views)
- Reason: no timeline/calendar views, no essays/recommendations/deadline linkage, no status history, no keyboard DnD
- Regression: create application → add checklist item → move to Submitted → persists after reload

### F08 — Admissions Calculator (Simulator)
- Where: `#/simulator` · `src/components/DreamUniversityView.tsx`
- What: pick uni + sliders (GPA adjust, research, extracurricular, essay %) → `probabilityChance 5–99%` + rating + reasons + gap + XP. Formula: GPA 40 + research 20 + leadership 15 + essay 25, ×acceptance multiplier
- Inputs: `GET /api/profile`, `GET /api/universities`
- Outputs: client number + `POST /api/profile/reward`
- User flow: pick uni → move sliders → read % + rating
- Dependencies: none (client math, labeled "hypothetical")
- Data source: REAL inputs, STATIC math
- Reality: CALCULATED (percentage prediction — SPEC §2.4 forbids)
- Verdict: REPLACE output (→ SPEC §21 tiers + §15 tools; keep route/nav)
- Reason: outputs banned % chance; must become requirement-based Strong/Good/Possible/Reach/Not-Eligible with reasons
- Regression: (post-rebuild) same uni+sliders → tier badge + per-requirement reasons, and grep finds no `% chance` string

### F09 — Will I Get In? (AdmissionWizard)
- Where: `#/chances` · `src/components/AdmissionWizard.tsx`
- What: 3-step wizard (grades 4.0/5.0/100→normalize + degree + major/country) → safety/match/reach cards (`≥68/≥42`), tuition convert, tips. Formula: `0.65*GPA + 0.35*acceptRate − top50 penalty`, `+4` on major-substring match
- Inputs: `GET /api/universities?limit=2000`, fallback `/data/universities.json`
- Outputs: `computeChance()`, `verdictOf()`
- User flow: enter grades → pick major/country → see buckets
- Dependencies: none
- Data source: REAL inputs (STATIC fallback), STATIC formula
- Reality: CALCULATED (%-style buckets — SPEC §2.4 forbids)
- Verdict: REBUILD (→ SPEC §21; route+nav stay, honesty changes)
- Reason: same as F08 + blind cross-scale normalization (violates SPEC §15 — must be `not_comparable` without sourced equivalency rule)
- Regression: (post-rebuild) entering O-Level grades with no equivalency rule yields `not_comparable` + link, never a %

### F10 — Document Center (WritingVault)
- Where: `#/writing` · `src/components/WritingVaultView.tsx` (+ `EssayTemplates`)
- What: paste SOP → Gemini review (markdown), plagiarism check, template library, XP reward. NOT file storage
- Inputs: `essayText,major,degree`
- Outputs: `POST /api/gemini/review-document`, `POST /api/gemini/plagiarism-check`, `POST /api/profile/reward`
- User flow: paste → review → apply template → re-check
- Dependencies: Gemini server key, react-markdown
- Data source: REAL (Gemini backend) + STATIC templates
- Reality: REAL (AI capability)
- Verdict: REBUILD (→ SPEC §28 secure storage + versions + expiry + attach; keep SOP-review as AI-Advisor mode per §29)
- Reason: name says Document Center but stores no files; no privacy/versions/signed-URLs/expiry/missing-doc warnings
- Regression: (post-rebuild) upload PDF → version 2 → attach to application; SOP-review mode still returns structured feedback

### F11 — CV Builder
- Where: `#/cv` · `src/components/CVBuilder.tsx`
- What: 7 sections (personal/education/work/projects/skills/certs/languages), add/delete, save, `jsPDF` export
- Inputs: `GET /api/profile/cv` + hydrate from `profile`
- Outputs: `POST /api/profile/cv`, client PDF
- User flow: edit sections → save → export PDF
- Dependencies: jspdf, profile
- Data source: REAL persistence, LOCAL editing state
- Reality: REAL
- Verdict: PRESERVE + IMPROVE (→ profile-linked, versioned export into Document Center)
- Reason: genuinely useful, real persistence; needs profile pull + versioning + PDF fidelity
- Regression: add work entry → save → reload → entry present; Export downloads a non-empty PDF

### F12 — AI Chat Assistant (Counselling + floating AIAssistant + AIAdvisor×3)
- Where: `#/counselling` · `CounsellingView.tsx` (5 subtabs: copilot/interview/scholarship/university/budget) + `AIAssistant.tsx` bubble + `AIAdvisor/{Scholarship,University,Budget}Advisor.tsx`
- What: Wise-Librarian chat (scope-locked prompt, last-10 turns, profile-injected), mock interviewer (Prof. Miller/Dubois), scholarship/uni/budget advisors (score 10–99 + Gemini executive report or heuristic fallback), mic stub, retry/markdown, per-tab hints + `navigate to` sniffing
- Inputs: `POST /api/gemini/study-chat|mock-interview`, `POST /api/ai/scholarship-recommendations|university-recommendations|budget-advisor|wizard-assistant`; `localStorage scholarpath_copilot_chatHistory_v1_*`, `scholarpath_custom_gemini_key`
- Outputs: markdown answers, navigation actions, XP
- User flow: ask → grounded/heuristic answer → follow suggestion → navigate
- Dependencies: `@google/genai`, `GEMINI_API_KEY`/`GEMINI_MODEL` (default `gemini-3.6-flash`), `x-gemini-key` per-user override
- Data source: REAL (AI backend) + LOCAL history
- Reality: REAL (with heuristic fallbacks when key missing)
- Verdict: REBUILD (→ SPEC §29 tool-grounded, citations, Verified/Estimated/AI labels, SSE, sessions, rate limits)
- Reason: answers from model memory, no DB tool-calling, no citations/verification labels, no injection defense, no usage budgets, client-held custom key header
- Regression: ask "What should I apply to first?" → answer lists records with ids + Verified/Estimated labels + sources; with no key, says "no verified info" instead of guessing

### F13 — IELTS Practice (extra)
- Where: `#/ielts` · `IeltsToeflPractice.tsx`
- What: 10-min drill, 10 hardcoded reading/grammar/vocab MCQs, instant explain, `bandFromScore()` estimate
- Inputs: `READING_QS[10]` const
- Outputs: `score/10` + band string
- Dependencies: none
- Data source: STATIC
- Reality: MOCKED/STATIC (fixed Qs, heuristic band)
- Verdict: PRESERVE (as a Tool under SPEC §9 PLAN/Tools) + label honestly as practice/estimate
- Reason: real user value, but must never pose as certified scoring
- Regression: answer all 10 → score + band + explanations render

### F14 — Advanced Search (extra)
- Where: `#/search` · `AdvancedSearch.tsx`
- What: cross-DB engine (uni/scholarship tabs, query + country/tuition/GPA/degree/type/housing/funding filters), bookmark→application
- Inputs: `GET /data/universities.json` + `/data/scholarships.json` only (!); `POST /api/applications` via unauth `fetch` (not `authorizedFetch`)
- Outputs: application row
- Dependencies: static JSON
- Data source: STATIC index + REAL save
- Reality: STATIC (ignores live DB)
- Verdict: MERGE into SPEC §30 global search + Ctrl+K (kill standalone page, keep filters as finder facets)
- Reason: duplicates finder logic on stale index; save uses unauthenticated fetch (bug)
- Regression: (post-merge) `#/search` 301s to `/app` search; Ctrl+K finds a university by typo-tolerant name

### F15 — Budget Planner (extra)
- Where: `#/budget` · `BudgetPlanner.tsx`
- What: pick country → auto-fill rent/food/transport + jobs + tax, custom income/expense, deficit/surplus, currency convert. Math: `gross=hourly*hours*4.33`, tax above allowance (duplicated in 3 files)
- Inputs: `GET /data/cost_of_living|student_jobs|tax_rules.json` (+ US/UK/DE fallback), `exchange_rates.json` via ThemeContext
- Outputs: client arithmetic (no persistence)
- Dependencies: none
- Data source: STATIC
- Reality: CALCULATED (prefill static, no per-item source labels)
- Verdict: REBUILD (→ SPEC §23: items/scenarios/FX w/ provider+date, formulas exactly as spec'd, exports, attach-to-application)
- Reason: no scenarios, no verified/estimated labels, no persistence, duplicated tax math, server `POST /api/gemini/budget-tips` exists but is uncalled dead code
- Regression: plan UK masters → Expected/High scenarios differ; FX line shows rate+date+provider

### F16 — Visa Guide (extra)
- Where: `#/visa` · `VisaGuide.tsx`
- What: country cards (fee/funds/work/timeline/checklist), origin-country personalize (localStorage), search, official-URL outlinks
- Inputs: `GET /data/visa_guide.json`
- Outputs: `window.open(officialUrl)`
- Dependencies: none
- Data source: STATIC
- Reality: STATIC
- Verdict: REBUILD (→ SPEC §24: government-source publishing rule, banner, stale warnings, savable checklist)
- Reason: no source/verification model, no citizenship×destination×level fallback chain, no disclaimer
- Regression: open guide → mandatory "Verify on official government website" banner + last-verified date render

### F17 — Mock Visa Interview (hidden)
- Where: `#/mock-visa` + `VisaGuide` interview tab · `MockVisaInterview.tsx`
- What: pick destination → AI officer Q→A loop with per-answer score/feedback + avg, restart
- Inputs: country list from `visa_guide.json`; `POST /api/mock-visa/interview {country,userAnswer,history}`
- Outputs: `{score 1-10, feedback, nextQuestion}` (static 4-Q rotation + fixed score 7 without key)
- Dependencies: Gemini or static fallback
- Data source: REAL (AI) + STATIC list
- Reality: REAL w/ STATIC fallback
- Verdict: PRESERVE (as AI-Advisor mock-interview mode per SPEC §29)
- Reason: distinct capability from SOP review; keep, replatform on advisor sessions
- Regression: answer 2 turns → average score updates; transcript persists in session

### F18 — Roadmap/Learning (extra)
- Where: `#/learning` · `RoadmapView.tsx` (+ orphan `LearningPathView.tsx`)
- What: AI timeline milestones (`POST /api/roadmap`, save `/api/roadmap/save`) + skill-tree (9 `DEFAULT_SKILL_TREE` nodes, prereqs, XP, local persist)
- Inputs: `localStorage scholarpath_skill_tree`
- Outputs: roadmap rows + reward posts
- Dependencies: Gemini
- Data source: HYBRID (REAL timeline + LOCAL static skill tree)
- Reality: REAL + LOCAL
- Verdict: MERGE — timeline → Applications Tracker milestones; skill-tree → REMOVE (gamification, no admissions value)
- Reason: roadmap duplicates tracker; skill tree is game chrome SPEC §0.6 forbids as fake progress
- Regression: (post-merge) roadmap save creates tracker milestones; no `#/learning` skill-tree route

### F19 — Community Forum (extra)
- Where: `#/community` · `CommunityView.tsx`
- What: thread list, upvote, new post, XP
- Inputs/Outputs: `GET/POST /api/community`, `POST /api/community/:id/vote`
- Dependencies: none
- Data source: REAL (SQLite `community_posts`)
- Reality: REAL
- Verdict: REMOVE from v1 scope (not in SPEC §6.2; keep table for later, hide nav)
- Reason: moderation/safety/PII scope with no product owner; SPEC has no forum
- Regression: `#/community` returns 404 page; no community writes in E2E

### F20 — Study Groups (extra)
- Where: `#/study-groups` · `StudyGroupFinder.tsx`
- What: search groups by scholarship, join (creates Saved application + community post if missing), member counts
- Inputs/Outputs: `GET /api/study-groups`, `POST /api/study-groups/join {scholarshipName}`
- Dependencies: applications + community tables
- Data source: REAL (aggregated `applications GROUP BY name`)
- Reality: REAL
- Verdict: REMOVE from v1 (same as F19)
- Reason: same; groups derived from PII-adjacent app names
- Regression: `#/study-groups` 404s

### F21 — Pre-Departure (extra)
- Where: `#/predeparture` · `PreDepartureChecklist.tsx` + `FlightPriceWatcher` stub
- What: 9 `BASE_TASKS` per destination + visa link; progress in `localStorage scholarpath_predeparture_*`
- Inputs: `GET /data/visa_guide.json`
- Outputs: local toggles
- Dependencies: none
- Data source: STATIC + LOCAL
- Reality: STATIC
- Verdict: MERGE into Visa Center checklist + Tracker tasks (kill standalone page + flight stub)
- Reason: checklist value is real but belongs to visa/application context; flight watcher is a stub (`STATIC/LOCAL`, no prices)
- Regression: visa guide checklist contains the 9 tasks with persisted completion

### F22 — Mentors (extra)
- Where: `#/mentors` · `MentorView.tsx`
- What: 3 hardcoded mentors (Carter/Jenkins/Chen) + slot booking → fake 400ms + XP toast (booking NOT persisted server-side)
- Inputs: `mentors[3]` const
- Outputs: `POST /api/profile/reward` only
- Dependencies: none
- Data source: MOCKED/STATIC
- Reality: MOCKED (fake booking — SPEC §0.6 violation)
- Verdict: REMOVE (v1 has no mentor marketplace; data model must not preclude later per §7 persona Sam)
- Reason: fake booking of real-sounding humans; highest data-trust risk
- Regression: `#/mentors` 404s; no mentor names in bundle grep

### F23 — Profile (extra, but SPEC §15 core)
- Where: `#/profile` · `ProfileView.tsx` (3 tabs) + `CertificateAnalyzer` upload + `WizardContainer` re-onboarding + avatar presets + PDF/HTML export
- What: personal/academics/achievements edit, GPA calc, transcript upload→auto-GPA, export
- Inputs: `GET /api/profile`; `localStorage scholarpath_subjects_*`; `POST /api/analyze-certificate` (expects JSON `{filename,base64,textContent}` but client sends `FormData{certificate:File}` → **always falls through to hardcoded 5-subject mock**)
- Outputs: `POST /api/profile`, `POST /api/profile/reward`, `POST /api/upload-pdf`
- Dependencies: `calculations.ts`, pdf-parse, Gemini
- Data source: REAL (profile) + MOCKED (certificate path broken)
- Reality: REAL core, MOCKED certificate branch (bug, not malice)
- Verdict: REBUILD (→ SPEC §15 qualification-aware model + dynamic form engine; fix upload contract)
- Reason: no grade-scale model, blind GPA normalization, broken analyzer contract, no equivalency rules
- Regression: upload transcript → parsed subjects differ per file (not fixed 5); O-Level A* stored in A*–U scale, never converted

### F24 — Export Center (extra)
- Where: `#/export` · `ExportCenterView.tsx`
- What: export apps+profile to PDF/DOCX/JSON/MD via jsPDF/html2canvas
- Inputs: `GET /api/applications` (fallback mock), `GET /api/profile`
- Outputs: file download
- Dependencies: jspdf/html2canvas
- Data source: REAL inputs, LOCAL generation
- Reality: REAL
- Verdict: MERGE into SPEC §41 privacy export (settings/privacy ZIP) + per-page CSV/PDF exports; kill standalone page
- Reason: capability belongs in privacy + analytics/budget exports
- Regression: settings → Export my data downloads ZIP with profile+applications JSON

### F25 — Theme Settings (extra)
- Where: `#/customize` · `CustomizeView.tsx`
- What: sound/glow/3D toggles, custom Gemini key verify/delete, reset onboarding
- Inputs: `localStorage scholarpath_custom_gemini_key`; `GET /api/gemini/check-gemini-key`; `POST /api/profile {customGeminiKey}`
- Outputs: prefs + key verify
- Dependencies: none
- Data source: REAL verify + LOCAL prefs
- Reality: REAL
- Verdict: MERGE into Settings (SPEC §9 ACCOUNT/Settings); custom-key-in-browser pattern must die (server-only keys per §0.8)
- Reason: prefs real; per-user browser key contradicts secrets rule
- Regression: no `scholarpath_custom_gemini_key` reads in `src/`; settings page holds theme toggles

### F26 — GlobalSearch / Command palette scaffold
- Where: `src/components/GlobalSearch.tsx` (Ctrl+K) + `useKeyboardShortcuts`
- What: palette over 13 hardcoded `navigationTargets` (stale: `roadmap→learning`, missing matcher/chances/cv)
- Inputs: static list
- Outputs: `onNavigate(tabId)`
- Dependencies: none
- Data source: STATIC
- Reality: STATIC (navigates, doesn't search)
- Verdict: REBUILD (→ SPEC §30: grouped server results, keyboard, ARIA, debounce, rate limit)
- Reason: scaffold only; no entity search
- Regression: Ctrl+K "daad" → server scholarship result with keyboard select

### F27 — Floating AIAssistant bubble — see F12 (same backend). Verdict: REBUILD (merge into Advisor entry points).
### F28 — ProfessorFinder (embedded)
- Where: inside Universities modal · `ProfessorFinder.tsx`
- What: `POST /api/professors/search {university,country,keyword,degreeLevel}` (validates uni exists, then Gemini or offline preview)
- Reality: REAL (AI)
- Verdict: REMOVE from v1 (no source model for people data; hallucination risk)
- Reason: faculty listings without verified source violate §0.5
- Regression: no `/api/professors/*` route; no professor UI

### F29 — CareerCompass (orphan)
- Where: no route · `CareerCompass.tsx` → `GET /api/jobs` (which reads `data/jobs.json`, 2 rows)
- Reality: STATIC placeholder + `alert()` apply mock
- Verdict: REMOVE
- Reason: 2-row placeholder + fake apply button (SPEC §0.6 violation)
- Regression: no `CareerCompass` import; `/api/jobs` serves opportunities model or 404s

### F30 — CertificateAnalyzer — see F23. Verdict: REBUILD (fix contract, ground in grade scales).
### F31 — Onboarding wizards (`OnboardingWizard/*` 8 files + `AcademicOnboardingWizard`)
- Where: Profile/Login/App · `POST /api/academic/profile`, `POST /api/ai/wizard-assistant`, `POST /api/countries/add`
- Reality: REAL + LOCAL
- Verdict: REBUILD as SPEC §15 multi-step profile + review (keep 7-step spirit, server drafts)
- Reason: onboarding math duplicates tax logic 3×; `countries/add` is an unauthenticated file-write (see §6)
- Regression: complete onboarding → profile version increments, matches/analytics invalidate

### F32 — Notifications bell + `GET /api/notifications`
- Where: header `NotificationsBell.tsx`
- Reality: REAL (SQLite) but **global** (`user_id` never written) + **public unauthenticated** endpoint
- Verdict: REBUILD (→ SPEC §33: user-scoped, prefs, dedupe, jobs, email)
- Reason: cross-user leak + no prefs/dedupe
- Regression: user A cannot read user B's notifications (IDOR 403/404)

### F33 — Auth (`LoginScreen`, `AuthContext`, `routes/auth.ts`, JWT cookie + Bearer compat, guest, profiles)
- Reality: REAL (bcrypt salt 8, 7d user / 2h guest, HttpOnly cookie; weaknesses below)
- Verdict: REBUILD (→ SPEC §39 Auth.js/Better-Auth, verify/reset/OAuth, rotation, MFA for admin)
- Reason: no email verify/reset/OAuth, weak-username compat, localStorage JWT copy (XSS theft), ephemeral-secret footgun, no lockout/MFA
- Regression: sign-up → verify → login → logout-everywhere; old sessions die

### F34 — Gamification chrome (XP/levels/hearts/shields, `MinecraftWorld`, `ThreeScene`, sounds, confetti, streaks, skill-tree, `PwaInstallPrompt`, `OnboardingTour`, `QuickNotesWidget`, `CurrencySwitcher`, `SyncStatusDrawer`)
- Reality: LOCAL/STATIC
- Verdict: REMOVE gameplay (XP/hearts/skill-tree/confetti-grind); PRESERVE genuinely useful chrome (toasts, empty states, PWA prompt, tour, notes→profile field, currency→budget FX, sync status→mutation states) rebuilt without game skin
- Reason: SPEC §11 keeps warm-black+yellow identity but demands serious data-driven product; game HUD contradicts §6.4 quality bar
- Regression: no `points`/`level` mutation from client; profile reward path deleted

## 3. Component tree summary

```
main.tsx (SW, deadline Notifier)
└─ ThemeProvider > LanguageProvider > AuthProvider > App
   ├─ LoginScreen (pre-auth gate)
   ├─ Header: NotificationsBell, SyncStatusDrawer, CurrencySwitcher, XP HUD
   ├─ Sidebar (23 navItems, Minecraft skin, scroll)
   ├─ renderSandbox() → 24 views (§1) + #/mock-visa
   ├─ GlobalSearch (Ctrl+K, static), AIAssistant (floating), QuickNotesWidget,
   │   LevelUpModal, ToastContainer, PwaInstallPrompt, OnboardingTour
   └─ Contexts: Auth (profile+reward+offline queue), Theme (FX live open.er-api.com + DEFAULT_RATES),
      Language (i18n), Onboarding (wizard state + duplicated wage math)
Types: src/types.ts (Profile, Scholarship, University, Application, ChecklistItem, AppNotification, …)
Hooks: useBackgroundSync (25s localStorage persist), useKeyboardShortcuts, useDebounce, useOnboardingData
Services: mockDataService (localStorage apps), tourService (static)
Utils: calculations (grade→GPA/%, competitiveness), onboardingCalculations, curriculumData (~150 countries),
       documentTemplates (per-country checklists), sound/events/urlHelper/validation
```

## 4. Data-source map

| Source | Type | Consumers | Trust note |
|---|---|---|---|
| SQLite `data/app.db` (`users, profiles+30 cols, applications, roadmaps, notifications(global!), community_posts, cv_data, universities`) via `better-sqlite3`, `journal_mode=WAL` | REAL | all `/api/*` authenticated routes | durable only with persistent disk; Vercel ephemeral; `TURSO_*` not wired |
| In-memory `scholarshipsData` from `public/data/scholarships.json` (+ URL remap) | REAL-ish | `GET /api/scholarships`, recommender | no verification fields; scraper-mutated at runtime |
| `public/data/universities.json` (SQLite fallback + wizard/onboarding/search index) | REAL-ish | universities API fallback, AdmissionWizard, AdvancedSearch | duplicated source of truth (DB vs JSON) |
| `public/data/cost_of_living.json`, `student_jobs.json`, `tax_rules.json`, `visa_guide.json`, `exchange_rates.json` (2026-07-01, base USD) | STATIC | Budget, CountryMatcher, Visa, Onboarding, Theme FX | no sources/dates except FX; jobs only 2 rows; visa has officialUrls (unverified) |
| `public/data/internships.json` vs `data/jobs.json` (different files for `/api/jobs/internships/meta` vs `/api/jobs/`) | STATIC (divergent) | Internships vs CareerCompass | divergence bug |
| `public/data/university_reviews.json`, `success_stories.json` (+ hardcoded fallbacks) | REAL (user) | reviews, stories | no moderation; stored raw (XSS — §6) |
| `data/push_subs.json` | REAL (device) | push subscribe only (never sends) | dead pipeline |
| Gemini (`GEMINI_API_KEY`, model default `gemini-3.6-flash`) + per-user `customGeminiKey`/`x-gemini-key` | REAL (AI) | all `/api/gemini/*`, `/api/ai/*`, professor/mockVisa/roadmap/upload | heuristic fallbacks when keyless; no grounding/citations |
| `open.er-api.com` live FX + hardcoded `DEFAULT_RATES` | REAL + STATIC | ThemeContext `convertAmount` | client-side fetch (keyless OK, but SPEC wants server rates w/ provider+date) |
| localStorage (20+ keys: `scholarpath_user/guest_profile/jwt_token`, `mock_applications[_user]`, `subjects_*`, `gpa_trends_*`, `copilot_chatHistory_*`, `checkins/claimed_streaks`, `skill_tree`, `predeparture_*`, `custom_gemini_key`, `currency/lang/sounds/glow/3d/theme`, `sync_history`, `pending_*`, `onboarding_completed_*`, `pwa_dismissed`) · sessionStorage: zero hits | LOCAL | all views | offline resilience but also the persistence SPEC wants moved to Postgres |
| Scraper pipeline (`scheduler.ts` hourly + boot; RSS+DAAD+cheerio → `updateChecker` → `saveEntries` → JSON/SQLite → `notifier`) — runs when `!VERCEL` | REAL (ingest) | scholarships/universities/internships JSON | no staging/validation/dedupe UI; any-auth trigger endpoint |

API surface: 60+ endpoints across `server.ts` + 23 routers (full table in subagent report §2; key routes: `/api/health`, `/api/auth/*`, `/api/scholarships`, `/api/universities`, `/api/applications`, `/api/profile(+/cv|/reward)`, `/api/gemini/*` (6), `/api/best-*`, `/api/roadmap`, `/api/community`, `/api/jobs`, `/api/ai/*` (4), `/api/countries/*`, `/api/analyze-certificate`, `/api/professors/search`, `/api/university-reviews`, `/api/success-stories`, `/api/push/*`, `/api/upload-pdf`, `/api/mock-visa/interview`, `/api/study-groups`, `/api/fellowships/:id/apply`, `/api/check-gemini-key`, `/api/admin/import-universities`).

## 5. Env vars (canonical `.env.example` + grep)

`GEMINI_API_KEY` (recommended), `JWT_SECRET` (≥16 chars, throws in prod if missing; ephemeral on Vercel/Render/Railway), `ADMIN_TOKEN` (`x-admin-token`), `GEMINI_MODEL` (default `gemini-3.6-flash`), `VAPID_PUBLIC/PRIVATE_KEY`, `TURSO_DATABASE_URL/AUTH_TOKEN` (stub), `NODE_ENV`, `PORT=3000`, `VERCEL/RENDER/RAILWAY_ENVIRONMENT` (platform branching). Per-user `customGeminiKey` + `x-gemini-key` header (must be removed per §0.8). No `VITE_*` in src. No `.env` in repo (gitignored, correct).

## 6. Security findings (must fix by Phase 20; criticals by Phase 2)

1. **[CRITICAL] Unauthenticated file write** — `POST /api/countries/add` (no auth) writes to `cost_of_living.json`, `student_jobs.json`, `visa_guide.json`. Attacker-controlled JSON + disk fill. Fix: auth + admin role + schema validation.
2. **[CRITICAL] Any-user scraper trigger** — `POST /api/scraper/trigger` requires only any JWT incl. `guest_XXXX` → DoS/LLM/scrape-cost abuse. Fix: admin-only + rate limit + job queue.
3. **[HIGH] Public AI burn** — `POST /api/ai/budget-advisor`, `POST /api/analyze-certificate` (no auth, no rate limit). Fix: auth + `aiRateLimiter` + quotas.
4. **[HIGH] Notifications leak** — `GET /api/notifications` public, unbounded, `user_id` never written (global broadcast). Fix: user scope + auth (regression F32).
5. **[HIGH] Stored XSS** — `community.title/content`, `reviews.text`, `stories.text`, `profile.*`, `applications.notes` stored raw, no server escape/sanitize (only `/fellowships/:id/apply` escapes correctly). Fix: allowlist sanitize + output encoding.
6. **[HIGH] JWT in localStorage** — `AuthContext` writes `scholarpath_jwt_token` + sends `Bearer` compat alongside HttpOnly cookie → XSS theft. Seeds `alex/password123`, `guest/guest123`. Fix: cookie-only, remove compat, rotate seeds out.
7. **[MED] Rate-limit gaps** — only `auth` (100/15min/IP, in-memory, `x-forwarded-for` spoofable) + 3 AI routes (10/min). No global limiter, no durable store, no limits on `ai/*`, uploads, imports, search. Fix: SPEC §40 (Redis/Postgres 429+`Retry-After`).
8. **[MED] Upload abuse** — `POST /api/upload-pdf` persists base64 PDF (`≤10MB` JSON) into `profiles.resumePdf` TEXT (DB bloat, no MIME magic-byte check beyond `pdf-parse` try/catch, no virus hook). `analyze-certificate` has no size cap. Fix: SPEC §28 pipeline.
9. **[MED] Validation gaps** — `budget-advisor/budget-tips/ai-recommendations/wizard` (∼no schema), `community vote` (no id check, unbounded `+1`), `applications POST` (trusts client fields), `profile/cv` (no schema), `push/subscribe` (endpoint only), `badgeToUnlock` unsanitized push. Fix: zod everywhere (§38).
10. **[LOW] Headers good, missing pieces** — `nosniff/DENY/Referrer-Policy/Permissions-Policy` present in both server + `vercel.json`; missing `helmet/CSP-nonces/HSTS/CORS/CSRF`, per-route body caps, log redaction. `optionalAuth` degrades invalid tokens to anonymous instead of 401 (audit `ai.ts:15`).
11. **Secrets hygiene PASS** — no `AIza/sk-/BEGIN PRIVATE` in repo; `.env.example` empty values; `MOCK_KEY_PLACEHOLDER` inert; custom-key-in-browser is the remaining §0.8 violation.

## 7. Performance baseline (static; runtime to be measured once `npm ci` lands)

- No tests: glob `**/*.{test,spec}.*` = 0 files; no vitest/jest/playwright; `lint` = `tsc --noEmit` only (with `strict:false,noImplicitAny:false`).
- Bundle risks: `recharts`, `jspdf+html2canvas`, `motion`, `react-markdown`, `lucide-react` all in main chunk; only per-view `React.lazy`; no `manualChunks`; large `public/data/*.json` duplicated to `dist/data` by `copy-data.js`; Minecraft textures in `public/textures/`; Google Fonts (Inter/JetBrains Mono/Press Start 2P/VT323) external.
- Data risks: `GET /api/universities?limit=2000` (AdmissionWizard) + unbounded `GET /api/notifications`; no pagination on most lists (Scholarships has page/limit; Universities has limit/page); `express.json({limit:10mb})` global.
- Deploy: Docker 2-stage `node:20-slim` (`vite build` + `esbuild --format=cjs --packages=external` + `copy-data.js`); Vercel `api/index.ts` shim, `maxDuration:60`, `includeFiles: public/data/**`; `docker-compose` healthcheck `fetch /api/health` 30s; CI `.github/workflows/ci.yml` (`npm ci+lint+build`), `auto-update.yml` weekly scraper commits.
- ESM: `type:module` + CJS bundle avoids `__dirname` issues; source `.js`-suffix imports correct; `__dirname=process.cwd()` workarounds + multi-path DB search; `better-sqlite3` native fails on Vercel slim → `:memory:` fallback; `pdf-parse` lazy-import hotfix present; scheduler only when `!VERCEL` (cron `0 * * * *` + boot run).
- Targets for Phase 20: LCP <2.5s, route JS <~200KB gzip, list p95 <300ms @50k rows; `EXPLAIN` hot queries; kill `limit=2000` + unbounded fetches.

## 8. Accessibility baseline (static; axe run pending)

- Positives: `ErrorBoundary`, `EmptyState`, semantic-ish views, keyboard shortcut (`Ctrl+K/Esc`), focusable cards.
- Gaps: game HUD (non-semantic), custom kanban without keyboard DnD alternative, charts with no table fallback, palette missing `combobox` ARIA + stale targets, modals/drawers without focus-trap audit, color-alone statuses, XP toasts without live regions, touch targets unverified <44px, no `prefers-reduced-motion` handling, no axe in CI. WCAG 2.2 AA (SPEC §42) is greenfield work starting Phase 3.

## 9. Verdict summary (SPEC §2.4 decisions honored)

| Verdict | Features |
|---|---|
| PRESERVE (+improve) | F11 CV Builder, F13 IELTS (as Tool), F17 Mock-Visa (as Advisor mode) |
| IMPROVE / EXPAND | F01 Overview, F04 Internships→Opportunities, F05 Universities (+Programs) |
| REBUILD | F02 Analytics, F03 Scholarships, F06 Country Matcher, F07 Tracker, F10 Doc Center, F12 AI Chat, F15 Budget, F16 Visa, F23 Profile, F26 Search, F31 Onboarding, F32 Notifications, F33 Auth |
| REPLACE output | F08 Simulator %, F09 Will-Get-In % (tiers + `not_comparable`, §2.4) |
| MERGE | F14 Search→§30, F18 Roadmap→Tracker, F21 PreDeparture→Visa/Tracker, F24 Export→§41, F25 Customize→Settings, F27 bubble→Advisor |
| REMOVE | F19 Community, F20 Study Groups, F22 Mentors, F28 ProfessorFinder, F29 CareerCompass, F34 game chrome (XP/skill-tree), F35 `POST /api/gemini/budget-tips` + `POST /api/ai/interview` dead code |

Old-logic notes (§2.4): Simulator = weighted sliders → 5–99% + rating; Will-Get-In = normalized GPA + acceptance blend → safety/match/reach +4 major bump. Both replaced by SPEC §21. Calculator blind-converts 4.0/5.0/100 (replaced by §15 scale-comparison + `equivalency_rules`). Mock/demo content = `DEFAULT_ANON_PROFILE`, hardcoded mentors/QS/subjects/scores, `jobs.json` 2-row placeholder → all become `is_demo` fixtures hidden in prod (§47).

## 10. Regression checklist (re-run at every phase gate per §0.9)

- [ ] R01 Overview renders + daily bonus +15XP once
- [ ] R02 Analytics: add GPA term persists
- [ ] R03 Scholarships filter + Track → Applications
- [ ] R04 Internships search + stipend convert + apply link
- [ ] R05 Universities search + review post persists
- [ ] R06 Country quiz top-5 with costs + visa snippet
- [ ] R07 Applications CRUD + checklist + status persists
- [ ] R08 Simulator % exists (pre-Phase 8) / tier exists (post-Phase 8), no `% chance` post-Phase 8
- [ ] R09 Wizard buckets exist (pre) / `not_comparable` works (post)
- [ ] R10 SOP review returns feedback
- [ ] R11 CV save + reload + PDF export non-empty
- [ ] R12 AI chat answers (or honest no-key message)
- [ ] R13 IELTS drill scores
- [ ] R14 `#/search` works (pre-merge) / 301s (post-merge)
- [ ] R15 Budget country prefill + surplus math
- [ ] R16 Visa guide renders + official outlink
- [ ] R17 Mock-visa 2 turns average updates
- [ ] R18 Roadmap save persists
- [ ] R19 `#/community` works (pre-removal) / 404 (post)
- [ ] R20 Study-group join creates application
- [ ] R21 PreDeparture toggles persist
- [ ] R22 Mentors booking toast (pre-removal) / 404 (post)
- [ ] R23 Profile save + reload; certificate falls back to 5-subject mock (pre-fix)
- [ ] R24 Export downloads file
- [ ] R25 Theme toggles + key verify
- [ ] R26 Ctrl+K navigates
- [ ] R32 Notifications list renders (pre) / user-scoped (post)
- [ ] R33 Login/register/guest/logout round-trip
