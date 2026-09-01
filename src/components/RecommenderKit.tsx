import React, { useState } from 'react';
import { Mail, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';

export default function RecommenderKit({ professorName, university, scholarship }: { professorName?: string; university?: string; scholarship?: string }) {
  const { profile } = useAuth();
  const [toName, setToName] = useState(professorName || 'Professor Smith');
  const [toEmail, setToEmail] = useState('');
  const [deadline, setDeadline] = useState('');
  const [copied, setCopied] = useState(false);

  const studentName = profile?.fullName || 'Alex Carter';
  const studentMajor = profile?.primaryMajor || profile?.intendedMajor || 'Computer Science';
  const studentGpa = profile?.gpa ? `${profile.gpa.toFixed(2)} / ${profile.maxGpa || 4}` : '3.5 / 4.0';

  const subject = `Recommendation letter request — ${scholarship || university || 'Scholarship'} application (deadline ${deadline || 'upcoming'})`;

  const body = `Dear ${toName},

I hope you are well. I am writing to kindly ask if you would be willing to write a recommendation letter for my application to ${scholarship ? `"${scholarship}"` : `the ${university || 'university program'}`}.

A brief about me:
- ${studentName}, ${studentMajor}, GPA ${studentGpa}
- Project: ${(profile?.projects?.[0] || 'Retro Game Canvas — led a team, improved performance by 32%')}
- Why this program: it aligns with my research interest in ${studentMajor}

What I would need from you:
- A letter highlighting my research / academic strengths (1 page, on letterhead, signed, PDF)
- Deadline: ${deadline || '[please insert — e.g., 2026-12-15]'} (I will send a reminder 7 days before)

I've attached my CV and draft SOP for your reference. Please let me know if you need any other materials. No worries at all if you are unable — I completely understand.

Thank you so much for your support!

Warm regards,
${studentName}
${profile?.additionalSkills?.slice(0,3).join(' · ') || ''}`.trim();

  const mailto = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleCopy = async () => {
    playClickSound();
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1a1817] border-4 border-black p-4 space-y-3">
      <h4 className="font-press text-[10px] text-[#ffaa00] uppercase flex items-center gap-2">
        <Mail className="w-4 h-4" /> Recommender Kit — One-Click Email Draft
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input value={toName} onChange={e=>setToName(e.target.value)} placeholder="Professor name" className="bg-black/40 border-2 border-stone-800 text-stone-200 p-2 text-xs font-mono focus:border-[#ffff55] outline-none" />
        <input value={toEmail} onChange={e=>setToEmail(e.target.value)} placeholder="Professor email (optional)" className="bg-black/40 border-2 border-stone-800 text-stone-200 p-2 text-xs font-mono focus:border-[#ffff55] outline-none" />
        <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} className="bg-black/40 border-2 border-stone-800 text-stone-200 p-2 text-xs font-mono focus:border-[#ffff55] outline-none" />
      </div>
      <div className="bg-black/40 border-2 border-stone-800 p-3 space-y-1">
        <span className="text-[10px] font-mono text-stone-400 uppercase">Subject:</span>
        <p className="text-xs font-mono text-stone-200">{subject}</p>
      </div>
      <div className="bg-black/40 border-2 border-stone-800 p-3 max-h-[220px] overflow-y-auto">
        <pre className="text-xs font-mono text-stone-300 whitespace-pre-wrap leading-relaxed">{body}</pre>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={handleCopy} className="mc-btn px-4 py-2 text-[9px] flex items-center gap-2">
          {copied ? <CheckCircle className="w-4 h-4 text-[#55ff55]" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied!' : 'Copy Draft'}
        </button>
        {toEmail && (
          <a href={mailto} className="mc-btn px-4 py-2 text-[9px] flex items-center gap-2 bg-emerald-950 text-[#55ff55] border-emerald-700">
            <Mail className="w-4 h-4" /> Open in Email App <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <p className="text-[10px] font-mono text-stone-500">Tip: Attach your CV (Profile → Export CV) and a one-page bullet list of your achievements to make it easy for your professor.</p>
    </div>
  );
}
