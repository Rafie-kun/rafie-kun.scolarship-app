import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

const universityData = [
  {
    "id": "uni-usa-001",
    "name": "Harvard University",
    "country": "United States",
    "city": "Cambridge",
    "type": "private",
    "ranking": 1,
    "acceptanceRate": "3.4%",
    "averageGpa": 3.95,
    "tuitionMin": 54000,
    "tuitionMax": 61200,
    "currency": "USD",
    "popularMajors": ["Economics", "Computer Science", "Political Science", "Social Sciences", "Biology"],
    "offeredScholarships": ["sch-usa-001", "sch-global-001"],
    "offeredInternships": ["int-usa-001"],
    "hasOnCampusHousing": true,
    "officialWebsite": "https://www.harvard.edu/",
    "applicationUrl": "https://apply.college.harvard.edu/",
    "internationalAdmissionsPage": "https://www.harvard.edu/admissions/international/",
    "scholarshipPage": "https://college.harvard.edu/financial-aid",
    "internshipPage": "https://careerservices.fas.harvard.edu/",
    "region": "North America",
    "lastVerified": "2026-07-03",
    "source": "official",
    "userVerified": false
  },
  {
    "id": "uni-usa-002",
    "name": "Stanford University",
    "country": "United States",
    "city": "Stanford",
    "type": "private",
    "ranking": 3,
    "acceptanceRate": "3.9%",
    "averageGpa": 3.96,
    "tuitionMin": 56000,
    "tuitionMax": 62000,
    "currency": "USD",
    "popularMajors": ["Computer Science", "Engineering", "Human Biology", "Economics"],
    "offeredScholarships": ["sch-usa-002"],
    "offeredInternships": ["int-usa-002"],
    "hasOnCampusHousing": true,
    "officialWebsite": "https://www.stanford.edu/",
    "applicationUrl": "https://admission.stanford.edu/apply/",
    "internationalAdmissionsPage": "https://admission.stanford.edu/apply/international/",
    "scholarshipPage": "https://financialaid.stanford.edu/",
    "internshipPage": "https://bechtel.stanford.edu/",
    "region": "North America",
    "lastVerified": "2026-07-03",
    "source": "official",
    "userVerified": false
  },
  {
    "id": "uni-uk-001",
    "name": "University of Oxford",
    "country": "United Kingdom",
    "city": "Oxford",
    "type": "public",
    "ranking": 2,
    "acceptanceRate": "17.5%",
    "averageGpa": 3.9,
    "tuitionMin": 28500,
    "tuitionMax": 44000,
    "currency": "GBP",
    "popularMajors": ["PPE", "Medicine", "Computer Science", "Law", "History"],
    "offeredScholarships": ["sch-uk-001"],
    "offeredInternships": ["int-uk-001"],
    "hasOnCampusHousing": true,
    "officialWebsite": "https://www.ox.ac.uk/",
    "applicationUrl": "https://www.ucas.com/",
    "internationalAdmissionsPage": "https://www.ox.ac.uk/admissions/undergraduate/international-students",
    "scholarshipPage": "https://www.ox.ac.uk/admissions/undergraduate/fees-and-funding",
    "internshipPage": "https://www.careers.ox.ac.uk/",
    "region": "Europe",
    "lastVerified": "2026-07-03",
    "source": "official",
    "userVerified": false
  }
];

async function seed() {
  const filePath = path.join(DATA_DIR, 'universities.json');
  let existing = [];
  try {
    const content = await fs.readFile(filePath, 'utf8');
    existing = JSON.parse(content);
  } catch {}
  const ids = new Set(existing.map(u => u.id));
  const merged = [...existing];
  for (const uni of universityData) {
    if (!ids.has(uni.id)) {
      merged.push(uni);
      ids.add(uni.id);
    }
  }
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
  console.log(`✅ Universities: ${merged.length} entries.`);
}

seed().catch(console.error);
