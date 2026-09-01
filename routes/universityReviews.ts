import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from './auth.js';

const router = express.Router();

const REVIEWS_PATH = path.join(process.cwd(), 'public', 'data', 'university_reviews.json');

function loadReviews(): any[] {
  try {
    if (fs.existsSync(REVIEWS_PATH)) {
      const raw = fs.readFileSync(REVIEWS_PATH, 'utf-8');
      if (raw.trim()) return JSON.parse(raw);
    }
  } catch {}
  return [
    { id: 'rev-1', university: 'Technical University of Munich', author: 'Alex Carter', rating: 5, text: 'Excellent support for internationals. DAAD workshops really helped my SOP. Living cost in Munich is high but dorms are affordable if you apply early.', createdAt: new Date(Date.now() - 20*24*3600*1000).toISOString() },
    { id: 'rev-2', university: 'Technical University of Munich', author: 'Priya S.', rating: 4, text: 'Great labs for CS, but German language helps for part-time jobs. Visa took 5 weeks from India.', createdAt: new Date(Date.now() - 45*24*3600*1000).toISOString() },
    { id: 'rev-3', university: 'University of Toronto', author: 'James K.', rating: 5, text: 'Huge campus, strong post-study work options (PGWP). Proof of funds check was strict - prepare 28-day bank statement.', createdAt: new Date(Date.now() - 10*24*3600*1000).toISOString() },
  ];
}

function saveReviews(list: any[]) {
  try {
    fs.mkdirSync(path.dirname(REVIEWS_PATH), { recursive: true });
    fs.writeFileSync(REVIEWS_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) { console.error('Failed to save university reviews:', e); }
}

// GET /api/university-reviews?university=Name
router.get('/', (req: Request, res: Response) => {
  const uni = String(req.query.university || '').toLowerCase().trim();
  const all = loadReviews();
  const filtered = uni ? all.filter((r: any) => r.university.toLowerCase() === uni) : all;
  const avg = filtered.length ? (filtered.reduce((s: number, r: any) => s + (r.rating || 0), 0) / filtered.length).toFixed(1) : null;
  res.json({ reviews: filtered, average: avg, total: filtered.length });
});

// POST /api/university-reviews (auth required)
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { university, rating, text } = req.body;
  if (!university || !text) return res.status(400).json({ error: 'university and text are required' });
  const r = Math.max(1, Math.min(5, parseInt(String(rating)) || 5));
  if (String(text).trim().length < 10) return res.status(400).json({ error: 'Review must be at least 10 characters' });
  const all = loadReviews();
  const entry = {
    id: 'rev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    university: String(university).trim(),
    author: user.username,
    rating: r,
    text: String(text).trim().slice(0, 800),
    createdAt: new Date().toISOString()
  };
  all.unshift(entry);
  saveReviews(all);
  res.json(entry);
});

export default router;
