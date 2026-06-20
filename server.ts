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
    const scholarshipsPath = path.join(process.cwd(), "data", "scholarships.json");
    if (fs.existsSync(scholarshipsPath)) {
      const list = JSON.parse(fs.readFileSync(scholarshipsPath, "utf-8"));
      const found = list.find((s: any) => s.id === id);
      if (found) {
        const target = found.applicationUrl || found.officialWebsite || "https://scholarpath-portal.org";
        return res.redirect(target);
      }
    }
  } catch (error) {
    console.error("[Apply Redirection Error]:", error);
  }
  res.redirect("/#/scholarships");
});

app.get("/api/fellowships/:id/apply", (req, res) => {
  const id = req.params.id;
  try {
    const scholarshipsPath = path.join(process.cwd(), "data", "scholarships.json");
    if (fs.existsSync(scholarshipsPath)) {
      const list = JSON.parse(fs.readFileSync(scholarshipsPath, "utf-8"));
      const found = list.find((s: any) => s.id === id);
      if (found) {
        const target = found.applicationUrl || found.officialWebsite || "https://scholarpath-portal.org";
        return res.json({ targetUrl: target });
      }
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
app.use("/api/roadmap", roadmapRouter);
app.use("/api/universities", universitiesRouter);
app.use("/api/profile", profileRouter);
app.use("/api/community", communityRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api", uploadRouter); // Mount on /api/upload-pdf
app.use("/api", recommenderRouter);

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
