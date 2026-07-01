import React from 'react';
import { EDUCATION_PATH_OPTIONS } from '../../utils/curriculumData';
import { playClickSound } from '../../utils/sound';
import { Compass } from 'lucide-react';

interface Step2HistoryProps {
  selectedPath: string;
  onPathChange: (path: string) => void;
  educationLevel: string;
  onEducationLevelChange: (level: string) => void;
}

export default function Step2History({
  selectedPath,
  onPathChange,
  educationLevel,
  onEducationLevelChange
}: Step2HistoryProps) {
  return (
    <div className="space-y-4" id="wizard-step2">
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <Compass className="w-5 h-5 text-[#ffaa00]" />
        <h4 className="font-press text-[9.5px] text-[#ffaa00] mc-text-shadow uppercase">
          2. Educational History & Milestones
        </h4>
      </div>
      <p className="font-mono text-stone-300 text-xs leading-relaxed">
        Map your position on the academic timeline. This ensures that admissions competitiveness indices and recommendations match your eligibility constraints.
      </p>

      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <span className="text-stone-400 uppercase text-[9px] font-bold block font-mono">
            Primary Education Milestone:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EDUCATION_PATH_OPTIONS.map((opt) => {
              const isSelected = selectedPath === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onPathChange(opt.id);
                  }}
                  className={`p-3 text-left border-2 text-stone-200 text-xs font-mono relative ${
                    isSelected 
                      ? 'border-[#ffff55] bg-yellow-500/10 font-bold' 
                      : 'border-black bg-stone-900/40 hover:border-stone-800'
                  }`}
                >
                  {opt.label}
                  {isSelected && (
                    <span className="absolute right-2 top-2.5 text-[#ffff55] font-extrabold">▶</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5 max-w-lg">
          <span className="text-stone-400 uppercase text-[9px] font-bold block font-mono">
            Standard Global Student Tier:
          </span>
          <select
            value={educationLevel}
            onChange={(e) => {
              playClickSound();
              onEducationLevelChange(e.target.value);
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
