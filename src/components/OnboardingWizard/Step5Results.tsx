import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { CURRICULA_LIST } from '../../utils/curriculumData';
import { playClickSound } from '../../utils/sound';
import { Award, Star, Sparkles, BookOpen, Check } from 'lucide-react';

interface Step5ResultsProps {
  onFinalSubmit?: () => void;
}

export default function Step5Results({ onFinalSubmit }: Step5ResultsProps) {
  const onboarding = useOnboarding();

  // Find grade list based on selected curricula
  const primaryCurriculum = CURRICULA_LIST.find((c) => onboarding.selectedCurricula.includes(c.id)) || CURRICULA_LIST[0];
  const gradesList = primaryCurriculum.grades;

  const handleGradeChange = (idx: number, newGrade: string) => {
    playClickSound();
    const updated = [...onboarding.subjects];
    updated[idx] = { ...updated[idx], grade: newGrade };
    onboarding.setSubjects(updated);
  };

  const gpa = onboarding.gpaResults.estimatedGpa;
  let competitiveness = "Low";
  let competitivenessColor = "text-red-500 border-red-500/20 bg-red-950/20";
  let advice = "Minimum GPA targets for prestigious global scholarships are usually around 3.2. We strongly recommend adding AP/IB/Honors course units or retaking core papers to lift your unweighted score.";

  if (gpa >= 3.6) {
    competitiveness = "High";
    competitivenessColor = "text-[#55ff55] border-green-500/20 bg-green-950/20";
    advice = "Outstanding standing! Your indices fully align with competitive admissions at top tier global institutions and competitive fully-funded grants. Ensure you secure strong recommendation letters!";
  } else if (gpa >= 3.0) {
    competitiveness = "Medium";
    competitivenessColor = "text-yellow-500 border-yellow-500/20 bg-yellow-950/20";
    advice = "Healthy standing! You are eligible for standard admission at many global partners. To elevate your competitiveness to high, consider taking advanced courses or raising your unweighted GPA to 3.7+.";
  }

  return (
    <div className="space-y-4" id="wizard-step5">
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <Award className="w-5 h-5 text-[#ffaa00]" />
        <h4 className="font-press text-[9.5px] text-[#ffaa00] mc-text-shadow uppercase">
          5. Enter Academic Grades & Synthesize Ledger
        </h4>
      </div>
      
      <p className="font-mono text-stone-300 text-xs leading-relaxed">
        Record your final or expected performance grades. The Scribe will synthesize unweighted/weighted GPAs and evaluate your admissions competitiveness ranking.
      </p>

      {/* Subjects Grade Form */}
      <div className="space-y-2 font-mono">
        <span className="text-stone-400 uppercase text-[9px] font-bold block">
          Assess Subject Performances:
        </span>
        <div className="max-h-[160px] overflow-y-auto space-y-2 border-2 border-black p-3 bg-black/40 scrollbar-thin">
          {onboarding.subjects.length === 0 ? (
            <div className="text-center text-stone-500 font-mono text-xs py-6 uppercase">
              No subjects mapped. Please return to Step 4 and add subjects first!
            </div>
          ) : (
            onboarding.subjects.map((sub, idx) => (
              <div 
                key={idx} 
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/25 p-2.5 border border-stone-850 gap-2 font-mono text-xs text-stone-300"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-stone-200 font-bold">📘 {sub.subject}</span>
                  <span className="text-[8.5px] bg-stone-900 border border-stone-800 px-1.5 py-0.5 uppercase text-stone-400 font-bold">
                    {sub.type}
                  </span>
                  {sub.path && (
                    <span className="text-[8px] text-stone-500 uppercase">({sub.path.substring(0, 15)}...)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-stone-400 font-bold">GRADE:</span>
                  <select
                    value={sub.grade}
                    onChange={(e) => handleGradeChange(idx, e.target.value)}
                    className="bg-[#141414] border border-stone-800 p-1.5 text-stone-100 outline-none font-bold text-xs cursor-pointer focus:border-[#ffff55]"
                  >
                    {gradesList.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Synthesized Live Calculations Output */}
      {onboarding.subjects.length > 0 && (
        <div className="space-y-4 pt-1 font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-900 border-2 border-black p-3 text-center space-y-0.5">
              <span className="text-stone-400 uppercase text-[8.5px] font-bold block">Estimated GPA</span>
              <span className="font-press text-lg text-[#ffff55] mc-text-shadow block">
                {gpa.toFixed(2)}
              </span>
              <span className="text-[9px] text-stone-500">Unweighted scale</span>
            </div>

            <div className="bg-stone-900 border-2 border-black p-3 text-center space-y-0.5">
              <span className="text-stone-400 uppercase text-[8.5px] font-bold block">Weighted GPA</span>
              <span className="font-press text-lg text-[#55ff55] mc-text-shadow block">
                {onboarding.gpaResults.weightedGpa.toFixed(2)}
              </span>
              <span className="text-[9px] text-stone-500">AP/IB (+1.0), Honors (+0.5)</span>
            </div>

            <div className="bg-stone-900 border-2 border-black p-3 text-center space-y-0.5">
              <span className="text-stone-400 uppercase text-[8.5px] font-bold block">Strength Tier</span>
              <span className="font-press text-[9.5px] text-cyan-400 mc-text-shadow block pt-1 uppercase">
                {onboarding.gpaResults.academicStrength}
              </span>
              <span className="text-[9px] text-stone-500">{onboarding.gpaResults.admissionReadiness}</span>
            </div>
          </div>

          {/* Competitiveness and Actionable Advice Box */}
          <div className={`border-2 p-4 flex flex-col md:flex-row gap-4 items-start ${competitivenessColor}`}>
            <div className="text-center md:border-r border-stone-800 pr-0 md:pr-4 flex flex-col justify-center items-center shrink-0 w-full md:w-32">
              <span className="text-stone-400 uppercase font-bold text-[8.5px] block mb-1">Admissions Standing:</span>
              <span className="font-press text-sm uppercase block tracking-wider mc-text-shadow">
                {competitiveness}
              </span>
            </div>
            
            <div className="flex-1 space-y-2">
              <strong className="text-stone-100 text-xs block flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-[#ffff55]" /> Actionable Academic Improvement Tips:
              </strong>
              <p className="text-stone-300 text-xs leading-relaxed">
                {advice}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Commit to Ledger Action Block */}
      <div className="pt-4 border-t-2 border-black flex flex-col sm:flex-row justify-between items-center gap-3 bg-black/35 p-4 mt-4">
        <div className="text-stone-300 font-mono text-xs space-y-0.5">
          <span className="font-bold text-[#ffff55] block">✨ Lock-in your Academic Standing</span>
          <span>Commit this profile to the ledger (+50 XP) to save records and unlock personalized loot matches!</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onFinalSubmit) {
              onFinalSubmit();
            } else {
              onboarding.setStep(6);
            }
          }}
          className="mc-btn font-press text-[9.5px] py-3 px-5 text-[#55ff55] border-2 border-green-500 flex items-center gap-2 shrink-0 cursor-pointer shadow-lg hover:scale-105 transition-all uppercase"
        >
          ⛏️ Commit to Ledger (+50 XP) <Check className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
