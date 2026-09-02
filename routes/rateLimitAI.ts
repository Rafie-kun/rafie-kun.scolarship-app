import { Request, Response, NextFunction } from 'express';

const windowMs = 60 * 1000; // 1 minute
const maxPerWindow = 10; // 10 AI calls per minute per IP+user
const buckets = new Map<string, { count: number; resetAt: number }>();

export function aiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = String(req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
  const user = (req as any).user?.username || 'anon';
  const key = `${ip}:${user}`;
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  entry.count++;
  if (entry.count > maxPerWindow) {
    return res.status(429).json({ error: 'Too many AI requests — please wait a minute and try again.' });
  }
  next();
}

// Periodic cleanup to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets.entries()) {
    if (now > v.resetAt + windowMs) buckets.delete(k);
  }
}, 5 * 60 * 1000);
