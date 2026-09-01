import express, { Request, Response } from 'express';
import { authenticateToken } from './auth.js';
import { getProfileByUsername, saveProfile } from '../db/index.js';
import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI_MODEL } from './aiConfig.js';

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

// PDF Upload & AI Resume Parser
router.post('/upload-pdf', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const username = user.username;
  const { filename, base64 } = req.body;

  if (!base64 || typeof base64 !== 'string') {
    return res.status(400).json({ error: "Missing file payload" });
  }
  // ~8MB base64 ceiling (matches express.json limit with headroom)
  if (base64.length > 10 * 1024 * 1024) {
    return res.status(413).json({ error: "File too large. Maximum PDF size is around 7MB." });
  }

  const currentProfile = getProfileByUsername(username);
  if (!currentProfile) {
    return res.status(404).json({ error: "Profile not found." });
  }

  // Extract real text from the uploaded PDF so AI works from actual content
  let resumeText = '';
  try {
    const buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    resumeText = (result.text || '').replace(/\s+/g, ' ').trim().slice(0, 12000); // cap tokens
    await parser.destroy();
  } catch {
    resumeText = ''; // scanned/encrypted PDFs or missing native deps -> offline mode
  }

  // Persist PDF base64 string to Profile
  currentProfile.resumePdf = base64;
  saveProfile(username, currentProfile);

  let parsedInfo: any = {};
  let summary = '';
  const hasKey = !!process.env.GEMINI_API_KEY;

  try {
    if (hasKey && resumeText.length > 80) {
      const ai = getAI();

      // 1) Structured extraction from REAL resume text
      const prompt = `You are an expert ATS resume parser for academic admissions.
Extract structured details from the candidate's actual resume text below. Only use information present in the text - do NOT invent employers, dates or numbers. Leave fields empty when not found.

RESUME TEXT:
"""
${resumeText}
"""`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              primaryMajor: { type: Type.STRING },
              gpa: { type: Type.NUMBER },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              workExperience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    jobTitle: { type: Type.STRING },
                    company: { type: Type.STRING },
                    dates: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["jobTitle", "company", "dates", "description"]
                }
              },
              internships: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    organization: { type: Type.STRING },
                    dates: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "organization", "dates", "description"]
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    link: { type: Type.STRING }
                  },
                  required: ["name", "description", "link"]
                }
              },
              certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
              extracurriculars: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["fullName", "primaryMajor", "gpa", "skills", "workExperience", "internships", "projects", "certifications", "extracurriculars"]
          }
        }
      });

      if (response.text) {
        parsedInfo = JSON.parse(response.text.trim());
      }

      // 2) Short human-readable summary for the profile page
      const summaryResp = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Summarize this student's resume in exactly 3 short bullet points for a scholarship advisor: strongest academic area, most impressive experience, and one gap to improve. Plain text bullets starting with "- ".\n\nRESUME:\n"""\n${resumeText.slice(0, 6000)}\n"""`
      });
      summary = (summaryResp.text || '').trim().slice(0, 900);
    } else {
      // Offline / no-text fallback: neutral prefill, clearly marked as unverified
      parsedInfo = {
        fullName: currentProfile.fullName,
        primaryMajor: currentProfile.primaryMajor || "",
        gpa: currentProfile.gpa || null,
        skills: [],
        workExperience: [],
        internships: [],
        projects: [],
        certifications: [],
        extracurriculars: []
      };
      summary = hasKey
        ? "- Could not read text from this PDF (it may be a scanned image).\n- Re-upload a text-based PDF to unlock AI analysis.\n- Your file is still saved to your profile."
        : "- File saved to your profile.\n- Add a server GEMINI_API_KEY (or your own key in Settings) to unlock AI resume analysis.";
    }
  } catch (err) {
    console.warn("Gemini resume parsing failed:", err);
    parsedInfo = {
      fullName: currentProfile.fullName,
      primaryMajor: currentProfile.primaryMajor || "",
      gpa: currentProfile.gpa || null,
      skills: [], workExperience: [], internships: [], projects: [], certifications: [], extracurriculars: []
    };
    summary = "";
  }

  saveProfile(username, currentProfile);

  res.json({
    success: true,
    fileSaved: true,
    textExtracted: resumeText.length > 80,
    summary,
    parsed: parsedInfo
  });
});

export default router;
