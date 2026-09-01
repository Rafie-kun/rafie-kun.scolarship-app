import React, { useState } from 'react';
import { Search, Mail, ExternalLink, GraduationCap, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';

type Prof = {
  name: string;
  title: string;
  department: string;
  researchFocus: string;
  emailPattern: string;
  profileUrl: string;
  whyContact: string;
};

export default function ProfessorFinder({ university, country, onClose }: { university: string; country?: string; onClose: () => void }) {
  const { authorizedFetch } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Prof[]>([]);
  const [meta, setMeta] = useState<{ domain?: string; offline?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!keyword.trim()) { setError('Enter a research keyword, e.g. Machine Learning, Robotics, Public Health.'); return; }
    playClickSound();
    setLoading(true); setError('');
    try {
      const res = await authorizedFetch('/api/professors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ university, country, keyword: keyword.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.professors || []);
      setMeta({ domain: data.domain, offline: data.offline });
    } catch (e: any) {
      setError(e.message || 'Search failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-auto bg-[#1a1817] border-4 border-black p-5 space-y-4 [box-shadow:inset_-4px_-4px_0_#111,inset_4px_4px_0_#555]">
        <div className="flex items-center justify-between border-b-4 border-black pb-3">
          <h3 className="font-press text-[11px] text-[#55ff55] flex items-center gap-2">
            <GraduationCap className="w-5 h-5" /> FIND A PROFESSOR
          </h3>
          <button onClick={onClose} className="w-8 h-8 bg-stone-800 border-2 border-black flex items-center justify-center hover:bg-stone-700">
            <X className="w-4 h-4 text-stone-300" />
          </button>
        </div>

        <p className="text-xs font-mono text-stone-400">
          Searching at <strong className="text-stone-200">{university}</strong>{country ? ` (${country})` : ''}. Enter your research interest to find faculty who supervise in that area.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Artificial Intelligence, Renewable Energy, Public Health..."
              className="w-full bg-black/45 border-4 border-stone-800 text-stone-200 pl-10 pr-4 py-2 text-xs font-mono focus:border-[#ffff55] outline-none"
            />
          </div>
          <button onClick={handleSearch} disabled={loading} className="mc-btn px-5 py-2 text-[9px] flex items-center gap-2 disabled:opacity-60">
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && <p className="text-xs font-mono text-red-300 bg-red-950/40 border border-red-800 p-2">{error}</p>}

        {meta?.domain && (
          <p className="text-[10px] font-mono text-stone-500">
            Email pattern at this university: <span className="text-stone-300">{meta.domain ? `firstname.lastname@${meta.domain}` : 'Check department site'}</span>
            {meta.offline && <span className="ml-2 text-amber-300">(offline preview - add GEMINI_API_KEY on server for live AI results)</span>}
          </p>
        )}

        <div className="space-y-3">
          {results.map((p, i) => (
            <div key={i} className="bg-stone-900 border-2 border-stone-800 p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-bold text-stone-100 text-sm block">{p.name}</span>
                  <span className="text-[10px] font-mono text-stone-400">{p.title} · {p.department}</span>
                </div>
                {p.profileUrl && p.profileUrl !== '#' && (
                  <a href={p.profileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-[#55ffff] hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Profile
                  </a>
                )}
              </div>
              <p className="text-xs font-mono text-stone-300"><strong className="text-[#ffaa00]">Focus:</strong> {p.researchFocus}</p>
              <p className="text-xs font-mono text-stone-300 flex items-center gap-1.5"><Mail className="w-3 h-3 text-[#55ff55]" /> <span className="text-stone-200">{p.emailPattern}</span></p>
              <p className="text-[11px] font-mono text-stone-400 italic border-t border-stone-800 pt-2">{p.whyContact}</p>
            </div>
          ))}
          {results.length === 0 && !loading && !error && (
            <p className="text-xs font-mono text-stone-500 text-center py-6">No results yet. Try a keyword above.</p>
          )}
        </div>

        <p className="text-[10px] font-mono text-stone-500 border-t border-stone-800 pt-3">
          Tip: In your first email, mention your GPA, one relevant project, and 2-3 sentences on why their recent paper interests you. Keep it under 180 words.
        </p>
      </div>
    </div>
  );
}
