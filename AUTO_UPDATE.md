# 🔄 ScholarPath Auto-Update System

ScholarPath keeps **scholarships, internships + part-time jobs, universities, cost-of-living, exchange rates, and visa data** fresh automatically.

- **Hourly + on-boot scraper** (`scripts/scheduler.ts` cron `0 * * * *`): RSS + direct DAAD scrape for scholarships, RSS for internships/part-time, web source for universities. Results are deduped and merged into `public/data/*.json` (scholarships/internships) or SQLite (universities). Manual trigger: `POST /api/scraper/trigger` (auth) or the "Check for new listings" buttons in the Scholarships/Internships headers.
- **Weekly GitHub Action** (`.github/workflows/auto-update.yml`): Runs `node scripts/updateData.js` every Sunday at midnight UTC, commits new/updated entries. Preserves any entry with `"userVerified": true`.
- **Exchange rates**: `scripts/updateExchangeRates.js` fetches live rates (BDT, INR, etc.) daily; fallback to `DEFAULT_RATES` in `ThemeContext` when offline.

Run manually at any time:

```bash
node scripts/updateData.js          # merge all datasets
node scripts/scheduler.ts           # run one scraper cycle (requires server env)
# or trigger full dataset re-seeding:
node scripts/seedAll.js
```
