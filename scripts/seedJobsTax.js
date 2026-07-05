import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

const jobsData = [
  {
    "country": "Germany",
    "commonJobs": ["HiWi (Research Assistant)", "Werkstudent", "English Tutor", "Cafeteria Staff"],
    "avgWage": "€13.50 - €16.00 / hr",
    "taxAllowance": "€11,784 / year (Tax-Free)",
    "rules": "Up to 20 hours per week during term time."
  },
  {
    "country": "United States",
    "commonJobs": ["Library Assistant", "Dining Hall Attendant", "Lab Assistant", "Peer Tutor"],
    "avgWage": "$15.00 - $18.00 / hr",
    "taxAllowance": "Standard deduction applies; state taxes vary",
    "rules": "On-campus employment up to 20 hrs/week during full academic terms."
  }
];

const taxData = [
  {
    "country": "Germany",
    "freeAllowance": "€11,784 / year",
    "studentTaxRate": "0% under threshold, progressive thereafter",
    "socialSecurityExemption": "Exempt from pension/unemployment insurance up to 20 hrs/week"
  },
  {
    "country": "United States",
    "freeAllowance": "$14,600 / year (Federal Standard Deduction)",
    "studentTaxRate": "10% on income above threshold",
    "socialSecurityExemption": "FICA exempt for on-campus student workers enrolled full-time"
  }
];

async function seed() {
  const jobsPath = path.join(DATA_DIR, 'student_jobs.json');
  let existingJobs = [];
  try {
    const content = await fs.readFile(jobsPath, 'utf8');
    existingJobs = JSON.parse(content);
  } catch {}
  const jobKeys = new Set(existingJobs.map(j => j.country));
  const mergedJobs = [...existingJobs];
  for (const j of jobsData) {
    if (!jobKeys.has(j.country)) {
      mergedJobs.push(j);
      jobKeys.add(j.country);
    }
  }
  await fs.writeFile(jobsPath, JSON.stringify(mergedJobs, null, 2));

  const taxPath = path.join(DATA_DIR, 'tax_rules.json');
  let existingTax = [];
  try {
    const content = await fs.readFile(taxPath, 'utf8');
    existingTax = JSON.parse(content);
  } catch {}
  const taxKeys = new Set(existingTax.map(t => t.country));
  const mergedTax = [...existingTax];
  for (const t of taxData) {
    if (!taxKeys.has(t.country)) {
      mergedTax.push(t);
      taxKeys.add(t.country);
    }
  }
  await fs.writeFile(taxPath, JSON.stringify(mergedTax, null, 2));

  console.log(`✅ Student Jobs & Tax Rules seeded.`);
}

seed().catch(console.error);
