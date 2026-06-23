import React, { useState } from 'react';
import { Award, CheckCircle, Sparkles, MessageSquare, Heart, ShieldAlert, Calendar } from 'lucide-react';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { dispatchProfileUpdate } from '../utils/events';

interface Mentor {
  id: string;
  name: string;
  role: string;
  university: string;
  scholarshipJoined: string;
  availability: string[];
}

export default function MentorView() {
  const [success, setSuccess] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const mentors: Mentor[] = [
    {
      id: "men-1",
      name: "Tofael Islam",
      role: "Ph.D. Compiler Engineer Research Fellowship",
      university: "Stanford University",
      scholarshipJoined: "Fulbright Scholar",
      availability: ["Monday 16:00 UTC", "Wednesday 18:00 UTC"]
    },
    {
      id: "men-2",
      name: "Nabila Tabassum",
      role: "Graduate ML Infrastructure Engineer at EuroLabs",
      university: "Technical University of Munich",
      scholarshipJoined: "Erasmus Mundus Alumni",
      availability: ["Thursday 09:00 UTC", "Friday 15:00 UTC"]
    },
    {
      id: "men-3",
      name: "Anas Ahmed",
      role: "Sustainable Dev Delegate / AI Ethics Advocate",
      university: "University of Cambridge",
      scholarshipJoined: "Commonwealth Fellow",
      availability: ["Saturday 11:00 UTC", "Sunday 14:00 UTC"]
    }
  ];

  const handleBookMentor = async (men: Mentor, slot: string) => {
    playClickSound();
    setSelectedMentor(`${men.id}-${slot}`);

    // Wait 400ms to simulate official registration
    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      // Award callback points for scheduling fellowship audits
      const actionName = `Booked Mentorship session with ${men.name}`;
      if (!rewardedActionsRef.current.has(actionName)) {
        rewardedActionsRef.current.add(actionName);
        const resReward = await fetch('/api/profile/reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: 30,
            actionName,
            badgeToUnlock: "Mentee Initiate"
          })
        });

        const updatedProfileObj = await resReward.json();
        dispatchProfileUpdate(updatedProfileObj);
      }

      setSuccess(`Booked consultation with ${men.name} on ${slot}! Access links generated.`);
      playAdvancementSound();
      setSelectedMentor(null);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6" id="scholarpath-mentors-board">
      
      {/* Title */}
      <div className="mc-window border-4 border-black p-5 text-stone-800">
        <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
          <Award className="w-5 h-5 text-stone-900 shrink-0" /> ALUMNI MENTORSHIP REGISTRY
        </h3>
        <p className="text-xs text-stone-700 font-sans mt-2 leading-relaxed">
          Review expert mentors who previously won fully-funded positions at Cambridge, Munich, Stanford, or Imperial. Schedule a consultation to review ECTS credits, CV items, or SOP hooks.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-950/40 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5 text-[#55ff55] shrink-0 animate-bounce" />
          <span className="mc-text-shadow font-bold">{success} (+30 XP Added!)</span>
        </div>
      )}

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mentors.map((men) => (
          <div 
            key={men.id}
            className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] rounded-none flex flex-col justify-between hover:border-stone-400 transition-colors text-stone-200"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <span className="font-press text-[8px] text-[#ffaa00] mc-text-shadow uppercase">{men.scholarshipJoined}</span>
                <span className="text-[10px] font-mono text-stone-400 font-semibold">{men.university}</span>
              </div>

              <h4 className="font-press text-[10px] text-[#ffff55] mc-text-shadow leading-tight">{men.name}</h4>
              <p className="text-xs text-stone-300 font-sans leading-relaxed pt-1">{men.role}</p>

              <div className="pt-3 border-t border-stone-800 space-y-2">
                <span className="text-[9px] font-press text-[#55ffff] uppercase block">AVAILABLE BOOKING SLOTS:</span>
                <div className="space-y-2 font-mono text-xs">
                  {men.availability.map((slot, idx) => {
                    const bookingId = `${men.id}-${slot}`;
                    const isSelected = selectedMentor === bookingId;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleBookMentor(men, slot)}
                        disabled={selectedMentor !== null}
                        className="w-full text-left p-3 bg-[#141414] border-2 border-black hover:border-stone-500 flex justify-between items-center rounded-none transition-all leading-none cursor-pointer"
                      >
                        <span className="text-stone-300 font-semibold text-xs">{slot}</span>
                        <span className="text-[8px] font-press uppercase text-[#ffff55] mc-text-shadow">
                          {isSelected ? 'Booking...' : 'Book'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800 mt-4 text-[9.5px] font-mono text-stone-400 flex items-center gap-1.5 leading-none">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Grants counselor review capabilities</span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
