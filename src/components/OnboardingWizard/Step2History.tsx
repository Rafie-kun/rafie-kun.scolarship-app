import React from 'react';
import { EDUCATION_PATH_OPTIONS } from '../../utils/curriculumData';
import { useOnboarding } from '../../context/OnboardingContext';
import { playClickSound } from '../../utils/sound';
import { Compass, Check } from 'lucide-react';

export default function Step2History() {
  const onboarding = useOnboarding();

  const handleTogglePath = (pathId: string) => {
    playClickSound();
    
    // Toggle path selection in selectedPaths
    if (onboarding.selectedPaths.includes(pathId)) {
      if (onboarding.selectedPaths.length > 1) {
        onboarding.setSelectedPaths(onboarding.selectedPaths.filter(p => p !== pathId));
      }
    } else {
      onboarding.setSelectedPaths([...onboarding.selectedPaths, pathId]);
    }
  };

  return (
    <div className="space-y-4" id="wizard-step2">
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <Compass className="w-5 h-5 text-[#ffaa00]" />
        <h4 className="font-press text-[9.5px] text-[#ffaa00] mc-text-shadow uppercase">
          2. Educational History & Milestones
        </h4>
      </div>
      
      <p className="font-mono text-stone-300 text-xs leading-relaxed">
        Select **one or more** academic paths that represent your active and previous educational milestones. You will be able to enter distinct subjects and grade books for each choice.
      </p>

      <div className="space-y-4 pt-2 font-mono">
        <div className="space-y-2">
          <span className="text-stone-400 uppercase text-[9px] font-bold block">
            Select Academic Path Modules (Check all that apply):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EDUCATION_PATH_OPTIONS.map((opt) => {
              const isSelected = onboarding.selectedPaths.includes(opt.label);
              
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleTogglePath(opt.label)}
                  className={`p-3 text-left border-2 text-stone-200 text-xs relative flex items-start gap-2 ${
                    isSelected 
                      ? 'border-[#ffff55] bg-yellow-500/10 font-bold' 
                      : 'border-black bg-stone-900/40 hover:border-stone-850'
                  }`}
                >
                  <div className={`w-4 h-4 border border-black shrink-0 mt-0.5 flex items-center justify-center ${
                    isSelected ? 'bg-[#ffff55] text-black' : 'bg-black/30'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-[11px]">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5 max-w-lg">
          <span className="text-stone-400 uppercase text-[9px] font-bold block">
            Standard Global Student Tier:
          </span>
          <select
            value={onboarding.educationLevel}
            onChange={(e) => {
              playClickSound();
              onboarding.setEducationLevel(e.target.value);
            }}
            className="bg-[#141414] border-2 border-black p-3 text-stone-200 text-xs outline-none w-full font-mono"
          >
            <option value="high_school">High School (Grade 9 - 12)</option>
            <option value="undergraduate">Undergraduate Scholar (B.Sc / B.A)</option>
            <option value="graduate">Postgraduate (Master's / MBA)</option>
            <option value="phd">Doctorate / PhD Researcher</option>
          </select>
        </div>
      </div>
    </div>
  );
}
