import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// GET /api/jobs
router.get('/', (req: Request, res: Response) => {
  try {
    const jobsPath = path.join(process.cwd(), 'data', 'jobs.json');
    let jobs = [];
    if (fs.existsSync(jobsPath)) {
      jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
    }
    res.json(jobs);
  } catch (error) {
    console.error("Error reading jobs from JSON file:", error);
    res.status(500).json({ error: "Failed to consult career Oracle database." });
  }
});

export default router;
