import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';

type Group = { name: string; count: number; provider?: string; isMember?: boolean };

export default function StudyGroupFinder() {
  const { authorizedFetch, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await authorizedFetch('/api/study-groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleJoin = async (name: string) => {
    playClickSound();
    setJoining(name);
    try {
      const res = await authorizedFetch('/api/study-groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarshipName: name })
      });
      if (res.ok) {
        playAdvancementSound();
        await fetchGroups();
      }
    } catch {}
    setJoining(null);
  };

  const filtered = groups.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4" id="scholarpath-study-groups">
      <div className="mc-window-dark border-4 border-black p-4 text-stone-200">
        <h3 className="font-press text-[11px] text-[#55ff55] flex items-center gap-2">
          <Users className="w-5 h-5" /> STUDY GROUP FINDER
        </h3>
        <p className="text-xs font-mono text-stone-400 mt-1">Find others applying to the same scholarship. Join a group to share tips and stay motivated.</p>
      </div>

      <div className="bg-[#2c2c2c] border-4 border-black p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter groups by scholarship name..." className="w-full bg-black/40 border-4 border-stone-800 text-stone-200 pl-10 pr-4 py-2 text-xs font-mono focus:border-[#ffff55] outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center font-press text-[10px] text-[#ffff55]">LOADING GROUPS...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#2c2c2c] border-4 border-black p-8 text-center">
          <p className="font-mono text-sm text-stone-400">No study groups yet. Track a scholarship to create the first group!</p>
          <p className="text-xs font-mono text-stone-500 mt-1">Groups appear when you and others track the same scholarship.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(g => (
            <div key={g.name} className="bg-[#2c2c2c] border-4 border-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="font-bold text-stone-100 text-sm block">{g.name}</span>
                {g.provider && <span className="text-[11px] font-mono text-stone-400">{g.provider}</span>}
                <span className="text-xs font-mono flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#55ff55]" />
                  <span className="text-[#55ff55] font-bold">{g.count} {g.count === 1 ? 'student' : 'students'} applying</span>
                  {g.isMember && <span className="ml-2 px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px]">You are in this group</span>}
                </span>
              </div>
              <button
                onClick={() => handleJoin(g.name)}
                disabled={g.isMember || joining === g.name}
                className={`mc-btn px-4 py-2 text-[9px] flex items-center gap-2 shrink-0 ${g.isMember ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> {g.isMember ? 'Joined' : joining === g.name ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] font-mono text-stone-500">Joining a group creates a community forum post where you can coordinate. No personal data is shared beyond your username.</p>
    </div>
  );
}
