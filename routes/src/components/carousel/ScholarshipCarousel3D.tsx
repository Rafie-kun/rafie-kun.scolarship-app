import React, { useState } from 'react';
import { Scholarship } from '../../types';
import { playClickSound } from '../../utils/sound';
import { Sparkles, Trophy, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

interface ScholarshipCarousel3DProps {
  scholarships: Scholarship[];
  onSelect: (sch: Scholarship) => void;
}

export default function ScholarshipCarousel3D({ scholarships, onSelect }: ScholarshipCarousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!scholarships || scholarships.length === 0) return null;

  // Use up to 5 scholarships for the carousel
  const carouselItems = scholarships.slice(0, 5);
  const totalItems = carouselItems.length;

  const handleNext = () => {
    playClickSound();
    setActiveIndex((prev) => (prev + 1) % totalItems);
  };

  const handlePrev = () => {
    playClickSound();
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  return (
    <div className="relative py-10 flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow orb */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title */}
      <div className="text-center mb-8 relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-extrabold uppercase tracking-widest border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Highly Recommended Fellowships
        </span>
        <h3 className="text-2xl font-black mt-2 text-[#0f2b5b] dark:text-white">
          Interactive Spec Pathfinder Carousel
        </h3>
      </div>

      {/* 3D Scene Wrapper */}
      <div className="relative w-full max-w-4xl h-[340px] flex items-center justify-center px-4">
        {/* Carousel Tracks */}
        <div className="relative w-full max-w-[340px] md:max-w-[400px] h-[280px] flex items-center justify-center [perspective:1200px]">
          {carouselItems.map((sch, index) => {
            // Calculate active index position offset
            let offset = index - activeIndex;
            if (offset < -totalItems / 2) offset += totalItems;
            if (offset > totalItems / 2) offset -= totalItems;

            const isCenter = index === activeIndex;
            const absOffset = Math.abs(offset);

            // Hide cards beyond immediate visual neighbors
            if (absOffset > 2) return null;

            // 3D positioning properties
            const rotateY = offset * 28; // rotatory skew
            const translateZ = -absOffset * 105; // push depth
            const translateX = offset * 130;  // side offset
            const scale = isCenter ? 1 : 0.85;
            const opacity = isCenter ? 1 : 0.6 - absOffset * 0.15;
            const zIndex = 10 - absOffset;

            return (
              <div
                key={sch.id}
                onClick={() => {
                  if (isCenter) {
                    onSelect(sch);
                  } else {
                    playClickSound();
                    setActiveIndex(index);
                  }
                }}
                className={`absolute w-full h-full cursor-pointer transition-all duration-500 ease-out`}
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                  transformStyle: 'preserve-3d',
                }}
              >
                <GlassCard 
                  className={`w-full h-full p-6 flex flex-col justify-between border-2 select-none ${
                    isCenter 
                      ? 'border-indigo-500/50 shadow-[0_15px_35px_rgba(59,130,246,0.25)]' 
                      : 'border-white/10'
                  }`}
                  hoverEffect={isCenter}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase truncate max-w-[120px]">
                        {sch.provider || "Trust Global"}
                      </span>
                      <span className="text-[11px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 rounded-full whitespace-nowrap">
                        {sch?.fundingCoverage}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base md:text-lg text-slate-800 dark:text-white leading-snug line-clamp-2">
                      {sch.name}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed">
                      {sch.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[11px] font-semibold text-slate-450">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" /> Competitiveness: {sch.competitivenessScore}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(sch);
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Read full {`->`}
                    </button>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>

        {/* Carousel buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-0 md:-left-8 w-11 h-11 bg-white/15 hover:bg-white/25 active:scale-90 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 dark:text-white shadow-lg transition-all z-20 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 font-bold" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-0 md:-right-8 w-11 h-11 bg-white/15 hover:bg-white/25 active:scale-90 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 dark:text-white shadow-lg transition-all z-20 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 font-bold" />
        </button>
      </div>

      {/* Visual Navigation Pips */}
      <div className="flex justify-center gap-2 mt-4">
        {carouselItems.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              playClickSound();
              setActiveIndex(i);
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIndex 
                ? 'bg-indigo-600 dark:bg-indigo-400 w-6' 
                : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
