/**
 * Manual catalog sync: imports universities, scholarships, internships, and
 * starter admissions guides into Postgres. Safe to run repeatedly (upserts are
 * idempotent and verified records are never overwritten).
 *
 * Usage: npm run sync:catalog
 */
import 'dotenv/config';
import { syncCatalog } from '../src/server/services/catalog-sync.js';
import { pool } from '../src/server/db/index.js';

async function main() {
  if (!process.env.DATABASE_URL_UNPOOLED) {
    console.error('DATABASE_URL_UNPOOLED is not set. Copy .env.example to .env first.');
    process.exitCode = 1;
    return;
  }

  const counts = await syncCatalog();
  console.log(JSON.stringify(counts, null, 2));

  if (counts.errors.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool().end().catch(() => undefined);
  });
