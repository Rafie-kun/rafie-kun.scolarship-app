import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SubjectGrade, calculateAcademicProfile } from '../utils/calculations';
import { useAuth } from './AuthContext';

// Define structures matching our public/data JSONs
export interface CostOfLivingEntry {
  id: string;
  country: string;
  rentMonthly: number;
  foodMonthly: number;
  transportMonthly: number;
  healthInsuranceMonthly: number;
  miscMonthly?: number;
  currency: string;
}

export interface StudentJobEntry {
  title: string;
  hourlyWage: number;
  weeklyHourLimit: number;
  estimatedMonthlyEarnings: number;
  taxDeductionPercent: number;
  visaRestrictions: string;
  typicalEmployers: string;
  type: string;
}

export interface TaxRuleEntry {
  taxFreeAllowanceYearly: number;
  baseTaxRatePercent: number;
  estimatedSocialContributionsPercent: number;
  specialStudentRules: string;
  allowanceCurrency: string;
}

export interface UniversityEntry {
  id: string;
  name: string;
  country: string;
  type: 'private' | 'public';
  ranking: number;
  acceptanceRate: string;
  averageGpa: number;
  tuitionMin: number;
  tuitionMax: number;
  popularMajors: string[];
  offeredScholarships: string[];
  city: string;
  hasOnCampusHousing: boolean;
  website?: string;
  applicationUrl?: string;
  region: string;
}

export interface ScholarshipEntry {
  id: string;
  name: string;
  provider: string;
  description: string;
  amountMin: number;
  amountMax: number;
  currency: string;
  applicationDeadline: string;
  eligibilityCriteria: string[];
  targetDegree: string;
  fundingCoverage: string;
  eligibleCountries: string[];
  eligibleMajors: string[];
  gpaRequirement: number;
}

export interface OnboardingContextType {
  // Wizard Core Steps
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  
  // State variables for wizard forms
  selectedCurricula: string[];
  setSelectedCurricula: (curricula: string[]) => void;
  selectedPaths: string[];
  setSelectedPaths: (paths: string[]) => void;
  educationLevel: string;
  setEducationLevel: (level: string) => void;
  institutionName: string;
  setInstitutionName: (name: string) => void;
  country: string;
  setCountry: (country: string) => void;
  city: string;
  setCity: (city: string) => void;
  targetCountry: string;
  setTargetCountry: (country: string) => void;
  graduationYear: number;
  setGraduationYear: (year: number) => void;
  
  // Custom Path subjects
  subjects: (SubjectGrade & { path?: string })[];
  setSubjects: React.Dispatch<React.SetStateAction<(SubjectGrade & { path?: string })[]>>;
  
  // Income details
  stipend: number;
  setStipend: (val: number) => void;
  selectedJobIndex: number;
  setSelectedJobIndex: (idx: number) => void;
  hoursPerWeek: number;
  setHoursPerWeek: (val: number) => void;
  customHourlyWage: number;
  setCustomHourlyWage: (val: number) => void;
  otherIncome: number;
  setOtherIncome: (val: number) => void;

  // Expense details override sliders
  rent: number;
  setRent: (val: number) => void;
  food: number;
  setFood: (val: number) => void;
  transport: number;
  setTransport: (val: number) => void;
  utilities: number;
  setUtilities: (val: number) => void;
  insurance: number;
  setInsurance: (val: number) => void;
  entertainment: number;
  setEntertainment: (val: number) => void;
  health: number;
  setHealth: (val: number) => void;
  books: number;
  setBooks: (val: number) => void;
  personalCare: number;
  setPersonalCare: (val: number) => void;
  misc: number;
  setMisc: (val: number) => void;

  // Loaded DB Cache
  colData: CostOfLivingEntry[];
  jobsData: Record<string, StudentJobEntry[]>;
  taxRulesData: Record<string, TaxRuleEntry>;
  universitiesData: UniversityEntry[];
  scholarshipsData: ScholarshipEntry[];
  dataLoaded: boolean;

  // Dynamic Calculated State
  gpaResults: any;
  competitivenessScore: number;
  matchedScholarships: ScholarshipEntry[];
  recommendedLocalUnis: UniversityEntry[];
  recommendedTargetUnis: UniversityEntry[];

  // Financial Estimates
  monthlyGrossWage: number;
  estimatedYearlyTax: number;
  estimatedYearlySocial: number;
  monthlyNetWage: number;
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  monthlySavings: number;
  expenseRatio: number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  // Step and core properties
  const [step, setStep] = useState(1);
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>(['cambridge']);
  const [selectedPaths, setSelectedPaths] = useState<string[]>(['Full K-12 Route']);
  const [educationLevel, setEducationLevel] = useState('high_school');
  const [institutionName, setInstitutionName] = useState('');
  const [country, setCountry] = useState('United States');
  const [city, setCity] = useState('');
  const [targetCountry, setTargetCountry] = useState('United States');
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear() + 2);

  // Subject Grades (can be associated with specific paths)
  const [subjects, setSubjects] = useState<(SubjectGrade & { path?: string })[]>([
    { subject: 'Mathematics', grade: 'A', type: 'standard', category: 'stem', path: 'Full K-12 Route' },
    { subject: 'Physics', grade: 'A', type: 'standard', category: 'stem', path: 'Full K-12 Route' },
    { subject: 'English Language', grade: 'B', type: 'standard', category: 'languages', path: 'Full K-12 Route' }
  ]);

  // Income sources states
  const [stipend, setStipend] = useState<number>(0);
  const [selectedJobIndex, setSelectedJobIndex] = useState<number>(-1);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(15);
  const [customHourlyWage, setCustomHourlyWage] = useState<number>(12);
  const [otherIncome, setOtherIncome] = useState<number>(0);

  // Expenses override states
  const [rent, setRent] = useState<number>(500);
  const [food, setFood] = useState<number>(300);
  const [transport, setTransport] = useState<number>(100);
  const [utilities, setUtilities] = useState<number>(60);
  const [insurance, setInsurance] = useState<number>(120);
  const [entertainment, setEntertainment] = useState<number>(80);
  const [health, setHealth] = useState<number>(50);
  const [books, setBooks] = useState<number>(40);
  const [personalCare, setPersonalCare] = useState<number>(50);
  const [misc, setMisc] = useState<number>(100);

  // Databases states
  const [colData, setColData] = useState<CostOfLivingEntry[]>([]);
  const [jobsData, setJobsData] = useState<Record<string, StudentJobEntry[]>>({});
  const [taxRulesData, setTaxRulesData] = useState<Record<string, TaxRuleEntry>>({});
  const [universitiesData, setUniversitiesData] = useState<UniversityEntry[]>([]);
  const [scholarshipsData, setScholarshipsData] = useState<ScholarshipEntry[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load all external JSON databases
  useEffect(() => {
    const loadAllBudgetData = async () => {
      try {
        const [colRes, jobsRes, taxRes, uniRes, schRes] = await Promise.all([
          fetch('/data/cost_of_living.json').then(res => res.json()).catch(() => []),
          fetch('/data/student_jobs.json').then(res => res.json()).catch(() => ({})),
          fetch('/data/tax_rules.json').then(res => res.json()).catch(() => ({})),
          fetch('/data/universities.json').then(res => res.json()).catch(() => []),
          fetch('/data/scholarships.json').then(res => res.json()).catch(() => [])
        ]);

        const colList: CostOfLivingEntry[] = Array.isArray(colRes) ? colRes : (colRes.countries || []);
        setColData(colList);

        const jobsMap = jobsRes.countries || jobsRes || {};
        setJobsData(jobsMap);

        const taxMap = taxRes.countries || taxRes || {};
        setTaxRulesData(taxMap);

        setUniversitiesData(Array.isArray(uniRes) ? uniRes : []);
        setScholarshipsData(Array.isArray(schRes) ? schRes : []);
        setDataLoaded(true);

        // Preconfigure user profile if exists
        if (profile?.country) {
          setTargetCountry(profile.country);
        }
        if (profile?.nationality) {
          setCountry(profile.nationality);
        }
        if (profile?.highSchoolName || profile?.collegeName) {
          setInstitutionName(profile.highSchoolName || profile.collegeName || '');
        }
      } catch (e) {
        console.error("Could not load wizard reference databases:", e);
        setDataLoaded(true); // set true anyway so steps can proceed with backups
      }
    };

    loadAllBudgetData();
  }, [profile]);

  // Sync expenses and wage defaults whenever the selected target country changes
  useEffect(() => {
    if (!targetCountry || colData.length === 0) return;

    const col = colData.find(c => c.country.toLowerCase() === targetCountry.toLowerCase()) || 
                colData.find(c => c.country === 'United States') || colData[0];
                
    const countryJobs = jobsData[targetCountry] || jobsData['United States'] || [];
    const firstJob = countryJobs[0];

    // Expenses Default from Cost of Living
    if (col) {
      setRent(col.rentMonthly || 600);
      setFood(col.foodMonthly || 300);
      setTransport(col.transportMonthly || 100);
      setInsurance(col.healthInsuranceMonthly || 120);
      setMisc(col.miscMonthly || 100);
      setUtilities(60);
      setEntertainment(80);
      setHealth(50);
      setBooks(40);
      setPersonalCare(50);
    }

    // Student Jobs Default
    if (firstJob) {
      setSelectedJobIndex(0);
      setCustomHourlyWage(firstJob.hourlyWage);
      setHoursPerWeek(15);
    } else {
      setSelectedJobIndex(-1);
      setCustomHourlyWage(12);
      setHoursPerWeek(15);
    }
  }, [targetCountry, colData, jobsData]);

  // Dynamic Calculated State Memoization
  const gpaResults = useMemo(() => {
    return calculateAcademicProfile(subjects);
  }, [subjects]);

  const competitivenessScore = useMemo(() => {
    const baseGpa = gpaResults.estimatedGpa;
    let score = Math.round((baseGpa / 4.0) * 80); // GPA contributes up to 80 points
    
    // Add points for challenging subject types (AP, IB, Honors)
    const challengesCount = subjects.filter(s => s.type === 'ap' || s.type === 'ib' || s.type === 'honors').length;
    score += Math.min(15, challengesCount * 3);

    // Add points for subject volume
    if (subjects.length >= 6) {
      score += 5;
    }
    
    return Math.max(10, Math.min(99, score));
  }, [gpaResults, subjects]);

  // Filter scholarships matching profile
  const matchedScholarships = useMemo(() => {
    if (scholarshipsData.length === 0) return [];
    
    return scholarshipsData.filter(sch => {
      // Must meet GPA requirements
      if (gpaResults.estimatedGpa < sch.gpaRequirement) return false;

      // Match Country or Regional Eligibility
      const matchesNationality = sch.eligibleCountries.some(c => 
        c.toLowerCase() === 'global' || 
        c.toLowerCase() === 'worldwide' || 
        c.toLowerCase() === country.toLowerCase()
      );

      return matchesNationality;
    }).slice(0, 4);
  }, [scholarshipsData, gpaResults, country]);

  // Local Universities based on home country
  const recommendedLocalUnis = useMemo(() => {
    if (universitiesData.length === 0) return [];
    return universitiesData.filter(uni => uni.country.toLowerCase() === country.toLowerCase()).slice(0, 3);
  }, [universitiesData, country]);

  // Target destination Universities matching GPA requirements
  const recommendedTargetUnis = useMemo(() => {
    if (universitiesData.length === 0) return [];
    
    return universitiesData.filter(uni => {
      const matchCountry = uni.country.toLowerCase() === targetCountry.toLowerCase();
      const meetsGpa = gpaResults.estimatedGpa >= (uni.averageGpa - 0.4);
      return matchCountry && meetsGpa;
    }).sort((a, b) => a.ranking - b.ranking).slice(0, 3);
  }, [universitiesData, targetCountry, gpaResults]);

  // Income computations
  const monthlyGrossWage = useMemo(() => {
    if (selectedJobIndex < 0) return 0;
    return customHourlyWage * hoursPerWeek * 4.33;
  }, [selectedJobIndex, customHourlyWage, hoursPerWeek]);

  const yearlyGrossWage = monthlyGrossWage * 12;

  const countryTaxRules = useMemo(() => {
    return taxRulesData[targetCountry] || taxRulesData['United States'] || {
      taxFreeAllowanceYearly: 10000,
      baseTaxRatePercent: 15,
      estimatedSocialContributionsPercent: 5.0,
      specialStudentRules: "Standard part-time study concessions apply.",
      allowanceCurrency: "USD"
    };
  }, [taxRulesData, targetCountry]);

  const estimatedYearlyTax = useMemo(() => {
    if (yearlyGrossWage <= countryTaxRules.taxFreeAllowanceYearly) return 0;
    return (yearlyGrossWage - countryTaxRules.taxFreeAllowanceYearly) * (countryTaxRules.baseTaxRatePercent / 100);
  }, [yearlyGrossWage, countryTaxRules]);

  const estimatedYearlySocial = useMemo(() => {
    return yearlyGrossWage * (countryTaxRules.estimatedSocialContributionsPercent / 100);
  }, [yearlyGrossWage, countryTaxRules]);

  const monthlyNetWage = useMemo(() => {
    const monthlyTax = (estimatedYearlyTax + estimatedYearlySocial) / 12;
    return Math.max(0, monthlyGrossWage - monthlyTax);
  }, [monthlyGrossWage, estimatedYearlyTax, estimatedYearlySocial]);

  // Totals
  const totalMonthlyIncome = stipend + monthlyNetWage + otherIncome;
  
  const totalMonthlyExpenses = rent + food + transport + utilities + insurance + entertainment + health + books + personalCare + misc;

  const monthlySavings = totalMonthlyIncome - totalMonthlyExpenses;

  const expenseRatio = useMemo(() => {
    if (totalMonthlyIncome <= 0) return 100;
    return (totalMonthlyExpenses / totalMonthlyIncome) * 100;
  }, [totalMonthlyExpenses, totalMonthlyIncome]);

  return (
    <OnboardingContext.Provider value={{
      step,
      setStep,
      selectedCurricula,
      setSelectedCurricula,
      selectedPaths,
      setSelectedPaths,
      educationLevel,
      setEducationLevel,
      institutionName,
      setInstitutionName,
      country,
      setCountry,
      city,
      setCity,
      targetCountry,
      setTargetCountry,
      graduationYear,
      setGraduationYear,
      subjects,
      setSubjects,
      stipend,
      setStipend,
      selectedJobIndex,
      setSelectedJobIndex,
      hoursPerWeek,
      setHoursPerWeek,
      customHourlyWage,
      setCustomHourlyWage,
      otherIncome,
      setOtherIncome,
      rent,
      setRent,
      food,
      setFood,
      transport,
      setTransport,
      utilities,
      setUtilities,
      insurance,
      setInsurance,
      entertainment,
      setEntertainment,
      health,
      setHealth,
      books,
      setBooks,
      personalCare,
      setPersonalCare,
      misc,
      setMisc,
      colData,
      jobsData,
      taxRulesData,
      universitiesData,
      scholarshipsData,
      dataLoaded,
      gpaResults,
      competitivenessScore,
      matchedScholarships,
      recommendedLocalUnis,
      recommendedTargetUnis,
      monthlyGrossWage,
      estimatedYearlyTax,
      estimatedYearlySocial,
      monthlyNetWage,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      monthlySavings,
      expenseRatio
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
