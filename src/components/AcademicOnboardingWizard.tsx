import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, ChevronRight, ChevronLeft, Plus, Trash2, Award, Sparkles, 
  GraduationCap, School, Calculator, Check, ListTodo, Star, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { dispatchProfileUpdate } from '../utils/events';
import { 
  calculateAcademicProfile, 
  SubjectGrade, 
  O_LEVEL_TO_GPA, 
  IB_TO_GPA, 
  AP_TO_GPA 
} from '../utils/calculations';

interface AcademicOnboardingWizardProps {
  onComplete: () => void;
}

export default function AcademicOnboardingWizard({ onComplete }: AcademicOnboardingWizardProps) {
  const { authorizedFetch, profile, updateProfile, rewardPoints } = useAuth();
  
  const [step, setStep] = useState(1);
  
  // Form States
  const [gradingSystem, setGradingSystem] = useState<'gpa_4_0' | 'ib_45' | 'uk_alevel' | 'percentage'>('gpa_4_0');
  const [educationLevel, setEducationLevel] = useState('high_school');
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear() + 2);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCountry, setInstitutionCountry] = useState('United States');
  const [targetCountry, setTargetCountry] = useState('United States');
  
  // Dynamic Subjects State
  const [subjects, setSubjects] = useState<SubjectGrade[]>([
    { subject: 'Advanced Math', grade: 'A', type: 'ap', category: 'stem' },
    { subject: 'Creative Literature', grade: 'B', type: 'standard', category: 'humanities' },
    { subject: 'World History', grade: 'A', type: 'honors', category: 'humanities' }
  ]);
  
  // New Subject Input States
  const [newSubName, setNewSubName] = useState('');
  const [newSubCategory, setNewSubCategory] = useState<'stem' | 'humanities' | 'languages' | 'arts'>('stem');
  const [newSubCourseType, setNewSubCourseType] = useState<'standard' | 'ap' | 'ib' | 'honors'>('standard');
  const [newSubGrade, setNewSubGrade] = useState('A');

  const availableGrades = {
    gpa_4_0: ['A*', 'A', 'B', 'C', 'D', 'E', 'F'],
    ib_45: ['7', '6', '5', '4', '3', '2', '1'],
    uk_alevel: ['A*', 'A', 'B', 'C', 'D', 'E', 'U'],
    percentage: ['95', '85', '75', '65', '55', '45']
  };

  const handleAddSubject = () => {
    if (!newSubName.trim()) return;
    playClickSound();
    
    setSubjects(prev => [
      ...prev,
      {
        subject: newSubName.trim(),
        category: newSubCategory,
        type: newSubCourseType,
        grade: newSubGrade
      }
    ]);
    
    // Reset temporary input
    setNewSubName('');
  };

  const handleRemoveSubject = (idx: number) => {
    playClickSound();
    setSubjects(prev => prev.filter((_, i) => i !== idx));
  };

  const nextStep = () => {
    playClickSound();
    setStep(prev => Math.min(5, prev + 1));
  };

  const prevStep = () => {
    playClickSound();
    setStep(prev => Math.max(1, prev - 1));
  };

  // Perform dynamic computations using our newly built calculations engine
  const calcResults = calculateAcademicProfile(subjects);

  const handleWizardSubmit = async () => {
    playAdvancementSound();
    try {
      // Build dynamic update package
      const updatedData = {
        hasCompletedOnboarding: true,
        educationLevel,
        graduationYear: Number(graduationYear),
        highSchoolName: educationLevel === 'high_school' ? institutionName : undefined,
        collegeName: educationLevel !== 'high_school' ? institutionName : undefined,
        gpa: calcResults.estimatedGpa,
        maxGpa: gradingSystem === 'ib_45' ? 7.0 : 4.0,
        intendedMajor: subjects[0]?.subject || 'Undecided',
        // Pack subjects JSON payload inside resume/portfolio text for search grounding
        portfolioDescription: `Completed subjects: ${subjects.map(s => `${s.subject} (${s.grade})`).join(', ')}`
      };

      if (updateProfile) {
        await updateProfile(updatedData);
      }
      
      // Save full subject payload in local storage for the performance matrix
      localStorage.setItem(`scholarpath_subjects_${profile?.fullName || 'guest'}`, JSON.stringify(subjects));
      
      // Award bounty of 50 XP
      if (rewardPoints) {
        const freshProfile = await rewardPoints(50, 'Completed Academic Matrix Onboarding Wizard', 'Onboarding Master');
        dispatchProfileUpdate(freshProfile);
      }
      
      onComplete();
    } catch (e) {
      console.error("Wizard submit error:", e);
    }
  };

  return (
    <div className="mc-window bg-[#322d29] border-4 border-black p-6 font-mono text-stone-200 [box-shadow:inset_-4px_-4px_0_#1a1918,inset_4px_4px_0_#555] space-y-6" id="academic-wizard">
      
      {/* Header Panel with Progress Dots */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black pb-4 gap-4">
        <div>
          <h3 className="font-press text-[11px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
            <GraduationCap className="w-5 h-5 animate-bounce text-[#ffff55]" /> Academic Onboarding Scribe
          </h3>
          <p className="text-stone-300 text-xs mt-1">
            Configure your curriculum, records, and active GPA history matrix.
          </p>
        </div>
        
        {/* Progress Tracker */}
        <div className="flex items-center gap-2 bg-black/40 border-2 border-black p-2">
          <span className="font-press text-[8px] text-stone-400 mr-2">STEP {step}/5</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-press text-[8px] ${
                  s === step ? 'bg-[#ffff55] text-black font-extrabold scale-110' :
                  s < step ? 'bg-[#55ff55] text-black' : 'bg-[#141414] text-stone-500'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Wizard Slider Container */}
      <div className="min-h-[350px] bg-black/25 border-2 border-black p-5 relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Grading and curriculum system */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <h4 className="font-press text-[9.5px] text-[#ffaa00] flex items-center gap-1.5 mc-text-shadow">
                📚 1. Select Your Curriculum & Grading Matrix
              </h4>
              <p className="text-stone-300 text-xs">
                Choose the primary grading standard utilized by your secondary school or university. The Scribe will calibrate all algorithms accordingly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  { id: 'gpa_4_0', title: 'US GPA Standard', desc: 'Symmetrical 0.00 to 4.00 Grade Point Average standard.', icon: '🇺🇸' },
                  { id: 'ib_45', title: 'International Baccalaureate', desc: 'Out of 45 aggregate points using 1 to 7 scores.', icon: '🇨🇭' },
                  { id: 'uk_alevel', title: 'UK O/A Level Standard', desc: 'Letter-based grading scale ranging from A* to U.', icon: '🇬🇧' },
                  { id: 'percentage', title: 'Universal Percentage scale', desc: 'Linear percentile scores from 0% to 100%.', icon: '🌐' }
                ].map((sys) => (
                  <button
                    key={sys.id}
                    onClick={() => {
                      playClickSound();
                      setGradingSystem(sys.id as any);
                    }}
                    className={`p-4 border-4 text-left transition-all relative ${
                      gradingSystem === sys.id 
                        ? 'border-[#ffff55] bg-yellow-500/10' 
                        : 'border-black bg-stone-900/45 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{sys.icon}</span>
                      <span className="font-press text-[9px] text-stone-100 block">{sys.title}</span>
                    </div>
                    <p className="text-stone-400 text-xs mt-2 leading-relaxed">{sys.desc}</p>
                    
                    {gradingSystem === sys.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#ffff55] border-2 border-black flex items-center justify-center text-black font-extrabold text-[9px]">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Current Status & Graduation Year */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <h4 className="font-press text-[9.5px] text-[#ffaa00] flex items-center gap-1.5 mc-text-shadow">
                🧭 2. Learning Level & Milestone Projection
              </h4>
              <p className="text-stone-300 text-xs">
                Outline your current structural tier inside the academic progression timeline.
              </p>

              <div className="space-y-4 pt-2 max-w-xl">
                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 uppercase text-[9px] font-bold">Your Current Tier:</span>
                  <select
                    value={educationLevel}
                    onChange={(e) => {
                      playClickSound();
                      setEducationLevel(e.target.value);
                    }}
                    className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none w-full"
                  >
                    <option value="high_school">High School (Grade 9 - 12)</option>
                    <option value="college">College Preparatory</option>
                    <option value="undergraduate">Undergraduate Scholar (B.Sc / B.A)</option>
                    <option value="graduate">Postgraduate (Master's / MBA)</option>
                    <option value="phd">Doctorate / PhD Researcher</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 uppercase text-[9px] font-bold">Graduation Forecast Year:</span>
                  <input
                    type="number"
                    value={graduationYear}
                    min={2020}
                    max={2035}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none w-full focus:border-[#ffff55]"
                  />
                  <span className="text-[10px] text-stone-500 leading-normal mt-0.5">
                    Year when you complete your current certificate or degree.
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Institution Details */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <h4 className="font-press text-[9.5px] text-[#ffaa00] flex items-center gap-1.5 mc-text-shadow">
                🏫 3. Institution Coordinates
              </h4>
              <p className="text-stone-300 text-xs">
                Enter your present institution coordinates and your target destination countries for study abroad.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-stone-400 uppercase text-[9px] font-bold">School / College Name:</span>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g., Westwood Academy or Imperial University"
                    className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none focus:border-[#ffff55]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 uppercase text-[9px] font-bold">Current Country of Study:</span>
                  <input
                    type="text"
                    value={institutionCountry}
                    onChange={(e) => setInstitutionCountry(e.target.value)}
                    className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none focus:border-[#ffff55]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-stone-400 uppercase text-[9px] font-bold">Target Dream Destination:</span>
                  <input
                    type="text"
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    className="bg-[#141414] border-2 border-black p-3 text-stone-200 outline-none focus:border-[#ffff55]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Subjects course load */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <h4 className="font-press text-[9.5px] text-[#ffaa00] flex items-center gap-1.5 mc-text-shadow">
                📋 4. Map Out Current Course Load & Grades
              </h4>
              <p className="text-stone-300 text-xs">
                Add active semesters/years subjects, categories, course weight level, and achieved grades.
              </p>

              {/* Add Subject Builder Form */}
              <div className="bg-black/45 border-2 border-black p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4 flex flex-col gap-1">
                  <span className="text-stone-400 text-[9px] uppercase font-bold">Subject Name:</span>
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="e.g., AP Physics II"
                    className="bg-[#141414] border border-stone-800 p-2 text-xs text-stone-200 outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex flex-col gap-1">
                  <span className="text-stone-400 text-[9px] uppercase font-bold">Category:</span>
                  <select
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as any)}
                    className="bg-[#141414] border border-stone-800 p-2 text-xs text-stone-200 outline-none"
                  >
                    <option value="stem">STEM / Math</option>
                    <option value="humanities">Humanities</option>
                    <option value="languages">Languages</option>
                    <option value="arts">Arts / Creative</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <span className="text-stone-400 text-[9px] uppercase font-bold">Weight Level:</span>
                  <select
                    value={newSubCourseType}
                    onChange={(e) => setNewSubCourseType(e.target.value as any)}
                    className="bg-[#141414] border border-stone-800 p-2 text-xs text-stone-200 outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="honors">Honors (+0.5)</option>
                    <option value="ap">AP Level (+1.0)</option>
                    <option value="ib">IB Level (+1.0)</option>
                  </select>
                </div>

                <div className="sm:col-span-1.5 flex flex-col gap-1">
                  <span className="text-stone-400 text-[9px] uppercase font-bold">Grade:</span>
                  <select
                    value={newSubGrade}
                    onChange={(e) => setNewSubGrade(e.target.value)}
                    className="bg-[#141414] border border-stone-800 p-2 text-xs text-stone-200 outline-none"
                  >
                    {availableGrades[gradingSystem].map((gr) => (
                      <option key={gr} value={gr}>{gr}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="sm:col-span-1.5 mc-btn py-1 px-3 text-[10px] w-full h-8 flex items-center justify-center font-press text-[#55ff55]"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD
                </button>
              </div>

              {/* Added Subjects Scrollboard */}
              <div className="space-y-1.5">
                <span className="text-stone-400 text-[9px] uppercase font-bold tracking-wide block">Active Registry Ledger:</span>
                <div className="max-h-[160px] overflow-y-auto space-y-2 border-2 border-black p-2.5 bg-[#141414] scrollbar-thin">
                  {subjects.length === 0 ? (
                    <div className="text-center text-stone-500 text-xs py-4 uppercase">
                      No subjects added! Type above and click Add to enroll.
                    </div>
                  ) : (
                    subjects.map((sub, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-black/25 p-2 border border-stone-800 font-mono text-xs text-stone-300">
                        <div className="flex items-center gap-2">
                          <span className="text-[#ffff55]">📘 {sub.subject}</span>
                          <span className="text-[9px] bg-stone-800 px-1.5 py-0.5 rounded-none uppercase text-stone-400 font-bold">{sub.type}</span>
                          <span className="text-[9px] text-stone-500 uppercase">({sub.category})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-extrabold text-[#55ff55] uppercase font-press text-[9px]">Grade: {sub.grade}</span>
                          <button
                            onClick={() => handleRemoveSubject(idx)}
                            className="text-red-500 hover:text-red-400 cursor-pointer active:scale-90"
                            title="Remove Subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Verification & Matrix Computations */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <h4 className="font-press text-[9.5px] text-[#ffaa00] flex items-center gap-1.5 mc-text-shadow">
                ⚡ 5. Synthesize Academic Ledger
              </h4>
              <p className="text-stone-300 text-xs">
                The Scribe has computed your academic strength indicator and standardized averages based on your courses ledger.
              </p>

              {/* Calculations Outcome Board */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                
                <div className="bg-stone-900 border-2 border-black p-4 text-center space-y-1">
                  <span className="font-mono text-stone-400 uppercase text-[9px] font-bold block">Estimated Unweighted GPA</span>
                  <span className="font-press text-2xl text-[#ffff55] mc-text-shadow block">{calcResults.estimatedGpa.toFixed(2)}</span>
                  <span className="text-[9px] font-mono text-stone-500">Converted to Standard 4.0</span>
                </div>

                <div className="bg-stone-900 border-2 border-black p-4 text-center space-y-1">
                  <span className="font-mono text-stone-400 uppercase text-[9px] font-bold block">Weighted Academic GPA</span>
                  <span className="font-press text-2xl text-[#55ff55] mc-text-shadow block">{calcResults.weightedGpa.toFixed(2)}</span>
                  <span className="text-[9px] font-mono text-stone-500">AP/IB (+1.0), Honors (+0.5)</span>
                </div>

                <div className="bg-stone-900 border-2 border-black p-4 text-center space-y-1">
                  <span className="font-mono text-stone-400 uppercase text-[9px] font-bold block">Overall Course Average</span>
                  <span className="font-press text-2xl text-cyan-400 mc-text-shadow block">{calcResults.overallAverage}%</span>
                  <span className="text-[9px] font-mono text-stone-500">Aggregate Percentile Score</span>
                </div>
              </div>

              {/* Strengths and Readiness badges */}
              <div className="bg-black/35 border-2 border-black p-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-stone-850 pb-2">
                  <span className="text-stone-400 font-bold uppercase">Academic Strength Tier:</span>
                  <span className="font-press text-[9px] px-2 py-0.5 bg-yellow-500/15 text-[#ffaa00] border border-yellow-500 uppercase animate-pulse">
                    🏆 {calcResults.academicStrength} Level
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-stone-850 pb-2">
                  <span className="text-stone-400 font-bold uppercase">Admission Readiness:</span>
                  <span className="font-press text-[9px] px-2 py-0.5 bg-green-500/15 text-[#55ff55] border border-green-500 uppercase">
                    🎓 {calcResults.admissionReadiness}
                  </span>
                </div>

                {/* Subject Category breakdowns */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-stone-400 text-[9px] uppercase font-bold tracking-wider block">Standings per Subject Matrix:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                    {Object.entries(calcResults.subjectAverages).map(([cat, val]) => (
                      <div key={cat} className="bg-black/30 border border-stone-800 p-2.5">
                        <span className="block text-stone-400 uppercase text-[8px] font-bold mb-1">{cat}</span>
                        <div className="w-full bg-stone-950 h-2 border border-black max-h-[8px] mb-1.5 relative">
                          <div 
                            className="bg-sky-400 h-full" 
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <span className="font-bold text-stone-200">{val}% Avg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Button Wizard Control Actions */}
      <div className="flex justify-between items-center pt-3 border-t-2 border-black">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className="font-press text-[9px] py-3 px-5 bg-[#444] hover:bg-[#525252] text-stone-300 border-2 border-black disabled:opacity-20 cursor-pointer disabled:pointer-events-none active:scale-95 transition-all uppercase flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" /> Back
        </button>

        {step < 5 ? (
          <button
            onClick={nextStep}
            className="mc-btn font-press text-[9px] py-3 px-5 text-[#ffff55] flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        ) : (
          <button
            onClick={handleWizardSubmit}
            className="mc-btn font-press text-[9px] py-3 px-6 text-[#55ff55] border-2 border-green-500 flex items-center gap-2 animate-bounce cursor-pointer hover:bg-stone-900"
          >
            ⛏️ Commit to Matrix (+50 XP) <Check className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>

    </div>
  );
}
