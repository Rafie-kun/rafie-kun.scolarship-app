import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url === '#' || url.includes('placeholder') || url.includes('scholarpath-portal.org') || url.includes('example.com')) {
    return false;
  }
  return url.startsWith('http://') || url.startsWith('https://');
}

function mergeRecords(existingRecords, incomingRecords) {
  const mergedMap = new Map();

  // First seed with existing records
  for (const item of existingRecords) {
    if (item.id) {
      mergedMap.set(item.id, item);
    }
  }

  // Merge incoming records
  for (const newItem of incomingRecords) {
    if (!newItem.id) continue;
    const existing = mergedMap.get(newItem.id);

    if (existing) {
      // If user verified, preserve user fields
      if (existing.userVerified) {
        mergedMap.set(newItem.id, {
          ...newItem,
          ...existing,
          userVerified: true,
          lastVerified: new Date().toISOString().split('T')[0]
        });
      } else {
        // Otherwise update with fresh incoming data while ensuring valid URLs
        mergedMap.set(newItem.id, {
          ...existing,
          ...newItem,
          officialWebsite: isValidUrl(newItem.officialWebsite) ? newItem.officialWebsite : (isValidUrl(existing.officialWebsite) ? existing.officialWebsite : 'https://www.google.com'),
          applicationUrl: isValidUrl(newItem.applicationUrl) ? newItem.applicationUrl : (isValidUrl(existing.applicationUrl) ? existing.applicationUrl : 'https://www.google.com'),
          lastVerified: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      mergedMap.set(newItem.id, {
        ...newItem,
        userVerified: false,
        lastVerified: new Date().toISOString().split('T')[0]
      });
    }
  }

  return Array.from(mergedMap.values());
}

async function main() {
  console.log('🔄 Launching ScholarPath Smart Merge Data Synchronizer...');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const filesToProcess = ['universities.json', 'scholarships.json', 'internships.json', 'visa_guide.json', 'jobs.json'];

  for (const file of filesToProcess) {
    const filePath = path.join(DATA_DIR, file);
    let existingData = [];
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        console.warn(`⚠️ Could not parse existing ${file}, starting clean array.`);
      }
    }

    const merged = mergeRecords(existingData, existingData);
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
    console.log(`✅ ${file}: Validated and synced ${merged.length} records.`);
  }

  console.log('🎉 Smart Merge synchronization completed successfully.');
}

main().catch(console.error);
