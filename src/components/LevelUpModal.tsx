import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Shield, ArrowRight, Star } from 'lucide-react';
import { playAdvancementSound, playClickSound } from '../utils/sound';

interface LevelUpModalProps {
  currentLevel: number;
  points: number;
}

export default function LevelUpModal({ currentLevel, points }: LevelUpModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [levelDisplay, setLevelDisplay] = useState(currentLevel);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    // On mount, store the initial level so we don't trigger the modal on load
    if (prevLevelRef.current === null) {
      prevLevelRef.current = currentLevel;
      setLevelDisplay(currentLevel);
      return;
    }

    // If level increases, trigger the Level Up modal!
    if (currentLevel > prevLevelRef.current) {
      playAdvancementSound();
      setIsOpen(true);
      setLevelDisplay(currentLevel);
    }
    
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  const handleClose = () => {
    playClickSound();
    setIsOpen(false);
  };

  const rewards = [
    "+1 Active Application Slot",
    "Enhanced SOP AI Critique Speed",
    "Premium Skin Cosmetics Unlocked",
    "Admissions Armor Durability Maxed!"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
          {/* Animated Background Confetti & Lights */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  scale: Math.random() * 0.5 + 0.5, 
                  x: '50vw', 
                  y: '50vh' 
                }}
                animate={{ 
                  opacity: 0,
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 2.5, 
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
                className="absolute text-2xl"
                style={{
                  color: ['#ffff55', '#55ff55', '#55ffff', '#ff55ff', '#ffaa00'][i % 5]
                }}
              >
                {['✦', '✨', '★', '⚡', '💎'][i % 5]}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.3, y: 100, rotate: -10, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              rotate: 0, 
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 280,
                damping: 15
              }
            }}
            exit={{ scale: 0.8, y: 50, opacity: 0, transition: { duration: 0.2 } }}
            className="w-full max-w-md bg-[#252220] border-8 border-black p-6 [box-shadow:inset_-6px_-6px_0_#121110,inset_6px_6px_0_#555,0_20px_50px_rgba(0,0,0,0.8)] relative text-center"
          >
            {/* Double decorative border */}
            <div className="absolute -inset-1.5 border-4 border-[#ffaa00] pointer-events-none" />

            {/* Top Starburst Badge */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-24 h-24 bg-gradient-to-tr from-[#ffaa00] to-[#ffff55] rounded-full flex items-center justify-center border-4 border-black shadow-[0_0_20px_rgba(255,170,0,0.4)] mb-4 shrink-0"
            >
              <Trophy className="w-12 h-12 text-black drop-shadow-md" />
            </motion.div>

            {/* Floating text badge */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-[10px] font-press bg-[#55ff55] border-2 border-black text-black px-2 py-0.5 inline-block uppercase font-bold tracking-wider mb-2"
            >
              Advancement Unlocked!
            </motion.div>

            <h2 className="font-press text-2xl text-[#ffff55] mc-text-shadow tracking-wider uppercase leading-none my-2 animate-pulse">
              LEVEL UP!
            </h2>

            <p className="font-mono text-stone-400 text-xs uppercase font-bold tracking-widest mt-1">
              Pathfinder Rank Promoted
            </p>

            {/* Level indicator transition badge */}
            <div className="flex items-center justify-center gap-6 my-6 bg-black/60 border-4 border-black py-4 px-6 [box-shadow:inset_-2px_-2px_0_#141414,inset_2px_2px_0_#444]">
              <div className="text-center">
                <span className="text-[9px] font-press text-stone-500 block uppercase mb-1">Old Lvl</span>
                <span className="font-press text-lg text-stone-400">{levelDisplay - 1}</span>
              </div>
              
              <motion.div 
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <ArrowRight className="w-6 h-6 text-[#ffff55]" />
              </motion.div>

              <div className="text-center">
                <span className="text-[9px] font-press text-[#55ff55] block uppercase mb-1">New Lvl</span>
                <span className="font-press text-2xl text-[#55ff55] mc-text-shadow">{levelDisplay}</span>
              </div>
            </div>

            {/* RPG Rewards section */}
            <div className="space-y-2.5 text-left bg-[#1a1818] border-2 border-black p-4 font-mono text-xs">
              <div className="text-[9px] font-press text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Stats & Perks Gained:
              </div>
              {rewards.map((reward, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.15 }}
                  className="flex items-center gap-2 text-stone-300"
                >
                  <span className="text-[#55ff55] font-bold">✦</span>
                  <span className="leading-tight">{reward}</span>
                </motion.div>
              ))}
            </div>

            {/* Motivation statement */}
            <p className="font-sans text-xs text-stone-400 mt-5 leading-relaxed italic">
              "Your intellectual armor grows thicker as you advance through your academic journey."
            </p>

            {/* Minecraft Close Button */}
            <button
              onClick={handleClose}
              className="mc-btn w-full py-3 mt-6 text-xs text-black font-press font-bold uppercase cursor-pointer"
            >
              Collect Rewards
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
