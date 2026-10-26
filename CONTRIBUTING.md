# Contributing to Somnia

Thanks for being here. Somnia is a small, volunteer-run project and every useful
contribution matters — a bug report with a clear reproduction is as valuable as a
feature PR.

This guide covers the basics. If something is unclear, open an issue and ask.

---

## Before you start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md).
- Check existing issues and pull requests so we do not duplicate work.
- For anything larger than a typo or small fix, open an issue first so we can agree on
  the approach before you spend time building it.

---

## Local setup

```bash
git clone https://github.com/Rafie-kun/rafie-kun.scolarship-app.git
cd rafie-kun.scolarship-app
npm install
cp .env.example .env
```

Fill in `DATABASE_URL` and `JWT_SECRET` in `.env`. Everything else is optional.

```bash
npm run dev          # legacy Vite + Express app, http://localhost:3000
npm run dev:next     # Next.js catalog app (stop the other server first)
npm run lint         # TypeScript check across the repo
npm run build        # Vite + server bundle
npm run build:next   # Next.js production build
```

Local Postgres for the Next app:

```bash
docker compose up -d scholarpath_db
npx drizzle-kit migrate
npm run sync:catalog
```

> The database name `scholarpath_db` and the `scholarpath_*` storage keys are kept for
> backwards compatibility. Please do not rename them without a migration plan.

---

## How the code is organised

| Path | What lives there |
| --- | --- |
| `src/components/` | Feature views. Most UI work happens here. |
| `src/context/` | Auth, theme, language, app-wide state |
| `src/services/` | Catalog, tour and mock-data helpers |
| `src/app/` | Next.js catalog app (separate from the legacy SPA) |
| `src/omori-theme.css` | The dreamscape theme layer |
| `server.ts`, `routes/` | Express API for the legacy app |
| `db/` | Drizzle schema and queries |
| `scripts/` | Catalog sync, scrapers and data copy helpers |
| `docs/` | Architecture, theming, migration and phase notes |

Two entry points share one repository. Keep changes scoped to the app you are touching
unless the change is intentionally shared.

---

## Design rules

Somnia has one visual language: flat pastel panels, crisp dark outlines, pixel display
type and lots of quiet space.

- **Prefer CSS over new JavaScript** for visual changes.
- Add theme overrides in `src/omori-theme.css` or `src/app/globals.css`; do not sprinkle
  new hex values through components.
- Use the palette tokens (`--omori-lav`, `--omori-mint`, `--omori-gold`, `--omori-coral`,
  `--omori-panel`, `--omori-line`, `--omori-white`).
- Check text contrast on dark panels, especially when touching old `text-stone-*` or
  arbitrary `bg-[#...]` classes.
- No copyrighted game assets, fonts or copied UI. Inspiration is fine; copying is not.
- Test at mobile width and with `prefers-reduced-motion` enabled.

See [docs/THEMING.md](docs/THEMING.md) for the full palette and class conventions.

---

## Data rules

Somnia deals with money, deadlines and visa rules, so data trust comes first.

- Link the official source for every new or corrected record.
- Never invent a deadline, fee, requirement, tuition figure or application URL.
- If a value cannot be verified, leave it empty or mark it `estimated` / `needs_review`.
- Do not overwrite human-verified records during a catalog sync.

An honest empty state is always better than a plausible-looking fake.

---

## Making a change

1. Create a branch: `git checkout -b fix/short-description` or `feat/short-description`.
2. Keep the diff focused. Unrelated refactors belong in a separate PR.
3. Match the surrounding style. Do not reformat whole files.
4. Add or update comments only where the code is not self-explanatory.
5. Run the checks that apply:
   ```bash
   npm run lint
   npm run build        # if you touched the legacy app
   npm run build:next   # if you touched src/app/
   ```
6. If you changed behaviour, describe how you verified it (screenshots, steps, or a
   short test note).

### Commit messages

Use a short, plain prefix:

```text
fix: keep profile headings readable on dark panels
feat: add scholarship deadline reminders
docs: explain local Postgres setup
chore: bump catalog data
```

### Pull requests

- Fill in the pull request template.
- Link the issue it closes, if any.
- Keep it reviewable. Small PRs get merged faster.
- Be patient and kind in review. Maintainers are volunteers.

---

## Reporting bugs

Use the bug report template. Include:

- what you expected and what happened
- steps to reproduce
- browser, OS and whether you used the legacy app or the Next app
- screenshots or console output when relevant

Please remove personal data, tokens and `.env` values before posting.

## Suggesting features

Use the feature request template. Explain the problem first, then the proposed solution.
"It would be nice if…" is a perfectly good start.

---

## Good first issues

Look for issues labelled `good first issue` or `documentation`. If you want to help but
do not know where to begin, comment on an issue and we will point you at something.

Thank you for making Somnia a little better.
