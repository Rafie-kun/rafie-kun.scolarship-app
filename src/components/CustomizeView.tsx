import React, { useState } from 'react';
import { Sparkles, CheckCircle, Volume2, VolumeX, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';

export default function CustomizeView() {
  const { user, profile, updateProfile } = useAuth();
  const { soundEnabled, toggleSound } = useTheme();
  
  const [successMsg, setSuccessMsg] = useState('');
  const [customKeyInput, setCustomKeyInput] = useState(() => localStorage.getItem('scholarpath_custom_gemini_key') || '');
  const [keyStatusMsg, setKeyStatusMsg] = useState('');
  const [verifyingKey, setVerifyingKey] = useState(false);

  const handleVerifyAndSaveKey = async () => {
    playClickSound();
    if (!customKeyInput.trim()) {
      setKeyStatusMsg("Please paste a non-empty key!");
      return;
    }
    setVerifyingKey(true);
    setKeyStatusMsg("");

    try {
      const res = await fetch('/api/gemini/check-gemini-key', {
        headers: { 'x-gemini-key': customKeyInput }
      });
      const data = await res.json();
      if (data.hasKey) {
        localStorage.setItem('scholarpath_custom_gemini_key', customKeyInput.trim());
        if (updateProfile) {
          await updateProfile({ customGeminiKey: customKeyInput.trim() });
        }
        setKeyStatusMsg("✅ SUCCESS: API Key verified & saved!");
        playAdvancementSound();
      } else {
        setKeyStatusMsg("❌ FAILURE: The server could not verify this key.");
      }
    } catch (e) {
      setKeyStatusMsg("❌ FAILURE: Network error while verifying the key.");
    } finally {
      setVerifyingKey(false);
    }
  };

  const handleDeleteKey = async () => {
    playClickSound();
    localStorage.removeItem('scholarpath_custom_gemini_key');
    if (updateProfile) {
      await updateProfile({ customGeminiKey: '' });
    }
    setCustomKeyInput('');
    setKeyStatusMsg("🧹 Custom key removed. Using the server default.");
  };

  return (
    <div className="space-y-6" id="scholarpath-customize-skins-v2">
      
      {/* Title window */}
      <div className="mc-window border-4 border-black p-5 text-stone-800">
        <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
          <Layers className="w-5 h-5 text-stone-950 shrink-0" /> Settings & Preferences
        </h3>
        <p className="text-xs text-stone-700 font-sans mt-2 leading-relaxed">
          Manage your AI assistant connection, sounds, and replay the guided tour. Your progress and XP are saved automatically.
        </p>
      </div>

      {successMsg && (
        <div className={`border-4 border-black p-3.5 text-xs font-mono rounded-none flex items-center gap-2 ${
          successMsg.includes('Locked') 
            ? 'bg-red-950/40 border-red-500 text-red-450' 
            : 'bg-emerald-950/40 border-[#55ff55] text-[#55ff55]'
        }`}>
          <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
          <span className="mc-text-shadow uppercase font-bold">{successMsg}</span>
        </div>
      )}

      {/* Global Settings */}
      <div className="bg-[#2e2e2e] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-4 text-stone-300 animate-fade-in">
        <h4 className="font-press text-[9px] text-stone-100 mc-text-shadow border-b border-stone-750 pb-2.5 uppercase">
          SETTINGS PANEL
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Audio Toggle */}
          <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
            <span className="text-[9px] uppercase text-stone-400 font-bold block">SOUND EFFECTS</span>
            <button
              type="button"
              onClick={toggleSound}
              className="mc-btn w-full py-2.5 justify-center flex items-center gap-2 text-[#ffff55]"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#55ff55]" />
                  <span>SOUND: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-stone-500" />
                  <span>SOUND: OFF</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-stone-400 font-sans leading-normal">
              Click sounds and achievement effects.
            </p>
          </div>

          {/* Custom Gemini Key Management */}
          <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
            <span className="text-[9px] uppercase text-stone-400 font-bold block">🔑 YOUR GEMINI API KEY (OPTIONAL)</span>
            <p className="text-[10px] text-stone-400 leading-normal">
              Add your own Google Gemini key to power the AI assistant with your personal quota. Get one free at aistudio.google.com.
            </p>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Paste your Gemini AI key..."
                value={customKeyInput}
                onChange={(e) => setCustomKeyInput(e.target.value)}
                className="w-full bg-black/40 border-2 border-black p-2 text-stone-150 font-mono text-xs focus:outline-none focus:border-[#ffff55] rounded-none"
              />
              
              {keyStatusMsg && (
                <p className={`text-[10px] font-mono leading-relaxed uppercase font-bold ${
                  keyStatusMsg.includes('SUCCESS') ? 'text-[#55ff55]' : 'text-[#f25252]'
                }`}>
                  {keyStatusMsg}
                </p>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleVerifyAndSaveKey}
                  disabled={verifyingKey}
                  className="flex-1 py-1.5 text-center font-mono text-[9px] border-2 border-black cursor-pointer bg-neutral-800 hover:bg-neutral-750 text-[#ffff55] font-bold"
                >
                  {verifyingKey ? 'VERIFYING...' : 'SAVE & VERIFY'}
                </button>
                {localStorage.getItem('scholarpath_custom_gemini_key') && (
                  <button
                    type="button"
                    onClick={handleDeleteKey}
                    className="py-1.5 px-2.5 text-center font-mono text-[9px] border-2 border-black cursor-pointer bg-red-950/45 text-[#f25255]"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Onboarding Tour Replay */}
          <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)] md:col-span-2">
            <span className="text-[9px] uppercase text-stone-400 font-bold block">📖 Guided Tour</span>
            <p className="text-[10px] text-stone-400 leading-normal mb-1">
              New here? The guided tour walks you through every feature step by step.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  window.dispatchEvent(new CustomEvent('start-onboarding-tour'));
                  setSuccessMsg("GUIDED TOUR STARTED");
                  playAdvancementSound();
                  setTimeout(() => setSuccessMsg(''), 4500);
                }}
                className="mc-btn flex-1 py-2.5 justify-center flex items-center gap-2 text-white font-bold bg-neutral-800 hover:bg-neutral-700 border-2 border-black"
              >
                <Sparkles className="w-4 h-4 text-[#55ff55]" />
                <span>Start the Guided Tour</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  playClickSound();
                  localStorage.removeItem(`scholarpath_onboarding_completed_${user || 'guest'}`);
                  if (updateProfile) {
                    await updateProfile({ hasCompletedOnboarding: false });
                  }
                  window.dispatchEvent(new CustomEvent('start-onboarding-tour'));
                  setSuccessMsg("TOUR RESET - STARTING FROM STEP 1");
                  playAdvancementSound();
                  setTimeout(() => setSuccessMsg(''), 4500);
                }}
                className="mc-btn flex-1 py-2.5 justify-center flex items-center gap-2 text-[#ffff55]"
              >
                <Sparkles className="w-4 h-4 text-[#ffaa00]" />
                <span>Replay From the Beginning</span>
              </button>
            </div>
          </div>

          {/* Player stats */}
          {profile && (
            <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 text-[11px] [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)] md:col-span-2">
              <span className="text-[9px] uppercase text-[#ffaa00] font-press block">Your progress</span>
              <div className="space-y-1.5 uppercase text-stone-300 font-mono">
                <div className="flex justify-between">
                  <span>CURRENT LEVEL:</span>
                  <span className="text-[#ffff55] font-bold">Level {profile.level} ({profile.points} XP)</span>
                </div>
                <div className="flex justify-between">
                  <span>EARN COINS BY:</span>
                  <span className="text-[#55ff55]">Tracking scholarships, completing checklist steps & practicing interviews</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
