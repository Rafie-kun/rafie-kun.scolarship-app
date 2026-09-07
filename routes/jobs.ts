import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

function readInternships(): any[] {
  const candidates = [
    path.join(process.cwd(), 'public', 'data', 'internships.json'),
    path.join(process.cwd(), 'data', 'internships.json')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch {
      // try next candidate
    }
  }
  return [];
}

// Freshness metadata for the internship catalog
router.get('/internships/meta', (req: Request, res: Response) => {
  let lastUpdated: string | null = null;
  const p = path.join(process.cwd(), 'public', 'data', 'internships.json');
  try {
    if (fs.existsSync(p)) {
      lastUpdated = fs.statSync(p).mtime.toISOString();
    }
  } catch {
    // non-critical
  }
  res.json({
    total: readInternships().length,
    lastUpdated,
    scraperEnabled: !process.env.VERCEL
  });
});

// GET /api/jobs — checks public/data first (canonical), then data/ fallback for Docker
router.get('/', (req: Request, res: Response) => {
  try {
    const candidates = [
      path.join(process.cwd(), 'public', 'data', 'jobs.json'),
      path.join(process.cwd(), 'data', 'jobs.json')
    ];
    let jobs: any = [];
    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          jobs = JSON.parse(fs.readFileSync(p, 'utf-8'));
          break;
        }
      } catch {}
    }
    res.json(jobs);
  } catch (error) {
    console.error("Error reading jobs from JSON file:", error);
    res.status(500).json({ error: "Failed to consult career Oracle database." });
  }
});

export default router;
