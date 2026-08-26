import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import { JWT_SECRET, scholarshipsData, universitiesData, DEFAULT_ANON_PROFILE } from "./db.js";
import { getProfileByUsername } from "../db/index.js";

import { GEMINI_MODEL } from './aiConfig.js';

const router = express.Router();

// Permissive auth middleware: parses token if present, otherwise marks the
// request as anonymous (no identity is assumed).
function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const cookieString = req.headers.cookie || '';
  let tokenFromCookie = '';
  const match = cookieString.match(/(?:^|; )token=([^;]*)/);
  if (match) {
    tokenFromCookie = decodeURIComponent(match[1]);
  }
  
  const authHeader = req.headers['authorization'];
  const token = tokenFromCookie || (authHeader && authHeader.split(' ')[1]);

  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      (req as any).user = {
        username: String(decoded.username || ''),
        isGuest: !!decoded.isGuest
      };
      return next();
    } catch {
      // Invalid or expired token: treat as anonymous
    }
  }

  (req as any).user = {
    username: '',
    isGuest: true
  };
  next();
}

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}
const aiCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes cache

function getCachedData(key: string): any | null {
  const cached = aiCache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  aiCache[key] = {
    data,
    timestamp: Date.now(),
  };
}

// Client helper
let aiClientsMap: Record<string, GoogleGenAI> = {};
function getAIClient(customKey?: string) {
  const key = customKey || process.env.GEMINI_API_KEY || "MOCK_KEY_PLACEHOLDER";
  if (!aiClientsMap[key]) {
    aiClientsMap[key] = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClientsMap[key];
}

function hasGeminiKey(customKey?: string): boolean {
  return (customKey && customKey.trim().length > 5) || !!process.env.GEMINI_API_KEY;
}

// Helper to load cost of living
function loadCostOfLiving(): any[] {
  const searchPaths = [
    path.join(process.cwd(), "public", "data", "cost_of_living.json"),
    path.join(process.cwd(), "data", "cost_of_living.json"),
  ];
  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, "utf-8"));
      } catch (e) {
        console.error("Failed to parse cost of living json:", e);
      }
    }
  }
  return [];
}

// 1. AI Scholarship Advisor
router.post("/scholarship-recommendations", optionalAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const username = user?.username || "";
    const rawProfile = getProfileByUsername(username) || DEFAULT_ANON_PROFILE;

    const profile = {
      fullName: rawProfile?.fullName || username || "Pathfinder Student",
      intendedMajor: rawProfile?.intendedMajor || "Computer Science",
      intendedDegree: rawProfile?.intendedDegree || "Master's Degree",
      nationality: rawProfile?.nationality || "Global Explorer",
      gpa: rawProfile?.gpa ?? 3.5,
      maxGpa: rawProfile?.maxGpa ?? 4.0,
      ieltsScore: rawProfile?.ieltsScore || "7.5",
      greScore: rawProfile?.greScore || "318",
      customGeminiKey: rawProfile?.customGeminiKey,
      projects: Array.isArray(rawProfile?.projects) ? rawProfile.projects : []
    };

    // Cache key based on profile state
    const cacheKey = `scholarship_${username}_${profile.gpa}_${profile.intendedMajor}_${profile.intendedDegree}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Compute local matches to get the top 5 scholarships
    const scored = (scholarshipsData || []).map((sch) => {
      let score = 50;
      const reasons: string[] = [];
      const userGpa = profile.gpa;

      if (sch.gpaRequirement && userGpa >= sch.gpaRequirement) {
        score += 20;
        reasons.push(`Meets GPA threshold of ${sch.gpaRequirement}`);
      } else if (sch.gpaRequirement) {
        score -= 20;
        reasons.push(`GPA is lower than requirement of ${sch.gpaRequirement}`);
      }

      const majors = Array.isArray(sch.eligibleMajors) ? sch.eligibleMajors : [];
      const majorMatched = majors.some(
        (m) =>
          m.toLowerCase().includes(profile.intendedMajor.toLowerCase()) ||
          profile.intendedMajor.toLowerCase().includes(m.toLowerCase())
      );
      if (majorMatched) {
        score += 20;
        reasons.push(`Matches intended major in ${profile.intendedMajor}`);
      }

      const countries = Array.isArray(sch.eligibleCountries) ? sch.eligibleCountries : [];
      const nationalityMatched = countries.some(
        (c) =>
          c.toLowerCase() === "worldwide" ||
          c.toLowerCase().includes(profile.nationality.toLowerCase()) ||
          profile.nationality.toLowerCase().includes(c.toLowerCase())
      );
      if (nationalityMatched) {
        score += 15;
        reasons.push(`Eligible for ${profile.nationality} nationals`);
      }

      const degrees = Array.isArray(sch.degreeLevel) ? sch.degreeLevel : [];
      const degreeMatched = degrees.some(
        (dl) =>
          dl.toLowerCase().includes(profile.intendedDegree.toLowerCase()) ||
          profile.intendedDegree.toLowerCase().includes(dl.toLowerCase())
      );
      if (degreeMatched) {
        score += 10;
        reasons.push(`Matches intended degree level: ${profile.intendedDegree}`);
      }

      return {
        scholarship: sch,
        matchScore: Math.max(10, Math.min(99, score)),
        reasons,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scored.slice(0, 5);

    const customKey = (req.headers["x-gemini-key"] as string) || profile?.customGeminiKey;

    if (hasGeminiKey(customKey)) {
      try {
        const ai = getAIClient(customKey);
        const prompt = `You are ScholarPath's expert AI Scholarship Advisor.
You are evaluating a candidate profile and providing personalized strategies for their top matched scholarships.

CANDIDATE BIODATA CONTEXT:
- Name: ${profile.fullName}
- Intended Major: ${profile.intendedMajor}
- Intended Degree: ${profile.intendedDegree}
- GPA: ${profile.gpa}/${profile.maxGpa}
- IELTS: ${profile.ieltsScore} | GRE: ${profile.greScore}
- Nationality: ${profile.nationality}

TOP MATCHED SCHOLARSHIPS:
${topMatches
  .map(
    (item, index) => `
${index + 1}. ${item.scholarship.name} (Provider: ${item.scholarship.provider || 'Global Agency'})
   - Match Compatibility: ${item.matchScore}%
   - Description: ${item.scholarship.description || 'Fully funded award'}
   - GPA Minimum Requirement: ${item.scholarship.gpaRequirement || 3.0}
   - Coverage: ${item.scholarship.fundingCoverage || 'Full Tuition'}
   - Deadline: ${item.scholarship.deadline || '2026-12-31'}
`
  )
  .join("\n")}

Provide a highly personalized and beautifully formatted scholarship advising report in Markdown.
The report must include:
1. **Executive Analysis**: A brief assessment of the candidate's competitive standing based on their GPA, nationality, and test scores.
2. **Personalized Scholarship Roadmap**: For each of the top matched scholarships listed above:
   - Identify the primary hurdle or competitive bottleneck (e.g., GPA margin, essay expectations, test scores).
   - Write a specific, actionable, 1-2 sentence preparation strategy tailored to this scholarship.
3. **ScholarPath Portfolio Action Steps**: Give 3-4 concrete portfolio enhancement guidelines.

Use clear Markdown headers, bold accents, and bullet points. Deliver an inspiring yet realistic academic advising tone.`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });

        if (response.text) {
          const resultPayload = {
            report: response.text,
            topMatches,
            source: "gemini",
          };
          setCachedData(cacheKey, resultPayload);
          return res.json(resultPayload);
        }
      } catch (geminiErr) {
        console.log("Gemini API call skipped/failed, using heuristic report:", geminiErr);
      }
    }

    // Detailed local heuristic fallback
    const fallbackReport = `### 🌌 Personal Academic Portfolio Analysis (ScholarPath Advisor Matrix)

Welcome, **${profile.fullName}**! Here is an automated strategic report based on your profile credentials (GPA **${profile.gpa}** in **${profile.intendedMajor}**):

#### 🏆 Executive Analysis
Your profile is highly competitive, particularly within the **${profile.nationality}** candidate pool. Meeting the GPA requirements of premium international grants puts you in a strong position.

#### 🗺️ Strategic Roadmap for Top Matches
${topMatches
  .map(
    (item, index) => `
##### ${index + 1}. ${item.scholarship.name} (Match: **${item.matchScore}%**)
* **Compatibility Analysis**: ${item.reasons.join(", ") || "Strong baseline profile match"}.
* **Action Strategy**: Since this grant is provided by **${item.scholarship.provider || "International Foundation"}**, focus on aligning your Statement of Purpose (SOP) with their core mission. Ensure you emphasize quantifiably improved metrics from your academic projects.`
  )
  .join("\n")}

#### 🛡️ ScholarPath Action Steps
1. **Flesh out Leadership Details**: Add more entries to your leadership log. Highlight project coordination and financial responsibility.
2. **Quantify Project Descriptions**: In your CV builder, rewrite achievements to follow the STAR methodology (Situation, Task, Action, Result).
3. **Verify Standardized Test Dates**: Schedule your IELTS/TOEFL to secure a score above 7.0.

_Note: For live real-time AI insights, configure a GEMINI_API_KEY in your custom Settings or environment!_`;

    const resultPayload = {
      report: fallbackReport,
      topMatches,
      source: "heuristic",
    };
    setCachedData(cacheKey, resultPayload);
    return res.json(resultPayload);
  } catch (err: any) {
    console.error("Error in scholarship-recommendations endpoint:", err);
    return res.status(200).json({
      report: "### 🌌 Academic Portfolio Analysis\n\nYour profile match score has been verified. Focus on keeping your GPA strong and preparing your Statement of Purpose.",
      topMatches: [],
      source: "fallback"
    });
  }
});

// 2. AI University Advisor
router.post("/university-recommendations", optionalAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const username = user?.username || "";
    const rawProfile = getProfileByUsername(username) || DEFAULT_ANON_PROFILE;

    const profile = {
      fullName: rawProfile?.fullName || username || "Pathfinder Student",
      intendedMajor: rawProfile?.intendedMajor || "Computer Science",
      intendedDegree: rawProfile?.intendedDegree || "Master's Degree",
      nationality: rawProfile?.nationality || "Global Explorer",
      gpa: rawProfile?.gpa ?? 3.5,
      maxGpa: rawProfile?.maxGpa ?? 4.0,
      ieltsScore: rawProfile?.ieltsScore || "7.5",
      greScore: rawProfile?.greScore || "318",
      customGeminiKey: rawProfile?.customGeminiKey,
      projects: Array.isArray(rawProfile?.projects) ? rawProfile.projects : []
    };

    // Cache key based on profile state
    const cacheKey = `university_${username}_${profile.gpa}_${profile.intendedMajor}_${profile.intendedDegree}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get matching universities and score them
    const scored = (universitiesData || []).map((uni) => {
      let score = 60;
      const reasons: string[] = [];
      const userGpa = profile.gpa;

      const avgGpa = uni.averageGpa || 3.0;
      if (userGpa >= avgGpa) {
        score += 15;
        reasons.push(`Competitive GPA compared to typical entrance average of ${avgGpa}`);
      } else if (userGpa >= avgGpa - 0.3) {
        score += 5;
        reasons.push(`GPA is within normal entry boundaries for ${uni.name}`);
      } else {
        score -= 20;
        reasons.push(`GPA is below standard enrollment levels`);
      }

      const popularMajors = Array.isArray(uni.popularMajors) ? uni.popularMajors : [];
      const majorAffinity = popularMajors.some(
        (m) =>
          m.toLowerCase().includes(profile.intendedMajor.toLowerCase()) ||
          profile.intendedMajor.toLowerCase().includes(m.toLowerCase())
      );
      if (majorAffinity) {
        score += 15;
        reasons.push(`Offers robust academic tracks in your major [${profile.intendedMajor}]`);
      }

      if (uni.tuitionMin === 0) {
        score += 15;
        reasons.push("Free or extremely low public tuition fees");
      } else if (uni.tuitionMin < 15000) {
        score += 10;
        reasons.push("Tuition fits typical affordability standards");
      }

      return {
        university: uni,
        matchScore: Math.max(10, Math.min(99, score)),
        reasons,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scored.slice(0, 5);

    const customKey = (req.headers["x-gemini-key"] as string) || profile?.customGeminiKey;

    if (hasGeminiKey(customKey)) {
      try {
        const ai = getAIClient(customKey);
        const prompt = `You are ScholarPath's expert AI University Admissions Consultant.
Analyze the following candidate profile and provide customized admissions advice for their top matching universities.

CANDIDATE BIODATA CONTEXT:
- Name: ${profile.fullName}
- Intended Major: ${profile.intendedMajor}
- Intended Degree: ${profile.intendedDegree}
- GPA: ${profile.gpa}/${profile.maxGpa}
- IELTS: ${profile.ieltsScore} | GRE: ${profile.greScore}
- Nationality: ${profile.nationality}

TOP MATCHED UNIVERSITIES:
${topMatches
  .map(
    (item, index) => `
${index + 1}. ${item.university.name} (${item.university.city || 'Global'}, ${item.university.country || 'Worldwide'})
   - Match Compatibility: ${item.matchScore}%
   - Global Rank: #${item.university.ranking || 100}
   - Acceptance Rate: ${item.university.acceptanceRate || '15%'}
   - Typical Admitted GPA: ${item.university.averageGpa || 3.5}
   - Popular Majors: ${Array.isArray(item.university.popularMajors) ? item.university.popularMajors.join(", ") : 'STEM'}
   - Tuition Cost: $${item.university.tuitionMin || 0} - $${item.university.tuitionMax || 20000} / year
   - Housing: ${item.university.hasOnCampusHousing ? "On-campus dorms available" : "Off-campus housing only"}
`
  )
  .join("\n")}

Provide a detailed, professional university advising report in Markdown.
The report must include:
1. **Strategic Assessment**: A professional analysis of the candidate's admission probability band (e.g. Reach, Target, Safety) based on rankings and GPA.
2. **Customized Entry Strategy**: For each university:
   - Specific advice on how to build a strong case for admission.
   - Analysis of affordability, tuition ranges, and potential financial solutions.
3. **Admission Milestones**: Outline a general timeline of key steps.

Format beautifully with clean Markdown headings, bold keywords, and bullet points. Keep it highly practical and encouraging.`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });

        if (response.text) {
          const resultPayload = {
            report: response.text,
            topMatches,
            source: "gemini",
          };
          setCachedData(cacheKey, resultPayload);
          return res.json(resultPayload);
        }
      } catch (geminiErr) {
        console.log("Gemini API call skipped/failed, using heuristic report:", geminiErr);
      }
    }

    const fallbackReport = `### 🏢 Personal University Match Report (ScholarPath Matrix Engine)

Welcome, **${profile.fullName}**! Here is your structured matching analysis based on the universities indexed in our system for your major in **${profile.intendedMajor}**:

#### 📊 Admissions Standing Analysis
Based on your GPA of **${profile.gpa}**, you are a very competitive candidate. You should target institutions with average admitting GPAs in the 3.5 - 3.8 band.

#### 🏢 Customized Strategy for Top Institution Matches
${topMatches
  .map(
    (item, index) => `
##### ${index + 1}. ${item.university.name} (Match Score: **${item.matchScore}%**)
* **Admission Probability**: Target Institution.
* **Affordability Analysis**: Annual Tuition of $${(item.university.tuitionMin || 0).toLocaleString()} to $${(item.university.tuitionMax || 15000).toLocaleString()}.
* **Admissions Case**: Emphasize coursework in: ${Array.isArray(item.university.popularMajors) ? item.university.popularMajors.join(", ") : profile.intendedMajor}. Highlight your academic projects in your application portfolio.`
  )
  .join("\n")}

#### 🗺️ Recommended Milestones
1. **Standardized Exams**: Solidify your scores (IELTS/TOEFL) and register them.
2. **Admissions Portals**: Draft custom application statements for each of the target schools.
3. **Reference Matrix**: Confirm three academic or professional advocates who can outline your project strengths.

_To activate live AI admissions counseling, please add a GEMINI_API_KEY in Settings or environment files._`;

    const resultPayload = {
      report: fallbackReport,
      topMatches,
      source: "heuristic",
    };
    setCachedData(cacheKey, resultPayload);
    return res.json(resultPayload);
  } catch (err: any) {
    console.error("Error in university-recommendations endpoint:", err);
    return res.status(200).json({
      report: "### 🏢 Personal University Match Report\n\nYour institutional matches have been computed. Prepare your transcript packets and reference letters.",
      topMatches: [],
      source: "fallback"
    });
  }
});

// 3. AI Budget Advisor
router.post("/budget-advisor", async (req: Request, res: Response) => {
  const { country, university, degree, tuition, partTimeWork, workHours } = req.body;

  if (!country) {
    return res.status(400).json({ error: "Country parameter is required to calculate budget advisor metrics." });
  }

  // Load cost of living database
  const colList = loadCostOfLiving();
  const colData = colList.find((c) => c.country.toLowerCase() === country.toLowerCase()) || {
    country,
    currency: "USD",
    tuitionPublic: 15000,
    tuitionPrivate: 35000,
    rentMonthly: 600,
    foodMonthly: 300,
    transportMonthly: 100,
    healthInsuranceMonthly: 150,
    miscMonthly: 200,
    hourlyWage: 12,
    workHoursPerWeek: 20,
  };

  const currency = colData.currency;
  const rentMonthly = colData.rentMonthly;
  const foodMonthly = colData.foodMonthly;
  const transportMonthly = colData.transportMonthly;
  const healthInsuranceMonthly = colData.healthInsuranceMonthly;
  const miscMonthly = colData.miscMonthly;

  const livingCostsMonthly = rentMonthly + foodMonthly + transportMonthly + healthInsuranceMonthly + miscMonthly;
  const livingCostsAnnual = livingCostsMonthly * 12;

  const totalAnnualCost = (parseFloat(String(tuition)) || 0) + livingCostsAnnual;

  let hourlyWage = colData.hourlyWage;
  let workHoursPerWeek = parseFloat(String(workHours)) || colData.workHoursPerWeek;
  let weeklyEarnings = 0;
  let yearlyEarnings = 0;
  let netCost = totalAnnualCost;

  if (partTimeWork) {
    weeklyEarnings = hourlyWage * workHoursPerWeek;
    yearlyEarnings = weeklyEarnings * 48; // Assume 48 weeks of work
    netCost = totalAnnualCost - yearlyEarnings;
  }

  const cacheKey = `budget_${country}_${university}_${degree}_${tuition}_${partTimeWork}_${workHours}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const ai = getAIClient();
    const prompt = `You are ScholarPath's expert AI Student Financial Advisor.
Provide a highly detailed financial advising report explaining student budget calculations, cost-saving strategies, and job opportunities.

STUDENT PROFILE & CALCULATIONS:
- Target University: ${university || "Generic University"}
- Target Country: ${country}
- Intended Degree: ${degree || "Postgraduate Studies"}
- Provided Annual Tuition: ${currency} ${tuition}
- Estimated Living Costs:
  * Rent: ${currency} ${rentMonthly}/month
  * Food: ${currency} ${foodMonthly}/month
  * Transport: ${currency} ${transportMonthly}/month
  * Health Insurance: ${currency} ${healthInsuranceMonthly}/month
  * Miscellaneous: ${currency} ${miscMonthly}/month
  * Total Living Costs: ${currency} ${livingCostsMonthly}/month (${currency} ${livingCostsAnnual}/year)
- Total Annual Cost (Tuition + Living): ${currency} ${totalAnnualCost}
- Part-time Employment Intentions: ${partTimeWork ? "Yes" : "No"}
  * Legal work limit in ${country}: ${colData.workHoursPerWeek} hours/week (Assumed work: ${workHoursPerWeek} hours/week)
  * Average student hourly wage: ${currency} ${hourlyWage}/hour
  * Projected Annual Part-time Earnings: ${currency} ${yearlyEarnings} (Assumed 48 weeks of work)
- Projected Annual Net Balance (Out-of-pocket): ${currency} ${netCost}

Provide a comprehensive, encouraging, and detailed financial advising report in Markdown.
The report must include:
1. **Personalized Cost Assessment & Formula Explanation**: Break down the calculation of the Total Annual Cost and Net Cost in a human-readable format. Validate whether these estimates are realistic for a student in ${country}.
2. **Actionable Money-Saving Tactics in ${country}**: Write 4-5 specific, practical cost-saving tips tailored to living in ${country} (e.g. food planning, shared housing, student transport passes, tax refunds, university perks).
3. **Employment & Job Search Strategy**: Highlight 3-4 popular student jobs in ${country} and suggest where to search for them (such as on-campus assistantships, local hospitality, or freelance tutor programs).
4. **Scholarship Opportunities**: Direct them towards seeking scholarship coverage or tuition waivers, and advise how to combine work and study without hurting their GPA.

Use clean Markdown formatting, professional bold styling, and bullet points. Ensure all calculations are explained transparently.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const report = response.text || "No financial report generated.";
    const resultPayload = {
      report,
      calculations: {
        currency,
        tuition: parseFloat(String(tuition)) || 0,
        rentMonthly,
        foodMonthly,
        transportMonthly,
        healthInsuranceMonthly,
        miscMonthly,
        livingCostsMonthly,
        livingCostsAnnual,
        totalAnnualCost,
        partTimeWork,
        hourlyWage,
        workHoursPerWeek,
        weeklyEarnings,
        yearlyEarnings,
        netCost,
      },
      source: "gemini",
    };

    setCachedData(cacheKey, resultPayload);
    res.json(resultPayload);
  } catch (err: any) {
    console.log("AI Budget Advisor falling back to local heuristic budget generator.");
    let fallbackReport = `### 📊 Student Financial advising Report (Offline Mode)

Here is a structured cost-of-living and part-time earnings analysis for studying in **${country}** at **${university || "your chosen university"}**:

#### 💰 Detailed Cost Calculation Formula
1. **Annual Tuition Fee**: \`${currency} ${tuition.toLocaleString()}\`
2. **Annual Living Expenses**: \`${currency} ${livingCostsAnnual.toLocaleString()}\`
   * Rent (Shared flat): \`${currency} ${rentMonthly}/month\`
   * Food / Groceries: \`${currency} ${foodMonthly}/month\`
   * Transit & Mobile: \`${currency} ${(transportMonthly + miscMonthly)}/month\`
   * Insurance & Health: \`${currency} ${healthInsuranceMonthly}/month\`
3. **Total Estimated Annual Cost**: \`${currency} ${totalAnnualCost.toLocaleString()}\`

${
  partTimeWork
    ? `
#### 💼 Projected Part-Time Income (Assumed 48 working weeks)
* Estimated Hourly Wage: \`${currency} ${hourlyWage}/hour\`
* Assumed Work Hours: \`${workHoursPerWeek} hours/week\`
* Calculated Weekly Income: \`${currency} ${weeklyEarnings.toLocaleString()}\`
* **Projected Annual Earnings**: \`${currency} ${yearlyEarnings.toLocaleString()}\`
* **Projected Out-of-Pocket Net Cost**: \`${currency} ${netCost.toLocaleString()}\`
`
    : `
*No part-time employment selected. To cover the total cost of \`${currency} ${totalAnnualCost.toLocaleString()}\` per year, we recommend looking into complete scholarship options or fellowship awards.*
`
}

#### 💡 Practical Cost-Saving Tips for ${country}
1. **Housing Flatshares (WG / Flatshares)**: Sharing apartments is highly recommended and can reduce rent costs by 30-50%.
2. **Student Semester Transit Ticket**: Take advantage of heavily subsidized student travel cards.
3. **Self-Cooking & Student Mensa**: Eat at university mensas (student cafeterias) where hearty meals cost under $5.
4. **Tax Refunding**: Track your study costs (books, laptops, flights) as they are often tax-deductible for working students.

#### 🛠️ Recommended Job Tracks
1. **HiWi / Research Assistant**: Apply for university library, IT, or teaching assistant jobs. They pay well, keep you on campus, and support your studies.
2. **Werkstudent / Working Student**: Many tech/business firms hire students part-time. These roles often count towards your future career experience.
3. **Local Tutoring or Language Support**: Offer freelance English/science tutoring. It has highly flexible hours and command strong rates.

_To activate active financial advice from the live Gemini AI engine, please make sure a GEMINI_API_KEY is configured in your custom Settings tab!_`;

    const resultPayload = {
      report: fallbackReport,
      calculations: {
        currency,
        tuition: parseFloat(String(tuition)) || 0,
        rentMonthly,
        foodMonthly,
        transportMonthly,
        healthInsuranceMonthly,
        miscMonthly,
        livingCostsMonthly,
        livingCostsAnnual,
        totalAnnualCost,
        partTimeWork,
        hourlyWage,
        workHoursPerWeek,
        weeklyEarnings,
        yearlyEarnings,
        netCost,
      },
      source: "heuristic",
    };
    res.json(resultPayload);
  }
});

// 4. AI Wizard Assistant
router.post("/wizard-assistant", optionalAuth, async (req: Request, res: Response) => {
  const { question, onboardingState } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Question parameter is required." });
  }

  const user = (req as any).user;
  const username = user?.username || "guest";
  const profile = getProfileByUsername(username);

  const customKey = profile?.customGeminiKey;

  try {
    if (!hasGeminiKey(customKey)) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const ai = getAIClient(customKey);
    const prompt = `You are ScholarPath's premium AI Onboarding Assistant.
The user is going through the academic onboarding wizard. 
CURRENT ONBOARDING PROGRESS & CONTEXT:
- Home Country: ${onboardingState?.country || 'Not specified'}
- Current Education Level: ${onboardingState?.educationLevel || 'Not specified'}
- Intended Curriculum: ${onboardingState?.selectedCurricula?.join(', ') || 'Not specified'}
- Targeted Destination Country: ${onboardingState?.targetCountry || 'Not specified'}
- Estimated GPA: ${onboardingState?.gpaResults?.estimatedGpa || 'N/A'}
- Entered Academic Subjects: ${onboardingState?.subjects?.map((s: any) => `${s.subject} (${s.grade})`).join(', ') || 'None yet'}
- Intended Major/Major affinity: ${onboardingState?.subjects?.[0]?.subject || 'Not specified'}
- Estimated Monthly Budget: Rent ${onboardingState?.rent || 'N/A'}, Food ${onboardingState?.food || 'N/A'}, Monthly Net Job Wage ${onboardingState?.monthlyNetWage || '0'}

User Question: "${question}"

Provide a highly relevant, crisp, friendly, and expert answer (max 3-4 short paragraphs) to guide the student. Suggest subject selections, clarify cost parameters in their target country, or recommend scholarship/career tracks matching their entered profile. Use clear bullet points and bold headers in Markdown. No tech jargon. Keep it encouraging!`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    res.json({
      answer: response.text || "I'm here to help you navigate your academic journey! Let me know what questions you have.",
      source: "gemini"
    });
  } catch (err: any) {
    console.log("AI Wizard Assistant falling back to heuristic answers.");
    // Heuristic intelligent fallback responses
    let answer = `I'm here to support your onboarding journey! Since I am operating offline, here is some tailored guidance based on your profile:

- **Target Destination (${onboardingState?.targetCountry || 'Global'}):** Ensure you look into local cost of living averages. Rent typically forms about 50-60% of student budgets.
- **Subject Selection:** Since you selected **${onboardingState?.subjects?.[0]?.subject || 'STEM tracks'}**, we suggest prioritizing critical prerequisite courses like Mathematics, Physics, and English to secure high eligibility scores for scholarships.
- **Part-Time Work:** Most countries permit international students to work up to 20 hours per week during term-time, yielding extra support.

*To activate live AI reasoning, please enter your personal GEMINI_API_KEY in the settings dashboard.*`;

    // Try to match standard questions
    const q = question.toLowerCase();
    if (q.includes("germany") || q.includes("cost")) {
      answer = `### 💶 Living and Study Costs in Germany (Offline Guide)
      
Germany is an exceptional study destination with **extremely low or free public tuition**!
- **Estimated Expenses:** You can expect living costs around **EUR 800 - 1,000 per month**. Rent typically averages **EUR 350 - 500** for student flats (WG).
- **Part-Time Work:** You can work up to 20 hours a week. Typical student jobs pay **EUR 13 - 15/hour**, which fully covers basic subsistence.
- **Exemptions:** Earn under €11,700 per year and you are completely exempt from income tax!`;
    } else if (q.includes("subject") || q.includes("computer science") || q.includes("major")) {
      answer = `### 💻 Prerequisites for Computer Science & STEM Majors
      
For a robust application to top Computer Science programs:
1. **Core Mathematics:** You absolutely need advanced mathematics (such as A-Level Maths, AP Calculus, or IB Higher Level Math).
2. **Sciences:** Prioritize Physics or Computer Science classes if available.
3. **Languages:** Securing an A or B grade in English Language is vital to skip extra foundation classes.
4. **Weighted GPA:** Aim to complete AP or Honors components to inflate your weighted admission standing score.`;
    }

    res.json({
      answer,
      source: "heuristic"
    });
  }
});

export default router;
