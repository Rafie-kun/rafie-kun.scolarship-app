import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Profile, Application, AppNotification, CommunityPost, CVData } from '../src/types';

// Ensure data folder exists
const isVercel = process.env.VERCEL === '1';
const dbDir = isVercel ? '/tmp/scholarpath-data' : path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Copy default db to tmp on vercel if it doesn't exist but we have a bundled one
const dbPath = path.join(dbDir, 'app.db');
const bundledDbPath = path.join(process.cwd(), 'data', 'app.db');
if (isVercel && !fs.existsSync(dbPath) && fs.existsSync(bundledDbPath)) {
  fs.copyFileSync(bundledDbPath, dbPath);
}

export const db = new Database(dbPath);

// Enable WAL journal mode for high performance
db.pragma('journal_mode = WAL');

// --- Schema Initialization ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    fullName TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    intendedMajor TEXT,
    intendedDegree TEXT,
    country TEXT,
    nationality TEXT,
    gpa REAL,
    maxGpa REAL,
    ieltsScore TEXT,
    greScore TEXT,
    leadershipExperience TEXT, -- JSON stringified array of strings
    projects TEXT,             -- JSON stringified array of strings
    volunteerExperience TEXT,  -- JSON stringified array of strings
    badges TEXT,               -- JSON stringified array of strings
    educationLevel TEXT,
    highSchoolName TEXT,
    collegeName TEXT,
    primaryMajor TEXT,
    secondaryMajor TEXT,
    minor TEXT,
    graduationYear INTEGER,
    additionalSkills TEXT,     -- JSON stringified array of strings
    resumePdf TEXT,
    rewardedActions TEXT,      -- JSON stringified array of strings
    oLevelSubjects TEXT,       -- JSON stringified array of strings
    aLevelSubjects TEXT,       -- JSON stringified array of strings
    satScore INTEGER,
    profilePicture TEXT,
    lastDailyCheckin TEXT,
    hasCompletedOnboarding INTEGER DEFAULT 0,
    customGeminiKey TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    providerOrUni TEXT NOT NULL,
    deadline TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    checklist TEXT NOT NULL, -- JSON stringified array of ChecklistItem
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS roadmaps (
    user_id TEXT PRIMARY KEY,
    roadmap TEXT NOT NULL, -- JSON stringified array
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT, -- NULL means global, otherwise linked to specific user
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    votes INTEGER DEFAULT 0,
    commentsCount INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cv_data (
    user_id TEXT PRIMARY KEY,
    workExperience TEXT NOT NULL DEFAULT '[]',
    internships TEXT NOT NULL DEFAULT '[]',
    projects TEXT NOT NULL DEFAULT '[]',
    skills TEXT NOT NULL DEFAULT '[]',
    certifications TEXT NOT NULL DEFAULT '[]',
    extracurriculars TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    country TEXT NOT NULL,
    ranking INTEGER DEFAULT 9999,
    acceptanceRate TEXT DEFAULT 'N/A',
    averageGpa REAL DEFAULT 3.0,
    popularMajors TEXT DEFAULT '[]',
    type TEXT DEFAULT 'public',
    tuitionMin REAL DEFAULT 0,
    tuitionMax REAL DEFAULT 0,
    offeredScholarships TEXT DEFAULT '[]',
    city TEXT DEFAULT 'N/A',
    hasOnCampusHousing INTEGER DEFAULT 0,
    website TEXT,
    applicationUrl TEXT,
    domain TEXT DEFAULT NULL,
    generatedApplicationUrl TEXT DEFAULT NULL
  );

`);

// --- Dynamic Schema Migration for Pre-existing Databases ---
try {
  const profileTableInfo = db.prepare("PRAGMA table_info(profiles)").all() as { name: string }[];
  const existingProfileCols = new Set(profileTableInfo.map(col => col.name));
  
  const profileColsToAdd = [
    { name: 'educationLevel', type: 'TEXT' },
    { name: 'highSchoolName', type: 'TEXT' },
    { name: 'collegeName', type: 'TEXT' },
    { name: 'primaryMajor', type: 'TEXT' },
    { name: 'secondaryMajor', type: 'TEXT' },
    { name: 'minor', type: 'TEXT' },
    { name: 'graduationYear', type: 'INTEGER' },
    { name: 'additionalSkills', type: 'TEXT' },
    { name: 'resumePdf', type: 'TEXT' },
    { name: 'rewardedActions', type: 'TEXT' },
    { name: 'oLevelSubjects', type: 'TEXT' },
    { name: 'aLevelSubjects', type: 'TEXT' },
    { name: 'satScore', type: 'INTEGER' },
    { name: 'profilePicture', type: 'TEXT' },
    { name: 'lastDailyCheckin', type: 'TEXT' },
    { name: 'hasCompletedOnboarding', type: 'INTEGER DEFAULT 0' },
    { name: 'customGeminiKey', type: 'TEXT' }
  ];

  for (const col of profileColsToAdd) {
    if (!existingProfileCols.has(col.name)) {
      db.exec(`ALTER TABLE profiles ADD COLUMN ${col.name} ${col.type}`);
      console.log(`[SQLite Migration] Automatically appended missing column to profiles: ${col.name}`);
    }
  }

  const appTableInfo = db.prepare("PRAGMA table_info(applications)").all() as { name: string }[];
  const existingAppCols = new Set(appTableInfo.map(col => col.name));
  
  const appColsToAdd = [
    { name: 'notes', type: 'TEXT' },
    { name: 'checklist', type: 'TEXT' }
  ];

  for (const col of appColsToAdd) {
    if (!existingAppCols.has(col.name)) {
      db.exec(`ALTER TABLE applications ADD COLUMN ${col.name} ${col.type}`);
      console.log(`[SQLite Migration] Automatically appended missing column to applications: ${col.name}`);
    }
  }
} catch (migrationErr) {
  console.error("[SQLite Migration Error]: Failed to align pre-existing datatypes:", migrationErr);
}

// --- Type Converter Helpers ---
function deserializeProfile(row: any): Profile | null {
  if (!row) return null;
  return {
    fullName: row.fullName,
    level: row.level,
    points: row.points,
    intendedMajor: row.intendedMajor,
    intendedDegree: row.intendedDegree,
    country: row.country,
    nationality: row.nationality,
    gpa: row.gpa,
    maxGpa: row.maxGpa,
    ieltsScore: row.ieltsScore || undefined,
    greScore: row.greScore || undefined,
    leadershipExperience: JSON.parse(row.leadershipExperience || '[]'),
    projects: JSON.parse(row.projects || '[]'),
    volunteerExperience: JSON.parse(row.volunteerExperience || '[]'),
    badges: JSON.parse(row.badges || '[]'),
    educationLevel: row.educationLevel || undefined,
    highSchoolName: row.highSchoolName || undefined,
    collegeName: row.collegeName || undefined,
    primaryMajor: row.primaryMajor || undefined,
    secondaryMajor: row.secondaryMajor || undefined,
    minor: row.minor || undefined,
    graduationYear: row.graduationYear !== null ? row.graduationYear : undefined,
    additionalSkills: JSON.parse(row.additionalSkills || '[]'),
    resumePdf: row.resumePdf || undefined,
    rewardedActions: JSON.parse(row.rewardedActions || '[]'),
    oLevelSubjects: JSON.parse(row.oLevelSubjects || '[]'),
    aLevelSubjects: JSON.parse(row.aLevelSubjects || '[]'),
    satScore: row.satScore !== null && row.satScore !== undefined ? row.satScore : null,
    profilePicture: row.profilePicture || undefined,
    lastDailyCheckin: row.lastDailyCheckin || undefined,
    hasCompletedOnboarding: row.hasCompletedOnboarding === 1,
    customGeminiKey: row.customGeminiKey || undefined
  };
}

// --- Query Database Helper Functions ---

export function getUserByUsername(username: string): any {
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)');
  return stmt.get(username);
}

export function getUserByUserId(id: string): any {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

export function getProfileByUserId(userId: string): Profile | null {
  const stmt = db.prepare('SELECT * FROM profiles WHERE user_id = ?');
  const row = stmt.get(userId);
  return deserializeProfile(row);
}

export function getProfileByUsername(username: string): Profile | null {
  const stmt = db.prepare('SELECT * FROM profiles WHERE LOWER(username) = LOWER(?)');
  const row = stmt.get(username);
  return deserializeProfile(row);
}

export function createNewUser(username: string, passwordHash: string, fullName: string, profile: Profile): string {
  const userId = 'usr-' + Date.now() + Math.random().toString(36).substr(2, 4);
  const profileId = 'prf-' + Date.now() + Math.random().toString(36).substr(2, 4);
  
  const insertUser = db.prepare('INSERT INTO users (id, username, password, createdAt) VALUES (?, ?, ?, ?)');
  const insertProfile = db.prepare(`
    INSERT INTO profiles (
      id, user_id, username, fullName, level, points, intendedMajor, intendedDegree,
      country, nationality, gpa, maxGpa, ieltsScore, greScore, leadershipExperience,
      projects, volunteerExperience, badges, educationLevel, highSchoolName, collegeName,
      primaryMajor, secondaryMajor, minor, graduationYear, additionalSkills, resumePdf,
      rewardedActions, oLevelSubjects, aLevelSubjects, satScore, profilePicture, lastDailyCheckin,
      hasCompletedOnboarding, customGeminiKey
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const runTx = db.transaction(() => {
    insertUser.run(userId, username, passwordHash, new Date().toISOString());
    insertProfile.run(
      profileId,
      userId,
      username,
      fullName,
      profile.level || 1,
      profile.points || 0,
      profile.intendedMajor || '',
      profile.intendedDegree || '',
      profile.country || 'Worldwide',
      profile.nationality || 'Global Explorer',
      profile.gpa || 3.0,
      profile.maxGpa || 4.0,
      profile.ieltsScore || null,
      profile.greScore || null,
      JSON.stringify(profile.leadershipExperience || []),
      JSON.stringify(profile.projects || []),
      JSON.stringify(profile.volunteerExperience || []),
      JSON.stringify(profile.badges || []),
      profile.educationLevel || null,
      profile.highSchoolName || null,
      profile.collegeName || null,
      profile.primaryMajor || null,
      profile.secondaryMajor || null,
      profile.minor || null,
      profile.graduationYear || null,
      JSON.stringify(profile.additionalSkills || []),
      profile.resumePdf || null,
      JSON.stringify(profile.rewardedActions || []),
      JSON.stringify(profile.oLevelSubjects || []),
      JSON.stringify(profile.aLevelSubjects || []),
      profile.satScore || null,
      profile.profilePicture || null,
      profile.lastDailyCheckin || null,
      profile.hasCompletedOnboarding ? 1 : 0,
      profile.customGeminiKey || null
    );
  });

  runTx();
  return userId;
}

export function saveProfile(username: string, updated: Partial<Profile>): void {
  const current = getProfileByUsername(username);
  if (!current) return;

  const merged = { ...current, ...updated };

  const stmt = db.prepare(`
    UPDATE profiles SET
      fullName = ?, level = ?, points = ?, intendedMajor = ?, intendedDegree = ?,
      country = ?, nationality = ?, gpa = ?, maxGpa = ?, ieltsScore = ?, greScore = ?,
      leadershipExperience = ?, projects = ?, volunteerExperience = ?, badges = ?,
      educationLevel = ?, highSchoolName = ?, collegeName = ?, primaryMajor = ?,
      secondaryMajor = ?, minor = ?, graduationYear = ?, additionalSkills = ?,
      resumePdf = ?, rewardedActions = ?, oLevelSubjects = ?, aLevelSubjects = ?,
      satScore = ?, profilePicture = ?, lastDailyCheckin = ?,
      hasCompletedOnboarding = ?, customGeminiKey = ?
    WHERE LOWER(username) = LOWER(?)
  `);

  stmt.run(
    merged.fullName,
    merged.level,
    merged.points,
    merged.intendedMajor,
    merged.intendedDegree,
    merged.country,
    merged.nationality,
    merged.gpa,
    merged.maxGpa,
    merged.ieltsScore || null,
    merged.greScore || null,
    JSON.stringify(merged.leadershipExperience || []),
    JSON.stringify(merged.projects || []),
    JSON.stringify(merged.volunteerExperience || []),
    JSON.stringify(merged.badges || []),
    merged.educationLevel || null,
    merged.highSchoolName || null,
    merged.collegeName || null,
    merged.primaryMajor || null,
    merged.secondaryMajor || null,
    merged.minor || null,
    merged.graduationYear || null,
    JSON.stringify(merged.additionalSkills || []),
    merged.resumePdf || null,
    JSON.stringify(merged.rewardedActions || []),
    JSON.stringify(merged.oLevelSubjects || []),
    JSON.stringify(merged.aLevelSubjects || []),
    merged.satScore || null,
    merged.profilePicture || null,
    merged.lastDailyCheckin || null,
    merged.hasCompletedOnboarding ? 1 : 0,
    merged.customGeminiKey || null,
    username
  );
}

export function getUserApplications(username: string): Application[] {
  const user = getUserByUsername(username);
  if (!user) return [];

  const stmt = db.prepare('SELECT * FROM applications WHERE user_id = ?');
  const rows = stmt.all(user.id);
  
  return (rows as any[]).map((row) => ({
    id: row.id,
    name: row.name,
    providerOrUni: row.providerOrUni,
    deadline: row.deadline,
    status: row.status as any,
    notes: row.notes || undefined,
    checklist: JSON.parse(row.checklist || '[]')
  }));
}

export function saveApplication(username: string, app: Application): void {
  const user = getUserByUsername(username);
  if (!user) return;

  const checkStmt = db.prepare('SELECT id FROM applications WHERE user_id = ? AND id = ?');
  const existing = checkStmt.get(user.id, app.id);

  if (existing) {
    const updateStmt = db.prepare(`
      UPDATE applications SET
        name = ?, providerOrUni = ?, deadline = ?, status = ?, notes = ?, checklist = ?
      WHERE user_id = ? AND id = ?
    `);
    updateStmt.run(
      app.name,
      app.providerOrUni,
      app.deadline,
      app.status,
      app.notes || null,
      JSON.stringify(app.checklist || []),
      user.id,
      app.id
    );
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO applications (id, user_id, name, providerOrUni, deadline, status, notes, checklist)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      app.id,
      user.id,
      app.name,
      app.providerOrUni,
      app.deadline,
      app.status,
      app.notes || null,
      JSON.stringify(app.checklist || [])
    );
  }
}

export function deleteApplication(username: string, appId: string): void {
  const user = getUserByUsername(username);
  if (!user) return;

  const stmt = db.prepare('DELETE FROM applications WHERE user_id = ? AND id = ?');
  stmt.run(user.id, appId);
}

export function getRoadmap(username: string): any[] | null {
  const user = getUserByUsername(username);
  if (!user) return null;

  const stmt = db.prepare('SELECT roadmap FROM roadmaps WHERE user_id = ?');
  const row = stmt.get(user.id);
  if (!row) return null;
  return JSON.parse((row as any).roadmap || '[]');
}

export function saveRoadmap(username: string, roadmap: any[]): void {
  const user = getUserByUsername(username);
  if (!user) return;

  const stmt = db.prepare('INSERT INTO roadmaps (user_id, roadmap) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET roadmap = EXCLUDED.roadmap');
  stmt.run(user.id, JSON.stringify(roadmap));
}

export function getNotifications(): AppNotification[] {
  const stmt = db.prepare('SELECT * FROM notifications ORDER BY ROWID DESC');
  const rows = stmt.all();

  return (rows as any[]).map((row) => ({
    id: row.id,
    type: row.type as any,
    message: row.message,
    timestamp: row.timestamp
  }));
}

export function addNotification(notification: AppNotification): void {
  const stmt = db.prepare('INSERT INTO notifications (id, type, message, timestamp) VALUES (?, ?, ?, ?)');
  stmt.run(notification.id, notification.type, notification.message, notification.timestamp);
}

export function getCommunityPosts(): CommunityPost[] {
  const stmt = db.prepare('SELECT * FROM community_posts ORDER BY ROWID DESC');
  const rows = stmt.all();

  return (rows as any[]).map((row) => ({
    id: row.id,
    author: row.author,
    title: row.title,
    content: row.content,
    category: row.category,
    votes: row.votes,
    commentsCount: row.commentsCount,
    createdAt: row.createdAt
  }));
}

export function addCommunityPost(post: CommunityPost): void {
  const stmt = db.prepare(`
    INSERT INTO community_posts (id, author, title, content, category, votes, commentsCount, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    post.id,
    post.author,
    post.title,
    post.content,
    post.category,
    post.votes,
    post.commentsCount,
    post.createdAt
  );
}

export function voteCommunityPost(postId: string): void {
  const stmt = db.prepare('UPDATE community_posts SET votes = votes + 1 WHERE id = ?');
  stmt.run(postId);
}

// --- CV Builder Persistence Helpers ---
export function getCVData(username: string): CVData {
  const user = getUserByUsername(username);
  if (!user) {
    return {
      workExperience: [],
      internships: [],
      projects: [],
      skills: [],
      certifications: [],
      extracurriculars: []
    };
  }

  const stmt = db.prepare('SELECT * FROM cv_data WHERE user_id = ?');
  const row = stmt.get(user.id);
  
  if (!row) {
    return {
      workExperience: [],
      internships: [],
      projects: [],
      skills: [],
      certifications: [],
      extracurriculars: []
    };
  }

  return {
    workExperience: JSON.parse((row as any).workExperience || '[]'),
    internships: JSON.parse((row as any).internships || '[]'),
    projects: JSON.parse((row as any).projects || '[]'),
    skills: JSON.parse((row as any).skills || '[]'),
    certifications: JSON.parse((row as any).certifications || '[]'),
    extracurriculars: JSON.parse((row as any).extracurriculars || '[]')
  };
}

export function saveCVData(username: string, data: CVData): void {
  const user = getUserByUsername(username);
  if (!user) return;

  const stmt = db.prepare(`
    INSERT INTO cv_data (user_id, workExperience, internships, projects, skills, certifications, extracurriculars)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      workExperience = EXCLUDED.workExperience,
      internships = EXCLUDED.internships,
      projects = EXCLUDED.projects,
      skills = EXCLUDED.skills,
      certifications = EXCLUDED.certifications,
      extracurriculars = EXCLUDED.extracurriculars
  `);

  stmt.run(
    user.id,
    JSON.stringify(data.workExperience || []),
    JSON.stringify(data.internships || []),
    JSON.stringify(data.projects || []),
    JSON.stringify(data.skills || []),
    JSON.stringify(data.certifications || []),
    JSON.stringify(data.extracurriculars || [])
  );
}

// --- One-Time Migration Database Seeder ---
export function seedDatabaseIfEmpty(): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (count.count > 0) {
    console.log('[SQLite DB] Database already contains records. Skipping initial seeding.');
    return;
  }

  console.log('[SQLite DB] Initializing fresh database table seeds...');

  const usersToSeed = [
    {
      username: 'arif',
      fullName: 'Arif Rahaman',
      passwordPlain: 'password123',
      profile: {
        fullName: "Arif Rahaman",
        level: 2,
        points: 150,
        intendedMajor: "Computer Science",
        intendedDegree: "Master's Degree",
        country: "United States",
        nationality: "Bangladesh",
        gpa: 3.82,
        maxGpa: 4.0,
        ieltsScore: "7.5",
        greScore: "318",
        leadershipExperience: ["Student Computing Club Treasurer", "Bangladesh OpenSource Advocate"],
        projects: ["Retro Game Canvas", "ScholarPath Matrix Mock Engine"],
        volunteerExperience: ["Youth Programming Workshop Mentor"],
        badges: ["Scholar Pathfinder", "Exotic Architect"],
        educationLevel: "undergraduate",
        highSchoolName: "Dhaka Residency School",
        collegeName: "Dhaka College",
        primaryMajor: "Computer Science",
        secondaryMajor: "Mathematics",
        minor: "Statistics",
        graduationYear: 2024,
        additionalSkills: ["Python", "C++", "TypeScript", "Linear Algebra", "Data Structures", "Pytorch"],
        resumePdf: "",
        rewardedActions: []
      } as Profile,
      applications: [
        {
          id: "app-1",
          name: "Erasmus Mundus Joint Master Degree",
          providerOrUni: "European Commission",
          deadline: "2026-12-15",
          status: "In Progress",
          notes: "Requires formal academic references from undergraduate mentors and detailed motivation drafts about joint laboratory courses.",
          checklist: [
            { text: "Take IELTS test (Target > 7.5)", done: true },
            { text: "Draft Statement of Purpose (SOP)", done: false },
            { text: "Collect 2 reference letters", done: false },
            { text: "Prepare bachelor certified transcripts", done: true }
          ]
        },
        {
          id: "app-2",
          name: "DAAD Development Scholarship",
          providerOrUni: "German Academic Exchange Service",
          deadline: "2026-11-30",
          status: "Saved",
          notes: "Requires 2+ years of professional development-related work experience, and CV formatted according to German Europass standards.",
          checklist: [
            { text: "Format modern Europass CV", done: false },
            { text: "Draft DAAD specific research plan", done: false },
            { text: "Acquire employer reference sign-off", done: false }
          ]
        }
      ] as Application[]
    },
    {
      username: 'guest',
      fullName: 'Guest Pathfinder',
      passwordPlain: 'guest123',
      profile: {
        fullName: "Guest Pathfinder",
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
      } as Profile,
      applications: [] as Application[]
    }
  ];

  for (const item of usersToSeed) {
    const salt = bcrypt.genSaltSync(8);
    const passHash = bcrypt.hashSync(item.passwordPlain, salt);
    
    const userId = createNewUser(item.username, passHash, item.fullName, item.profile);
    
    // Seed applications for this user
    for (const app of item.applications) {
      const stmtApp = db.prepare(`
        INSERT INTO applications (id, user_id, name, providerOrUni, deadline, status, notes, checklist)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmtApp.run(
        app.id,
        userId,
        app.name,
        app.providerOrUni,
        app.deadline,
        app.status,
        app.notes || null,
        JSON.stringify(app.checklist || [])
      );
    }
  }

  // Seed default global notifications
  const defaultNotifs = [
    {
      id: "notif-1",
      type: "info" as const,
      message: "ScholarPath update: DAAD EPOS eligibility GPA index updated. Minimum requirements now configured to 3.0.",
      timestamp: "2 hours ago"
    },
    {
      id: "notif-2",
      type: "warning" as const,
      message: "Fulbright Student application deadline is in 100 days! Submit your drafts to ScholarPath essay evaluation engine.",
      timestamp: "1 day ago"
    }
  ];

  for (const notif of defaultNotifs) {
    addNotification(notif);
  }

  // Seed default community posts
  const defaultPosts = [
    {
      id: "post-1",
      author: "Zarif_M",
      title: "How to draft a competitive SOP for German Universities",
      content: "When drafting Statement of Purpose essays for German graduate Informatics, do NOT write emotional or vague claims. German admissions committees prioritize technical facts, exact curriculum prerequisites (such as verified ECTS points in Linear Algebra or operating systems), and your future laboratory research interest. Make it a professional review!",
      category: "Essays & SOP",
      votes: 45,
      commentsCount: 9,
      createdAt: "2026-06-15"
    },
    {
      id: "post-2",
      author: "Nabila_CS",
      title: "My interview experience with Erasmus Mundus panel",
      content: "Just finished my panel interview for Joint Media Computing! The panel consisted of 3 professors (one from France, one from Greece, and one from Germany). They asked 3 main questions: 1) Why joint-multiversity instead of one traditional uni? 2) Elaborate ECTS gaps on your transcripts. 3) Explain your specific bachelor's project framework. Use our mockup interviewer terminal to practice!",
      category: "Interviews",
      votes: 31,
      commentsCount: 5,
      createdAt: "2026-06-16"
    }
  ];

  for (const post of defaultPosts) {
    addCommunityPost(post);
  }

  console.log('[SQLite DB] Initial database table seeds created successfully!');
}

// Function to seed universities on first load or if empty
export function seedUniversitiesIfEmpty(): void {
  const countUnis = db.prepare('SELECT COUNT(*) as count FROM universities').get() as { count: number };
  if (countUnis.count === 0) {
    console.log('[SQLite DB] Seeding universities table from raw json stream...');
    const universitiesPath = path.join(process.cwd(), 'data', 'universities.json');
    if (fs.existsSync(universitiesPath)) {
      try {
        const rawUnis = JSON.parse(fs.readFileSync(universitiesPath, 'utf-8'));
        const insertUni = db.prepare(`
          INSERT OR IGNORE INTO universities (
            id, name, country, ranking, acceptanceRate, averageGpa, popularMajors, type,
            tuitionMin, tuitionMax, offeredScholarships, city, hasOnCampusHousing, website, applicationUrl, domain, generatedApplicationUrl
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const tx = db.transaction((list: any[]) => {
          for (const uni of list) {
            insertUni.run(
              uni.id || ('uni-' + Math.random().toString(36).substr(2, 9)),
              uni.name,
              uni.country || 'Worldwide',
              uni.ranking !== undefined ? uni.ranking : 9999,
              uni.acceptanceRate || 'N/A',
              uni.averageGpa !== undefined ? uni.averageGpa : 3.0,
              JSON.stringify(uni.popularMajors || []),
              uni.type || 'public',
              uni.tuitionMin !== undefined ? uni.tuitionMin : 0,
              uni.tuitionMax !== undefined ? uni.tuitionMax : 0,
              JSON.stringify(uni.offeredScholarships || []),
              uni.city || 'N/A',
              uni.hasOnCampusHousing ? 1 : 0,
              uni.website || null,
              uni.applicationUrl || null,
              uni.domain || null,
              uni.generatedApplicationUrl || null
            );
          }
        });
        tx(rawUnis);
        console.log(`[SQLite DB] Successfully seeded ${rawUnis.length} standard universities.`);
      } catch (err) {
        console.error("[Seeding Universities Error]:", err);
      }
    }
  }
}

export interface GetUniversitiesOptions {
  search?: string;
  country?: string;
  type?: string;
  sortBy?: string;
  onCampusHousing?: boolean;
  limit: number;
  page: number;
}

export function getUniversitiesFromDb(options: GetUniversitiesOptions): { total: number; universities: any[] } {
  let query = 'SELECT * FROM universities WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM universities WHERE 1=1';
  const params: any[] = [];

  if (options.search) {
    const s = `%${options.search}%`;
    query += ' AND (name LIKE ? OR city LIKE ? OR popularMajors LIKE ? OR country LIKE ?)';
    countQuery += ' AND (name LIKE ? OR city LIKE ? OR popularMajors LIKE ? OR country LIKE ?)';
    params.push(s, s, s, s);
  }

  if (options.country && options.country !== 'all') {
    query += ' AND LOWER(country) = LOWER(?)';
    countQuery += ' AND LOWER(country) = LOWER(?)';
    params.push(options.country);
  }

  if (options.type && options.type !== 'all') {
    query += ' AND type = ?';
    countQuery += ' AND type = ?';
    params.push(options.type);
  }

  if (options.onCampusHousing) {
    query += ' AND hasOnCampusHousing = 1';
    countQuery += ' AND hasOnCampusHousing = 1';
  }

  // Sorting
  if (options.sortBy) {
    if (options.sortBy === 'ranking_asc') {
      query += ' ORDER BY ranking ASC';
    } else if (options.sortBy === 'tuition_asc') {
      query += ' ORDER BY tuitionMin ASC';
    } else if (options.sortBy === 'tuition_desc') {
      query += ' ORDER BY tuitionMin DESC';
    } else if (options.sortBy === 'gpa_desc') {
      query += ' ORDER BY averageGpa DESC';
    } else if (options.sortBy === 'alphabetical') {
      query += ' ORDER BY name ASC';
    } else {
      query += ' ORDER BY ranking ASC';
    }
  } else {
    query += ' ORDER BY ranking ASC';
  }

  // Count
  const countStmt = db.prepare(countQuery);
  const totalRow = countStmt.get(...params) as { total: number };
  const total = totalRow ? totalRow.total : 0;

  // Pagination
  const page = Math.max(1, options.page);
  const limit = Math.max(1, options.limit);
  const offset = (page - 1) * limit;

  query += ' LIMIT ? OFFSET ?';
  const selectStmt = db.prepare(query);
  const rows = selectStmt.all(...params, limit, offset) as any[];

  const universities = rows.map(row => ({
    id: row.id,
    name: row.name,
    country: row.country,
    ranking: row.ranking,
    acceptanceRate: row.acceptanceRate,
    averageGpa: row.averageGpa,
    popularMajors: JSON.parse(row.popularMajors || '[]'),
    type: row.type,
    tuitionMin: row.tuitionMin,
    tuitionMax: row.tuitionMax,
    offeredScholarships: JSON.parse(row.offeredScholarships || '[]'),
    city: row.city,
    hasOnCampusHousing: !!row.hasOnCampusHousing,
    website: row.website,
    applicationUrl: row.applicationUrl,
    domain: row.domain || undefined,
    generatedApplicationUrl: row.generatedApplicationUrl || undefined
  }));

  return { total, universities };
}

// Auto-seed the database on load if empty
seedDatabaseIfEmpty();
seedUniversitiesIfEmpty();


