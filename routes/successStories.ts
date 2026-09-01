import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from './auth.js';

const router = express.Router();
const PATH = path.join(process.cwd(), 'public', 'data', 'success_stories.json');

function load(): any[] {
  try {
    if (fs.existsSync(PATH)) {
      const raw = fs.readFileSync(PATH, 'utf-8');
      if (raw.trim()) return JSON.parse(raw);
    }
  } catch {}
  return [
    { id: 'ss-1', author: 'Alex Carter', university: 'Technical University of Munich', scholarship: 'DAAD EPOS', gpa: '3.82', text: 'Focus your SOP on one project with numbers (I quoted 32% query reduction). German professors love specifics over passion statements. Applied via uni-assist, visa took 3 weeks from US.', verified: true, createdAt: new Date(Date.now() - 30*24*3600*1000).toISOString() },
    { id: 'ss-2', author: 'Priya S.', university: 'University of Toronto', scholarship: 'Lester Pearson', gpa: '3.9', text: 'Lester Pearson values leadership + community impact. I highlighted my Youth Code Camp mentoring (40 students) with measurable outcomes.', verified: true, createdAt: new Date(Date.now() - 60*24*3600*1000).toISOString() },
  ];
}
function save(list: any[]) {
  try { fs.mkdirSync(path.dirname(PATH), { recursive: true }); fs.writeFileSync(PATH, JSON.stringify(list, null, 2), 'utf-8'); } catch {}
}

router.get('/', (req: Request, res: Response) => {
  const verifiedOnly = String(req.query.verified || '') === 'true';
  let list = load();
  if (verifiedOnly) list = list.filter((s:any)=> s.verified);
  res.json(list);
});

router.post('/', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { university, scholarship, gpa, text } = req.body;
  if (!university || !text || String(text).trim().length < 20) return res.status(400).json({ error: 'university and text (min 20 chars) required' });
  const list = load();
  const entry = {
    id: 'ss-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    author: user.username,
    university: String(university).trim().slice(0, 120),
    scholarship: String(scholarship || '').trim().slice(0, 120),
    gpa: String(gpa || '').trim().slice(0, 10),
    text: String(text).trim().slice(0, 1200),
    verified: false,
    createdAt: new Date().toISOString()
  };
  list.unshift(entry);
  save(list);
  res.json(entry);
});

export default router;
