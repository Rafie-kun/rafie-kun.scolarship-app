import express, { Request, Response } from 'express';
import { authenticateToken } from './auth';
import { userApplicationsMap } from './db';

const router = express.Router();

// Get active player's applications (Requires Token)
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const list = userApplicationsMap[username] || [];
  res.json(list);
});

// Create or update application checkpoint (Requires Token)
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const { app: targetApp } = req.body;

  if (!targetApp) {
    return res.status(400).json({ error: "Missing application payload" });
  }

  if (!userApplicationsMap[username]) {
    userApplicationsMap[username] = [];
  }

  const userList = userApplicationsMap[username];
  
  // Deduplicate: check if app already exists by ID OR by Name (if it is a real scholarship, not generic custom name)
  const idx = userList.findIndex(a => 
    a.id === targetApp.id || 
    (targetApp.name !== 'Custom Admissions Pursuit' && a.name.toLowerCase() === targetApp.name.toLowerCase())
  );

  if (idx !== -1) {
    userList[idx] = { ...userList[idx], ...targetApp };
  } else {
    targetApp.id = "app-" + Date.now();
    userList.push(targetApp);
  }

  res.json(userList);
});

// Abandon/Delete scholarship tracker quest (Requires Token)
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const { id } = req.params;

  if (!userApplicationsMap[username]) {
    userApplicationsMap[username] = [];
  }

  userApplicationsMap[username] = userApplicationsMap[username].filter(a => a.id !== id);
  res.json(userApplicationsMap[username]);
});

export default router;
