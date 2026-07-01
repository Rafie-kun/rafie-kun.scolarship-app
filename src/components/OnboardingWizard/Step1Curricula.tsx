import React from 'react';
import { CURRICULA_LIST, Curriculum } from '../../utils/curriculumData';
import { playClickSound } from '../../utils/sound';
import { BookOpen } from 'lucide-react';

interface Step1CurriculaProps {
  selectedCurricula: string[];
  onChange: (curricula: string[]) => void;
}

export default function Step1Curricula({ selectedCurricula, onChange }: Step1CurriculaProps) {
  const handleToggle = (id: string) => {
    playClickSound();
    if (selectedCurricula.includes(id)) {
      // Keep at least one selected
      if (selectedCurricula.length > 1) {
        onChange(selectedCurricula.filter(c => c !== id));
      }
    } else {
      onChange([...selectedCurricula, id]);
    }
  };

  return (
    <div className="space-y-4" id="wizard-step1">
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <BookOpen className="w-5 h-5 text-[#ffaa00]" />
        <h4 className="font-press text-[9.5px] text-[#ffaa00] mc-text-shadow uppercase">
          1. Select Curriculum Standards
        </h4>
      </div>
      <p className="font-mono text-stone-300 text-xs leading-relaxed">
        Choose one or more education frameworks that you have taken or are currently enrolled in. This calibrates our grading matrix models.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {CURRICULA_LIST.map((cur) => {
          const isSelected = selectedCurricula.includes(cur.id);
          return (
            <button
              key={cur.id}
              type="button"
              onClick={() => handleToggle(cur.id)}
              className={`p-4 border-4 text-left transition-all relative ${
                isSelected 
                  ? 'border-[#ffff55] bg-yellow-500/10' 
                  : 'border-black bg-stone-900/45 hover:border-stone-800'
              }`}
            >
              <div className="space-y-1.5">
                <span className="font-press text-[8.5px] text-stone-100 block tracking-wide">
                  {cur.name}
                </span>
                <p className="text-stone-400 font-mono text-[11px] leading-relaxed">
                  {cur.description}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#ffff55] border-2 border-black flex items-center justify-center text-black font-extrabold text-[9px] select-none">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
