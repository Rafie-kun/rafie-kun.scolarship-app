import { SubjectGrade, calculateAcademicProfile } from './calculations';

/**
 * Pure function to calculate estimated university admission competitiveness.
 * Returns a score from 10 to 99 representing candidate standing.
 */
export function calculateCompetitiveness(subjects: SubjectGrade[], estimatedGpa: number): number {
  let score = Math.round((estimatedGpa / 4.0) * 80); // Base GPA contributes 80 points

  // AP, IB, and Honors categories increase rigour standing
  const advancedRigourCount = subjects.filter(
    (s) => s.type === 'ap' || s.type === 'ib' || s.type === 'honors'
  ).length;
  score += Math.min(15, advancedRigourCount * 3);

  // General subject volume contributes breadth standing
  if (subjects.length >= 6) {
    score += 5;
  }

  return Math.max(10, Math.min(99, score));
}

/**
 * Calculates a monthly wage estimate based on tax rules and legal constraints.
 */
export function calculateNetMonthlyWage(
  hourlyWage: number,
  hoursPerWeek: number,
  taxAllowanceYearly: number,
  baseTaxRatePercent: number,
  socialContributionsPercent: number
): {
  grossMonthly: number;
  monthlyTax: number;
  monthlySocial: number;
  netMonthly: number;
} {
  const grossMonthly = hourlyWage * hoursPerWeek * 4.33;
  const grossYearly = grossMonthly * 12;

  let yearlyTax = 0;
  if (grossYearly > taxAllowanceYearly) {
    yearlyTax = (grossYearly - taxAllowanceYearly) * (baseTaxRatePercent / 100);
  }

  const yearlySocial = grossYearly * (socialContributionsPercent / 100);

  const monthlyTax = yearlyTax / 12;
  const monthlySocial = yearlySocial / 12;
  const netMonthly = Math.max(0, grossMonthly - (monthlyTax + monthlySocial));

  return {
    grossMonthly,
    monthlyTax,
    monthlySocial,
    netMonthly,
  };
}
