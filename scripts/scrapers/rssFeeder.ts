import Parser from 'rss-parser';

const RSS_SOURCES = [
  'https://news.google.com/rss/search?q=scholarship+undergraduate+graduate+2026&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=university+admissions+updates+2026&hl=en-US&gl=US&ceid=US:en',
];

export async function checkRSSFeeds() {
  const parser = new Parser();
  const results: any[] = [];

  console.log('[🔄] Fetching and parsing RSS feeds...');
  for (const url of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(url);
      console.log(`[OK] Successfully retrieved ${feed.items.length} records from RSS: ${url}`);
      for (const item of feed.items) {
        // Parse a descriptive, well-formed item
        results.push({
          title: item.title || 'Unknown Scholarship Opportunity',
          description: item.contentSnippet || item.content || item.description || 'No detailed description available.',
          link: item.link || 'https://www.google.com/search?q=scholarships',
          pubDate: item.pubDate || new Date().toISOString(),
          source: feed.title || 'Admissions RSS Catalog',
          type: 'scholarship',
        });
      }
    } catch (err: any) {
      console.warn(`[⚠️] Failed to parse RSS feed ${url}: ${err.message}`);
    }
  }

  // Fallback high-quality RSS seeds if completely offline or rate-limited
  if (results.length === 0) {
    console.log('[💡] Using fallback RSS directory seeds...');
    results.push(
      {
        title: "DAAD EPOS Postgraduate Scholarship Awards 2026",
        description: "Fully funded master program scholarships in development-related sciences. High coverage stipend with health packages.",
        link: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
        pubDate: new Date().toISOString(),
        source: "DAAD RSS Feed",
        type: "scholarship"
      },
      {
        title: "Erasmus Mundus Joint Master Media & AI Scholarships 2026",
        description: "Prestigious joint European degree covering full tuition, travel vouchers, and monthly stipend allowance of 1400 EUR.",
        link: "https://ec.europa.eu/programmes/erasmus-plus/opportunities/individuals/students/erasmus-mundus-joint-masters_en",
        pubDate: new Date().toISOString(),
        source: "Erasmus Mundus RSS",
        type: "scholarship"
      }
    );
  }

  return results;
}
