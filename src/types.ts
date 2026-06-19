export interface Profile {
  fullName: string;
  level: number;
  points: number;
  intendedMajor: string;
  intendedDegree: string;
  country: string;
  nationality: string;
  gpa: number;
  maxGpa: number;
  ieltsScore?: string;
  greScore?: string;
  leadershipExperience: string[];
  projects: string[];
  volunteerExperience: string[];
  badges: string[];

  // 🚨 NEW FIELDS FOR INTEGRATED SCHOLARPATH DATABASE 🚨
  educationLevel?: string; // 'high_school' | 'college' | 'undergraduate' | 'graduate' | 'phd'
  highSchoolName?: string;
  collegeName?: string;
  primaryMajor?: string;
  secondaryMajor?: string;
  minor?: string;
  graduationYear?: number;
  additionalSkills?: string[];
  resumePdf?: string;
  lastDailyCheckin?: string;
  rewardedActions?: string[];
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  description: string;
  eligibleMajors: string[];
  eligibleCountries: string[];
  fundingCoverage: string;
  competitivenessScore: number;
  gpaRequirement: number;
  degreeLevel: string[];
  deadline: string;

  // 🚨 NEW DB FIELDS 🚨
  minimumEducationLevel?: string; // 'high_school' | 'college' | 'undergraduate' | 'graduate' | 'phd'
}

export interface University {
  id: string;
  name: string;
  country: string;
  ranking: number;
  acceptanceRate: string;
  averageGpa: number;
  tuitionFee?: string; // retaining for legacy support
  popularMajors: string[];

  // 🚨 NEW DB FIELDS 🚨
  type: 'public' | 'private';
  tuitionMin: number;
  tuitionMax: number;
  offeredScholarships?: string[];
  city: string;
  hasOnCampusHousing: boolean;
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface Application {
  id: string;
  name: string;
  providerOrUni: string;
  deadline: string;
  status: 'Saved' | 'In Progress' | 'Submitted' | 'Accepted' | 'Won';
  notes?: string;
  checklist: ChecklistItem[];
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning';
  message: string;
  timestamp: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  title: string;
  content: string;
  category: string;
  votes: number;
  commentsCount: number;
  createdAt: string;
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  university: string;
  scholarshipJoined: string;
  avatarUrl?: string;
  availability: string[];
}
