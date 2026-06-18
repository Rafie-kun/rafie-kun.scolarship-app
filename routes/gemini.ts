import express, { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import { authenticateToken } from './auth';
import { profilesMap } from './db';

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

// Check key helper
function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// 1. SOP Document Evaluation (Requires Token)
router.post('/review-document', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const profile = profilesMap[username] || profilesMap['arif'];

  const { documentText, major, targetDegree } = req.body;
  if (!documentText) {
    return res.status(400).json({ error: "SOP scroll text is required to evaluate!" });
  }

  try {
    const ai = getAI();
    const prompt = `You are an elite academic admissions counselor and professor specializing in evaluating Statements of Purpose (SOP) and resumes for competitive fully-funded international scholarships like Erasmus, Fulbright, DAAD.
Analyze the following document draft for candidate ${profile.fullName} applying for a ${targetDegree || profile.intendedDegree} in ${major || profile.intendedMajor}:

CANDIDATE BIODATA CONTEXT:
- Name: ${profile.fullName}
- Current GPA: ${profile.gpa}/${profile.maxGpa}
- Nationality: ${profile.nationality}
- Research Projects: ${profile.projects.join(', ')}
- Leadership AP: ${profile.leadershipExperience.join(', ')}

DOCUMENT TO EVALUATE:
---
${documentText}
---

Provide a gorgeous, highly detailed structure-critique review containing:
1. **Academic Strength Rating** (out of 10) with comprehensive explanation of ECTS matches/technical fit.
2. **Key Strengths**: Highlight where the statement does a great job representing research potential.
3. **Core Flaws & Critical Gaps**: Identify what admissions supervisors will find vague or weak (lack of quantified outcomes, generic praises, etc.).
4. **Actionable Suggestions (Line-by-Line Refactor example)**: Rewrite 1-2 key paragraphs to make them sound significantly more rigorous, professional, and quantified with numerical results (e.g., GPAs, lines of code, ECTS, club participants).
5. **Scorecard Summary**: A quick list of bullet ratings (Clarity, Technical Rigor, Formatting, Career Vision).

Respond in clean, modern formatting.`;

    if (!hasGeminiKey()) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ review: response.text });
  } catch (err: any) {
    console.log("AI Document Review: Using offline heuristics fallback");
    res.json({
      review: `**🌌 HEURISTIC EVALUATION REPORT (Offline Guild Fallback)**\n\n- **Target Track**: ${targetDegree || profile.intendedDegree} in ${major || profile.intendedMajor}\n- **Candidate**: **${profile.fullName}** (GPA: ${profile.gpa})\n- **Evaluated Length**: ${documentText.length} characters\n\n### ⚔️ Immediate Critical Guidance:\n1. **Inject Quantitative Proof**: You reference projects like *${profile.projects[0] || 'your research tasks'}*. Standard committees demand numbers. Instead of "optimized a system," say "refactored a core rendering routine boosting frame delivery by 24%."\n2. **Align with European ECTS Guidelines**: Clearly reference how your previous academic workload matches the targeted syllabus coursework.\n3. **Mute Passion Gaps**: Avoid starting sentences with "Since my childhood, I liked computer pixels." Instead, start with "My academic background in ${profile.intendedMajor} led to developing a deep focus in..."\n\n_Configure process.env.GEMINI_API_KEY in the Settings drawer with custom credentials to initialize the real-time Gemini LLM parser!_`
    });
  }
});

// 2. Wise Librarian Guidance Copilot Chat (Requires Token)
router.post('/study-chat', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const profile = profilesMap[username] || profilesMap['arif'];

  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing query parameter." });
  }

  try {
    if (!hasGeminiKey()) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [{
            text: `You are 'The Wise Librarian', an expert AI admissions copilot, academic advisor, and counselor for fully-funded international scholarships (such as Erasmus, Fulbright, DAAD, Commonwealth, MEXT, etc.).
Your mission is to help candidates compile rigorous portfolios, suggest which scholarships align with their GPA and profile, and give absolute professional clarity.
Keep your personality professional, highly technical, helpful, and subtly encouraging. Use concise structured bullets where possible.

CANDIDATE PROFILE CONTEXT:
- Name: ${profile.fullName}
- GPA: ${profile.gpa}/${profile.maxGpa}
- IELTS: ${profile.ieltsScore || "7.0"} | GRE: ${profile.greScore || "310"}
- Intended Studies: ${profile.intendedDegree} in ${profile.intendedMajor}
- Nationality: ${profile.nationality}

Answer their query: "${message}"`
          }]
        }
      ]
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.log("Librarian: Using offline handbook fallback mode");
    res.json({
      reply: `Greetings **${profile.fullName}**! I am here in local handbook mode. \n\n* **Academic Strategy**: Based on your GPA of **${profile.gpa}** and background in **${profile.intendedMajor}**, you show exceptional potential for joint Master's tracks in Europe or research fellowships in Switzerland/Japan.\n* **Next Steps**: Focus heavily on drafting SOP blueprints and requesting references from professors who remember your major achievements. \n\n_Please note: The full brain center of the Wise Librarian is sleeping. Add a GEMINI_API_KEY inside your secure workspace environment to unleash active AI counseling._`
    });
  }
});

// 3. Mock interview trainer panel (Requires Token)
router.post('/mock-interview', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const profile = profilesMap[username] || profilesMap['arif'];
  const { message } = req.body;

  try {
    if (!hasGeminiKey()) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const ai = getAI();
    const prompt = `You are the lead admissions professor conducting a competitive mock oral panel interview for a highly sought-after fully-funded scholarship admission slot.
Candidate Profile:
- Name: ${profile.fullName}
- Target: ${profile.intendedDegree} in ${profile.intendedMajor}
- Nationality: ${profile.nationality}

If the user's message is simple or greetings, greet them formally, state the committee names (Professor Miller from Germany, Professor Dubois from France), and ask them the FIRST crucial icebreaker panel question (e.g., 'To begin, why should we select you over other candidates with equivalent GPA bands?').
If they have responded to previous questions, evaluate their last reply critically (yet supportively), give a quick phrase of assessment, and ask the NEXT logical follow-up admission question (e.g. asking them to detail ECTS coursework, explain leadership anomalies, or map out their sustainable career objectives).

Candidate response: "${message || 'I am ready to begin'}"

Keep your response limited to 2-3 short, highly structured paragraphs. Act strictly in-character as the lead panel interviewer.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ response: response.text });
  } catch (err: any) {
    res.json({
      response: `[Mock Panel Lead - Prof. Miller]: Welcome, candidate ${profile.fullName}. We are delighted to begin this mock panel simulation. Let's begin: Could you explain why you are targeting ${profile.intendedMajor} at the ${profile.intendedDegree} level? We want to see how your background in ${profile.nationality} equips you for joint study tracks. \n\n*(Note: Add your GEMINI_API_KEY in the workspace Settings drawer to enable fully customized conversational panel questions!)*`
    });
  }
});

export default router;
