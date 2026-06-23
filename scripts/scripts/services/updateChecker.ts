import { db } from '../../db/index';
import { scholarshipsData } from '../../routes/db';
import { Scholarship, University } from '../../src/types';

export function compareScholarships(scrapedScholarships: Scholarship[]): { newItems: Scholarship[]; updatedItems: Scholarship[] } {
  const newItems: Scholarship[] = [];
  const updatedItems: Scholarship[] = [];

  // Match against existing database entities in memory/json
  const existingNames = new Set(scholarshipsData.map(s => s.name.toLowerCase().trim()));
  const existingMap = new Map<string, Scholarship>(scholarshipsData.map(s => [s.name.toLowerCase().trim(), s]));

  for (const item of scrapedScholarships) {
    const cleanName = item.name.toLowerCase().trim();
    if (!existingNames.has(cleanName)) {
      newItems.push({
        ...item,
        id: `sch-scraped-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      });
    } else {
      const existing = existingMap.get(cleanName)!;
      // If deadline or gpa requirement changed, mark as updated
      if (
        existing.deadline !== item.deadline ||
        existing.gpaRequirement !== item.gpaRequirement ||
        existing.fundingCoverage !== item.fundingCoverage
      ) {
        updatedItems.push({
          ...existing,
          ...item, // overlay updated facts
        });
      }
    }
  }

  return { newItems, updatedItems };
}

export function compareUniversities(scrapedUnis: any[]): { newItems: University[]; updatedItems: University[] } {
  const newItems: University[] = [];
  const updatedItems: University[] = [];

  try {
    // Collect existing universities in SQL database
    const existingRows = db.prepare('SELECT name, id, ranking, acceptanceRate, averageGpa, tuitionMin, tuitionMax, city, website, applicationUrl FROM universities').all() as any[];
    const existingNames = new Set(existingRows.map(u => u.name.toLowerCase().trim()));
    const existingMap = new Map<string, any>(existingRows.map(u => [u.name.toLowerCase().trim(), u]));

    for (const item of scrapedUnis) {
      const cleanName = item.name.toLowerCase().trim();
      if (!existingNames.has(cleanName)) {
        newItems.push({
          ...item,
          id: `uni-scraped-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        });
      } else {
        const existing = existingMap.get(cleanName)!;
        // See if ranking or average GPA changed
        if (
          existing.ranking !== item.ranking ||
          existing.averageGpa !== item.averageGpa ||
          existing.acceptanceRate !== item.acceptanceRate
        ) {
          updatedItems.push({
            ...existing,
            ...item, // overlay new fields
          });
        }
      }
    }
  } catch (err: any) {
    console.error('[⚠️] Error matching university records:', err);
  }

  return { newItems, updatedItems };
}
