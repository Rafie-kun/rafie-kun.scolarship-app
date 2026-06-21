import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { tourSteps } from '../services/tourService';

interface OnboardingTourProps {
  onComplete: (totalXP: number) => void;
  onSkip: () => void;
  onNavigateTab: (tabId: string) => void;
}

export default function OnboardingTour({ onComplete, onSkip, onNavigateTab }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [viewportRect, setViewportRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 300, left: 400 });
  
  // Spotlight position states (viewport relative)
  const [spotlightX, setSpotlightX] = useState(window.innerWidth / 2);
  const [spotlightY, setSpotlightY] = useState(window.innerHeight / 2);
  const [spotlightRadius, setSpotlightRadius] = useState(0);

  const [isNavigating, setIsNavigating] = useState(false);
  const [elementFound, setElementFound] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const step = tourSteps[currentStep];

  // Helper: Recalculate target element coordinates relative to current scroll/viewport
  const updatePositionCoordinates = useCallback(() => {
    if (!step.targetSelector) {
      setHighlightRect(null);
      setViewportRect(null);
      setElementFound(false);
      
      // Center the tooltip in viewport
      setTooltipPos({
        top: Math.max(100, window.innerHeight / 2 - 110),
        left: Math.max(16, window.innerWidth / 2 - 190)
      });
      
      // Clear spotlight area when there's no target step
      setSpotlightX(window.innerWidth / 2);
      setSpotlightY(window.innerHeight / 2);
      setSpotlightRadius(0);
      return;
    }

    const targetEl = document.querySelector(step.targetSelector);
    if (targetEl) {
      const clientRect = targetEl.getBoundingClientRect();
      const documentTop = clientRect.top + window.scrollY;
      const documentLeft = clientRect.left + window.scrollX;

      // Update highlighter coordinates (page relative)
      setHighlightRect({
        top: documentTop,
        left: documentLeft,
        width: clientRect.width,
        height: clientRect.height
      });

      // Update viewport coordinates for fixed tracking
      setViewportRect({
        top: clientRect.top,
        left: clientRect.left,
        width: clientRect.width,
        height: clientRect.height
      });

      // Update spotlight coordinates (relative to viewport)
      const centerX = clientRect.left + clientRect.width / 2;
      const centerY = clientRect.top + clientRect.height / 2;
      setSpotlightX(centerX);
      setSpotlightY(centerY);

      // Adjust spotlight hole radius depending on element dimension
      const maxSide = Math.max(clientRect.width, clientRect.height);
      setSpotlightRadius(Math.max(60, maxSide * 0.7 + 15));

      // Compute ideal tooltip fixed location relative to the target element's viewport rect
      const spaceBelow = window.innerHeight - clientRect.bottom;
      const spaceAbove = clientRect.top;

      let toolTop = clientRect.bottom + 16;
      let toolLeft = clientRect.left + clientRect.width / 2 - 190;

      if (spaceBelow < 280 && spaceAbove > 280) {
        // Place above target
        toolTop = Math.max(16, clientRect.top - 250);
      } else if (spaceBelow < 250 && spaceAbove < 250) {
        // Centered fallback at the side
        toolTop = Math.max(16, clientRect.top + clientRect.height / 2 - 110);
        toolLeft = Math.max(16, clientRect.left + clientRect.width + 24);
      }

      // Safeguard boundaries so tooltip doesn't bleed off the viewport margins (min 16px, max window.innerWidth - 410px)
      const maxLeft = Math.max(16, window.innerWidth - 410);
      const minLeft = 16;
      toolLeft = Math.max(minLeft, Math.min(toolLeft, maxLeft));

      const maxTop = Math.max(16, window.innerHeight - 280);
      toolTop = Math.max(16, Math.min(toolTop, maxTop));

      setTooltipPos({
        top: toolTop,
        left: toolLeft
      });
      setElementFound(true);
    } else {
      // Fallback centering if element isn't rendered or found yet
      setHighlightRect(null);
      setViewportRect(null);
      setElementFound(false);
      setTooltipPos({
        top: Math.max(100, window.innerHeight / 2 - 110),
        left: Math.max(16, window.innerWidth / 2 - 190)
      });
      setSpotlightX(window.innerWidth / 2);
      setSpotlightY(window.innerHeight / 2);
      setSpotlightRadius(0);
    }
  }, [step]);

  // Execute Step transitions cleanly
  const executeStep = useCallback(async (stepIndex: number) => {
    const s = tourSteps[stepIndex];
    setIsNavigating(true);
    setElementFound(false);

    // 1. Navigate to page
    if (s.page) {
      onNavigateTab(s.page);
      
      // Dispatch specific subtab hacks for a fully rendered layout (e.g. Profile Academics panel)
      if (s.id === 'education') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('profile-tab-academics'));
        }, 150);
      }
      
      // Wait for tab mounting & transition animation loops safely
      await new Promise(resolve => setTimeout(resolve, 650));
    }

    // 2. Poll & search for target element
    let targetEl: Element | null = null;
    let attempts = 0;
    const maxAttempts = 15;

    while (!targetEl && attempts < maxAttempts) {
      if (s.targetSelector) {
        targetEl = document.querySelector(s.targetSelector);
      }
      if (!targetEl) {
        await new Promise(resolve => setTimeout(resolve, 150));
        attempts++;
      }
    }

    // 3. Smooth scroll target element into viewport center
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // 4. Set accurate final positions
    updatePositionCoordinates();
    setIsNavigating(false);
  }, [onNavigateTab, updatePositionCoordinates]);

  // Handle active step updates
  useEffect(() => {
    executeStep(currentStep);
  }, [currentStep, executeStep]);

  // Real-time Event listeners for scrolling, resize & continuous window observation
  useEffect(() => {
    const handleUpdate = () => {
      if (!isNavigating) {
        updatePositionCoordinates();
      }
    };

    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    // Continuous frames check for animations and side-menus
    const animationFrameId = setInterval(handleUpdate, 120);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      clearInterval(animationFrameId);
    };
  }, [updatePositionCoordinates, isNavigating]);

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
      const prevStep = tourSteps[currentStep - 1];
      setXpEarned(prev => Math.max(0, prev - prevStep.xpReward));
      setCurrentStep(currentStep - 1);
    }
  };

  const hasTarget = step.targetSelector && elementFound && highlightRect;

  return (
    <div className="fixed inset-0 z-[9998] overflow-hidden pointer-events-none select-none">
      
      {/* 🎯 SPOTLIGHT BACKDROP OVERLAY with webkit-mask image */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-150"
        style={{
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
          maskImage: spotlightRadius > 0 
            ? `radial-gradient(circle ${spotlightRadius}px at ${spotlightX}px ${spotlightY}px, transparent 0%, transparent ${spotlightRadius - 8}px, black ${spotlightRadius}px, black 100%)`
            : 'none',
          WebkitMaskImage: spotlightRadius > 0 
            ? `radial-gradient(circle ${spotlightRadius}px at ${spotlightX}px ${spotlightY}px, transparent 0%, transparent ${spotlightRadius - 8}px, black ${spotlightRadius}px, black 100%)`
            : 'none',
          maskComposite: 'add',
        }}
      />

      {/* BLOCK INTERACTION OVER ANY BACKGROUND EXCEPT THE TOOLTIP (Transparent back-cover so click won't accidentally exit) */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9997 }} />

      {/* 🚀 FIXED BINDING HIGH-CONTRAST GOLD GLOW BORDER */}
      {hasTarget && viewportRect && (
        <div
          className="fixed pointer-events-none rounded-none border-4 transition-all duration-75"
          style={{
            top: viewportRect.top - 8,
            left: viewportRect.left - 8,
            width: viewportRect.width + 16,
            height: viewportRect.height + 16,
            borderColor: '#ffff55',
            boxShadow: '0 0 25px rgba(255,255,85,0.7), 0 0 50px rgba(255,255,85,0.4)',
            zIndex: 9999,
            animation: 'pulse-glow 2s infinite'
          }}
        />
      )}

      {/* Interactive Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className="fixed pointer-events-auto bg-[#2c2c2c] border-4 border-black p-5 w-[#90%] sm:w-[380px] rounded-none [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555,0_15px_40px_rgba(0,0,0,0.9)] text-stone-200"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 10000
          }}
        >
          {/* Skip Cross Close shortcut */}
          <button
            onClick={() => { playClickSound(); onSkip(); }}
            className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-150 cursor-pointer active:scale-90 transition-all"
            title="Skip Onboarding"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header step counter & dots */}
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-stone-800">
            <span className="font-press text-[8px] text-stone-400 tracking-wider">
              QUEST {currentStep + 1}/{tourSteps.length}
            </span>
            <div className="flex gap-1.5 ml-auto mr-6">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 transition-all ${
                    i === currentStep ? 'bg-[#ffff55] scale-125' :
                    i < currentStep ? 'bg-[#55ff55]' : 'bg-stone-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Minecraft aesthetic content block */}
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 p-1 bg-black/40 border-2 border-stone-850 h-12 w-12 flex items-center justify-center relative">
              <span className="text-2.5xl animate-bounce leading-none">
                {step.title.split(' ')[0] || '✨'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-press text-[9.5px] text-[#ffff55] uppercase leading-snug mc-text-shadow">
                {step.title.substring(step.title.indexOf(' ') + 1)}
              </h3>
              <p className="text-[11px] text-stone-300 font-sans leading-relaxed font-semibold mt-1">
                {step.description}
              </p>
              
              <div className="flex items-center gap-1.5 text-[8.5px] font-press text-[#55ff55] uppercase pt-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#ffaa00]" />
                <span>BOUNTY: +{step.xpReward} XP</span>
              </div>
            </div>
          </div>

          {/* Controls button actions layout */}
          <div className="flex justify-between items-center mt-5 pt-3.5 border-t-2 border-stone-900">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0 || isNavigating}
              className="font-bold text-[8.5px] font-press px-3 py-1.5 bg-[#444] hover:bg-[#525252] text-stone-300 border-2 border-black active:scale-95 disabled:opacity-20 disabled:pointer-events-none rounded-none cursor-pointer uppercase transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5 inline translate-y-[-1px]" /> Back
            </button>

            <button
              onClick={handleNext}
              disabled={isNavigating}
              className="mc-btn px-4 py-2 text-[8.5px] uppercase font-bold text-[#ffff55] flex items-center gap-1 cursor-pointer active:scale-95"
            >
              {isNavigating ? (
                'LOADING...'
              ) : currentStep === tourSteps.length - 1 ? (
                <span className="text-[#55ff55] flex items-center gap-1 font-press animate-pulse">
                  COMPLETE QUEST <ArrowRight className="w-3 h-3 text-[#55ff55]" />
                </span>
              ) : (
                <span className="font-press flex items-center gap-1 text-[#ffff55]">
                  Next <ChevronRight className="w-3.5 h-3.5 inline" />
                </span>
              )}
            </button>
          </div>

          {/* Live Progress XP Meter */}
          {xpEarned > 0 && (
            <div className="mt-3 pt-2.5 border-t border-stone-800/40 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#55ff55] animate-spin" />
              <span className="text-[9px] font-press text-[#55ff55] uppercase animate-pulse">
                Total Quest Yield: +{xpEarned} XP!
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
