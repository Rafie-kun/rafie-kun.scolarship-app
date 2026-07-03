# ScholarPath Auto-Update System

The auto-update system ensures that scholarship data, university rankings, and employment guidelines stay current without manual intervention.

## Components
1. **GitHub Actions Workflow** (`.github/workflows/auto-update.yml`): Runs weekly to fetch new data.
2. **Update Script** (`scripts/updateData.js`): Deep-merges new data, validates URLs, and preserves `userVerified` flags.
3. **Data Files**: 
   - `public/data/jobs.json`

## Manual Run
To run the update script manually:
```bash
node scripts/updateData.js
```

## Rollback Procedures
Since updates are committed to the repository, you can rollback by reverting the auto-update commit in git.
