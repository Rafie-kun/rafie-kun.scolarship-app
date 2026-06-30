import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from './db.js';
import { getUserByUsername, getUserByEmail, createNewUser, getProfileByUsername } from '../db/index.js';
import type { Profile } from '../src/types.js';

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

// Check username availability
router.get('/check-username', (req: Request, res: Response) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: "Username query parameter is required" });
  }
  const cleanUser = String(username).trim().toLowerCase();
  
  const usernameRegex = /^[a-zA-Z0-9_-]{3,16}$/;
  if (!usernameRegex.test(cleanUser)) {
    return res.json({ 
      available: false, 
      error: "Username must be 3-16 characters and contain only letters, numbers, underscores, or hyphens." 
    });
  }

  const existing = getUserByUsername(cleanUser);
  if (existing) {
    return res.json({ available: false, error: "This username already exists." });
  }
  return res.json({ available: true });
});

// Check email availability
router.get('/check-email', (req: Request, res: Response) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }
  const cleanEmail = String(email).trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.json({ 
      available: false, 
      error: "Please enter a valid email address." 
    });
  }

  const existing = getUserByEmail(cleanEmail);
  if (existing) {
    return res.json({ available: false, error: "This email already exists." });
  }
  return res.json({ available: true });
});

// Register as a real candidate
router.post('/register', (req: Request, res: Response) => {
  const { 
    username, 
    password, 
    email,
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

  if (!username || !password || !email) {
    return res.status(400).json({ error: "Username, Email, and Password are required!" });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const cleanEmail = String(email).trim().toLowerCase();

  // Username validation
  const usernameRegex = /^[a-zA-Z0-9_-]{3,16}$/;
  if (!usernameRegex.test(cleanUser)) {
    return res.status(400).json({ error: "Username must be 3-16 characters and contain only letters, numbers, underscores, or hyphens." });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  // Password validation
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: "Password must be at least 8 characters and contain both letters and numbers." });
  }

  if (getUserByUsername(cleanUser)) {
    return res.status(400).json({ error: "This username already exists." });
  }

  if (getUserByEmail(cleanEmail)) {
    return res.status(400).json({ error: "This email already exists." });
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

  createNewUser(cleanUser, hashedPassword, newProfile.fullName, newProfile, cleanEmail);

  // Respond with cookie and JSON
  const token = jwt.sign({ username: cleanUser, isGuest: false }, JWT_SECRET, { expiresIn: '7d' });
  setAuthCookie(req, res, token, false);

  res.status(201).json({
    success: true,
    username: cleanUser,
    profile: newProfile,
    token
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
    profile,
    token
  });
});

// Spawn / register as guest player session
router.post('/guest', (req: Request, res: Response) => {
  try {
    // Generate random guest user suffix
    const guestUser = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Clone starter guest profile
    const guestProfile: Profile = {
      fullName: `Guest Explorer #${guestUser.split('_')[1]}`,
      level: 1,
      points: 0,
      intendedMajor: "",
      intendedDegree: "",
      country: "",
      nationality: "",
      gpa: 4.0,
      maxGpa: 4.0,
      ieltsScore: "",
      greScore: "",
      leadershipExperience: [],
      projects: [],
      volunteerExperience: [],
      badges: [],
      educationLevel: "undergraduate",
      highSchoolName: "",
      collegeName: "",
      primaryMajor: "",
      secondaryMajor: "",
      minor: "",
      graduationYear: 2026,
      additionalSkills: [],
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
      profile: guestProfile,
      token
    });
  } catch (err: any) {
    console.error("Guest login error:", err);
    res.status(500).json({ error: "Guest spawn failed: " + err.message });
  }
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
