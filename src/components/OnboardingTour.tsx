import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Trophy, Star, ArrowRight } from 'lucide-react';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { tourSteps, TourStep } from '../services/tourService';

interface OnboardingTourProps {
  onComplete: (totalXP: number) => void;
  onSkip: () => void;
  onNavigateTab: (tabId: string) => void;
}

export default function OnboardingTour({ onComplete, onSkip, onNavigateTab }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPosition, setStepPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [elementVisible, setElementVisible] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const step = tourSteps[currentStep];

  // Navigate to the page and find the target element
  useEffect(() => {
    let active = true;
    const executeStep = async () => {
      setIsNavigating(true);
      setElementVisible(false);
      setHighlightRect(null);

      // 1. Navigate to the target page, if any
      if (step.page) {
        onNavigateTab(step.page);
        // Dispatch special event just in case it\'s the profile academics tab
        if (step.id === 'education') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('profile-tab-academics'));
          }, 150);
        }
        // Wait for page transition & mount
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      if (!active) return;

      // 2. Poll and attempt to locate target element
      let targetEl: Element | null = null;
      let attempts = 0;
      const maxAttempts = 15;

      while (!targetEl && attempts < maxAttempts) {
        if (step.targetSelector) {
          targetEl = document.querySelector(step.targetSelector);
        }
        if (!targetEl) {
          await new Promise(resolve => setTimeout(resolve, 150));
          attempts++;
        }
      }

      if (!active) return;

      if (targetEl && step.targetSelector) {
        // Scroll the target element into view smoothly in the context
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait for scroll completion
        await new Promise(resolve => setTimeout(resolve, 400));
        
        if (!active) return;

        const rect = targetEl.getBoundingClientRect();
        
        const topVal = rect.top + window.scrollY;
        const leftVal = rect.left + window.scrollX;
        
        setHighlightRect({
          top: topVal,
          left: leftVal,
          width: rect.width,
          height: rect.height
        });

        // Calculate placement relative to the viewport
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        let topStr = '50%';
        let leftStr = '50%';
        let transformStr = 'translate(-50%, -50%)';

        if (spaceBelow > 320) {
          topStr = `${topVal + rect.height + 16}px`;
          leftStr = `${leftVal + rect.width / 2}px`;
          transformStr = 'translateX(-50%)';
        } else if (spaceAbove > 320) {
          topStr = `${topVal - 260}px`;
          leftStr = `${leftVal + rect.width / 2}px`;
          transformStr = 'translateX(-50%)';
        } else {
          // Fallback placements
          topStr = `${topVal + rect.height / 2}px`;
          leftStr = `${Math.min(window.innerWidth - 380, leftVal + rect.width + 16)}px`;
          transformStr = 'translateY(-50%)';
        }

        setStepPosition({
          top: topStr,
          left: leftStr,
          transform: transformStr
        });
        setElementVisible(true);
        setIsNavigating(false);
      } else {
        // Center the overlay if element target doesn\'t exist or is welcome/complete steps
        setHighlightRect(null);
        setStepPosition({
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        });
        setElementVisible(true);
        setIsNavigating(false);
      }
    };

    executeStep();

    return () => {
      active = false;
    };
  }, [currentStep, step, onNavigateTab]);

  const handleNext = () => {
    playClickSound();
    setXpEarned(prev => prev + step.xpReward);
    
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      playAdvancementSound();
      const totalXP = tourSteps.reduce((sum, s) => sum + s.xpReward, 0);
      onComplete(totalXP);
    }
  };

  const handlePrevious = () => {
    playClickSound();
    if (currentStep > 0) {
      // Revert XP for that step
      const prevStep = tourSteps[currentStep - 1];
      setXpEarned(prev => Math.max(0, prev - prevStep.xpReward));
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none font-sans pointer-events-none">
      {/* Darkened modal backdrop */}
      <div className="absolute inset-0 bg-black/80 pointer-events-auto transition-all duration-300" />

      {/* Highlighter overlay on correct coordinates with pulse glow */}
      {highlightRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute pointer-events-none z-10"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16
          }}
        >
          <div className="absolute inset-0 border-4 border-[#ffff55] rounded-none animate-pulse shadow-[0_0_30px_rgba(255,255,85,0.4)]" />
          <div className="absolute inset-[-8px] border-2 border-[#ffff55]/30 rounded-none pointer-events-none" />
        </motion.div>
      )}

      {/* Interactive Tooltip Dialog box */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute pointer-events-auto bg-[#2c2c2c] border-4 border-black p-5 w-[#90%] sm:w-[410px] rounded-none [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555,0_15px_40px_rgba(0,0,0,0.85)] z-50 text-stone-200"
          style={{
            top: stepPosition.top,
            left: stepPosition.left,
            transform: stepPosition.transform,
          }}
        >
          {/* Skip button cross */}
          <button
            onClick={() => { playClickSound(); onSkip(); }}
            className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-100 cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step Progress indicators */}
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-stone-800">
            <span className="font-press text-[8px] text-stone-400 tracking-wider">
              QUEST LOG PROGRESS — {currentStep + 1}/{tourSteps.length}
            </span>
            <div className="flex gap-1.5 ml-auto mr-6">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 transition-all ${
                    i === currentStep ? 'bg-[#ffff55] scale-125' :
                    i < currentStep ? 'bg-[#55ff55]' : 'bg-stone-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step visual & texts columns */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-1 bg-black/40 border-2 border-stone-850 h-14 w-14 flex items-center justify-center relative">
              <span className="text-3xl animate-bounce leading-none">
                {step.title.split(' ')[0] || '🎯'}
              </span>
            </div>
            
            <div className="flex-1 space-y-1">
              <h3 className="font-press text-[10px] text-[#ffff55] uppercase leading-snug mc-text-shadow">
                {step.title.substring(step.title.indexOf(' ') + 1)}
              </h3>
              <p className="text-[11px] text-stone-300 font-sans leading-relaxed font-semibold">
                {step.description}
              </p>
              <div className="flex items-center gap-1.5 text-[8.5px] font-press text-[#55ff55] uppercase pt-1">
                <Trophy className="w-3.5 h-3.5 text-[#ffaa00]" />
                <span>BOUNTY REWARD: +{step.xpReward} XP</span>
              </div>
            </div>
          </div>

          {/* Tooltip bottom Controls row */}
          <div className="flex justify-between items-center mt-5 pt-3 border-t-2 border-stone-900">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0 || isNavigating}
              className="font-bold text-[9px] font-press px-3.5 py-2 bg-[#444] hover:bg-[#555] text-stone-300 border-2 border-black active:scale-95 disabled:opacity-30 disabled:pointer-events-none rounded-none cursor-pointer uppercase transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5 inline translate-y-[-1px]" /> Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={isNavigating}
              className="mc-btn px-4 py-2 text-[9px] uppercase font-bold text-[#ffff55] flex items-center gap-1 cursor-pointer active:scale-95"
            >
              {isNavigating ? (
                'LOADING...'
              ) : currentStep === tourSteps.length - 1 ? (
                <span className="text-[#55ff55] flex items-center gap-1 font-press animate-pulse">
                  FINISH ROAD <ArrowRight className="w-3 h-3 text-[#55ff55]" />
                </span>
              ) : (
                <span className="font-press flex items-center gap-1 text-[#ffff55]">
                  Next <ChevronRight className="w-3.5 h-3.5 inline" />
                </span>
              )}
            </button>
          </div>

          {/* Cumulative XP Counter */}
          {xpEarned > 0 && (
            <div className="mt-3.5 pt-2 border-t border-stone-800 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#55ff55]" />
              <span className="text-[9.5px] font-press text-[#55ff55] uppercase animate-pulse">
                Cumulative Loot Accumulated: +{xpEarned} XP!
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
