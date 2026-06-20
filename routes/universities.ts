import express, { Request, Response } from 'express';
import { universitiesData } from './db';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { search, country, type, sortBy, onCampusHousing, limit, page } = req.query;

    let results = [...universitiesData];

    // 1. Text Search matching name, city, popularMajors
    if (search) {
      const s = String(search).toLowerCase();
      results = results.filter(u => 
        u.name.toLowerCase().includes(s) || 
        u.city.toLowerCase().includes(s) ||
        u.popularMajors.some(m => m.toLowerCase().includes(s))
      );
    }

    // 2. Country Filter
    if (country && country !== 'all') {
      const c = String(country).toLowerCase();
      results = results.filter(u => u.country.toLowerCase() === c);
    }

    // 3. Type Filter
    if (type && type !== 'all') {
      results = results.filter(u => u.type === type);
    }

    // 4. Housing Filter
    if (onCampusHousing === 'true') {
      results = results.filter(u => u.hasOnCampusHousing);
    }

    // 5. Sorting
    if (sortBy) {
      const s = String(sortBy);
      if (s === 'ranking_asc') {
        results.sort((a, b) => a.ranking - b.ranking);
      } else if (s === 'tuition_asc') {
        results.sort((a, b) => a.tuitionMin - b.tuitionMin);
      } else if (s === 'tuition_desc') {
        results.sort((a, b) => b.tuitionMin - a.tuitionMin);
      } else if (s === 'gpa_desc') {
        results.sort((a, b) => b.averageGpa - a.averageGpa);
      } else if (s === 'alphabetical') {
        results.sort((a, b) => a.name.localeCompare(b.name));
      }
    } else {
      // Default: sort by best ranking
      results.sort((a, b) => a.ranking - b.ranking);
    }

    // Page indices and limits
    const totalCount = results.length;
    const pageIndex = isNaN(parseInt(String(page))) ? 1 : Math.max(1, parseInt(String(page)));
    const limitIndex = isNaN(parseInt(String(limit))) ? 1000 : Math.max(1, parseInt(String(limit)));

    const startIndex = (pageIndex - 1) * limitIndex;
    const endIndex = startIndex + limitIndex;
    const paginated = results.slice(startIndex, endIndex);

    res.json({
      total: totalCount,
      page: pageIndex,
      limit: limitIndex,
      totalPages: Math.ceil(totalCount / limitIndex),
      universities: paginated
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to query the university grid indices." });
  }
});

export default router;
