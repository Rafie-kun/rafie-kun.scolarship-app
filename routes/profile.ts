import express, { Request, Response } from 'express';
import { authenticateToken } from './auth.js';
import { getProfileByUsername, saveProfile, getCVData, saveCVData, addNotification } from '../db/index.js';

const router = express.Router();

// Get candidate profile
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const profile = getProfileByUsername(username);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found." });
  }
  res.json(profile);
});

// Update candidate profile
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const currentProfile = getProfileByUsername(username);
  if (!currentProfile) {
    return res.status(404).json({ error: "Profile not found." });
  }
  const updatedProfile = { ...currentProfile, ...req.body };
  saveProfile(username, req.body);
  res.json(updatedProfile);
});

// Get CV Data
router.get('/cv', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const cvData = getCVData(username);
  res.json(cvData);
});

// Save or Update CV Data
router.post('/cv', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const { workExperience, internships, projects, skills, certifications, extracurriculars } = req.body;
  
  const payload = {
    workExperience: workExperience || [],
    internships: internships || [],
    projects: projects || [],
    skills: skills || [],
    certifications: certifications || [],
    extracurriculars: extracurriculars || []
  };

  saveCVData(username, payload);
  res.json({ success: true, cvData: payload });
});

// Reward XP Points
router.post('/reward', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const { points, actionName, badgeToUnlock } = req.body;

  const profile = getProfileByUsername(username);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found for reward." });
  }

  if (!profile.rewardedActions) {
    profile.rewardedActions = [];
  }

  // Deduplicate: avoid awarding identical action types multiple times
  if (profile.rewardedActions.includes(actionName)) {
    return res.json(profile);
  }

  profile.rewardedActions.push(actionName);
  profile.points = (profile.points || 0) + parseInt(points || 0);

  // Level Up Check: Each level requires 100 points
  const newLevel = Math.floor(profile.points / 100) + 1;
  if (newLevel > profile.level) {
    profile.level = newLevel;
    addNotification({
      id: "level-notif-" + Date.now(),
      type: "success",
      message: `🌟 RETRO ADVANCEMENT UNLOCKED! ${profile.fullName} level shifted to Level ${newLevel}! Keep exploring!`,
      timestamp: "Just now"
    });
  }

  if (badgeToUnlock && !profile.badges.includes(badgeToUnlock)) {
    profile.badges.push(badgeToUnlock);
    addNotification({
      id: "badge-notif-" + Date.now(),
      type: "success",
      message: `🏅 NEW MILESTONE BADGE CLAIMED: [${badgeToUnlock}]! Check your Hero Ledger.`,
      timestamp: "Just now"
    });
  }

  addNotification({
    id: "reward-notif-" + Date.now(),
    type: "success",
    message: `Completed achievement: "${actionName || 'Academic Quest'}" (+${points} XP Awarded!)`,
    timestamp: "Just now"
  });

  saveProfile(username, profile);
  res.json(profile);
});

export default router;
