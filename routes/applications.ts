import express, { Request, Response } from 'express';
import { authenticateToken } from './auth.js';
import { getUserApplications, saveApplication, deleteApplication } from '../db/index.js';

const router = express.Router();

// Get active player's applications (Requires Token)
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const list = getUserApplications(username);
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

  const userList = getUserApplications(username);
  
  // Deduplicate: check if app already exists by ID OR by Name (if it is a real scholarship, not generic custom name)
  const idx = userList.findIndex(a => 
    a.id === targetApp.id || 
    (targetApp.name !== 'Custom Admissions Pursuit' && a.name.toLowerCase() === targetApp.name.toLowerCase())
  );

  if (idx !== -1) {
    targetApp.id = userList[idx].id; // Retain original ID
    const mergedApp = { ...userList[idx], ...targetApp };
    saveApplication(username, mergedApp);
  } else {
    if (!targetApp.id) {
      targetApp.id = "app-" + Date.now();
    }
    saveApplication(username, targetApp);
  }

  res.json(getUserApplications(username));
});

// Abandon/Delete scholarship tracker quest (Requires Token)
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const { id } = req.params;

  deleteApplication(username, String(id));
  res.json(getUserApplications(username));
});

export default router;
