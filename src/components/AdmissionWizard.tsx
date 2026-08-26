import React, { useState, useEffect, useMemo } from 'react';
import { Target, GraduationCap, Globe2, TrendingUp, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { playClickSound } from '../utils/sound';

interface UniRow {
  id?: string;
  name: string;
  country: string;
  ranking?: number | string;
  acceptanceRate?: string | number;
  averageGpa?: number;
  tuitionMin?: number;
  tuitionMax?: number;
  website?: string;
  applicationUrl?: string;
}

type Verdict = 'safety' | 'match' | 'reach';

interface UniChance extends UniRow {
  chance: number;      // 0-100 estimate
  verdict: Verdict;
}

const DEGREE_LEVELS = [
  "Bachelor's Degree",
  "Master's Degree",
  'Doctoral Degree'
];

const SCALE_OPTIONS = [
  { value: '4.0', label: 'GPA on 4.0 scale' },
  { value: '5.0', label: 'GPA on 5.0 scale' },
  { value: '100', label: 'Percentage (out of 100)' }
];

function parseAcceptanceRate(rate: unknown): number | null {
  if (rate === null || rate === undefined) return null;
  const s = String(rate).trim();
  const m = s.match(/([\d.]+)\s*%/);
  if (m) {
    const val = parseFloat(m[1]);
    return isNaN(val) ? null : Math.max(1, Math.min(99, val));
  }
  const num = parseFloat(s);
  if (!isNaN(num)) {
    // Heuristic: values <= 1 are fractions, <= 100 are percents already odd ones ignored
    if (num > 0 && num <= 1) return num * 100;
    if (num > 1 && num < 100) return num;
  }
  return null;
}

function normalizeToFourPoint(gpa: number, scale: string): number {
  if (scale === '4.0') return Math.max(0, Math.min(4, gpa));
  if (scale === '5.0') return Math.max(0, Math.min(4, (gpa / 5) * 4));
  if (scale === '100') return Math.max(0, Math.min(4, (gpa / 100) * 4));
  return gpa;
}

function computeChance(myGpa: number, uni: UniRow): number {
  const uniAvg = typeof uni.averageGpa === 'number' && uni.averageGpa > 0 ? Math.min(uni.averageGpa, 4) : 3.0;
  const gpaGap = myGpa - uniAvg;

  // GPA contribution: meeting the average gives ~55; each +0.1 adds ~4 pts
  let gpaPoints = 55 + gpaGap * 40;

  // Acceptance-rate contribution (selective schools drag the estimate down)
  const acc = parseAcceptanceRate(uni.acceptanceRate);
  let accPoints = 50; // neutral when unknown
  if (acc !== null) {
    accPoints = Math.max(5, Math.min(85, acc));
  }

  let chance = gpaPoints * 0.65 + accPoints * 0.35;

  // Slight penalty for ultra-competitive ranks (top 50 worldwide)
  const rank = typeof uni.ranking === 'string' ? parseInt(uni.ranking) : uni.ranking;
  if (!isNaN(rank as number) && (rank as number) > 0 && (rank as number) <= 50) {
    chance -= 6;
  }

  return Math.round(Math.max(3, Math.min(96, chance)));
}

function verdictOf(chance: number): Verdict {
  if (chance >= 68) return 'safety';
  if (chance >= 42) return 'match';
  return 'reach';
}

export default function AdmissionWizard() {
  const { authorizedFetch } = useAuth();
  const { convertAmount } = useTheme();

  const [step, setStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);

  // Step 1 - grades
  const [gpaInput, setGpaInput] = useState('');
  const [scale, setScale] = useState('4.0');
  const [degreeLevel, setDegreeLevel] = useState(DEGREE_LEVELS[1]);

  // Step 2 - goals
  const [major, setMajor] = useState('');
  const [country, setCountry] = useState('');

  const [unis, setUnis] = useState<UniRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        let rows: UniRow[] = [];
        const res = await authorizedFetch('/api/universities?limit=2000');
        if (res.ok) {
          const data = await res.json();
          rows = data.universities || data || [];
        }
        if (!rows || rows.length === 0) {
          const fb = await fetch('/data/universities.json');
          if (fb.ok) rows = await fb.json();
        }
        setUnis(rows);
      } catch (e) {
        console.warn('University load failed in wizard:', e);
      } finally {
        setLoadingData(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    unis.forEach(u => { if (u.country) set.add(u.country); });
    return Array.from(set).sort();
  }, [unis]);

  const results: UniChance[] = useMemo(() => {
    const myGpa = normalizeToFourPoint(parseFloat(gpaInput) || 0, scale);
    if (!myGpa) return [];

    const lowerMajor = major.trim().toLowerCase();
    return unis
      .filter(u => !country || u.country === country)
      .map(u => ({ ...u, chance: computeChance(myGpa, u), verdict: verdictOf(computeChance(myGpa, u)) }))
      .map(u => {
        // Small boost when the university lists your intended major as popular
        if (lowerMajor && Array.isArray((u as any).popularMajors)) {
          const pm: string[] = (u as any).popularMajors;
          if (pm.some(m => m.toLowerCase().includes(lowerMajor))) {
            return { ...u, chance: Math.min(96, u.chance + 4) };
          }
        }
        return u;
      })
      .sort((a, b) => b.chance - a.chance);
  }, [unis, gpaInput, scale, country, major]);

  const grouped = useMemo(() => ({
    safety: results.filter(r => r.verdict === 'safety').slice(0, 6),
    match: results.filter(r => r.verdict === 'match').slice(0, 6),
    reach: results.filter(r => r.verdict === 'reach').slice(0, 6),
  }), [results]);

  const myGpa4 = normalizeToFourPoint(parseFloat(gpaInput) || 0, scale);

  const improvementTips = useMemo(() => {
    const tips: string[] = [];
    if (myGpa4 && myGpa4 < 3.3) tips.push('Raise your GPA this semester - even +0.1 moves several "Reach" schools into "Match".');
    if (myGpa4 >= 3.3 && myGpa4 < 3.7) tips.push('Your GPA clears most minimums. Add one strong research project or publication to stand out.');
    if (major.trim()) tips.push(`Take a free online course in ${major.trim()} (Coursera / edX) and mention it in your SOP.`);
    tips.push('Draft your Statement of Purpose early - use the Document Center for a free AI review.');
    tips.push('Ask two professors for recommendation letters at least 6 weeks before deadlines.');
    if (!gpaInput) tips.push('Enter your grades above to unlock personalized chances.');
    return tips.slice(0, 4);
  }, [myGpa4, major, gpaInput]);

  const handleNext = () => { playClickSound(); setStep(s => Math.min(3, s + 1)); };
  const handleBack = () => { playClickSound(); setStep(s => Math.max(1, s - 1)); };

  const verdictStyles: Record<Verdict, { label: string; badge: string; ring: string }> = {
    safety: { label: 'Likely Admit (Safety)', badge: 'bg-emerald-950 text-[#55ff55] border-[#55ff55]', ring: 'border-[#55ff55]' },
    match: { label: 'Good Match', badge: 'bg-amber-950 text-[#ffaa00] border-[#ffaa00]', ring: 'border-[#ffaa00]' },
    reach: { label: 'Reach (Ambitious)', badge: 'bg-red-950 text-red-300 border-red-500', ring: 'border-red-500' },
  };

  const renderUniCard = (u: UniChance) => (
    <div key={u.name} className={`bg-[#242220] border-2 ${verdictStyles[u.verdict].ring} p-3 space-y-1.5`}>
      <div className="flex justify-between items-start gap-2">
        <span className="font-bold text-stone-100 text-xs leading-snug">{u.name}</span>
        <span className="font-press text-[13px] text-[#ffff55] shrink-0">{u.chance}%</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono text-stone-400">
        <span>{u.country}</span>
        {u.ranking ? <span>Rank #{u.ranking}</span> : null}
        {typeof u.averageGpa === 'number' && u.averageGpa > 0 ? <span>Avg GPA: {u.averageGpa.toFixed(2)}</span> : null}
        {(typeof u.tuitionMin === 'number' && u.tuitionMin > 0)
          ? <span className="text-[#55ff55]">Tuition: {convertAmount(u.tuitionMin)}-{convertAmount(u.tuitionMax || u.tuitionMin)}/yr</span>
          : <span className="text-[#55ff55]">Low / no tuition</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6" id="scholarpath-admission-wizard">

      {/* Header */}
      <div className="mc-window-dark border-4 border-black p-4 text-stone-200">
        <h3 className="font-press text-[11px] text-[#55ff55] uppercase flex items-center gap-2 mc-text-shadow">
          <Target className="w-5 h-5 text-[#55ff55]" /> WILL I GET IN?
        </h3>
        <p className="text-xs text-stone-350 font-mono mt-2 leading-relaxed">
          Enter your grades and goals - we compare them against real admission averages from our university database and show where you stand, plus what to improve.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 px-1">
        {['Your Grades', 'Your Goals', 'Results'].map((label, idx) => {
          const n = idx + 1;
          const active = step === n;
          const done = step > n;
          return (
            <React.Fragment key={label}>
              {idx > 0 && <div className={`flex-1 h-1 ${step > idx ? 'bg-[#55ff55]' : 'bg-stone-700'}`} />}
              <button
                onClick={() => { playClickSound(); setStep(n); }}
                className={`flex items-center gap-2 px-3 py-1.5 border-2 cursor-pointer ${
                  active ? 'border-[#ffff55] bg-black/50' : done ? 'border-[#55ff55] bg-black/30' : 'border-stone-700 bg-black/20'
                }`}
              >
                {done ? <CheckCircle className="w-4 h-4 text-[#55ff55]" /> : <span className="font-press text-[9px] text-stone-300">{n}</span>}
                <span className={`font-mono text-[10px] uppercase font-bold ${active ? 'text-[#ffff55]' : 'text-stone-400'}`}>{label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: GRADES */}
      {step === 1 && (
        <div className="bg-[#2c2927] border-4 border-black p-6 space-y-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]" id="wizard-step-grades">
          <h4 className="font-press text-[10px] text-[#ffff55] uppercase flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> What are your current grades?
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block font-mono text-[11px] text-stone-300 uppercase font-bold">Your GPA / Score</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={scale === '100' ? 'e.g. 87' : 'e.g. 3.5'}
                value={gpaInput}
                onChange={(e) => setGpaInput(e.target.value)}
                className="w-full bg-black/40 border-4 border-stone-800 focus:border-[#ffff55] outline-none text-stone-100 px-4 py-3 text-lg font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="block font-mono text-[11px] text-stone-300 uppercase font-bold">Grading system</label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                className="w-full bg-[#3a3a3a] border-4 border-black text-stone-100 text-xs font-mono px-3 py-3 outline-none"
              >
                {SCALE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[11px] text-stone-300 uppercase font-bold">What level do you want to study?</label>
            <div className="flex flex-wrap gap-2">
              {DEGREE_LEVELS.map(d => (
                <button
                  key={d}
                  onClick={() => { playClickSound(); setDegreeLevel(d); }}
                  className={`px-4 py-2 border-2 cursor-pointer font-mono text-[11px] font-bold ${
                    degreeLevel === d
                      ? 'border-[#ffff55] bg-black/50 text-[#ffff55]'
                      : 'border-stone-700 bg-black/25 text-stone-300 hover:border-stone-500'
                  }`}
                >
                  {d.replace(/'s Degree$/, '')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black/30 border-2 border-stone-800 p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-stone-400 leading-relaxed">
              Your score is converted internally so we can compare it fairly against each university's admitted-student averages.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={!gpaInput || parseFloat(gpaInput) <= 0}
              className="mc-btn px-6 py-3 text-[#ffff55] font-press text-[10px] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              NEXT: YOUR GOALS <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: GOALS */}
      {step === 2 && (
        <div className="bg-[#2c2927] border-4 border-black p-6 space-y-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]" id="wizard-step-goals">
          <h4 className="font-press text-[10px] text-[#ffff55] uppercase flex items-center gap-2">
            <Globe2 className="w-4 h-4" /> Where do you want to study?
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block font-mono text-[11px] text-stone-300 uppercase font-bold">Intended field / major</label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Medicine..."
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full bg-black/40 border-4 border-stone-800 focus:border-[#ffff55] outline-none text-stone-100 px-4 py-3 text-sm font-mono"
              />
              <p className="text-[10px] font-mono text-stone-500">Optional, but improves matching.</p>
            </div>
            <div className="space-y-2">
              <label className="block font-mono text-[11px] text-stone-300 uppercase font-bold">Destination country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={loadingData}
                className="w-full bg-[#3a3a3a] border-4 border-black text-stone-100 text-xs font-mono px-3 py-3 outline-none max-h-40"
              >
                <option value="">🌍 Compare all countries</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="text-[10px] font-mono text-stone-500">
                {loadingData ? 'Loading university database...' : `${unis.length} universities loaded.`}
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={handleBack} className="mc-btn px-5 py-3 text-stone-300 font-press text-[10px] flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> BACK
            </button>
            <button onClick={handleNext} className="mc-btn px-6 py-3 text-[#ffff55] font-press text-[10px] flex items-center gap-2">
              SEE MY CHANCES <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULTS */}
      {step === 3 && (
        <div className="space-y-6" id="wizard-step-results">
          {/* Summary banner */}
          <div className="bg-[#2c2927] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="space-y-1">
                <h4 className="font-press text-[10px] text-[#55ff55] uppercase">Your admission outlook</h4>
                <p className="text-xs font-mono text-stone-300">
                  GPA <strong className="text-[#ffff55]">{gpaInput}{scale !== '4.0' ? ` (${scale}-scale)` : ''}</strong>
                  {' '}≈ <strong className="text-[#ffff55]">{myGpa4.toFixed(2)}/4.0</strong>
                  {country ? <> · Country: <strong className="text-stone-100">{country}</strong></> : <> · All countries</>}
                  {major ? <> · Field: <strong className="text-stone-100">{major}</strong></> : null}
                  {' '}· {results.length} universities compared
                </p>
              </div>
              <button
                onClick={() => { playClickSound(); setStep(1); }}
                className="mc-btn px-3 py-2 text-[9px] font-mono uppercase text-[#ffff55] flex items-center gap-2 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Change inputs
              </button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="bg-[#2c2927] border-4 border-black p-8 text-center font-mono text-sm text-stone-300">
              No universities matched. Try removing the country filter.
            </div>
          ) : (
            <>
              {/* Likely admits */}
              <section className="space-y-3">
                <h4 className="font-press text-[10px] text-[#55ff55] uppercase flex items-center gap-2">
                  ✅ {verdictStyles.safety.label} {grouped.safety.length > 0 && <span className="text-stone-400 font-mono text-[10px]">({grouped.safety.length} shown)</span>}
                </h4>
                {grouped.safety.length > 0
                  ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{grouped.safety.map(renderUniCard)}</div>
                  : <p className="text-xs font-mono text-stone-500 px-1">None at your current GPA - see improvement tips below.</p>}
              </section>

              {/* Matches */}
              <section className="space-y-3">
                <h4 className="font-press text-[10px] text-[#ffaa00] uppercase flex items-center gap-2">
                  🎯 {verdictStyles.match.label} {grouped.match.length > 0 && <span className="text-stone-400 font-mono text-[10px]">({grouped.match.length} shown)</span>}
                </h4>
                {grouped.match.length > 0
                  ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{grouped.match.map(renderUniCard)}</div>
                  : <p className="text-xs font-mono text-stone-500 px-1">None in this band for the selected filters.</p>}
              </section>

              {/* Reaches */}
              <section className="space-y-3">
                <h4 className="font-press text-[10px] text-red-400 uppercase flex items-center gap-2">
                  🚀 {verdictStyles.reach.label} {grouped.reach.length > 0 && <span className="text-stone-400 font-mono text-[10px]">({grouped.reach.length} shown)</span>}
                </h4>
                {grouped.reach.length > 0
                  ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{grouped.reach.map(renderUniCard)}</div>
                  : <p className="text-xs font-mono text-stone-500 px-1">Nothing here - you clear almost every bar. Aim high!</p>}
              </section>

              {/* Improvement plan */}
              <div className="bg-[#2c2927] border-4 border-black p-5 space-y-3 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
                <h4 className="font-press text-[10px] text-[#ffff55] uppercase">📈 How to improve your chances</h4>
                <ul className="space-y-2">
                  {improvementTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-mono text-stone-300 leading-relaxed">
                      <CheckCircle className="w-4 h-4 text-[#55ff55] shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] font-mono text-stone-500 pt-1 border-t border-stone-800">
                  Estimates are based on published admission averages and acceptance rates - they are guidance, not guarantees. Track your favorites in the Applications Ledger.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
