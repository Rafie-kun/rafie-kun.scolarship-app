# Somnia

> A quiet workspace for the long, strange trip from "maybe I could study abroad" to "I actually did."

Somnia is an open-source companion for international students. It brings scholarships,
university research, budgets, visa notes, document drafts and application deadlines into
one calm, dreamlike interface. It is built to feel like a late-night study room, not a
growth-hacked dashboard.

Live (legacy app): <https://rafie-kun-scolarship-app.vercel.app>

---

## What is inside

**Discover**
- Scholarship finder with eligibility badges, funding, deadlines and official links
- Internship and part-time job finder
- University directory with tuition, rank, acceptance rate, housing and student reviews
- "Will I get in?" estimate wizard and a 5-question country matcher

**Plan**
- Budget planner with 15 currencies (tuition + living + visa + flights − funding)
- Visa guides, mock visa interview and a pre-departure checklist
- IELTS/TOEFL practice drill and academic roadmap

**Apply**
- Application tracker (Saved → In Progress → Submitted → Accepted → Won)
- Deadline calendar with `.ics` and Google Calendar export
- SOP review, CV builder, document export centre and mentor/community boards

**Platform**
- Installable PWA with offline caching
- Local-first state, optional Postgres sync
- One original, hand-built dreamscape theme

---

## Tech stack

| Layer | Tools |
| --- | --- |
| Legacy SPA | React 19, TypeScript, Vite 6, Tailwind v4, `motion`, `recharts` |
| Legacy API | Express 4, Drizzle ORM, Postgres (`better-sqlite3` fallback) |
| Next app | Next.js App Router, Postgres, Drizzle |
| AI helpers | `@google/genai` (optional; the app works without a key) |
| Tests / checks | `tsc --noEmit`, Vite build, Next build |

The repository currently contains both apps:

- `src/` + `server.ts` — the legacy Vite/Express app (still the deployed one)
- `src/app/` — the Next.js catalog app, run separately with `npm run dev:next`

---

## Quick start

### 1. Install

```bash
npm install
cp .env.example .env
```

Fill in at least `DATABASE_URL` and `JWT_SECRET`. AI features are optional; leave
`GEMINI_API_KEY` empty if you do not want them.

### 2. Run the legacy app

```bash
npm run dev          # http://localhost:3000
```

### 3. Run the Next.js catalog app

```bash
npm run dev:next     # http://localhost:3000 (stop the legacy server first)
```

### 4. Useful checks

```bash
npm run lint         # TypeScript check
npm run build        # Vite + server bundle
npm run build:next   # Next.js production build
```

Local Postgres (optional, for the Next app):

```bash
docker compose up -d scholarpath_db
npx drizzle-kit migrate
npm run sync:catalog
```

---

## Project map

```text
src/
  components/        Feature views (scholarships, budget, profile, …)
  context/           Auth, theme, language and app-wide state
  services/          Catalog, tour and mock-data helpers
  app/               Next.js catalog app (separate entry point)
  omori-theme.css    Dreamscape theme layer (imported after index.css)
  App.tsx            Legacy shell: header, sidebar, routing
server.ts            Express API for the legacy app
routes/              API route modules
db/                  Drizzle schema and queries
scripts/             Catalog sync, scrapers, data copy helpers
docs/                Architecture, migration and phase notes
```

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/THEMING.md`](docs/THEMING.md).

---

## Contributing

Contributions are genuinely welcome — code, data corrections, accessibility fixes,
translations, theme polish and documentation all count.

1. Read [`CONTRIBUTING.md`](CONTRIBUTING.md).
2. Pick an issue or open one using the templates in `.github/ISSUE_TEMPLATE/`.
3. Create a small, focused branch.
4. Run `npm run lint` and the relevant build before opening a PR.
5. Describe what changed and how you tested it.

By participating you agree to our
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

Good first issues are labelled `good first issue`. If you are unsure where to start,
open a discussion or comment on an issue — no question is too small.

### Data contributions

Somnia cares about trustworthy data. If you add or correct a scholarship, university or
visa rule, link the official source in your PR. Do not invent deadlines, fees or
requirements. When a fact is unverified, mark it as such instead of guessing.

### A note on the name

The product is **Somnia**. Some internal identifiers still use the old `scholarpath_*`
prefix (local storage keys, database name, API paths). They are kept on purpose so
existing accounts and saved progress do not break. Do not rename them without a
migration plan.

---

## Theme and design

The interface is an original, OMORI-inspired "dreamscape": flat pastel panels, crisp
outlines, pixel display type, black-space backgrounds and lavender/mint/gold accents.
No game assets are used or copied. See [`docs/THEMING.md`](docs/THEMING.md) for the
palette, class conventions and how to add a new view without breaking contrast.

---

## Deployment

- **Docker:** `docker compose up --build`
- **Render / Railway:** build `npm ci && npm run build`, start `node dist/server.cjs`
- **Vercel:** `vercel.json` deploys the legacy app; `vercel.next.json` is reserved for the
  Next app and is not cut over yet

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for environment variables and persistence notes.

---

## License

MIT — see [`LICENSE`](LICENSE). Please do not add third-party game assets, fonts or UI
that you do not have the right to redistribute.
