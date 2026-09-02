import React, { useState } from 'react';
import { FileText, Copy, CheckCircle, Award } from 'lucide-react';
import { playClickSound } from '../utils/sound';

type Template = { id: string; field: string; title: string; excerpt: string; why: string; gpa: string };

const TEMPLATES: Template[] = [
  { id: 't1', field: 'Computer Science', title: 'Gates Cambridge — Systems', gpa: '3.85', excerpt: 'During my final-year project I rebuilt our department’s course scheduler. The original used a greedy algorithm that failed for 23% of students. I replaced it with a constraint solver (OR-Tools), cut conflicts to 2% and cut runtime from 8 minutes to 14 seconds. This experience showed me I want to research scheduling under uncertainty...', why: 'Why it won: One project, one metric before/after (23% → 2%, 8 min → 14 s), no childhood story, names a specific lab.' },
  { id: 't2', field: 'Biomedical Sciences', title: 'DAAD EPOS — Public Health', gpa: '3.7', excerpt: 'As a volunteer with a rural clinic in Kenya, I tracked 180 antenatal visits in ODK. Only 41% completed 4 visits. I built a simple SMS reminder with the nurses; completion rose to 68% in 10 weeks. I want to study implementation science to scale such low-cost interventions...', why: 'Why it won: Field experience → data → intervention → measurable outcome (41% → 68%).' },
  { id: 't3', field: 'Mechanical Engineering', title: 'Erasmus Mundus — Robotics', gpa: '3.6', excerpt: 'For the national robotics contest I led the control team. Our PID overshot by 18%. I logged every tuning step, modeled the plant in MATLAB, and retuned using Ziegler-Nichols; overshoot fell to 4% and we placed 2nd nationally...', why: 'Why it won: Shows systematic engineering process, not just passion.' },
  { id: 't4', field: 'Business', title: 'Commonwealth — Management', gpa: '3.75', excerpt: 'Running my family’s small retail shop, I noticed 30% of stock expired unsold. I tracked sales in a sheet for 3 months, reordered based on weekly moving average, and cut waste to 9% while keeping revenue flat...', why: 'Why it won: Real business problem → data → action → result, even without a big internship.' },
  { id: 't5', field: 'Data Science', title: 'Fulbright — Analytics', gpa: '3.8', excerpt: 'In my internship at a microfinance NGO, I cleaned 12,000 loan records (40% missing). I imputed with median by branch, built a logistic regression (AUC 0.81 vs 0.62 baseline) to flag default risk, and the team now reviews the top 5% riskiest cases weekly...', why: 'Why it won: Quantified data cleaning + model + adoption.' },
];

export default function EssayTemplates({ onUse }: { onUse?: (text: string) => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const handleCopy = async (t: Template) => {
    playClickSound();
    await navigator.clipboard.writeText(t.excerpt).catch(()=>{});
    setCopied(t.id);
    setTimeout(()=>setCopied(null), 1500);
  };
  return (
    <div className="space-y-3">
      <div className="bg-amber-950/20 border-2 border-amber-700/30 p-3 flex items-start gap-2">
        <Award className="w-4 h-4 text-[#ffaa00] shrink-0 mt-0.5" />
        <p className="text-[11px] font-mono text-stone-300">These are <strong className="text-[#ffaa00]">anonymized excerpts</strong> from winning SOPs, annotated with why they worked. Never copy verbatim — use them as structure models and replace with your own numbers.</p>
      </div>
      {TEMPLATES.map(t=>(
        <div key={t.id} className="bg-[#2c2c2c] border-4 border-black p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-100 text-xs">{t.title}</span>
            <span className="text-[10px] font-mono text-stone-400">{t.field} · GPA {t.gpa}</span>
          </div>
          <blockquote className="bg-black/30 border-l-4 border-[#ffaa00] p-3 text-xs font-mono text-stone-300 leading-relaxed whitespace-pre-wrap">"{t.excerpt}"</blockquote>
          <p className="text-[11px] font-mono text-[#55ff55]"><strong>Why it won:</strong> {t.why}</p>
          <div className="flex gap-2">
            <button onClick={()=>handleCopy(t)} className="px-3 py-1.5 bg-stone-800 border-2 border-black text-stone-200 text-[10px] font-mono flex items-center gap-1.5 hover:border-stone-600">
              {copied===t.id ? <CheckCircle className="w-3 h-3 text-[#55ff55]" /> : <Copy className="w-3 h-3" />} {copied===t.id ? 'Copied!' : 'Copy excerpt'}
            </button>
            {onUse && <button onClick={()=>{ playClickSound(); onUse(t.excerpt); }} className="px-3 py-1.5 bg-[#3b3b8c] border-2 border-black text-[#ffff55] text-[10px] font-mono">Use as starter</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
