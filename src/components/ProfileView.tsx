import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Save, Sparkles, CheckCircle, Plus, GraduationCap, 
  MapPin, Globe, Linkedin, Github, ExternalLink, Upload, Trash2, 
  FileText, Award, BookOpen, Calculator, Check, ShieldCheck, BadgeCheck
} from 'lucide-react';
import { Profile } from '../types';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { dispatchProfileUpdate } from '../utils/events';
import { useAuth } from '../context/AuthContext';
import { WORLD_COUNTRIES } from '../utils/curriculumData';
import WizardContainer from './OnboardingWizard/WizardContainer';
import XpProgressBar from './XpProgressBar';

const AVATAR_PRESETS = [
  { id: 'wizard', emoji: '🧙‍♂️', name: 'Mage Scholar' },
  { id: 'student', emoji: '🧑‍🎓', name: 'Fellow Scholar' },
  { id: 'cyber', emoji: '👨‍💻', name: 'Cyber Student' },
  { id: 'scientist', emoji: '👩‍🔬', name: 'Research Scholar' },
  { id: 'hero', emoji: '🦸', name: 'Quantum Pioneer' },
  { id: 'robot', emoji: '🤖', name: 'AI Specialist' },
  { id: 'elf', emoji: '🧝', name: 'Quest Finder' },
  { id: 'alien', emoji: '👽', name: 'Deep Space Explorer' },
];

const ACADEMIC_STATUS_OPTIONS = [
  'Currently Studying',
  'Graduated',
  'On Gap Year',
  'Deferred',
  'Other'
];

export default function ProfileView() {
  const { authorizedFetch, updateProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  // Active Tab: 'personal' or 'academics'
  const [activeTab, setActiveTab] = useState<'personal' | 'academics'>('personal');

  // Personal Profile Fields
  const [fullName, setFullName] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Academic Records Fields
  const [educationLevel, setEducationLevel] = useState('undergraduate');
  const [universityName, setUniversityName] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [primaryMajor, setPrimaryMajor] = useState('');
  const [intendedMajor, setIntendedMajor] = useState('');
  const [intendedDegree, setIntendedDegree] = useState('');
  const [graduationYear, setGraduationYear] = useState(2026);
  const [academicStatus, setAcademicStatus] = useState<string[]>(['Currently Studying']);
  
  // Scores & Grades
  const [gpa, setGpa] = useState<number>(3.5);
  const [maxGpa, setMaxGpa] = useState<number>(4.0);
  const [satScore, setSatScore] = useState<number | ''>('');
  const [greScore, setGreScore] = useState('');
  const [ieltsScore, setIeltsScore] = useState('');
  const [oLevelInput, setOLevelInput] = useState('');
  const [aLevelInput, setALevelInput] = useState('');

  // Lists
  const [additionalSkills, setAdditionalSkills] = useState<string[]>([]);
  const [newSkillItem, setNewSkillItem] = useState('');

  const [projects, setProjects] = useState<string[]>([]);
  const [newProjectItem, setNewProjectItem] = useState('');

  const [leadership, setLeadership] = useState<string[]>([]);
  const [newLeaderItem, setNewLeaderItem] = useState('');

  // Resume PDF
  const [resumePdf, setResumePdf] = useState('');
  const [resumePdfName, setResumePdfName] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState('');

  // GPA Calculator Modal State
  const [showGpaCalc, setShowGpaCalc] = useState(false);
  const [calcType, setCalcType] = useState<'letter' | 'ib' | 'sat'>('letter');
  const [calcGrades, setCalcGrades] = useState<string[]>(['A', 'A', 'B', 'A*']);
  const [calcIbScores, setCalcIbScores] = useState<number[]>([6, 7, 6]);
  const [calcSatInput, setCalcSatInput] = useState(1450);

  const pfpInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const calculateProfileCompletion = () => {
    const fields = [
      fullName.trim() !== '',
      heroTitle.trim() !== '',
      country.trim() !== '',
      city.trim() !== '',
      bio.trim() !== '',
      profilePicture !== '',
      universityName.trim() !== '',
      degree.trim() !== '',
      fieldOfStudy.trim() !== '',
      gpa > 0,
      additionalSkills.length > 0,
      projects.length > 0
    ];
    const filled = fields.filter(Boolean).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let data: Partial<Profile> | null = null;

      try {
        const res = await authorizedFetch('/api/profile');
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn("Server profile fetch failed, checking local storage:", err);
      }

      // Guest / Offline fallback
      if (!data) {
        const localStr = localStorage.getItem('scholarpath_user') || localStorage.getItem('scholarpath_guest_profile');
        if (localStr) {
          try {
            data = JSON.parse(localStr);
          } catch (e) {
            console.error("Error parsing local profile:", e);
          }
        }
      }

      if (data) {
        setProfile(data as Profile);
        setFullName(data.fullName || '');
        setHeroTitle(data.heroTitle || 'Scholarship Explorer');
        setCountry(data.country || data.nationality || 'United States');
        setCity(data.city || '');
        setBio(data.bio || '');
        setProfilePicture(data.profilePicture || '');
        setLinkedin(data.linkedin || '');
        setGithub(data.github || '');
        setPortfolio(data.portfolio || '');

        setEducationLevel(data.educationLevel || 'undergraduate');
        setUniversityName(data.universityName || data.collegeName || data.highSchoolName || '');
        setDegree(data.degree || '');
        setFieldOfStudy(data.fieldOfStudy || data.primaryMajor || '');
        setPrimaryMajor(data.primaryMajor || data.fieldOfStudy || '');
        setIntendedMajor(data.intendedMajor || '');
        setIntendedDegree(data.intendedDegree || "Master's Degree");
        setGraduationYear(data.graduationYear || 2026);
        setAcademicStatus(data.academicStatus || ['Currently Studying']);

        setGpa(data.gpa || 3.5);
        setMaxGpa(data.maxGpa || 4.0);
        setSatScore(data.satScore !== undefined && data.satScore !== null ? data.satScore : '');
        setGreScore(data.greScore || '');
        setIeltsScore(data.ieltsScore || '');
        setOLevelInput(data.oLevelSubjects ? data.oLevelSubjects.join(', ') : '');
        setALevelInput(data.aLevelSubjects ? data.aLevelSubjects.join(', ') : '');

        setAdditionalSkills(data.additionalSkills || []);
        setProjects(data.projects || []);
        setLeadership(data.leadershipExperience || []);
        setResumePdf(data.resumePdf || '');
        setResumePdfName(data.resumePdfName || '');
      }
    } catch (e) {
      console.error("Failed to hydrate profile view:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'academics') {
        setActiveTab('academics');
      } else if (customEvent.detail === 'personal') {
        setActiveTab('personal');
      }
    };

    window.addEventListener('profile-tab-switch', handleSwitchTab);
    return () => window.removeEventListener('profile-tab-switch', handleSwitchTab);
  }, []);

  // Save changes handler for BOTH Personal & Academic records
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playClickSound();

    const updated: Partial<Profile> = {
      ...profile,
      fullName: fullName.trim() || profile?.fullName || 'Scholar Explorer',
      heroTitle: heroTitle.trim() || 'Scholarship Explorer',
      country: country.trim() || 'United States',
      nationality: country.trim() || 'United States',
      city: city.trim(),
      bio: bio.trim(),
      profilePicture,
      linkedin: linkedin.trim(),
      github: github.trim(),
      portfolio: portfolio.trim(),

      educationLevel: educationLevel || 'undergraduate',
      universityName: universityName.trim(),
      collegeName: universityName.trim(),
      highSchoolName: educationLevel === 'high_school' ? universityName.trim() : undefined,
      degree: degree.trim(),
      fieldOfStudy: fieldOfStudy.trim(),
      primaryMajor: primaryMajor.trim() || fieldOfStudy.trim() || intendedMajor.trim(),
      intendedMajor: intendedMajor.trim() || primaryMajor.trim() || fieldOfStudy.trim(),
      intendedDegree: intendedDegree.trim() || degree.trim(),
      graduationYear: Number(graduationYear) || 2026,
      academicStatus,

      gpa: Number(gpa) || 3.0,
      maxGpa: Number(maxGpa) || 4.0,
      satScore: satScore !== '' ? Number(satScore) : null,
      greScore,
      ieltsScore,
      oLevelSubjects: oLevelInput.split(',').map(s => s.trim()).filter(Boolean),
      aLevelSubjects: aLevelInput.split(',').map(s => s.trim()).filter(Boolean),

      additionalSkills,
      projects,
      leadershipExperience: leadership,
      resumePdf,
      resumePdfName,
      profileCompletion: calculateProfileCompletion(),
      hasCompletedOnboarding: true,
      onboardingCompleted: true
    };

    try {
      if (updateProfile) {
        await updateProfile(updated);
      }

      // Sync backend if logged in
      try {
        const res = await authorizedFetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          const fresh = await res.json();
          setProfile(fresh);
        }
      } catch (err) {
        console.warn("Offline or guest mode profile save:", err);
      }

      // Award XP
      try {
        await authorizedFetch('/api/profile/reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: 15,
            actionName: 'Updated Profile Credentials',
            badgeToUnlock: 'Profile Architect'
          })
        });
      } catch (err) {
        console.warn("Local XP award fallback:", err);
      }

      dispatchProfileUpdate(updated as Profile);
      playAdvancementSound();
      setSuccess('Profile successfully saved! (+15 XP Claimed!)');

      setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err) {
      console.error("Save profile error:", err);
    }
  };

  // Image Upload Handler
  const handlePfpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    playClickSound();
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setProfilePicture(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePfp = () => {
    playClickSound();
    setProfilePicture('');
  };

  // Select Avatar Preset
  const handleSelectPresetAvatar = (emoji: string) => {
    playClickSound();
    setProfilePicture(emoji);
  };

  // PDF CV Upload Handler
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setPdfStatusMessage('⚠️ Only official .pdf documents are supported.');
      return;
    }

    playClickSound();
    setPdfUploading(true);
    setPdfStatusMessage('Reading document content...');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setResumePdf(base64);
      setResumePdfName(file.name);

      try {
        await authorizedFetch('/api/upload-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, base64 })
        });
      } catch (err) {
        console.warn("Local PDF store fallback:", err);
      }

      setPdfStatusMessage(`✅ Document "${file.name}" uploaded successfully!`);
      setPdfUploading(false);
      playAdvancementSound();
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePdf = () => {
    playClickSound();
    setResumePdf('');
    setResumePdfName('');
    setPdfStatusMessage('');
  };

  // Dynamic skill/project/leadership handlers
  const handleAddSkill = () => {
    if (!newSkillItem.trim()) return;
    playClickSound();
    if (!additionalSkills.includes(newSkillItem.trim())) {
      setAdditionalSkills([...additionalSkills, newSkillItem.trim()]);
    }
    setNewSkillItem('');
  };

  const handleRemoveSkill = (skill: string) => {
    playClickSound();
    setAdditionalSkills(additionalSkills.filter(s => s !== skill));
  };

  const handleAddProject = () => {
    if (!newProjectItem.trim()) return;
    playClickSound();
    setProjects([...projects, newProjectItem.trim()]);
    setNewProjectItem('');
  };

  const handleRemoveProject = (index: number) => {
    playClickSound();
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleAddLeader = () => {
    if (!newLeaderItem.trim()) return;
    playClickSound();
    setLeadership([...leadership, newLeaderItem.trim()]);
    setNewLeaderItem('');
  };

  const handleRemoveLeader = (index: number) => {
    playClickSound();
    setLeadership(leadership.filter((_, i) => i !== index));
  };

  const toggleAcademicStatus = (option: string) => {
    playClickSound();
    if (academicStatus.includes(option)) {
      setAcademicStatus(academicStatus.filter(o => o !== option));
    } else {
      setAcademicStatus([...academicStatus, option]);
    }
  };

  // Calculate GPA Helper
  const handleApplyCalculatedGpa = () => {
    playClickSound();
    let computed = 3.5;
    if (calcType === 'letter') {
      const map: Record<string, number> = { 'A*': 4.0, 'A': 3.8, 'B': 3.3, 'C': 2.8, 'D': 2.0 };
      const valid = calcGrades.map(g => map[g] || 3.0);
      computed = valid.reduce((a, b) => a + b, 0) / valid.length;
    } else if (calcType === 'ib') {
      const map: Record<number, number> = { 7: 4.0, 6: 3.7, 5: 3.2, 4: 2.7, 3: 2.0 };
      const valid = calcIbScores.map(s => map[s] || 3.0);
      computed = valid.reduce((a, b) => a + b, 0) / valid.length;
    } else if (calcType === 'sat') {
      if (calcSatInput >= 1500) computed = 3.95;
      else if (calcSatInput >= 1400) computed = 3.75;
      else if (calcSatInput >= 1300) computed = 3.5;
      else if (calcSatInput >= 1200) computed = 3.2;
      else computed = 2.8;
    }

    setGpa(Number(computed.toFixed(2)));
    setShowGpaCalc(false);
  };

  return (
    <div className="space-y-6" id="scholarpath-candidate-profile">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mc-window border-4 border-black p-5 text-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
            <User className="w-5 h-5 text-stone-900 shrink-0" /> CANDIDATE PROFILE PORTFOLIO
          </h3>
          <p className="text-xs text-stone-700 font-sans mt-1">
            Manage your personal identity, avatar image, bio, and academic credentials for AI scholarship matching.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowWizard(!showWizard)}
          className="mc-btn font-press text-[9px] py-2 px-3 text-[#ffff55] flex items-center gap-1.5 uppercase shrink-0"
        >
          <GraduationCap className="w-4 h-4" /> {showWizard ? 'Close Scribe Wizard' : 'Launch Wizard'}
        </button>
      </motion.div>

      {/* Success Alert Banner */}
      {success && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-950 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4 text-[#55ff55] shrink-0 animate-bounce" />
          <span className="mc-text-shadow font-bold">{success}</span>
        </motion.div>
      )}

      {/* Profile Overview Card */}
      {profile && !showWizard && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#1e1c1b] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-4 text-stone-200"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar Preview Box */}
            <div className="w-20 h-20 bg-black border-4 border-[#ffff55] flex items-center justify-center shrink-0 overflow-hidden relative shadow-lg">
              {profilePicture ? (
                profilePicture.startsWith('data:') || profilePicture.startsWith('http') ? (
                  <img 
                    src={profilePicture} 
                    alt={fullName || 'Candidate'} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-4xl select-none">{profilePicture}</div>
                )
              ) : (
                <div className="text-4xl select-none">🧙‍♂️</div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-press text-sm text-[#ffff55] mc-text-shadow uppercase">{fullName || 'Candidate Pathfinder'}</h2>
                  <p className="text-xs text-stone-300 font-bold">{heroTitle || 'Scholarship Explorer'}</p>
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <span className="font-press text-[9px] bg-amber-950 border-2 border-[#ffaa00] text-[#ffaa00] px-2.5 py-1 uppercase">
                    Level {profile.level || 1}
                  </span>
                  <span className="font-press text-[9px] bg-cyan-950 border-2 border-[#55ffff] text-[#55ffff] px-2.5 py-1 uppercase">
                    {profile.points || 0} XP
                  </span>
                </div>
              </div>

              {(city || country) && (
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] text-stone-400">
                  <MapPin className="w-3.5 h-3.5 text-[#55ff55]" />
                  <span>{[city, country].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {bio && (
                <p className="text-xs text-stone-300 font-sans italic bg-black/30 p-2 border border-stone-800">
                  "{bio}"
                </p>
              )}
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="pt-2 border-t border-stone-800 space-y-1 font-mono">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-stone-300 uppercase flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-[#55ff55]" /> PROFILE COMPLETION METRIC:
              </span>
              <span className="text-[#55ff55] font-press text-[9px]">{calculateProfileCompletion()}%</span>
            </div>
            <div className="w-full bg-black border-2 border-black h-2.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${calculateProfileCompletion()}%` }}
              />
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="pt-2 border-t border-stone-800">
            <XpProgressBar 
              points={profile.points || 0} 
              level={profile.level || 1} 
            />
          </div>
        </motion.div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <span className="animate-spin text-2xl">⏳</span>
          <span className="mc-text-shadow">SYNCHRONIZING CANDIDATE DOSSIER...</span>
        </div>
      ) : showWizard ? (
        <WizardContainer onComplete={() => { setShowWizard(false); fetchProfile(); }} />
      ) : (
        <div className="space-y-6">
          
          {/* TWO PRIMARY TAB BUTTONS: PERSONAL vs ACADEMIC */}
          <div className="flex border-4 border-black bg-[#1a1918] p-1.5 gap-2 font-press text-[10px]">
            <button
              type="button"
              onClick={() => { playClickSound(); setActiveTab('personal'); }}
              className={`flex-1 py-3 px-4 uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-[#322d29] text-[#ffff55] border-2 border-black [box-shadow:inset_-2px_-2px_0_#1a1918,inset_2px_2px_0_#555]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-[#252220]'
              }`}
            >
              <User className="w-4 h-4" /> Personal Profile
            </button>

            <button
              type="button"
              onClick={() => { playClickSound(); setActiveTab('academics'); }}
              className={`flex-1 py-3 px-4 uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'academics'
                  ? 'bg-[#322d29] text-[#ffff55] border-2 border-black [box-shadow:inset_-2px_-2px_0_#1a1918,inset_2px_2px_0_#555]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-[#252220]'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Academic Records
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'personal' ? (
              <motion.form 
                key="tab-personal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSaveProfile}
                className="bg-[#2c2c2c] border-4 border-black p-6 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-6 text-stone-200"
              >
                <div className="flex items-center gap-2 pb-3 border-b-2 border-black">
                  <User className="w-5 h-5 text-[#ffff55]" />
                  <h4 className="font-press text-xs text-[#ffff55] uppercase">Personal Details & Hero Skin</h4>
                </div>

                {/* Profile Picture Uploader & Presets */}
                <div className="space-y-3 bg-[#1e1c1b] border-2 border-black p-4">
                  <span className="font-mono text-xs font-bold text-stone-300 block uppercase">
                    1. Profile Photo & Avatar Preset
                  </span>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-16 h-16 bg-black border-2 border-[#ffff55] flex items-center justify-center shrink-0 overflow-hidden text-3xl">
                      {profilePicture ? (
                        profilePicture.startsWith('data:') || profilePicture.startsWith('http') ? (
                          <img src={profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{profilePicture}</span>
                        )
                      ) : (
                        <span>🧙‍♂️</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <input 
                        type="file" 
                        ref={pfpInputRef}
                        accept="image/*"
                        className="hidden" 
                        onChange={handlePfpUpload}
                      />
                      <button
                        type="button"
                        onClick={() => pfpInputRef.current?.click()}
                        className="mc-btn py-2 px-3 text-[10px] text-[#55ff55] flex items-center gap-1.5 uppercase cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Photo
                      </button>

                      {profilePicture && (
                        <button
                          type="button"
                          onClick={handleRemovePfp}
                          className="font-press text-[9px] py-2 px-3 bg-red-950 hover:bg-red-900 border-2 border-red-600 text-red-200 uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Preset Avatars */}
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-stone-400 block mb-2">
                      Or select a quick avatar icon:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(preset.emoji)}
                          className="bg-[#141414] hover:bg-[#333] border-2 border-black p-2 text-xl cursor-pointer active:scale-95 transition-all"
                          title={preset.name}
                        >
                          {preset.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name & Hero Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">Full Name:</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">Hero Title / Tagline:</label>
                    <input
                      type="text"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="e.g. Future AI Researcher & Scholar"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>
                </div>

                {/* Country & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">Country of Origin:</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    >
                      {WORLD_COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">City / Region:</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. London or Boston"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-1.5 font-mono text-xs">
                  <label className="text-stone-400 font-bold uppercase text-[10px]">Candidate Mission Statement / Bio:</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your academic aspirations and research focus..."
                    className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                  />
                </div>

                {/* Social Links */}
                <div className="space-y-3 pt-2">
                  <span className="font-mono text-xs font-bold text-stone-300 block uppercase">
                    Social & Portfolio Connections:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="flex items-center gap-2 bg-[#141414] border-2 border-black p-2">
                      <Linkedin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="LinkedIn URL"
                        className="bg-transparent outline-none text-stone-200 text-xs w-full"
                      />
                    </div>

                    <div className="flex items-center gap-2 bg-[#141414] border-2 border-black p-2">
                      <Github className="w-4 h-4 text-purple-400 shrink-0" />
                      <input
                        type="url"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="GitHub URL"
                        className="bg-transparent outline-none text-stone-200 text-xs w-full"
                      />
                    </div>

                    <div className="flex items-center gap-2 bg-[#141414] border-2 border-black p-2">
                      <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
                      <input
                        type="url"
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        placeholder="Portfolio / Website URL"
                        className="bg-transparent outline-none text-stone-200 text-xs w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Personal Profile Button */}
                <div className="pt-4 border-t-2 border-black flex justify-end">
                  <button
                    type="submit"
                    className="mc-btn py-3 px-6 text-[10px] text-[#ffff55] flex items-center gap-2 uppercase cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Personal Profile
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="tab-academics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSaveProfile}
                className="bg-[#2c2c2c] border-4 border-black p-6 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-6 text-stone-200"
              >
                <div className="flex items-center gap-2 pb-3 border-b-2 border-black">
                  <BookOpen className="w-5 h-5 text-[#ffff55]" />
                  <h4 className="font-press text-xs text-[#ffff55] uppercase">Academic Records & Qualifications</h4>
                </div>

                {/* Education Level & University */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">Education Level:</label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    >
                      <option value="high_school">High School / Secondary</option>
                      <option value="undergraduate">Undergraduate Student</option>
                      <option value="graduate">Postgraduate / Master's</option>
                      <option value="phd">Doctoral / PhD Scholar</option>
                      <option value="other">Other Educational Track</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">School / University Name:</label>
                    <input
                      type="text"
                      value={universityName}
                      onChange={(e) => setUniversityName(e.target.value)}
                      placeholder="e.g. Imperial College London"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>
                </div>

                {/* Degree & Field of Study */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">Current Degree / Qualification:</label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="e.g. B.Sc. Computer Science"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">Primary Major / Field:</label>
                    <input
                      type="text"
                      value={fieldOfStudy}
                      onChange={(e) => {
                        setFieldOfStudy(e.target.value);
                        setPrimaryMajor(e.target.value);
                      }}
                      placeholder="e.g. Artificial Intelligence"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">Graduation Year:</label>
                    <input
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(Number(e.target.value))}
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>
                </div>

                {/* Academic Status Toggle */}
                <div className="space-y-2 font-mono text-xs">
                  <label className="text-stone-400 font-bold uppercase text-[10px] block">Academic Status:</label>
                  <div className="flex flex-wrap gap-2">
                    {ACADEMIC_STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => toggleAcademicStatus(status)}
                        className={`py-1.5 px-3 border-2 border-black text-xs cursor-pointer transition-all ${
                          academicStatus.includes(status)
                            ? 'bg-amber-950 text-[#ffaa00] border-amber-600 font-bold'
                            : 'bg-[#141414] text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {academicStatus.includes(status) ? '✓ ' : ''}{status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GPA & GPA Converter */}
                <div className="bg-[#1e1c1b] border-2 border-black p-4 space-y-4 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="font-bold text-stone-300 uppercase">Grade Point Average (GPA):</span>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setShowGpaCalc(!showGpaCalc); }}
                      className="mc-btn py-1 px-3 text-[9px] text-[#ffff55] flex items-center gap-1 uppercase cursor-pointer"
                    >
                      <Calculator className="w-3.5 h-3.5" /> {showGpaCalc ? 'Close Converter' : 'GPA Converter Calculator'}
                    </button>
                  </div>

                  {showGpaCalc && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-black/40 border border-stone-700 p-3 space-y-3 text-xs"
                    >
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCalcType('letter')}
                          className={`py-1 px-2 border text-[10px] uppercase ${calcType === 'letter' ? 'bg-[#ffaa00] text-black font-bold' : 'text-stone-400'}`}
                        >
                          Letter Grades (A*, A, B)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalcType('ib')}
                          className={`py-1 px-2 border text-[10px] uppercase ${calcType === 'ib' ? 'bg-[#ffaa00] text-black font-bold' : 'text-stone-400'}`}
                        >
                          IB (1 - 7 Scale)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalcType('sat')}
                          className={`py-1 px-2 border text-[10px] uppercase ${calcType === 'sat' ? 'bg-[#ffaa00] text-black font-bold' : 'text-stone-400'}`}
                        >
                          SAT Scale
                        </button>
                      </div>

                      {calcType === 'sat' ? (
                        <div className="flex items-center gap-2">
                          <span>SAT Score:</span>
                          <input
                            type="number"
                            value={calcSatInput}
                            onChange={(e) => setCalcSatInput(Number(e.target.value))}
                            className="bg-[#141414] border p-1 text-stone-200 w-24"
                          />
                        </div>
                      ) : (
                        <p className="text-[10px] text-stone-400">
                          Automated GPA conversion algorithm configured for international qualification equivalency.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleApplyCalculatedGpa}
                        className="mc-btn py-1 px-3 text-[9px] text-[#55ff55] uppercase cursor-pointer"
                      >
                        Apply Calculated GPA
                      </button>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-400 block text-[10px] uppercase font-bold">Cumulative GPA:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={maxGpa}
                        value={gpa}
                        onChange={(e) => setGpa(Number(e.target.value))}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55] text-stone-200 w-full"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 block text-[10px] uppercase font-bold">Max Scale:</label>
                      <input
                        type="number"
                        step="0.1"
                        value={maxGpa}
                        onChange={(e) => setMaxGpa(Number(e.target.value))}
                        className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55] text-stone-200 w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Standardized Tests */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">SAT Composite Score:</label>
                    <input
                      type="number"
                      value={satScore}
                      onChange={(e) => setSatScore(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="e.g. 1480"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">GRE Composite Score:</label>
                    <input
                      type="text"
                      value={greScore}
                      onChange={(e) => setGreScore(e.target.value)}
                      placeholder="e.g. 325"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">IELTS / TOEFL Score:</label>
                    <input
                      type="text"
                      value={ieltsScore}
                      onChange={(e) => setIeltsScore(e.target.value)}
                      placeholder="e.g. 8.0 Band"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>
                </div>

                {/* Subjects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">O-Level / IGCSE Subjects (comma separated):</label>
                    <input
                      type="text"
                      value={oLevelInput}
                      onChange={(e) => setOLevelInput(e.target.value)}
                      placeholder="Maths (A*), Physics (A), CS (A*)"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-400 font-bold uppercase text-[10px]">A-Level / IB Subjects (comma separated):</label>
                    <input
                      type="text"
                      value={aLevelInput}
                      onChange={(e) => setALevelInput(e.target.value)}
                      placeholder="Maths HL (7), Further Maths (A*)"
                      className="bg-[#141414] border-2 border-black p-2.5 outline-none focus:border-[#ffff55] text-stone-200"
                    />
                  </div>
                </div>

                {/* Skills Tagging */}
                <div className="space-y-2 font-mono text-xs">
                  <label className="text-stone-400 font-bold uppercase text-[10px] block">Technical Skills & Competencies:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {additionalSkills.map((skill) => (
                      <span key={skill} className="bg-emerald-950 border border-emerald-600 text-emerald-300 py-1 px-2 text-xs flex items-center gap-1">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-400 cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillItem}
                      onChange={(e) => setNewSkillItem(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                      placeholder="Add skill (e.g. Python, Machine Learning)..."
                      className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55] text-stone-200 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="mc-btn py-2 px-4 text-[10px] text-[#ffff55] uppercase cursor-pointer"
                    >
                      + Add Tag
                    </button>
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-2 font-mono text-xs">
                  <label className="text-stone-400 font-bold uppercase text-[10px] block">Key Projects & Research:</label>
                  <div className="space-y-1.5 mb-2">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="bg-[#141414] border border-stone-800 p-2 flex justify-between items-center text-xs">
                        <span>• {proj}</span>
                        <button type="button" onClick={() => handleRemoveProject(idx)} className="text-red-400 hover:text-red-300 cursor-pointer">Remove</button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProjectItem}
                      onChange={(e) => setNewProjectItem(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProject(); } }}
                      placeholder="Add project title or link..."
                      className="bg-[#141414] border-2 border-black p-2 outline-none focus:border-[#ffff55] text-stone-200 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="mc-btn py-2 px-4 text-[10px] text-[#ffff55] uppercase cursor-pointer"
                    >
                      + Add Project
                    </button>
                  </div>
                </div>

                {/* CV Attachment */}
                <div className="space-y-2 bg-[#1e1c1b] border-2 border-black p-4 font-mono text-xs">
                  <label className="text-stone-300 font-bold uppercase text-[10px] block">Curriculum Vitae (CV) Document Attachment:</label>
                  
                  {resumePdfName ? (
                    <div className="flex items-center justify-between bg-[#141414] border border-stone-700 p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#55ff55]" />
                        <span className="text-stone-200 font-bold">{resumePdfName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        className="font-press text-[9px] py-1.5 px-3 bg-red-950 border border-red-600 text-red-200 uppercase cursor-pointer"
                      >
                        Delete Document
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={pdfInputRef}
                        accept="application/pdf"
                        className="hidden"
                        onChange={handlePdfUpload}
                      />
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        disabled={pdfUploading}
                        className="mc-btn py-2.5 px-4 text-[10px] text-[#ffff55] uppercase flex items-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" /> {pdfUploading ? 'Uploading PDF...' : 'Upload Official PDF Resume'}
                      </button>
                    </div>
                  )}

                  {pdfStatusMessage && (
                    <p className="text-[10px] text-[#55ff55]">{pdfStatusMessage}</p>
                  )}
                </div>

                {/* Submit Academic Records Button */}
                <div className="pt-4 border-t-2 border-black flex justify-end">
                  <button
                    type="submit"
                    className="mc-btn py-3 px-6 text-[10px] text-[#ffff55] flex items-center gap-2 uppercase cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Academic Records
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}
