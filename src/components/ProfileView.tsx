import React, { useState, useEffect } from 'react';
import { User, Award, Save, Sparkles, CheckCircle, Plus, Shield, Trophy, GraduationCap, Laptop, BadgeCheck, X } from 'lucide-react';
import { Profile } from '../types';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { dispatchProfileUpdate } from '../utils/events';
import { useAuth } from '../context/AuthContext';
import AcademicOnboardingWizard from './AcademicOnboardingWizard';

export default function ProfileView() {
  const { authorizedFetch } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  // Forms states
  const [fullName, setFullName] = useState('');
  const [intendedMajor, setIntendedMajor] = useState('');
  const [intendedDegree, setIntendedDegree] = useState('');
  const [gpa, setGpa] = useState(0);
  const [maxGpa, setMaxGpa] = useState(4.0);
  const [nationality, setNationality] = useState('');
  const [ielts, setIelts] = useState('');
  const [gre, setGre] = useState('');
  
  // 🔬 SAT & O/A-Levels and Profile Picture States 🔬
  const [satScore, setSatScore] = useState<number | ''>('');
  const [oLevelInput, setOLevelInput] = useState('');
  const [aLevelInput, setALevelInput] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  // 🚨 Dynamic Integrated DB Fields 🚨
  const [educationLevel, setEducationLevel] = useState('undergraduate');
  const [highSchoolName, setHighSchoolName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [primaryMajor, setPrimaryMajor] = useState('');
  const [secondaryMajor, setSecondaryMajor] = useState('');
  const [minor, setMinor] = useState('');
  const [graduationYear, setGraduationYear] = useState(2025);
  const [additionalSkills, setAdditionalSkills] = useState<string[]>([]);
  const [newSkillItem, setNewSkillItem] = useState('');

  // 📄 CV/Resume PDF States 📄
  const [resumePdf, setResumePdf] = useState('');
  const [resumePdfName, setResumePdfName] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadStatus, setPdfUploadStatus] = useState('');

  // Experiences lists
  const [leadership, setLeadership] = useState<string[]>([]);
  const [newLeaderItem, setNewLeaderItem] = useState('');

  const [projects, setProjects] = useState<string[]>([]);
  const [newProjectItem, setNewProjectItem] = useState('');

  // Inner dossier folders states (for clean screen division)
  const [activeFormTab, setActiveFormTab] = useState<'basics' | 'academics' | 'portfolio'>('basics');

  // GPA Conversion parameters
  const [showGpaCalc, setShowGpaCalc] = useState(false);
  const [calcEducationLevel, setCalcEducationLevel] = useState('high_school_oa'); // 'high_school_oa' | 'ib' | 'ap' | 'sat_act'
  const [calcGradesRaw, setCalcGradesRaw] = useState<string[]>(['A*', 'A', 'B']); 
  const [calcIbScores, setCalcIbScores] = useState<number[]>([6, 5, 7]);
  const [calcApScores, setCalcApScores] = useState<number[]>([4, 5, 3]);
  const [calcSatScore, setCalcSatScore] = useState(1450);

  const calculateGpaValue = () => {
    let computed = 3.0;

    if (calcEducationLevel === 'high_school_oa') {
      const oLevelToGpa: Record<string, number> = {
        'A*': 4.0, 'A': 3.7, 'B': 3.3, 'C': 3.0, 'D': 2.3, 'E': 2.0, 'F': 0.0
      };
      const validGrades = calcGradesRaw.filter(g => oLevelToGpa[g] !== undefined);
      if (validGrades.length > 0) {
        const sum = validGrades.reduce((acc, grade) => acc + oLevelToGpa[grade], 0);
        computed = sum / validGrades.length;
      }
    } else if (calcEducationLevel === 'ib') {
      const ibToGpa: Record<number, number> = {
        7: 4.0, 6: 3.7, 5: 3.3, 4: 3.0, 3: 2.3, 2: 2.0, 1: 0.0
      };
      if (calcIbScores.length > 0) {
        const sum = calcIbScores.reduce((acc, score) => acc + (ibToGpa[score] || 0), 0);
        computed = sum / calcIbScores.length;
      }
    } else if (calcEducationLevel === 'ap') {
      const apToGpa: Record<number, number> = {
        5: 4.0, 4: 3.7, 3: 3.0, 2: 2.0, 1: 0.0
      };
      if (calcApScores.length > 0) {
        const sum = calcApScores.reduce((acc, score) => acc + (apToGpa[score] || 0), 0);
        computed = sum / calcApScores.length;
      }
    } else if (calcEducationLevel === 'sat_act') {
      if (calcSatScore >= 1550) computed = 4.0;
      else if (calcSatScore >= 1480) computed = 3.9;
      else if (calcSatScore >= 1400) computed = 3.8;
      else if (calcSatScore >= 1320) computed = 3.7;
      else if (calcSatScore >= 1240) computed = 3.5;
      else if (calcSatScore >= 1150) computed = 3.2;
      else if (calcSatScore >= 1000) computed = 2.8;
      else computed = 2.0;
    }
    return Number(computed.toFixed(2));
  };

  const applyCalculatedGpa = () => {
    playClickSound();
    const computedVal = calculateGpaValue();
    setGpa(computedVal);
    setShowGpaCalc(false);
  };

  const fetchProfile = async () => {
    try {
      const res = await authorizedFetch('/api/profile');
      const data = await res.json();
      setProfile(data);
      
      setFullName(data.fullName || '');
      setIntendedMajor(data.intendedMajor || '');
      setIntendedDegree(data.intendedDegree || '');
      setGpa(data.gpa || 3.0);
      setMaxGpa(data.maxGpa || 4.0);
      setNationality(data.nationality || '');
      setIelts(data.ieltsScore || '');
      setGre(data.greScore || '');
      
      // Hydrating dynamic custom fields
      setEducationLevel(data.educationLevel || 'undergraduate');
      setHighSchoolName(data.highSchoolName || '');
      setCollegeName(data.collegeName || '');
      setPrimaryMajor(data.primaryMajor || '');
      setSecondaryMajor(data.secondaryMajor || '');
      setMinor(data.minor || '');
      setGraduationYear(data.graduationYear || 2025);
      setAdditionalSkills(data.additionalSkills || []);
      
      setResumePdf(data.resumePdf || '');
      setResumePdfName(data.resumePdfName || '');

      setLeadership(data.leadershipExperience || []);
      setProjects(data.projects || []);

      // 🔬 Hydrate SAT, O/A Levels, and profile picture states 🔬
      setSatScore(data.satScore !== undefined && data.satScore !== null ? data.satScore : '');
      setOLevelInput(data.oLevelSubjects ? data.oLevelSubjects.join(', ') : '');
      setALevelInput(data.aLevelSubjects ? data.aLevelSubjects.join(', ') : '');
      setProfilePicture(data.profilePicture || '');
    } catch (e) {
      console.error("Failed to load active user profile record:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const handleAcademicsSelect = () => {
      setActiveFormTab('academics');
    };
    window.addEventListener('profile-tab-academics', handleAcademicsSelect);
    return () => {
      window.removeEventListener('profile-tab-academics', handleAcademicsSelect);
    };
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    const updated = {
      ...profile,
      fullName,
      intendedMajor,
      intendedDegree,
      gpa: Number(gpa),
      maxGpa: Number(maxGpa),
      nationality,
      ieltsScore: ielts,
      greScore: gre,

      // 🚨 Append new schema databases 🚨
      educationLevel,
      highSchoolName,
      collegeName,
      primaryMajor,
      secondaryMajor,
      minor,
      graduationYear: Number(graduationYear),
      additionalSkills,
      resumePdf,
      resumePdfName,

      leadershipExperience: leadership,
      projects,

      // 🔬 SAT score, O/A-Levels and profile picture details 🔬
      satScore: satScore !== '' ? Number(satScore) : null,
      oLevelSubjects: oLevelInput.split(',').map(item => item.trim()).filter(Boolean),
      aLevelSubjects: aLevelInput.split(',').map(item => item.trim()).filter(Boolean),
      profilePicture
    };

    try {
      const res = await authorizedFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      setProfile(data);

      // Save success triggers central advancement reward points count (+15 XP)
      const resReward = await authorizedFetch('/api/profile/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: 15,
          actionName: 'Enrolled Academic CV details fully',
          badgeToUnlock: "Syllabus Architect"
        })
      });
      const finalProfileObj = await resReward.json();
      setProfile(finalProfileObj);

      // Instantly dispatch to other embedded views safely
      dispatchProfileUpdate(finalProfileObj);

      setSuccess('Candidate credentials saved fully! Check admissions bulletin rewards.');
      playAdvancementSound();
      
      // Auto-clears XP notifications cleanly after 4 seconds!
      setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err) {
      console.error("Profile saving error:", err);
    }
  };

  // Dynamic lists manipulators
  const addLeaderItem = () => {
    playClickSound();
    if (!newLeaderItem.trim()) return;
    setLeadership([...leadership, newLeaderItem.trim()]);
    setNewLeaderItem('');
  };

  const removeLeaderItem = (idx: number) => {
    playClickSound();
    setLeadership(leadership.filter((_, i) => i !== idx));
  };

  const addProjectItem = () => {
    playClickSound();
    if (!newProjectItem.trim()) return;
    setProjects([...projects, newProjectItem.trim()]);
    setNewProjectItem('');
  };

  const removeProjectItem = (idx: number) => {
    playClickSound();
    setProjects(projects.filter((_, i) => i !== idx));
  };

  const addSkillTag = () => {
    playClickSound();
    if (!newSkillItem.trim()) return;
    if (!additionalSkills.includes(newSkillItem.trim())) {
      setAdditionalSkills([...additionalSkills, newSkillItem.trim()]);
    }
    setNewSkillItem('');
  };

  const removeSkillTag = (tag: string) => {
    playClickSound();
    setAdditionalSkills(additionalSkills.filter(t => t !== tag));
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
       setPdfUploadStatus('⚠️ Candidate error: Only official .pdf files are accepted!');
       return;
    }

    playClickSound();
    setPdfUploading(true);
    setPdfUploadStatus('Synchronizing CV document buffer with AI Matrix...');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await authorizedFetch('/api/upload-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            base64: base64
          })
        });

        if (!res.ok) throw new Error("Upload bounds refused");

        const data = await res.json();
        setResumePdf(base64);
        setResumePdfName(file.name);
        
        // Auto-fill profile fields based on parsedInfo
        if (data.profile) {
          setProfile(data.profile);
          if (data.profile.additionalSkills) {
            setAdditionalSkills(data.profile.additionalSkills);
          }
          if (data.profile.primaryMajor) {
            setPrimaryMajor(data.profile.primaryMajor);
            setIntendedMajor(data.profile.primaryMajor);
          }
          dispatchProfileUpdate(data.profile);
        }

        setPdfUploadStatus(`🎉 Fully processed CV: "${file.name}"! AI auto-extracted skills & majors loaded into memory.`);
        playAdvancementSound();
      } catch (err) {
        console.error(err);
        setPdfUploadStatus('⚠️ Base64 upload failed. Check web server matrix.');
      } finally {
        setPdfUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePdf = () => {
    playClickSound();
    setResumePdf('');
    setResumePdfName('');
    setPdfUploadStatus('Dossier CV Deleted.');
  };

  const handlePfpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    playClickSound();
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePfp = () => {
    playClickSound();
    setProfilePicture('');
  };

  return (
    <div className="space-y-6" id="scholarpath-candidate-profile">
      
      {/* Title window description block */}
      <div className="mc-window border-4 border-black p-5 text-stone-800">
        <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
          <User className="w-5 h-5 text-stone-900 shrink-0" /> PLAYER ADVANCEMENT PORTFOLIO
        </h3>
        <p className="text-xs text-stone-700 font-sans mt-2 leading-relaxed">
          Configure academic standings, qualification levels, active certifications, graduation checkpoints and technical skills tags used by AI recommendation matrices.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-950 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5 text-[#55ff55] shrink-0 animate-bounce" />
          <span className="mc-text-shadow font-bold">{success} (+15 XP Claimed!)</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <Sparkles className="w-7 h-7 animate-spin text-[#ffff55]" />
          <span className="mc-text-shadow">SYNCHRONIZING HERO METRIC DATA...</span>
        </div>
      ) : profile && (!profile.hasCompletedOnboarding || showWizard) ? (
        <AcademicOnboardingWizard onComplete={() => { setShowWizard(false); fetchProfile(); }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main customized dossier form */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Form categorizations tabs */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { playClickSound(); setActiveFormTab('basics'); }}
                className={`px-3 py-1.5 font-press text-[8px] uppercase border-4 border-black ${
                  activeFormTab === 'basics' 
                    ? 'bg-[#3b3b8c] text-[#ffff55] border-t-white border-left-white' 
                    : 'bg-[#555] text-stone-300'
                }`}
              >
                👤 Identity
              </button>
              <button
                type="button"
                onClick={() => { playClickSound(); setActiveFormTab('academics'); }}
                className={`px-3 py-1.5 font-press text-[8px] uppercase border-4 border-black ${
                  activeFormTab === 'academics' 
                    ? 'bg-[#3b3b8c] text-[#ffff55] border-t-white border-left-white' 
                    : 'bg-[#555] text-stone-300'
                }`}
              >
                🎓 Academic Base
              </button>
              <button
                type="button"
                onClick={() => { playClickSound(); setActiveFormTab('portfolio'); }}
                className={`px-3 py-1.5 font-press text-[8px] uppercase border-4 border-black ${
                  activeFormTab === 'portfolio' 
                    ? 'bg-[#3b3b8c] text-[#ffff55] border-t-white border-left-white' 
                    : 'bg-[#555] text-stone-300'
                }`}
              >
                💻 Projects & Tags
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-5 text-stone-200">
              
              {/* SECTION A: PRIMARY IDENTIFICATION ATTRIBUTES */}
              {activeFormTab === 'basics' && (
                <div className="space-y-4">
                  <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black">PRIMARY DOSSIER CONFIG</h4>
                  
                  {/* Portrait Avatar config */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/35 p-3 border-2 border-black">
                    <div className="w-16 h-16 bg-black border-4 border-stone-600 rounded-none flex items-center justify-center shrink-0 overflow-hidden relative">
                      {profilePicture ? (
                        <img 
                          src={profilePicture} 
                          alt="Applicant Portrait Avatar" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-[28px] select-none text-stone-500">👾</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 text-center sm:text-left font-mono">
                      <span className="text-stone-300 font-bold uppercase text-[9px] block">CANDIDATE PORTRAIT AVATAR:</span>
                      <p className="text-[10px] text-stone-400">Apply a portrait avatar or identity photo to finalize your passport dossier file.</p>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1.5">
                        <label className="bg-stone-800 hover:bg-stone-750 border-2 border-black text-stone-200 text-[9px] uppercase font-bold py-1 px-2.5 cursor-pointer select-none leading-none inline-block font-sans rounded-none">
                          Upload Portrait
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePfpChange} 
                            className="hidden" 
                          />
                        </label>
                        {profilePicture && (
                          <button
                            type="button"
                            onClick={handleDeletePfp}
                            className="bg-red-950/45 hover:bg-red-900/60 border border-red-500 text-red-100 text-[9px] uppercase font-bold py-1 px-2.5 cursor-pointer select-none rounded-none font-sans"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Full Applicant Name:</span>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55]"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Nationality (Eligibility Land):</span>
                      <input
                        type="text"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55]"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Target Study Segment (Major):</span>
                      <input
                        type="text"
                        value={intendedMajor}
                        onChange={(e) => setIntendedMajor(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55]"
                        placeholder="e.g. Computer Science"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Target Degree Class:</span>
                      <select
                        value={intendedDegree}
                        onChange={(e) => setIntendedDegree(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none"
                      >
                        <option value="Undergraduate">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree (M.Sc / JMD)</option>
                        <option value="Ph.D.">Doctor of Philosophy (Ph.D.)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: ACADEMIC CREDENTIAL DETAILS */}
              {activeFormTab === 'academics' && (
                <div className="space-y-4">
                  <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black">ACADEMIC MATRIX VALUES</h4>
                  
                  {/* Step-by-step Scribe wizard launcher banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1e1a18] border-2 border-[#ffaa00] p-4 gap-4 font-mono text-xs text-stone-200">
                    <div className="space-y-1">
                      <span className="font-press text-[8.5px] text-[#ffaa00] block mc-text-shadow">🧙‍♂️ Academic Scribe Wizard</span>
                      <p className="text-[11px] text-stone-300 leading-relaxed max-w-lg">
                        Run the step-by-step interactive onboarding to map courses, calculate weighted GPAs, and assess admissions compatibility.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setShowWizard(true); }}
                      className="mc-btn font-press text-[8px] py-2 px-3.5 shrink-0 uppercase text-[#ffff55]"
                    >
                      Launch Wizard
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    
                    {/* Education level selectors */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Current Learning Level:</span>
                      <select
                        id="education-level-select"
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none"
                      >
                        <option value="high_school">High School</option>
                        <option value="college">College Preparatory</option>
                        <option value="undergraduate">Undergraduate (B.Sc / B.A)</option>
                        <option value="graduate">Graduate (M.Sc / MBA)</option>
                        <option value="phd">PhD Scholar</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Graduation Forecast Year:</span>
                      <input
                        type="number"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(Number(e.target.value))}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55]"
                        min="2020"
                        max="2035"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Primary Major Subject (Select or Type Custom):</span>
                      <input
                        list="primary-major-options"
                        type="text"
                        value={primaryMajor}
                        onChange={(e) => {
                          setPrimaryMajor(e.target.value);
                          setIntendedMajor(e.target.value); // Sync to legacy intendedMajor
                        }}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55] font-sans text-stone-100"
                        placeholder="Double-click to select or type custom..."
                      />
                      <datalist id="primary-major-options">
                        <option value="Computer Science" />
                        <option value="Information Technology" />
                        <option value="Information Systems" />
                        <option value="Artificial Intelligence" />
                        <option value="Data Science" />
                        <option value="Mechanical Engineering" />
                        <option value="Public Policy" />
                        <option value="Business Administration" />
                      </datalist>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Secondary Major Subject:</span>
                      <input
                        type="text"
                        value={secondaryMajor}
                        onChange={(e) => setSecondaryMajor(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55]"
                        placeholder="e.g. Data Science (Optional)"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-1">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Minor Subject Concentration:</span>
                      <input
                        type="text"
                        value={minor}
                        onChange={(e) => setMinor(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none"
                        placeholder="e.g. Mathematics"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-1">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">School Registry (High School Name):</span>
                      <input
                        type="text"
                        value={highSchoolName}
                        onChange={(e) => setHighSchoolName(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none"
                        placeholder="e.g. St. Joseph Academy"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-1">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Academic Base institution (College Name):</span>
                      <input
                        type="text"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none"
                        placeholder="e.g. Stanford University"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 col-span-1.5 bg-[#1a1a1a] p-2 border border-black/50">
                      <div className="flex flex-col gap-1.5 col-span-1">
                        <span className="text-stone-300 uppercase text-[9px] font-bold flex justify-between items-center">
                          <span>Current GPA:</span>
                          <button
                            type="button"
                            onClick={() => { playClickSound(); setShowGpaCalc(!showGpaCalc); }}
                            className="text-[8px] bg-[#3b3b8c] hover:bg-[#4d4dbf] text-[#ffff55] border border-black px-1.5 py-0.5 font-press uppercase cursor-pointer"
                          >
                            🔮 Auto Calc
                          </button>
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={gpa}
                          onChange={(e) => setGpa(Number(e.target.value))}
                          className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55] text-xs font-mono text-stone-200"
                          min="0"
                          max={maxGpa}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 col-span-1">
                        <span className="text-[#a8a8a8] uppercase text-[9px] font-bold">Max GPA Limit</span>
                        <input
                          type="number"
                          step="0.1"
                          value={maxGpa}
                          onChange={(e) => setMaxGpa(Number(e.target.value))}
                          className="bg-[#141414] border-2 border-black p-2 outline-none text-xs font-mono text-stone-200"
                        />
                      </div>

                      {/* Expandable Auto GPA Calculator panel */}
                      {showGpaCalc && (
                        <div className="col-span-2 mt-2 bg-black/40 p-3 border-2 border-dashed border-[#ffff55]/40 space-y-3 font-mono text-[11px] text-stone-300">
                          <div className="flex justify-between items-center border-b border-stone-800 pb-1.5">
                            <span className="font-press text-[8px] text-[#ffff55] uppercase">Auto GPA Converter</span>
                            <button
                              type="button"
                              onClick={() => { playClickSound(); setShowGpaCalc(false); }}
                              className="text-red-400 font-bold text-xs"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-stone-400 block uppercase">Choose Grading Scheme Limit:</label>
                            <select
                              value={calcEducationLevel}
                              onChange={(e) => { playClickSound(); setCalcEducationLevel(e.target.value); }}
                              className="bg-stone-900 border border-stone-700 text-stone-200 p-1 w-full text-[11px]"
                            >
                              <option value="high_school_oa">High School (O/A Levels: A*, A, B, C...)</option>
                              <option value="ib">IB (International Baccalaureate: 1-7)</option>
                              <option value="ap">AP (Advanced Placement: 1-5)</option>
                              <option value="sat_act">SAT (Score 400-1600)</option>
                            </select>
                          </div>

                          {calcEducationLevel === 'high_school_oa' && (
                            <div className="space-y-2">
                              <span className="text-[9px] text-stone-400 block uppercase">Enter Registered Subject Grades (comma separated):</span>
                              <input
                                type="text"
                                value={calcGradesRaw.join(', ')}
                                onChange={(e) => setCalcGradesRaw(e.target.value.toUpperCase().split(',').map(s => s.trim()))}
                                className="bg-[#141414] border border-stone-700 text-stone-150 p-1 w-full text-xs font-mono"
                                placeholder="A*, A, B, B, C"
                              />
                              <p className="text-[9px] text-stone-500 italic">Grading metrics: A* = 4.0, A = 3.7, B = 3.3, C = 3.0, D = 2.3, E = 2.0, F = 0.0</p>
                            </div>
                          )}

                          {calcEducationLevel === 'ib' && (
                            <div className="space-y-2">
                              <span className="text-[9px] text-stone-400 block uppercase font-bold">Enter Registered Subject Scores (comma separated 1-7):</span>
                              <input
                                type="text"
                                value={calcIbScores.join(', ')}
                                onChange={(e) => setCalcIbScores(e.target.value.split(',').map(s => parseInt(s.trim(), 10) || 7))}
                                className="bg-[#141414] border border-stone-700 text-stone-150 p-1 w-full text-xs font-mono"
                                placeholder="7, 6, 5, 6, 7"
                              />
                              <p className="text-[9px] text-stone-500 italic">Grading metrics: 7 = 4.0, 6 = 3.7, 5 = 3.3, 4 = 3.0, 3 = 2.3, 2 = 2.0</p>
                            </div>
                          )}

                          {calcEducationLevel === 'ap' && (
                            <div className="space-y-2">
                              <span className="text-[9px] text-stone-400 block uppercase font-bold">Enter Registered Subject Scores (comma separated 1-5):</span>
                              <input
                                type="text"
                                value={calcApScores.join(', ')}
                                onChange={(e) => setCalcApScores(e.target.value.split(',').map(s => parseInt(s.trim(), 10) || 5))}
                                className="bg-[#141414] border border-stone-700 text-stone-150 p-1 w-full text-xs font-mono"
                                placeholder="5, 4, 5, 3"
                              />
                            </div>
                          )}

                          {calcEducationLevel === 'sat_act' && (
                            <div className="space-y-1">
                              <span className="text-[9px] text-stone-400 block uppercase font-bold">Enter SAT Combined Score (400 - 1600):</span>
                              <input
                                type="number"
                                min="400"
                                max="1600"
                                value={calcSatScore}
                                onChange={(e) => setCalcSatScore(parseInt(e.target.value, 10) || 1200)}
                                className="bg-[#141414] border border-stone-700 text-stone-150 p-1 w-full text-xs font-mono"
                              />
                            </div>
                          )}

                          <div className="flex gap-2 pt-1 border-t border-stone-800">
                            <div className="text-stone-300 font-bold self-center text-[10px]">
                              Computed: <span className="text-[#55ff55]">{calculateGpaValue().toFixed(2)}</span> / 4.00
                            </div>
                            <button
                              type="button"
                              onClick={applyCalculatedGpa}
                              className="ml-auto bg-green-950 text-[#55ff55] border border-green-700 px-2.5 py-1 uppercase text-[9px] font-bold cursor-pointer"
                            >
                              Apply Value
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-1">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">IELTS/TOEFL standard Score:</span>
                      <input
                        type="text"
                        value={ielts}
                        onChange={(e) => setIelts(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none"
                        placeholder="e.g. 7.5 or 105"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-1">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">GRE General Test Score:</span>
                      <input
                        type="text"
                        value={gre}
                        onChange={(e) => setGre(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none"
                        placeholder="e.g. 320"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-1">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">SAT Cumulative Score:</span>
                      <input
                        type="number"
                        value={satScore}
                        onChange={(e) => setSatScore(e.target.value !== '' ? Number(e.target.value) : '')}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55]"
                        placeholder="e.g. 1520 (Max 1600)"
                        min="400"
                        max="1600"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-1">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">O-Level Certification Results:</span>
                      <input
                        type="text"
                        value={oLevelInput}
                        onChange={(e) => setOLevelInput(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55]"
                        placeholder="e.g. Math: A*, English: A, Physics: A*"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-full">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">A-Level Certification Results:</span>
                      <input
                        type="text"
                        value={aLevelInput}
                        onChange={(e) => setALevelInput(e.target.value)}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55]"
                        placeholder="e.g. Math: A*, Chemistry: A, Physics: A*"
                      />
                    </div>
                  </div>

                  {/* 📄 CV/Resume PDF Section 📄 */}
                  <div className="mt-5 p-4 bg-black/35 border-2 border-stone-800 rounded-none space-y-3 font-mono">
                    <span className="text-stone-300 uppercase text-[9px] font-press block flex items-center gap-1.5">
                      <span>📄</span> Dossier CV/Resume PDF:
                    </span>
                    <p className="text-[11px] text-stone-400">
                      Upload your career summary (.pdf) to store it in your fellowship dossier. 
                      ScholarPath AI will analyze the document block to instantly auto-populate your skills tags and primary major selection!
                    </p>
                    
                    {resumePdf ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-stone-900 border border-stone-700">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 text-lg">📂</span>
                          <div className="leading-tight">
                            <span className="text-xs text-stone-200 block font-semibold truncate max-w-xs">{resumePdfName || "synced-dossier-resume.pdf"}</span>
                            <span className="text-[10px] text-stone-500 font-sans block">Dossier Storage Payload Synchronized</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                            href={resumePdf} 
                            download={resumePdfName || "resume.pdf"}
                            className="bg-[#2c2c2c] hover:bg-stone-850 border-2 border-black text-stone-300 text-[10px] uppercase font-bold py-1 px-3 cursor-pointer select-none leading-none inline-block font-sans rounded-none"
                          >
                            Download
                          </a>
                          <button 
                            type="button"
                            onClick={handleDeletePdf}
                            className="bg-red-950/45 hover:bg-red-900/60 border border-red-500 text-red-200 text-[10px] uppercase font-bold py-1 px-3 cursor-pointer select-none rounded-none"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center py-6 border-2 border-dashed border-stone-700 bg-[#1a1a1a] hover:bg-[#202020] transition-colors relative cursor-pointer group">
                        <input 
                          type="file" 
                          id="cv-pdf-upload" 
                          accept=".pdf" 
                          onChange={handlePdfChange} 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="text-center space-y-1">
                          <span className="text-stone-400 font-semibold text-xs group-hover:text-stone-200">
                            {pdfUploading ? "Processing Document payload..." : "Click to select or drop CV PDF..."}
                          </span>
                          <span className="text-[10px] text-stone-500 block">Maximum PDF payload limits: ~5MB</span>
                        </div>
                      </div>
                    )}
                    
                    {pdfUploadStatus && (
                      <p className="text-[10.5px] text-[#ffff55] font-mono leading-tight pt-1">
                        📢 {pdfUploadStatus}
                      </p>
                    )}
                  </div>

                </div>
              )}

              {/* SECTION C: SKILLS, PROJECTS AND EXTRACURRICULARS */}
              {activeFormTab === 'portfolio' && (
                <div className="space-y-4">
                  <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black">SKILLS & PROJECTS CAPSULES</h4>
                  
                  {/* Dynamic Skills Tags Segment */}
                  <div className="space-y-2">
                    <span className="text-stone-300 text-[9px] font-press block uppercase">Additional Skills Tags:</span>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-black/45 border-2 border-stone-850 min-h-[44px]">
                      {additionalSkills.length === 0 ? (
                        <span className="text-stone-500 font-mono text-xs italic p-1">No custom skill tags registered. Add below.</span>
                      ) : (
                        additionalSkills.map(tag => (
                          <span 
                            key={tag} 
                            className="bg-[#3b3b8c] text-white border border-black font-press text-[8px] px-2 py-1 uppercase flex items-center gap-1.5 rounded-none select-none"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeSkillTag(tag)}
                              className="text-red-400 font-extrabold hover:text-white"
                            >
                              x
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkillItem}
                        onChange={(e) => setNewSkillItem(e.target.value)}
                        placeholder="e.g. PyTorch"
                        className="flex-1 bg-[#141414] border-2 border-black p-2 text-xs font-mono outline-none"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkillTag(); } }}
                      />
                      <button
                        type="button"
                        onClick={addSkillTag}
                        className="mc-btn font-press text-[8px]"
                      >
                        Link Skill
                      </button>
                    </div>
                  </div>

                  {/* Existing Projects and Leadership sections */}
                  <div className="space-y-3 pt-3 border-t border-stone-800">
                    <span className="text-stone-300 text-[9px] font-press block uppercase">Research & Development Projects:</span>
                    <ul className="space-y-1 text-xs font-mono">
                      {projects.map((proj, idx) => (
                        <li key={idx} className="bg-black/35 p-2 border border-black flex justify-between items-center">
                          <span>📦 {proj}</span>
                          <button 
                            type="button" 
                            onClick={() => removeProjectItem(idx)} 
                            className="text-red-500 font-bold hover:underline"
                          >
                            Dismantle
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProjectItem}
                        onChange={(e) => setNewProjectItem(e.target.value)}
                        placeholder="e.g. Retro Canvas engine node..."
                        className="flex-1 bg-[#141414] border-2 border-black p-2 text-xs font-mono outline-none"
                      />
                      <button type="button" onClick={addProjectItem} className="mc-btn font-press text-[8px]">
                        Draft
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-stone-800">
                    <span className="text-stone-300 text-[9px] font-press block uppercase">Leadership Experiences:</span>
                    <ul className="space-y-1 text-xs font-mono">
                      {leadership.map((lead, idx) => (
                        <li key={idx} className="bg-black/35 p-2 border border-black flex justify-between items-center">
                          <span>👑 {lead}</span>
                          <button 
                            type="button" 
                            onClick={() => removeLeaderItem(idx)} 
                            className="text-red-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLeaderItem}
                        onChange={(e) => setNewLeaderItem(e.target.value)}
                        placeholder="e.g. Treasurer at computing club..."
                        className="flex-1 bg-[#141414] border-2 border-black p-2 text-xs font-mono outline-none"
                      />
                      <button type="button" onClick={addLeaderItem} className="mc-btn font-press text-[8px]">
                        Award
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Master Submission Action Button block */}
              <div className="pt-4 border-t-2 border-black flex justify-end">
                <button
                  type="submit"
                  id="profile-save-btn"
                  className="mc-btn py-3 px-6 text-[10px] text-[#ffff55] flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Save className="w-4 h-4 text-[#ffff55]" /> Save Dossier Blueprint
                </button>
              </div>

            </form>
          </div>

          {/* Core Sidebar Achievements, showing unlocked Player ranks */}
          <div className="lg:col-span-4 bg-[#211612] border-4 border-[#4d3224] p-5 shadow-inner text-stone-300 space-y-5">
            <h4 className="font-press text-[10px] text-[#ffaa00] mc-text-shadow uppercase tracking-wider border-b-2 border-[#4d3224] pb-2 leading-none flex items-center gap-1.5">
              <Trophy className="w-4.5 h-4.5 text-[#ffaa00]" /> GUEST ACHIEVEMENTS
            </h4>

            {/* Render Badges List */}
            <div className="space-y-3.5">
              <span className="text-[9px] font-mono font-bold uppercase text-stone-400 block mb-1">UNLOCKED STAGE BADGES ({profile?.badges?.length || 0})</span>
              {profile?.badges && profile.badges.map((badge, idx) => (
                <div 
                  key={idx}
                  className="bg-black/45 border-2 border-black p-3 rounded-none flex items-center gap-3 [box-shadow:inset_-2px_-2px_0_#141414]"
                >
                  <div className="w-8 h-8 bg-black border border-[#ffff55] rounded-none flex items-center justify-center shrink-0">
                    🏆
                  </div>
                  <div className="space-y-0.5 leading-none">
                    <span className="font-press text-[9px] text-[#ffff55] mc-text-shadow leading-none block">{badge}</span>
                    <span className="text-[10px] font-mono text-stone-400 block pt-1">Achieved Quest Advancement</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom static scoreboard hint */}
            <div className="bg-black/45 border border-stone-850 p-4 text-[11px] font-mono leading-relaxed space-y-1.5">
              <span className="text-[#ffaa00] font-press text-[8px] uppercase block">PLAYER SCOREBOARD MATRIX:</span>
              <p>Admissions Level score calculations increase linearly by ticking timeline roadmap items or registering credentials details fully (+15 XP per update!).</p>
            </div>
          </div>
          
        </div>
      )}

    </div>
  );
}
