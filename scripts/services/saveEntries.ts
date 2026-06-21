import fs from 'fs';
import path from 'path';
import { db } from '../../db/index';
import { scholarshipsData, universitiesData } from '../../routes/db';
import { Scholarship, University } from '../../src/types';

const scholarshipsPath = path.join(process.cwd(), 'data', 'scholarships.json');

export function saveNewScholarships(newSchs: Scholarship[]) {
  if (newSchs.length === 0) return;

  console.log(`[💾] Saving ${newSchs.length} new scholarships...`);

  // 1. Append to current in-memory array so server sees it instantly
  for (const sch of newSchs) {
    scholarshipsData.push(sch);
  }

  // 2. Append to scholarships.json file for file-based persistence upon reboot
  try {
    let currentFileContent: Scholarship[] = [];
    if (fs.existsSync(scholarshipsPath)) {
      const raw = fs.readFileSync(scholarshipsPath, 'utf-8');
      if (raw.trim()) {
        currentFileContent = JSON.parse(raw);
      }
    }

    const merged = [...currentFileContent, ...newSchs];
    fs.writeFileSync(scholarshipsPath, JSON.stringify(merged, null, 2), 'utf-8');
    console.log('[OK] Successfully updated data/scholarships.json file.');
  } catch (err: any) {
    console.error('[⚠️] Failed to write scholarships to file:', err.message);
  }
}

export function saveNewUniversities(newUnis: University[]) {
  if (newUnis.length === 0) return;

  console.log(`[💾] Saving ${newUnis.length} new universities to SQLite...`);

  const stmt = db.prepare(`
    INSERT INTO universities (
      id, name, country, ranking, acceptanceRate, averageGpa, popularMajors, type,
      tuitionMin, tuitionMax, offeredScholarships, city, hasOnCampusHousing, website, applicationUrl, domain
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const uni of newUnis) {
    try {
      stmt.run(
        uni.id,
        uni.name,
        uni.country,
        uni.ranking || 9999,
        uni.acceptanceRate || 'N/A',
        uni.averageGpa || 3.0,
        JSON.stringify(uni.popularMajors || []),
        uni.type || 'public',
        uni.tuitionMin || 0,
        uni.tuitionMax || 0,
        JSON.stringify(uni.offeredScholarships || []),
        uni.city || 'N/A',
        uni.hasOnCampusHousing ? 1 : 0,
        uni.website || '',
        uni.applicationUrl || '',
        (uni as any).domain || ''
      );

      // Push to in-memory array for live reactivity
      universitiesData.push(uni);
      console.log(`[OK] Inserted university: "${uni.name}"`);
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        console.warn(`[⚠️] University "${uni.name}" already in database, skipping insert.`);
      } else {
        console.error(`[❌] Error inserting university "${uni.name}":`, err.message);
      }
    }
  }
}

export function updateExistingScholarships(updatedSchs: Scholarship[]) {
  if (updatedSchs.length === 0) return;

  console.log(`[💾] Updating ${updatedSchs.length} existing scholarships...`);

  // 1. Update in-memory
  for (const sch of updatedSchs) {
    const idx = scholarshipsData.findIndex(s => s.id === sch.id || s.name.toLowerCase().trim() === sch.name.toLowerCase().trim());
    if (idx !== -1) {
      scholarshipsData[idx] = { ...scholarshipsData[idx], ...sch };
    }
  }

  // 2. Update json file
  try {
    if (fs.existsSync(scholarshipsPath)) {
      const raw = fs.readFileSync(scholarshipsPath, 'utf-8');
      if (raw.trim()) {
        const list: Scholarship[] = JSON.parse(raw);
        for (const sch of updatedSchs) {
          const idx = list.findIndex(s => s.name.toLowerCase().trim() === sch.name.toLowerCase().trim());
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...sch };
          }
        }
        fs.writeFileSync(scholarshipsPath, JSON.stringify(list, null, 2), 'utf-8');
      }
    }
  } catch (err: any) {
    console.error('[⚠️] Failed to update scholarships file:', err.message);
  }
}

export function updateExistingUniversities(updatedUnis: University[]) {
  if (updatedUnis.length === 0) return;

  console.log(`[💾] Updating ${updatedUnis.length} existing universities in SQLite...`);

  const stmt = db.prepare(`
    UPDATE universities SET
      ranking = ?,
      acceptanceRate = ?,
      averageGpa = ?,
      website = ?,
      applicationUrl = ?
    WHERE name = ?
  `);

  for (const uni of updatedUnis) {
    try {
      stmt.run(
        uni.ranking || 9999,
        uni.acceptanceRate || 'N/A',
        uni.averageGpa || 3.0,
        uni.website || '',
        uni.applicationUrl || '',
        uni.name
      );

      // Update in-memory array for index coherence
      const idx = universitiesData.findIndex(u => u.name.toLowerCase().trim() === uni.name.toLowerCase().trim());
      if (idx !== -1) {
        universitiesData[idx] = { ...universitiesData[idx], ...uni };
      }
      console.log(`[OK] Updated university: "${uni.name}"`);
    } catch (err: any) {
      console.error(`[❌] Error updating university "${uni.name}":`, err.message);
    }
  }
}
