import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const DATA_DIR = path.join(process.cwd(), 'public/data');

// Check if country exists in universities.json or cost_of_living.json
router.get('/check', (req, res) => {
  const countryName = req.query.country as string;
  if (!countryName) {
    return res.status(400).json({ error: 'Country parameter required' });
  }

  try {
    const uniPath = path.join(DATA_DIR, 'universities.json');
    if (fs.existsSync(uniPath)) {
      const universities = JSON.parse(fs.readFileSync(uniPath, 'utf8'));
      const exists = universities.some((u: any) => u.country?.toLowerCase() === countryName.toLowerCase());
      return res.json({ exists, country: countryName });
    }
    return res.json({ exists: false, country: countryName });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify country record' });
  }
});

// Add custom country to JSON files if it doesn't exist
router.post('/add', (req, res) => {
  const { country } = req.body;
  if (!country || typeof country !== 'string') {
    return res.status(400).json({ error: 'Valid country name required' });
  }

  const cleanCountry = country.trim();

  try {
    // 1. Ensure in cost_of_living.json
    const costPath = path.join(DATA_DIR, 'cost_of_living.json');
    if (fs.existsSync(costPath)) {
      const costData = JSON.parse(fs.readFileSync(costPath, 'utf8'));
      if (!costData.some((c: any) => c.country?.toLowerCase() === cleanCountry.toLowerCase())) {
        costData.push({
          country: cleanCountry,
          currency: 'USD',
          tuitionPublic: 2500,
          tuitionPrivate: 10000,
          rentMonthly: 450,
          foodMonthly: 250,
          transportMonthly: 60,
          healthInsuranceMonthly: 80,
          miscMonthly: 150,
          taxRate: 0.12,
          costOfLivingIndex: 50,
          averagePartTimeWage: 10,
          legalWorkHoursPerWeek: 20,
          estimatedMonthlyEarnings: 860,
          universities: []
        });
        fs.writeFileSync(costPath, JSON.stringify(costData, null, 2));
      }
    }

    // 2. Ensure in student_jobs.json
    const jobsPath = path.join(DATA_DIR, 'student_jobs.json');
    if (fs.existsSync(jobsPath)) {
      const jobsData = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
      if (!jobsData.some((j: any) => j.country?.toLowerCase() === cleanCountry.toLowerCase())) {
        jobsData.push({
          country: cleanCountry,
          legalWorkHoursPerWeek: 20,
          averageHourlyWage: 10,
          averageHourlyWageUSD: 10,
          commonStudentJobs: ["Research Assistant", "Library Assistant", "Tutoring", "Campus Dining"],
          typicalHiringIndustries: ["Higher Education", "IT Services", "Retail"],
          taxConsiderations: "Student earnings below the personal exemption threshold are exempt from income tax."
        });
        fs.writeFileSync(jobsPath, JSON.stringify(jobsData, null, 2));
      }
    }

    // 3. Ensure in visa_guide.json
    const visaPath = path.join(DATA_DIR, 'visa_guide.json');
    if (fs.existsSync(visaPath)) {
      const visaData = JSON.parse(fs.readFileSync(visaPath, 'utf8'));
      if (!visaData.some((v: any) => v.country?.toLowerCase() === cleanCountry.toLowerCase())) {
        visaData.push({
          id: `visa-${cleanCountry.toLowerCase().replace(/\s+/g, '-')}`,
          country: cleanCountry,
          visaType: "Student Visa",
          processingTime: "3 - 6 Weeks",
          feeUSD: 100,
          feeFormatted: "$100 USD Visa Processing Fee",
          proofOfFundsUSD: 12000,
          proofOfFundsRequirement: `Proof of tuition + minimum $12,000 USD annual living allowance.`,
          workPermissions: "Up to 20 hours/week during academic semesters.",
          postStudyWorkVisa: "1-2 year post-study work permit.",
          keyRequirements: [
            "Official acceptance letter from accredited institution",
            "Valid passport (at least 6 months remaining validity)",
            "Bank statements showing sufficient maintenance funds",
            "Medical clearance certificate"
          ],
          officialUrl: `https://www.google.com/search?q=${encodeURIComponent(cleanCountry + " student visa official portal")}`,
          tips: "Submit visa application at least 8 weeks prior to academic orientation."
        });
        fs.writeFileSync(visaPath, JSON.stringify(visaData, null, 2));
      }
    }

    return res.json({ success: true, country: cleanCountry, message: `Country "${cleanCountry}" added to matrix.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update country matrix', details: err.message });
  }
});

export default router;
