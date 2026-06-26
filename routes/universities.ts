import express, { Request, Response } from 'express';
import { getUniversitiesFromDb } from '../db/index';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { search, country, type, sortBy, onCampusHousing, limit, page } = req.query;

    const limitVal = parseInt(String(limit || 20));
    const pageVal = parseInt(String(page || 1));

    const result = getUniversitiesFromDb({
      search: search ? String(search) : undefined,
      country: country ? String(country) : undefined,
      type: type ? String(type) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      onCampusHousing: onCampusHousing === 'true',
      limit: isNaN(limitVal) ? 20 : limitVal,
      page: isNaN(pageVal) ? 1 : pageVal
    });

    res.json({
      total: result.total,
      page: isNaN(pageVal) ? 1 : pageVal,
      limit: isNaN(limitVal) ? 20 : limitVal,
      totalPages: Math.ceil(result.total / (isNaN(limitVal) ? 20 : limitVal)),
      universities: result.universities
    });
  } catch (error: any) {
    console.error("Failed to query the university grid indices:", error);
    res.status(500).json({ error: "Failed to query the university grid indices." });
  }
});

export default router;
