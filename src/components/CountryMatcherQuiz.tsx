import React, { useState, useEffect, useMemo } from 'react';
import { Compass, Globe2, DollarSign, CloudSun, Languages, Briefcase, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { playClickSound } from '../utils/sound';

type QuizAnswer = Record<string, string>;

const QUESTIONS = [
  {
    id: 'budget',
    q: 'What is your yearly budget (tuition + living)?',
    options: [
      { value: 'low', label: 'Under $15k — I need low tuition + living costs', countries: ['Germany','Norway','Poland','India','Bangladesh'] },
      { value: 'mid', label: '$15k - $35k — Moderate budget', countries: ['Canada','Netherlands','France','Italy','Turkey','Malaysia'] },
      { value: 'high', label: 'Over $35k — Budget flexible', countries: ['United States','United Kingdom','Australia','Switzerland','Singapore'] },
    ]
  },
  {
    id: 'weather',
    q: 'Preferred climate?',
    options: [
      { value: 'cold', label: 'Cool / temperate', countries: ['Germany','Canada','United Kingdom','Norway','Netherlands'] },
      { value: 'warm', label: 'Warm / sunny', countries: ['Australia','India','Bangladesh','Malaysia','Turkey','Italy','Spain'] },
      { value: 'any', label: 'No preference', countries: [] },
    ]
  },
  {
    id: 'language',
    q: 'Language of instruction?',
    options: [
      { value: 'english', label: 'English-taught programs only', countries: ['United States','United Kingdom','Canada','Australia','Netherlands','Germany','Ireland'] },
      { value: 'any', label: 'Open to local language', countries: ['Germany','France','Japan','Turkey','Poland'] },
    ]
  },
  {
    id: 'field',
    q: 'Your field of study?',
    options: [
      { value: 'cs', label: 'Computer Science / Data / Engineering', countries: ['United States','Germany','Canada','United Kingdom','Singapore'] },
      { value: 'business', label: 'Business / Economics', countries: ['United Kingdom','United States','Singapore','Netherlands','Australia'] },
      { value: 'health', label: 'Health / Biomedical', countries: ['United Kingdom','Germany','Canada','Australia','United States'] },
      { value: 'other', label: 'Other / undecided', countries: [] },
    ]
  },
  {
    id: 'lifestyle',
    q: 'What matters most?',
    options: [
      { value: 'jobs', label: 'Post-study work visa & jobs', countries: ['Canada','Germany','Australia','United Kingdom','United States'] },
      { value: 'culture', label: 'Culture & travel in Europe', countries: ['Germany','France','Netherlands','Italy','Spain','Poland'] },
      { value: 'cost', label: 'Lowest living costs', countries: ['Germany','Poland','India','Bangladesh','Malaysia','Turkey'] },
    ]
  }
];

export default function CountryMatcherQuiz() {
  const { convertAmount } = useTheme();
  const [answers, setAnswers] = useState<QuizAnswer>({});
  const [costData, setCostData] = useState<any[]>([]);
  const [visaData, setVisaData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/data/cost_of_living.json').then(r=>r.ok?r.json():[]).then(setCostData).catch(()=>{});
    fetch('/data/visa_guide.json').then(r=>r.ok?r.json():[]).then(setVisaData).catch(()=>{});
  }, []);

  const ranked = useMemo(() => {
    if (Object.keys(answers).length < 5) return [];
    const scores: Record<string, number> = {};
    for (const q of QUESTIONS) {
      const ans = answers[q.id];
      const opt = q.options.find(o => o.value === ans);
      if (!opt) continue;
      for (const c of opt.countries) scores[c] = (scores[c]||0) + 1;
    }
    const allCountries = Array.from(new Set(Object.values(scores).length ? Object.keys(scores) : costData.map(c=>c.country))).slice(0, 20);
    return Object.entries(scores)
      .sort((a,b)=>b[1]-a[1])
      .slice(0, 5)
      .map(([country, score]) => {
        const cost = costData.find(c=>c.country===country);
        const visa = visaData.find(v=>v.country===country);
        const monthly = cost ? Math.round(cost.rentMonthly+cost.foodMonthly+cost.transportMonthly+cost.healthInsuranceMonthly+cost.miscMonthly) : null;
        return { country, score, cost, visa, monthly };
      });
  }, [answers, costData, visaData]);

  const progress = Object.keys(answers).length;

  return (
    <div className="space-y-6" id="scholarpath-country-quiz">
      <div className="mc-window-dark border-4 border-black p-4 text-stone-200">
        <h3 className="font-press text-[11px] text-[#55ff55] flex items-center gap-2">
          <Compass className="w-5 h-5" /> COUNTRY MATCHER QUIZ
        </h3>
        <p className="text-xs font-mono text-stone-400 mt-1">Answer 5 quick questions — get ranked country recommendations with living costs and visa info.</p>
        <div className="mt-3 h-2 bg-black/40 border-2 border-stone-800">
          <div className="h-full bg-[#55ff55] transition-all" style={{ width: `${(progress/5)*100}%` }} />
        </div>
        <p className="text-[10px] font-mono text-stone-500 mt-1">{progress} / 5 answered</p>
      </div>

      <div className="space-y-4">
        {QUESTIONS.map(q => (
          <div key={q.id} className="bg-[#2c2c2c] border-4 border-black p-4 space-y-3">
            <h4 className="font-bold text-stone-100 text-sm">{q.q}</h4>
            <div className="space-y-1.5">
              {q.options.map(opt => (
                <label key={opt.value} className={`flex items-center gap-3 p-2.5 border-2 cursor-pointer font-mono text-xs ${answers[q.id]===opt.value ? 'bg-[#ffff55] text-black border-black' : 'bg-black/30 border-stone-800 text-stone-300 hover:border-stone-600'}`}>
                  <input type="radio" name={q.id} value={opt.value} checked={answers[q.id]===opt.value} onChange={e=>{ playClickSound(); setAnswers(a=>({...a,[q.id]:e.target.value}))}} className="accent-[#55ff55]" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {ranked.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-press text-[10px] text-[#ffff55] uppercase flex items-center gap-2">
            <Globe2 className="w-4 h-4" /> Your top matches
          </h4>
          {ranked.map((r, i) => (
            <div key={r.country} className="bg-[#2c2c2c] border-4 border-black p-4 flex flex-col sm:flex-row justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-[#ffff55] text-black font-press text-[10px] flex items-center justify-center border-2 border-black">#{i+1}</span>
                  <span className="font-bold text-stone-100">{r.country}</span>
                  <span className="text-[10px] font-mono text-stone-400">{r.score}/5 matches</span>
                </div>
                {r.monthly && <p className="text-xs font-mono text-stone-300">Living cost: ~{convertAmount(r.monthly)}/mo · ~{convertAmount(r.monthly*12)}/yr</p>}
                {r.visa && <p className="text-[11px] font-mono text-stone-400">Visa: {r.visa.visaType} · {r.visa.processingTime} · Fee {r.visa.feeFormatted}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={r.visa?.officialUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-[#55ffff] hover:underline">Official visa info →</a>
              </div>
            </div>
          ))}
          <p className="text-[10px] font-mono text-stone-500">Tip: Open the Budget Planner to see a full breakdown for your top country, or check the Visa Guide for the step-by-step timeline.</p>
        </div>
      )}
    </div>
  );
}
