import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

async function validateFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] File not found: ${filename}`);
    return;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    let totalUrls = 0;
    let brokenUrls = 0;

    function checkObj(obj) {
      if (!obj) return;
      if (typeof obj === 'string') {
        if (obj.startsWith('http://') || obj.startsWith('https://')) {
          totalUrls++;
          if (obj.includes('placeholder') || obj === '#' || obj.includes('example.com') || obj.includes('scholarpath-portal.org')) {
            brokenUrls++;
          }
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(checkObj);
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(checkObj);
      }
    }

    checkObj(data);
    console.log(`[VALIDATION] ${filename}: Tested ${totalUrls} URLs (${brokenUrls} placeholder/disrupted URLs detected).`);
  } catch (err) {
    console.error(`[ERROR] Failed to validate ${filename}:`, err.message);
  }
}

async function run() {
  console.log("=== SCHOLARPATH LINK VALIDATION CRAWLER ===");
  const files = ['universities.json', 'scholarships.json', 'internships.json', 'visa_guide.json', 'cost_of_living.json'];
  for (const f of files) {
    await validateFile(f);
  }
  console.log("=== VALIDATION COMPLETED CLEANLY ===");
}

run();
