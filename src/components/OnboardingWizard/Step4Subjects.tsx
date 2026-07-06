import React, { useState } from 'react';
import { CURRICULA_LIST } from '../../utils/curriculumData';
import { useOnboarding } from '../../context/OnboardingContext';
import { playClickSound } from '../../utils/sound';
import { ListTodo, Plus, Trash2, GraduationCap } from 'lucide-react';

export default function Step4Subjects() {
  const onboarding = useOnboarding();
  
  const [subjectName, setSubjectName] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [category, setCategory] = useState<'stem' | 'humanities' | 'languages' | 'arts'>('stem');
  const [courseType, setCourseType] = useState<'standard' | 'ap' | 'ib' | 'honors'>('standard');
  const [grade, setGrade] = useState('A');
  const [selectedPathForSubject, setSelectedPathForSubject] = useState(
    onboarding.selectedPaths[0] || 'Full K-12 Route'
  );

  // Synchronize path selector if state is blank
  React.useEffect(() => {
    if (onboarding.selectedPaths.length > 0 && !onboarding.selectedPaths.includes(selectedPathForSubject)) {
      setSelectedPathForSubject(onboarding.selectedPaths[0]);
    }
  }, [onboarding.selectedPaths, selectedPathForSubject]);

  // Aggregate standard subjects from selected curricula
  const suggestedSubjects = CURRICULA_LIST
    .filter((c) => onboarding.selectedCurricula.includes(c.id))
    .flatMap((c) => c.subjects);

  const displaySuggestions = suggestedSubjects.length > 0 
    ? suggestedSubjects 
    : CURRICULA_LIST.flatMap((c) => c.subjects);

  const uniqueSuggestions = Array.from(new Set(displaySuggestions)).sort();

  const filteredSuggestions = uniqueSuggestions.filter((s) =>
    s.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const primaryCurriculum = CURRICULA_LIST.find((c) => onboarding.selectedCurricula.includes(c.id)) || CURRICULA_LIST[0];
  const gradesList = primaryCurriculum.grades;

  const handleAddSubject = () => {
    if (!subjectName.trim()) return;
    playClickSound();

    let matchedType = courseType;
    if (primaryCurriculum.id === 'ib') matchedType = 'ib';
    if (primaryCurriculum.id === 'ap') matchedType = 'ap';

    onboarding.setSubjects([
      ...onboarding.subjects,
      {
        subject: subjectName.trim(),
        category,
        type: matchedType,
        grade,
        path: selectedPathForSubject
      }
    ]);

    setSubjectName('');
  };

  const handleRemoveSubject = (idx: number) => {
    playClickSound();
    onboarding.setSubjects(onboarding.subjects.filter((_, i) => i !== idx));
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
        Populate your course logs. Select standard courses from the loader, select the corresponding academic path, and record your expected final grades.
      </p>

      {/* Search & Quick Pick Subject Bank */}
      <div className="bg-[#1e1c1b] border-2 border-black p-3 space-y-2 font-mono text-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-stone-300 uppercase text-[9px] font-bold flex items-center gap-1.5">
            🔍 Quick Course Search & Select Filter:
          </span>
          <input
            type="text"
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
            placeholder="Search curriculum subjects (e.g. Physics, Calculus)..."
            className="bg-[#141414] border border-stone-700 px-2.5 py-1 text-stone-200 text-xs outline-none w-full sm:w-64"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-black/40 border border-stone-800">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  playClickSound();
                  setSubjectName(s);
                }}
                className={`text-[10px] px-2 py-0.5 border cursor-pointer transition-all ${
                  subjectName === s
                    ? 'bg-[#ffff55] text-black font-bold border-[#ffff55]'
                    : 'bg-[#141414] text-stone-300 border-stone-700 hover:border-[#ffff55]'
                }`}
              >
                + {s}
              </button>
            ))
          ) : (
            <span className="text-stone-500 text-[10px] italic py-1">No subjects matching "{subjectSearch}"</span>
          )}
        </div>
      </div>

      {/* Add Subject Builder */}
      <div className="bg-black/35 border-2 border-black p-4 space-y-4 font-mono text-xs text-stone-200">
        <span className="text-stone-400 uppercase text-[9px] font-bold block pb-1 border-b border-stone-850">
          ⛏️ Record Subject Entry
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Path selection */}
          <div className="sm:col-span-4 flex flex-col gap-1.5">
            <span className="text-stone-400 text-[8px] uppercase font-bold">Academic Path / Level:</span>
            <select
              value={selectedPathForSubject}
              onChange={(e) => setSelectedPathForSubject(e.target.value)}
              className="bg-[#141414] border border-stone-850 p-2.5 text-stone-200 outline-none w-full text-xs"
            >
              {onboarding.selectedPaths.map((pathOption, idx) => (
                <option key={idx} value={pathOption}>{pathOption}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 flex flex-col gap-1.5">
            <span className="text-stone-400 text-[8px] uppercase font-bold">Course Title:</span>
            <input
              type="text"
              list="subject-suggestions"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g., Mathematics, AP Chemistry, Physics"
              className="bg-[#141414] border border-stone-850 p-2.5 text-stone-200 outline-none w-full text-xs"
            />
            <datalist id="subject-suggestions">
              {uniqueSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-stone-400 text-[8px] uppercase font-bold">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-[#141414] border border-stone-850 p-2.5 text-stone-200 outline-none w-full text-xs"
            >
              <option value="stem">STEM / Math</option>
              <option value="humanities">Humanities</option>
              <option value="languages">Languages / Speech</option>
              <option value="arts">Arts / Creative</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-stone-400 text-[8px] uppercase font-bold">Grade Level:</span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="bg-[#141414] border border-stone-850 p-2.5 text-stone-200 outline-none w-full text-xs"
            >
              {gradesList.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-stone-400 text-[8px] uppercase font-bold">Course Weight:</span>
            <select
              value={courseType}
              onChange={(e) => setCourseType(e.target.value as any)}
              className="bg-[#141414] border border-stone-850 p-2.5 text-stone-200 outline-none w-full text-xs"
            >
              <option value="standard">Standard</option>
              <option value="honors">Honors (+0.5)</option>
              <option value="ap">AP Level (+1.0)</option>
              <option value="ib">IB Level (+1.0)</option>
            </select>
          </div>

          <div className="sm:col-span-10">
            <button
              type="button"
              onClick={handleAddSubject}
              className="mc-btn py-2 px-3 text-[10px] w-full h-10 flex items-center justify-center font-press text-[#55ff55]"
            >
              <Plus className="w-4 h-4 mr-1 shrink-0" /> ADD SUBJECT
            </button>
          </div>
        </div>
      </div>

      {/* Added Subjects Ledger grouped by selected Paths */}
      <div className="space-y-4">
        {onboarding.selectedPaths.map((pathName, pathIdx) => {
          const pathSubjects = onboarding.subjects.filter(s => s.path === pathName);

          return (
            <div key={pathIdx} className="space-y-1.5 font-mono">
              <span className="text-[#ffff55] uppercase text-[9.5px] font-bold block flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#ffff55]" /> {pathName}
              </span>
              
              <div className="border-2 border-black p-3 bg-black/45 space-y-2">
                {pathSubjects.length === 0 ? (
                  <div className="text-stone-500 text-[10.5px] italic py-3 text-center uppercase">
                    No subjects recorded under this academic path.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pathSubjects.map((sub) => {
                      // Find real index in parent list to delete correctly
                      const originalIdx = onboarding.subjects.findIndex(
                        s => s.subject === sub.subject && s.path === sub.path && s.grade === sub.grade
                      );

                      return (
                        <div 
                          key={originalIdx} 
                          className="flex justify-between items-center bg-[#25211e] p-2 border border-stone-800 text-[11px] text-stone-300"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-stone-100 font-bold truncate">📘 {sub.subject}</span>
                            <span className="bg-black/40 border border-stone-900 text-[#55ff55] font-bold px-1.5 py-0.2 shrink-0">
                              {sub.grade}
                            </span>
                            <span className="text-[8px] bg-stone-900 px-1 py-0.2 uppercase text-stone-500 rounded-none shrink-0">
                              {sub.type}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(originalIdx)}
                            className="text-red-500 hover:text-red-400 cursor-pointer active:scale-90 shrink-0 ml-1.5"
                            title="Remove Subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
