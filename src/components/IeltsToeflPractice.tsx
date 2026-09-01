import React, { useState } from 'react';
import { BookOpen, CheckCircle, RotateCcw, Award } from 'lucide-react';
import { playClickSound, playAdvancementSound } from '../utils/sound';

type Q = { q: string; options: string[]; answer: number; explain: string };

const READING_QS: Q[] = [
  { q: 'The scholarship requires a strong Statement of Purpose. What does "concise" mean?', options: ['Lengthy and detailed', 'Brief and to the point', 'Emotional', 'Technical'], answer: 1, explain: 'Concise = brief, clear, no filler.' },
  { q: 'Which sentence is grammatically correct for an SOP?', options: ['I has conducted research', 'I have conducted research on renewable energy', 'I conducting research', 'I are conducting research'], answer: 1, explain: 'Present perfect: have + past participle.' },
  { q: 'Choose the formal synonym for "a lot of"', options: ['loads of', 'numerous', 'heaps of', 'tons of'], answer: 1, explain: 'Numerous is formal academic English.' },
  { q: '"Eligible" means:', options: ['Not allowed', 'Qualified to apply', 'Expensive', 'Guaranteed'], answer: 1, explain: 'Eligible = meets requirements.' },
  { q: 'Which is correct for emailing a professor?', options: ['Yo Prof, give me position', 'Dear Professor Smith, I am writing to inquire...', 'Hey, I want job', 'Professor!!!'], answer: 1, explain: 'Formal, polite, specific.' },
  { q: 'IELTS Reading: Skimming is useful for:', options: ['Understanding every word', 'Getting the gist quickly', 'Memorizing', 'Translating'], answer: 1, explain: 'Skim for overall meaning.' },
  { q: 'TOEFL listening tip:', options: ['Ignore the question', 'Take notes on main ideas', 'Close eyes', 'Answer before listening'], answer: 1, explain: 'Note-taking helps.' },
  { q: 'Choose the correct article: "___ university"', options: ['An', 'A', 'The', 'No article'], answer: 1, explain: '"A university" (/j/ sound, use A).' },
  { q: '"Prerequisite" means:', options: ['Optional', 'Required beforehand', 'After', 'Unrelated'], answer: 1, explain: 'Pre = before, requisite = required.' },
  { q: 'Best way to improve vocabulary for IELTS?', options: ['Memorize word lists only', 'Read academic articles and note collocations', 'Translate randomly', 'Avoid reading'], answer: 1, explain: 'Context + collocations.' },
];

function bandFromScore(correct: number, total: number): string {
  const pct = correct / total;
  if (pct >= 0.85) return 'Band 8.5 - Excellent';
  if (pct >= 0.70) return 'Band 7.5 - Very Good';
  if (pct >= 0.55) return 'Band 6.5 - Competent';
  if (pct >= 0.40) return 'Band 6.0 - Competent';
  return 'Band 5.5 - Keep practicing';
}

export default function IeltsToeflPractice() {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplain, setShowExplain] = useState(false);
  const [finished, setFinished] = useState(false);

  const q = READING_QS[idx];

  const handleChoose = (i: number) => {
    if (chosen !== null) return;
    playClickSound();
    setChosen(i);
    setShowExplain(true);
    if (i === q.answer) { setScore(s => s + 1); playAdvancementSound(); }
  };

  const handleNext = () => {
    playClickSound();
    if (idx + 1 >= READING_QS.length) { setFinished(true); }
    else { setIdx(i => i + 1); setChosen(null); setShowExplain(false); }
  };

  const handleRestart = () => {
    playClickSound();
    setIdx(0); setChosen(null); setScore(0); setShowExplain(false); setFinished(false); setStarted(false);
  };

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="mc-window-dark border-4 border-black p-4 text-stone-200">
          <h3 className="font-press text-[11px] text-[#55ff55] flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> IELTS / TOEFL 10-MIN DRILL
          </h3>
          <p className="text-xs font-mono text-stone-400 mt-1">10 quick questions (Reading, Grammar, Academic Vocabulary). Get a band estimate instantly. No account needed.</p>
        </div>
        <div className="bg-[#2c2c2c] border-4 border-black p-6 text-center space-y-3">
          <p className="font-mono text-sm text-stone-300">Ready for a 10-minute practice test?</p>
          <button onClick={() => { playClickSound(); setStarted(true); }} className="mc-btn px-6 py-3 text-[10px]">Start Practice Test</button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="space-y-4">
        <div className="bg-[#2c2c2c] border-4 border-black p-6 text-center space-y-3">
          <Award className="w-10 h-10 text-[#ffaa00] mx-auto" />
          <h3 className="font-press text-[12px] text-[#ffff55]">Your Score: {score} / {READING_QS.length}</h3>
          <p className="font-mono text-sm text-[#55ff55] font-bold">{bandFromScore(score, READING_QS.length)}</p>
          <p className="text-xs font-mono text-stone-400">
            {score >= 7 ? 'Excellent! You are ready for academic writing.' : score >= 5 ? 'Good progress - review the explanations and try again.' : 'Keep practicing - focus on grammar and academic vocabulary.'}
          </p>
          <button onClick={handleRestart} className="mc-btn px-5 py-2 text-[9px] flex items-center gap-2 mx-auto">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center font-mono text-xs">
        <span className="text-stone-400">Question {idx + 1} / {READING_QS.length}</span>
        <span className="text-[#55ff55] font-bold">Score: {score}</span>
      </div>
      <div className="h-2 bg-black/40 border-2 border-stone-800">
        <div className="h-full bg-[#55ff55] transition-all" style={{ width: `${((idx)/READING_QS.length)*100}%` }} />
      </div>

      <div className="bg-[#2c2c2c] border-4 border-black p-5 space-y-4">
        <h4 className="font-bold text-stone-100 text-sm leading-relaxed">{q.q}</h4>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.answer;
            const isChosen = chosen === i;
            return (
              <button
                key={i}
                onClick={() => handleChoose(i)}
                disabled={chosen !== null}
                className={`w-full text-left p-3 border-2 font-mono text-xs flex items-center justify-between ${
                  chosen === null ? 'bg-black/30 border-stone-800 text-stone-300 hover:border-stone-600' :
                  isCorrect ? 'bg-emerald-950/50 border-[#55ff55] text-stone-100' :
                  isChosen ? 'bg-red-950/40 border-red-600 text-stone-200' : 'bg-black/20 border-stone-800 text-stone-500'
                }`}
              >
                <span>{opt}</span>
                {chosen !== null && isCorrect && <CheckCircle className="w-4 h-4 text-[#55ff55] shrink-0" />}
              </button>
            );
          })}
        </div>
        {showExplain && (
          <div className="bg-black/40 border-l-4 border-[#ffaa00] p-3">
            <p className="text-xs font-mono text-stone-300"><strong className="text-[#ffaa00]">Explain:</strong> {q.explain}</p>
          </div>
        )}
        {chosen !== null && (
          <button onClick={handleNext} className="mc-btn w-full py-2.5 text-[9px]">{idx + 1 >= READING_QS.length ? 'See Results →' : 'Next Question →'}</button>
        )}
      </div>
    </div>
  );
}
