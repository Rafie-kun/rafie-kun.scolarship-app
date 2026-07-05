import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

const costData = [
  {
    "country": "United States",
    "currency": "USD",
    "tuitionPublic": 25000,
    "tuitionPrivate": 55000,
    "rentMonthly": 850,
    "foodMonthly": 350,
    "transportMonthly": 120,
    "healthInsuranceMonthly": 180,
    "miscMonthly": 250,
    "hourlyWage": 15,
    "workHoursPerWeek": 20,
    "estimatedMonthlyEarnings": 1200
  },
  {
    "country": "Germany",
    "currency": "EUR",
    "tuitionPublic": 350,
    "tuitionPrivate": 12000,
    "rentMonthly": 450,
    "foodMonthly": 250,
    "transportMonthly": 60,
    "healthInsuranceMonthly": 120,
    "miscMonthly": 150,
    "hourlyWage": 13.5,
    "workHoursPerWeek": 20,
    "estimatedMonthlyEarnings": 1080
  },
  {
    "country": "United Kingdom",
    "currency": "GBP",
    "tuitionPublic": 18000,
    "tuitionPrivate": 32000,
    "rentMonthly": 650,
    "foodMonthly": 280,
    "transportMonthly": 90,
    "healthInsuranceMonthly": 40,
    "miscMonthly": 200,
    "hourlyWage": 11.44,
    "workHoursPerWeek": 20,
    "estimatedMonthlyEarnings": 915
  }
];

async function seed() {
  const filePath = path.join(DATA_DIR, 'cost_of_living.json');
  let existing = [];
  try {
    const content = await fs.readFile(filePath, 'utf8');
    existing = JSON.parse(content);
  } catch {}
  const keys = new Set(existing.map(c => c.country));
  const merged = [...existing];
  for (const item of costData) {
    if (!keys.has(item.country)) {
      merged.push(item);
      keys.add(item.country);
    }
  }
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
  console.log(`✅ Cost of Living: ${merged.length} entries.`);
}

seed().catch(console.error);
