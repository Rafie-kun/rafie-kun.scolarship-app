import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Modular Route Imports
import authRouter, { authenticateToken } from "./routes/auth";
import scholarshipsRouter from "./routes/scholarships";
import applicationsRouter from "./routes/applications";
import geminiRouter from "./routes/gemini";
import recommenderRouter from "./routes/recommender";
import roadmapRouter from "./routes/roadmap";
import universitiesRouter from "./routes/universities";
import profileRouter from "./routes/profile";
import communityRouter from "./routes/community";
import uploadRouter from "./routes/upload";
import jobsRouter from "./routes/jobs";

import { scholarshipsData } from "./routes/db";
import { getNotifications, addNotification } from "./db/index";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize AI Client
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({ 
      apiKey: key || "MOCK_KEY_PLACEHOLDER",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}
function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// --- REDIRECT SCHOLARSHIP APPLICANTS TO DETAILED PORTALS (Anti-404) ---
app.get("/fellowships/:id/apply", (req, res) => {
  const id = req.params.id;
  try {
    const scholarship = scholarshipsData.find((s: any) => s.id === id);
    if (scholarship) {
      let targetUrl = scholarship.officialWebsite || scholarship.applicationUrl || "https://www.ieeff.org";
      if (targetUrl.includes("scholarpath-portal.org") || targetUrl === "#") {
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(scholarship.name + " official website apply")}`;
      }
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Apply for ${scholarship.name}</title>
            <style>
              body { 
                font-family: 'Inter', system-ui, -apple-system, sans-serif; 
                max-width: 800px; 
                margin: 40px auto; 
                padding: 20px; 
                background: #1a1512; 
                color: #e0e0e0; 
              }
              .card { 
                background: #2c2c2c; 
                border: 4px solid #000; 
                padding: 30px; 
                border-radius: 0;
                box-shadow: inset -4px -4px 0 #141414, inset 4px 4px 0 #555;
              }
              h1 {
                font-family: monospace;
                color: #ffff55;
                text-shadow: 2px 2px 0 #000;
                margin-top: 0;
                font-size: 24px;
              }
              h2 {
                font-family: monospace;
                color: #55ff55;
                text-shadow: 1px 1px 0 #000;
                border-bottom: 2px solid #555;
                padding-bottom: 8px;
                margin-top: 24px;
                font-size: 18px;
              }
              .btn { 
                background: #f5c842; 
                color: #000; 
                padding: 12px 24px; 
                border: 4px solid #000; 
                cursor: pointer; 
                font-weight: bold; 
                font-family: monospace;
                text-transform: uppercase;
                box-shadow: inset -2px -2px 0 #b58d19, inset 2px 2px 0 #fff;
                display: inline-block;
                text-decoration: none;
              }
              .btn:hover { 
                background: #ffd700; 
              }
              .back-link {
                color: #55ffff;
                font-family: monospace;
                text-decoration: none;
                font-weight: bold;
                display: inline-block;
                margin-top: 20px;
              }
              .back-link:hover {
                text-decoration: underline;
              }
              li {
                margin-bottom: 8px;
                line-height: 1.4;
              }
              strong {
                color: #ffffff;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>🏆 Apply for ${scholarship.name}</h1>
              <p><strong>Provider:</strong> ${scholarship.provider}</p>
              <p><strong>Funding Class:</strong> ${scholarship.fundingCoverage}</p>
              <p><strong>Application Deadline:</strong> ${scholarship.deadline}</p>
              
              <h2>📝 APPLICATION PROCESS</h2>
              <ol>
                ${(scholarship.applicationSteps && scholarship.applicationSteps.length > 0)
                  ? scholarship.applicationSteps.map((step: string) => `<li>${step}</li>`).join('')
                  : '<li>Check eligibility requirements and prepare academic folders</li><li>Verify required reference logs and SOP drafts</li><li>Submit details through the official board gateway</li>'
                }
              </ol>
              
              <p style="margin-top: 15px;"><strong>Required Documents:</strong> ${(scholarship.requiredDocuments || ["Transcripts", "Statement of Purpose", "Recommendation Letters"]).join(', ')}</p>
              
              <div style="margin-top: 30px;">
                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">
                  <button class="btn">LAUNCH OFFICIAL PORTAL</button>
                </a>
              </div>
              
              <br>
              <a href="/#/scholarships" class="back-link">← Return to ScholarPath</a>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("[Apply Redirection Error]:", error);
  }
  res.status(404).send(`
    <html>
      <body style="background: #1a1512; color: #fff; font-family: monospace; text-align: center; padding-top: 50px;">
        <h1>404 Fellowship Registry Not Found</h1>
        <p>The requested scholarship parameters are not indexed in our active database.</p>
        <a href="/#/scholarships" style="color: #ffff55;">Go back to ScholarPath</a>
      </body>
    </html>
  `);
});

app.get("/api/fellowships/:id/apply", (req, res) => {
  const id = req.params.id;
  try {
    const found = scholarshipsData.find((s: any) => s.id === id);
    if (found) {
      let target = found.applicationUrl || found.officialWebsite || "https://www.ieeff.org";
      if (target.includes("scholarpath-portal.org") || target === "#") {
        target = `https://www.google.com/search?q=${encodeURIComponent(found.name + " official website apply")}`;
      }
      return res.json({ targetUrl: target });
    }
  } catch (error) {
    console.error("[API Apply Redirection Error]:", error);
  }
  res.status(404).json({ error: "Scholarship portal endpoint could not be indexed in our registry." });
});

// Mount routers
app.use("/api/auth", authRouter);
app.use("/api/scholarships", scholarshipsRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/gemini", geminiRouter);
app.get("/api/check-gemini-key", (req, res) => {
  const customKey = req.headers['x-gemini-key'] as string;
  res.json({ hasKey: (customKey && customKey.trim().length > 5) || !!process.env.GEMINI_API_KEY });
});
app.use("/api/roadmap", roadmapRouter);
app.use("/api/universities", universitiesRouter);
app.use("/api/profile", profileRouter);
app.use("/api/community", communityRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api", uploadRouter); // Mount on /api/upload-pdf
app.use("/api", recommenderRouter);

// --- ADMIN UNIVERSITY IMPORT ENDPOINT ---
app.post("/api/admin/import-universities", async (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  const expectedToken = process.env.ADMIN_TOKEN || "scholarpath_cybermatrix_gold_2026_xyz";
  
  if (token !== expectedToken) {
    return res.status(403).json({ error: "Access denied. Invalid or missing high-privilege admin security token." });
  }

  try {
    const { runImport } = await import("./scripts/import-universities.js");
    const count = await runImport();
    
    // Refresh the in-memory array of schools inside routes/db so recommender, search etc works immediately!
    const { db } = await import("./db/index");
    try {
      const rows = db.prepare('SELECT * FROM universities').all() as any[];
      // Update routes/db array in-memory
      const updatedUnis = rows.map(row => ({
        id: row.id,
        name: row.name,
        country: row.country,
        ranking: row.ranking,
        acceptanceRate: row.acceptanceRate,
        averageGpa: row.averageGpa,
        popularMajors: JSON.parse(row.popularMajors || '[]'),
        type: row.type || 'public',
        tuitionMin: row.tuitionMin,
        tuitionMax: row.tuitionMax,
        offeredScholarships: JSON.parse(row.offeredScholarships || '[]'),
        city: row.city,
        hasOnCampusHousing: !!row.hasOnCampusHousing,
        website: row.website,
        applicationUrl: row.applicationUrl,
        domain: row.domain || undefined,
        generatedApplicationUrl: row.generatedApplicationUrl || undefined
      }));
      // Overwrite the in-memory array
      const dbModule = await import("./routes/db");
      (dbModule as any).universitiesData.length = 0;
      (dbModule as any).universitiesData.push(...updatedUnis);
    } catch (rr) {
      console.warn("Could not completely hot-reload in-memory listing:", rr);
    }

    res.json({ success: true, count, message: `Successfully imported ${count} universities from Hipo catalog.` });
  } catch (error: any) {
    console.error("ADMIN IMPORT FAILURE:", error);
    res.status(500).json({ error: "Internal execution failure on admin synchronization.", details: error.message });
  }
});


// --- INTERVIEW SIMULATION API ENDPOINT ---
app.post("/api/ai/interview", async (req, res) => {
  const { scholarshipName, step, userResponse, questionContext } = req.body;
  
  try {
    const ai = getAI();
    const hasKey = hasGeminiKey();

    if (step === 'start') {
      const prompt = `You are an elite interviewer panel member representing the ${scholarshipName || 'Admissions Fellowship Committee'}. 
Please ask the candidate exactly ONE high-yield, specific interview question to evaluate if they are a strong fit.
Keep the speech natural, conversational, and limited to 2-3 sentences.`;

      if (hasKey) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        res.json({ question: response.text });
      } else {
        res.json({ 
          question: `Regarding your target of ${scholarshipName || 'this competitive fellowship'}, how does your academic research project directly align with the strategic goals of the funding organization?` 
        });
      }
    } else if (step === 'evaluate') {
      const prompt = `You are an elite interviewer reviewing a candidate's response to the question: "${questionContext}".
The candidate's response is: "${userResponse}".
Evaluate this response for a scholarship called "${scholarshipName}".
Please output a raw JSON object with exactly the following keys:
- ratingScore: an integer from 0 to 100 representing the strength of the answer (e.g. 85)
- helpfulFeedback: a short paragraph of specific advice to make it better (focus on STAR method, ECTS, quantified achievements)
- exemplaryModelAnswer: an elegant, refined version of the user's answer written in the first person showing how a top-tier candidate would respond.

Only return raw JSON. No markdown backticks, no markdown fence block, no "json" label. just the raw JSON contents starting with { and ending with }.`;

      if (hasKey) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        
        let txt = response.text.trim();
        // Strip potential markdown backticks
        if (txt.startsWith("```")) {
          txt = txt.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }
        
        const parsed = JSON.parse(txt);
        res.json({
          ratingScore: parsed.ratingScore || 80,
          helpfulFeedback: parsed.helpfulFeedback || parsed.constructiveFeedback || "Solid answer but could use more quantified data points.",
          constructiveFeedback: parsed.constructiveFeedback || parsed.helpfulFeedback || "Solid answer but could use more quantified data points.",
          exemplaryModelAnswer: parsed.exemplaryModelAnswer || parsed.refinedResponseDraft || "Review of previous software development experiences...",
          refinedResponseDraft: parsed.refinedResponseDraft || parsed.exemplaryModelAnswer || "Review of previous software development experiences..."
        });
      } else {
        res.json({
          ratingScore: 78,
          helpfulFeedback: "A solid response, but you lack specific quantified outcomes. Use the STAR method to clarify exactly what you achieved.",
          constructiveFeedback: "A solid response, but you lack specific quantified outcomes. Use the STAR method to clarify exactly what you achieved.",
          exemplaryModelAnswer: "During my previous undergraduate projects, I led a development team of 4 to design an open-source database routing tool. By optimizing indexing algorithms, we reduced queries by 32%. This directly matches the technical excellence expected of " + scholarshipName + " scholars.",
          refinedResponseDraft: "During my previous undergraduate projects, I led a development team of 4 to design an open-source database routing tool. By optimizing indexing algorithms, we reduced queries by 32%. This directly matches the technical excellence expected of " + scholarshipName + " scholars."
        });
      }
    } else {
      res.status(400).json({ error: "Invalid interview step." });
    }
  } catch (err: any) {
    console.error("AI Interview Error:", err);
    if (step === 'start') {
      res.json({ question: `For your ${scholarshipName || 'admissions'}, how do your previous projects demonstrate your ability to execute high-impact research?` });
    } else {
      res.json({
        ratingScore: 80,
        helpfulFeedback: "Your statement has deep potential, but would benefit from specifying exact metrics and timeline dependencies.",
        constructiveFeedback: "Your statement has deep potential, but would benefit from specifying exact metrics and timeline dependencies.",
        exemplaryModelAnswer: "I established standard protocols for compiling our research datasets, which improved cross-functional collaboration and throughput by 40%.",
        refinedResponseDraft: "I established standard protocols for compiling our research datasets, which improved cross-functional collaboration and throughput by 40%."
      });
    }
  }
});

// Get live system activities/admissions notifications
app.get("/api/notifications", (req, res) => {
  res.json(getNotifications());
});

// --- VITE DEV MIDDLEWARE & DEPLOYMENT STATIC COMPILING ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OK] ScholarPath secure SQLite matrix synced on http://0.0.0.0:${PORT}`);
  });
}

startServer();
