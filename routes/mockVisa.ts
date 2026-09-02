import express, { Request, Response } from 'express';
import { authenticateToken } from './auth.js';
import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI_MODEL } from './aiConfig.js';
import { aiRateLimiter } from './rateLimitAI.js';

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

function hasKey(): boolean { return !!process.env.GEMINI_API_KEY; }

// POST /api/mock-visa/interview  { country, visaType, userAnswer, history }
router.post('/interview', authenticateToken, aiRateLimiter, async (req: Request, res: Response) => {
  const { country, visaType, userAnswer, history } = req.body;
  if (!country) return res.status(400).json({ error: 'country is required' });

  // Offline fallback without Gemini key
  if (!hasKey()) {
    const qs = [
      `Why have you chosen to study in ${country} instead of your home country?`,
      `How will you fund your studies and living costs in ${country}?`,
      `What are your plans after completing your studies in ${country}?`,
      `Why did you choose this specific university and course in ${country}?`
    ];
    const q = qs[(history?.length || 0) % qs.length];
    if (!userAnswer) return res.json({ question: q, offline: true });
    return res.json({
      score: 7,
      feedback: 'Good structure. Mention specific proof-of-funds documents and tie your answer to your home-country career plans to show non-immigrant intent. Add one concrete number (e.g., bank balance, tuition fee).',
      nextQuestion: qs[((history?.length || 0) + 1) % qs.length],
      offline: true
    });
  }

  try {
    const ai = getAI();
    if (!userAnswer) {
      // First question
      const prompt = `You are a strict but fair visa officer for ${country} interviewing a student for ${visaType || 'a student visa'}. Ask ONE opening visa interview question. Make it specific to ${country} (mention funds, ties to home country, or course choice). Return JSON: {"question": "your question"}`;
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: { type: Type.OBJECT, properties: { question: { type: Type.STRING } }, required: ['question'] }
        }
      });
      const data = JSON.parse(response.text?.trim() || '{"question":"Why do you want to study in ' + country + '?"}');
      return res.json({ question: data.question, offline: false });
    }

    // Score the answer and give next question
    const histText = (history || []).slice(-4).map((h: any) => `${h.role}: ${h.text}`).join('\n');
    const prompt = `You are a visa officer for ${country} (${visaType || 'student visa'}). The student just answered:

"${userAnswer}"

Conversation so far:
${histText}

Tasks:
1. Score the answer 1-10 (10=excellent: specific, mentions funds/documents, shows home ties, concise).
2. Give 2-3 sentences of specific feedback: what was good, what to improve, mention one thing specific to ${country} if relevant.
3. Ask ONE follow-up visa interview question for ${country}.

Return JSON: {"score": number, "feedback": "string", "nextQuestion": "string"}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            nextQuestion: { type: Type.STRING }
          },
          required: ['score', 'feedback', 'nextQuestion']
        }
      }
    });
    const data = JSON.parse(response.text?.trim() || '{"score":6,"feedback":"Try to be more specific.","nextQuestion":"Tell me more about your funding."}');
    res.json({ score: Math.max(1, Math.min(10, Math.round(data.score))), feedback: data.feedback, nextQuestion: data.nextQuestion, offline: false });
  } catch (err: any) {
    console.error('Mock visa interview failed:', err.message);
    res.status(500).json({ error: 'Interview service temporarily unavailable.' });
  }
});

export default router;
