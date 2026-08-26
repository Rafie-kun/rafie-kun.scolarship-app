import Parser from 'rss-parser';

// Sources focused on internships & fellowships for international students.
const INTERNSHIP_SOURCES = [
  'https://news.google.com/rss/search?q=paid+internship+international+students+2026&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=research+internship+fellowship+undergraduate+abroad&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=%22internship%22+UN+OR+CERN+OR+EMBL+OR+World+Bank+students&hl=en-US&gl=US&ceid=US:en'
];

const MAJOR_KEYWORDS: Array<[string, string[]]> = [
  ['Computer Science', ['software', 'computer', 'engineering', 'tech', 'data', 'ai ', 'machine learning', 'developer']],
  ['Data Science', ['data', 'analytics', 'statistics', 'ai ', 'machine learning']],
  ['Electrical Engineering', ['electrical', 'electronics', 'hardware', 'embedded']],
  ['Mechanical Engineering', ['mechanical', 'manufacturing', 'automotive', 'aerospace']],
  ['Business Administration', ['business', 'finance', 'marketing', 'consulting', 'economics']],
  ['Biomedical Sciences', ['biomedical', 'biology', 'health', 'medical', 'pharma', 'genomics']]
];

function guessMajors(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const [major, keywords] of MAJOR_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) matched.push(major);
  }
  return matched.length > 0 ? Array.from(new Set(matched)) : ['All Fields'];
}

function guessRegion(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('europe') || lower.includes('germany') || lower.includes('cern') || lower.includes('embl') || lower.includes('switzerland') || lower.includes('france') || lower.includes('uk ') || lower.includes('netherlands')) return 'Europe';
  if (lower.includes('asia') || lower.includes('japan') || lower.includes('india') || lower.includes('singapore') || lower.includes('china') || lower.includes('korea')) return 'Asia';
  if (lower.includes('africa') || lower.includes('kenya') || lower.includes('nigeria')) return 'Africa';
  if (lower.includes('australia') || lower.includes('new zealand')) return 'Oceania';
  if (lower.includes('us ') || lower.includes('u.s.') || lower.includes('america') || lower.includes('usa')) return 'North America';
  return 'Global';
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export interface ScrapedInternship {
  id: string;
  name: string;
  provider: string;
  description: string;
  officialWebsite: string;
  applicationUrl: string;
  type: string;
  duration: string;
  stipend: number;
  stipendCurrency: string;
  applicationDeadline: string;
  eligibleCountries: string[];
  eligibleMajors: string[];
  eligibleDegreeLevels: string[];
  minGPA: number;
  country: string;
  region: string;
  isRemote: boolean;
  lastVerified: string;
  source: string;
}

export async function scrapeInternships(): Promise<ScrapedInternship[]> {
  const parser = new Parser({ headers: { 'User-Agent': 'ScholarPath-Bot/1.0' } });
  const results: ScrapedInternship[] = [];
  const now = new Date().toISOString().slice(0, 10);

  console.log('[🔄] Fetching internship & fellowship sources...');
  for (const url of INTERNSHIP_SOURCES) {
    try {
      const feed = await parser.parseURL(url);
      console.log(`[OK] Retrieved ${feed.items.length} records from: ${url}`);
      for (const item of feed.items) {
        const title = item.title || '';
        if (!title.toLowerCase().includes('intern')) continue; // only true internship listings

        // Google News titles end with " - SourceName"; prefer that as the provider
        const dashParts = title.split(' - ');
        const derivedProvider = dashParts.length >= 2
          ? dashParts[dashParts.length - 1].trim()
          : (item.creator || 'Industry Partner');
        const cleanTitle = dashParts.length >= 2 ? dashParts.slice(0, -1).join(' - ') : title;

        results.push({
          id: `int-scraped-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: cleanTitle.slice(0, 180),
          provider: derivedProvider.slice(0, 100),
          description: (item.contentSnippet || item.content || item.description || 'No description provided.').slice(0, 600),
          officialWebsite: item.link || '#',
          applicationUrl: item.link || '#',
          type: title.toLowerCase().includes('research') ? 'research' : 'paid',
          duration: 'Not specified',
          stipend: title.toLowerCase().includes('paid') ? 1500 : 0,
          stipendCurrency: 'USD',
          applicationDeadline: futureDate(90),
          eligibleCountries: ['Worldwide'],
          eligibleMajors: guessMajors(title + ' ' + (item.contentSnippet || '')),
          eligibleDegreeLevels: ['Undergraduate', 'Master', 'PhD'],
          minGPA: 0,
          country: 'Multiple',
          region: guessRegion(title),
          isRemote: title.toLowerCase().includes('remote'),
          lastVerified: now,
          source: 'rss'
        });
      }
    } catch (err: any) {
      console.warn(`[⚠️] Failed to parse internship source ${url}: ${err.message}`);
    }
  }

  // De-duplicate within this run by normalized title
  const seen = new Set<string>();
  const unique = results.filter(item => {
    const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 120);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[OK] ${unique.length} unique internship listings discovered.`);
  return unique;
}
