import React, { useState, useEffect } from 'react';
import { Award, Upload, CheckCircle, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';

type Story = { id: string; author: string; university: string; scholarship: string; gpa: string; text: string; verified: boolean; createdAt: string };

export default function SuccessStoriesWall() {
  const { authorizedFetch, user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ university: '', scholarship: '', gpa: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/success-stories' + (filter !== 'all' ? `?verified=${filter === 'verified'}` : ''));
      if (res.ok) setStories(await res.json());
    } catch {}
  };
  useEffect(() => { fetchStories(); }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.university.trim() || !form.text.trim() || form.text.trim().length < 20) return;
    playClickSound();
    setSubmitting(true);
    try {
      const res = await authorizedFetch('/api/success-stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        playAdvancementSound();
        setForm({ university: '', scholarship: '', gpa: '', text: '' });
        setShowForm(false);
        await fetchStories();
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="space-y-4" id="scholarpath-success-stories">
      <div className="mc-window-dark border-4 border-black p-4 text-stone-200">
        <h3 className="font-press text-[11px] text-[#ffff55] flex items-center gap-2">
          <Award className="w-5 h-5" /> SUCCESS STORIES WALL
        </h3>
        <p className="text-xs font-mono text-stone-400 mt-1">Verified winners share their GPA, essay that won, and tips. Filter by verified only to see admission-letter-confirmed stories.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-[#3a3a3a] border-4 border-black text-stone-100 text-xs font-mono px-3 py-2">
          <option value="all">All stories</option>
          <option value="verified">Verified only ★</option>
        </select>
        <button onClick={()=>{ playClickSound(); setShowForm(v=>!v); }} className="mc-btn px-4 py-2 text-[9px] flex items-center gap-2">
          <Upload className="w-4 h-4" /> Share Your Story
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#2c2c2c] border-4 border-black p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={form.university} onChange={e=>setForm({...form, university:e.target.value})} placeholder="University admitted to *" className="bg-black/40 border-2 border-stone-800 text-stone-200 p-2 text-xs font-mono focus:border-[#ffff55] outline-none" required />
            <input value={form.scholarship} onChange={e=>setForm({...form, scholarship:e.target.value})} placeholder="Scholarship (optional)" className="bg-black/40 border-2 border-stone-800 text-stone-200 p-2 text-xs font-mono focus:border-[#ffff55] outline-none" />
            <input value={form.gpa} onChange={e=>setForm({...form, gpa:e.target.value})} placeholder="Your GPA (e.g. 3.8)" className="bg-black/40 border-2 border-stone-800 text-stone-200 p-2 text-xs font-mono focus:border-[#ffff55] outline-none" />
          </div>
          <textarea value={form.text} onChange={e=>setForm({...form, text:e.target.value})} placeholder="What worked? Your essay tip, interview tip, or what you'd tell your past self (min 20 chars)..." className="w-full bg-black/40 border-2 border-stone-800 text-stone-200 p-3 text-xs font-mono min-h-[90px] focus:border-[#ffff55] outline-none" required />
          <p className="text-[10px] font-mono text-stone-500">Tip: Uploading an admission letter image in the forum thread will mark your story as verified ★ after admin review.</p>
          <button type="submit" disabled={submitting} className="mc-btn px-5 py-2 text-[9px] disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Post Story'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {stories.length === 0 ? (
          <p className="text-xs font-mono text-stone-500 text-center py-8">No stories yet — be the first to share!</p>
        ) : stories.map(s => (
          <div key={s.id} className="bg-[#2c2c2c] border-4 border-black p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-stone-100 text-sm">{s.university}</span>
              {s.verified && <span className="px-1.5 py-0.5 bg-emerald-950 text-[#55ff55] border border-emerald-700 text-[9px] font-press flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>}
              {s.scholarship && <span className="text-[11px] font-mono text-stone-400">via {s.scholarship}</span>}
              {s.gpa && <span className="text-[11px] font-mono text-[#ffaa00]">GPA {s.gpa}</span>}
              <span className="text-[10px] font-mono text-stone-500 ml-auto">{new Date(s.createdAt).toLocaleDateString()} · by {s.author}</span>
            </div>
            <p className="text-xs font-mono text-stone-300 leading-relaxed whitespace-pre-wrap">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
