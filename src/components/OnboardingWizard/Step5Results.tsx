import React from 'react';
import { SubjectGrade, calculateAcademicProfile } from '../../utils/calculations';
import { CURRICULA_LIST } from '../../utils/curriculumData';
import { playClickSound } from '../../utils/sound';
import { Award, Star } from 'lucide-react';

interface Step5ResultsProps {
  selectedCurricula: string[];
  subjects: SubjectGrade[];
  onSubjectsChange: (subjects: SubjectGrade[]) => void;
}

export default function Step5Results({
  selectedCurricula,
  subjects,
  onSubjectsChange
}: Step5ResultsProps) {
  // Find grade list based on selected curricula
  const primaryCurriculum = CURRICULA_LIST.find((c) => selectedCurricula.includes(c.id)) || CURRICULA_LIST[0];
  const gradesList = primaryCurriculum.grades;

  const handleGradeChange = (idx: number, newGrade: string) => {
    playClickSound();
    const updated = [...subjects];
    updated[idx] = { ...updated[idx], grade: newGrade };
    onSubjectsChange(updated);
  };

  const calcResults = calculateAcademicProfile(subjects);

  return (
    <div className="space-y-4" id="wizard-step5">
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <Award className="w-5 h-5 text-[#ffaa00]" />
        <h4 className="font-press text-[9.5px] text-[#ffaa00] mc-text-shadow uppercase">
          5. Enter Academic Grades & Synthesize Ledger
        </h4>
      </div>
      <p className="font-mono text-stone-300 text-xs leading-relaxed">
        Record your performance grades. The Scribe will synthesize weighted GPAs and admissions competitiveness parameters.
      </p>

      {/* Subjects Grade Form */}
      <div className="space-y-2">
        <span className="text-stone-400 font-mono uppercase text-[9px] font-bold block">
          Assess Subject Performances:
        </span>
        <div className="max-h-[160px] overflow-y-auto space-y-2 border-2 border-black p-3 bg-black/40 scrollbar-thin">
          {subjects.length === 0 ? (
            <div className="text-center text-stone-500 font-mono text-xs py-6 uppercase">
              No subjects mapped. Please return to Step 4 and add subjects first!
            </div>
          ) : (
            subjects.map((sub, idx) => (
              <div 
                key={idx} 
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/25 p-2.5 border border-stone-850 gap-2 font-mono text-xs text-stone-350"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-stone-200 font-bold">📘 {sub.subject}</span>
                  <span className="text-[8.5px] bg-stone-800 px-1 py-0.5 uppercase text-stone-400 font-bold">
                    {sub.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-stone-400 font-bold">GRADE:</span>
                  <select
                    value={sub.grade}
                    onChange={(e) => handleGradeChange(idx, e.target.value)}
                    className="bg-[#141414] border border-stone-800 p-1.5 text-stone-100 outline-none font-bold text-xs"
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
      {subjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-stone-900 border-2 border-black p-3 text-center space-y-0.5">
            <span className="font-mono text-stone-400 uppercase text-[8.5px] font-bold block">Estimated GPA</span>
            <span className="font-press text-lg text-[#ffff55] mc-text-shadow block">
              {calcResults.estimatedGpa.toFixed(2)}
            </span>
            <span className="text-[9px] font-mono text-stone-500">Unweighted scale</span>
          </div>

          <div className="bg-stone-900 border-2 border-black p-3 text-center space-y-0.5">
            <span className="font-mono text-stone-400 uppercase text-[8.5px] font-bold block">Weighted GPA</span>
            <span className="font-press text-lg text-[#55ff55] mc-text-shadow block">
              {calcResults.weightedGpa.toFixed(2)}
            </span>
            <span className="text-[9px] font-mono text-stone-500">AP/IB (+1.0), Honors (+0.5)</span>
          </div>

          <div className="bg-stone-900 border-2 border-black p-3 text-center space-y-0.5">
            <span className="font-mono text-stone-400 uppercase text-[8.5px] font-bold block">Strength Tier</span>
            <span className="font-press text-[9.5px] text-cyan-400 mc-text-shadow block pt-1 uppercase">
              {calcResults.academicStrength}
            </span>
            <span className="text-[9px] font-mono text-stone-500">{calcResults.admissionReadiness}</span>
          </div>
        </div>
      )}
    </div>
  );
}
