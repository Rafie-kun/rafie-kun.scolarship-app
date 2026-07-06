import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../../utils/sound';
import { dispatchProfileUpdate } from '../../utils/events';
import { OnboardingProvider, useOnboarding } from '../../context/OnboardingContext';

// Step components
import Step1Curricula from './Step1Curricula';
import Step2History from './Step2History';
import Step3Institution from './Step3Institution';
import Step4Subjects from './Step4Subjects';
import Step5Results from './Step5Results';
import Step6BudgetPreview from './Step6BudgetPreview';
import Step7JobsPreview from './Step7JobsPreview';

// Enhanced layout features
import EnhancedWizardProgress from './EnhancedWizardProgress';
import OnboardingAIAssistant from './OnboardingAIAssistant';

interface WizardContainerProps {
  onComplete: () => void;
}

function WizardContent({ onComplete }: { onComplete: () => void }) {
  const { profile, updateProfile, rewardPoints, authorizedFetch } = useAuth();
  const onboarding = useOnboarding();

  const handleNext = () => {
    playClickSound();
    onboarding.setStep((prev) => Math.min(7, prev + 1));
  };

  const handleBack = () => {
    playClickSound();
    onboarding.setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = async () => {
    playAdvancementSound();
    try {
      const updatedData = {
        hasCompletedOnboarding: true,
        onboardingCompleted: true,
        educationLevel: onboarding.educationLevel,
        graduationYear: Number(onboarding.graduationYear) || 2026,
        highSchoolName: onboarding.educationLevel === 'high_school' ? onboarding.institutionName : undefined,
        collegeName: onboarding.educationLevel !== 'high_school' ? onboarding.institutionName : undefined,
        universityName: onboarding.institutionName || profile?.universityName,
        gpa: onboarding.gpaResults?.estimatedGpa || profile?.gpa || 3.0,
        maxGpa: 4.0,
        country: onboarding.targetCountry || profile?.country || 'Worldwide',
        nationality: onboarding.country || profile?.nationality || 'Global Explorer',
        intendedMajor: onboarding.subjects[0]?.subject || profile?.intendedMajor || 'Computer Science',
        primaryMajor: onboarding.subjects[0]?.subject || profile?.primaryMajor || 'Computer Science'
      };

      if (updateProfile) {
        await updateProfile(updatedData);
      }

      if (authorizedFetch) {
        try {
          await authorizedFetch('/api/academic/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
          });
        } catch (err) {
          console.warn("Direct POST to /api/academic/profile fallback:", err);
        }
      }

      // Save in local storage
      localStorage.setItem(`scholarpath_subjects_${profile?.fullName || 'guest'}`, JSON.stringify(onboarding.subjects || []));
      localStorage.setItem(`scholarpath_onboarding_completed_${profile?.fullName || 'guest'}`, 'true');

      // Trigger XP Particle Celebration Event
      window.dispatchEvent(new CustomEvent('scholarpath-milestone-achieved'));

      // Award XP bounty (+50 XP)
      if (rewardPoints) {
        await rewardPoints(50, 'Completed Academic Profile Onboarding', 'Onboarding Legend');
      } else if (authorizedFetch) {
        try {
          const resReward = await authorizedFetch('/api/profile/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              points: 50,
              actionName: 'Completed Academic Profile Onboarding',
              badgeToUnlock: 'Onboarding Legend'
            })
          });
          const fresh = await resReward.json();
          dispatchProfileUpdate(fresh);
        } catch (err) {
          console.error("Reward call error:", err);
        }
      }

      onComplete();
    } catch (e) {
      console.error("Failed to complete academic onboarding wizard:", e);
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mc-window bg-[#322d29] border-4 border-black p-6 font-mono text-stone-200 [box-shadow:inset_-4px_-4px_0_#1a1918,inset_4px_4px_0_#555] space-y-6"
      id="comprehensive-academic-wizard"
    >
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black pb-4 gap-4">
        <div className="space-y-1">
          <h3 className="font-press text-[11px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
            <GraduationCap className="w-5 h-5 animate-bounce text-[#ffff55]" /> Comprehensive Academic Scribe
          </h3>
          <p className="text-stone-300 text-xs leading-normal font-mono">
            Configure your curriculum, paths, academic standing, and forecast live budget & wage ledgers.
          </p>
        </div>
      </div>

      {/* Enhanced Progress Indicator Nodes */}
      <EnhancedWizardProgress 
        currentStep={onboarding.step} 
        onStepClick={(s) => onboarding.setStep(s)} 
      />

      {/* Main Form Area */}
      <div className="min-h-[380px] bg-black/25 border-2 border-black p-5 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={onboarding.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            {onboarding.step === 1 && <Step1Curricula />}
            {onboarding.step === 2 && <Step2History />}
            {onboarding.step === 3 && <Step3Institution />}
            {onboarding.step === 4 && <Step4Subjects />}
            {onboarding.step === 5 && <Step5Results onFinalSubmit={handleFinalSubmit} />}
            {onboarding.step === 6 && <Step6BudgetPreview />}
            {onboarding.step === 7 && <Step7JobsPreview />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-3 border-t-2 border-black">
        <button
          type="button"
          onClick={handleBack}
          disabled={onboarding.step === 1}
          className="font-press text-[9px] py-3 px-5 bg-[#444] hover:bg-[#525252] text-stone-300 border-2 border-black disabled:opacity-25 cursor-pointer disabled:pointer-events-none active:scale-95 transition-all uppercase flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" /> Back
        </button>

        {onboarding.step < 7 ? (
          <button
            type="button"
            onClick={handleNext}
            className="mc-btn font-press text-[9px] py-3 px-5 text-[#ffff55] flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="mc-btn font-press text-[9px] py-3 px-6 text-[#55ff55] border-2 border-green-500 flex items-center gap-2 animate-bounce cursor-pointer"
          >
            ⛏️ Commit to Ledger (+50 XP) <Check className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>

      {/* Floating Interactive AI Guidance Assistant corner widget */}
      <OnboardingAIAssistant />

    </motion.div>
  );
}

export default function WizardContainer({ onComplete }: WizardContainerProps) {
  return (
    <OnboardingProvider>
      <WizardContent onComplete={onComplete} />
    </OnboardingProvider>
  );
}
