# 🤖 ScholarPath Intelligent Auto-Update System

This system automates the weekly synchronization and expansion of the ScholarPath global database. It imports new official country indicators, budgets, scholarship rules, and student employment laws without overwriting manually corrected entries.

---

## 🧭 Core Directives (Data Safety Architecture)

- **Preserve Manually Verified Entries**: Any record possessing `"userVerified": true` is **never** overridden. It is treated as local ground-truth.
- **Merge-Only Semantics**: Missing countries or categories are appended to existing datasets rather than regenerating the database from scratch.
- **Traceability Stamp**: Every modified or added record receives a `"lastVerified": "YYYY-MM-DD"` and a `"source": "official" | "third-party"` descriptor tag for full telemetry auditing.

---

## 🛠️ Components

### 1. Verification Script (`scripts/updateData.cjs`)
A headless Node.js runner that:
- Reads `public/data/universities.json`, `public/data/cost_of_living.json`, and `public/data/scholarships.json`.
- Identifies and appends missing real institutions and cost of living metrics to ensure all **60 targeted countries** remain fully operational.
- Automatically handles the initialization and updates of `public/data/jobs.json` to configure part-time student employment parameters globally.

### 2. GitHub Actions Automation (`.github/workflows/auto-update.yml`)
Runs headless execution on a weekly schedule.
- **Trigger Schedule**: Every Sunday at midnight UTC (`0 0 * * 0`).
- **Manual Dispatch**: Can be run on-demand directly from the GitHub Actions tab.
- **Workflow Pipeline**:
  1. Spins up an `ubuntu-latest` runner.
  2. Pulls repository code.
  3. Installs dependencies securely.
  4. Runs `node scripts/updateData.cjs`.
  5. Commits and pushes back changes if data updates are detected.

---

## 🚀 Manual Execution & Testing

To test the sync or execute the expansion manually:

```bash
# Run the expansion script directly in the terminal
node scripts/updateData.cjs
```
