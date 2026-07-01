import { Profile, Scholarship, University } from '../types';

/**
 * ScholarPath Academic calculations engine.
 * Houses GPA conversion, weighting, competitiveness indexing, and admissions prediction models.
 */

export interface SubjectGrade {
  subject: string;
  grade: string; // e.g., 'A*', 'A', 'B', 'C', '7', '6', '5', '4', '5', '4', '3'
  type: 'standard' | 'ap' | 'ib' | 'honors';
  category: 'stem' | 'humanities' | 'languages' | 'arts';
}

export interface AcademicAnalyticsResult {
  estimatedGpa: number;
  weightedGpa: number;
  overallAverage: number;
  subjectAverages: Record<string, number>;
  academicStrength: 'Developing' | 'Standard' | 'Advanced' | 'Elite' | 'Mythic';
  admissionReadiness: 'Low Readiness' | 'Preparing' | 'Admissions Target Matched' | 'Exceptional Candidate';
}

// Map A-F grades to standard GPA points (on 4.0 scale)
export const O_LEVEL_TO_GPA: Record<string, number> = {
  'A*': 4.0, 'A': 3.7, 'B': 3.3, 'C': 3.0, 'D': 2.3, 'E': 2.0, 'F': 0.0
};

// Map IB scores 1-7 to GPA points (on 4.0 scale)
export const IB_TO_GPA: Record<number, number> = {
  7: 4.0, 6: 3.7, 5: 3.3, 4: 3.0, 3: 2.3, 2: 2.0, 1: 0.0
};

// Map AP scores 1-5 to GPA points (on 4.0 scale)
export const AP_TO_GPA: Record<number, number> = {
  5: 4.0, 4: 3.7, 3: 3.0, 2: 2.0, 1: 0.0
};

/**
 * Converts a subject grade string/number to a standard 4.0 GPA point
 */
export function gradeToGpaPoint(grade: string, type: string): number {
  const cleanGrade = grade.trim().toUpperCase();
  
  if (type === 'ib') {
    const num = parseInt(cleanGrade, 10);
    return IB_TO_GPA[num] !== undefined ? IB_TO_GPA[num] : 3.0;
  }
  
  if (type === 'ap') {
    const num = parseInt(cleanGrade, 10);
    return AP_TO_GPA[num] !== undefined ? AP_TO_GPA[num] : 3.0;
  }
  
  // High school standard or O/A levels
  return O_LEVEL_TO_GPA[cleanGrade] !== undefined ? O_LEVEL_TO_GPA[cleanGrade] : 3.0;
}

/**
 * Converts grade to a percentage score for calculating averages
 */
export function gradeToPercentage(grade: string, type: string): number {
  const cleanGrade = grade.trim().toUpperCase();
  
  if (type === 'ib') {
    const num = parseInt(cleanGrade, 10);
    return isNaN(num) ? 75 : Math.round((num / 7) * 100);
  }
  
  if (type === 'ap') {
    const num = parseInt(cleanGrade, 10);
    return isNaN(num) ? 75 : Math.round((num / 5) * 100);
  }
  
  const pctMap: Record<string, number> = {
    'A*': 98, 'A': 88, 'B': 78, 'C': 68, 'D': 58, 'E': 48, 'F': 20
  };
  return pctMap[cleanGrade] || 75;
}

/**
 * Performs full academic profiling on a set of subject grades
 */
export function calculateAcademicProfile(subjects: SubjectGrade[]): AcademicAnalyticsResult {
  if (!subjects || subjects.length === 0) {
    return {
      estimatedGpa: 3.0,
      weightedGpa: 3.0,
      overallAverage: 75,
      subjectAverages: { stem: 75, humanities: 75, languages: 75, arts: 75 },
      academicStrength: 'Standard',
      admissionReadiness: 'Preparing'
    };
  }

  let totalUnweightedGpa = 0;
  let totalWeightedGpa = 0;
  let totalPercentage = 0;
  
  const categorySums: Record<string, number> = { stem: 0, humanities: 0, languages: 0, arts: 0 };
  const categoryCounts: Record<string, number> = { stem: 0, humanities: 0, languages: 0, arts: 0 };

  subjects.forEach(sub => {
    const unweighted = gradeToGpaPoint(sub.grade, sub.type);
    let weightBonus = 0;
    
    if (sub.type === 'ap' || sub.type === 'ib') {
      weightBonus = 1.0;
    } else if (sub.type === 'honors') {
      weightBonus = 0.5;
    }
    
    const weighted = Math.min(4.5, unweighted + weightBonus);
    const pct = gradeToPercentage(sub.grade, sub.type);

    totalUnweightedGpa += unweighted;
    totalWeightedGpa += weighted;
    totalPercentage += pct;

    const cat = sub.category || 'stem';
    categorySums[cat] = (categorySums[cat] || 0) + pct;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const count = subjects.length;
  const estimatedGpa = Number((totalUnweightedGpa / count).toFixed(2));
  const weightedGpa = Number((totalWeightedGpa / count).toFixed(2));
  const overallAverage = Math.round(totalPercentage / count);

  const subjectAverages: Record<string, number> = {};
  Object.keys(categorySums).forEach(cat => {
    const catCount = categoryCounts[cat];
    subjectAverages[cat] = catCount > 0 ? Math.round(categorySums[cat] / catCount) : 75;
  });

  // Calculate Academic Strength
  let academicStrength: AcademicAnalyticsResult['academicStrength'] = 'Standard';
  if (weightedGpa >= 4.2) academicStrength = 'Mythic';
  else if (weightedGpa >= 3.8) academicStrength = 'Elite';
  else if (weightedGpa >= 3.5) academicStrength = 'Advanced';
  else if (weightedGpa >= 3.0) academicStrength = 'Standard';
  else academicStrength = 'Developing';

  // Calculate Admission Readiness
  let admissionReadiness: AcademicAnalyticsResult['admissionReadiness'] = 'Preparing';
  if (estimatedGpa >= 3.8 && count >= 5) admissionReadiness = 'Exceptional Candidate';
  else if (estimatedGpa >= 3.4 && count >= 4) admissionReadiness = 'Admissions Target Matched';
  else if (estimatedGpa >= 2.8) admissionReadiness = 'Preparing';
  else admissionReadiness = 'Low Readiness';

  return {
    estimatedGpa,
    weightedGpa,
    overallAverage,
    subjectAverages,
    academicStrength,
    admissionReadiness
  };
}

/**
 * Calculates how competitive a user's GPA is against a scholarship's requirements.
 * Returns a score between 0 and 100.
 */
export function calculateScholarshipCompetitiveness(
  profile: Profile | null,
  scholarship: Scholarship
): number {
  if (!profile) return 50;

  const userGpa = profile.gpa || 3.0;
  const reqGpa = scholarship.gpaRequirement || 3.0;

  if (userGpa < reqGpa) {
    // If user's GPA is below requirement, competitiveness drops exponentially but starts from a baseline representing hope
    const ratio = userGpa / reqGpa;
    return Math.round(ratio * 40); // Max 40% chance if they are under requirements
  }

  // If user meets/exceeds requirement:
  const margin = userGpa - reqGpa;
  let score = 70; // Meet requirement baseline

  // Scale score up based on how much they exceed the minimum
  score += Math.min(20, margin * 40); // Up to +20% for high GPA margin

  // Extra points for resume, badges, or portfolio
  const badgeCount = profile.badges?.length || 0;
  score += Math.min(10, badgeCount * 2.5); // Up to +10% for active quest badges

  return Math.min(100, Math.round(score));
}

/**
 * Calculates a user's admissions compatibility score and predicted probability of admission
 * for a specific university.
 */
export function calculateUniversityCompetitiveness(
  profile: Profile | null,
  university: University
): {
  compatibilityScore: number;
  predictedProbability: number;
  status: 'Reachable' | 'Target' | 'Reach' | 'Highly Competitive';
} {
  if (!profile) {
    return { compatibilityScore: 50, predictedProbability: 50, status: 'Target' };
  }

  const userGpa = profile.gpa || 3.0;
  const avgGpa = university.averageGpa || 3.5;
  const acceptanceRateVal = parseFloat(university.acceptanceRate || '30%') || 30;

  // 1. GPA Margin
  const gpaDiff = userGpa - avgGpa;
  let gpaScore = 50; // Starting baseline

  if (gpaDiff >= 0) {
    gpaScore += Math.min(30, gpaDiff * 60); // Up to +30 for exceeding average
  } else {
    gpaScore -= Math.min(40, Math.abs(gpaDiff) * 80); // Drops up to -40 for lagging average
  }

  // 2. Extracurricular Weight (projects, leadership badges)
  const portfolioPoints = Math.min(20, 
    ((profile.projects?.length || 0) * 4) + 
    ((profile.leadershipExperience?.length || 0) * 4) +
    ((profile.badges?.length || 0) * 2)
  );

  // 3. Overall Compatibility Index
  const compatibilityScore = Math.min(100, Math.max(10, Math.round(gpaScore + portfolioPoints)));

  // 4. Predicted Probability (adjusted by acceptance rate rigor)
  // Elite colleges with sub-10% acceptance rates cap probability heavily even with high compatibility
  let acceptanceModifier = 1.0;
  if (acceptanceRateVal < 6) acceptanceModifier = 0.4;
  else if (acceptanceRateVal < 12) acceptanceModifier = 0.65;
  else if (acceptanceRateVal < 25) acceptanceModifier = 0.85;

  const predictedProbability = Math.min(99, Math.max(5, Math.round(compatibilityScore * acceptanceModifier)));

  // 5. Reach status categorization
  let status: 'Reachable' | 'Target' | 'Reach' | 'Highly Competitive' = 'Target';
  if (acceptanceRateVal < 8) {
    status = 'Highly Competitive';
  } else if (gpaDiff < -0.2) {
    status = 'Reach';
  } else if (gpaDiff >= 0.1 && acceptanceRateVal > 25) {
    status = 'Reachable';
  } else {
    status = 'Target';
  }

  return {
    compatibilityScore,
    predictedProbability,
    status
  };
}
