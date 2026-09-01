# ScholarPath 🎓 — Scholarship, University & Internship Finder for International Students

ScholarPath is an **AI-powered, Minecraft-inspired** platform that helps international students discover **scholarships, universities, internships and part-time jobs**, check eligibility, plan budgets, prepare visas, and track applications — all in one dark night-mode workspace.

Live: `https://rafie-kun-scolarship-app.vercel.app` (Vercel) — for persistent accounts use Docker/Render (see Deployment).

---

## Features

**Find your path**
- **Scholarship Finder** — hundreds of scholarships with eligibility badges (GPA / country / degree), funding, deadlines, official apply links, Reddit discussion links, auto-updates hourly
- **Internship & Part-Time Job Finder** — paid internships, research positions and student jobs, with stipends shown in your selected currency, auto-updated via RSS
- **University Directory** — search by country/tuition/rank, detail cards show official website + apply portal, admitted GPA, acceptance rate, **dorm vs private living costs** + **housing board**, student reviews
- **Will I Get In? wizard** — enter grades (4.0/5.0/percentage) + goals → see universities grouped into Likely Admit / Good Match / Reach with % estimates + personalized improvement tips
- **Country Matcher Quiz** — 5 questions → ranked countries with living costs and visa info

**Plan & prepare**
- **Budget Planner** — tuition + living costs + visa + flight − scholarship − part-time income = your real number, in 15 currencies
- **Visa Guide** — destination guides (fees, proof-of-funds, work rights, post-study permits) with citizenship selector + step-by-step timeline; includes **Mock Visa Interview** (AI-scored, country-specific)
- **IELTS/TOEFL Drill** — 10-min practice test with band estimate
- **Pre-Departure Checklist** — per-country tasks (passport → flight) with local progress + **Flight Price Watcher** (cheapest months to fly)
- **Success Stories Wall** — verified winners share GPA + essay tips

**Apply & track**
- **Applications Kanban** — drag cards between Saved / In Progress / Submitted / Accepted / Won (persists via `POST /api/applications`)
- **Master Document Checklist** — deduplicated across all tracked apps + per-country templates (e.g., Germany blocked account)
- **Deadlines Calendar** — list + month-grid view, `Download .ICS` and per-item `Add to Google Calendar`
- **Study Groups** — see how many others track the same scholarship, Join creates a community post
- **Document Center** — paste SOP → AI review + **Plagiarism / AI pattern check**; upload CV PDF → real text extraction + 3-bullet summary
- **CV Builder & Export Center**, **Community Forum**, **Professor Finder** (per-university, keyword search via Gemini)

**Platform**
- **AI Advisor (Wise Librarian)** — strictly academic-only (admissions, letters, ECTS transfer, bachelor→master pathways, visas)
- **Eligibility auto-checker** on every scholarship card
- **PWA** — installable, offline shell cache, 14-day deadline push via Notification API
- **Dark Minecraft night theme** — real game textures (`deepslate.png`, `stone.png`, `oak_planks.png`, `dirt.png`) via `public/textures/`

---

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite 6, Tailwind v4 (`@tailwindcss/vite`), `motion`, `recharts`, `react-markdown`
- **Backend**: Express 4 + `better-sqlite3` (file DB, `/tmp` on Vercel) + optional `@libsql/client` for Turso persistence, `pdf-parse` (lazy-loaded), `web-push` for PWA push, `node-cron` schedulers
- **AI**: `@google/genai` via shared `GEMINI_MODEL` env var (default `gemini-3.6-flash`)
- **Build**: `vite build` + `esbuild` bundle to `dist/server.cjs` + `scripts/copy-data.js`

---

## Quick Start

```bash
cp .env.example .env   # fill GEMINI_API_KEY, JWT_SECRET (32+ hex chars), optional ADMIN_TOKEN, GEMINI_MODEL, VAPID keys, TURSO_*
npm install
npm run dev            # http://localhost:3000
# or production:
npm run build && NODE_ENV=production JWT_SECRET=... node dist/server.cjs
```

Test each feature per `future.md` "How to test each locally" section.

---

## Deployment

- **Docker (recommended for persistent DB):** `docker compose up --build` (set env in `.env` or compose)
- **Render/Railway:** Build `npm ci && npm run build`, Start `node dist/server.cjs`, set env vars
- **Vercel:** Works for UI + ephemeral DB (`persistence: ephemeral-tmp` in `/api/health`); for true persistence set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`

See `DEPLOYMENT.md` and `Guide.md` for details. Auto-update runs hourly + on-boot + weekly GitHub Action (`auto-update.yml`).

---

## Security

- User-isolated: every private route reads `username` from verified JWT only
- Profile updates field-whitelisted, XP capped server-side (≤100/action)
- PDF uploads limited to ~7MB, resume text extracted server-side, never overwrites name/major/GPA with hallucinated data
- Security headers via `vercel.json` + Express middleware
