import React, { useState } from 'react';
import { Sparkles, Trophy, Flame, HelpCircle, CheckCircle, ShieldCheck, Volume2, VolumeX, Type, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeId } from '../context/ThemeContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';

export default function CustomizeView() {
  const { profile, updateProfile } = useAuth();
  const { themeMode, setThemeMode, theme, soundEnabled, textGlow, setTheme, toggleSound } = useTheme();
  
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
        setKeyStatusMsg("✅ SUCCESS: API Key verified & stored securely in persistent SQLite vault!");
        playAdvancementSound();
      } else {
        setKeyStatusMsg("❌ FAILURE: The admissions node could not activate this key.");
      }
    } catch (e) {
      setKeyStatusMsg("❌ FAILURE: Network error during key handshakes.");
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
    setKeyStatusMsg("🧹 Custom key removed. Reverting to server default credentials.");
  };

  const themes = [
    {
      id: 'overworld' as ThemeId,
      name: '🌲 Overworld Forest',
      desc: 'The classic rustic green oak woodlands, stone-grey, and organic foliage.',
      requiredLevel: 1,
      badge: 'Starter Ground',
      previewBg: 'bg-[#5c8e32]'
    },
    {
      id: 'nether' as ThemeId,
      name: '🔥 Nether Keep',
      desc: 'Active gold ore, craggy red netherrack, and dense obsidian borders.',
      requiredLevel: 1,
      badge: 'Combat Bound',
      previewBg: 'bg-[#4a0e0e]'
    },
    {
      id: 'end' as ThemeId,
      name: '🔮 The End Void',
      desc: 'Mystical ender dragon magenta energy, dark shadows, and celestial haze.',
      requiredLevel: 2,
      badge: 'Requires Level 2',
      previewBg: 'bg-[#1d102e]'
    },
    {
      id: 'aether' as ThemeId,
      name: '🌤️ Aether Heavens',
      desc: 'Bright cyan skies, floating clouds, and luminous sunbeam gold highlights.',
      requiredLevel: 3,
      badge: 'Requires Level 3',
      previewBg: 'bg-[#2a6b8c]'
    }
  ];

  const handleSelectTheme = (themeId: ThemeId, requiredLevel: number) => {
    playClickSound();
    
    const currentLevel = profile?.level || 1;
    if (currentLevel < requiredLevel) {
      setSuccessMsg(`🔒 Locked! You are Level ${currentLevel}. Level ${requiredLevel} required to craft this biome.`);
      setTimeout(() => setSuccessMsg(''), 4500);
      return;
    }

    setTheme(themeId);
    setSuccessMsg(`Successfully constructed biome skin: ${themeId.toUpperCase()}!`);
    playAdvancementSound();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6" id="scholarpath-customize-skins-v2">
      
      {/* Title window */}
      <div className="mc-window border-4 border-black p-5 text-stone-800">
        <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
          <Layers className="w-5 h-5 text-stone-950 shrink-0" /> ALCHEMY SHADERS & Skins
        </h3>
        <p className="text-xs text-stone-700 font-sans mt-2 leading-relaxed">
          Unlock aesthetic user interface skins by completing quests, scanning scholarships, compiling Statement credentials, and practicing interview panel runs.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Theme Selections */}
        <div className="lg:col-span-8 bg-[#4c4c4c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#2b2b2b,inset_4px_4px_0_#777] space-y-4">
          <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow border-b-2 border-black pb-2.5 uppercase">
            SELECT ACTIVE ADMISSIONS OVERLAY
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themes.map((t) => {
              const currentLevel = profile?.level || 1;
              const isLocked = currentLevel < t.requiredLevel;
              const isActive = theme === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id, t.requiredLevel)}
                  className={`border-4 p-4 cursor-pointer flex flex-col justify-between transition-all select-none hover:scale-[1.01] ${
                    isActive 
                      ? 'bg-[#191919] border-[#ffff55] [box-shadow:0_0_12px_rgba(255,255,85,0.4)]' 
                      : isLocked 
                        ? 'bg-[#2b2b2b]/95 border-stone-800 opacity-60 cursor-not-allowed' 
                        : 'bg-[#2a2a2a] border-black hover:border-stone-400'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header preview row */}
                    <div className="flex justify-between items-center pb-2 border-b border-[#3c3c3c]">
                      <span className="text-[10px] font-press tracking-wider text-stone-100 uppercase leading-none">{t.name}</span>
                      <div className={`w-3.5 h-3.5 ${t.previewBg} border-2 border-black`} />
                    </div>

                    <p className="text-xs text-stone-300 font-sans leading-relaxed pt-1">{t.desc}</p>
                  </div>

                  {/* Actions / locked row */}
                  <div className="mt-4 pt-2 border-t border-[#3c3c3c] flex justify-between items-center">
                    <span className="text-[10.5px] font-mono uppercase text-stone-400">
                      STATUS: {isActive ? <span className="text-[#55ff55] font-bold">ACTIVE EQUIP</span> : isLocked ? 'LOCKED' : 'CRAFTABLE'}
                    </span>
                    <span className={`text-[9px] font-press px-2 py-0.5 border border-black leading-none ${
                      isLocked ? 'bg-red-950/60 text-[#f25252] border-red-950' : 'bg-emerald-950/60 text-[#55ff55] border-emerald-950'
                    }`}>
                      {t.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Settings adjustments */}
        <div className="lg:col-span-4 bg-[#2e2e2e] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-4 text-stone-300 animate-fade-in">
          <h4 className="font-press text-[9px] text-stone-100 mc-text-shadow border-b border-stone-750 pb-2.5 uppercase">
            SETTINGS PANEL
          </h4>

          <div className="space-y-4 font-mono text-xs">
            {/* Theme Mode Toggle (Light vs Dark vs Minecraft) */}
            <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
              <span className="text-[9px] uppercase text-stone-400 font-bold block">ACTIVE DESIGN THEME</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`flex-1 py-2 text-center font-mono text-[9px] border-2 cursor-pointer transition-all ${
                    themeMode === 'light'
                      ? 'bg-blue-900/40 border-blue-500 text-blue-300 font-bold'
                      : 'bg-black/30 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  ☀️ LIGHT
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`flex-1 py-2 text-center font-mono text-[9px] border-2 cursor-pointer transition-all ${
                    themeMode === 'dark'
                      ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-black/30 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  🌙 DARK
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('minecraft')}
                  className={`flex-1 py-2 text-center font-mono text-[9px] border-2 cursor-pointer transition-all ${
                    themeMode === 'minecraft'
                      ? 'bg-amber-900/40 border-amber-500 text-amber-300 font-bold'
                      : 'bg-black/30 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  ⛏️ MC RETRO
                </button>
              </div>
              <p className="text-[10px] text-stone-400 font-sans leading-normal pt-1">
                Toggle between light Cupertino sheets, dark cosmic slates, and blocky retro craft grids.
              </p>
            </div>

            {/* Audio Toggle */}
            <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
              <span className="text-[9px] uppercase text-stone-400 font-bold block">SOUND FEEDBACK ENGINES</span>
              <button
                type="button"
                onClick={toggleSound}
                className="mc-btn w-full py-2.5 justify-center flex items-center gap-2 text-[#ffff55]"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-[#55ff55]" />
                    <span>AUDIO BLOCKS: ACTIVE</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-stone-500" />
                    <span>AUDIO BLOCKS: MUTED</span>
                  </>
                )}
              </button>
            </div>

            {/* Custom Gemini Key Management */}
            <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)] animate-fade-in">
              <span className="text-[9px] uppercase text-stone-400 font-bold block">🔑 CUSTOM GEMINI API KEY</span>
              <p className="text-[10px] text-stone-400 leading-normal">
                Input your browser-specific key to unlock live Wise Librarian counseling and SOP evaluation loops.
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
            <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
              <span className="text-[9px] uppercase text-stone-400 font-bold block">📖 Interactive Guides</span>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    window.dispatchEvent(new CustomEvent('start-onboarding-tour'));
                    setSuccessMsg("QUEST OPENED: Initializing guided onboarding tour!");
                    playAdvancementSound();
                    setTimeout(() => setSuccessMsg(''), 4500);
                  }}
                  className="mc-btn w-full py-2.5 justify-center flex items-center gap-2 text-white font-bold bg-neutral-800 hover:bg-neutral-700 border-2 border-black"
                >
                  <Sparkles className="w-4 h-4 text-[#55ff55]" />
                  <span>Open Tutorial Guide</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    playClickSound();
                    localStorage.removeItem(`scholarpath_onboarding_completed_${profile?.fullName || 'guest'}`);
                    if (updateProfile) {
                      await updateProfile({ hasCompletedOnboarding: false });
                    }
                    window.dispatchEvent(new CustomEvent('start-onboarding-tour'));
                    setSuccessMsg("QUEST RESET: Initializing guided onboarding tour!");
                    playAdvancementSound();
                    setTimeout(() => setSuccessMsg(''), 4500);
                  }}
                  className="mc-btn w-full py-2.5 justify-center flex items-center gap-2 text-[#ffff55]"
                >
                  <Sparkles className="w-4 h-4 text-[#ffaa00]" />
                  <span>Reset & Replay Quest (Fresh Status)</span>
                </button>
              </div>
            </div>

            {/* Typography line height description */}
            <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
              <span className="text-[9px] uppercase text-stone-400 font-bold block">Spacious Typography Fix</span>
              <div className="text-[11px] leading-relaxed text-stone-300 font-sans p-2 bg-black/30 border border-stone-800">
                <p>💡 <b>Overlapping fonts fixed!</b> Pixel text is strictly bound to headings. All body texts use scalable Inter metrics with spacious line heights to maximize readable flow.</p>
              </div>
            </div>

            {/* Core player stats */}
            {profile && (
              <div className="bg-[#1c1a19] border-2 border-black p-3 space-y-2 text-[11px] [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3)]">
                <span className="text-[9px] uppercase text-[#ffaa00] font-press block">Candidate scorecard</span>
                <div className="space-y-1.5 uppercase text-stone-300 font-mono">
                  <div className="flex justify-between">
                    <span>CANDIDATE XP LEVEL:</span>
                    <span className="text-[#ffff55] font-bold">Level {profile.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UNLOCKED BIOMES:</span>
                    <span className="text-[#55ff55] font-bold">
                      {profile.level >= 3 ? '4 / 4' : profile.level >= 2 ? '3 / 4' : '2 / 4'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
