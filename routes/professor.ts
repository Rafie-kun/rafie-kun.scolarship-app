import express, { Request, Response } from 'express';
import { authenticateToken } from './auth.js';
import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI_MODEL } from './aiConfig.js';
import { getUniversitiesFromDb } from '../db/index.js';

const router = express.Router();

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || 'MOCK_KEY_PLACEHOLDER',
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiClient;
}

function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// POST /api/professors/search  { university, country, keyword, degreeLevel }
router.post('/search', authenticateToken, async (req: Request, res: Response) => {
  const { university, country, keyword, degreeLevel } = req.body;

  if (!university || !keyword) {
    return res.status(400).json({ error: 'university and keyword are required' });
  }

  // Validate university exists in DB for security / abuse limiting
  const dbResult = getUniversitiesFromDb({ search: String(university), limit: 5, page: 1 });
  const matchedUni = dbResult.universities.find(u => u.name.toLowerCase() === String(university).toLowerCase())
    || dbResult.universities[0];

  if (!matchedUni) {
    return res.status(404).json({ error: 'University not found in our database. Try a broader name.' });
  }

  const uniDomain = (matchedUni as any).domain || matchedUni.website || '';
  let domainHint = '';
  try {
    const url = new URL(uniDomain.startsWith('http') ? uniDomain : `https://${uniDomain}`);
    domainHint = url.hostname.replace(/^www\./, '');
  } catch { domainHint = String(uniDomain).replace(/^https?:\/\//, '').split('/')[0] || 'university.edu'; }

  // Offline fallback without Gemini key
  if (!hasGeminiKey()) {
    return res.json({
      university: matchedUni.name,
      country: matchedUni.country,
      domain: domainHint,
      professors: [
        {
          name: `Prof. Research Group Lead, ${keyword}`,
          title: 'Professor',
          department: `${keyword} Lab`,
          researchFocus: `Leading research in ${keyword} with publications in top venues.`,
          emailPattern: `firstname.lastname@${domainHint}`,
          profileUrl: matchedUni.website || matchedUni.applicationUrl || '#',
          whyContact: 'Mention your GPA, relevant project, and why their lab matches your interests in your first email.'
        }
      ],
      offline: true
    });
  }

  try {
    const ai = getAI();
    const prompt = `You are an academic advisor helping a ${degreeLevel || "Master's"} student find professors.

University: ${matchedUni.name} (${matchedUni.country})
Website/domain: ${domainHint}
Student research interest keyword: "${keyword}"

Task: Suggest 3 real faculty members (or, if you cannot verify exact current faculty, suggest 3 representative professor profiles for this university+field) who supervise research in "${keyword}".
For each, return:
- name (full name with title)
- title (Professor / Associate Professor ...)
- department
- researchFocus (1 sentence, specific sub-topics)
- emailPattern (how emails are formatted at this university, e.g., firstname.lastname@${domainHint})
- profileUrl (best guess department or lab URL)
- whyContact (1 sentence why a student with this keyword should email them)

Be specific to ${matchedUni.name}. Do NOT invent implausible names for well-known schools if you know real faculty; otherwise give plausible representative profiles labeled as "Representative".`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            professors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  title: { type: Type.STRING },
                  department: { type: Type.STRING },
                  researchFocus: { type: Type.STRING },
                  emailPattern: { type: Type.STRING },
                  profileUrl: { type: Type.STRING },
                  whyContact: { type: Type.STRING }
                },
                required: ['name', 'title', 'department', 'researchFocus', 'emailPattern', 'profileUrl', 'whyContact']
              }
            }
          },
          required: ['professors']
        }
      }
    });

    let parsed: any = { professors: [] };
    try { parsed = JSON.parse(response.text?.trim() || '{"professors":[]}'); } catch {}

    res.json({
      university: matchedUni.name,
      country: matchedUni.country,
      domain: domainHint,
      professors: (parsed.professors || []).slice(0, 3),
      offline: false
    });
  } catch (err: any) {
    console.error('Professor search failed:', err.message);
    res.status(500).json({ error: 'Professor search temporarily unavailable. Try again.' });
  }
});

export default router;
