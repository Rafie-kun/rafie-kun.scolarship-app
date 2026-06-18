import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Play, ShieldAlert, Award, Star } from 'lucide-react';
import { playClickSound } from '../utils/sound';
import MinecraftWorld from './MinecraftWorld';

const MAJORS_OPTIONS = [
  "Computer Science",
  "Information Technology",
  "Information Systems",
  "Artificial Intelligence",
  "Data Science",
  "Mechanical Engineering",
  "Public Policy",
  "Business Administration"
];

export default function LoginScreen() {
  const { login, register, guestLogin, authLoading, authError } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gpa, setGpa] = useState('3.80');
  const [major, setMajor] = useState('Computer Science');
  const [localError, setLocalError] = useState('');

  const handleTabChange = (tab: 'signin' | 'register') => {
    playClickSound();
    setActiveTab(tab);
    setLocalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    if (!username.trim() || !password.trim()) {
      setLocalError('Player signature and credential keys are required!');
      return;
    }

    if (activeTab === 'signin') {
      await login(username, password);
    } else {
      if (!fullName.trim()) {
        setLocalError('Please record your character Full Name!');
        return;
      }
      const gpaNum = parseFloat(gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
        setLocalError('GPA score must be aligned between 0.00 and 4.00!');
        return;
      }
      await register(username, password, fullName, gpa, major);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center font-sans overflow-hidden py-12 px-4 select-none">
      
      {/* 3D Moving Minecraft Background is rendered fixed here */}
      <MinecraftWorld />

      {/* Launcher Panel Container */}
      <div className="relative w-full max-w-lg bg-[#2c2c2c] border-[6px] border-black p-6 [box-shadow:inset_-6px_-6px_0_#141414,inset_6px_6px_0_#555,0_20px_40px_rgba(0,0,0,0.8)] z-10">
        
        {/* Logo and Titles */}
        <div className="text-center mb-6 space-y-1">
          <span className="font-press text-[9px] uppercase tracking-widest text-[#ffaa00] animate-pulse font-extrabold block">
            🌌 ScholarPath Craft Terminal v2.5
          </span>
          <h1 className="font-press text-2xl text-[#ffff55] tracking-wider relative inline-block drop-shadow-[0_4px_0_#3f3f00] select-none">
            SCHOLARPATH
          </h1>
          <p className="font-mono text-[10px] text-stone-300 pt-1 leading-normal uppercase">
            Gamified Multi-User Fellowship Compass
          </p>
        </div>

        {/* Tab Selection Row */}
        <div className="grid grid-cols-2 gap-2 bg-[#141414] p-1 border-4 border-black mb-6">
          <button
            type="button"
            onClick={() => handleTabChange('signin')}
            className={`py-2 text-[9px] font-press uppercase cursor-pointer rounded-none transition-all ${
              activeTab === 'signin'
                ? 'bg-[#ffff55] text-black font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Sign In
          </button>
          
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`py-2 text-[9px] font-press uppercase cursor-pointer rounded-none transition-all ${
              activeTab === 'register'
                ? 'bg-[#55ff55] text-black font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Spawn Player
          </button>
        </div>

        {/* Dynamic Error notices */}
        {(authError || localError) && (
          <div className="mb-5 p-3 bg-red-950/40 border-4 border-[#ff5555] text-red-200 font-mono text-xs tracking-tight leading-relaxed">
            ⚠️ [LAUNCH ERROR] - {localError || authError}
          </div>
        )}

        {/* Input Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-[9px] font-press text-stone-300 block uppercase">Player Username ID:</span>
            <input
              type="text"
              required
              maxLength={22}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Steve_Craft, Arif2026..."
              className="w-full bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:outline-none focus:border-[#ffff55] text-xs uppercase rounded-none"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-press text-stone-300 block uppercase">Credential PassKey:</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:outline-none focus:border-[#ffff55] text-xs rounded-none"
            />
          </div>

          {/* Registration Extra criteria */}
          {activeTab === 'register' && (
            <div className="space-y-4 pt-2 border-t border-stone-700">
              <div className="space-y-1">
                <span className="text-[9px] font-press text-stone-300 block uppercase">Real Character Name:</span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arif Rahaman"
                  className="w-full bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:outline-none focus:border-[#ffff55] text-xs rounded-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-press text-stone-300 block uppercase">Academic GPA:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.0"
                    max="4.0"
                    required
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="3.85"
                    className="w-full bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:outline-none focus:border-[#ffff55] text-xs rounded-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-press text-stone-300 block uppercase">Intended Major:</span>
                  <select
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full bg-[#141414] border-4 border-black p-2.5 text-stone-100 focus:outline-none focus:border-[#ffff55] text-xs rounded-none"
                  >
                    {MAJORS_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Sign In / Register buttons */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full mc-btn mt-6 py-3.5 text-[10px] uppercase font-bold text-[#ffff55]"
          >
            {authLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" /> Booting World Node...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5 font-press text-[9px]">
                <Play className="w-3.5 h-3.5 shrink-0 fill-[#ffff55]" /> {activeTab === 'signin' ? 'LOG IN & SPAWN' : 'SPAWN ACTIVE PLAYER'}
              </span>
            )}
          </button>
        </form>

        {/* Separator / Guest Login */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-stone-800" /></div>
          <span className="relative bg-[#2c2c2c] px-3 text-[9px] font-press text-stone-500 uppercase">OR</span>
        </div>

        <button
          type="button"
          onClick={() => { playClickSound(); guestLogin(); }}
          className="w-full mc-btn py-3 text-[9px] font-press uppercase text-[#55ffff]"
        >
          🎮 SPAWN INSTANTLY AS GUEST
        </button>

        <p className="text-[9px] text-[#ffdd55] text-center font-mono mt-4 leading-normal uppercase">
          *Note: Real registered candidates get full, persistent state checking, customized badges, and isolated admissions tracking logs!
        </p>
      </div>

    </div>
  );
}
export { MAJORS_OPTIONS };
