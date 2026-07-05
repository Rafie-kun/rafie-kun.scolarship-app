import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

const internshipData = [
  {
    "id": "int-001",
    "title": "Software Engineering Intern",
    "company": "Google",
    "location": "Mountain View, CA, USA / Remote",
    "country": "United States",
    "stipend": "$8,000 / month",
    "deadline": "2026-11-30",
    "eligibleMajors": ["Computer Science", "Software Engineering", "Mathematics"],
    "applicationUrl": "https://careers.google.com/students/",
    "description": "Work on real-world engineering projects with Google mentors.",
    "lastVerified": "2026-07-03"
  }
];

async function seed() {
  const filePath = path.join(DATA_DIR, 'internships.json');
  let existing = [];
  try {
    const content = await fs.readFile(filePath, 'utf8');
    existing = JSON.parse(content);
  } catch {}
  const ids = new Set(existing.map(i => i.id));
  const merged = [...existing];
  for (const item of internshipData) {
    if (!ids.has(item.id)) {
      merged.push(item);
      ids.add(item.id);
    }
  }
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
  console.log(`✅ Internships: ${merged.length} entries.`);
}

seed().catch(console.error);
