import express, { Request, Response } from 'express';
import { scholarshipsData } from './db.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const {
      search,
      gpa_min,
      gpa_max,
      degreeLevel,
      eligibleCountries,
      fundingType,
      sortBy,
      page,
      limit
    } = req.query;

    let results = [...scholarshipsData];

    // 1. Text Search matching name, provider, description
    if (search) {
      const s = String(search).toLowerCase();
      results = results.filter(sch => 
        sch.name.toLowerCase().includes(s) || 
        sch.provider.toLowerCase().includes(s) ||
        sch.description.toLowerCase().includes(s)
      );
    }

    // 2. GPA requirement filter ranges
    if (gpa_min) {
      const minVal = parseFloat(String(gpa_min));
      if (!isNaN(minVal)) {
        results = results.filter(sch => sch.gpaRequirement >= minVal);
      }
    }
    if (gpa_max) {
      const maxVal = parseFloat(String(gpa_max));
      if (!isNaN(maxVal)) {
        results = results.filter(sch => sch.gpaRequirement <= maxVal);
      }
    }

    // 3. Degree Level Filter (handles single query items or arrays)
    if (degreeLevel) {
      const degArray = Array.isArray(degreeLevel) 
        ? degreeLevel.map(d => String(d).toLowerCase())
        : [String(degreeLevel).toLowerCase()];

      results = results.filter(sch => 
        sch.degreeLevel.some(dl => degArray.includes(dl.toLowerCase()))
      );
    }

    // 4. Eligible Countries Filter
    if (eligibleCountries) {
      const countriesArray = Array.isArray(eligibleCountries)
        ? eligibleCountries.map(c => String(c).toLowerCase())
        : [String(eligibleCountries).toLowerCase()];

      results = results.filter(sch => 
        sch.eligibleCountries.some(ec => 
          ec.toLowerCase() === 'worldwide' || countriesArray.includes(ec.toLowerCase())
        )
      );
    }

    // 5. Funding Type Filter (e.g. "Fully Funded", "Partially Funded")
    if (fundingType) {
      const fType = String(fundingType).toLowerCase();
      results = results.filter(sch => {
        const fc = sch.fundingCoverage.toLowerCase();
        if (fType === 'fully') {
          return fc.includes('fully funded');
        } else if (fType === 'partial') {
          return fc.includes('partially funded') || fc.includes('partial');
        }
        return true;
      });
    }

    // 6. Sort parameters
    if (sortBy) {
      const sortStr = String(sortBy);
      if (sortStr === 'gpa_asc') {
        results.sort((a, b) => a.gpaRequirement - b.gpaRequirement);
      } else if (sortStr === 'gpa_desc') {
        results.sort((a, b) => b.gpaRequirement - a.gpaRequirement);
      } else if (sortStr === 'score_desc') {
        results.sort((a, b) => b.competitivenessScore - a.competitivenessScore);
      } else if (sortStr === 'deadline_asc') {
        results.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      } else if (sortStr === 'alphabetical') {
        results.sort((a, b) => a.name.localeCompare(b.name));
      }
    } else {
      // Default fallback sorting by competitiveness rating
      results.sort((a, b) => b.competitivenessScore - a.competitivenessScore);
    }

    // 7. Pagination settings
    const totalCount = results.length;
    const pageIndex = isNaN(parseInt(String(page))) ? 1 : Math.max(1, parseInt(String(page)));
    const limitIndex = isNaN(parseInt(String(limit))) ? 1000 : Math.max(1, parseInt(String(limit)));

    const start = (pageIndex - 1) * limitIndex;
    const end = start + limitIndex;
    const paginatedResults = results.slice(start, end);

    res.json({
      total: totalCount,
      page: pageIndex,
      limit: limitIndex,
      totalPages: Math.ceil(totalCount / limitIndex),
      scholarships: paginatedResults
    });

  } catch (error: any) {
    res.status(500).json({ error: "Failed to extract filtered scholarship matrix indices." });
  }
});

export default router;
