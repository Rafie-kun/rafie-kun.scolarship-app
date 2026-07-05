import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

const visaData = [
  {
    "country": "United States",
    "visaType": "F-1 Student Visa",
    "fee": "$185 USD (DS-160) + $350 USD (SEVIS I-901)",
    "processingTime": "3 - 8 weeks",
    "workPermit": "On-campus 20 hrs/week; CPT/OPT after 1st academic year",
    "officialPortal": "https://ceac.state.gov/genniv/",
    "requiredDocuments": [
      "Form I-20 issued by SEVP-certified school",
      "Valid Passport (at least 6 months validity)",
      "DS-160 Confirmation Page",
      "SEVIS I-901 Fee Receipt",
      "Proof of Financial Support"
    ],
    "steps": [
      "Receive Form I-20 from accepted US university",
      "Pay SEVIS I-901 fee online",
      "Complete Online Nonimmigrant Visa Application (DS-160)",
      "Schedule visa interview appointment at US Embassy/Consulate",
      "Attend visa interview with required documentation"
    ]
  },
  {
    "country": "Germany",
    "visaType": "National Visa for Study (Category D)",
    "fee": "€75 EUR",
    "processingTime": "4 - 12 weeks",
    "workPermit": "140 full days or 280 half days per calendar year",
    "officialPortal": "https://visaguide.world/europe/germany-visa/student-visa/",
    "requiredDocuments": [
      "Valid Passport",
      "Proof of Admission from German University",
      "Proof of Financial Means (Blocked Account €11,904/year)",
      "Health Insurance Coverage",
      "Academic Transcripts & Certificates"
    ],
    "steps": [
      "Receive admission letter from German university",
      "Open Blocked Account (Sperrkonto)",
      "Book visa appointment at German Embassy/Consulate",
      "Prepare and translate required documents",
      "Attend interview and submit biometric data"
    ]
  }
];

async function seed() {
  const filePath = path.join(DATA_DIR, 'visa_guide.json');
  let existing = [];
  try {
    const content = await fs.readFile(filePath, 'utf8');
    existing = JSON.parse(content);
  } catch {}
  const keys = new Set(existing.map(v => v.country));
  const merged = [...existing];
  for (const item of visaData) {
    if (!keys.has(item.country)) {
      merged.push(item);
      keys.add(item.country);
    }
  }
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
  console.log(`✅ Visa Guide: ${merged.length} entries.`);
}

seed().catch(console.error);
