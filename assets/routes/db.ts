import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { Profile, Scholarship, University, Application, AppNotification, CommunityPost } from '../src/types';

// JWT Configuration & salt-hashing
export const JWT_SECRET = process.env.JWT_SECRET || "scholarpath_cybermatrix_gold_2026_xyz";

// User database structures with updated fields
export const profilesMap: Record<string, Profile> = {
  "arif": {
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
  },
  "guest": {
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
  }
};

// In-memory passwords registry (key: username, value: salted hash)
export const passwordsMap: Record<string, string> = {
  "arif": bcrypt.hashSync("password123", 8),
  "guest": bcrypt.hashSync("guest123", 8)
};

// --- DYNAMIC DATA LOAD FROM JSON CHANNELS ---
export let scholarshipsData: Scholarship[] = [];
export let universitiesData: University[] = [];

try {
  const scholarshipsPath = path.join(process.cwd(), 'data', 'scholarships.json');
  if (fs.existsSync(scholarshipsPath)) {
    scholarshipsData = JSON.parse(fs.readFileSync(scholarshipsPath, 'utf-8'));
  }
} catch (err) {
  console.error("Failed to load scholarships json database, fallback to inline", err);
}

try {
  const universitiesPath = path.join(process.cwd(), 'data', 'universities.json');
  if (fs.existsSync(universitiesPath)) {
    universitiesData = JSON.parse(fs.readFileSync(universitiesPath, 'utf-8'));
  }
} catch (err) {
  console.error("Failed to load universities json database, fallback to inline", err);
}

export const mockApplications: Application[] = [
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
];

export const userApplicationsMap: Record<string, Application[]> = {
  "arif": [...mockApplications],
  "guest": []
};

export const notificationsData: AppNotification[] = [
  {
    id: "notif-1",
    type: "info",
    message: "ScholarPath update: DAAD EPOS eligibility GPA index updated. Minimum requirements now configured to 3.0.",
    timestamp: "2 hours ago"
  },
  {
    id: "notif-2",
    type: "warning",
    message: "Fulbright Student application deadline is in 100 days! Submit your drafts to ScholarPath essay evaluation engine.",
    timestamp: "1 day ago"
  }
];

export const communityPostsData: CommunityPost[] = [
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
