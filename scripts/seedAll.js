import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runScript(name) {
  return new Promise((resolve, reject) => {
    const child = exec(`node ${path.join(__dirname, name)}`, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout);
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
}

async function main() {
  console.log('🌍 Starting full data seed...');
  await runScript('seedUniversities.js');
  await runScript('seedScholarships.js');
  await runScript('seedInternships.js');
  await runScript('seedVisaGuide.js');
  await runScript('seedCostLiving.js');
  await runScript('seedJobsTax.js');
  console.log('✅ All data seeded successfully!');
}

main().catch(console.error);
