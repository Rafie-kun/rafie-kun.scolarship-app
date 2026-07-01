import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, ChevronRight, ChevronLeft, Check, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../../utils/sound';
import { dispatchProfileUpdate } from '../../utils/events';
import { SubjectGrade, calculateAcademicProfile } from '../../utils/calculations';

// Step components
import Step1Curricula from './Step1Curricula';
import Step2History from './Step2History';
import Step3Institution from './Step3Institution';
import Step4Subjects from './Step4Subjects';
import Step5Results from './Step5Results';

interface WizardContainerProps {
  onComplete: () => void;
}

export default function WizardContainer({ onComplete }: WizardContainerProps) {
  const { profile, updateProfile, rewardPoints } = useAuth();
  const [step, setStep] = useState(1);

  // Form states across steps
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>(['cambridge']);
  const [selectedPath, setSelectedPath] = useState('full_k12');
  const [educationLevel, setEducationLevel] = useState('high_school');
  const [institutionName, setInstitutionName] = useState('');
  const [country, setCountry] = useState('United States');
  const [city, setCity] = useState('');
  const [targetCountry, setTargetCountry] = useState('United States');
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear() + 2);
  const [subjects, setSubjects] = useState<SubjectGrade[]>([
    { subject: 'Mathematics', grade: 'A', type: 'standard', category: 'stem' },
    { subject: 'Physics', grade: 'A', type: 'standard', category: 'stem' },
    { subject: 'English Language', grade: 'B', type: 'standard', category: 'languages' }
  ]);

  const handleNext = () => {
    playClickSound();
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    playClickSound();
    setStep((prev) => Math.max(1, prev - 1));
  };

  const calcResults = calculateAcademicProfile(subjects);

  const handleFinalSubmit = async () => {
    playAdvancementSound();
    try {
      const updatedData = {
        hasCompletedOnboarding: true,
        educationLevel,
        graduationYear: Number(graduationYear),
        highSchoolName: educationLevel === 'high_school' ? institutionName : undefined,
        collegeName: educationLevel !== 'high_school' ? institutionName : undefined,
        gpa: calcResults.estimatedGpa,
        maxGpa: 4.0,
        country: targetCountry,
        nationality: country,
        intendedMajor: subjects[0]?.subject || 'Undecided',
        portfolioDescription: `Completed subjects in ${selectedCurricula.join(', ')}: ${subjects.map(s => `${s.subject} (${s.grade})`).join(', ')}`
      };

      if (updateProfile) {
        await updateProfile(updatedData);
      }

      // Save full subject payload in local storage for performance matrix
      localStorage.setItem(`scholarpath_subjects_${profile?.fullName || 'guest'}`, JSON.stringify(subjects));

      // Award XP bounty (50 XP)
      if (rewardPoints) {
        const freshProfile = await rewardPoints(50, 'Completed Comprehensive Academic Onboarding Wizard', 'Onboarding Legend');
        dispatchProfileUpdate(freshProfile);
      }

      onComplete();
    } catch (e) {
      console.error("Failed to complete academic onboarding wizard:", e);
    }
  };

  return (
    <div className="mc-window bg-[#322d29] border-4 border-black p-6 font-mono text-stone-200 [box-shadow:inset_-4px_-4px_0_#1a1918,inset_4px_4px_0_#555] space-y-6" id="comprehensive-academic-wizard">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black pb-4 gap-4">
        <div className="space-y-1">
          <h3 className="font-press text-[11px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
            <GraduationCap className="w-5 h-5 animate-bounce text-[#ffff55]" /> Comprehensive Academic Scribe
          </h3>
          <p className="text-stone-300 text-xs leading-normal">
            Configure your curriculum, records, history pathways, and active GPA matrix.
          </p>
        </div>
        
        {/* Progress Dots */}
        <div className="flex items-center gap-2 bg-black/40 border-2 border-black p-2 shrink-0">
          <span className="font-press text-[8px] text-stone-400 mr-1.5">STEP {step}/5</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`w-4 h-4 border border-black flex items-center justify-center font-press text-[8px] ${
                  s === step ? 'bg-[#ffff55] text-black font-extrabold scale-110' :
                  s < step ? 'bg-[#55ff55] text-black font-bold' : 'bg-[#141414] text-stone-500'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="min-h-[350px] bg-black/25 border-2 border-black p-5 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            {step === 1 && (
              <Step1Curricula 
                selectedCurricula={selectedCurricula} 
                onChange={setSelectedCurricula} 
              />
            )}
            {step === 2 && (
              <Step2History 
                selectedPath={selectedPath} 
                onPathChange={setSelectedPath} 
                educationLevel={educationLevel}
                onEducationLevelChange={setEducationLevel}
              />
            )}
            {step === 3 && (
              <Step3Institution 
                institutionName={institutionName}
                onInstitutionNameChange={setInstitutionName}
                country={country}
                onCountryChange={setCountry}
                city={city}
                onCityChange={setCity}
                graduationYear={graduationYear}
                onGraduationYearChange={setGraduationYear}
                targetCountry={targetCountry}
                onTargetCountryChange={setTargetCountry}
              />
            )}
            {step === 4 && (
              <Step4Subjects 
                selectedCurricula={selectedCurricula}
                subjects={subjects}
                onSubjectsChange={setSubjects}
              />
            )}
            {step === 5 && (
              <Step5Results 
                selectedCurricula={selectedCurricula}
                subjects={subjects}
                onSubjectsChange={setSubjects}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-3 border-t-2 border-black">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className="font-press text-[9px] py-3 px-5 bg-[#444] hover:bg-[#525252] text-stone-300 border-2 border-black disabled:opacity-25 cursor-pointer disabled:pointer-events-none active:scale-95 transition-all uppercase flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" /> Back
        </button>

        {step < 5 ? (
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

    </div>
  );
}
