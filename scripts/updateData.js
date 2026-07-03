import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');

async function main() {
  console.log('Starting data update...');
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const jobsPath = path.join(DATA_DIR, 'jobs.json');
  let existingJobs = [];
  if (fs.existsSync(jobsPath)) {
    try {
      existingJobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
    } catch (e) {
      console.warn('Could not parse existing jobs.json, starting fresh.');
    }
  }
  
  // Example deep-merge logic preserving userVerified flags
  const newJobs = [
    {
      id: "1",
      country: "Germany",
      title: "Software Engineer",
      guidance: "High demand in Berlin and Munich. Knowledge of German is a plus but English is widely accepted in tech.",
      averageSalary: "€60,000 - €80,000"
    },
    {
      id: "2",
      country: "UK",
      title: "Data Scientist",
      guidance: "London is the primary hub. Post-study work visa available for 2 years.",
      averageSalary: "£40,000 - £65,000"
    }
  ];

  const mergedJobs = newJobs.map(newJob => {
    const existing = existingJobs.find(j => j.id === newJob.id);
    if (existing && existing.userVerified) {
      return { ...newJob, ...existing, userVerified: true }; // Preserve user verified edits
    }
    return { ...newJob, userVerified: false };
  });

  fs.writeFileSync(jobsPath, JSON.stringify(mergedJobs, null, 2));
  console.log(`Verified and updated ${mergedJobs.length} jobs.`);
  console.log('Data update complete.');
}

main().catch(console.error);
