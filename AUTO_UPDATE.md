# 🚀 ScholarPath: Dynamic Scribe Database Auto-Update System

This documentation outlines the automated database verification and exchange rate updating system configured for ScholarPath. 

---

## 📅 System Overview

ScholarPath maintains dynamic, real-world datasets in the `public/data/` directory to ensure high-fidelity admissions calculations, accurate costs, and live conversion rates. These files are updated automatically using a weekly scheduled GitHub Actions workflow.

### 🗄️ Managed Data Files
1. `universities.json`: List of accredited international universities, target competitive boundaries, and web domains.
2. `scholarships.json`: Fully funded international fellowship programs, eligibility parameters, and application urls.
3. `cost_of_living.json`: Average rent, food, transport, and insurance premiums for student-friendly urban centers.
4. `student_jobs.json`: Common on-campus/off-campus gigs, average hourly wages, and legal work-hour limits.
5. `tax_rules.json`: Yearly tax-free allowances, base progressive tax rates, and student tax credit structures.
6. `exchange_rates.json`: Dynamic currency exchange multiplier values against USD base.

---

## 🌐 Selected Trustworthy Data Sources

Our data synchronizers consolidate information from the following reputable repositories and official API portals:

1. **Exchange Rate API** ([open.er-api.com](https://open.er-api.com/v6/latest/USD)): Real-time global currency valuations updated daily.
2. **DAAD German Academic Exchange Database** ([daad.de](https://www.daad.de/en/)): Authoritative information on scholarships and living costs in Germany.
3. **Chevening Fellowships Portal** ([chevening.org](https://www.chevening.org/)): UK Foreign Office official guidelines for global scholars.
4. **Fulbright Program Directory** ([foreign.fulbrightprogram.org](https://foreign.fulbrightprogram.org/)): Standardized US State Department educational requirements and student aids.
5. **OECD Tax Databases & National Stat Authorities**: Aggregated estimates for tax exemptions, progressive brackets, and weekly work ceilings.

---

## 🛠️ How to Run the Sync Scripts Manually

If you need to force-synchronize datasets immediately in your local or server runtime, execute these commands in your shell terminal:

```bash
# 1. Update all general databases (Universities, Fellowships, Cost of Living, Jobs, Taxes)
node scripts/updateData.js

# 2. Sync currency exchange rate conversions against live market api
node scripts/updateExchangeRates.js
```

---

## 📥 How to Add New Data Sources

To integrate additional APIs or RSS feeds into the auto-update pipeline, follow these steps:

1. **Locate the Script**: Open `scripts/updateData.js`.
2. **Define the Fetch Handler**: Create a helper function inside the script to query your new target API (e.g. `async function fetchNumbeoLgCost()`).
3. **Handle Errors and Fallbacks**: Always add `try-catch` wrappers and fallbacks so that if the third-party endpoint goes offline, the local database remains healthy.
4. **Merge Entries**: Compare the records using a unique field (like `id` or `name`). Do not duplicate records.
5. **Preserve User Verified Data**: 
   ```js
   if (existingRecord.userVerified) {
     // Skip overwriting this item or preserve specific user-defined metrics!
   }
   ```

---

## 🔄 Rolling Back Changes

If the automated runner updates a dataset with unexpected values, you can roll back easily:

1. Check the Git logs to locate the previous commit:
   ```bash
   git log --oneline
   ```
2. Revert the file to its previous state:
   ```bash
   git checkout HEAD~1 -- public/data/
   ```
3. Commit the reverted database state:
   ```bash
   git commit -m "revert(data): rolling back dataset to previous stable version"
   git push origin main
   ```

---

## 🤝 Handling Merge Conflicts

If you make manual edits to a JSON file while the background Actions runner is committing updates:

1. Pull the remote modifications and rebase your commits:
   ```bash
   git pull origin main --rebase
   ```
2. If there are conflicts inside the JSON arrays, choose the remote version if you want to keep the auto-updated metrics, or choose your local version to preserve your custom manual configurations.
3. Verify JSON syntax correctness before pushing to avoid breaking the application:
   ```bash
   npm run lint
   ```
