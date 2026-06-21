import React, { useState, useEffect } from 'react';
import { Target, Calendar, CheckSquare, Square, Sparkles, Award, Compass, Clipboard } from 'lucide-react';
import { Profile } from '../types';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { dispatchProfileUpdate } from '../utils/events';

interface PathMilestone {
  month: string;
  focus: string;
  tasks: { text: string; done: boolean }[];
}

export default function LearningPathView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [milestones, setMilestones] = useState<PathMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineSpanMonths, setTimelineSpanMonths] = useState<number>(6);
  const [success, setSuccess] = useState('');
  
  const rewardedActionsRef = React.useRef<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const generateStatePath = async () => {
    setLoading(true);
    playClickSound();

    // Consult profile to create custom timeline stages
    try {
      const resProfile = await fetch('/api/profile');
      const p = await resProfile.json();
      setProfile(p);

      // Create detailed dynamic learning route milestones
      const tempPath: PathMilestone[] = [
        {
          month: "Phase 1: Mineral Foundations (Month 1-2)",
          focus: `Identify target prerequisites matching ${p.intendedMajor || 'Computing'}.`,
          tasks: [
            { text: `Translate current transcripts (targeting GPA of ${p.gpa || '3.8'})`, done: true },
            { text: "Acquire syllabus guidelines from DAAD or Erasmus joints", done: false },
            { text: "Take diagnostic standardized test mockups for IELTS/GRE metrics", done: false }
          ]
        },
        {
          month: "Phase 2: Project Pipeline (Month 3-4)",
          focus: "Address practical portfolio credentials and reference acquisition.",
          tasks: [
            { text: "Launch 1 core open-source computer science project in intended domain", done: false },
            { text: "Schedule counseling emails with 2 university professors targeting lab space", done: false },
            { text: "Write first detailed Statement of Purpose motivation rough draft copy", done: false }
          ]
        },
        {
          month: "Phase 3: Admissions Sabbatical (Month 5-6)",
          focus: "Submit polished documents and prepare for oral committee reviews.",
          tasks: [
            { text: "Paste Statement of Purpose (SOP) into ScholarPath AI Writing Vault for marking", done: false },
            { text: "Collect 2 signed academic letters of recommendation from deans", done: false },
            { text: "Perform 4 test trials inside mock panel interviewer chatbot trainer", done: false }
          ]
        }
      ];

      setMilestones(tempPath);

      // Award XP points for generating customizable pathways
      const actionName = `Synthesized Personalized admissions path scheduler`;
      if (!rewardedActionsRef.current.has(actionName)) {
        rewardedActionsRef.current.add(actionName);
        const resReward = await fetch('/api/profile/reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: 15,
            actionName
          })
        });
        const updatedProfileObj = await resReward.json();
        dispatchProfileUpdate(updatedProfileObj);
        playAdvancementSound();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      }
    };
    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('profile-updated', handleProfileUpdated);
  }, []);

  useEffect(() => {
    generateStatePath();
  }, [timelineSpanMonths]);

  const toggleTask = (phaseIdx: number, taskIdx: number) => {
    playClickSound();
    const updated = [...milestones];
    const task = updated[phaseIdx].tasks[taskIdx];
    task.done = !task.done;
    
    if (task.done) {
      playAdvancementSound();
      setSuccess(`Checked timeline target: "${task.text}"! (+5 XP Awarded!)`);
      
      const actionName = `Completed Pathway Milestone: ${task.text}`;
      if (!rewardedActionsRef.current.has(actionName)) {
        rewardedActionsRef.current.add(actionName);
        // Award callback points
        fetch('/api/profile/reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: 5,
            actionName
          })
        }).then(res => res.json())
          .then(updatedProfile => {
            dispatchProfileUpdate(updatedProfile);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
          });
      }
    }

    setMilestones(updated);
  };

  return (
    <div className="space-y-6" id="scholarpath-personal-trail">
      
      {/* Visual Title */}
      <div className="mc-window border-4 border-black p-5 text-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
            <Compass className="w-5 h-5 text-stone-900 shrink-0" /> AI PERSONALIZED PATHWAY GENERATOR
          </h3>
          <p className="text-xs text-stone-700 font-sans mt-2 leading-relaxed">
            Analyzing academic standings, intended degrees, GPAs, and target careers to compile a structured, multi-month milestone activity checklist pipeline.
          </p>
        </div>
        
        {/* Variable selector */}
        <div className="flex items-center gap-2 font-mono text-xs text-stone-700 shrink-0 bg-black/5 p-2 border-2 border-black/10">
          <span className="text-[10px] uppercase font-bold">Span:</span>
          <select
            value={timelineSpanMonths}
            onChange={(e) => setTimelineSpanMonths(parseInt(e.target.value))}
            className="bg-[#141414] border-2 border-black p-1 text-[#ffff55] focus:outline-none focus:border-[#ffff55] cursor-pointer rounded-none font-bold"
          >
            <option value="3">3 Months (Intense)</option>
            <option value="6">6 Months (Optimal)</option>
            <option value="12">12 Months (Paced)</option>
          </select>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-950/40 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-[#55ff55] shrink-0" />
          <span className="mc-text-shadow font-bold">{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <Sparkles className="w-7 h-7 animate-spin text-[#ffff55]" />
          <span className="mc-text-shadow">FORMULATING TRAIL LINES...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {milestones.map((phase, pIdx) => (
            <div 
              key={pIdx}
              className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] rounded-none space-y-3 text-stone-200"
            >
              <div className="border-b border-stone-800 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono">
                <h4 className="font-press text-[10px] text-[#ffff55] mc-text-shadow uppercase leading-snug">{phase.month}</h4>
                <p className="text-[9px] font-press text-[#ffaa00] shrink-0">PRIORITY TRACK STAGE</p>
              </div>

              <div className="p-3.5 bg-[#141414] border-2 border-black text-xs font-mono text-stone-300 leading-relaxed">
                Objective: <span className="text-[#55ffff] font-semibold">{phase.focus}</span>
              </div>

              {/* Checkboxes tasks */}
              <div className="space-y-2 pt-2 font-mono text-xs">
                {phase.tasks.map((t, tIdx) => (
                  <button
                    key={tIdx}
                    onClick={() => toggleTask(pIdx, tIdx)}
                    className="w-full text-left p-3.5 bg-[#1e1c1b] border-2 border-black hover:border-stone-500 transition-colors flex items-center gap-3 rounded-none cursor-pointer"
                  >
                    {t.done ? (
                      <CheckSquare className="w-5 h-5 text-[#55ff55] shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-500 shrink-0" />
                    )}
                    <span className={`leading-relaxed ${t.done ? 'line-through text-stone-500' : 'text-stone-200'}`}>
                      {t.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
