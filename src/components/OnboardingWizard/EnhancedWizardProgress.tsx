import React from 'react';
import { 
  Compass, Map, BookOpen, Calculator, Sparkles, Coins, Briefcase
} from 'lucide-react';
import { playClickSound } from '../../utils/sound';

interface EnhancedWizardProgressProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function EnhancedWizardProgress({ 
  currentStep, 
  onStepClick 
}: EnhancedWizardProgressProps) {
  
  const steps = [
    { id: 1, name: "Curriculum", icon: Compass, color: "text-blue-400" },
    { id: 2, name: "History", icon: Map, color: "text-purple-400" },
    { id: 3, name: "Biome Info", icon: BookOpen, color: "text-[#ffaa00]" },
    { id: 4, name: "Subjects", icon: Calculator, color: "text-emerald-400" },
    { id: 5, name: "Analytics", icon: Sparkles, color: "text-[#ffff55]" },
    { id: 6, name: "Budget", icon: Coins, color: "text-red-400" },
    { id: 7, name: "Wages", icon: Briefcase, color: "text-cyan-400" }
  ];

  return (
    <div className="bg-[#141414] border-4 border-black p-4 space-y-3 font-mono" id="enhanced-wizard-progress">
      {/* Mini-stats bar */}
      <div className="flex justify-between items-center border-b border-stone-800 pb-2 text-[10px]">
        <span className="text-stone-400 uppercase font-bold">QUEST SEQUENCE STATUS:</span>
        <span className="text-[#ffff55] font-press text-[9px] animate-pulse">STEP {currentStep} OF 7</span>
      </div>

      {/* Progress Track Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          let bgClass = "bg-[#25211e] border-stone-800 text-stone-500";
          let borderGlow = "border-2";
          
          if (isActive) {
            bgClass = "bg-stone-900 text-[#ffff55] border-[#ffff55]";
            borderGlow = "border-4";
          } else if (isCompleted) {
            bgClass = "bg-[#1f2d24] text-[#55ff55] border-[#55ff55]";
            borderGlow = "border-2";
          }

          return (
            <button
              key={step.id}
              onClick={() => {
                // Allow backnavigation or jumping to configured items
                if (step.id <= currentStep + 1) {
                  playClickSound();
                  onStepClick(step.id);
                }
              }}
              disabled={step.id > currentStep + 1}
              className={`flex flex-col items-center justify-center p-2 text-center select-none ${bgClass} border-black transition-all duration-150 relative ${
                step.id <= currentStep + 1 ? 'cursor-pointer hover:border-stone-400' : 'opacity-40 cursor-not-allowed'
              }`}
              style={{
                borderStyle: 'solid',
                borderWidth: isActive ? '3px' : '2px',
              }}
            >
              {/* Step indicator tag */}
              <span className={`text-[8px] uppercase font-bold block mb-1 ${isActive ? 'text-[#ffff55]' : 'text-stone-500'}`}>
                {isCompleted ? '✓ Done' : `Step ${step.id}`}
              </span>

              {/* Icon */}
              <Icon className={`w-4 h-4 mb-1.5 ${isActive ? step.color : isCompleted ? 'text-[#55ff55]' : 'text-stone-600'}`} />

              {/* Label */}
              <span className="text-[9px] font-bold block truncate max-w-full text-stone-200">
                {step.name}
              </span>

              {/* Minecraft Active underline line */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ffff55]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Retro Slider Progress Bar */}
      <div className="relative pt-1.5">
        <div className="w-full bg-stone-900 border-2 border-black h-4 p-0.5 overflow-hidden flex">
          <div 
            className="bg-[#55ff55] h-full transition-all duration-300 relative"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          >
            {/* Gloss overlay */}
            <div className="absolute inset-0 bg-white/10" />
          </div>
        </div>
        <div className="flex justify-between text-[8px] text-stone-500 pt-1 uppercase">
          <span>0% CHRONO</span>
          <span>50% TRANSIT</span>
          <span>100% COMPLETE</span>
        </div>
      </div>
    </div>
  );
}
