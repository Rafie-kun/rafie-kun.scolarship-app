import React, { useState } from 'react';
import { CURRICULA_LIST } from '../../utils/curriculumData';
import { playClickSound } from '../../utils/sound';
import { SubjectGrade } from '../../utils/calculations';
import { ListTodo, Plus, Trash2 } from 'lucide-react';

interface Step4SubjectsProps {
  selectedCurricula: string[];
  subjects: SubjectGrade[];
  onSubjectsChange: (subjects: SubjectGrade[]) => void;
}

export default function Step4Subjects({
  selectedCurricula,
  subjects,
  onSubjectsChange
}: Step4SubjectsProps) {
  const [subjectName, setSubjectName] = useState('');
  const [category, setCategory] = useState<'stem' | 'humanities' | 'languages' | 'arts'>('stem');
  const [courseType, setCourseType] = useState<'standard' | 'ap' | 'ib' | 'honors'>('standard');
  const [grade, setGrade] = useState('A');

  // Aggregate standard subjects from selected curricula
  const suggestedSubjects = CURRICULA_LIST
    .filter((c) => selectedCurricula.includes(c.id))
    .flatMap((c) => c.subjects);

  // Fallback to all if none selected
  const displaySuggestions = suggestedSubjects.length > 0 
    ? suggestedSubjects 
    : CURRICULA_LIST.flatMap((c) => c.subjects);

  // Unique suggestions
  const uniqueSuggestions = Array.from(new Set(displaySuggestions)).sort();

  // Pick first curriculum grades
  const primaryCurriculum = CURRICULA_LIST.find((c) => selectedCurricula.includes(c.id)) || CURRICULA_LIST[0];
  const gradesList = primaryCurriculum.grades;

  const handleAddSubject = () => {
    if (!subjectName.trim()) return;
    playClickSound();

    // Check if courseType matches the curriculum
    let matchedType = courseType;
    if (primaryCurriculum.id === 'ib') matchedType = 'ib';
    if (primaryCurriculum.id === 'ap') matchedType = 'ap';

    onSubjectsChange([
      ...subjects,
      {
        subject: subjectName.trim(),
        category,
        type: matchedType,
        grade
      }
    ]);

    setSubjectName('');
  };

  const handleRemoveSubject = (idx: number) => {
    playClickSound();
    onSubjectsChange(subjects.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4" id="wizard-step4">
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <ListTodo className="w-5 h-5 text-[#ffaa00]" />
        <h4 className="font-press text-[9.5px] text-[#ffaa00] mc-text-shadow uppercase">
          4. Map Out Current Course Load
        </h4>
      </div>
      <p className="font-mono text-stone-300 text-xs leading-relaxed">
        Populate your active courses. Select standard courses from the auto-loader or type custom course labels.
      </p>

      {/* Add Subject Builder */}
      <div className="bg-black/35 border-2 border-black p-4 space-y-3 font-mono text-xs text-stone-200">
        <span className="text-stone-400 uppercase text-[9px] font-bold block mb-1">
          Add Subject Entry:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 flex flex-col gap-1.5">
            <span className="text-stone-400 text-[8px] uppercase font-bold">Course Title:</span>
            <input
              type="text"
              list="subject-suggestions"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g., AP Chemistry or Linear Algebra"
              className="bg-[#141414] border border-stone-800 p-2.5 text-stone-200 outline-none w-full text-xs"
            />
            <datalist id="subject-suggestions">
              {uniqueSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-3 flex flex-col gap-1.5">
            <span className="text-stone-400 text-[8px] uppercase font-bold">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-[#141414] border border-stone-800 p-2.5 text-stone-200 outline-none w-full text-xs"
            >
              <option value="stem">STEM / Math</option>
              <option value="humanities">Humanities</option>
              <option value="languages">Languages / Speech</option>
              <option value="arts">Arts / Creative</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-stone-400 text-[8px] uppercase font-bold">Weight Level:</span>
            <select
              value={courseType}
              onChange={(e) => setCourseType(e.target.value as any)}
              className="bg-[#141414] border border-stone-800 p-2.5 text-stone-200 outline-none w-full text-xs"
            >
              <option value="standard">Standard</option>
              <option value="honors">Honors (+0.5)</option>
              <option value="ap">AP Level (+1.0)</option>
              <option value="ib">IB Level (+1.0)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddSubject}
              className="mc-btn py-2 px-3 text-[10px] w-full h-10 flex items-center justify-center font-press text-[#55ff55]"
            >
              <Plus className="w-4 h-4 mr-1 shrink-0" /> ADD
            </button>
          </div>
        </div>
      </div>

      {/* Added Subjects Ledger */}
      <div className="space-y-2">
        <span className="text-stone-400 font-mono uppercase text-[9px] font-bold block">
          Current Course List ({subjects.length}):
        </span>
        <div className="max-h-[180px] overflow-y-auto space-y-2 border-2 border-black p-3 bg-black/40 scrollbar-thin">
          {subjects.length === 0 ? (
            <div className="text-center text-stone-500 font-mono text-xs py-6 uppercase">
              No courses mapped yet. Add courses above to begin calculations.
            </div>
          ) : (
            subjects.map((sub, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center bg-black/25 p-2.5 border border-stone-850 font-mono text-xs text-stone-300"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#ffff55] font-bold">📘 {sub.subject}</span>
                  <span className="text-[9px] bg-stone-800 px-1.5 py-0.5 uppercase text-stone-400 font-bold">
                    {sub.type}
                  </span>
                  <span className="text-[9px] text-stone-500 uppercase">({sub.category})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(idx)}
                  className="text-red-500 hover:text-red-400 cursor-pointer active:scale-90"
                  title="Remove Subject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
