import express, { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import { authenticateToken } from './auth';
import { getProfileByUsername } from '../db/index';

const router = express.Router();

// Clients registry cached by API key to avoid re-instantiation
const aiClientsMap: Record<string, GoogleGenAI> = {};

function getAIClient(customKey?: string) {
  const key = customKey || process.env.GEMINI_API_KEY || "MOCK_KEY_PLACEHOLDER";
  if (!aiClientsMap[key]) {
    aiClientsMap[key] = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClientsMap[key];
}

// Check key helper
function hasGeminiKey(customKey?: string): boolean {
  return (customKey && customKey.trim().length > 5) || !!process.env.GEMINI_API_KEY;
}

// 1. Key Check Endpoint
router.get('/check-gemini-key', (req: Request, res: Response) => {
  let customKey = req.headers['x-gemini-key'] as string;
  let hasKey = hasGeminiKey(customKey);
  
  // Try checking auth header for a saved Key
  const authHeader = req.headers['authorization'];
  if (authHeader && !hasKey) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-jwt-key');
        const profile = getProfileByUsername(decoded.username);
        if (profile?.customGeminiKey) {
          customKey = profile.customGeminiKey;
          hasKey = hasGeminiKey(customKey);
        }
      } catch (e) {}
    }
  }
  res.json({ hasKey });
});

// 2. SOP Document Evaluation (Requires Token)
router.post('/review-document', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const profile = getProfileByUsername(username) || getProfileByUsername('arif');
  if (!profile) {
    return res.status(404).json({ error: "Candidate profile not found." });
  }

  const { documentText, major, targetDegree } = req.body;
  if (!documentText) {
    return res.status(400).json({ error: "SOP scroll text is required to evaluate!" });
  }

  const customKey = (req.headers['x-gemini-key'] as string) || profile?.customGeminiKey;

  try {
    if (!hasGeminiKey(customKey)) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const ai = getAIClient(customKey);
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ review: response.text });
  } catch (err: any) {
    console.log("AI Document Review: Using offline heuristics fallback");
    res.json({
      review: `**🌌 HEURISTIC EVALUATION REPORT (Offline Guild Fallback)**\n\n- **Target Track**: ${targetDegree || profile.intendedDegree} in ${major || profile.intendedMajor}\n- **Candidate**: **${profile.fullName}** (GPA: ${profile.gpa})\n- **Evaluated Length**: ${documentText.length} characters\n\n### ⚔️ Immediate Critical Guidance:\n1. **Inject Quantitative Proof**: You reference projects like *${profile.projects[0] || 'your research tasks'}*. Standard committees demand numbers. Instead of "optimized a system," say "refactored a core rendering routine boosting frame delivery by 24%."\n2. **Align with European ECTS Guidelines**: Clearly reference how your previous academic workload matches the targeted syllabus coursework.\n3. **Mute Passion Gaps**: Avoid starting sentences with "Since my childhood, I liked computer pixels." Instead, start with "My academic background in ${profile.intendedMajor} led to developing a deep focus in..."\n\n_Configure a secure Custom Gemini API key inside Skins & Biomes Settings panel or the environment files to activate the live LLM evaluation!_`
    });
  }
});

// 3. Wise Librarian Guidance Copilot Chat (Requires Token)
router.post('/study-chat', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const profile = getProfileByUsername(username) || getProfileByUsername('arif');
  if (!profile) {
    return res.status(404).json({ error: "Candidate profile not found." });
  }

  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing query parameter." });
  }

  const customKey = (req.headers['x-gemini-key'] as string) || profile?.customGeminiKey;

  try {
    if (!hasGeminiKey(customKey)) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const ai = getAIClient(customKey);
    
    // Construct rich context contents including history
    const historyParts = (chatHistory || []).slice(-10).map((h: any) => ({
      role: h.sender === 'user' || h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text || h.content || '' }]
    }));

    const systemContext = `You are 'The Wise Librarian', an expert AI admissions copilot, academic advisor, and counselor for fully-funded international scholarships (such as Erasmus, Fulbright, DAAD, Commonwealth, MEXT, etc.).
Your mission is to help candidates compile rigorous portfolios, suggest which scholarships align with their GPA and profile, and give absolute professional clarity.
Keep your personality professional, highly technical, helpful, and subtly encouraging. Use concise structured bullets where possible.

CANDIDATE PROFILE CONTEXT:
- Name: ${profile.fullName}
- GPA: ${profile.gpa}/${profile.maxGpa}
- IELTS: ${profile.ieltsScore || "7.0"} | GRE: ${profile.greScore || "310"}
- Intended Studies: ${profile.intendedDegree} in ${profile.intendedMajor}
- Nationality: ${profile.nationality}`;

    const contents = [
      ...historyParts,
      {
        role: "user",
        parts: [{ text: `Answer this query considering my candidate profile: "${message}"` }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemContext
      }
    });

    const reply = response.text || "No reply generated.";
    
    // Check if reply suggests navigating somewhere
    let suggestedAction = '';
    const lower = reply.toLowerCase();
    if (lower.includes('navigate to profile') || lower.includes('go to profile')) {
      suggestedAction = 'profile';
    } else if (lower.includes('navigate to scholarships') || lower.includes('go to scholarships')) {
      suggestedAction = 'scholarships';
    } else if (lower.includes('navigate to writing') || lower.includes('go to writing') || lower.includes('cv builder')) {
      suggestedAction = 'writing';
    } else if (lower.includes('navigate to community') || lower.includes('go to community')) {
      suggestedAction = 'community';
    }

    res.json({ reply, suggestedAction });
  } catch (err: any) {
    console.log("Librarian fallback mode active", err.message);
    res.json({
      reply: `Greetings **${profile.fullName}**! I am here in local handbook mode. \n\n* **Academic Strategy**: Based on your GPA of **${profile.gpa}** and background in **${profile.intendedMajor}**, you show exceptional potential for joint Master's tracks in Europe or research fellowships in Switzerland/Japan.\n* **Next Steps**: Focus heavily on drafting SOP blueprints and requesting references from professors who remember your major achievements. \n\n_Please note: The full live mode of the Wise Librarian is sleeping. Add a custom GEMINI_API_KEY inside your secure Skins & Biomes (Customize tab) to unleash active AI counseling._`
    });
  }
});

// 4. Mock interview trainer panel (Requires Token)
router.post('/mock-interview', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const profile = getProfileByUsername(username) || getProfileByUsername('arif');
  if (!profile) {
    return res.status(404).json({ error: "Candidate profile not found." });
  }
  const { message } = req.body;
  const customKey = (req.headers['x-gemini-key'] as string) || profile?.customGeminiKey;

  try {
    if (!hasGeminiKey(customKey)) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const ai = getAIClient(customKey);
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

// 5. Budget tips endpoint
router.post('/budget-tips', async (req: Request, res: Response) => {
  const { country, university, totalCost, yearlyEarnings, netCost, currency, hourlyWage, workHours } = req.body;
  
  try {
    const ai = getAIClient();
    const prompt = `You are a financial advisor for international students. The user is planning to study in ${country} at ${university}.
    
    Budget:
    - Total annual cost: ${currency} ${totalCost}
    - Part‑time earnings: ${currency} ${yearlyEarnings}
    - Net cost: ${currency} ${netCost}
    - Hourly wage: ${currency} ${hourlyWage}
    - Legal work hours: ${workHours}/week
    
    Provide 4‑5 actionable tips on:
    1. How to save money on living expenses.
    2. Which scholarships to look for.
    3. Best part‑time jobs for students in ${country}.
    4. General advice to reduce the net cost.
    
    Format your response in clean Markdown with bullet points.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ tips: response.text });
  } catch (err) {
    res.json({ tips: `### 🌟 Quick Tips for ${country}\n\n- Look for DAAD or other government scholarships.\n- Consider sharing accommodation to reduce rent.\n- Work up to ${workHours} hours/week legally.\n- Apply for university‑specific financial aid.\n- Use student discounts for transport and food.` });
  }
});

export default router;
