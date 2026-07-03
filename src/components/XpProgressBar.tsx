import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  symbol: string;
}

interface XpProgressBarProps {
  points: number;
  level: number;
  triggerMilestone?: boolean;
  className?: string;
  showText?: boolean;
}

export default function XpProgressBar({
  points,
  level,
  triggerMilestone,
  className = '',
  showText = true,
}: XpProgressBarProps) {
  const currentLevelXp = points % 100;
  const progressPercent = Math.min(100, Math.max(0, currentLevelXp));
  const prevPointsRef = useRef(points);
  const [particles, setParticles] = useState<Particle[]>([]);

  const spawnParticles = () => {
    const newParticles: Particle[] = [];
    const colors = ['#55ff55', '#ffff55', '#ffaa00', '#55ffff', '#e0e0e0'];
    const symbols = ['✦', '✨', '★', '⚡', '💎', '+XP'];

    for (let i = 0; i < 16; i++) {
      newParticles.push({
        id: Date.now() + i + Math.random(),
        x: Math.random() * 90 + 5, // % position along bar
        y: Math.random() * 10 - 5,
        size: Math.random() * 6 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    // Cleanup after animation finishes
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 1400);
  };

  useEffect(() => {
    if (points > prevPointsRef.current || triggerMilestone) {
      spawnParticles();
    }
    prevPointsRef.current = points;
  }, [points, triggerMilestone]);

  useEffect(() => {
    const handleMilestoneEvent = (e: Event) => {
      spawnParticles();
    };
    window.addEventListener('scholarpath-milestone-achieved', handleMilestoneEvent);
    return () => {
      window.removeEventListener('scholarpath-milestone-achieved', handleMilestoneEvent);
    };
  }, []);

  return (
    <div className={`space-y-1.5 relative select-none ${className}`}>
      {/* Label and values */}
      {showText && (
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="font-press text-[9px] text-[#ffaa00] mc-text-shadow flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-[#ffaa00]" /> LVL {level} PATHFINDER
          </span>
          <span className="font-bold text-[#55ff55] font-press text-[9px]">
            {currentLevelXp} / 100 XP
          </span>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="relative w-full h-4 bg-stone-950 border-2 border-black p-0.5 overflow-visible shadow-inner">
        {/* Fill bar */}
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-[#55ff55] to-[#ffff55] transition-all duration-500 ease-out relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>

        {/* Floating Particles Burst Container */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {particles.map((p) => (
            <span
              key={p.id}
              className="xp-particle font-press font-bold drop-shadow-md"
              style={{
                left: `${p.x}%`,
                bottom: '100%',
                fontSize: `${p.size}px`,
                color: p.color,
                ['--tw-translate-x' as any]: `${(Math.random() - 0.5) * 40}px`,
                ['--tw-translate-y' as any]: `-${Math.random() * 30 + 20}px`,
              }}
            >
              {p.symbol}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
