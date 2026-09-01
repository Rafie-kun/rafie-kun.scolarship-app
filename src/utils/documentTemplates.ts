export const COUNTRY_TEMPLATES: Record<string, { name: string; items: string[] }> = {
  Germany: {
    name: 'Germany (DAAD / Uni-Assist)',
    items: [
      'Blocked account (Sperrkonto) — €11,208 for 12 months, open 6 weeks before visa',
      'Health insurance (public: TK, AOK) — required before enrollment',
      'APS certificate (for India, China, Vietnam) — if applicable to your country',
      'Uni-assist VPD if applying via uni-assist',
    ]
  },
  'United States': {
    name: 'United States (F-1)',
    items: [
      'I-20 from SEVP-certified university',
      'SEVIS fee receipt (I-901)',
      'DS-160 confirmation + visa appointment',
      'Bank statement covering 1-year tuition + living (as on I-20)',
    ]
  },
  'United Kingdom': {
    name: 'United Kingdom (Student Visa)',
    items: [
      'CAS from licensed sponsor',
      '28-day bank statement (maintenance funds)',
      'TB test certificate (if required for your country)',
      'ATAS certificate for certain STEM research courses',
    ]
  },
  Canada: {
    name: 'Canada (Study Permit)',
    items: [
      'Letter of Acceptance + Provincial Attestation Letter (PAL)',
      'GIC of $20,635 CAD (SDS stream) or full proof of funds',
      'Biometrics + medical exam (if requested)',
    ]
  },
  Australia: {
    name: 'Australia (Subclass 500)',
    items: [
      'Confirmation of Enrolment (CoE)',
      'Genuine Student (GS) statement',
      'Overseas Student Health Cover (OSHC)',
      'Financial capacity evidence',
    ]
  },
  Global: {
    name: 'General (all destinations)',
    items: [
      'Passport valid 6+ months beyond stay',
      'Academic transcripts + degree certificates (certified translations)',
      'Two recommendation letters (on letterhead, signed)',
      'CV / Resume (1-2 pages, Europass for Europe)',
    ]
  }
};

export function getTemplateForCountry(country: string | undefined): { name: string; items: string[] } {
  if (!country) return COUNTRY_TEMPLATES.Global;
  return COUNTRY_TEMPLATES[country] || COUNTRY_TEMPLATES.Global;
}
