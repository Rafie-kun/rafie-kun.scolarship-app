import React, { useState, useEffect } from 'react';
import { School, CheckCircle, Sparkles, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle, Trophy } from 'lucide-react';
import { Profile, University } from '../types';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { dispatchProfileUpdate } from '../utils/events';
import { useAuth } from '../context/AuthContext';

export default function DreamUniversityView() {
  const { authorizedFetch } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unis, setUnis] = useState<University[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  
  // Custom multipliers
  const [gpaAdjustment, setGpaAdjustment] = useState<number>(0);
  const [hasResearchProject, setHasResearchProject] = useState(false);
  const [hasExtracurricularFocus, setHasExtracurricularFocus] = useState(false);
  const [essayFocusPercent, setEssayFocusPercent] = useState<number>(75);

  // Output states
  const [simulating, setSimulating] = useState(false);
  const [outcome, setOutcome] = useState<{
    probabilityChance: number;
    rating: 'Extremely Low' | 'Reach' | 'Competitive' | 'Highly Competitive' | 'Target Match';
    reasons: string[];
    criticalGapToTarget: string;
    xpPointsAwarded?: number;
  } | null>(null);

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    authorizedFetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));

    authorizedFetch('/api/universities')
      .then(res => res.json())
      .then(data => {
        const list = data.universities || (Array.isArray(data) ? data : []);
        setUnis(list);
        if (list.length > 0) setSelectedUni(list[0]);
      })
      .catch(err => console.error(err));
  }, []);

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

  const runSimulation = async () => {
    playClickSound();
    if (!profile || !selectedUni) return;

    setSimulating(true);
    setOutcome(null);

    // Simulated analytical computation delay matching retro console clocks
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Calculate core candidate GPA
    const baseGpa = profile.gpa;
    const computedGpa = Math.min(profile.maxGpa, Math.max(0, baseGpa + gpaAdjustment));
    
    // Core calculation logic
    let score = 0;

    // 1. GPA comparison
    const gpaDifference = computedGpa - selectedUni.averageGpa;
    if (gpaDifference >= 0) {
      score += 40;
    } else if (gpaDifference >= -0.2) {
      score += 25;
    } else {
      score += 10;
    }

    // 2. Extra projects / papers ECTS
    if (hasResearchProject || profile.projects.length > 0) {
      score += 20;
    }
    
    // 3. Extracurricular leadership
    if (hasExtracurricularFocus || profile.leadershipExperience.length > 0) {
      score += 15;
    }

    // 4. Quality SOP essay evaluation coefficient
    score += Math.floor((essayFocusPercent / 100) * 25);

    // Apply acceptance rate limit multipliers
    const accRateNum = parseFloat(selectedUni.acceptanceRate);
    if (accRateNum < 5.0) {
      score = Math.floor(score * 0.7); // Highly competitive Stanford index
    } else if (accRateNum < 15.0) {
      score = Math.floor(score * 0.85); // Munich index
    }

    const probabilityChance = Math.min(99, Math.max(5, score));

    let rating: 'Extremely Low' | 'Reach' | 'Competitive' | 'Highly Competitive' | 'Target Match' = 'Reach';
    if (probabilityChance > 85) rating = 'Target Match';
    else if (probabilityChance > 70) rating = 'Highly Competitive';
    else if (probabilityChance > 45) rating = 'Competitive';
    else if (probabilityChance > 20) rating = 'Reach';
    else rating = 'Extremely Low';

    // Compile customized reasons
    const reasons: string[] = [];
    if (gpaDifference >= 0) {
      reasons.push(`Hypothetical GPA of ${computedGpa.toFixed(2)} meets or matches the target institution's mean entering criteria (${(selectedUni.averageGpa ?? 3.0).toFixed(2)}).`);
    } else {
      reasons.push(`Hypothetical GPA of ${computedGpa.toFixed(2)} remains below the baseline entering criteria (${(selectedUni.averageGpa ?? 3.0).toFixed(2)}).`);
    }

    if (hasResearchProject) {
      reasons.push(`Adding a quantified Software and Engineering Research Paper increases academic credential review success by +20%.`);
    }
    if (hasExtracurricularFocus) {
      reasons.push(`Stronger leadership credentials satisfy essential community and project coordination values.`);
    }
    if (essayFocusPercent > 80) {
      reasons.push(`Refining essay drafts in the Writer's Quill toolkit increases SOP logical structure significantly.`);
    }

    // Critical gaps
    let criticalGap = "No critical gaps identified! Maintain study buffs and track checklists.";
    if (gpaDifference < -0.1) {
      criticalGap = `Undergraduate GPA is short of average specs by ${Math.abs(gpaDifference).toFixed(2)} points. Launch a thesis to offset.`;
    } else if (!hasResearchProject && selectedUni.ranking < 25) {
      criticalGap = `High-tier institutes heavily prioritize research profiles. We recommend launching an engineering project.`;
    } else if (essayFocusPercent < 70) {
      criticalGap = `Weak statement of purpose draft coefficient. Refine the structure in the Scroll Vault under AI guidelines.`;
    }

    setOutcome({
      probabilityChance,
      rating,
      reasons,
      criticalGapToTarget: criticalGap
    });

    // Reward points for using the Simulator Laboratory helper
    try {
      const actionName = `Used Alchemy Simulator for ${selectedUni.name}`;
      if (!rewardedActionsRef.current.has(actionName)) {
        rewardedActionsRef.current.add(actionName);
        const resReward = await authorizedFetch('/api/profile/reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: 20,
            actionName,
            badgeToUnlock: "Alchemy Oracle"
          })
        });
        const updatedProfile = await resReward.json();
        dispatchProfileUpdate(updatedProfile);
        playAdvancementSound();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6" id="scholarpath-dream-uni-sim">
      
      {/* Title block */}
      <div className="mc-window-dark border-4 border-black text-stone-200">
        <h3 className="font-press text-[11px] text-[#ffaa00] uppercase flex items-center gap-2 mc-text-shadow">
          <Sparkles className="w-5 h-5 text-[#ffaa00] animate-pulse shrink-0" /> ALCHEMIST WORKBENCH (ADMISSIONS SIMULATOR)
        </h3>
        <p className="text-xs text-stone-300 font-mono mt-2">
          Select target institutions, mix hypothetical catalysts (GPA adjustments, extra research scroll inputs, or essay grade reviews) and run calculations to simulate outcome margins!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side: Recipe Adjustment Elements */}
        <div className="md:col-span-5 bg-[#4c4c4c] border-4 border-black p-5 rounded-none space-y-4 [box-shadow:inset_-4px_-4px_0_#2b2b2b,inset_4px_4px_0_#777]">
          <h4 className="font-press text-[10px] text-[#ffff55] mc-text-shadow border-b-4 border-black pb-2.5 uppercase">SIMULATION RECIPE</h4>
          
          <div className="space-y-4 font-mono text-xs">
            {/* Uni pick */}
            <div className="flex flex-col gap-1.5">
              <span className="text-stone-300 uppercase text-[10px] font-bold">Target Stronghold (Institution)</span>
              <select
                value={selectedUni?.id || ''}
                onChange={(e) => {
                  const matched = unis.find(u => u.id === e.target.value);
                  if (matched) setSelectedUni(matched);
                  playClickSound();
                }}
                className="bg-[#1e1c1b] border-4 border-black p-2.5 text-xs text-stone-200 focus:outline-none focus:border-[#ffff55] rounded-none w-full shadow-inner"
              >
                {unis.map(u => (
                  <option key={u.id} value={u.id} className="bg-[#1e1c1b] text-stone-200">{u.name} (Rank #{u.ranking})</option>
                ))}
              </select>
            </div>

            {/* GPA variance slider */}
            <div className="space-y-1 bg-[#222120] border-2 border-black p-3 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
              <div className="flex justify-between items-center text-[10px] uppercase text-stone-400 font-bold">
                <span>GPA CATALYST FLUID</span>
                <span className="font-press text-[10px] text-[#55ff55]">{gpaAdjustment >= 0 ? `+${gpaAdjustment.toFixed(2)}` : gpaAdjustment.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-0.50"
                max="0.50"
                step="0.05"
                value={gpaAdjustment}
                onChange={(e) => { setGpaAdjustment(parseFloat(e.target.value)); playClickSound(); }}
                className="w-full accent-[#55ff55] cursor-pointer mt-2"
              />
              <span className="text-[10px] text-stone-400 block mt-1.5">*Simulates GPA increments, assignments boosts, or grade revisions.</span>
            </div>

            {/* Switch toggles */}
            <div className="space-y-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => { setHasResearchProject(!hasResearchProject); playClickSound(); }}
                className={`w-full text-left p-3 cursor-pointer border-4 font-bold flex justify-between items-center rounded-none leading-none ${
                  hasResearchProject 
                    ? 'bg-[#1e1c1b] border-[#55ff55] text-[#55ff55]' 
                    : 'bg-[#2e2e2e] border-black text-stone-400'
                }`}
              >
                <span>RESEARCH PAPER BONUS SCROLL?</span>
                <span className="text-[10px] font-press uppercase">{hasResearchProject ? 'YES' : 'NO'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setHasExtracurricularFocus(!hasExtracurricularFocus); playClickSound(); }}
                className={`w-full text-left p-3 cursor-pointer border-4 font-bold flex justify-between items-center rounded-none leading-none ${
                  hasExtracurricularFocus 
                    ? 'bg-[#1e1c1b] border-[#ffff55] text-[#ffff55]' 
                    : 'bg-[#2e2e2e] border-black text-stone-400'
                }`}
              >
                <span>LEADERSHIP EXTRA ENCHANTMENT?</span>
                <span className="text-[10px] font-press uppercase">{hasExtracurricularFocus ? 'YES' : 'NO'}</span>
              </button>
            </div>

            {/* SOP slider focus */}
            <div className="space-y-1 bg-[#222120] border-2 border-black p-3 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
              <div className="flex justify-between items-center text-[10px] uppercase text-stone-400 font-bold">
                <span>SOP REVISION INTENSITY</span>
                <span className="font-press text-[10px] text-[#ffff55]">{essayFocusPercent}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                step="5"
                value={essayFocusPercent}
                onChange={(e) => { setEssayFocusPercent(parseInt(e.target.value)); playClickSound(); }}
                className="w-full accent-[#ffff55] cursor-pointer mt-2"
              />
            </div>

            <button
              onClick={runSimulation}
              disabled={simulating || !selectedUni}
              className="w-full mc-btn py-3 text-center text-xs font-bold text-[#ffff55]"
            >
              {simulating ? 'CHURN COMPILING MODULES...' : 'CONJURE CALCULATIONS'}
            </button>
          </div>
        </div>

        {/* Right Side: Prediction Output Panel */}
        <div className="md:col-span-7 bg-[#2e2e2e] border-4 border-black p-5 rounded-none text-stone-200 flex flex-col justify-between min-h-[440px] [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#3e3e3e] pb-3">
              <Trophy className="w-5 h-5 text-[#ffff55] animate-bounce" />
              <h4 className="font-press text-[10px] text-stone-100 uppercase mc-text-shadow">SIMULATOR OUTPUT SCREEN</h4>
            </div>

            {simulating && (
              <div className="flex flex-col items-center justify-center py-28 text-center space-y-4 font-press text-[11px] text-[#ffff55]">
                <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
                <p className="animate-pulse mc-text-shadow">CONJURING ADMISSIONS CHANNELS...</p>
              </div>
            )}

            {!simulating && !outcome && (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-3 font-press text-[10px] text-[#ffaa00]">
                <HelpCircle className="w-10 h-10 text-stone-600 animate-bounce" />
                <p className="mc-text-shadow">WORKBENCH EMPTY</p>
                <p className="text-xs font-mono text-stone-400 max-w-xs uppercase leading-relaxed font-semibold">
                  Pick target Strongholds, balance modifiers, and draft calculations to compute entry forecasts.
                </p>
              </div>
            )}

            {!simulating && outcome && (
              <div className="space-y-4 font-mono text-xs animate-fade-in text-stone-200">
                
                {/* Dial Meter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#1a1818] border-4 border-black rounded-none gap-4">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-black block">ADMISSIONS SUCCESS RATE:</span>
                    <span className="font-press text-2xl text-[#55ff55] mc-text-shadow">{outcome.probabilityChance}%</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-stone-400 uppercase font-black block">TIER RATING:</span>
                    <span className="font-press text-[10px] uppercase text-[#ffff55] mc-text-shadow">{outcome.rating}</span>
                  </div>
                </div>

                {/* Reasons */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase text-stone-400 font-bold block">ALCHEMY INGREDIENTS OUTCOMES:</span>
                  <div className="space-y-2">
                    {outcome.reasons.map((r, idx) => (
                      <div key={idx} className="p-2.5 bg-[#1e1c1b] border-2 border-black text-stone-300 leading-relaxed rounded-none">
                        ⚙️ {r}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Gaps warnings */}
                <div className="p-3 bg-red-950/30 border-4 border-[#ff3f3f] text-[#ffdddd] rounded-none space-y-1">
                  <span className="font-press text-[8px] text-[#ff5555] flex items-center gap-1.5 shrink-0 uppercase mc-text-shadow">
                    <AlertTriangle className="w-4 h-4 text-[#ff5555]" /> GAP IDENTIFIED:
                  </span>
                  <p className="leading-snug text-xs font-semibold">{outcome.criticalGapToTarget}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#3e3e3e] pt-3 text-[10px] font-mono text-stone-400 flex justify-between items-center mt-3">
            <span>Diagnostics matrix system online •</span>
            <span className="text-[#55ff55] font-bold">+20 XP Added on conjure!</span>
          </div>

        </div>

      </div>
    </div>
  );
}
