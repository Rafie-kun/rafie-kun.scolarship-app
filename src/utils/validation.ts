export interface ValidationResult {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'success';
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function validateGpa(gpa: number, maxGpa = 4.0): ValidationResult {
  if (isNaN(gpa) || gpa < 0) {
    return { isValid: false, message: 'GPA cannot be negative.', type: 'error' };
  }
  if (gpa > maxGpa) {
    return { isValid: false, message: `GPA cannot exceed maximum scale (${maxGpa}).`, type: 'error' };
  }
  if (gpa >= 3.5) {
    return { isValid: true, message: 'Outstanding GPA! Strong match for top fellowships.', type: 'success' };
  }
  if (gpa >= 3.0) {
    return { isValid: true, message: 'Good academic standing.', type: 'success' };
  }
  return { isValid: true, message: 'Consider adding strong test scores or research projects.', type: 'warning' };
}

export function validateUrl(url: string): boolean {
  if (!url) return true; // optional
  try {
    const formatted = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    new URL(formatted);
    return true;
  } catch {
    return false;
  }
}

export function validateProfileField(fieldName: string, value: any): ValidationResult {
  switch (fieldName) {
    case 'fullName':
      if (!validateRequired(value)) {
        return { isValid: false, message: 'Please enter your full name.', type: 'error' };
      }
      return { isValid: true, message: 'Full name looks good.', type: 'success' };

    case 'country':
    case 'nationality':
      if (!validateRequired(value)) {
        return { isValid: false, message: 'Please select your country.', type: 'error' };
      }
      return { isValid: true, message: 'Country verified.', type: 'success' };

    case 'educationLevel':
      if (!validateRequired(value)) {
        return { isValid: false, message: 'Please select your education level.', type: 'error' };
      }
      return { isValid: true, message: 'Education level selected.', type: 'success' };

    case 'universityName':
      if (!validateRequired(value)) {
        return { isValid: true, message: 'Adding your university helps us find better matches.', type: 'warning' };
      }
      return { isValid: true, message: 'University saved.', type: 'success' };

    case 'degree':
      if (!validateRequired(value)) {
        return { isValid: true, message: 'Your degree helps us recommend relevant opportunities.', type: 'warning' };
      }
      return { isValid: true, message: 'Degree registered.', type: 'success' };

    case 'fieldOfStudy':
    case 'primaryMajor':
      if (!validateRequired(value)) {
        return { isValid: true, message: 'Your field of study helps us personalize recommendations.', type: 'warning' };
      }
      return { isValid: true, message: 'Major registered.', type: 'success' };

    case 'linkedin':
    case 'github':
    case 'portfolio':
    case 'website':
    case 'twitter':
    case 'instagram':
      if (value && !validateUrl(value)) {
        return { isValid: false, message: 'Please enter a valid URL (e.g. https://...)', type: 'error' };
      }
      return { isValid: true };

    default:
      return { isValid: true };
  }
}
