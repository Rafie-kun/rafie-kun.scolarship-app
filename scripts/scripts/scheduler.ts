import cron from 'node-cron';
import { checkRSSFeeds } from './scrapers/rssFeeder';
import { scrapeScholarships } from './scrapers/scholarshipScraper';
import { scrapeUniversities } from './scrapers/universityScraper';
import { compareScholarships, compareUniversities } from './services/updateChecker';
import {
  saveNewScholarships,
  saveNewUniversities,
  updateExistingScholarships,
  updateExistingUniversities,
} from './services/saveEntries';
import {
  notifyNewScholarship,
  notifyNewUniversity,
  notifyUpdatedScholarship,
} from './services/notifier';

let isScrapingInProgress = false;

export async function runScraperImmediately() {
  if (isScrapingInProgress) {
    console.log('[⚠️] Scraper run already in progress. Ignoring current trigger.');
    return { status: 'in-progress', message: 'Scraping is already running.' };
  }

  isScrapingInProgress = true;
  console.log('[🚀] Starting Automated Scholarship & University Scraper Sequence...');
  const stats = {
    discoveredScholarships: 0,
    newScholarships: 0,
    updatedScholarships: 0,
    discoveredUniversities: 0,
    newUniversities: 0,
    updatedUniversities: 0,
  };

  try {
    // 1. Fetch RSS Feeds
    const rssItems = await checkRSSFeeds();
    
    // 2. Scrape scholarships
    const rawScholarships = await scrapeScholarships();
    stats.discoveredScholarships = rawScholarships.length + rssItems.filter(i => i.type === 'scholarship').length;

    // Standardize and merge RSS & Scraped items
    const allScrapedSchs = [...rawScholarships];
    for (const rss of rssItems) {
      if (rss.type === 'scholarship') {
        allScrapedSchs.push({
          name: rss.title,
          provider: rss.source || 'Admissions RSS Catalog',
          description: rss.description,
          eligibleMajors: ['All Fields', 'Information Technology', 'Computer Science'],
          eligibleCountries: ['Worldwide'],
          fundingCoverage: 'Fully Funded',
          competitivenessScore: 82,
          gpaRequirement: 3.0,
          degreeLevel: ["Master's Degree"],
          deadline: '2026-11-30',
          officialWebsite: rss.link,
          applicationUrl: rss.link,
        });
      }
    }

    // 3. Compare & Save Scholarships
    const schResults = compareScholarships(allScrapedSchs);
    stats.newScholarships = schResults.newItems.length;
    stats.updatedScholarships = schResults.updatedItems.length;

    saveNewScholarships(schResults.newItems);
    updateExistingScholarships(schResults.updatedItems);

    // Notify for scholarships
    for (const item of schResults.newItems) {
      notifyNewScholarship(item.name, item.provider);
    }
    for (const item of schResults.updatedItems) {
      notifyUpdatedScholarship(item.name);
    }

    // 4. Scrape Universities
    const rawUniversities = await scrapeUniversities();
    stats.discoveredUniversities = rawUniversities.length;

    const uniResults = compareUniversities(rawUniversities);
    stats.newUniversities = uniResults.newItems.length;
    stats.updatedUniversities = uniResults.updatedItems.length;

    saveNewUniversities(uniResults.newItems);
    updateExistingUniversities(uniResults.updatedItems);

    // Notify for universities
    for (const item of uniResults.newItems) {
      notifyNewUniversity(item.name, item.country, item.ranking);
    }

    console.log('[🏁] Scraper pipeline sequence executed successfully.');
    console.log('[📊] Run Statistics:', stats);
  } catch (err: any) {
    console.error('[❌] Pipeline Execution Error:', err.message || err);
  } finally {
    isScrapingInProgress = false;
  }

  return { status: 'success', stats };
}

export function startScheduler() {
  console.log('[⏰] Initializing background scraper scheduler (hourly interval: 0 * * * *)...');
  
  // Schedule to run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[⏰] Hourly Cron Job triggered. Initiating automatic run...');
    await runScraperImmediately();
  });

  // Run once on backend start after a brief delay so the server boots up fully
  setTimeout(async () => {
    console.log('[🚀] Preparing initial on-boot validation scraper pass...');
    await runScraperImmediately();
  }, 5000);
}
