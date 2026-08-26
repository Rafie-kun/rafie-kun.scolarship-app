# ScholarPath - Complete User & Developer Guide

ScholarPath is an AI-powered scholarship, university, internship and visa planning platform for international students, styled with an official Minecraft-inspired night theme.

---

## Features

### For Students
- **Academic Profile Builder** - Enter your curriculum (O/A Levels, IB, AP, CBSE...), subjects and grades; GPA is calculated automatically.
- **Will I Get In? wizard** - Enter your grades and goals, see universities grouped into Likely Admit / Good Match / Reach with % estimates and improvement tips.
- **Scholarship Finder** - Hundreds of scholarships with official apply links, funding coverage, deadlines, GPA matching, plus live freshness status ("auto-updates hourly").
- **Internship & Part-Time Job Finder** - Paid internships, research positions and part-time student jobs with stipends shown in your currency.
- **University Directory** - Search by country/tuition/rank with detail cards: official website + application links, admitted GPA, acceptance rate, dorm vs private living costs.
- **Budget Planner** - Country-level costs (rent, food, transport, insurance), part-time income simulation with local tax rules.
- **Visa Guide** - Destination guides with fees, proof-of-funds thresholds, work rights, post-study permits, your citizenship noted in a step-by-step timeline.
- **AI Advisor (Wise Librarian)** - Academic-only assistant: admissions, motivation letters, credit transfer (ECTS), bachelor-to-master pathways, scholarships, visas.
- **Document Center** - Upload your CV as PDF: real text extraction + AI summary and structured parsing.
- **CV Builder & Export Center** - Build an admissions-ready CV; export data to PDF/DOCX/JSON/Markdown.
- **Community Forum** - Student-run Q&A threads.
- **Currency switcher** - Every amount app-wide converts instantly (15 currencies).
- **XP & levels** - Earn XP for tracking scholarships, completing checklist steps, interviews and more.

### Accounts & Security
- Free accounts with bcrypt-hashed passwords and HttpOnly session cookies.
- Profiles are private: every API route reads the username from the signed session token only - users can never read or edit another user's data.
- XP rewards are validated server-side (capped per action); profile updates are field-whitelisted.

---

## Getting Started

1. `cp .env.example .env` and fill in:
   - `GEMINI_API_KEY` (required for AI features) - free at aistudio.google.com
   - `JWT_SECRET` (required in production) - generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ADMIN_TOKEN` (optional), `GEMINI_MODEL` (optional, default gemini-3.6-flash)
2. `npm install`
3. `npm run dev` -> http://localhost:3000
4. Register a free account or click **Try the Demo** (guided tour included).

### Feature cheat-sheet
| Where | What it does |
|---|---|
| Will I Get In? | Grades -> chances -> how to improve |
| Scholarships | Filter/search, track to your ledger, auto-updating |
| Internships | Paid/research/part-time listings, auto-updating |
| Universities | Compare, open official site / apply portal, living costs |
| Budget Planner | Can I afford country X? (with part-time income) |
| Visa Guide | Pick destination -> fees, funds, work rights, step-by-step plan |
| AI Chat | Academic questions only - letters, credits, transfers, visas |
| Profile | Upload CV PDF -> AI summary; edit all academic details |

---

## Developer Guide

### Stack
React 19 + TypeScript + Vite + Tailwind v4 frontend; Express + better-sqlite3 backend; Google Gemini AI; node-cron scrapers.

### Data pipeline (always auto-updating)
- On server boot and every hour (`0 * * * *`) the scheduler scrapes:
  - Scholarships (RSS + web sources -> `public/data/scholarships.json`, deduped)
  - Internships & part-time student jobs (RSS -> `public/data/internships.json`, deduped)
  - Universities (web source -> SQLite)
- A weekly GitHub Action (`.github/workflows/auto-update.yml`) also refreshes datasets and commits them.
- Manual trigger anytime: `POST /api/scraper/trigger` (auth) or the "Check for new listings" buttons in the UI.

### Scripts
- `npm run dev` - full-stack hot reload on :3000
- `npm run build` - production build (frontend -> `dist/`, server bundled to `dist/server.cjs`)
- `npm run lint` - TypeScript strict check
- `npm start` - run the built server

### Deployment
See DEPLOYMENT.md. Docker: `docker compose up --build`. Render/Railway: build `npm ci && npm run build`, start `node dist/server.cjs`. Note: serverless platforms (Vercel) serve the UI fine but cannot persist the SQLite database - use a persistent host for real accounts.

---

## Troubleshooting
| Issue | Fix |
|---|---|
| AI answers "offline mode" | Set `GEMINI_API_KEY` (server) or paste a personal key in Settings. |
| Sessions log out on restart | Dev-only behavior when `JWT_SECRET` is unset. |
| Scraper finds nothing | Sources are RSS-based; check network egress from your host. |
| XP bar looks stuck | Progress = points within current level (100 XP per level). |
