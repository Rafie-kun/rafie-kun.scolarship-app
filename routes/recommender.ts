import express, { Request, Response } from 'express';
import { authenticateToken } from './auth.js';
import { scholarshipsData, universitiesData } from './db.js';
import { getProfileByUsername } from '../db/index.js';

const router = express.Router();

// 🚨 BEST SCHOLARSHIPS RECOMMENDER ENGINE 🚨
router.get('/best-scholarships', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const username = user.username;
    const profile = getProfileByUsername(username) || getProfileByUsername("arif");

    if (!profile) {
      return res.status(404).json({ error: "Profile not found for recommendation metrics." });
    }

    const { limit } = req.query;
    const limitNum = isNaN(parseInt(String(limit))) ? 6 : parseInt(String(limit));

    const recommendations = scholarshipsData.map(sch => {
      let score = 50; // base compatibility score
      const reasonParts: string[] = [];
      const userGpa = profile.gpa ?? 0;

      // 1. GPA Match
      const gpaDiff = userGpa - sch.gpaRequirement;
      if (gpaDiff >= 0) {
        score += 20;
        reasonParts.push(`Your GPA (${userGpa.toFixed(2)}) meets the minimum requirement of (${sch.gpaRequirement.toFixed(2)})`);
      } else {
        score -= 25;
        reasonParts.push(`Your GPA (${userGpa.toFixed(2)}) is slightly lower than the requested (${sch.gpaRequirement.toFixed(2)})`);
      }

      // 2. Intended Major Match
      const majorMatched = sch.eligibleMajors.some(m => 
        m.toLowerCase().includes(profile.intendedMajor.toLowerCase()) || 
        profile.intendedMajor.toLowerCase().includes(m.toLowerCase())
      );
      if (majorMatched) {
        score += 20;
        reasonParts.push(`Matches your active major focus in [${profile.intendedMajor}]`);
      }

      // 3. Nationality / Country eligibility Match
      const countryMatched = sch.eligibleCountries.some(c => 
        c.toLowerCase() === 'worldwide' || 
        c.toLowerCase().includes(profile.nationality.toLowerCase()) || 
        profile.nationality.toLowerCase().includes(c.toLowerCase())
      );
      if (countryMatched) {
        score += 15;
        reasonParts.push(`Your nationality (${profile.nationality}) is fully eligible`);
      }

      // 4. Education level / Intended Degree Level Match
      const degreeMatched = sch.degreeLevel.some(dl => 
        dl.toLowerCase().includes(profile.intendedDegree.toLowerCase()) || 
        profile.intendedDegree.toLowerCase().includes(dl.toLowerCase())
      );
      if (degreeMatched) {
        score += 10;
        reasonParts.push(`Aligned with your intended graduation plan (${profile.intendedDegree})`);
      }

      // Limit score bound
      const matchScore = Math.max(10, Math.min(99, score));
      
      return {
        scholarship: sch,
        matchScore,
        reasoning: reasonParts.join(". ") + "."
      };
    });

    // Sort by best match score descending
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.json(recommendations.slice(0, limitNum));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate scholarship recommendations." });
  }
});

// 🚨 BEST UNIVERSITIES RECOMMENDER ENGINE 🚨
router.get('/best-universities', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const username = user.username;
    const profile = getProfileByUsername(username) || getProfileByUsername("arif");

    if (!profile) {
      return res.status(404).json({ error: "Profile not found for university matching." });
    }

    // Filters from client
    const { 
      ranking_max, 
      tuition_max, 
      type, 
      on_campus_housing 
    } = req.query;

    let filtered = [...universitiesData];

    // Apply strict user/interface filters if defined
    if (ranking_max) {
      const maxRank = parseInt(String(ranking_max));
      if (!isNaN(maxRank)) {
        filtered = filtered.filter(u => u.ranking <= maxRank);
      }
    }
    if (tuition_max) {
      const maxT = parseFloat(String(tuition_max));
      if (!isNaN(maxT)) {
        filtered = filtered.filter(u => u.tuitionMin <= maxT);
      }
    }
    if (type && type !== 'all') {
      filtered = filtered.filter(u => u.type === type);
    }
    if (on_campus_housing === 'true') {
      filtered = filtered.filter(u => u.hasOnCampusHousing === true);
    }

    // Match scoring with user details
    const recommendations = filtered.map(uni => {
      let score = 60; // base score
      const reasons: string[] = [];
      const userGpa = profile.gpa ?? 0;

      // 1. GPA comparison
      if (userGpa >= uni.averageGpa) {
        score += 15;
        reasons.push(`Your GPA (${userGpa.toFixed(2)}) is highly competitive compared to their average incoming GPA of (${uni.averageGpa.toFixed(2)})`);
      } else if (userGpa >= uni.averageGpa - 0.3) {
        score += 5;
        reasons.push(`Your GPA is within range for standard enrollment.`);
      } else {
        score -= 20;
        reasons.push(`Slightly below average entry standard (${uni.averageGpa.toFixed(2)})`);
      }

      // 2. Major affinity
      const majorAffinity = uni.popularMajors.some(m => 
        m.toLowerCase().includes(profile.intendedMajor.toLowerCase()) || 
        profile.intendedMajor.toLowerCase().includes(m.toLowerCase())
      );
      if (majorAffinity) {
        score += 15;
        reasons.push(`Provides a strong department for your major [${profile.intendedMajor}]`);
      }

      // 3. Tuition Affordability
      if (uni.tuitionMin === 0) {
        score += 15;
        reasons.push(`Extremely affordable public university tuition rates`);
      } else if (uni.tuitionMin < 15000) {
        score += 10;
        reasons.push(`Relatively affordable tuition under $15,000`);
      }

      // 4. Housing
      if (uni.hasOnCampusHousing) {
        reasons.push(`Offers secure on-campus dorm accommodations`);
      }

      const matchScore = Math.max(10, Math.min(99, score));

      return {
        university: uni,
        matchScore,
        reasoning: reasons.join(". ") + "."
      };
    });

    // Sort by best match score descending
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.json(recommendations.slice(0, 15));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate university recommendations." });
  }
});

export default router;
