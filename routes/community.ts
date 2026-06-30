import express, { Request, Response } from 'express';
import { authenticateToken } from './auth.js';
import { getCommunityPosts, addCommunityPost, voteCommunityPost, getProfileByUsername } from '../db/index.js';

const router = express.Router();

// Get community forum posts list
router.get('/', (req: Request, res: Response) => {
  res.json(getCommunityPosts());
});

// Add custom post to global boards
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const profile = getProfileByUsername(username);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found." });
  }

  const { title, content, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and Content are mandatory scrolls!" });
  }

  const newPost = {
    id: "post-" + Date.now(),
    author: profile.fullName.replace(/\s+/g, '_'),
    title,
    content,
    category: category || "General Discussion",
    votes: 1,
    commentsCount: 0,
    createdAt: new Date().toISOString().split("T")[0]
  };

  addCommunityPost(newPost);
  res.json(getCommunityPosts());
});

// Upvote post on active boards
router.post('/:id/vote', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  voteCommunityPost(String(id));
  res.json(getCommunityPosts());
});

export default router;
