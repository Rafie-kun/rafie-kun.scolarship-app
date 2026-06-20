import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from './db';
import { getUserByUsername, createNewUser, getProfileByUsername } from '../db/index';
import { Profile } from '../src/types';

const router = express.Router();

export interface AuthRequest extends Request {
  user?: {
    username: string;
    isGuest: boolean;
  };
}

// --- SECURE CUSTOM RATE LIMITER (Prevents Brute-Force without extra npm packages) ---
const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
const maxAttempts = 100;
const ipRequestsMap: Record<string, { count: number; resetTime: number }> = {};

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ipKey = String(ip);
  const now = Date.now();

  if (!ipRequestsMap[ipKey] || now > ipRequestsMap[ipKey].resetTime) {
    ipRequestsMap[ipKey] = {
      count: 1,
      resetTime: now + rateLimitWindowMs
    };
    return next();
  }

  ipRequestsMap[ipKey].count++;

  if (ipRequestsMap[ipKey].count > maxAttempts) {
    return res.status(429).json({
      error: "Too many authentication requests from this academic node. Please try again after 15 minutes."
    });
  }

  next();
}

// Apply rate limiter to all authentication routes
router.use(rateLimiter);

// Cookie helper to set HttpOnly tokens smoothly
function setAuthCookie(req: Request, res: Response, token: string, isGuest: boolean) {
  const maxAge = isGuest ? 7200 : 604800; // 2 hours for guests, 7 days for candidates
  const cookieOptions = ['HttpOnly', `Path=/`, `Max-Age=${maxAge}`];
  
  // Adapt SameSite/Secure based on production/HTTPS environments allowing it to run robustly in dev as well
  const isProduction = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (isProduction) {
    cookieOptions.push('SameSite=None', 'Secure');
  } else {
    cookieOptions.push('SameSite=Lax');
  }
  
  res.setHeader('Set-Cookie', `token=${token}; ${cookieOptions.join('; ')}`);
}

// Authentication middleware to guard protected API routes
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const cookieString = req.headers.cookie || '';
  let tokenFromCookie = '';
  const match = cookieString.match(/(?:^|; )token=([^;]*)/);
  if (match) {
    tokenFromCookie = decodeURIComponent(match[1]);
  }
  
  // Graceful fallback to standard Authorization header
  const authHeader = req.headers['authorization'];
  const token = tokenFromCookie || (authHeader && authHeader.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: "Access token required. Please sign in to Spawn." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token session." });
    }
    (req as any).user = {
      username: decoded.username,
      isGuest: !!decoded.isGuest
    };
    next();
  });
}

// Check Session Presence via /me
router.get('/me', (req: Request, res: Response) => {
  const cookieString = req.headers.cookie || '';
  let tokenFromCookie = '';
  const match = cookieString.match(/(?:^|; )token=([^;]*)/);
  if (match) {
    tokenFromCookie = decodeURIComponent(match[1]);
  }
  
  const authHeader = req.headers['authorization'];
  const token = tokenFromCookie || (authHeader && authHeader.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: "No active session." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(401).json({ error: "Expired session." });
    }
    const username = decoded.username;
    const profile = getProfileByUsername(username);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }
    res.json({
      success: true,
      username,
      profile,
      isGuest: !!decoded.isGuest
    });
  });
});

// Register as a real candidate
router.post('/register', (req: Request, res: Response) => {
  const { 
    username, 
    password, 
    fullName, 
    gpa, 
    intendedMajor, 
    intendedDegree, 
    educationLevel,
    highSchoolName,
    collegeName,
    primaryMajor,
    secondaryMajor,
    minor,
    graduationYear,
    additionalSkills,
    satScore,
    oLevelSubjects,
    aLevelSubjects,
    resumePdf
  } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Player Username and Password are required!" });
  }

  const cleanUser = String(username).trim().toLowerCase();

  if (getUserByUsername(cleanUser)) {
    return res.status(400).json({ error: "This player name is already registered under Admissions Command!" });
  }

  // Salt & Hash password
  const salt = bcrypt.genSaltSync(8);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const mainMajor = primaryMajor || intendedMajor || "Computer Science";

  // Initialize beautiful player profile card
  const newProfile: Profile = {
    fullName: String(fullName || username).trim(),
    level: 1,
    points: 40, // standard setup starter XP
    intendedMajor: mainMajor,
    intendedDegree: intendedDegree || "Master's Degree",
    country: "Worldwide",
    nationality: "Global Explorer",
    gpa: isNaN(parseFloat(gpa)) ? 3.75 : Math.min(4.0, parseFloat(gpa)),
    maxGpa: 4.0,
    ieltsScore: "7.0",
    greScore: "310",
    leadershipExperience: [],
    projects: [],
    volunteerExperience: [],
    badges: ["Starter Ground", "Fresh Spawn"],
    educationLevel: educationLevel || "Undergraduate (Bachelor's)",
    highSchoolName: highSchoolName || "",
    collegeName: collegeName || "",
    primaryMajor: mainMajor,
    secondaryMajor: secondaryMajor || "",
    minor: minor || "",
    graduationYear: graduationYear ? parseInt(String(graduationYear)) : 2026,
    additionalSkills: additionalSkills || ["TypeScript", "Python"],
    resumePdf: resumePdf || "",
    satScore: satScore ? parseFloat(String(satScore)) : null,
    oLevelSubjects: oLevelSubjects || [],
    aLevelSubjects: aLevelSubjects || [],
    rewardedActions: []
  };

  createNewUser(cleanUser, hashedPassword, newProfile.fullName, newProfile);

  // Respond with cookie and JSON
  const token = jwt.sign({ username: cleanUser, isGuest: false }, JWT_SECRET, { expiresIn: '7d' });
  setAuthCookie(req, res, token, false);

  res.status(201).json({
    success: true,
    username: cleanUser,
    profile: newProfile
  });
});

// Login for registered candidate players
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required!" });
  }

  const cleanUser = String(username).trim().toLowerCase();

  const userRecord = getUserByUsername(cleanUser);
  if (!userRecord || !bcrypt.compareSync(password, userRecord.password)) {
    return res.status(401).json({ error: "Invalid player signature credentials." });
  }

  const profile = getProfileByUsername(cleanUser);

  // Create token
  const token = jwt.sign({ username: cleanUser, isGuest: false }, JWT_SECRET, { expiresIn: '7d' });
  setAuthCookie(req, res, token, false);

  res.json({
    success: true,
    username: cleanUser,
    profile
  });
});

// Spawn / register as guest player session
router.post('/guest', (req: Request, res: Response) => {
  // Generate random guest user suffix
  const guestUser = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Clone starter guest profile
  const guestProfile: Profile = {
    fullName: `Guest Explorer #${guestUser.split('_')[1]}`,
    level: 1,
    points: 40,
    intendedMajor: "Information Technology",
    intendedDegree: "Master's Degree",
    country: "Canada",
    nationality: "Explorer Space",
    gpa: 3.50,
    maxGpa: 4.0,
    ieltsScore: "7.0",
    greScore: "310",
    leadershipExperience: ["Novice Camp Counselor"],
    projects: ["Procedural Map Builder"],
    volunteerExperience: ["Local Highschool Coding Club Support"],
    badges: ["Fresh Spawn"],
    educationLevel: "high_school",
    highSchoolName: "Explorer Secondary Academy",
    collegeName: "",
    primaryMajor: "Information Technology",
    secondaryMajor: "",
    minor: "",
    graduationYear: 2026,
    additionalSkills: ["Java", "HTML/CSS", "Python Basics"],
    resumePdf: "",
    rewardedActions: []
  };

  const guestSalt = bcrypt.genSaltSync(8);
  const guestHash = bcrypt.hashSync("guest_" + guestUser, guestSalt);
  createNewUser(guestUser, guestHash, guestProfile.fullName, guestProfile);

  const token = jwt.sign({ username: guestUser, isGuest: true }, JWT_SECRET, { expiresIn: '2h' });
  setAuthCookie(req, res, token, true);

  res.json({
    success: true,
    username: guestUser,
    profile: guestProfile
  });
});

// Logout – Clears httpOnly Cookie
router.post('/logout', (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
  const cookieOptions = ['HttpOnly', 'Path=/', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT'];
  if (isProduction) {
    cookieOptions.push('SameSite=None', 'Secure');
  } else {
    cookieOptions.push('SameSite=Lax');
  }
  
  res.setHeader('Set-Cookie', `token=; ${cookieOptions.join('; ')}`);
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;
