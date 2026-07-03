import React, { useState, useEffect } from 'react';
import { Target, Calendar, CheckSquare, Square, Sparkles, Award, Compass, RotateCcw, Check, ListChecks, Network, Lock, Unlock } from 'lucide-react';
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

interface SkillNode {
  id: string;
  title: string;
  category: 'Foundation' | 'Specialization' | 'Mastery';
  tier: 1 | 2 | 3;
  description: string;
  xpReward: number;
  unlocked: boolean;
  prereqs: string[];
  icon: string;
}

const DEFAULT_SKILL_TREE: SkillNode[] = [
  // Tier 1
  { id: 'gpa_base', title: 'GPA Benchmark (3.0+)', category: 'Foundation', tier: 1, description: 'Maintain academic GPA above threshold for competitive scholarship eligibility.', xpReward: 20, unlocked: true, prereqs: [], icon: '📚' },
  { id: 'test_prep', title: 'Test Mastery (IELTS/SAT)', category: 'Foundation', tier: 1, description: 'Achieve passing standardized English proficiency or entrance exam score.', xpReward: 25, unlocked: false, prereqs: ['gpa_base'], icon: '📝' },
  { id: 'doc_vault', title: 'Dossier Assembly', category: 'Foundation', tier: 1, description: 'Gather passport, transcript copies, and official certificate PDFs.', xpReward: 15, unlocked: false, prereqs: ['gpa_base'], icon: '📁' },

  // Tier 2
  { id: 'sop_draft', title: 'SOP Draft V1', category: 'Specialization', tier: 2, description: 'Write a compelling Statement of Purpose outlining your research goals.', xpReward: 30, unlocked: false, prereqs: ['test_prep', 'doc_vault'], icon: '✍️' },
  { id: 'lor_sec', title: 'LOR Endorsements', category: 'Specialization', tier: 2, description: 'Secure 2-3 strong recommendation letters from professors or managers.', xpReward: 25, unlocked: false, prereqs: ['doc_vault'], icon: '📜' },
  { id: 'research_capsule', title: 'Portfolio Project', category: 'Specialization', tier: 2, description: 'Publish or showcase a technical project / research paper artifact.', xpReward: 35, unlocked: false, prereqs: ['test_prep'], icon: '🔬' },

  // Tier 3
  { id: 'scholar_app', title: 'Loot Registry Submissions', category: 'Mastery', tier: 3, description: 'Submit 3+ fully-funded scholarship applications.', xpReward: 50, unlocked: false, prereqs: ['sop_draft', 'lor_sec'], icon: '🏆' },
  { id: 'interview_prep', title: 'Panel Defense Prep', category: 'Mastery', tier: 3, description: 'Practice live mock interviews with AI Copilot.', xpReward: 40, unlocked: false, prereqs: ['sop_draft'], icon: '🎙️' },
  { id: 'award_claimed', title: 'Fellowship Awarded', category: 'Mastery', tier: 3, description: 'Claim fellowship or full-ride university scholarship offer!', xpReward: 100, unlocked: false, prereqs: ['scholar_app', 'interview_prep'], icon: '🌟' },
];

export default function RoadmapView() {
  const { authorizedFetch, profile, rewardPoints } = useAuth();
  const [roadmap, setRoadmap] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [generating, setGenerating] = useState(false);

  const [activeViewTab, setActiveViewTab] = useState<'timeline' | 'skilltree'>('timeline');
  const [skillTree, setSkillTree] = useState<SkillNode[]>(() => {
    try {
      const saved = localStorage.getItem('scholarpath_skill_tree');
      return saved ? JSON.parse(saved) : DEFAULT_SKILL_TREE;
    } catch {
      return DEFAULT_SKILL_TREE;
    }
  });

  const handleUnlockSkill = async (nodeId: string) => {
    const node = skillTree.find(n => n.id === nodeId);
    if (!node || node.unlocked) return;

    // Check prerequisites
    const prereqsMet = node.prereqs.every(reqId => {
      const reqNode = skillTree.find(n => n.id === reqId);
      return reqNode && reqNode.unlocked;
    });

    if (!prereqsMet) {
      playClickSound();
      alert("Prerequisite skills locked! Complete earlier skill nodes first.");
      return;
    }

    playAdvancementSound();
    const updatedTree = skillTree.map(n => n.id === nodeId ? { ...n, unlocked: true } : n);
    setSkillTree(updatedTree);
    localStorage.setItem('scholarpath_skill_tree', JSON.stringify(updatedTree));

    if (rewardPoints) {
      await rewardPoints(node.xpReward, `Unlocked Skill Node: "${node.title}"`, "Master Scholar");
    }

    setSuccess(`🎉 Unlocked Skill: "${node.title}" (+${node.xpReward} XP)!`);
    setTimeout(() => setSuccess(''), 4000);
  };

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

      {/* Navigation Mode Selector Tabs */}
      <div className="flex border-b-4 border-black gap-2 select-none">
        <button
          type="button"
          onClick={() => { setActiveViewTab('timeline'); playClickSound(); }}
          className={`font-press text-[9px] px-4 py-2.5 uppercase border-t-4 border-x-4 border-black cursor-pointer transition-colors ${
            activeViewTab === 'timeline'
              ? 'bg-[#2c2c2c] text-[#ffff55] border-b-0 -mb-1'
              : 'bg-[#181818] text-stone-400 hover:text-stone-200 hover:bg-[#222]'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5 inline mr-1.5" /> Timeline Planner
        </button>
        <button
          type="button"
          onClick={() => { setActiveViewTab('skilltree'); playClickSound(); }}
          className={`font-press text-[9px] px-4 py-2.5 uppercase border-t-4 border-x-4 border-black cursor-pointer transition-colors ${
            activeViewTab === 'skilltree'
              ? 'bg-[#2c2c2c] text-[#ffaa00] border-b-0 -mb-1'
              : 'bg-[#181818] text-stone-400 hover:text-stone-200 hover:bg-[#222]'
          }`}
        >
          <Network className="w-3.5 h-3.5 inline mr-1.5 text-[#ffaa00]" /> Skill Tree Matrix
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <Sparkles className="w-7 h-7 animate-spin text-[#ffff55]" />
          <span className="mc-text-shadow">DECODING ADMISSIONS MAP INDEX...</span>
        </div>
      ) : activeViewTab === 'skilltree' ? (
        /* Skill Tree Matrix Container */
        <div className="space-y-6">
          <div className="bg-[#2c2c2c] border-4 border-black p-4 space-y-2 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
            <div className="flex justify-between items-center border-b border-stone-700 pb-2">
              <span className="font-press text-[10px] text-[#ffaa00] uppercase flex items-center gap-2">
                <Network className="w-4 h-4 text-[#ffaa00]" /> SCHOLAR SKILL TREE
              </span>
              <span className="font-mono text-xs text-[#55ff55]">
                Unlocked: {skillTree.filter(n => n.unlocked).length} / {skillTree.length} Nodes
              </span>
            </div>
            <p className="text-xs font-mono text-stone-300">
              Click available nodes to unlock candidate achievements and award XP. Prerequisites must be completed in order.
            </p>
          </div>

          {/* Tiers 1, 2, 3 Grid */}
          <div className="space-y-6">
            {[1, 2, 3].map(tier => {
              const tierNodes = skillTree.filter(n => n.tier === tier);
              const tierNames = { 1: 'Tier I: Foundation Skills', 2: 'Tier II: Specialization Capabilities', 3: 'Tier III: Admissions Mastery' };
              return (
                <div key={tier} className="space-y-3">
                  <h4 className="font-press text-[10px] text-[#64e3ff] uppercase tracking-wider border-b-2 border-black pb-1">
                    {tierNames[tier as 1|2|3]}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tierNodes.map(node => {
                      const reqsMet = node.prereqs.every(reqId => skillTree.find(n => n.id === reqId)?.unlocked);
                      const isClickable = !node.unlocked && reqsMet;

                      return (
                        <div
                          key={node.id}
                          onClick={() => handleUnlockSkill(node.id)}
                          className={`border-4 border-black p-4 flex flex-col justify-between space-y-3 transition-all ${
                            node.unlocked
                              ? 'bg-emerald-950/40 border-emerald-500 text-stone-200 [box-shadow:inset_-3px_-3px_0_#064e3b,inset_3px_3px_0_#10b981]'
                              : isClickable
                              ? 'bg-amber-950/30 border-amber-500 text-stone-200 cursor-pointer hover:scale-[1.02] [box-shadow:inset_-3px_-3px_0_#78350f,inset_3px_3px_0_#f59e0b]'
                              : 'bg-black/40 border-stone-800 text-stone-500 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-2xl">{node.icon}</span>
                              <span className={`font-press text-[8px] px-2 py-0.5 border ${
                                node.unlocked ? 'bg-emerald-500 text-black border-black' : isClickable ? 'bg-amber-500 text-black border-black' : 'bg-stone-800 text-stone-400 border-stone-700'
                              }`}>
                                {node.unlocked ? 'UNLOCKED' : isClickable ? 'READY' : 'LOCKED'}
                              </span>
                            </div>

                            <h5 className="font-press text-[10px] text-stone-100">{node.title}</h5>
                            <p className="text-[11px] font-mono leading-snug text-stone-300">{node.description}</p>
                          </div>

                          <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-[10px] font-mono">
                            <span className="text-amber-400 font-bold">+{node.xpReward} XP</span>
                            {node.unlocked ? (
                              <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Mastered</span>
                            ) : isClickable ? (
                              <span className="text-amber-300 flex items-center gap-1"><Unlock className="w-3.5 h-3.5" /> Unlock</span>
                            ) : (
                              <span className="text-stone-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Req: {node.prereqs.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
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
