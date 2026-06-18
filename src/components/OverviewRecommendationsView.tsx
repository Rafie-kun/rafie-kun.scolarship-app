import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Award, Flame, Target, Trophy, HelpCircle, Star, BadgeAlert, Coins } from 'lucide-react';
import { Profile, Scholarship, University, AppNotification } from '../types';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { dispatchProfileUpdate } from '../utils/events';

export default function OverviewRecommendationsView({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { authorizedFetch } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, scholRes, uniRes, notifRes] = await Promise.all([
          authorizedFetch('/api/profile').then(r => r.json()),
          authorizedFetch('/api/scholarships').then(r => r.json()),
          authorizedFetch('/api/universities').then(r => r.json()),
          authorizedFetch('/api/notifications').then(r => r.json()),
        ]);
        setProfile(profRes);
        setScholarships(scholRes.scholarships || []);
        setUniversities(uniRes);
        setNotifications(notifRes);
      } catch (e) {
        console.error('Error fetching dashboard stats:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const claimDailyBonus = async () => {
    playClickSound();
    
    const actionName = 'Daily Exploration Fellowship';
    if (rewardedActionsRef.current.has(actionName)) {
      console.log('Daily Exploration Fellowship bonus already claimed this session.');
      return;
    }

    rewardedActionsRef.current.add(actionName);

    try {
      const res = await authorizedFetch('/api/profile/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: 15,
          actionName
        })
      });
      const updated = await res.json();
      setProfile(updated);
      
      // Update notifications locally
      const dailyNotif: AppNotification = {
        id: 'daily-' + Date.now(),
        type: 'success',
        message: 'Claimed Daily Check-in Dividend! +15 Fellowship XP added.',
        timestamp: 'Just now'
      };
      setNotifications(prev => [dailyNotif, ...prev]);
      
      // Dipatch updated profile safely
      dispatchProfileUpdate(updated);
      playAdvancementSound();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 font-press text-[11px] text-[#ffff55] gap-4">
        <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
        <span className="mc-text-shadow">LOADING MAP DATA CHUNKS...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-16 font-press text-[11px] text-red-500 gap-4">
        <span className="mc-text-shadow">ERROR: NO HERO SLATE CARD FOUND!</span>
      </div>
    );
  }

  const currentLevel = profile?.level ?? 1;
  const currentPoints = profile?.points ?? 110;
  const pointsInCurrentLevel = currentPoints % 100;
  const xpPercent = Math.min(100, Math.max(8, (pointsInCurrentLevel / 100) * 100));

  const todayStr = new Date().toISOString().split('T')[0];
  const hasClaimedToday = profile?.lastDailyCheckin === todayStr;

  return (
    <div className="space-y-6" id="scholarpath-overview">
      
      {/* Level XP Bar */}
      <div className="mc-window bg-[#322d29] text-stone-200 border-4 border-black font-mono">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-press text-[11px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
              <Trophy className="w-4 h-4 text-[#ffff55] shrink-0 animate-bounce" /> CURRENT HERO PROGRESS
            </h3>
            <p className="text-stone-300 text-xs mt-1.5 leading-normal">
              Accumulate points to reach your dream international university! Earn additional status buffs by using our checklist, writing toolkits, or talking to the Wizard Assistant.
            </p>
          </div>
          <div className="flex flex-row flex-nowrap items-center gap-3 text-right bg-black/40 p-2.5 border-2 border-stone-800 shrink-0 whitespace-nowrap">
            <span className="font-press text-[10px] text-[#55ff55] whitespace-nowrap">LVL {currentLevel}</span>
            <span className="text-xs text-[#ffff55] font-bold font-mono whitespace-nowrap">{pointsInCurrentLevel}/100 XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Recommendations */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Daily Quest card */}
          <div className="bg-[#5c4033] border-4 border-black p-5 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 [box-shadow:inset_-4px_-4px_0_#3c281e,inset_4px_4px_0_#755543]">
            <div className="space-y-1">
              <span className="font-press text-[8px] tracking-widest text-[#ffff55] uppercase block mb-1">Quest Level: DAILY CHECK-IN</span>
              <h4 className="font-press text-[11px] text-stone-100 flex items-center gap-1.5 leading-none">
                <Flame className="w-4.5 h-4.5 text-[#ff5555] shrink-0 animate-pulse" /> {hasClaimedToday ? "DIVIDEND SECURED" : "ADMISSIONS DIVIDEND READY"}
              </h4>
              <p className="text-xs text-stone-200 leading-relaxed mt-1">
                {hasClaimedToday
                  ? "Bounty fully secured! Your daily admissions learning habits remain highly efficient. Return tomorrow for another boost!"
                  : "Establish optimal study habits! Claim your daily check-in bounty to unlock advanced portfolio templates and expand your quest logs."
                }
              </p>
            </div>
            <button
              onClick={claimDailyBonus}
              disabled={hasClaimedToday}
              className={`px-4 py-3 shrink-0 uppercase font-press text-[9px] border-4 border-black transition-all ${
                hasClaimedToday 
                  ? "bg-stone-600 text-stone-400 cursor-not-allowed [box-shadow:inset_-4px_-4px_0_#444,inset_4px_4px_0_#888] pointer-events-none opacity-60" 
                  : "mc-btn"
              }`}
            >
              {hasClaimedToday ? "CLAIMED 💎" : "CLAIM +15 XP"}
            </button>
          </div>

          {/* Core Matching Scholarship recommendations */}
          <div className="bg-[#4c4c4c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#2b2b2b,inset_4px_4px_0_#777] rounded-none space-y-4">
            <div className="flex justify-between items-center border-b-4 border-black pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#ffff55] shrink-0 animate-pulse" />
                <h4 className="font-press text-[10px] text-[#ffff55] mc-text-shadow uppercase">GOLDEN OPPORTUNITIES</h4>
              </div>
              <button 
                onClick={() => onNavigate('scholarships')}
                className="mc-btn px-3 py-2 text-[9px] uppercase"
              >
                VIEW MAP
              </button>
            </div>

            <div className="space-y-4">
              {scholarships?.length ? (
                scholarships.slice(0, 3).map((sch) => (
                  <div 
                    key={sch.id} 
                    className="p-4 bg-[#2e2e2e] border-4 border-black [box-shadow:inset_-2px_-2px_0_#1a1a1a,inset_2px_2px_0_#555] space-y-2 hover:border-[#ffff55] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                      <span className="font-press text-[8px] text-[#ffaa00] mc-text-shadow uppercase">{sch?.provider ?? 'Issuer'}</span>
                      <span className="text-xs font-bold text-[#55ff55] bg-black/40 px-2 py-0.5 border border-[#55ff55]/30 rounded-none">{sch?.fundingCoverage}</span>
                    </div>
                    <h5 className="font-press text-[10px] text-[#ffff55] mc-text-shadow leading-snug">{sch?.name}</h5>
                    <p className="text-xs text-stone-300 leading-relaxed font-sans">{sch?.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs font-mono text-stone-400 border-t border-[#3e3e3e]">
                      <span className="flex items-center gap-1 text-[#ffaa00]">
                        <Target className="w-4 h-4" /> REQ GPA: {sch?.gpaRequirement?.toFixed(2) ?? '—'}
                      </span>
                      <span className="flex items-center gap-1 text-[#f34545]">
                        <Award className="w-4 h-4" /> COMPETITIVENESS: {sch?.competitivenessScore ?? 0}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-stone-400 text-xs">
                  No scholarships match your level. Update profile stats!
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Information & Activity */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Notifications feed */}
          <div className="bg-[#2a2a2a] border-4 border-black p-5 rounded-none space-y-4 text-stone-200 [box-shadow:inset_-4px_-4px_0_#181818,inset_4px_4px_0_#555]">
            <h4 className="font-press text-[9px] text-[#ffffff] mc-text-shadow uppercase flex items-center gap-2">
              <BadgeAlert className="w-4 h-4 text-[#ffff55] shrink-0 animate-pulse" /> SYSTEM BEACONS
            </h4>
            
            <div className="space-y-3 font-mono text-xs">
              {notifications?.slice(0, 5)?.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 border-l-4 rounded-none space-y-1 ${
                    notif.type === 'success' 
                      ? 'bg-emerald-950/40 border-[#55ff55] text-[#55ff55]' 
                      : notif.type === 'warning'
                      ? 'bg-amber-950/40 border-[#ffaa00] text-[#ffaa00]'
                      : 'bg-stone-850 border-[#ffff55] text-stone-200'
                  }`}
                >
                  <p className="leading-snug text-xs">{notif.message}</p>
                  <span className="text-[10px] text-stone-500 text-right block mt-1">{notif.timestamp}</span>
                </div>
              ))}
              {(!notifications || notifications.length === 0) && (
                <div className="text-center py-6 text-stone-400 text-xs">
                  No bulletins registered yet. Run on!
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-[#4c4c4c] border-4 border-black p-5 rounded-none space-y-4 [box-shadow:inset_-4px_-4px_0_#2b2b2b,inset_4px_4px_0_#777]">
            <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase border-b-4 border-black pb-2">HERO ARTIFACTS</h4>
            
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-[#2a2a2a] border-2 border-black flex justify-between rounded-none [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
                <span className="text-[#ffaa00]">GPA CAP LIMIT:</span>
                <span className="font-press text-[9px] text-[#55ff55]">{profile?.gpa?.toFixed(2) ?? '—'} / {profile?.maxGpa?.toFixed(1) ?? '—'}</span>
              </div>
              <div className="p-3 bg-[#2a2a2a] border-2 border-black flex justify-between rounded-none [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
                <span className="text-[#ffaa00]">TARGET CLASS:</span>
                <span className="font-mono text-xs text-stone-200 uppercase font-semibold">{profile?.intendedMajor || 'Computing Science'}</span>
              </div>
              <div className="p-3 bg-[#2a2a2a] border-2 border-black flex justify-between rounded-none [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
                <span className="text-[#ffaa00]">ENROLLED PATH:</span>
                <span className="font-mono text-xs text-stone-200 uppercase font-semibold">{profile?.intendedDegree || 'Master'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
