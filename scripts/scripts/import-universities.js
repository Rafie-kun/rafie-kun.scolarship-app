import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Helper function to resolve absolute DB path
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.db');
const db = new Database(dbPath);

/**
 * Probes a candidate URL with a short timeout to check if it's alive (not 404).
 */
async function probeUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second fast timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    clearTimeout(timeoutId);

    if (response.status < 400) {
      return true;
    }
  } catch (e) {
    // Fail silently, fetch error or abort
  }
  return false;
}

/**
 * Main function to import universities from Hipo registry
 */
export async function runImport() {
  console.log('[Import Triggered] Fetching data from Hipo world universities list...');
  
  const url = 'https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json';
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch university datasets: status ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`[Import] Retrieved ${data.length} university records from the GitHub source dataset.`);
  
  // Setup tables if they do not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      country TEXT NOT NULL,
      ranking INTEGER DEFAULT 9999,
      acceptanceRate TEXT DEFAULT 'N/A',
      averageGpa REAL DEFAULT 3.0,
      popularMajors TEXT DEFAULT '[]',
      type TEXT DEFAULT 'public',
      tuitionMin REAL DEFAULT 0,
      tuitionMax REAL DEFAULT 0,
      offeredScholarships TEXT DEFAULT '[]',
      city TEXT DEFAULT 'N/A',
      hasOnCampusHousing INTEGER DEFAULT 0,
      website TEXT,
      applicationUrl TEXT,
      domain TEXT DEFAULT NULL,
      generatedApplicationUrl TEXT DEFAULT NULL
    )
  `);

  const insertUni = db.prepare(`
    INSERT INTO universities (
      id, name, country, website, applicationUrl, domain, generatedApplicationUrl
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(name) DO UPDATE SET
      website = COALESCE(excluded.website, universities.website),
      applicationUrl = COALESCE(excluded.applicationUrl, universities.applicationUrl),
      domain = COALESCE(excluded.domain, universities.domain),
      generatedApplicationUrl = COALESCE(excluded.generatedApplicationUrl, universities.generatedApplicationUrl)
  `);

  let count = 0;
  // Let's optimize performance by doing chunked insertion, probe first 150 live URLs to save time or run general heuristics
  const batchSize = 1000;
  
  console.log('[Import] Beginning processing and streaming into SQLite database...');

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const name = item.name;
    const country = item.country;
    const domain = item.domains && item.domains[0] ? item.domains[0] : '';
    
    if (!name || !country) continue;
    
    // Construct standard website link
    let website = item.web_pages && item.web_pages[0] ? item.web_pages[0] : '';
    if (!website && domain) {
      website = `https://www.${domain}`;
    }
    
    if (!website) {
      website = '#';
    }

    // Heuristically construct candidate application URLs
    let applicationUrl = website;
    if (website && website !== '#') {
      const cleanWeb = website.endsWith('/') ? website.slice(0, -1) : website;
      
      // Candidate options
      const applyCandidate = `${cleanWeb}/apply`;
      const admissionsCandidate = `${cleanWeb}/admissions/apply`;
      
      // Probing is expensive for 10,000+ entries on a single endpoint execution,
      // so we use Admissions candidates heuristically and fallback gracefully in the UI.
      // However, we can probe the first 30 entries as a sanity check, and use admissions/apply for standard US/UK.
      if (i < 30) {
        const isApplyOk = await probeUrl(applyCandidate);
        if (isApplyOk) {
          applicationUrl = applyCandidate;
        } else {
          const isAdmissionsOk = await probeUrl(admissionsCandidate);
          applicationUrl = isAdmissionsOk ? admissionsCandidate : website;
        }
      } else {
        // Apply candidates heuristically
        if (country.toLowerCase() === 'united states' || country.toLowerCase() === 'united kingdom' || country.toLowerCase() === 'canada') {
          applicationUrl = `${cleanWeb}/apply`;
        } else {
          applicationUrl = `${cleanWeb}/admissions`;
        }
      }
    }

    const id = 'uni-hipo-' + i.toString().padStart(5, '0');
    
    try {
      insertUni.run(
        id,
        name,
        country,
        website,
        applicationUrl,
        domain || null,
        applicationUrl // generatedApplicationUrl
      );
      count++;
    } catch (e) {
      // Name collision or SQL issues
    }

    if (count % batchSize === 0) {
      console.log(`[Import Status] Inserted/aligned ${count} university files inside SQLite.`);
    }
  }

  console.log(`[Import Success] Completed DB seeding! ${count} university profiles have been loaded.`);
  return count;
}

// Allow direct CLI execution: node scripts/import-universities.js
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('import-universities.js') || process.argv[1].endsWith('import-universities'));
if (isDirectRun) {
  runImport()
    .then((c) => {
      console.log(`Successfully completed direct command-line import of ${c} universities.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Direct import script failed:', err);
      process.exit(1);
    });
}
