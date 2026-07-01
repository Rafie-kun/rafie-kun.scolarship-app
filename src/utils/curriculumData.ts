export interface Curriculum {
  id: string;
  name: string;
  description: string;
  grades: string[];
  subjects: string[];
  defaultCourseType: 'standard' | 'ap' | 'ib' | 'honors';
}

export const CURRICULA_LIST: Curriculum[] = [
  {
    id: 'cambridge',
    name: 'Cambridge (O Level / IGCSE / AS & A Level)',
    description: 'UK International standard. Includes O Level/IGCSE (Grade 9-10) and AS/A Level (Grade 11-12).',
    grades: ['A*', 'A', 'B', 'C', 'D', 'E', 'U'],
    subjects: [
      'Mathematics',
      'Additional Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'Economics',
      'English Language',
      'English Literature',
      'Business Studies',
      'Accounting',
      'Psychology',
      'History',
      'Geography',
      'Sociology',
      'Art & Design'
    ],
    defaultCourseType: 'standard'
  },
  {
    id: 'ib',
    name: 'International Baccalaureate (IB)',
    description: 'Swiss-based rigorous framework. Divided into High Level (HL) and Standard Level (SL).',
    grades: ['7', '6', '5', '4', '3', '2', '1'],
    subjects: [
      'Mathematics HL',
      'Mathematics SL',
      'Physics HL',
      'Physics SL',
      'Chemistry HL',
      'Chemistry SL',
      'Biology HL',
      'Biology SL',
      'Computer Science HL',
      'Economics HL',
      'Economics SL',
      'English A Literature HL',
      'History HL',
      'Business Management SL',
      'Theory of Knowledge (TOK)',
      'Extended Essay (EE)'
    ],
    defaultCourseType: 'ib'
  },
  {
    id: 'ap',
    name: 'Advanced Placement (AP)',
    description: 'US college-level coursework administered by College Board.',
    grades: ['5', '4', '3', '2', '1'],
    subjects: [
      'AP Calculus AB',
      'AP Calculus BC',
      'AP Physics 1',
      'AP Physics 2',
      'AP Physics C: Mechanics',
      'AP Chemistry',
      'AP Biology',
      'AP Computer Science A',
      'AP Computer Science Principles',
      'AP Statistics',
      'AP Microeconomics',
      'AP Macroeconomics',
      'AP English Language and Composition',
      'AP Psychology',
      'AP US History',
      'AP World History'
    ],
    defaultCourseType: 'ap'
  },
  {
    id: 'us_high_school',
    name: 'US High School Diploma',
    description: 'Standard North American high school curriculum (GPA 0.0-4.0).',
    grades: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
    subjects: [
      'Algebra I/II',
      'Geometry',
      'Pre-Calculus',
      'English Literature',
      'World History',
      'US History',
      'Earth Science',
      'Environmental Science',
      'Spanish I/II',
      'Physical Education',
      'Health Education',
      'Civics'
    ],
    defaultCourseType: 'standard'
  },
  {
    id: 'cbse_icse',
    name: 'CBSE / ICSE (India)',
    description: 'National education curriculum standards of India.',
    grades: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E'],
    subjects: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'Economics',
      'English Core',
      'Accountancy',
      'Business Studies',
      'History',
      'Political Science',
      'Geography'
    ],
    defaultCourseType: 'standard'
  },
  {
    id: 'bangladesh_national',
    name: 'Bangladesh National Curriculum (NCTB)',
    description: 'SSC and HSC public examination framework.',
    grades: ['A+', 'A', 'A-', 'B', 'C', 'D', 'F'],
    subjects: [
      'Mathematics',
      'Higher Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'ICT (Information & Communication Tech)',
      'English',
      'Bangla',
      'Bangladesh and Global Studies',
      'Accounting',
      'Finance & Banking',
      'Economics'
    ],
    defaultCourseType: 'standard'
  },
  {
    id: 'other',
    name: 'Other National Curriculum',
    description: 'Any school-specific, regional or national educational system.',
    grades: ['A', 'B', 'C', 'D', 'E', 'F', 'Pass', 'Fail'],
    subjects: [
      'Mathematics',
      'Science',
      'Social Studies',
      'Language Arts',
      'Foreign Language',
      'Information Technology',
      'Music',
      'Physical Education'
    ],
    defaultCourseType: 'standard'
  }
];

export const EDUCATION_PATH_OPTIONS = [
  { id: 'secondary_only', label: 'Secondary School Only (Grade 9-10 / IGCSE / SSC)' },
  { id: 'high_school_only', label: 'High School Only (Grade 11-12 / HSC)' },
  { id: 'full_k12', label: 'Secondary + High School (O-Level + A-Level / SSC + HSC)' },
  { id: 'undergrad_bsc', label: 'Undergraduate Scholar (B.Sc / B.A / B.Eng)' },
  { id: 'postgrad_msc', label: 'Postgraduate / Master\'s (M.Sc / M.A / MBA)' },
  { id: 'gap_year', label: 'Currently taking a Gap Year' }
];

export const WORLD_COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'Australia', 
  'Japan', 'Singapore', 'Netherlands', 'Switzerland', 'France', 
  'Bangladesh', 'India', 'Pakistan', 'Malaysia', 'New Zealand', 'South Africa'
];
