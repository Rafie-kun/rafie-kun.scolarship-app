import express, { Request, Response } from 'express';
import { authenticateToken } from './auth.js';
import { db } from '../db/index.js';

const router = express.Router();

// GET /api/study-groups - grouped counts of who is tracking what
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username: string = user.username;
  try {
    const rows = db.prepare(`
      SELECT name, providerOrUni, COUNT(DISTINCT user_id) as count
      FROM applications
      GROUP BY name
      HAVING COUNT(*) > 0
      ORDER BY count DESC
      LIMIT 50
    `).all() as any[];

    // Mark which groups current user is in
    const userApps = db.prepare(`SELECT name FROM applications WHERE user_id = (SELECT id FROM users WHERE username = ?)`)
      .all(username) as any[];
    const userSet = new Set(userApps.map(r => r.name.toLowerCase()));

    const groups = rows.map(r => ({
      name: r.name,
      provider: r.providerOrUni,
      count: r.count,
      isMember: userSet.has(String(r.name).toLowerCase())
    }));

    res.json({ groups });
  } catch (e: any) {
    console.error('Study groups query failed:', e.message);
    res.status(500).json({ error: 'Failed to load study groups' });
  }
});

// POST /api/study-groups/join  { scholarshipName }
router.post('/join', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username: string = user.username;
  const { scholarshipName } = req.body;
  if (!scholarshipName) return res.status(400).json({ error: 'scholarshipName required' });

  try {
    // Ensure a tracking entry exists for this user (create Saved if not already)
    const userRow = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username) as any;
    if (!userRow) return res.status(404).json({ error: 'User not found' });

    const existing = db.prepare(`SELECT id FROM applications WHERE user_id = ? AND LOWER(name) = LOWER(?)`).get(userRow.id, String(scholarshipName)) as any;
    if (!existing) {
      const id = 'app-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      db.prepare(`INSERT INTO applications (id, user_id, name, providerOrUni, deadline, status, notes, checklist) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, userRow.id, String(scholarshipName), 'Community Group', new Date(Date.now() + 60*24*3600*1000).toISOString().slice(0,10), 'Saved', 'Joined via Study Group Finder', JSON.stringify([])
      );
    }

    // Also ensure a community post exists for the group (idempotent by title)
    const postTitle = `Study Group: ${String(scholarshipName).slice(0, 80)}`;
    const existingPost = db.prepare(`SELECT id FROM community_posts WHERE title = ?`).get(postTitle) as any;
    if (!existingPost) {
      const postId = 'post-' + Date.now();
      db.prepare(`INSERT INTO community_posts (id, author, title, content, category, votes, commentsCount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        postId, username, postTitle, `Study group for "${scholarshipName}". Share your progress, deadlines and tips here!`, 'Study Groups', 0, 0, new Date().toISOString().slice(0,10)
      );
    }

    res.json({ success: true });
  } catch (e: any) {
    console.error('Join group failed:', e.message);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

export default router;
