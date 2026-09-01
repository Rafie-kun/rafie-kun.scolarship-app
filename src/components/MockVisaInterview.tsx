import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, RotateCcw, Award, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';

type Turn = { role: 'officer' | 'student'; text: string; score?: number; feedback?: string };

export default function MockVisaInterview() {
  const { authorizedFetch } = useAuth();
  const [country, setCountry] = useState('United States');
  const [countries, setCountries] = useState<string[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetch('/data/visa_guide.json').then(r=>r.ok?r.json():[]).then((data:any[])=> setCountries(data.map(v=>v.country))).catch(()=>{});
  }, []);

  const startInterview = async () => {
    playClickSound();
    setLoading(true);
    try {
      const res = await authorizedFetch('/api/mock-visa/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country })
      });
      const data = await res.json();
      setTurns([{ role: 'officer', text: data.question }]);
      setStarted(true);
    } catch {}
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    setTurns(t => [...t, { role: 'student', text: userText }]);
    setLoading(true);
    try {
      const history = [...turns, { role: 'student', text: userText }].map(t => ({ role: t.role, text: t.text }));
      const res = await authorizedFetch('/api/mock-visa/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, userAnswer: userText, history })
      });
      const data = await res.json();
      setTurns(t => [...t, { role: 'officer', text: data.nextQuestion || data.question, score: data.score, feedback: data.feedback }]);
    } catch {}
    setLoading(false);
  };

  const avgScore = turns.filter(t=>t.score).reduce((s,t)=>s+(t.score||0),0) / (turns.filter(t=>t.score).length || 1);

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="mc-window-dark border-4 border-black p-4 text-stone-200">
          <h3 className="font-press text-[11px] text-[#55ff55] flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> MOCK VISA INTERVIEW
          </h3>
          <p className="text-xs font-mono text-stone-400 mt-1">Practice with an AI visa officer for your destination country. Get scored after each answer.</p>
        </div>
        <div className="bg-[#2c2c2c] border-4 border-black p-5 space-y-4">
          <label className="block font-mono text-[11px] text-stone-300 uppercase font-bold">Destination country</label>
          <select value={country} onChange={e=>setCountry(e.target.value)} className="w-full bg-[#3a3a3a] border-4 border-black text-stone-100 text-xs font-mono px-3 py-3">
            {countries.map(c=> <option key={c} value={c}>{c}</option>)}
            {!countries.includes(country) && <option value={country}>{country}</option>}
          </select>
          <button onClick={startInterview} disabled={loading} className="mc-btn w-full py-3 text-[10px] flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" /> {loading ? 'Starting...' : 'Start Interview'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-press text-[10px] text-[#ffff55] flex items-center gap-2">
          <Globe className="w-4 h-4" /> {country} — Mock Interview
        </h3>
        <div className="flex items-center gap-2">
          {turns.some(t=>t.score) && <span className="text-[11px] font-mono text-[#55ff55] font-bold">Avg: {avgScore.toFixed(1)} / 10</span>}
          <button onClick={()=>{ setTurns([]); setStarted(false); }} className="text-[10px] font-mono text-stone-400 hover:text-stone-200 border border-stone-700 px-2 py-1 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Restart
          </button>
        </div>
      </div>

      <div className="bg-[#1a1817] border-4 border-black p-4 space-y-3 max-h-[420px] overflow-y-auto">
        {turns.map((t,i)=>(
          <div key={i} className={`p-3 border-2 ${t.role==='officer' ? 'bg-stone-900 border-stone-700' : 'bg-[#2c2c2c] border-[#55ff55]/30 ml-6'}`}>
            <span className={`text-[9px] font-press uppercase ${t.role==='officer' ? 'text-[#ffaa00]' : 'text-[#55ff55]'}`}>{t.role==='officer' ? 'Visa Officer' : 'You'}</span>
            <p className="text-xs font-mono text-stone-200 mt-1 leading-relaxed">{t.text}</p>
            {t.score !== undefined && (
              <div className="mt-2 p-2 bg-black/30 border border-stone-800 space-y-1">
                <span className="text-[10px] font-mono text-[#ffaa00] font-bold flex items-center gap-1"><Award className="w-3 h-3" /> Score: {t.score} / 10</span>
                <p className="text-[11px] font-mono text-stone-300">{t.feedback}</p>
              </div>
            )}
          </div>
        ))}
        {loading && <p className="text-xs font-mono text-stone-500 animate-pulse">Officer is reviewing your answer...</p>}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} placeholder="Type your answer..." className="flex-1 bg-black/40 border-4 border-stone-800 text-stone-200 px-4 py-3 text-xs font-mono focus:border-[#ffff55] outline-none" />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="mc-btn px-5 py-3 text-[9px] flex items-center gap-2 disabled:opacity-50">
          <Send className="w-4 h-4" /> Send
        </button>
      </div>
    </div>
  );
}
