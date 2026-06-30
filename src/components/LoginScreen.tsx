import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Sparkles, Play, ShieldAlert, Award, Star, Upload, FileText, 
  Trash2, Check, ArrowRight, Eye, EyeOff, Sparkle, Layers, GraduationCap, Laptop 
} from 'lucide-react';
import { playClickSound } from '../utils/sound';
import MinecraftWorld from './MinecraftWorld';

const COMMON_MAJORS = [
  "Computer Science",
  "Information Technology",
  "Cybersecurity",
  "Artificial Intelligence",
  "Data Science",
  "Software Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Biomedical Engineering",
  "Business Administration",
  "Economics & Finance",
  "Public Policy",
  "Other (Type custom major below...)"
];

const EDUCATION_LEVELS = [
  { value: "high_school", label: "High School / Secondary School" },
  { value: "college", label: "College / Community College" },
  { value: "undergraduate", label: "Undergraduate (Bachelor's)" },
  { value: "graduate", label: "Graduate (Master's)" },
  { value: "phd", label: "PhD / Doctoral" },
  { value: "other", label: "Other (Custom Level)" }
];

export default function LoginScreen() {
  const { login, register, guestLogin, authLoading, authError } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Profile data fields for signup
  const [fullName, setFullName] = useState('');
  const [educationLevel, setEducationLevel] = useState('undergraduate');
  const [customEducationLevel, setCustomEducationLevel] = useState('');
  
  // Dynamic Name indicators
  const [schoolInstitutionName, setSchoolInstitutionName] = useState('');
  
  // Custom Major combobox pattern
  const [majorDropdown, setMajorDropdown] = useState('Computer Science');
  const [customMajorText, setCustomMajorText] = useState('Computer Science');
  
  const [minorText, setMinorText] = useState('');
  const [gpaScore, setGpaScore] = useState('');
  const [gradYear, setGradYear] = useState('');

  // High School dynamic metrics
  const [oLevelInput, setOLevelInput] = useState('');
  const [aLevelInput, setALevelInput] = useState('');
  const [satScoreInput, setSatScoreInput] = useState('');

  // CV PDF Upload during signup (store as base64)
  const [resumePdf, setResumePdf] = useState<string>('');
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [fileDragging, setFileDragging] = useState(false);

  const [localError, setLocalError] = useState('');

  const isRetro = themeMode === 'minecraft';

  const handleTabChange = (tab: 'signin' | 'register') => {
    playClickSound();
    setActiveTab(tab);
    setLocalError('');
  };

  const handleThemeToggle = () => {
    playClickSound();
    const nextMode = isRetro ? 'dark' : 'minecraft';
    setThemeMode(nextMode);
  };

  const handleMajorDropdownChange = (val: string) => {
    setMajorDropdown(val);
    if (val !== "Other (Type custom major below...)") {
      setCustomMajorText(val);
    } else {
      setCustomMajorText("");
    }
  };

  // Base64 file parsing handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processResumeFile(file);
    }
  };

  const processResumeFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setLocalError("File size exceeds 2MB limit! Shrink your resume scroll weight.");
      return;
    }
    setResumeFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setResumePdf(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    if (activeTab === 'signin') {
      if (!username.trim() || !password.trim()) {
        setLocalError('Credential inputs cannot be blank!');
        return;
      }
      await login(username, password);
    } else {
      // Sign-up flow with validation
      if (!username.trim() || !password.trim() || !email.trim()) {
        setLocalError('Username, Email, and Password are required!');
        return;
      }

      // Username strength validation
      const usernameRegex = /^[a-zA-Z0-9_-]{3,16}$/;
      if (!usernameRegex.test(username.trim().toLowerCase())) {
        setLocalError('Username must be 3-16 characters and contain only letters, numbers, underscores, or hyphens.');
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        setLocalError('Please enter a valid email address!');
        return;
      }

      // Password complexity check
      if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        setLocalError('Password must be at least 8 characters and contain both letters and numbers.');
        return;
      }

      if (!fullName.trim()) {
        setLocalError('Please records your player Full Name!');
        return;
      }

      // Check Education level inputs
      const currentLevelLabel = EDUCATION_LEVELS.find(l => l.value === educationLevel)?.label || "Selected Level";

      let finalEducationName = educationLevel === 'other' 
        ? (customEducationLevel.trim() || "Other Level") 
        : currentLevelLabel;

      // GPA requirements are optional, validate only if filled
      let numericGpa = 3.5;
      if (educationLevel !== 'high_school' && gpaScore.trim() !== '') {
        const parsed = parseFloat(gpaScore);
        if (isNaN(parsed) || parsed < 0 || parsed > 4.0) {
          setLocalError('GPA score must be typed between 0.00 and 4.00!');
          return;
        }
        numericGpa = parsed;
      }

      // High school SAT validation optional
      let satVal: number | null = null;
      if (educationLevel === 'high_school' && satScoreInput.trim() !== '') {
        const checkSat = parseInt(satScoreInput);
        if (isNaN(checkSat) || checkSat < 400 || checkSat > 1600) {
          setLocalError('SAT scores must match valid scales (400 to 1600)!');
          return;
        }
        satVal = checkSat;
      }

      // Map to save extra fields in local profile variables
      const extraFields = {
        educationLevel: finalEducationName,
        highSchoolName: educationLevel === 'high_school' ? (schoolInstitutionName.trim() || "Undeclared High School") : "",
        collegeName: educationLevel !== 'high_school' ? (schoolInstitutionName.trim() || "Undeclared Institution") : "",
        primaryMajor: educationLevel !== 'high_school' ? (customMajorText.trim() || "General Studies") : "High School Curriculum",
        secondaryMajor: "",
        minor: educationLevel !== 'high_school' ? minorText.trim() : "",
        graduationYear: gradYear.trim() ? (parseInt(gradYear) || 2027) : 2027,
        resumePdf: resumePdf || "",
        satScore: satVal,
        oLevelSubjects: oLevelInput ? oLevelInput.split(',').map(s => s.trim()).filter(Boolean) : [],
        aLevelSubjects: aLevelInput ? aLevelInput.split(',').map(s => s.trim()).filter(Boolean) : [],
      };

      // Store flag inside local storage for the Post-Signup onboarding Welcome Wizard
      localStorage.setItem('scholarpath_show_welcome_wizard', 'true');

      // Trigger standard Context signup
      await register(
        username, 
        password, 
        email,
        fullName, 
        educationLevel === 'high_school' ? '4.00' : (gpaScore.trim() || '3.75'), 
        educationLevel !== 'high_school' ? (customMajorText.trim() || 'General Studies') : 'High School Curriculum',
        extraFields
      );
    }
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center overflow-auto py-12 px-4 select-none ${
      isRetro ? 'font-mono' : 'font-sans bg-slate-950 text-slate-100'
    }`}>
      {/* Dynamic 3D Environment Background */}
      <MinecraftWorld />

      {/* Floating Theme Mode Switcher in top right corner */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          type="button"
          onClick={handleThemeToggle}
          className={`flex items-center gap-2 text-[10px] uppercase font-bold py-2 px-3 tracking-wide cursor-pointer transition-all ${
            isRetro
              ? 'mc-btn text-[#55ffff]'
              : 'bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 text-indigo-300 hover:bg-slate-800'
          }`}
        >
          {isRetro ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>🛰️ MODERN COMPASS SKIN</span>
            </>
          ) : (
            <>
              <Laptop className="w-3.5 h-3.5 text-[#ffff55]" />
              <span className="font-mono text-xs">📦 MINECRAFT RETRO COMPASS</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container Card panel */}
      <div className={`relative w-full max-w-xl z-10 transition-all duration-300 ${
        isRetro 
          ? 'bg-[#2c2c2c] border-[6px] border-black p-6 [box-shadow:inset_-6px_-6px_0_#141414,inset_6px_6px_0_#555,0_20px_40px_rgba(0,0,0,0.8)]'
          : 'bg-slate-900/85 backdrop-blur-xl border border-slate-800/80 p-8 shadow-2xl shadow-indigo-950/40 relative'
      }`}>
        
        {/* Glow border decoration for Modern theme */}
        {!isRetro && (
          <div className="absolute inset-0 border border-indigo-500/20 pointer-events-none animate-pulse" />
        )}

        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <span className={`block font-bold uppercase tracking-widest text-center ${
            isRetro 
              ? 'font-press text-[9px] text-[#ffaa00] animate-pulse'
              : 'text-xs text-indigo-400 bg-indigo-950/50 py-1 px-3 border border-indigo-900/40 w-fit mx-auto'
          }`}>
            🌌 ScholarPath Pathfinder Hub v3.3.0
          </span>
          <h1 className={`tracking-wider relative inline-block select-none ${
            isRetro
              ? 'font-press text-2xl text-[#ffff55] drop-shadow-[0_4px_0_#3f3f00]'
              : 'text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-indigo-200 to-teal-200 bg-clip-text text-transparent filter drop-shadow-md'
          }`}>
            SCHOLARPATH
          </h1>
          <p className={`uppercase ${
            isRetro ? 'text-[10px] text-stone-300' : 'text-xs text-slate-400 tracking-normal'
          }`}>
            Gamified Multi-User Fellowship Companion
          </p>
        </div>

        {/* Tab selector buttons */}
        <div className={`grid grid-cols-2 gap-2 mb-6 ${
          isRetro ? 'bg-[#141414] p-1 border-4 border-black' : 'bg-slate-950 p-1 border border-slate-800/50'
        }`}>
          <button
            type="button"
            onClick={() => handleTabChange('signin')}
            className={`py-2 px-3 text-[10px] uppercase font-bold cursor-pointer transition-all ${
              activeTab === 'signin'
                ? isRetro
                  ? 'bg-[#ffff55] text-black font-semibold'
                  : 'bg-indigo-600 text-white shadow-lg'
                : 'text-stone-400 hover:text-stone-200 bg-transparent'
            } ${isRetro ? 'font-press text-[9px]' : 'font-sans text-xs'}`}
          >
            Sign In
          </button>
          
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`py-2 px-3 text-[10px] uppercase font-bold cursor-pointer transition-all ${
              activeTab === 'register'
                ? isRetro
                  ? 'bg-[#55ff55] text-black font-semibold'
                  : 'bg-emerald-600 text-white shadow-lg'
                : 'text-stone-400 hover:text-stone-200 bg-transparent'
            } ${isRetro ? 'font-press text-[9px]' : 'font-sans text-xs'}`}
          >
            Create Pathfinder
          </button>
        </div>

        {/* System Error Logs */}
        {(authError || localError) && (
          <div className={`mb-5 p-3.5 border-4 leading-relaxed font-mono text-xs ${
            isRetro
              ? 'bg-red-950/40 border-[#ff5555] text-red-200'
              : 'bg-rose-950/30 border-rose-800 text-rose-200'
          }`}>
            ⚠️ [CRITICAL ERROR] - {localError || authError}
          </div>
        )}

        {/* Signup/Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username input */}
            <div className="space-y-1">
              <label className={`block uppercase font-bold ${isRetro ? 'text-[9px] text-stone-300' : 'text-xs text-slate-300'}`}>
                Player Username ID:
              </label>
              <input
                type="text"
                required
                maxLength={22}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Steve_Jobs, Jobs2025"
                className={`w-full focus:outline-none focus:ring-1 ${
                  isRetro
                    ? 'bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:border-[#ffff55] text-xs font-mono uppercase'
                    : 'bg-slate-950 border border-slate-800 p-2.5 text-slate-100 placeholder-slate-600 font-sans text-xs focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className={`block uppercase font-bold relative ${isRetro ? 'text-[9px] text-stone-300' : 'text-xs text-slate-300'}`}>
                Credential Key:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full focus:outline-none focus:ring-1 pr-10 ${
                    isRetro
                      ? 'bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:border-[#ffff55] text-xs font-mono'
                      : 'bg-slate-950 border border-slate-800 p-2.5 text-slate-100 placeholder-slate-600 font-sans text-xs focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Active Registration form criteria nested below */}
          {activeTab === 'register' && (
            <div className={`space-y-4 pt-4 border-t ${isRetro ? 'border-stone-800' : 'border-slate-800'}`}>
              
              {/* Email Address field */}
              <div className="space-y-1">
                <label className={`block uppercase font-bold ${isRetro ? 'text-[9px] text-stone-300' : 'text-xs text-slate-300'}`}>
                  Email Address:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. hello@gmail.com"
                  className={`w-full focus:outline-none focus:ring-1 ${
                    isRetro
                      ? 'bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:border-[#ffff55] text-xs font-sans'
                      : 'bg-slate-950 border border-slate-800 p-2.5 text-slate-100 placeholder-slate-600 font-sans text-xs focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
              </div>

              {/* Full Name field */}
              <div className="space-y-1">
                <label className={`block uppercase font-bold ${isRetro ? 'text-[9px] text-stone-300' : 'text-xs text-slate-300'}`}>
                  Academic Applicant Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Steve Jobs"
                  className={`w-full focus:outline-none focus:ring-1 ${
                    isRetro
                      ? 'bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:border-[#ffff55] text-xs font-sans'
                      : 'bg-slate-950 border border-slate-800 p-2.5 text-slate-100 placeholder-slate-600 font-sans text-xs focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
              </div>

              {/* Grid 2x2 for education level and institution details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Education Level dropdown block */}
                <div className="space-y-1">
                  <label className={`block uppercase font-bold ${isRetro ? 'text-[9px] text-stone-300' : 'text-xs text-slate-300'}`}>
                    Current Education Level:
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => {
                      setEducationLevel(e.target.value);
                      setSchoolInstitutionName(''); // clear to prevent accidental mismatch
                    }}
                    className={`w-full focus:outline-none ${
                      isRetro
                        ? 'bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:border-[#ffff55] text-xs font-mono'
                        : 'bg-slate-950 border border-slate-800 p-2.5 text-slate-100 font-sans text-xs focus:border-indigo-500'
                    }`}
                  >
                    {EDUCATION_LEVELS.map((el) => (
                      <option key={el.value} value={el.value}>{el.label}</option>
                    ))}
                  </select>
                </div>

                {/* Optional Custom level free-text entry */}
                {educationLevel === 'other' && (
                  <div className="space-y-1">
                    <label className={`block uppercase font-bold ${isRetro ? 'text-[9px] text-stone-300' : 'text-xs text-slate-300'}`}>
                      Specify Custom Academic Tier (Optional):
                    </label>
                    <input
                      type="text"
                      value={customEducationLevel}
                      onChange={(e) => setCustomEducationLevel(e.target.value)}
                      placeholder="e.g. Dual Enrollment / PostDoc..."
                      className={`w-full focus:outline-none ${
                        isRetro
                          ? 'bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:border-[#ffff55] text-xs'
                          : 'bg-slate-950 border border-slate-800 p-2.5 text-slate-100 font-sans text-xs focus:border-indigo-500'
                      }`}
                    />
                  </div>
                )}

                {/* 2. School/Institution Name Entry */}
                <div className="space-y-1">
                  <label className={`block uppercase font-bold ${isRetro ? 'text-[9px] text-stone-300' : 'text-xs text-slate-300'}`}>
                    {educationLevel === 'high_school' ? 'Secondary / High School Name (Optional):' : 'College / University Name (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={schoolInstitutionName}
                    onChange={(e) => setSchoolInstitutionName(e.target.value)}
                    placeholder={educationLevel === 'high_school' ? "e.g. Blue Hill High Academy" : "e.g. Stanford University"}
                    className={`w-full focus:outline-none ${
                      isRetro
                        ? 'bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:border-[#ffff55] text-xs'
                        : 'bg-slate-950 border border-slate-800 p-2.5 text-slate-100 font-sans text-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* Dynamic Sub-Forms based on level */}
              {educationLevel === 'high_school' ? (
                /* --- HIGH SCHOOL CURRICULAR SUB-FORM --- */
                <div className={`p-4 border-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 ${
                  isRetro ? 'border-stone-800' : 'border-slate-800'
                }`}>
                  <div className="space-y-1">
                    <label className={`block uppercase font-bold ${isRetro ? 'text-[8px] text-stone-400' : 'text-[11px] text-slate-400'}`}>
                      O-Level / GCSE Subjects:
                    </label>
                    <input
                      type="text"
                      value={oLevelInput}
                      onChange={(e) => setOLevelInput(e.target.value)}
                      placeholder="Math, Sci, Eng..."
                      className={`w-full focus:outline-none ${
                        isRetro
                          ? 'bg-[#141414] border-2 border-black p-2 text-stone-100 text-xs'
                          : 'bg-slate-950 border border-slate-800 p-2 text-slate-100 font-sans text-xs'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`block uppercase font-bold ${isRetro ? 'text-[8px] text-stone-400' : 'text-[11px] text-slate-400'}`}>
                      A-Level / AP Subjects:
                    </label>
                    <input
                      type="text"
                      value={aLevelInput}
                      onChange={(e) => setALevelInput(e.target.value)}
                      placeholder="Physics, CalcBC, Chem..."
                      className={`w-full focus:outline-none ${
                        isRetro
                          ? 'bg-[#141414] border-2 border-black p-2 text-stone-100 text-xs'
                          : 'bg-slate-950 border border-slate-800 p-2 text-slate-100 font-sans text-xs'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`block uppercase font-bold ${isRetro ? 'text-[8px] text-stone-400' : 'text-[11px] text-slate-400'}`}>
                      SAT Score (Optional):
                    </label>
                    <input
                      type="number"
                      min={400}
                      max={1600}
                      value={satScoreInput}
                      onChange={(e) => setSatScoreInput(e.target.value)}
                      placeholder="1540"
                      className={`w-full focus:outline-none ${
                        isRetro
                          ? 'bg-[#141414] border-2 border-black p-2 text-stone-100 text-xs'
                          : 'bg-slate-950 border border-slate-800 p-2 text-slate-100 font-sans text-xs'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                /* --- COLLEGE & UNIVERSITY CURRICULAR SUB-FORM --- */
                <div className={`p-4 border-2 space-y-4 bg-black/20 ${
                  isRetro ? 'border-stone-800' : 'border-slate-800'
                }`}>
                  {/* Combobox pattern major selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={`block uppercase font-bold ${isRetro ? 'text-[8px] text-stone-400' : 'text-[11px] text-slate-400'}`}>
                        Choose Curriculum Path (Optional):
                      </label>
                      <select
                        value={majorDropdown}
                        onChange={(e) => handleMajorDropdownChange(e.target.value)}
                        className={`w-full ${
                          isRetro
                            ? 'bg-[#141414] border-2 border-black p-2 text-stone-100 text-xs'
                            : 'bg-slate-950 border border-slate-800 p-2 text-slate-100 font-sans text-xs'
                        }`}
                      >
                        {COMMON_MAJORS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className={`block uppercase font-bold ${isRetro ? 'text-[8px] text-stone-400' : 'text-[11px] text-slate-400'}`}>
                        Confirm / Custom Major Title (Optional):
                      </label>
                      <input
                        type="text"
                        value={customMajorText}
                        onChange={(e) => setCustomMajorText(e.target.value)}
                        placeholder="e.g. Artificial Intelligence Engineering"
                        className={`w-full focus:outline-none ${
                          isRetro
                            ? 'bg-[#141414] border-2 border-black p-2 text-stone-100 text-xs'
                            : 'bg-slate-950 border border-slate-800 p-2 text-slate-100 font-sans text-xs'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Minor fields (optional) */}
                    <div className="space-y-1 col-span-2">
                      <label className={`block uppercase font-bold ${isRetro ? 'text-[8px] text-stone-400' : 'text-[11px] text-slate-400'}`}>
                        Minor Course (Optional):
                      </label>
                      <input
                        type="text"
                        value={minorText}
                        onChange={(e) => setMinorText(e.target.value)}
                        placeholder="e.g. Statistics"
                        className={`w-full focus:outline-none ${
                          isRetro
                            ? 'bg-[#141414] border-2 border-black p-2 text-stone-100 text-xs'
                            : 'bg-slate-950 border border-slate-800 p-2 text-slate-100 font-sans text-xs'
                        }`}
                      />
                    </div>

                    {/* Accurate GPA */}
                    <div className="space-y-1">
                      <label className={`block uppercase font-bold ${isRetro ? 'text-[8px] text-stone-400' : 'text-[11px] text-slate-400'}`}>
                        Current GPA (Optional):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.0"
                        max="4.0"
                        value={gpaScore}
                        onChange={(e) => setGpaScore(e.target.value)}
                        placeholder="3.85"
                        className={`w-full focus:outline-none ${
                          isRetro
                            ? 'bg-[#141414] border-2 border-black p-2 text-stone-100 text-xs'
                            : 'bg-slate-950 border border-slate-800 p-2 text-slate-100 font-sans text-xs focus:border-indigo-500'
                        }`}
                      />
                    </div>

                    {/* Graduation Year */}
                    <div className="space-y-1">
                      <label className={`block uppercase font-bold ${isRetro ? 'text-[8px] text-stone-400' : 'text-[11px] text-slate-400'}`}>
                        Grad Year (Optional):
                      </label>
                      <input
                        type="number"
                        min="2020"
                        max="2035"
                        value={gradYear}
                        onChange={(e) => setGradYear(e.target.value)}
                        placeholder="2027"
                        className={`w-full focus:outline-none ${
                          isRetro
                            ? 'bg-[#141414] border-2 border-black p-2 text-stone-100 text-xs'
                            : 'bg-slate-950 border border-slate-800 p-2 text-slate-100 font-sans text-xs focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* optional graduation year for High school as well */}
              {educationLevel === 'high_school' && (
                <div className="space-y-1">
                  <label className={`block uppercase font-bold ${isRetro ? 'text-[9px] text-stone-300' : 'text-xs text-slate-300'}`}>
                    High School Graduation Year (Optional):
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2035"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    placeholder="2027"
                    className={`w-full focus:outline-none ${
                      isRetro
                        ? 'bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:border-[#ffff55] text-xs'
                        : 'bg-slate-950 border border-slate-800 p-2.5 text-slate-100 font-sans text-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
              )}

              {/* CV / Resume PDF uploader with DRAG & DROP support */}
              <div className="space-y-1 pt-2">
                <label className={`block uppercase font-bold ${isRetro ? 'text-[9px] text-stone-300' : 'text-xs text-slate-300'}`}>
                  Attach Academic Resume (Optional):
                </label>
                
                <div 
                  onDragOver={(e) => { e.preventDefault(); setFileDragging(true); }}
                  onDragLeave={() => setFileDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setFileDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processResumeFile(file);
                  }}
                  className={`text-center border-2 border-dashed p-4 relative transition-all duration-250 ${
                    fileDragging 
                      ? isRetro 
                        ? 'border-[#55ff55] bg-[#55ff55]/10'
                        : 'border-emerald-500 bg-emerald-950/20'
                      : isRetro
                        ? 'border-stone-700 bg-black/30 hover:border-stone-500'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <input 
                    type="file"
                    id="cvSignUpUploader"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  
                  {resumePdf ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FileText className={`w-8 h-8 ${isRetro ? 'text-[#55ff55]' : 'text-emerald-400'}`} />
                      <span className={`text-[11px] font-bold block truncate max-w-xs ${isRetro ? 'text-[#55ff55]' : 'text-emerald-100'}`}>
                        {resumeFileName}
                      </span>
                      <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">
                        Loaded Successfully! (+50 XP potential)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setResumePdf('');
                          setResumeFileName('');
                        }}
                        className={`mt-2 p-1 text-[9px] flex items-center justify-center gap-1 text-red-400 hover:text-red-300 pointer-events-auto bg-black/40 border border-red-900/40 px-2`}
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>Discard Scroll</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Upload className={`w-7 h-7 text-stone-500`} />
                      <div className="space-y-1">
                        <p className={`font-bold block ${isRetro ? 'text-[10px] text-stone-200' : 'text-xs text-slate-300'}`}>
                          Drag Resume File Here or Click to Select
                        </p>
                        <p className="text-[10px] text-stone-500 uppercase">
                          PDF, DOC, DOCX • MAX 2MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Submit active action buttons */}
          <button
            type="submit"
            disabled={authLoading}
            className={`w-full mt-6 py-4 px-5 text-[10px] uppercase font-bold transition-all relative flex items-center justify-center cursor-pointer ${
              isRetro
                ? 'mc-btn text-[#ffff55] font-press text-[9px]'
                : 'w-full text-white font-semibold shadow-xl border border-slate-800 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:brightness-110 active:scale-[0.99] text-xs uppercase tracking-wider'
            }`}
          >
            {authLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-[#ffff55]" /> Booting Matrix Environment...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play className={`w-3.5 h-3.5 shrink-0 ${isRetro ? 'fill-[#ffff55]' : 'fill-white'}`} />
                {activeTab === 'signin' ? 'LOG IN & SPAWN CHARACTER' : 'SPAWN ACTIVE PATHFINDER'}
              </span>
            )}
          </button>
        </form>

        {/* Separator / Guest Login panel */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isRetro ? 'border-stone-800' : 'border-slate-800'}`} />
          </div>
          <span className={`relative px-4 text-[9px] uppercase font-bold font-press ${
            isRetro ? 'bg-[#2c2c2c] text-stone-500' : 'bg-[#131b2ef1] text-slate-500'
          }`}>OR</span>
        </div>

        <button
          type="button"
          onClick={() => { playClickSound(); guestLogin(); }}
          className={`w-full py-3.5 px-4 font-bold uppercase transition-all tracking-wide cursor-pointer ${
            isRetro
              ? 'mc-btn text-[#55ffff] font-press text-[9px]'
              : 'w-full bg-slate-950 hover:bg-slate-900 text-[#55ffff] border border-[#55ffff]/30 shadow-lg font-sans text-xs tracking-wider'
          }`}
        >
          🎮 SPAWN INSTANTLY AS GUEST
        </button>

        <p className={`text-center font-mono mt-4 leading-normal ${
          isRetro ? 'text-[9px] text-[#ffdd55] uppercase' : 'text-[11px] text-[#ffdd55]/80'
        }`}>
          *Registered players gain full cloud persistency, XP character levels, custom equipment badges, and live application tracking!
        </p>
      </div>

    </div>
  );
}
export { COMMON_MAJORS };
