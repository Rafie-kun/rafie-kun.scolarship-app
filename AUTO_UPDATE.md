# 🔄 ScholarPath Auto-Update System

ScholarPath includes an automated data sync and update pipeline.

## Features

- **Automated Scraping & Deep Merging**: Scrapes updated university rankings, scholarship deadlines, and exchange rates.
- **User Verification Preservation**: Preserves user-verified and manually corrected records while updating outdated data.
- **GitHub Actions Integration**: Runs on schedule every Sunday at midnight UTC or on manual dispatch.

## Usage

Run manually at any time:

```bash
node scripts/updateData.js
```

Or trigger full dataset re-seeding:

```bash
node scripts/seedAll.js
```
