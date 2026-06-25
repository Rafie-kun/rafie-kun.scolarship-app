import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index';
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
  const __filename = import.meta.url ? new URL(import.meta.url).pathname : '';
  const __dirname = __filename ? path.dirname(__filename) : process.cwd();
  
  const searchPaths = [
    path.join(process.cwd(), 'public', 'data', 'scholarships.json'),
    path.join(process.cwd(), 'data', 'scholarships.json'),
    path.join(__dirname, '..', 'public', 'data', 'scholarships.json'),
    path.join(__dirname, '..', 'data', 'scholarships.json'),
    path.join(__dirname, '../../public/data', 'scholarships.json'),
    path.join(__dirname, '../../data', 'scholarships.json'),
    path.join('/var/task', 'public', 'data', 'scholarships.json'),
    path.join('/var/task', 'data', 'scholarships.json')
  ];
  
  let scholarshipsPath = '';
  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      scholarshipsPath = p;
      break;
    }
  }

  if (scholarshipsPath) {
    const raw = JSON.parse(fs.readFileSync(scholarshipsPath, 'utf-8'));
    // Map mock URLs to authentic website URLs dynamically
    scholarshipsData = raw.map((sch: any) => {
      const provider = (sch.provider || "").toLowerCase();
      const name = (sch.name || "").toLowerCase();
      
      let official = sch.officialWebsite || "https://www.ieeff.org";
      let apply = sch.applicationUrl || "https://www.ieeff.org";

      if (provider.includes("european commission") || name.includes("erasmus")) {
        official = "https://ec.europa.eu/programmes/erasmus-plus/opportunities/individuals/students/erasmus-mundus-joint-masters_en";
        apply = "https://ec.europa.eu/programmes/erasmus-plus/opportunities/individuals/students/erasmus-mundus-joint-masters_en";
      } else if (provider.includes("united states") || name.includes("fulbright")) {
        official = "https://foreign.fulbrightprogram.org/";
        apply = "https://foreign.fulbrightprogram.org/about/how-to-apply";
      } else if (provider.includes("german academic") || name.includes("daad")) {
        official = "https://www.daad.de/en/";
        apply = "https://www.daad.de/en/study-and-research-in-germany/scholarships/";
      } else if (provider.includes("commonwealth") || name.includes("commonwealth")) {
        official = "https://cscuk.fcdo.gov.uk/scholarships/";
        apply = "https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/";
      } else if (provider.includes("stanford") || name.includes("knight-hennessy")) {
        official = "https://knight-hennessy.stanford.edu/";
        apply = "https://knight-hennessy.stanford.edu/apply";
      } else if (provider.includes("rhodes") || name.includes("rhodes")) {
        official = "https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/";
        apply = "https://www.rhodeshouse.ox.ac.uk/scholarships/apply/";
      } else if (provider.includes("gates cambridge") || name.includes("gates cambridge")) {
        official = "https://www.gatescambridge.org/";
        apply = "https://www.gatescambridge.org/apply/how-to-apply/";
      } else if (provider.includes("schwarzman") || name.includes("schwarzman")) {
        official = "https://www.schwarzmanscholars.org/";
        apply = "https://www.schwarzmanscholars.org/admissions/apply/";
      } else if (provider.includes("singapore") || name.includes("singa")) {
        official = "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa";
        apply = "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa";
      } else if (provider.includes("government of ireland") || name.includes("ireland")) {
        official = "https://research.ie/funding/postgraduate-funding-opportunities/";
        apply = "https://research.ie/funding/postgraduate-funding-opportunities/";
      } else if (provider.includes("swedish institute") || name.includes("swedish institute")) {
        official = "https://si.se/en/apply/scholarships/";
        apply = "https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/";
      } else if (provider.includes("australia awards") || name.includes("australia awards")) {
        official = "https://www.dfat.gov.uk/people-to-people/australia-awards/australia-awards-scholarships-aas";
        apply = "https://www.dfat.gov.uk/people-to-people/australia-awards/australia-awards-scholarships-aas";
      } else if (provider.includes("mext") || name.includes("mext")) {
        official = "https://www.mext.go.jp/a_menu/koutou/ryugaku/boshu/1418721.htm";
        apply = "https://www.mext.go.jp/a_menu/koutou/ryugaku/boshu/1418721.htm";
      } else if (provider.includes("turkey") || name.includes("türkiye")) {
        official = "https://www.turkiyeburslari.gov.tr/";
        apply = "https://www.turkiyeburslari.gov.tr/";
      } else if (provider.includes("korea") || name.includes("global korea")) {
        official = "https://www.studyinkorea.go.kr/";
        apply = "https://www.studyinkorea.go.kr/";
      } else if (provider.includes("china scholarship council") || name.includes("csc")) {
        official = "https://www.campuschina.org/";
        apply = "https://www.campuschina.org/";
      } else if (provider.includes("oxford") || provider.includes("clarendon")) {
        official = "https://www.ox.ac.uk/admissions/graduate/fees-and-funding/oxford-funding/clarendon-fund";
        apply = "https://www.ox.ac.uk/admissions/graduate/fees-and-funding/oxford-funding/clarendon-fund";
      } else {
        if (official.includes("scholarpath-portal.org")) {
          official = "https://www.ieeff.org";
          apply = "https://www.ieeff.org";
        }
      }

      return {
        ...sch,
        officialWebsite: official,
        applicationUrl: apply
      };
    });
  }
} catch (err) {
  console.error("Failed to load scholarships json database, fallback to inline", err);
}

try {
  const rows = db.prepare('SELECT * FROM universities').all() as any[];
  if (rows && rows.length > 0) {
    universitiesData = rows.map(row => ({
      id: row.id,
      name: row.name,
      country: row.country,
      ranking: row.ranking,
      acceptanceRate: row.acceptanceRate,
      averageGpa: row.averageGpa,
      popularMajors: JSON.parse(row.popularMajors || '[]'),
      type: row.type || 'public',
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
  } else {
    const __filename = import.meta.url ? new URL(import.meta.url).pathname : '';
    const __dirname = __filename ? path.dirname(__filename) : process.cwd();
    
    const searchPaths = [
      path.join(process.cwd(), 'data', 'universities.json'),
      path.join(__dirname, '..', 'data', 'universities.json'),
      path.join(__dirname, '../../data', 'universities.json'),
      path.join('/var/task', 'data', 'universities.json')
    ];
    
    let universitiesPath = '';
    for (const p of searchPaths) {
      if (fs.existsSync(p)) {
        universitiesPath = p;
        break;
      }
    }
    
    if (universitiesPath) {
      universitiesData = JSON.parse(fs.readFileSync(universitiesPath, 'utf-8'));
    }
  }
} catch (err) {
  console.error("Failed to load universities from SQL database, fallback to file", err);
  const __filename = import.meta.url ? new URL(import.meta.url).pathname : '';
  const __dirname = __filename ? path.dirname(__filename) : process.cwd();
  
  const searchPaths = [
    path.join(process.cwd(), 'data', 'universities.json'),
    path.join(__dirname, '..', 'data', 'universities.json'),
    path.join(__dirname, '../../data', 'universities.json'),
    path.join('/var/task', 'data', 'universities.json')
  ];
  
  let universitiesPath = '';
  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      universitiesPath = p;
      break;
    }
  }
  
  if (universitiesPath) {
    universitiesData = JSON.parse(fs.readFileSync(universitiesPath, 'utf-8'));
  }
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
