import express, { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import { authenticateToken } from './auth';
import { getProfileByUsername, getRoadmap, saveRoadmap } from '../db/index';

const router = express.Router();

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

// 1. Generate Personalized Roadmap
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const profile = getProfileByUsername(username) || getProfileByUsername('arif');
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  try {
    // If the user already has a generated roadmap, check if they want to force regenerate
    const { forceRegenerate } = req.body;
    const existingRoadmap = getRoadmap(username);
    if (existingRoadmap && !forceRegenerate) {
      return res.json({ roadmap: existingRoadmap });
    }

    let roadmapData: any[] = [];

    if (hasGeminiKey()) {
      const ai = getAI();
      const prompt = `You are an elite academic progress planner advising a candidate targeting fully-funded international scholarships.
Create a personalized 4-step sequential roadmap for the following candidate:
- Name: ${profile.fullName}
- Intended Major: ${profile.intendedMajor}
- Target Degree: ${profile.intendedDegree}
- Current GPA: ${profile.gpa}/${profile.maxGpa}
- Standardized Scores: IELTS: ${profile.ieltsScore || "None"}, GRE: ${profile.greScore || "None"}
- Additional Skills: ${(profile.additionalSkills || []).join(", ")}
- Education Level: ${profile.educationLevel || "undergraduate"}
- Graduation Year: ${profile.graduationYear || 2024}

Format your response as a strict, clean, valid JSON array of exactly 4 objects. Do not wrap in markdown quotes or add any conversational text. Start directly with [ and end with ]. Each of the 4 milestone objects must have exactly these keys:
- title: string (Milestone Title, e.g., "Step 1: Technical Portfolio & Skills")
- timeline: string (e.g., "Months 1-3")
- description: string (milestone description explaining why this is crucial for ${profile.intendedMajor} scholarships)
- tasks: a JSON array of 3-4 tasks. Each task is an object with 'text' (string) and 'done' (boolean, set to false)
- tips: string (actionable advice to maximize success on this milestone)

Provide outstanding, customized tasks directly applicable to their major, e.g., if Computer Science, refer to coding nodes/GitHub, or if Public Policy, refer to writing samples. Keep JSON clean.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      let txt = response.text.trim();
      if (txt.startsWith("```")) {
        txt = txt.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      roadmapData = JSON.parse(txt);
    } else {
      // Robust offline heuristics fallback matching player profile attributes
      const isGrad = profile.intendedDegree.toLowerCase().includes("master") || profile.intendedDegree.toLowerCase().includes("ph.d");
      
      roadmapData = [
        {
          title: "🔑 Phase 1: Foundations & Standardized Testing",
          timeline: "Months 1-3",
          description: `Establish your baseline profiles for ${profile.intendedMajor} admissions. Since you are looking at ${profile.intendedDegree} programs, academic metrics are heavily scrutinized.`,
          tasks: [
            { text: `Schedule and prepare for IELTS/TOEFL exam (Target: ${parseFloat(profile.ieltsScore || "7.0") >= 7.5 ? profile.ieltsScore : "7.5+"} band score)`, done: false },
            { text: isGrad ? `Study for GRE/GMAT if targeting USA schools (Target 315+ score)` : "Take SAT/ACT preparations or local entrance standards", done: false },
            { text: "Confirm official transcript evaluation from your university board", done: false }
          ],
          tips: "Focus heavily on vocabulary and analytical writing sections as engineering committees love structural reasoning."
        },
        {
          title: "💻 Phase 2: Portfolio Enhancement & Technical Milestones",
          timeline: "Months 4-6",
          description: `Demonstrate real-world application of your skills in ${profile.intendedMajor}. Fully funded spots prioritize builders over average graders.`,
          tasks: [
            { text: `Package your key projects like [${(profile.projects || ["Software Engine"])[0]}] on clean GitHub nodes`, done: false },
            { text: `Certify core specialties in fields matching: [${(profile.additionalSkills || ["Python"])[0]} or Machine Learning]`, done: false },
            { text: "Write technical outlines or pre-prints showcasing research concepts", done: false }
          ],
          tips: "A clean readme file with system diagrams raises review scores by up to 20% during technical screening stages."
        },
        {
          title: "📜 Phase 3: Recommendation Letters & Statement of Purpose",
          timeline: "Months 7-9",
          description: "Align your personal statements with key scholarship guidelines like Erasmus or DAAD.",
          tasks: [
            { text: "Draft Statement of Purpose (SOP) with quantitative STAR bullet points", done: false },
            { text: "Reach out to 3 potential academic professors to secure commitment for recommendation letters", done: false },
            { text: "Upload drafts to ScholarPath AI Document Evaluation Engine for professional review", done: false }
          ],
          tips: "Focus recommendations on specific technical projects instead of general descriptions of your good behavior."
        },
        {
          title: "📨 Phase 4: Active Application Submissions & Interviews",
          timeline: "Months 10-12",
          description: "Execute structured submissions and practice active interview loops.",
          tasks: [
            { text: "Submit final application packets before target closing lines", done: false },
            { text: "Practice 15 mock sessions in ScholarPath Interview simulator terminal", done: false },
            { text: "Prepare certification copies and portfolio slides for live presentations", done: false }
          ],
          tips: "Complete applications at least 2 weeks before the deadline to accommodate potential system server overloads."
        }
      ];
    }

    saveRoadmap(username, roadmapData);
    res.json({ roadmap: roadmapData });
  } catch (err: any) {
    console.error("Personalized Roadmap creation failed:", err);
    // Safe static backup so application never blocks
    const fallbackMap = [
      {
        title: "🔑 Step 1: Core Profile Preparation",
        timeline: "Months 1-3",
        description: `Organize transcripts, standard testing preparation, and target major directories.`,
        tasks: [
          { text: "Prepare certified university records", done: false },
          { text: "Take practice English language metrics", done: false }
        ],
        tips: "Review course credits or equivalent conversion metrics."
      }
    ];
    res.json({ roadmap: fallbackMap });
  }
});

// 2. Save Progress
router.post('/save', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const { roadmap } = req.body;

  if (!roadmap || !Array.isArray(roadmap)) {
    return res.status(400).json({ error: "Invalid roadmap object format." });
  }

  saveRoadmap(username, roadmap);
  res.json({ success: true, roadmap });
});

export default router;
