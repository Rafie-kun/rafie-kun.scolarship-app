import React, { useState, useEffect } from 'react';
import { Plane, Home, Heart, Building2, FileCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';

type VisaItem = { country: string; visaType: string; officialUrl: string };
type Progress = Record<string, boolean>;

const BASE_TASKS = [
  { id: 'passport', label: 'Passport valid 6+ months beyond stay', icon: FileCheck },
  { id: 'admission', label: 'Admission letter / CAS / I-20 received', icon: Building2 },
  { id: 'funds', label: 'Proof of funds / bank statement ready (meets threshold)', icon: FileCheck },
  { id: 'visa', label: 'Visa application submitted', icon: Plane },
  { id: 'insurance', label: 'Health insurance arranged (required by most countries)', icon: Heart },
  { id: 'housing', label: 'Housing secured (dorm application or private flat)', icon: Home },
  { id: 'bank', label: 'Blocked account / local bank account opened (Germany, etc.)', icon: Building2 },
  { id: 'registration', label: 'City registration booked (Anmeldung, etc. where required)', icon: FileCheck },
  { id: 'flight', label: 'Flight booked (after visa entry date confirmed)', icon: Plane },
];

export default function PreDepartureChecklist() {
  const { user } = useAuth();
  const [countries, setCountries] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [visa, setVisa] = useState<VisaItem | null>(null);
  const [progress, setProgress] = useState<Progress>({});

  const storageKey = `scholarpath_predeparture_${user || 'guest'}_${selected || 'none'}`;

  useEffect(() => {
    fetch('/data/visa_guide.json').then(r=>r.ok?r.json():[]).then((data:any[])=>{
      const list = data.map(v=>v.country);
      setCountries(list);
      if (list.length && !selected) setSelected(list[0]);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch('/data/visa_guide.json').then(r=>r.ok?r.json():[]).then((data:any[])=>{
      setVisa(data.find(v=>v.country===selected) || null);
    }).catch(()=>{});
    try {
      const raw = localStorage.getItem(storageKey);
      setProgress(raw ? JSON.parse(raw) : {});
    } catch { setProgress({}); }
  }, [selected, storageKey]);

  const toggle = (id: string) => {
    playClickSound();
    const next = { ...progress, [id]: !progress[id] };
    setProgress(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const doneCount = BASE_TASKS.filter(t=>progress[t.id]).length;

  return (
    <div className="space-y-4" id="scholarpath-predeparture">
      <div className="mc-window-dark border-4 border-black p-4 text-stone-200">
        <h3 className="font-press text-[11px] text-[#55ff55] flex items-center gap-2">
          <Plane className="w-5 h-5" /> PRE-DEPARTURE CHECKLIST
        </h3>
        <p className="text-xs font-mono text-stone-400 mt-1">City registration, health insurance, bank account — by destination country. Check them off as you go (saved locally).</p>
      </div>

      <div className="bg-[#2c2c2c] border-4 border-black p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-stone-300">Destination:</span>
          <select value={selected} onChange={e=>{ playClickSound(); setSelected(e.target.value); }} className="bg-[#3a3a3a] border-4 border-black text-stone-100 text-xs font-mono px-3 py-2">
            {countries.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <span className="text-xs font-mono text-stone-400">{doneCount} / {BASE_TASKS.length} done</span>
      </div>

      {visa && (
        <div className="bg-black/30 border-2 border-stone-800 p-3 font-mono text-xs text-stone-300">
          <strong className="text-stone-100">{visa.country} — {visa.visaType}</strong> · Official guide: <a href={visa.officialUrl} target="_blank" rel="noopener noreferrer" className="text-[#55ffff] hover:underline">Open →</a>
        </div>
      )}

      <div className="space-y-2">
        {BASE_TASKS.map(task => {
          const Icon = task.icon;
          const done = !!progress[task.id];
          return (
            <button
              key={task.id}
              onClick={()=>toggle(task.id)}
              className={`w-full text-left p-3 border-2 flex items-center gap-3 ${done ? 'bg-emerald-950/30 border-[#55ff55]/30' : 'bg-[#2c2c2c] border-black hover:border-stone-600'}`}
            >
              <span className={`w-6 h-6 border-2 flex items-center justify-center shrink-0 ${done ? 'bg-[#55ff55] border-[#55ff55] text-black' : 'border-stone-600 bg-black'}`}>{done ? '✓' : ''}</span>
              <Icon className={`w-4 h-4 shrink-0 ${done ? 'text-[#55ff55]' : 'text-stone-500'}`} />
              <span className={`text-xs font-mono ${done ? 'line-through text-stone-500' : 'text-stone-200'}`}>{task.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-amber-950/30 border-2 border-amber-700 p-3 flex items-start gap-2">
        <CheckCircle className="w-4 h-4 text-[#ffaa00] shrink-0 mt-0.5" />
        <p className="text-[11px] font-mono text-stone-300">Tip: Do not book non-refundable flights before your visa is approved and you have the entry date. For Germany, open the blocked account (Sperrkonto) at least 6 weeks before travel.</p>
      </div>
    </div>
  );
}
