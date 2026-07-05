import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

const scholarshipData = [
  {
    "id": "sch-usa-001",
    "name": "Fulbright Foreign Student Program",
    "provider": "U.S. Department of State",
    "fundingCoverage": "Full Funding",
    "amount": "$45,000 / year",
    "deadline": "2026-10-15",
    "eligibleCountries": ["Worldwide"],
    "eligibleMajors": ["All Fields"],
    "degreeLevel": ["Master's", "Ph.D."],
    "gpaRequirement": 3.0,
    "description": "Full scholarship for international graduate students, young professionals and artists to study and conduct research in the US.",
    "officialWebsite": "https://foreign.fulbrightonline.org/",
    "applicationUrl": "https://foreign.fulbrightonline.org/apply",
    "contactEmail": "fulbright@iie.org",
    "lastVerified": "2026-07-03",
    "source": "official",
    "userVerified": false
  },
  {
    "id": "sch-uk-001",
    "name": "Chevening Scholarship",
    "provider": "UK Foreign, Commonwealth & Development Office",
    "fundingCoverage": "Full Funding",
    "amount": "£35,000 / year",
    "deadline": "2026-11-03",
    "eligibleCountries": ["Worldwide"],
    "eligibleMajors": ["All Fields"],
    "degreeLevel": ["Master's"],
    "gpaRequirement": 3.2,
    "description": "Fully funded master's degree scholarships in the UK for future global leaders.",
    "officialWebsite": "https://www.chevening.org/",
    "applicationUrl": "https://www.chevening.org/apply/",
    "contactEmail": "info@chevening.org",
    "lastVerified": "2026-07-03",
    "source": "official",
    "userVerified": false
  }
];

async function seed() {
  const filePath = path.join(DATA_DIR, 'scholarships.json');
  let existing = [];
  try {
    const content = await fs.readFile(filePath, 'utf8');
    existing = JSON.parse(content);
  } catch {}
  const ids = new Set(existing.map(s => s.id));
  const merged = [...existing];
  for (const sch of scholarshipData) {
    if (!ids.has(sch.id)) {
      merged.push(sch);
      ids.add(sch.id);
    }
  }
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
  console.log(`✅ Scholarships: ${merged.length} entries.`);
}

seed().catch(console.error);
