import React from 'react';
import { WORLD_COUNTRIES } from '../../utils/curriculumData';
import { useOnboarding } from '../../context/OnboardingContext';
import { School, MapPin, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Step3Institution() {
  const onboarding = useOnboarding();
  const { convertAmount } = useTheme();

  return (
    <div className="space-y-4" id="wizard-step3">
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <School className="w-5 h-5 text-[#ffaa00]" />
        <h4 className="font-press text-[9.5px] text-[#ffaa00] mc-text-shadow uppercase">
          3. Institution Coordinates
        </h4>
      </div>
      
      <p className="font-mono text-stone-300 text-xs leading-relaxed">
        Enter details about your active or most recent educational institution, and where you hope to study.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-stone-400 uppercase text-[9px] font-bold block">
            School / University Name:
          </span>
          <div className="relative">
            <input
              type="text"
              value={onboarding.institutionName}
              onChange={(e) => onboarding.setInstitutionName(e.target.value)}
              placeholder="e.g., Maplewood Collegiate or Imperial Tech"
              className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none w-full focus:border-[#ffff55] text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-stone-400 uppercase text-[9px] font-bold block">
            Institution Country:
          </span>
          <select
            value={onboarding.country}
            onChange={(e) => onboarding.setCountry(e.target.value)}
            className="bg-[#141414] border-2 border-black p-3 text-stone-200 text-xs outline-none w-full"
          >
            {WORLD_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="Other">Other / Not Listed</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-stone-400 uppercase text-[9px] font-bold block">
            City:
          </span>
          <input
            type="text"
            value={onboarding.city}
            onChange={(e) => onboarding.setCity(e.target.value)}
            placeholder="e.g., Boston"
            className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none w-full focus:border-[#ffff55] text-xs"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-stone-400 uppercase text-[9px] font-bold block">
            Target Destination Country:
          </span>
          <select
            value={onboarding.targetCountry}
            onChange={(e) => onboarding.setTargetCountry(e.target.value)}
            className="bg-[#141414] border-2 border-black p-3 text-stone-200 text-xs outline-none w-full"
          >
            {WORLD_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-stone-400 uppercase text-[9px] font-bold block">
            Expected Graduation Year:
          </span>
          <input
            type="number"
            value={onboarding.graduationYear}
            min={2020}
            max={2035}
            onChange={(e) => onboarding.setGraduationYear(Number(e.target.value))}
            className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none w-full focus:border-[#ffff55] text-xs"
          />
        </div>
      </div>

      {/* Dynamic University Recommendations inside Step 3 */}
      <div className="mt-4 pt-3 border-t border-stone-850 font-mono">
        <span className="text-[#ffff55] font-press text-[8.5px] uppercase block mb-2 mc-text-shadow flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#ffff55] animate-pulse" /> Smart Recommendations for {onboarding.targetCountry}
        </span>
        
        {onboarding.recommendedTargetUnis.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {onboarding.recommendedTargetUnis.map((uni) => (
              <div 
                key={uni.id} 
                className="bg-black/35 border border-stone-800 p-2.5 space-y-1.5 text-[10.5px] hover:border-[#ffff55] transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-stone-200 truncate block max-w-[80%]">{uni.name}</span>
                  <span className="text-[9px] text-[#ffaa00] font-bold">#{uni.ranking}</span>
                </div>
                <div className="text-stone-400 text-[9.5px]">
                  <span>Avg Tuition: </span>
                  <span className="text-stone-300 font-semibold">{convertAmount(uni.tuitionMin)} - {convertAmount(uni.tuitionMax)} / yr</span>
                </div>
                <div className="text-stone-400 text-[9.5px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-500" /> {uni.city}, {uni.country}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 text-[10.5px] italic">
            Configuring recommendations indices... Selected destination country does not have listed partners yet. Proceed to configure subject matrices.
          </p>
        )}
      </div>

    </div>
  );
}
