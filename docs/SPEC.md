# OPEN CODE — SOMNIA IMPLEMENTATION SPECIFICATION

You are a senior full-stack engineer, database architect, UX engineer and technical lead working inside the existing Somnia repository. This document is your complete brief. Read it fully before touching code.

---

## 0. OPERATING RULES (READ FIRST)

0.1 **Save this document verbatim** to `/docs/SPEC.md` in the repo as your first action. Re-read the relevant sections at the start of every phase. This document is long; do not rely on memory of it.

0.2 **Work in the 21 controlled phases in section 51.** Never implement more than one phase at a time. Each phase ends with a gate (checks, fixes, a written phase report in `/docs/phases/phase-NN.md`, a git commit). Do not start the next phase until the gate passes.

0.3 **Branching and safety.** Work on a branch named `scholarpath-v2`. Commit at the end of every phase (and at sensible points inside a phase). Never force-push. Never delete the existing SQLite data or the legacy code until the migration in section 50 is verified. Never run destructive database commands against anything that is not a local/dev database.

0.4 **Preserve before you replace.** The existing app is the starting point, not scrap. Section 2 requires a full audit first. Every existing feature must end up as PRESERVED, IMPROVED, REBUILT, MERGED, REPLACED or REMOVED, with a written reason. Nothing disappears silently.

0.5 **Data trust is the highest-priority rule in this product.** Somnia deals with education, money, deadlines and visas. You must never invent authoritative-looking data. Specifically, never fabricate scholarships, deadlines, fees, visa requirements, university/program requirements, tuition figures or application URLs. See section 36 and section 47 for the seed-data policy. If you cannot verify something from an official source you can actually reach, leave the field empty/unknown or mark the record `estimated` / `needs_review`. An honest empty state is always better than a plausible-looking fake.

0.6 **No fake UI.** No decorative charts with made-up numbers, no buttons that do nothing, no "Coming soon" placeholders in navigation, no hard-coded demo data shown to real users as if it were real. If a feature's data does not exist yet, show a real empty state that explains what is missing and what the user (or an admin) can do.

0.7 **Language rules for outcomes.** Never write "you will get accepted/rejected" or any percentage "chance of admission". Use wording like "Your profile appears to meet the published requirements." Matching output is requirement-based and explainable (section 21).

0.8 **Secrets.** No API key, token or credential in frontend code, in the repo, or in client bundles. Server-only environment variables (section 48). Add `.env.example` with names only.

0.9 **Definition of a finished phase** (the gate): run `lint`, `typecheck`, unit tests, production build, and the phase's route/interaction checks; fix everything; confirm earlier phases did not regress (re-run the regression checklist from the audit); write the phase report (what was built, what was verified, known gaps, files changed); commit.

0.10 **If something in this document conflicts with what you find in the repo,** prefer the product intent here, record the conflict and your decision in the phase report, and continue. Ask the human only if the conflict is irreversible or changes scope.

0.11 **Page specification template.** Every major page below is specified with these fields: Purpose, Route, Layout, Components, Data, Interactions, Filters, Actions, Loading state, Empty state, Error state, Mobile behavior, Backend requirements. Implement all of them. Where a field is "n/a" the spec says so.

---

## 1. PROJECT CONTEXT

**Product:** Somnia — currently an AI-powered scholarship and university-admissions prototype, deployed at `https://rafie-kun-scolarship-app.vercel.app/`.

**Vision:** a global student command center for university discovery, scholarship discovery, admissions planning, study-abroad planning, academic profile analysis, country selection, program discovery, budget planning, visa preparation, application tracking, document management, internship/opportunity discovery, AI guidance and deadline management.

**The central product question every feature serves:**

> "Given my academic profile, goals, budget, country preferences, qualifications and interests, what can I realistically apply for, how do I apply, what will it cost, and what should I do next?"

**Primary audience:** secondary-school students and graduates applying internationally, with a first focus on students on British-style qualifications (O Level / IGCSE / AS / A Level), IB, AP, and national curricula, including students in South Asia. Support for master's/PhD applicants is required by the data model from day one.

**Known facts about the current app (UNVERIFIED — confirm in Phase 1):**
- The live site is a client-rendered SPA; its HTML title is "Somnia - AI-Powered Scholarship & Admissions Platform" and its meta description mentions fully funded scholarships, global university admissions, AI application coaching, SOP reviews, admission simulators and mock interview training. Theme color `#110f0d`.
- The stack is believed to be TypeScript with Next.js and an Express API, using `better-sqlite3` and Gemini for AI. Serverless filesystems are ephemeral, so SQLite on Vercel cannot be a durable production store; this is a major reason for the move to PostgreSQL.
- The UI is dark, warm-black, with a bright yellow accent, a textured background, beveled/game-inventory-style chrome (visible on the scrollbar and the selected-nav outline) and per-section colored icons.
- The sidebar contains at least these 12 items, in this order (see section 2 for the full table): Overview, Performance Analytics, Scholarship Finder, Internship Finder, Universities, Country Matcher, Applications Tracker, Admissions Calculator, Will I Get In?, Document Center, CV Builder, AI Chat Assistant. The sidebar scrolls, so there may be more items below.

---

## 2. EXISTING REPOSITORY AUDIT

### 2.1 Your task (Phase 1, before any new code)

Inspect the repository and the running app exhaustively. Produce `/docs/AUDIT.md`. Do not skim; small things count. You must run the app locally and click through every screen at desktop and mobile widths, and also read the source. Where source and behavior disagree, document both.

Audit every one of these: routes (including hidden/dev-only ones), pages, components, buttons, forms, inputs, dropdowns, search, filters, sorting, cards, tables, charts, analytics, calculators, modals, dialogs, drawers, tabs, tooltips, navigation, links, external redirects, saved states, localStorage/sessionStorage/cookies, mock/static data files, API routes and calls, authentication, user profile, settings, notifications, AI features and prompts, matching algorithms, scoring, recommendations, animations, responsive behavior, mobile layouts, empty/loading/error states, build/deploy configuration (`vercel.json`, ESM import extensions, serverless entry points), environment variables, dependencies, and test coverage.

### 2.2 Required record for EVERY feature in the inventory

```
Feature name:
Where it exists (route + file paths):
What it currently does:
Inputs:
Outputs:
User flow:
Dependencies (libs, APIs, env vars):
Data source:
Reality status: REAL | MOCKED | STATIC | CALCULATED  (and how you determined this)
Verdict: PRESERVE | IMPROVE | REBUILD | MERGE | REPLACE | REMOVE
Reason for verdict:
Regression test (one concrete check that proves it still works after the rebuild):
```

Also produce: a route map, a component tree summary, a data-source map (every mock file / table / endpoint), a list of every env var, a security findings list (exposed keys, unauthenticated endpoints, missing validation), a performance baseline (bundle size, slow routes), and an accessibility baseline (axe results).

### 2.3 Navigation inventory seed (verify each; add anything you find)

| # | Nav label | Icon / color (as seen) | Presumed purpose | Presumed verdict |
|---|---|---|---|---|
| 1 | Overview | trophy, yellow | home dashboard | PRESERVE + dramatically expand |
| 2 | Performance Analytics | trend arrow, yellow (selected = yellow outline box) | grade/performance charts | REBUILD into Academic & Admissions Analytics |
| 3 | Scholarship Finder | graduation cap, yellow | scholarship browse/filter | REBUILD into global scholarship engine |
| 4 | Internship Finder | briefcase, green | internship browse | EXPAND into Opportunities engine |
| 5 | Universities | building, blue | university list | EXPAND into university + program database |
| 6 | Country Matcher | compass, orange | country recommendation | EXPAND (cost, admissions, visa, lifestyle) |
| 7 | Applications Tracker | bookmark-check, red | track applications | REBUILD into full tracker (list/kanban/timeline/calendar) |
| 8 | Admissions Calculator | calculator, purple | unknown; likely a points/GPA/score calculator | AUDIT then decide (likely REBUILD as qualification-aware tools) |
| 9 | Will I Get In? | target, green | likely an admission-chance estimator | REBUILD — see 2.4 |
| 10 | Document Center | floppy/save, cyan | document storage | REBUILD (secure private storage, versions) |
| 11 | CV Builder | document, yellow | CV generation | PRESERVE + IMPROVE (profile-linked, versioned export) |
| 12 | AI Chat Assistant | open book, teal | LLM chat | REBUILD into context-aware, source-citing AI Advisor |
| ? | (anything below in the scroll area, SOP reviewer, mock interview trainer, admission simulator mentioned in site metadata) | | | find and classify |

### 2.4 Specific decisions already made

- **"Will I Get In?" / any admission simulator:** if the current implementation outputs a percentage chance or a yes/no prediction, REPLACE that output with the tiered, requirement-based, explainable result from section 21 (Strong / Good / Possible / Reach / Not Currently Eligible). The route and nav entry stay; the honesty of the output changes. Document what the old logic did.
- **Admissions Calculator:** do not assume what it computes. If it converts grades between systems with fixed formulas, that behavior must be replaced by the qualification-aware model in section 15 (no blind conversion). Keep any genuinely useful calculation (for example a documented points tally) as an explicitly labeled tool with its source.
- **AI features (chat, SOP review, mock interview):** preserve each as a capability; rebuild them on the server-side AI service in section 29.
- **Existing mock data:** do not ship it as real data. Move it to a clearly marked fixture set (`/seed/demo/`, flagged `is_demo=true`, hidden in production). Migrate any record that is real AND has a verifiable source; mark the rest `estimated` or `needs_review`.

---

## 3. EXISTING FEATURES THAT MUST BE PRESERVED

Preserved means: same capability remains available at an equal or better level, existing URLs redirect to the new ones (section 50), and the regression test from the audit still passes.

- All 12 navigation destinations above (names may be refined but legacy routes must redirect).
- The dark, warm-black look with the strong yellow accent and per-section icon colors (as category coding).
- The compact, icon-led left sidebar that scrolls with a distinctive scrollbar treatment (keep the character; make it accessible).
- Any filter, sort, search, saved state, chart toggle, modal, card interaction or "view details" action found in the audit that has real user value. Small things count.
- Any real (non-mock) data and any working integration discovered in the audit.
- CV Builder output capability.
- AI chat capability, SOP review, mock interview training, admission simulator concept (honest version).
- Deployment on Vercel (unless the audit proves a better fit).

## 4. EXISTING FEATURES THAT MUST BE IMPROVED

- Overview: from static summary to personalized command center with a "Next Action" engine (section 13).
- Internship Finder: same search architecture as scholarships, plus research, summer programs, fellowships, competitions, volunteering (section 17).
- Universities: from list to directory + program database (sections 18–19).
- Country Matcher: add cost, scholarship availability, admissions, language, visa, timelines, life considerations (section 20).
- Applications Tracker: add statuses, tasks, essays, recommendations, deadlines, four views (section 26).
- Document Center: add privacy, versioning, expiry, attachment, missing-document warnings (section 28).
- CV Builder: pull from the student profile, store versions in Document Center, export PDF.
- Accessibility, responsive behavior, empty/loading/error states everywhere.

## 5. EXISTING FEATURES THAT MUST BE REBUILT

- Performance Analytics → Academic & Admissions Analytics (section 14).
- Scholarship Finder → global scholarship engine with structured eligibility (sections 16, 22).
- Will I Get In? / Admissions Calculator → requirement-based matching and honest tools (sections 21, 2.4).
- AI Chat Assistant → AI Advisor with tool-calling, citations and verified/estimated/AI labels (section 29).
- Persistence: SQLite/local-state → PostgreSQL with migrations (sections 37, 50).
- Authentication/session handling if it is client-only or weak (section 39).

---

## 6. PRODUCT REQUIREMENTS

6.1 **Principles:** (1) every number must help a decision; (2) every fact shows its source and verification state; (3) never claim certainty about admission, funding, visas or deadlines; (4) the next step is always visible; (5) private data stays private; (6) works for non-US/UK qualification systems without forcing conversion.

6.2 **Functional scope (all required):** profile & qualifications; dashboard; analytics; scholarship finder; internship/opportunity finder; university directory; program search; university and scholarship matching engines; country matcher; budget planner; visa center; admissions guide; application tracker; deadline system; document center; CV builder; AI advisor; dynamic forms; global search + Ctrl+K; save + compare; notifications; admin dashboard; data ingestion; source/verification system; SEO for public pages.

6.3 **Non-goals / honesty constraints:** do not claim to contain every university on earth on day one. Build for scale, launch with whatever verified coverage exists, and show coverage honestly ("N verified programs in this country"). Do not provide legal or immigration advice; show official sources and disclaimers.

6.4 **Quality bar:** a serious product, not a mockup. Production build must pass; every route must work; every interaction must do something real.

## 7. USER PERSONAS

1. **Aisha, A Level (CIE) student in Dhaka**, predicted grades, wants a fully funded bachelor's abroad, tight budget, needs visa guidance and fee-aware planning.
2. **Marco, IB Diploma student in Brazil**, wants programs in Europe with subject prerequisites and English test requirements.
3. **Priya, AP/SAT student in the US**, applying to UK/Canada, needs requirement mapping across systems without conversions.
4. **Daniel, final-year bachelor's student in Kenya**, applying for master's scholarships (government and university-funded), needs eligibility checking and documents.
5. **Sam, counselor/parent (read-only helper, optional later)**, not in v1 scope except that the data model must not preclude shared access.
6. **Editor/Admin**, maintains data, verifies sources, handles imports and user reports.

## 8. USER JOURNEYS (implement and E2E-test each)

J1 Onboarding → build profile (qualifications, grades, budget, countries) → see dashboard with Next Action.
J2 Discover programs → filter → open program → read requirements → see match tier with reasons → save → compare → start application.
J3 Find scholarships → eligibility check with "why not" → save → add to tracker → deadline appears in calendar.
J4 Compare countries → set budget → compute scenarios → see scholarship-adjusted cost.
J5 Pick destination → visa guide → checklist with official links.
J6 Tracker → add documents/essays/recommendations → get missing-document warnings → mark applied.
J7 Ask the AI Advisor "What should I apply to first?" → answer cites records with verified/estimated labels.
J8 Admin imports a CSV of programs → validation errors reported → dedupe → verifies a record → published.
J9 User exports their data, then deletes their account.

---

## 9. INFORMATION ARCHITECTURE

Sidebar groups (keep the icon-led, color-coded style; group headers collapse):

- **HOME:** Overview
- **DISCOVER:** Universities, Programs, Scholarships, Opportunities (was Internship Finder), Countries (was Country Matcher)
- **PLAN:** Match Results (Will I Get In?), Budget Planner, Visa Center, Admissions Guide, Tools (Admissions Calculator and other calculators)
- **APPLY:** Applications Tracker, Deadlines, Document Center, CV Builder
- **INSIGHTS:** Performance Analytics
- **ASSIST:** AI Advisor (includes SOP review and mock interview modes)
- **ACCOUNT:** Profile, Saved, Compare, Notifications, Settings
- **ADMIN (role-gated):** Admin dashboard

Global: top bar with search (Ctrl/Cmd+K), notifications bell, quick-add, profile menu, profile-completeness chip.

## 10. ROUTING

Use the Next.js App Router with route groups: `(marketing)`, `(catalog)` (public, SEO, read-only unless logged in), `(app)` (authenticated), `(admin)` (role-gated).

| Route | Group | Notes |
|---|---|---|
| `/` | marketing | landing, public |
| `/universities`, `/universities/[slug]` | catalog | public |
| `/programs`, `/programs/[slug]` | catalog | public; slug includes university, e.g. `/programs/{university-slug}/{program-slug}` is acceptable if consistent |
| `/scholarships`, `/scholarships/[slug]` | catalog | public |
| `/opportunities`, `/opportunities/[slug]` | catalog | public |
| `/countries`, `/countries/[slug]` | catalog | public |
| `/visa`, `/visa/[destination]`, `/visa/[destination]/[citizenship]` | catalog | public guide, personalization when logged in |
| `/apply/[program-slug]` | catalog | Admissions Guide for a program |
| `/app` | app | Overview |
| `/app/analytics` | app | Performance Analytics |
| `/app/profile`, `/app/profile/qualifications`, `/app/profile/activities`, `/app/profile/preferences` | app | |
| `/app/matches` (+ `/app/matches/[programId]`) | app | university/program matching (Will I Get In?) |
| `/app/budget`, `/app/budget/[id]` | app | |
| `/app/applications`, `/app/applications/[id]` | app | views via `?view=list|kanban|timeline|calendar` |
| `/app/deadlines` | app | |
| `/app/documents`, `/app/documents/[id]` | app | |
| `/app/cv` | app | |
| `/app/advisor`, `/app/advisor/[sessionId]` | app | |
| `/app/saved`, `/app/compare` | app | |
| `/app/notifications`, `/app/settings` (+ `/app/settings/privacy`) | app | |
| `/app/tools/*` | app | calculators |
| `/admin`, `/admin/[resource]`, `/admin/imports`, `/admin/sources`, `/admin/reports` | admin | |
| `/api/v1/*` | api | section 38 |
| `/sitemap.xml`, `/robots.txt` | | section 44 |

Legacy routes (from audit) must 301/redirect to the equivalents above. Unknown routes show a real 404 page.

---

## 11. DESIGN SYSTEM

11.1 **Direction:** dark, academic, premium, professional, data-driven, fast. Keep the spirit of the current UI: warm-black surfaces, strong yellow accent, tactile beveled chrome. Evolve it; do not turn the whole app yellow; do not drift into generic AI-SaaS aesthetics.

11.2 **Tokens (define as CSS variables + Tailwind theme; adjust after auditing the real values):**
- Background: `--bg #110f0d`; surface-1 `#181512`; surface-2 `#201c18`; surface-3 `#2a2520`; border `#3a332c`; border-strong `#554b40`.
- Text: primary `#f3efe8`; secondary `#b9b0a3`; muted `#8a8174` (check contrast).
- Accent (brand): yellow `#f5c518` (use for primary action, active nav outline, key progress, focus ring). Hover `#ffd84a`; on-accent text `#14110d`.
- Category colors (for icons, chips, chart series; keep the current per-section hues): yellow, green, blue, orange, red, purple, cyan, teal. Never use color alone to carry meaning.
- Status colors: verified (green), needs-review (amber), expired (red), estimated (blue/grey). Tier colors: strong, good, possible, reach, not-eligible — each with an icon and text label.
- Contrast: all text ≥ 4.5:1, large text/UI ≥ 3:1. Verify with automated checks.

11.3 **Typography:** one display/heading face with character and one highly legible UI/body face; tabular numerals for data; define a modular scale (12/14/16/18/20/24/30/36/48). Strong hierarchy: page title, section label (small caps), card title, metadata.

11.4 **Spacing/shape:** 4px base grid; radius mostly 2–6px (not huge rounded cards); 1–2px borders; optional subtle bevel/inset highlight on primary containers as the signature, used sparingly and consistently, and only if the audit shows it is part of the existing identity. No heavy glassmorphism, no meaningless gradients.

11.5 **Components (build with shadcn/ui primitives, restyled):** Button, IconButton, Input, Select, Combobox, MultiSelect, Slider/RangeInput, Checkbox, Switch, Tabs, Tooltip, Popover, Dialog, Drawer/Sheet, Dropdown, Command palette, Table (sortable, sticky header, column visibility), DataList (mobile card list), Card, Badge/Chip, VerificationBadge, TierBadge, ProgressBar (segmented, may take the inventory-bar character), StatTile, Chart wrappers (line/bar/radar/stacked) with accessible fallbacks/tables, Calendar, Timeline, Kanban, Stepper, FileUploader, FormField system, Toast, EmptyState, ErrorState, Skeletons, Breadcrumbs, Pagination, SourceCitation.

11.6 **Motion:** subtle (150–250ms), purposeful (state change, list reorder, panel open). Respect `prefers-reduced-motion` (disable non-essential motion).

11.7 **States library:** every data component has loading (skeleton), empty (explanation + action), error (message + retry + error id), partial/stale (shows `last_verified` age).

11.8 Provide a living `/app/_design` (dev-only, excluded from prod) showing all components and states, used for visual and a11y checks.

## 12. APPLICATION SHELL

- **Desktop:** persistent left sidebar (collapsible to icon rail, scrollable with styled accessible scrollbar), top bar (breadcrumbs, search trigger with `Ctrl/⌘+K` hint, notifications, profile menu), content area with max width per page type (dense data pages full-width).
- **Tablet:** sidebar collapses to icon rail with tooltips; drawers for filters.
- **Mobile:** bottom tab bar (Home, Discover, Apply, Advisor, More) + full nav in a sheet; filter UI in a bottom sheet; tables become cards; sticky primary action.
- **Behavior:** active item = yellow outline (keep existing treatment); keyboard navigable; skip-to-content link; focus management on route change; persistent layout, no full reload; progress indicator for route transitions; error boundary per segment; global command palette mounted in the shell.
- **Auth gate:** `(app)` redirects to sign-in with return URL; `(admin)` checks role server-side.

---

## 13. DASHBOARD / OVERVIEW

- **Purpose:** the personalized command center; answers "What should I do next?"
- **Route:** `/app`
- **Layout:** top row = NEXT ACTION card (largest, left) + profile completeness (right). Below: 3-column responsive grid of modules.
- **Components:** NextActionCard, ProfileCompleteness (with itemized missing steps), AcademicSummary (strengths/gaps from real data), RecommendedPrograms (top matches with tier badges), RecommendedScholarships, UpcomingDeadlines (next 30 days, overdue highlighted), CurrentApplications (status counts + list), MissingDocuments, BudgetSummary (selected scenario), VisaPreparation (progress for the chosen destination), SavedOpportunities, RecentActivity, NotificationsPreview.
- **Data:** profile, qualifications/grades, match results (cached), scholarships eligibility results, deadlines, applications, documents, budgets, visa checklist progress, notifications, activity log.
- **Next Action engine (deterministic, server-side):** build candidate actions, score, pick top one, return top 3 secondary. Candidates and base urgency: overdue deadline (100) > deadline ≤ 7 days with missing required items (90) > deadline ≤ 14 days with missing items (80) > profile incomplete such that matching is blocked (70) > expiring document (60) > deadline ≤ 30 days (50) > save→apply nudges (30) > explore suggestions (10). Tie-break by nearest deadline, then fewest missing items. Each action carries `reason`, `missing[]`, `cta {label, href}`. Example: "University application deadline in 14 days. Missing: Personal Statement, Recommendation Letter. [Continue Application]". If the user has nothing to do, show a first-run checklist, not a blank card.
- **Interactions:** each module links to its page; items can be dismissed/snoozed (stored); NextAction CTA deep-links to the exact application/task.
- **Filters/Actions:** time window toggle (7/30/90 days) for deadlines; quick actions (add application, upload document, add deadline).
- **Loading:** per-module skeletons (modules load independently). **Empty:** each module explains what populates it and offers the action (e.g., "Add your grades to see program matches"). **Error:** per-module error with retry; the rest of the page stays usable.
- **Mobile:** single column; NextAction first, then deadlines, then applications; horizontal-scroll for recommended items is avoided (use stacked cards, "See all" links).
- **Backend:** `GET /api/v1/dashboard` (aggregates with parallel service calls and short-lived caching per user), `POST /api/v1/next-actions/{id}/dismiss`. Tables: all of the above.

## 14. PERFORMANCE ANALYTICS (Academic & Admissions Analytics)

- **Purpose:** decision-supporting analytics; no decorative metrics. Every widget has a visible "What this means / what to do" line and a link to the action.
- **Route:** `/app/analytics`; tabs: Academics · Requirements · Competitiveness · Readiness.
- **Widgets:**
  - *Grade trends:* user's own results over sessions, per subject, within a single grade scale at a time (never mixed scales on one axis; show separate small multiples per scale).
  - *Subject performance:* strongest/weakest subjects by rank within scale vs the student's own average; predicted vs achieved delta.
  - *Qualification progress:* completed / in-progress / planned qualifications and exam sessions.
  - *Requirement matching:* for chosen target programs, a matrix of requirements (rows) × programs (columns) with met/not met/unknown/not comparable.
  - *Program compatibility:* distribution of tiers across saved/target programs.
  - *University competitiveness / Scholarship competitiveness:* only where published statistics exist in the data (acceptance rate, typical offers, number of awards). If absent, show "No published data" — never estimated bars.
  - *Profile completeness & application readiness:* percent by section; per-application readiness (documents, essays, recs, tests).
  - *Test score readiness:* score vs target requirements with distance-to-goal and next test dates.
  - *Requirement gaps:* ranked list: "To meet X for Program P you need Y — recommended action".
- **Filters:** target degree level, country, saved-only, time range, qualification.
- **Interactions:** chart ↔ table toggle (accessible alternative), click a gap → opens the requirement and relevant programs, export CSV.
- **Loading/Empty/Error:** skeleton charts; empty state when no grades ("Add grades to unlock trends"); error with retry.
- **Mobile:** one widget per row, tabs become a select; charts have simplified axes and a tabular view.
- **Backend:** `GET /api/v1/analytics/{academics|requirements|competitiveness|readiness}`; computed from `student_subject_results`, `test_scores`, requirement evaluations, `applications`.

## 15. ACADEMIC PROFILE

- **Purpose:** capture everything needed for honest matching.
- **Route:** `/app/profile/*`; multi-step with save-and-continue and a review step.
- **Sections:** Identity & location (name, citizenship[s], residence, target countries); Education (current level, graduation year, school, curriculum); **Qualifications** (system, board, country, year, subjects, grades, completed vs predicted); Tests (SAT/ACT/AP/IB components; English tests IELTS/TOEFL iBT/Duolingo/PTE/Cambridge with section scores and expiry); Activities (extracurricular, leadership, volunteer, projects, research, internships, work, awards); Preferences (subjects, careers, universities, countries, degree level: Bachelor's/Master's/PhD/Foundation/Diploma/Other); Budget & funding (yearly budget, currency, funding required yes/no, need-based flag, family-contribution optional).
- **Qualification-aware model (critical):** NEVER convert across grading systems with a hidden formula. Each qualification stores: qualification name, system (O Level, IGCSE, GCSE, AS, A Level, IB DP, AP, SAT, ACT, GPA, percentage, national curriculum, other), exam board/system, country, subjects, grades, predicted grades, completed grades, year/session, grade scale, requirements, source. Grades live in a defined **grade scale** (ordinal letters such as A*–U; numeric 1–7 with points; percentage; GPA with a declared maximum; points-based). Comparison rules:
  - A requirement and a result may be compared directly only when they use the same grade scale (ordinal rank or numeric value).
  - Cross-scale comparison is allowed only through an `equivalency_rules` record that has a documented source (institution's published equivalency page, official body, etc.); otherwise the engine returns `not_comparable` and the UI says what equivalence the institution publishes and offers a link. Admin can add rules with sources.
  - GPA and percentage inputs always carry their own scale max; never assume 4.0 or 100.
- **Components:** dynamic form engine (section 21 of the form requirements — see below), SubjectGradeTable, QualificationCard, PredictedToggle, TestScoreInput with section subscores and validity dates, ActivityList with type filter, CompletenessMeter.
- **Dynamic form system (reusable):** schema-driven (JSON schema + zod), conditional fields, per-step validation, progress, save-and-continue (autosave drafts server-side), review screen, scoring/recommendation hooks. Used for: academic profile, scholarship eligibility, university preferences, country preferences, budget questionnaire, visa preparation, application readiness.
- **Validation:** grade must exist in the chosen scale; year range; predicted flag requires exam session in the future/current; test score ranges per test definition; dates not in impossible ranges; required-by-step fields.
- **Loading/Empty/Error:** skeleton form; first-run empty guided start; field-level and form-level errors preserved on failure; draft recovery.
- **Mobile:** one question group per screen, sticky Save/Next.
- **Backend:** `/api/v1/profile`, `/profile/qualifications`, `/profile/subject-results`, `/profile/test-scores`, `/profile/activities`, `/profile/preferences`; catalogs: `/api/v1/catalog/qualification-systems`, `/grade-scales`, `/subjects`, `/test-types`. Tables in section 37. Profile changes invalidate cached matches and analytics.

## 16. SCHOLARSHIP FINDER

- **Purpose:** global scholarship search with eligibility checking and tracking.
- **Route:** `/scholarships` (public), `/scholarships/[slug]`; personalization when logged in.
- **Layout:** left filter panel (desktop), results list/table with view toggle (cards/table), sticky sort bar; detail page with Overview, Eligibility, Funding, Documents, How to apply, Source & verification.
- **Filters:** country, university, degree level, field, nationality, residency, academic qualification, grades/GPA threshold, income/financial need, merit, need-based, full tuition, partial tuition, living stipend, housing, travel, insurance, government/university/external provider type, deadline range, application fee (free/any/max), "only those I appear eligible for", verification status.
- **Sort:** deadline soonest, funding amount, best match, recently verified, name.
- **Scholarship record fields:** name, provider, country, university, description, eligibility (structured + text), nationality rules, academic requirements, funding amount (min/max/currency/period), funding coverage (components), deadline(s), application fee, opening date, documents, selection process, renewability, official website, official application URL, source, last verified, verification status.
- **Actions:** save, compare (up to 4), check eligibility, add to tracker, open Apply Officially (only if verified official URL; otherwise show "Official URL not verified" and the official website if available), report an error.
- **Eligibility check (section 22):** returns Eligible / Likely eligible / Unknown (missing info) / Not eligible with per-rule reasons and "why not".
- **Loading/Empty/Error:** skeleton rows; empty state explains active filters and offers "clear filters" and "widen to similar"; error with retry.
- **Mobile:** filters in bottom sheet with active-filter chips; cards not tables; sticky Save/Add to tracker bar on detail.
- **Backend:** `GET /api/v1/scholarships` (server-side filtering, pagination, sort; Postgres full-text + trigram), `GET /scholarships/{id}`, `POST /scholarships/{id}/eligibility`, `POST /saved-items`. Never fetch unbounded lists.

## 17. INTERNSHIP FINDER → OPPORTUNITIES

- **Purpose:** internships, research opportunities, summer programs, fellowships, competitions, volunteer opportunities, academic opportunities, student programs.
- **Route:** `/opportunities`, `/opportunities/[slug]`. Keep a redirect from the legacy internship route.
- **Architecture:** share the search/filter/list/detail/save/compare/tracker components and API patterns with Scholarship Finder (one generic "catalog" module parameterized by entity type). Table: `opportunities` with `type` enum.
- **Filters:** type, field, country/remote, age/education level, paid/unpaid/stipend, duration, deadline, eligibility (nationality), verification status.
- **States/mobile/backend:** identical patterns to section 16; endpoints `/api/v1/opportunities…`.

## 18. UNIVERSITY DATABASE

- **Purpose:** scalable directory; each university contains many programs.
- **Route:** `/universities`, `/universities/[slug]`.
- **Fields:** name, country, city, region, website, admissions website, international office contact, application portal, application fee (general), tuition (ranges, per level, home vs international where stated), living cost estimates (estimated, with source), scholarships (linked), programs (linked), admission requirements (general), language requirements, deadlines, intakes, accreditation, student info, international student info, campus info, housing, student services.
- **List:** filters (country, city/region, public/private, language of instruction, tuition range, has scholarships, has programs in field, intake, verification status, "within my budget"), sort (name, tuition, best match for my profile where computable, last verified), search, saved indicator, compare (up to 4), pagination.
- **Detail page tabs:** Overview, Programs (searchable, filtered), Admissions & requirements, Costs, Scholarships, International students, Campus & housing, Sources.
- **Actions:** save, compare, view programs, apply officially (link to verified admissions/portal URL), report an error.
- **Scale/coverage:** no claim of global completeness; show coverage indicators ("X programs, Y verified"). Schema and import pipeline built for growth (section 26).
- **Backend:** `GET /api/v1/universities`, `/universities/{id}`, `/universities/{id}/programs`; Postgres indexes (section 37). Public pages are server-rendered with metadata and structured data (section 44).
- **States/mobile:** per section 11.7; card list on mobile, detail tabs become an accordion/segmented control.

## 19. PROGRAM DATABASE

- **Purpose:** search by degree/program; applications happen at program level.
- **Route:** `/programs`, `/programs/[slug]`.
- **Fields:** name, university, field/subject area (taxonomy), degree level, duration, language(s) of instruction, study mode, intakes, tuition (per year/total, currency, intl vs home), application fee, deadlines (per intake and per applicant type), requirements (structured, section 21), scholarships linked, career tags, curriculum URL, application URL and platform (UCAS, Common App, university portal, etc.), interview/portfolio/test needs, verification metadata.
- **Search (server-side):** subject, career, degree level, country, university, budget, duration, language, deadline window, requirements ("programs I appear to meet"), scholarships available. Free-text over name/field/career tags with typo tolerance (pg_trgm).
- **Result card:** program, university, country, tier badge (if profile exists), tuition, next deadline, scholarship indicator, verification badge.
- **Detail:** requirements checklist with per-requirement met/not met/unknown and reasons; costs; deadlines; how to apply; scholarships; similar programs; Apply Officially.
- **Backend:** `GET /api/v1/programs`, `/programs/{id}`, `/programs/{id}/match` (section 21).

## 20. COUNTRY MATCHER

- **Purpose:** compare countries on what matters to a student and recommend based on the profile.
- **Route:** `/countries`, `/countries/[slug]`; preserve the legacy Country Matcher flow as "Find my countries" (questionnaire → ranked list).
- **Dimensions:** tuition ranges, living costs, scholarship availability (count of verified scholarships in database), admissions requirements overview, teaching language/English-taught availability, visa information (links to section 24), application timelines, student life considerations, accommodation, transportation, healthcare information (official sources), weather/lifestyle preferences, work rules where legally and officially stated, post-study information when officially available. Each datum carries source + verification.
- **Personalized ranking:** user sets weights (budget, scholarships, language, climate, visa ease via published facts, post-study options); score = weighted sum of normalized dimension scores computed only from available data; show missing-data indicators and never rank on fabricated values; show the breakdown of the score.
- **Features:** country search, country cards, side-by-side compare (up to 4), personalized recommendations, "programs in this country that match me".
- **States/mobile/backend:** `GET /api/v1/countries`, `/countries/{id}`, `POST /api/v1/countries/recommend`.

## 21. UNIVERSITY MATCHING ENGINE (Will I Get In? rebuilt)

- **Routes:** `/app/matches` (list across saved/target programs), `/app/matches/[programId]` (detail), also surfaced on program pages.
- **Principle:** deterministic, rules-based, explainable, fully unit-tested. No probability of admission. No black-box ML in v1.
- **Inputs:** profile snapshot (qualifications, subject results incl. predicted, tests, English proficiency, citizenship, budget, countries, field, degree level, scholarship needs) and the program's structured data.
- **Requirement model:** table `program_requirements` with `kind` (qualification_grade, subject_prerequisite, subject_group, test_score, english_proficiency, portfolio, interview, admissions_test, recommendation, essay, other), `qualification_system_id`, `subject_id`, `operator` (≥, =, in, count_of), `min_grade_rank`/`min_numeric`/`value_text`, `is_mandatory`, `alt_group_id` (OR-groups), `notes`, `source_id`.
- **Per-requirement evaluation status:** `met`, `met_by_predicted`, `not_met`, `unknown` (missing student data or missing requirement data), `not_comparable` (no documented equivalency).
- **Tier assignment (implement exactly; make thresholds configurable constants):**
  1. **Not Currently Eligible** — a hard filter fails (degree level not offered, citizenship/residency exclusion, program closed for intake) OR any mandatory requirement is `not_met` using sufficiently trustworthy data.
  2. **Strong Match** — all mandatory requirements `met` by completed results, or `met_by_predicted` with a margin of at least one grade step above the minimum; no mandatory `unknown`/`not_comparable`; underlying records `verified` and not expired.
  3. **Good Match** — all mandatory requirements `met` or `met_by_predicted` (no margin needed); none unknown.
  4. **Possible Match** — no mandatory `not_met`, but at least one mandatory `unknown` or `not_comparable`, or relevant data is only `estimated`.
  5. **Reach** — mandatory requirements are met only at the minimum AND the program has a published selectivity indicator (e.g., typical offer or published acceptance rate) that exceeds the student's profile, OR a competitiveness flag is set with documented source, OR required elements the student has not yet done (admissions test, portfolio, interview) exist. If no selectivity data exists, Reach is never assigned; do not invent selectivity.
  - Data trust caps: if the governing record is `estimated` it cannot yield Strong; if `expired` it yields Possible at best with a warning.
  - Budget and deadline checks are **warnings**, not tier modifiers: estimated annual cost vs budget; deadline passed/closing; missing English test.
- **Output contract:**
  ```
  { tier, confidence: high|medium|low,
    reasons: [{requirementId, status, text, source, verificationStatus}],
    warnings: [...], missingInfo: [...], nextSteps: [...] }
  ```
  Example copy: STRONG MATCH — ✓ Your subject combination satisfies the published prerequisite. ✓ Your grades fall within the stated range. ✓ Your degree preference is available. ⚠ Estimated total cost is above your preferred budget. Always followed by: "Your profile appears to meet the published requirements. This is not a prediction of admission."
- **UI:** match list (grouped by tier, filter by tier/country/degree/saved, sort by deadline/cost), detail with requirement-by-requirement table, "What if" panel (hypothetically change a predicted grade or add a test; recompute client-side via a pure shared function and server verification), actions (save, add to tracker, Apply Officially, ask AI).
- **Caching:** results stored in `match_results` keyed by (user, program, profile_version, program_version); invalidated on profile or requirement changes.
- **Backend:** `POST /api/v1/matches/evaluate` (single/batch with limits), `GET /api/v1/matches`. Pure functions in `src/lib/matching/` shared by server and tests.
- **Tests:** fixtures for each tier, each requirement status, OR-groups, predicted grades, non-comparable scales, stale/estimated data, all edge cases above.

## 22. SCHOLARSHIP MATCHING ENGINE

- Structured rules table `scholarship_requirements` (same shape as program requirements) plus `scholarship_eligibility_rules` for nationality include/exclude lists, residency, age range, degree levels, fields, enrollment status, need-based/financial criteria, prior-award rules.
- **Result states:** `eligible` ("appears to meet the published criteria"), `likely_eligible` (all known criteria met, minor unknowns), `unknown` (key data missing; list what to add), `not_eligible` (with each failing rule). Every state lists reasons with sources.
- **"Why do I not match this scholarship?"** is a first-class output (used by UI and AI Advisor).
- Funding coverage is displayed per component (tuition, stipend, housing, travel, insurance) with source; amounts are never summed unless the source gives the total.
- Same UI/UX patterns, caching and tests as section 21.

## 23. BUDGET CALCULATOR

- **Purpose:** serious international-student budget planning.
- **Route:** `/app/budget` (list of budget plans) and `/app/budget/[id]`; can be created from a program ("Plan the cost of this program").
- **Inputs (each with amount, currency, frequency, source/assumption note):** tuition, accommodation, food, transportation, insurance, visa, flights, books, technology, personal expenses, application fees, testing fees, emergency fund. Prefill from program/country/university data where available and label prefilled values `estimated` or `verified` with source; the user can override any value (override is flagged "your assumption").
- **Scenarios:** Budget (low), Expected, High, using min/expected/max estimates per item; if only a single value exists the scenarios widen by user-set percentage and are labeled as assumptions.
- **Outputs and formulas (implement exactly; show formulas in a "How this is calculated" drawer):**
  - Monthly recurring = accommodation + food + transport + monthly insurance + personal + other monthly items.
  - Annual cost = annual tuition + 12 × Monthly recurring + annual insurance if charged annually.
  - First-year cost = Annual cost + one-time costs (visa, flights, deposits, technology, application fees, testing fees).
  - Total degree cost = Σ over program years (tuition per year, optional tuition-increase % per year set by the user) + living costs over duration + one-time costs (flights per year configurable).
  - Initial funds required = first-term tuition (or first-year if required up-front) + 3 months living (configurable months) + one-time costs due before arrival + emergency fund + any visa-proof amount if the visa guide states one.
  - Scholarship-adjusted cost = cost minus selected scholarship coverage, with a toggle for "awarded" vs "hypothetical"; coverage applies only to components the scholarship actually covers.
  - Gap vs budget: annual cost vs the user's stated budget with remaining/shortfall.
- **Currency:** each plan has a display currency; conversions use stored daily rates from a rates provider (`exchange_rates` table with timestamp and provider); UI shows the rate, date and provider; manual rate override allowed. Never fetch rates client-side with a key.
- **Interactions:** inline editable table, scenario tabs, stacked bar breakdown chart with data table fallback, compare two plans, export CSV/PDF, attach to application.
- **Validation:** non-negative numbers; currency codes ISO 4217; durations 0.5–10 years.
- **States:** empty ("Start from a program or country"), loading skeleton, error with retry; stale-rate warning if rates older than 7 days.
- **Mobile:** expandable sections per cost group; totals in a sticky summary.
- **Backend:** `/api/v1/budgets` CRUD with `budget_items` and `budget_scenarios`; `GET /api/v1/fx?base=&quote=`; calculation in a pure shared module with unit tests including rounding rules (round only at display; store high precision decimals/minor units).

## 24. VISA CENTER

- **Purpose:** official-source-first student visa guidance.
- **Route:** `/visa` (selector), `/visa/[destination]/[citizenship]`; wizard inputs: citizenship, study country, university, city, degree level.
- **Output:** relevant visa type(s), step-by-step application process, required documents, financial requirements (only where official sources state them), insurance, health requirements, biometrics, application links, government source, important warnings, general checklist (savable as tasks with deadlines).
- **Data trust:** a `visa_guides` record can be published only if it has at least one `source` whose publisher type is `government`/`immigration authority`, a `source_url`, and `last_verified`. Third-party sources can be attached as secondary, labeled. Fallback chain: exact (citizenship+destination+level) → destination+level generic → "No verified guide yet" state with the official immigration portal link if known.
- **Mandatory banner on every guide:** "Visa requirements can change. Verify on the official government website before you apply." plus last-verified date; stale (> configurable days) guides display a prominent "may be outdated" notice.
- **Interactions:** checklist with per-item completion persisted per user; link out to official site (new tab, rel noopener); add milestone to deadlines.
- **Backend:** `GET /api/v1/visa-guides?citizenship=&destination=&level=`, `POST /api/v1/visa-checklists`.
- **States/mobile:** standard; stepper layout on mobile.

## 25. ADMISSIONS CENTER (How to Apply)

- **Route:** `/apply/[program-slug]` and a tab inside program/university pages.
- **Content, per program where data exists:** where to apply, application platform, application fee, deadlines, academic requirements, subject prerequisites, language requirements, documents, personal statement/essay, recommendation requirements, portfolio, tests, interview, additional requirements, timeline (suggested backward-planned schedule from the deadline).
- **APPLY OFFICIALLY button:** visible only when the program/university has a verified official application destination (`verification_status = verified`); otherwise show a disabled state with explanation and the official website link if available. Opens in a new tab; log the click (privacy-respecting) for analytics.
- **Actions:** "Start tracking this application" (creates application, copies requirements into tasks, copies deadlines), "Check my match", "Ask AI how to apply".
- **Missing data:** each missing section shows "Not yet verified" with a "Report / suggest source" action.
- **Backend:** reuses programs/universities/requirements; `POST /api/v1/applications` from a program.

## 26. APPLICATION TRACKER

- **Route:** `/app/applications`, `/app/applications/[id]`; views via a segmented control: List, Kanban, Timeline, Calendar (state in URL).
- **Application kinds:** university, program, scholarship, internship/opportunity, other (custom title).
- **Statuses:** Researching, Interested, Preparing, Ready to Apply, Applied, Interview, Offer, Accepted, Rejected, Withdrawn. Status changes are recorded in `application_status_history` (who/when).
- **Fields:** deadline, fee (and paid flag), URL, required documents (checklist linked to Document Center), essays (prompt, word limit, status, linked document version), recommendations (recommender, status: not requested/requested/received), tests, notes, status, submission date, decision, funding, scholarship result.
- **Kanban:** drag-and-drop with keyboard alternative; WIP counts; column collapse.
- **Timeline/Calendar:** show deadlines and milestones; overdue in red with text label; click to open.
- **Automations:** creating from a program/scholarship copies its requirements into tasks and creates linked deadlines; changes to the catalog deadline notify the user (section 33); marking Applied requires a submission date (defaults today).
- **Validation:** cannot mark "Ready to Apply" with mandatory tasks incomplete unless the user confirms override; dates sane.
- **States/mobile:** List and Kanban become a status-grouped card list; calendar becomes agenda view.
- **Backend:** `/api/v1/applications`, `/applications/{id}/tasks`, `/essays`, `/recommendations`, `/attachments`, `/status`.

## 27. DEADLINE CALENDAR

- **Route:** `/app/deadlines` (Upcoming, Overdue, Calendar, Timeline tabs).
- **Types:** university, scholarship, internship, visa milestone, test date, document deadline, personal task.
- **Features:** user-created deadlines, deadlines derived from tracked applications (linked to the catalog record), reminders (e.g., 30/14/7/3/1 days, configurable), ICS export, subscribe feed (private tokenized URL), timezone handling (store UTC + original timezone; show in user timezone; rolling deadlines flagged).
- **Rules:** overdue = past due and not completed; completing a deadline requires explicit action; derived deadlines cannot be silently edited (the user can add a personal override).
- **Backend:** `/api/v1/deadlines`; scheduler job creates notifications (section 33).

## 28. DOCUMENT CENTER

- **Route:** `/app/documents`, `/app/documents/[id]`.
- **Categories:** passport, transcript, certificate, predicted grades, recommendation letter, personal statement, CV, resume, portfolio, English test, SAT/ACT, financial documents, visa documents, other.
- **Features:** upload (drag-drop, multi-file), categorize, rename, versions (each upload to a document creates a new version; restore), attach to applications and requirements, expiration date and reminders (e.g., passport, English tests), completion state, missing-document warnings (derived from tracker requirements), preview (PDF/image) via short-lived signed URLs, download, delete (soft then hard).
- **Privacy/security (non-negotiable):** private object storage bucket, no public URLs, signed URLs ≤ 5 minutes, ownership checked on every access, random storage keys, MIME allowlist (pdf, png, jpg/jpeg, docx), size limits (e.g., 15 MB), magic-byte validation, optional malware-scan hook, no document content ever sent to AI unless the user explicitly attaches it in an advisor session, access logged.
- **States/mobile:** grid/list toggle; upload progress with retry; mobile camera upload supported.
- **Backend:** `/api/v1/documents`, `/documents/{id}/versions`, `/documents/upload-url` (pre-signed upload), `/documents/{id}/download-url`.

## 29. AI ADVISOR

- **Route:** `/app/advisor`, `/app/advisor/[sessionId]`. Modes: General advisor, SOP/essay reviewer, Mock interview. Preserve any existing AI features and their intent.
- **Server-side only.** The LLM provider (Gemini currently in the prototype; confirm) sits behind an `AiProvider` interface so it can be swapped. The API key never reaches the client. Streaming responses via server route.
- **Grounding (mandatory):** the advisor answers factual questions only through tool calls into the database, never from the model's memory. Tools: `get_profile_summary`, `search_programs`, `get_program`, `evaluate_program_match`, `search_scholarships`, `evaluate_scholarship_eligibility`, `get_deadlines`, `get_applications`, `get_missing_documents`, `calculate_budget`, `get_visa_guide`, `get_country`. Each tool returns records with ids, `source`, `source_url`, `last_verified`, `verification_status`.
- **Response contract:** every factual claim is attached to citations (record id + source). The UI renders three label types: **Verified data**, **Estimated data**, **AI recommendation** (and "Not in database" when nothing is found). If the data is not in Somnia, the advisor says so ("I don't have verified information on that") and points to the official site if known; it must not guess deadlines, fees, requirements or visa rules.
- **Questions it must handle well:** Which universities/scholarships fit me? What should I apply to first? What am I missing? How much will this cost? What documents do I need? Why do I not match this scholarship? Which country fits my budget? How do I apply?
- **Safety:** prompt-injection defense (treat user-uploaded text, document content and web content as untrusted data); never reveal system prompts or other users' data; outputs avoid admission guarantees; legal/immigration disclaimers on visa topics; rate limits per user; token/usage budget; moderation for abuse; PII minimization (send only needed profile fields).
- **SOP/essay reviewer:** user pastes text or selects a document version; response structured (clarity, structure, specificity, prompt fit, length vs limit); never rewrites the entire essay unless asked; labeled as AI feedback.
- **Mock interview:** question generation tailored to program/scholarship; turn-by-turn feedback; transcripts stored in `chat_messages`; text-first (voice optional later).
- **Persistence:** `chat_sessions`, `chat_messages` (role, content, tool_calls, citations, created_at). Users can delete sessions. Context window management: summarize old turns.
- **UI:** chat with suggested prompts based on state, message citations as expandable chips, copy/regenerate, session sidebar, error + retry, offline-friendly drafts.
- **Backend:** `POST /api/v1/advisor/sessions`, `POST /advisor/sessions/{id}/messages` (SSE stream), `GET/DELETE`. Evaluation harness with golden questions (section 46).

## 30. SEARCH

- **Global search** across universities, programs, scholarships, opportunities, countries, and the user's applications.
- **Command palette:** `Ctrl+K` / `⌘+K` anywhere in the shell; grouped results with icons, keyboard navigation (↑/↓/Enter/Esc), recent items, quick actions ("Add application", "Upload document", "Go to Deadlines"), debounced requests, abort stale requests, ARIA combobox semantics.
- **Backend:** `GET /api/v1/search?q=&types=&limit=` returning top N per type; Postgres `tsvector` + `pg_trgm` indexes; user-scoped results for applications; rate limited; no unbounded results. Plan an adapter so an external search engine can replace Postgres later.
- **Empty/Error:** "No results for ..." with suggestions; error row inside the palette.

## 31. COMPARE

- **Route:** `/app/compare` with entity tabs: Universities, Programs, Scholarships, Countries. Up to 4 items side by side.
- **Rows:** per entity type, the key fields (e.g., programs: tuition, duration, language, deadlines, requirements, match tier, scholarships; scholarships: funding coverage, eligibility, deadline, fee; countries: cost, visa, language, scholarships).
- **Features:** highlight differences toggle, sticky header with item names, remove/add items, shareable read-only link optional (off by default), export. Comparisons saved in `comparisons` + `comparison_items`.
- **Mobile:** swipeable column view with a pinned label column or stacked per-item cards.

## 32. SAVED ITEMS

- **Route:** `/app/saved` with tabs per entity (universities, programs, scholarships, countries, opportunities); collections/tags optional (folders).
- **Behavior:** a heart/bookmark control on every card and detail page (optimistic UI, rollback on failure), counts in nav, bulk actions (compare, add to tracker, remove). Table `saved_items` with unique (user, entity_type, entity_id). Notify on updates to saved items (section 33).

## 33. NOTIFICATIONS

- **Types:** deadline reminders, missing documents, application changes, scholarship deadline reminders, new opportunities matching saved filters, saved-item updates (e.g., a deadline changed in the catalog), profile recommendations.
- **Channels:** in-app (bell + `/app/notifications`) and email (transactional provider). Optional web push later.
- **Preferences:** per type × channel toggles, reminder offsets, quiet hours, digest vs immediate, timezone.
- **Engine:** daily and hourly scheduled jobs (Vercel Cron or equivalent) compute due reminders; dedupe key `(user, type, entity, offset)` to prevent repeats; mark read/unread; archive; unsubscribe link in emails honoring preferences; no sensitive document content in email.
- **Backend:** `/api/v1/notifications`, `/notification-preferences`; job endpoints protected by `CRON_SECRET`.

## 34. ADMIN DASHBOARD

- **Route:** `/admin/*`, role `editor` or `admin` enforced on the server for every page and API.
- **Resources (CRUD + bulk):** universities, programs, requirements, scholarships, opportunities, countries, visa guides, deadlines, fees, sources, equivalency rules, grade scales/subjects/test types, users' reports, data imports.
- **Every external-data record has:** source, source URL, last verified, verification status (**Verified / Needs Review / Expired / Estimated**), notes.
- **Verification workflow:** draft → needs_review → verified (by a different editor if "four-eyes" setting is on) → expired (automatic when `last_verified` exceeds the TTL for that entity type or a deadline passes). Every change creates a revision with diff and actor. Dashboard widgets: records needing review, expiring in 30 days, imports with errors, open user reports.
- **User reports:** from any public page ("Report an error"): stored with entity ref, message, reporter; triage queue → resolved with outcome.
- **UX:** data tables with server-side pagination/filters, inline validation, side-by-side source preview, bulk verify, CSV export, audit log viewer.
- **Security:** RBAC, MFA required for admin accounts, audit trail, no direct SQL, CSRF protection, rate limits.

## 35. DATA INGESTION

- **Sources supported:** manual entry, CSV upload, JSON upload, API connectors, scheduled imports.
- **Pipeline:** upload/fetch → **staging** (`data_import_rows` with raw payload) → schema validation (zod) → normalization (country codes ISO-3166, currency ISO-4217, dates ISO-8601, URL canonicalization) → deduplication (match keys: universities = normalized name + country + website domain; programs = university + degree level + normalized name + study mode; scholarships = provider + normalized name + country) with fuzzy suggestions → diff preview (create/update/skip per row) → admin approves → commit transactionally → revisions recorded → error report downloadable (row number, field, message).
- **Versioning:** `record_revisions` for catalog entities; imports are idempotent (re-running yields no change); every imported field carries source and `imported_at`; imported data defaults to `needs_review` (never auto-`verified`).
- **Scheduling:** `import_schedules` with cron expressions, connector config (secrets only on server), retry/backoff, failure notifications to admins.
- **Templates:** downloadable CSV/JSON templates per entity with documented columns.
- **Backend:** `/api/v1/admin/imports` (create, status, rows, approve, rollback of an import where possible).

## 36. SOURCE / VERIFICATION SYSTEM

- `sources` table: publisher, publisher_type (government, university, official_body, scholarship_provider, third_party), title, base URL, reliability tier.
- Every verifiable fact-bearing record references `source_id`, `source_url`, `last_verified_at`, `verified_by`, `verification_status`. Field-level sourcing is required for the high-risk fields (fees, deadlines, requirements, visa data, application URLs) via `field_sources` (entity_type, entity_id, field_name, source_id, source_url, verified_at) or equivalent normalized design.
- `verification_records` log every verification event (who, when, outcome, notes, evidence URL, snapshot hash).
- **Display:** `VerificationBadge` + "Source" popover everywhere data appears (list, detail, comparison, AI answers, budget). Estimated data is visually distinct. Expired data shows a warning and is excluded from "Strong" matching.
- **Rules:** no record may be `verified` without a source URL; `Apply Officially` requires a verified URL; visa guides require a government source (section 24).

---

## 37. DATABASE SCHEMA (PostgreSQL)

Use PostgreSQL with Drizzle ORM (preferred; Prisma acceptable if the repo audit favors it). Use UUID v7 (or ULID) primary keys, `timestamptz` for times, `numeric(14,2)` for money plus ISO currency code, enums via lookup tables or PG enums, soft-delete (`deleted_at`) only where needed (documents, applications), `created_at/updated_at` everywhere. Foreign keys with explicit `ON DELETE` behavior. Indexes listed per table. Do not store the platform in giant JSON blobs; JSONB is allowed only for truly schemaless leftovers (raw import payloads, AI tool-call traces, form drafts, UI preferences).

**Identity & access:** `users` (id, email unique citext, email_verified_at, password_hash nullable, status, locale, timezone, created_at, deleted_at), `accounts` (OAuth links), `sessions`, `verification_tokens`, `admin_users` (user_id, role: editor|admin, mfa_enabled), `audit_logs` (actor, action, entity, entity_id, ip_hash, at).

**Profile & academics:** `student_profiles` (user_id unique, display_name, citizenship_country_ids via `profile_citizenships`, residence_country_id, current_education_level, graduation_year, school_name, curriculum_system_id, degree_level_target, budget_amount, budget_currency, budget_period, needs_funding, profile_version int), `profile_target_countries`, `profile_preferred_subjects`, `profile_preferred_careers`, `profile_preferred_universities`, `activities` (profile_id, type enum[extracurricular, leadership, volunteer, project, research, internship, work, award], title, org, role, start/end, description, hours, url), `qualification_systems` (code, name, country scope, kind), `grade_scales` (system_id, kind: ordinal|numeric|percentage|gpa|points, min, max, name), `grade_scale_values` (scale_id, label, rank, numeric_value nullable), `subjects` (system_id, name, code, board), `qualifications` (profile_id, system_id, board, country_id, level, year/session, status: completed|in_progress|predicted|planned), `grades`/`student_subject_results` (qualification_id, subject_id, scale_id, grade_value_id or numeric_value, is_predicted, session, year), `test_types` (code: SAT, ACT, AP, IELTS, TOEFL_IBT, DUOLINGO, PTE, CAMBRIDGE, …, score ranges, sections), `test_scores` (profile_id, test_type_id, taken_on, valid_until, total_score, status), `test_score_sections`, `equivalency_rules` (from_scale_id, from_value, to_scale_id, to_min_value, institution_id nullable, source_id NOT NULL, notes).

**Catalog:** `countries` (iso2, iso3, name, slug, currency, languages, summary fields + `country_facts` rows for cost/visa/lifestyle with source), `cities`, `universities` (slug, name, country_id, city_id, region, website, admissions_url, international_office_*, application_portal_url, accreditation, type, languages, description…), `university_costs` (university_id, kind, amount_min/expected/max, currency, period, applicable_to, source…), `programs` (university_id, slug, name, degree_level, field_id, duration_months, languages, study_mode, intakes, tuition_*, application_fee, application_platform, application_url, description, competitiveness fields with source), `fields_of_study` (taxonomy tree), `career_tags`, `program_career_tags`, `program_requirements`, `program_deadlines` (via `deadlines`), `scholarships` (provider_id, slug, name, type: government|university|external, country_id, university_id nullable, funding_* fields, coverage flags, renewability, fee, opens_on, official_url, application_url, selection_process…), `scholarship_providers`, `scholarship_requirements`, `scholarship_eligibility_rules`, `scholarship_nationalities` (include/exclude), `scholarship_fields`, `scholarship_programs` (links), `opportunities` (type enum, org, country/remote, stipend, duration, eligibility, official_url, …), `opportunity_requirements`, `visa_guides` (citizenship_country_id nullable, destination_country_id, degree_level, visa_type, summary, steps, documents, financial_requirements, insurance, health, biometrics, links, warnings, published_at) with child tables `visa_guide_steps`, `visa_guide_documents`; **all catalog tables carry**: `source_id`, `source_url`, `last_verified_at`, `verification_status`, `verification_notes`, `data_origin` (manual|import|seed), `is_demo`.

**Planning & applications:** `applications` (user_id, kind, program_id/scholarship_id/opportunity_id nullable with a CHECK that exactly one is set unless kind=other, custom_title, status, submitted_on, decision, decision_on, funding_note, scholarship_result, fee_amount/currency/paid), `application_status_history`, `application_tasks`, `application_essays`, `application_recommendations`, `application_documents` (application_id, document_version_id, requirement_label), `documents` (user_id, category, title, expires_on, completion_state, deleted_at), `document_versions` (document_id, version_no, storage_key, mime, size_bytes, sha256, uploaded_at), `deadlines` (user_id nullable = catalog; type; subject FKs with CHECK; due_at, timezone, is_rolling, completed_at; derived_from_deadline_id), `budgets` (user_id, name, program_id nullable, currency, duration_months, scenario_prefs), `budget_items` (budget_id, category, label, amount_min/expected/max, currency, frequency, one_time boolean, source note, is_user_override), `exchange_rates` (base, quote, rate, provider, fetched_at), `saved_items` (user_id, entity_type, entity_id, created_at; unique), `comparisons`, `comparison_items`, `match_results` (user_id, program_id/scholarship_id, tier, payload, profile_version, record_version, computed_at), `next_action_dismissals`.

**Notifications & AI:** `notifications` (user_id, type, entity ref, title, body, dedupe_key unique, read_at, created_at), `notification_preferences`, `chat_sessions` (user_id, mode, title), `chat_messages` (session_id, role, content, tool_calls jsonb, citations jsonb, tokens), `form_drafts` (user_id, form_key, step, data jsonb).

**Governance & ingestion:** `sources`, `field_sources`, `verification_records`, `record_revisions`, `user_reports`, `data_imports` (type, source, status, file_key, started/finished, stats), `data_import_rows` (import_id, row_no, raw jsonb, normalized jsonb, errors jsonb, dedupe_match_id, action), `import_schedules`.

**Required indexes (minimum):** unique slugs; FKs; `(country_id, degree_level)` on programs; `(university_id)` on programs; GIN `tsvector` on names/descriptions for universities, programs, scholarships, opportunities, countries; `pg_trgm` GIN on names; `(due_at)` and `(user_id, due_at)` on deadlines; `(user_id, status)` on applications; `(user_id, entity_type)` on saved_items; partial indexes on `verification_status`; unique `(user_id, program_id, profile_version)` on match_results. Document in `/docs/DB.md` with an ERD (Mermaid).

## 38. API ARCHITECTURE

- Next.js Route Handlers under `/api/v1/*`; thin handlers → **service layer** (`src/server/services`) → **repository layer** (`src/server/db`). Business logic (matching, budget, next-action) lives in pure modules under `src/lib/*` shared with tests.
- Validation: zod schemas for every input/output; shared types. Error format: `{ error: { code, message, fields?, requestId } }` with correct HTTP codes. Pagination: cursor-based for catalog lists (`limit` max 50), offset for admin tables. Sorting/filtering via whitelisted params only.
- Every route declares: auth requirement, role, rate-limit bucket, input schema, output schema. OpenAPI spec generated or hand-maintained in `/docs/api.md`.
- Caching: `Cache-Control`/ISR for public catalog pages, `unstable_cache`/tags for computed public aggregates, per-user caching for dashboard (short TTL, invalidated by mutations).
- Idempotency keys for imports and application creation; request ids in logs; structured logging.
- Never return data the caller doesn't own; every user-owned query is scoped by `user_id` in the repository layer.

## 39. AUTHENTICATION

- Auth.js (NextAuth v5) or Better Auth, whichever the audit shows integrates best; email+password (argon2id) plus Google OAuth; email verification required before saving private data uploads; password reset with single-use short-lived tokens; secure, httpOnly, SameSite=Lax cookie sessions with rotation; session revocation UI ("sign out everywhere"); optional TOTP MFA (required for admin/editor); brute-force protection and lockout/backoff; generic error messages (no account enumeration).
- Authorization: roles `user`, `editor`, `admin`; middleware for coarse route gating plus server-side checks in services; resource-ownership checks are mandatory.
- Anonymous users can browse the public catalog; saving/matching requires an account (local preview of saves may merge into the account at sign-up).

## 40. SECURITY

- Server-side validation everywhere; output encoding; sanitize rich text (allowlist) before storing/rendering; parameterized queries only; CSRF protection for cookie-authenticated mutations; strict CORS; security headers (CSP with nonces, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors); rate limiting per IP and per user (auth, search, AI, uploads, imports) with a durable store (e.g., Upstash Redis or Postgres-based), return 429 with `Retry-After`.
- Secrets only in server env; scan the repo and git history for leaked keys; rotate any key found in the prototype and report it.
- Uploads per section 28; storage in a private bucket; encryption at rest; DB least-privilege roles; PG row-level security where the host supports it as defense in depth.
- AI: prompt-injection mitigations, tool outputs scoped to the caller, no cross-user retrieval.
- Account deletion and data export (section 41). Dependency audit in CI (`npm audit`/Dependabot). Security tests for IDOR on every user-owned route.
- Logging: no PII or document contents in logs; IPs hashed.

## 41. PRIVACY

- Privacy policy and terms pages; consent for email notifications and AI processing; clear statement of which fields are sent to the AI provider.
- **Data export:** `/app/settings/privacy` → "Export my data" generates a ZIP (JSON of profile, qualifications, applications, budgets, chat sessions, notifications + original documents) delivered via a signed, expiring link.
- **Account deletion:** two-step confirmation; immediately disables the account; a job hard-deletes DB rows and bucket objects within a stated window (e.g., 30 days) with a deletion receipt; irreversible after the window. Backups documented.
- Data minimization: collect only what features need; sensitive fields (income, citizenship) optional and explained.
- Under-18 users: show guardian/consent guidance suitable for the target regions (document the decision; do not store a user's minor status as a profile attribute beyond what is needed for the product).

## 42. ACCESSIBILITY

WCAG 2.2 AA target. Semantic HTML landmarks; keyboard operability for every interaction (including kanban, charts' table alternatives, command palette, drag-and-drop alternatives); visible focus (yellow focus ring with sufficient contrast); ARIA only where needed (correct patterns for combobox, dialog, tabs, menu); color contrast checks; no information by color alone (icons + text on tiers/statuses); `prefers-reduced-motion`; form labels, error association (`aria-describedby`), live regions for async results; screen-reader tested flows (profile, search, tracker); touch targets ≥ 44px on mobile; zoom to 200% without loss. Automated axe checks in CI for every route plus manual keyboard pass in the final phase.

## 43. RESPONSIVE DESIGN

Breakpoints: ≥1280 desktop (dense multi-column dashboards, side filter panels), 1024–1279 laptop, 768–1023 tablet (icon rail, drawers), <768 mobile (bottom nav, bottom sheets, card lists). Mobile must NOT shrink desktop tables: every table has a card/list variant with the same actions. Filters → bottom sheet with chips; kanban → grouped list; calendar → agenda; compare → swipeable columns; charts simplify and offer table view. Verify with Playwright at 1440, 1024, 768, 390 widths.

## 44. SEO

- Public pages (`/`, universities, programs, scholarships, opportunities, countries, visa guides): server-rendered, unique `<title>`/meta description templates, canonical URLs, Open Graph/Twitter cards (dynamic OG images optional), JSON-LD structured data (`CollegeOrUniversity`, `EducationalOccupationalProgram`/`Course`, `FAQPage` where genuine, `BreadcrumbList`; scholarship pages use appropriate schema such as `MonetaryGrant`/`Grant`-style markup where valid), clean slug URLs, pagination `rel` handling, `sitemap.xml` (split sitemaps by entity with `lastmod`), `robots.txt` (disallow `/app`, `/admin`, `/api`), `noindex` for thin/duplicate filter combinations, 301s for legacy URLs, hreflang only if localized.
- Never mark up data that isn't visibly on the page; show last-verified date on pages.

## 45. PERFORMANCE

Pagination everywhere; indexed queries (check `EXPLAIN` for hot queries); server-side search/filter; React Server Components for read-heavy pages; code-splitting and dynamic imports for charts/editor/PDF libraries; lazy-load below-the-fold; virtualization for very long lists (admin tables, import row review); `next/image` with remote patterns and sizes; font subsetting; caching strategy per section 38; avoid N+1 queries (verify with query logging); budgets: LCP < 2.5s on mid-range mobile for public pages, JS per route < ~200KB gzip where feasible, API p95 < 300ms for list endpoints at 50k records (test with generated load data in a perf script, never shown to users). Never fetch thousands of records to filter on the client.

## 46. TESTING

- **Unit (Vitest):** matching engine (every tier/status/edge), scholarship eligibility, grade-scale comparison and `not_comparable` paths, budget formulas and rounding, next-action ranking, deadline/timezone math, import validation/dedupe, form engine conditional logic.
- **Integration:** API routes with a test Postgres (testcontainers or a CI service), auth/authorization (including IDOR attempts), uploads (type/size/spoofed MIME), rate limiting, migrations up and down, seed idempotency.
- **E2E (Playwright):** journeys J1–J9 at desktop and mobile; Ctrl+K palette; filter/sort/pagination on each finder; kanban drag + keyboard alternative; document upload/versioning; account export/delete.
- **A11y:** axe on every route; keyboard-only run-through.
- **AI evaluation:** golden-question set (≥ 30) verifying: cites sources, refuses to fabricate, distinguishes verified/estimated/AI, no admission guarantees, resists injection. Run against a mocked provider in CI and a real provider manually.
- **Visual regression** (optional) for the design-system page.
- CI: lint, typecheck, unit, integration, build, E2E smoke, `npm audit`. Coverage targets: ≥ 90% on `src/lib/matching`, `budget`, `grades`; ≥ 70% overall services.

## 47. SEED DATA

- **Structural seed (required, real, no verification needed because it is structural):** countries (ISO), currencies, qualification systems (O Level, IGCSE, GCSE, AS, A Level, IB DP, AP, SAT, ACT, US GPA, percentage, national curricula placeholders), grade scales and values (e.g., A*–U ordinal; IB 1–7; AP 1–5), test types and score ranges (SAT, ACT, IELTS, TOEFL iBT, Duolingo, PTE), degree levels, fields-of-study taxonomy, deadline types, application statuses, notification types, document categories. Verify scale definitions against the publishing bodies' documentation and record the source.
- **Catalog seed policy (strict):** do NOT invent universities, programs, scholarships, fees, deadlines, requirements, visa data or URLs. Allowed: (a) migrating records from the prototype that have a verifiable source, imported as `needs_review`; (b) records you personally verified from official pages during this task, each with `source_url` and `last_verified_at` set to the actual verification date; (c) a clearly labeled **demo dataset** (`is_demo=true`, fictional institution names that cannot be mistaken for real ones, e.g., "Example University") used ONLY in development/test and automatically hidden in production. Provide CSV/JSON import templates so the owner can load verified data.
- Provide `npm run seed:structural`, `npm run seed:demo` (dev/test only), and `npm run seed:import -- <file>`.
- Production must start with honest, possibly sparse catalogs and honest empty states; the UI shows coverage counts.

## 48. ENVIRONMENT VARIABLES (names only; document in `.env.example`)

`DATABASE_URL`, `DATABASE_URL_UNPOOLED` (migrations), `AUTH_SECRET`, `AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `EMAIL_SERVER`/`RESEND_API_KEY`, `EMAIL_FROM`, `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `GEMINI_API_KEY` (or `AI_PROVIDER` + provider key), `AI_MODEL`, `FX_PROVIDER`, `FX_API_KEY`, `RATE_LIMIT_REDIS_URL`/`RATE_LIMIT_REDIS_TOKEN`, `CRON_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `NEXT_PUBLIC_APP_URL` (the only kind of value allowed with `NEXT_PUBLIC_`: non-secret public config), `SENTRY_DSN` (optional). Validate env at boot with zod and fail fast with clear messages.

## 49. DEPLOYMENT

- Vercel for the Next.js app (keep the existing project/domain); managed PostgreSQL (Neon, Supabase or equivalent) with pooled + direct connection strings; S3-compatible private storage (Cloudflare R2, Supabase Storage or S3); Upstash (or equivalent) for rate limiting; transactional email provider; cron via Vercel Cron hitting secured job routes.
- If the audit shows a separate Express server, either fold it into Next.js route handlers (preferred, fixes the earlier ESM/bundling/`__dirname` and `vercel.json` problems at the root) or deploy it explicitly as its own service; record the decision (ADR in `/docs/adr/`).
- Environments: local (Docker Compose Postgres), preview (per-PR with branch database if available), production. Migrations run in CI/deploy step, never at request time. Health endpoint `/api/health`. Error monitoring and basic analytics (privacy-respecting). Backups and restore procedure documented.
- Release checklist in `/docs/RELEASE.md`.

## 50. MIGRATION FROM CURRENT APP

1. Freeze: tag the legacy code (`legacy-v1`) and export all SQLite data to JSON/CSV in `/migration/legacy-export/` (never delete the original).
2. Map each legacy table/file to the new schema in `/docs/MIGRATION.md` (field-level mapping, defaults, transformations, records that cannot be migrated and why).
3. Write idempotent migration scripts; migrated catalog rows become `needs_review` (or `estimated`) unless a verifiable source exists; mock/demo content becomes `is_demo=true`.
4. Any real user data in the prototype (accounts, saved items, notes) is migrated only if present and legitimate; passwords are not migrated unless properly hashed — otherwise users use password reset.
5. Redirect map for every legacy URL to its new route; keep for at least 12 months.
6. Run both versions side by side until the regression checklist (from the audit) passes 100%; then cut over; keep rollback instructions.
7. Record counts before/after per entity; migration report committed to `/docs`.

## 51. PHASED IMPLEMENTATION PLAN

For each phase: **Scope → Deliverables → Checks (lint, typecheck, tests, build, route verification, DB state, regression) → Phase report → Commit.** Do not skip the gate.

- **PHASE 1 — Repository audit + architecture.** Produce `AUDIT.md` (section 2), `ARCHITECTURE.md` (stack decision with ADRs: Next.js App Router consolidation, Postgres + Drizzle, auth lib, storage, AI provider abstraction), `MIGRATION.md` skeleton, regression checklist. No feature code yet except tooling. Gate: audit reviewed against the running app; every nav item and hidden route accounted for.
- **PHASE 2 — Database + authentication.** Docker Compose Postgres, Drizzle config, migrations for identity + governance tables, auth flows (sign up/in/out, verify, reset, OAuth), RBAC, rate limiting, audit log, env validation. Gate: auth E2E, IDOR test scaffold, migrations up/down.
- **PHASE 3 — Design system + app shell.** Tokens, typography, components, states library, shell (desktop/tablet/mobile), command palette scaffold, `/app/_design` page. Gate: axe clean on design page; responsive screenshots.
- **PHASE 4 — Academic profile.** Qualification/grade-scale model, equivalency rules table, profile forms with the dynamic form engine, completeness calculation. Gate: grade comparison unit tests (including `not_comparable`).
- **PHASE 5 — Overview dashboard.** Aggregations, Next Action engine, empty states for each module (catalog may still be sparse). Gate: ranking tests.
- **PHASE 6 — Universities + programs.** Catalog schema/migrations, list/detail pages, filters, search, saved indicator hooks, SEO basics, structural seed + demo seed. Gate: server-side pagination/search verified; `EXPLAIN` on hot queries.
- **PHASE 7 — Scholarships.** Schema, finder, detail, eligibility engine v1, saved, compare hooks. Gate: eligibility unit tests.
- **PHASE 8 — Matching engine.** Requirements model, evaluator, tiers, caching, match pages, "what if". Rebuild "Will I Get In?" on top. Gate: ≥ 90% coverage on engine; no probability language anywhere (grep check).
- **PHASE 9 — Country matcher.** Country facts model, cards, compare, weighted recommendations. Gate: ranking uses only sourced data; missing-data handling tested.
- **PHASE 10 — Budget planner.** Items, scenarios, FX, formulas, exports. Gate: formula tests and rounding.
- **PHASE 11 — Admissions.** Admissions Center pages, Apply Officially gating, plan-from-program. Gate: button gating test.
- **PHASE 12 — Visa.** Guide model, publishing rules, wizard, checklist. Gate: cannot publish without government source (test).
- **PHASE 13 — Applications + deadlines.** Tracker (4 views), tasks/essays/recs, deadlines, reminders data model, ICS export. Gate: kanban keyboard test; timezone tests.
- **PHASE 14 — Documents.** Private storage, upload/versioning/signed URLs, attach to applications, expiry, missing-document warnings, CV Builder export into documents. Gate: security tests (spoofed MIME, IDOR, signed URL expiry).
- **PHASE 15 — Internships/opportunities.** Generic catalog reuse, opportunity types, migrate legacy internships. Gate: shared-module reuse verified; legacy redirect.
- **PHASE 16 — AI advisor.** Provider abstraction, tools, citations, labels, sessions, SOP and mock-interview modes, rate limits, evaluation set. Gate: AI evaluation passes; no key in client bundle (bundle grep).
- **PHASE 17 — Search + compare.** Global search endpoint, command palette, compare pages, saved items complete. Gate: palette keyboard/ARIA test.
- **PHASE 18 — Notifications.** In-app + email, preferences, jobs, dedupe. Gate: scheduler idempotency tests.
- **PHASE 19 — Admin/data management.** Admin CRUD, verification workflow, sources, imports pipeline, user reports. Gate: import validation/dedupe tests; RBAC tests.
- **PHASE 20 — Testing + security + performance.** Close coverage gaps, full E2E suite, security review (headers, CSP, rate limits, secrets scan), performance budgets, a11y pass, SEO validation (sitemap, robots, structured data validators), privacy export/delete flows. Gate: CI green.
- **PHASE 21 — Final UX polish.** Motion, copy, empty states, consistency pass, mobile pass, remove dead code/legacy, documentation, release checklist. Gate: section 53 checklist 100%.

## 52. DEFINITION OF DONE

The work is done only when ALL of the following are true: every item in sections 3–5 is delivered per its verdict; every route in section 10 loads without console errors; all user journeys J1–J9 pass in E2E at desktop and mobile; `lint`, `typecheck`, unit, integration, E2E and production `build` all pass; database migrations apply from scratch and from the migrated legacy data; no secrets in the client bundle or repo; every private resource enforces ownership; every catalog record shown to users displays source/verification state; no fabricated data exists in production seeds; no admission-probability language exists; accessibility checks pass; responsive layouts verified at 1440/1024/768/390; documentation (`AUDIT`, `ARCHITECTURE`, `DB`, `api`, `MIGRATION`, `RELEASE`, phase reports) is complete and accurate; legacy features are accounted for with no silent loss.

## 53. FINAL VALIDATION CHECKLIST

Tick each item with evidence (command output, screenshot path or test name) in `/docs/FINAL_VALIDATION.md`.

- [ ] Audit inventory complete; every legacy feature has a verdict and a passing regression check
- [ ] Legacy URL redirects verified
- [ ] Migrations: fresh DB, migrated DB, rollback tested
- [ ] Auth: sign up/in/out, verify, reset, OAuth, session revocation, MFA for admin
- [ ] Authorization: IDOR tests for every user-owned route; admin routes server-gated
- [ ] Overview: Next Action correct for 6 scenarios (new user, incomplete profile, overdue, near deadline, missing docs, all clear)
- [ ] Analytics: every widget has a decision hook; no chart without real data
- [ ] Profile: all qualification systems enterable; no cross-scale conversion without a sourced rule
- [ ] Scholarship Finder: all filters/sorts/pagination server-side; eligibility reasons correct
- [ ] Opportunities: shares architecture; all types searchable
- [ ] Universities/Programs: search, filters, detail tabs, SEO tags, structured data valid
- [ ] Matching: all five tiers produced by fixtures; reasons shown; warnings separated; trust caps work
- [ ] Country Matcher: weights, breakdown, missing-data indicators
- [ ] Budget: formulas match spec; scenarios; FX rate/date visible; export
- [ ] Visa: government-source rule enforced; disclaimer and last-verified shown
- [ ] Admissions: Apply Officially gated by verified URL
- [ ] Tracker: statuses, history, four views, tasks, essays, recs; keyboard-accessible kanban
- [ ] Deadlines: timezone correct, reminders created once, ICS valid
- [ ] Documents: private, signed URLs short-lived, versions, expiry, missing warnings
- [ ] CV Builder: pulls profile data, versioned export in Document Center
- [ ] AI Advisor: tool-grounded, cites sources, labels data, refuses to fabricate, injection tests pass, key never in client
- [ ] Search/Ctrl+K: grouped, keyboard, ARIA, rate-limited
- [ ] Compare and Saved: 4-item compare for all entity types; saved sync
- [ ] Notifications: in-app/email, preferences honored, no duplicates
- [ ] Admin: CRUD, verification workflow, imports with error report and dedupe, user reports
- [ ] Privacy: data export ZIP works; account deletion removes DB rows and files
- [ ] Security: headers/CSP, rate limits, upload validation, secrets scan, dependency audit clean
- [ ] Accessibility: axe clean on all routes; keyboard-only completion of core journeys; reduced motion honored
- [ ] Responsive: no horizontal scroll at 390px; tables have mobile variants
- [ ] Performance: budgets met; no unbounded fetches (grep + network checks)
- [ ] SEO: sitemap, robots, canonicals, OG, structured data validated
- [ ] Data trust: grep proves no demo data in production; every catalog record has source fields; no "will be accepted" copy
- [ ] CI green on lint, typecheck, tests, build
- [ ] Documentation complete; release checklist ready

**START NOW with PHASE 1. Do not write feature code until `AUDIT.md` and `ARCHITECTURE.md` are complete and committed.**
