import React, { useState, useEffect } from 'react';
import { Target, Calendar, CheckSquare, Square, Sparkles, Award, Compass, RotateCcw, Check, ListChecks } from 'lucide-react';
import { Profile } from '../types';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { dispatchProfileUpdate } from '../utils/events';

interface Task {
  text: string;
  done: boolean;
}

interface Milestone {
  title: string;
  timeline: string;
  description: string;
  tasks: Task[];
  tips: string;
}

export default function RoadmapView() {
  const { authorizedFetch, profile, rewardPoints } = useAuth();
  const [roadmap, setRoadmap] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [generating, setGenerating] = useState(false);

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Load user's saved roadmap, or generate a fresh personalized one on startup
  const fetchRoadmap = async (forceRegenerate: boolean = false) => {
    if (forceRegenerate) {
      setGenerating(true);
    } else {
      setLoading(true);
    }
    
    try {
      const res = await authorizedFetch('/api/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ forceRegenerate })
      });

      if (res.ok) {
        const data = await res.json();
        setRoadmap(data.roadmap || []);
        if (forceRegenerate) {
          playAdvancementSound();
          setSuccess("AI Companion recalculated your personalized target path successfully!");
          setTimeout(() => setSuccess(''), 4000);
        }
      }
    } catch (err) {
      console.error("Failed to fetch personalized roadmap:", err);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchRoadmap(false);
  }, []);

  // Update a single checkbox done state and persist progress
  const toggleTask = async (milestoneIdx: number, taskIdx: number) => {
    playClickSound();
    
    // Copy reference state
    const updatedRoadmap = [...roadmap];
    const task = updatedRoadmap[milestoneIdx].tasks[taskIdx];
    const currentDone = task.done;
    
    task.done = !task.done;
    setRoadmap(updatedRoadmap);

    try {
      // 1. Save state back to server
      const saveRes = await authorizedFetch('/api/roadmap/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmap: updatedRoadmap })
      });

      if (saveRes.ok) {
        // 2. Play reward sequences if checked
        if (!currentDone) {
          playAdvancementSound();
          const actionName = `Completed target: "${task.text}"`;
          if (!rewardedActionsRef.current.has(actionName)) {
            rewardedActionsRef.current.add(actionName);
            await rewardPoints(5, actionName);
          }
          setSuccess(`Earned +5 XP! Milestone completed: "${task.text}"`);
          
          // Auto-clears XP notifications cleanly after 4 seconds!
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setSuccess('');
          }, 4000);
        }
      }
    } catch (err) {
      console.error("Failed to save checked roadmap task state:", err);
    }
  };

  // Re-generate fresh roadmap
  const handleRegenerate = () => {
    playClickSound();
    if (confirm("Are you sure you want to regenerate your timeline roadmap? This will reset all ticked checkboxes back to pending status.")) {
      fetchRoadmap(true);
    }
  };

  // Calculate high-level progress tracker statistics
  const getProgressStats = () => {
    let total = 0;
    let completed = 0;
    roadmap.forEach(milestone => {
      if (milestone.tasks) {
        milestone.tasks.forEach(t => {
          total++;
          if (t.done) completed++;
        });
      }
    });
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const stats = getProgressStats();

  return (
    <div className="space-y-6" id="scholarpath-personalized-roadmap">
      
      {/* Title block with persistent overview summary */}
      <div className="mc-window-dark border-4 border-black text-stone-200">
        <h3 className="font-press text-[11px] text-[#ffaa00] uppercase flex items-center gap-2 mc-text-shadow">
          <Compass className="w-5 h-5 text-[#ffaa00]" /> NAVIGATOR COMPASS (PERSONALIZED TIMELINE PLANNERS)
        </h3>
        <p className="text-xs text-stone-350 font-mono mt-2 leading-relaxed">
          Craft customized quarterly checkpoints based on your active GPA profiles, intended levels & degree tracks. Check finished targets to score XP values and save progress.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-950 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-[#55ff55] shrink-0 animate-bounce" />
          <span className="mc-text-shadow font-semibold">{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <Sparkles className="w-7 h-7 animate-spin text-[#ffff55]" />
          <span className="mc-text-shadow">DECODING ADMISSIONS MAP INDEX...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Progress gauge card */}
          <div className="bg-[#2c2c2c] border-4 border-black p-4 flex flex-col md:flex-row justify-between items-center gap-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
            <div className="space-y-1.5 flex-1">
              <span className="text-[9px] font-press text-stone-400 block uppercase">QUEST PROGRESS RATE</span>
              <div className="flex items-center gap-3">
                <div className="font-press text-[15px] text-[#55ff55] mc-text-shadow">
                  {stats.percentage}%
                </div>
                <div className="w-full max-w-md border-4 border-black h-4 bg-stone-900 select-none overflow-hidden block">
                  <div 
                    className="bg-[#55ff55] h-full transition-all duration-500 ease-out"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
              <p className="text-xs font-mono text-stone-300">
                You have completed <span className="text-[#ffff55] font-bold">{stats.completed}</span> out of <span className="font-bold">{stats.total}</span> timeline target nodes.
              </p>
            </div>

            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="mc-btn shrink-0 py-2.5 text-[8.5px] font-press uppercase text-amber-300 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 
              {generating ? "Calibrating..." : "Regenerate AI Map"}
            </button>
          </div>

          {/* Render individual sequential milestones */}
          <div className="space-y-6">
            {roadmap.map((milestone, mIdx) => (
              <div 
                key={mIdx}
                className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-4"
              >
                {/* Milestone header banner */}
                <div className="border-b border-stone-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-press text-[#64e3ff] mc-text-shadow uppercase tracking-widest">{milestone.timeline}</span>
                    <h4 className="font-press text-[11px] text-stone-100">{milestone.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-black/40 text-[#ffff55] px-2.5 py-1 border border-[#ffff55]/30">
                    🏆 Phase {mIdx + 1} Target
                  </span>
                </div>

                <p className="text-xs font-mono text-stone-200 leading-relaxed max-w-3xl">
                  {milestone.description}
                </p>

                {/* Subtasks node checklist list */}
                <div className="space-y-2 border-t border-[#3e3e3e] pt-4">
                  <span className="text-[9px] font-press text-stone-400 block uppercase mb-1">TASK MILESTONES:</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {milestone.tasks && milestone.tasks.map((task, tIdx) => (
                      <div 
                        key={tIdx}
                        onClick={() => toggleTask(mIdx, tIdx)}
                        className={`border-2 p-3 font-mono text-xs flex items-start gap-3 cursor-pointer select-none transition-all ${
                          task.done 
                            ? 'bg-emerald-950/20 border-emerald-500 text-stone-300' 
                            : 'bg-black/30 border-stone-800 text-stone-200 hover:border-[#ffff55]'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {task.done ? (
                            <div className="w-5 h-5 bg-emerald-500 border border-black flex items-center justify-center">
                              <Check className="w-4 h-4 text-black stroke-[3px]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 bg-[#141414] border-2 border-stone-700 hover:border-[#ffff55]" />
                          )}
                        </div>
                        <span className={task.done ? "line-through text-stone-550" : ""}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Valuable micro-tips card */}
                {milestone.tips && (
                  <div className="bg-[#1e1c1b] border-2 border-black p-3 text-xs font-mono text-stone-350">
                    💡 <span className="text-amber-400 font-bold uppercase text-[10px]">Alumni Secret Tip:</span> {milestone.tips}
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
