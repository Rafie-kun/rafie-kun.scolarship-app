import React, { useState } from 'react';
import { FileText, Sparkles, CheckCircle, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';

export default function WritingVaultView() {
  const { authorizedFetch, rewardPoints } = useAuth();
  
  const [essayText, setEssayText] = useState('');
  const [major, setMajor] = useState('Computer Science');
  const [degree, setDegree] = useState("Master's Degree");
  
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleReviewSOP = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!essayText.trim()) return;

    setLoading(true);
    setReview('');
    setSuccess('');

    try {
      const res = await authorizedFetch('/api/gemini/review-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: essayText,
          major,
          targetDegree: degree
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReview(data.review);
        setSuccess('SOP Evaluated by High Admissions Advisory Board!');
        playAdvancementSound();

        // Clear success notification after 4 seconds!
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setSuccess('');
        }, 4000);

        // Reward points
        const actionName = 'Statement of Purpose Review';
        if (!rewardedActionsRef.current.has(actionName)) {
          rewardedActionsRef.current.add(actionName);
          await rewardPoints(20, actionName, 'SOP Editor');
        }
      }
    } catch (e) {
      console.error(e);
      setReview('System Offline: Failed to evaluate admissions document. Verify secure connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = () => {
    playClickSound();
    const template = `Statement of Purpose & Career Plan for International Fellowship

My name is Arif Rahaman. I am writing to express my interest in joining the graduate software research group. Since my childhood, I have always loved writing code. Throughout my undergraduate course, I scored okay marks. I managed to build a student open-source forum board that had various users, and it was quite successful.

In my future career, I plan to research compilers, operating system architectures and automated telemetry databases. Since your highly regarded faculty contains prominent global academics, I am confident that joining your lab tracks will fulfill all my research objectives. Thank you.`;
    setEssayText(template);
  };

  return (
    <div className="space-y-6" id="scholarpath-writing-vault-workbench-v2">
      
      {/* Title */}
      <div className="mc-window border-4 border-black p-5 text-stone-800">
        <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
          <FileText className="w-5 h-5 text-stone-900 shrink-0" /> SCROLL VAULT (SOP WORKBENCH)
        </h3>
        <p className="text-xs text-stone-700 font-sans mt-2 leading-relaxed">
          Paste your Statement of Purpose (SOP), Research Fellowship draft, or Resume. The Advisory Alchemist reviews admissions metrics, checking eligibility criteria, ECTS, and returns formatted Markdown refactor suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SOP Inputs panel */}
        <div className="lg:col-span-5 bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-4">
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h4 className="font-press text-[9px] text-[#ffff55] uppercase mc-text-shadow">ESSAY SCROLLS</h4>
            <button
              id="load-sop-template-btn"
              onClick={handleLoadTemplate}
              className="text-[10px] font-mono text-stone-300 hover:text-[#ffff55] underline cursor-pointer"
            >
              Load SOP Template
            </button>
          </div>

          <form onSubmit={handleReviewSOP} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-stone-400 text-[10px] uppercase font-mono">Target Major</span>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="bg-[#141414] border-2 border-black p-2 text-xs focus:outline-none focus:border-[#ffff55] text-stone-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-stone-400 text-[10px] uppercase font-mono">Major Degree</span>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="bg-[#141414] border-2 border-black p-2 text-xs focus:outline-none focus:border-[#ffff55] text-stone-200"
                >
                  <option>Bachelor's Degree</option>
                  <option>Master's Degree</option>
                  <option>Ph.D.</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-stone-400 text-[10px] uppercase font-mono">SOP Motivation Text</span>
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Paste your motivation letters, CV statements, or personal essay drafts here..."
                className="bg-[#141414] border-2 border-black p-3 min-h-[250px] text-xs focus:outline-none focus:border-[#ffff55] text-stone-300 font-sans leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !essayText.trim()}
              className="w-full mc-btn py-3 text-[9px] uppercase font-bold text-[#ffff55]"
            >
              {loading ? 'Evaluating Core Chunks...' : 'ANALYZE ADMISSIONS MOTIVATIONS'}
            </button>
          </form>
        </div>

        {/* Evaluation Output panel */}
        <div className="lg:col-span-7 bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] text-stone-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
              <h4 className="font-press text-[9px] text-[#ffff55] uppercase mc-text-shadow">REVIEW TOME FEEDBACK</h4>
            </div>

            {success && (
              <div className="bg-emerald-950/40 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2 animate-bounce">
                <CheckCircle className="w-5 h-5 text-[#55ff55] shrink-0" />
                <span className="mc-text-shadow">{success} (+20 XP Granted!)</span>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 font-press text-[9px] text-[#ffff55] text-center space-y-4 leading-relaxed">
                <Sparkles className="w-8 h-8 animate-spin text-amber-500" />
                <p className="mc-text-shadow">DECODING TEXT BLOCKS • WEIGHING SYLLABI course WEIGHTS...</p>
              </div>
            )}

            {!loading && !review && (
              <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-center space-y-3 font-press text-[9px] uppercase">
                <BookOpen className="w-10 h-10 text-stone-600 animate-bounce" />
                <p>Output terminal dry. Fill input scrolls and trigger appraisal evaluate.</p>
              </div>
            )}

            {!loading && review && (
              <div className="text-stone-200 font-sans leading-relaxed max-h-[500px] overflow-y-auto pr-2 space-y-4 relative text-sm pb-10">
                <div className="markdown-body p-4 bg-[#141414] border-2 border-black">
                  <ReactMarkdown>{review}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          <div className="border-t-2 border-black pt-3 text-[9px] font-press uppercase text-stone-400 flex items-center justify-between">
            <span>Core evaluation compilers</span>
            <span>Release Guild v2.5</span>
          </div>

        </div>

      </div>
    </div>
  );
}
