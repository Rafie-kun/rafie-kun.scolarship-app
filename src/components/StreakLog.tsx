import React, { useState, useEffect } from 'react';
import { Flame, Trophy, CheckCircle, Lock, Award, Star, Info, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';

interface StreakMilestone {
  days: number;
  xpReward: number;
  title: string;
  id: string;
}

export default function StreakLog() {
  const { profile, rewardPoints, user } = useAuth();
  const [streakCount, setStreakCount] = useState(0);
  const [checkInHistory, setCheckInHistory] = useState<string[]>([]);
  const [claimedMilestones, setClaimedMilestones] = useState<string[]>([]);

  const username = user || 'guest';

  // Available milestones
  const milestones: StreakMilestone[] = [
    { id: 'streak-3', days: 3, xpReward: 20, title: 'Three-Day Expedition' },
    { id: 'streak-7', days: 7, xpReward: 50, title: 'Weekly Vanguard' },
    { id: 'streak-14', days: 14, xpReward: 100, title: 'Fortnight Fortress' },
    { id: 'streak-30', days: 30, xpReward: 250, title: 'Legendary Scholar Guild' }
  ];

  // Helper to get array of past N dates in YYYY-MM-DD format
  const getPastNDates = (n: number) => {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Compute streak and check-ins based on history and profile activity
  useEffect(() => {
    if (!profile) return;

    // Load local history of check-in dates
    let datesList: string[] = [];
    try {
      const stored = localStorage.getItem(`scholarpath_checkins_${username}`);
      if (stored) {
        datesList = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    // Integrate the profile's lastDailyCheckin if present
    if (profile.lastDailyCheckin && !datesList.includes(profile.lastDailyCheckin)) {
      datesList.push(profile.lastDailyCheckin);
      datesList.sort();
      localStorage.setItem(`scholarpath_checkins_${username}`, JSON.stringify(datesList));
    }

    setCheckInHistory(datesList);

    // Compute streak
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    // Check if user has checked in today or yesterday, otherwise streak is broken
    const hasToday = datesList.includes(todayStr);
    const hasYesterday = datesList.includes(yesterdayStr);

    if (!hasToday && !hasYesterday) {
      setStreakCount(0);
    } else {
      // Calculate backward from the most recent active date
      let currentStreak = 0;
      let checkDate = hasToday ? new Date() : yesterdayObj;
      let running = true;

      while (running) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (datesList.includes(checkStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          running = false;
        }
      }
      setStreakCount(currentStreak);
    }

    // Load claimed milestones
    try {
      const claimed = localStorage.getItem(`scholarpath_claimed_streaks_${username}`);
      if (claimed) {
        setClaimedMilestones(JSON.parse(claimed));
      } else {
        setClaimedMilestones([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [profile, username]);

  // Handle claiming a milestone reward
  const handleClaimMilestone = async (m: StreakMilestone) => {
    if (streakCount < m.days) return;
    if (claimedMilestones.includes(m.id)) return;

    playClickSound();

    try {
      // Call standard rewardPoints to award real XP
      await rewardPoints(m.xpReward, `Streak Milestone Reached: ${m.title} (${m.days} Days)`);

      // Mark as claimed locally
      const updatedClaimed = [...claimedMilestones, m.id];
      setClaimedMilestones(updatedClaimed);
      localStorage.setItem(`scholarpath_claimed_streaks_${username}`, JSON.stringify(updatedClaimed));
      
      playAdvancementSound();
    } catch (err) {
      console.error("Failed to claim streak reward:", err);
    }
  };

  // Generate 7-day visual grid (ends today)
  const past7Days = getPastNDates(7).map(dateStr => {
    const d = new Date(dateStr + 'T12:00:00'); // avoid timezone shifts
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const done = checkInHistory.includes(dateStr);

    return {
      dateStr,
      weekday,
      isToday,
      done
    };
  });

  return (
    <div className="bg-[#3b2d24] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#241a14,inset_4px_4px_0_#533f33] rounded-none space-y-4" id="scholarpath-streak-tracker">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 animate-pulse shrink-0" />
          <h4 className="font-press text-[10px] text-orange-400 mc-text-shadow uppercase">Daily Streak Logs</h4>
        </div>
        <div className="bg-black/40 border-2 border-stone-850 px-2.5 py-1 flex items-center gap-1.5 font-press text-[9px] text-[#ffaa00] shrink-0">
          🔥 {streakCount} Days Active
        </div>
      </div>

      {/* 7-Day Contribution Path */}
      <div className="space-y-1.5">
        <span className="font-mono text-[10px] text-stone-400 block uppercase font-bold tracking-wide">Weekly Alignment Matrix:</span>
        <div className="grid grid-cols-7 gap-2">
          {past7Days.map((day, idx) => (
            <div
              key={idx}
              className={`p-2 border-2 text-center flex flex-col items-center justify-center relative ${
                day.done
                  ? 'bg-orange-950/40 border-orange-500 text-orange-400 [box-shadow:inset_-2px_-2px_0_#381102]'
                  : day.isToday
                  ? 'bg-black/30 border-dashed border-stone-600 text-stone-500'
                  : 'bg-black/25 border-stone-850 text-stone-600'
              }`}
              title={`${day.dateStr} (${day.done ? 'Checked In' : 'Missed'})`}
            >
              <span className="text-[8px] font-press block select-none uppercase mb-1 leading-none">{day.weekday}</span>
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                day.done 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-stone-800'
              }`}>
                {day.done ? (
                  <span className="text-[8px] leading-none">✓</span>
                ) : (
                  <span className="text-[8px] text-stone-600 leading-none">○</span>
                )}
              </div>
              {day.isToday && (
                <span className="absolute -bottom-1 bg-amber-500 border border-black text-black px-0.5 text-[6px] font-mono leading-none select-none font-black uppercase">
                  Now
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="space-y-2 pt-1">
        <span className="font-mono text-[10px] text-stone-400 block uppercase font-bold tracking-wide">Claimable Streak Milestones:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {milestones.map((m) => {
            const isUnlocked = streakCount >= m.days;
            const isClaimed = claimedMilestones.includes(m.id);

            return (
              <div
                key={m.id}
                className={`p-3 border-2 flex items-center justify-between gap-3 ${
                  isClaimed
                    ? 'bg-stone-900/40 border-stone-800 opacity-60 text-stone-400'
                    : isUnlocked
                    ? 'bg-[#1b3d1b] border-[#55ff55] text-stone-100 hover:scale-[1.02] cursor-pointer transition-transform'
                    : 'bg-black/20 border-stone-850 text-stone-500'
                }`}
                onClick={() => isUnlocked && !isClaimed && handleClaimMilestone(m)}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-press text-[8px] uppercase select-none font-extrabold tracking-wide">
                      {m.days} Days Streak
                    </span>
                    {isClaimed && <CheckCircle className="w-3.5 h-3.5 text-[#55ff55]" />}
                  </div>
                  <p className="text-[10px] font-sans font-medium line-clamp-1">{m.title}</p>
                </div>

                <div className="shrink-0 text-right">
                  {isClaimed ? (
                    <span className="text-[8px] font-press text-stone-500 uppercase">CLAIMED</span>
                  ) : isUnlocked ? (
                    <button className="bg-[#55ff55] hover:bg-[#40dd40] text-black font-press text-[8px] px-2 py-1 uppercase border-2 border-black [box-shadow:inset_-1px_-1px_0_#2b8c2b,inset_1px_1px_0_#99ff99] leading-none select-none animate-bounce font-black">
                      CLAIM +{m.xpReward} XP
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 font-mono text-[10px] text-stone-500">
                      <Lock className="w-3 h-3 text-stone-600" />
                      <span>+{m.xpReward} XP</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
