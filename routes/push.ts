import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from './auth.js';

const router = express.Router();
const SUBS_PATH = path.join(process.cwd(), 'data', 'push_subs.json');

function loadSubs(): any[] {
  try {
    if (fs.existsSync(SUBS_PATH)) {
      const raw = fs.readFileSync(SUBS_PATH, 'utf-8');
      if (raw.trim()) return JSON.parse(raw);
    }
  } catch {}
  return [];
}
function saveSubs(list: any[]) {
  try {
    fs.mkdirSync(path.dirname(SUBS_PATH), { recursive: true });
    fs.writeFileSync(SUBS_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch {}
}

// POST /api/push/subscribe  { subscription }
router.post('/subscribe', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'subscription with endpoint required' });
  const subs = loadSubs();
  const idx = subs.findIndex((s: any) => s.endpoint === subscription.endpoint);
  const entry = { username: user.username, subscription, createdAt: new Date().toISOString() };
  if (idx >= 0) subs[idx] = entry;
  else subs.push(entry);
  saveSubs(subs);
  res.json({ success: true });
});

// GET /api/push/vapid-public-key (public, for client to subscribe)
router.get('/vapid-public-key', (req: Request, res: Response) => {
  const key = process.env.VAPID_PUBLIC_KEY || '';
  res.json({ publicKey: key });
});

export default router;
export { loadSubs };
