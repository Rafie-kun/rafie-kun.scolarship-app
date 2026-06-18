import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, BookOpen, GraduationCap, Calculator, Award, ArrowRight, Save, User, Sparkles,
  Search, BookmarkCheck, Calendar, CheckSquare, Square, MessageSquare, Plus, CheckCircle,
  FolderDown, Building, Navigation, Globe, Menu, X, Coins, HelpCircle, Shield, Sword,
  Undo
} from 'lucide-react';

import OverviewRecommendationsView from './components/OverviewRecommendationsView';
import ScholarshipsView from './components/ScholarshipsView';
import UniversitiesView from './components/UniversitiesView';
import ApplicationsView from './components/ApplicationsView';
import WritingVaultView from './components/WritingVaultView';
import CounsellingView from './components/CounsellingView';
import CommunityView from './components/CommunityView';
import RoadmapView from './components/RoadmapView';
import MentorView from './components/MentorView';
import ProfileView from './components/ProfileView';
import ExportCenterView from './components/ExportCenterView';
import DreamUniversityView from './components/DreamUniversityView';
import CustomizeView from './components/CustomizeView';

import LoginScreen from './components/LoginScreen';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { playClickSound, playAdvancementSound } from './utils/sound';

// Dictionary containing styling palettes for unlockable Biomes (themes)
const getThemeStyling = (themeId: string) => {
  switch (themeId) {
    case 'nether':
      return {
        headerBg: 'bg-[#4a0e0e]',
        headerBorder: 'border-[#320a0a]',
        fringeBg: 'bg-[#f06214]',
        fringeBorder: 'border-[#b84306]',
        bodyBg: 'bg-[#1a0505]',
        panelBg: 'bg-[#291010]',
        boxShadow: '[box-shadow:inset_-4px_-4px_0_#140202,inset_4px_4px_0_#542525]',
        accentText: 'text-[#ff5555]',
        accentBgClass: 'bg-[#ff5555]',
        brandColor: 'text-[#ff5555]',
        hudXpFill: 'bg-[#ff5555]',
        hudColor: 'text-[#ff5555]',
        sidebarBorder: 'border-red-950',
        cardHover: 'hover:border-[#ff5555]',
        activeSlot: 'border-[#ff5555] bg-[#ff5555]/20',
        tagline: 'Deep Nether Fort Base'
      };
    case 'end':
      return {
        headerBg: 'bg-[#1d102e]',
        headerBorder: 'border-[#11081f]',
        fringeBg: 'bg-[#e337e9]',
        fringeBorder: 'border-[#a80bb8]',
        bodyBg: 'bg-[#0b0514]',
        panelBg: 'bg-[#211633]',
        boxShadow: '[box-shadow:inset_-4px_-4px_0_#0a0312,inset_4px_4px_0_#4d376e]',
        accentText: 'text-[#ff55ff]',
        accentBgClass: 'bg-[#ff55ff]',
        brandColor: 'text-[#ff55ff]',
        hudXpFill: 'bg-[#e337e9]',
        hudColor: 'text-[#ff55ff]',
        sidebarBorder: 'border-fuchsia-950',
        cardHover: 'hover:border-[#ff55ff]',
        activeSlot: 'border-[#ff55ff] bg-[#ff55ff]/20',
        tagline: 'Dimensional Void Terminal'
      };
    case 'aether':
      return {
        headerBg: 'bg-[#2d769c]',
        headerBorder: 'border-[#1a4a63]',
        fringeBg: 'bg-[#ffd000]',
        fringeBorder: 'border-[#cca600]',
        bodyBg: 'bg-[#0f2a3a]',
        panelBg: 'bg-[#1b4e6b]',
        boxShadow: '[box-shadow:inset_-4px_-4px_0_#0b1e2a,inset_4px_4px_0_#3e7fa6]',
        accentText: 'text-[#55ffff]',
        accentBgClass: 'bg-[#55ffff]',
        brandColor: 'text-[#55ffff]',
        hudXpFill: 'bg-[#55ffff]',
        hudColor: 'text-[#55ffff]',
        sidebarBorder: 'border-cyan-900',
        cardHover: 'hover:border-[#55ffff]',
        activeSlot: 'border-[#55ffff] bg-[#55ffff]/20',
        tagline: 'Floating High Above Celestial Clouds'
      };
    case 'overworld':
    default:
      return {
        headerBg: 'bg-[#4d3224]',
        headerBorder: 'border-[#3b271c]',
        fringeBg: 'bg-[#5c8e32]',
        fringeBorder: 'border-[#476e27]',
        bodyBg: 'bg-[#110f0d]',
        panelBg: 'bg-[#2c2927]',
        boxShadow: '[box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]',
        accentText: 'text-[#ffff55]',
        accentBgClass: 'bg-[#ffff55]',
        brandColor: 'text-[#ffff55]',
        hudXpFill: 'bg-[#55ff55]',
        hudColor: 'text-[#55ff55]',
        sidebarBorder: 'border-[#1b1918]',
        cardHover: 'hover:border-[#ffff55]',
        activeSlot: 'border-[#ffff55] bg-[#33ffff]/20',
        tagline: 'Oak Forest & Emerald Plains Biome'
      };
  }
};

export default function App() {
  const { isLoggedIn, profile, authLoading, logout } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();

  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const currentThemeConfig = getThemeStyling(theme);

  const handleTabChange = (tabId: string) => {
    playClickSound();
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    playClickSound();
    logout();
    setActiveTab('overview');
  };

  // Navigations directory menu hotbar mappings
  const navItems = [
    { id: 'overview', label: 'Quest Dashboard', mcName: 'Diamond Trophy', desc: 'View active targets, track scores, and claimed items', icon: Trophy, color: 'text-amber-400' },
    { id: 'scholarships', label: 'Loot Registry', mcName: 'Enchanted Golden Apple', desc: 'Browse matched international fellowships & stipends', icon: GraduationCap, color: 'text-yellow-400' },
    { id: 'universities', label: 'Target Keeps', mcName: 'Golden Citadel Spire', desc: 'Browse entry GPA benchmarks for global institutions', icon: Building, color: 'text-sky-400' },
    { id: 'applications', label: 'Quest Book', mcName: 'Redstone Ledger Registry', desc: 'Manage your active application checkpoints and deadlines', icon: BookmarkCheck, color: 'text-red-400' },
    { id: 'simulator', label: 'Alchemist Lab', mcName: 'Admissions Cauldron Brew', desc: 'Forecast acceptances margins with custom parameters', icon: Calculator, color: 'text-indigo-400' },
    { id: 'writing', label: 'Scroll Vault', mcName: 'Golden Writing Quill', desc: 'Evaluate & draft professional Statement documents', icon: Save, color: 'text-cyan-400' },
    { id: 'counselling', label: 'Wise Wizard', mcName: 'Tome of Guidance', desc: 'Speak to the librarian AI about ECTS matches', icon: BookOpen, color: 'text-emerald-400' },
    { id: 'learning', label: 'Navigator Compass', mcName: 'Chronometer Compass', desc: 'Structured timeline maps for global admission stages', icon: Navigation, color: 'text-orange-400' },
    { id: 'community', label: 'Tavern Forum', mcName: 'Broadcasting Beacon', desc: 'Interact with fellow explorers regarding research meta', icon: MessageSquare, color: 'text-purple-400' },
    { id: 'mentors', label: 'Alumni Guild', mcName: 'Master Guide Scroll', desc: 'Consult with vetting alumni from top fellowship chains', icon: Award, color: 'text-pink-400' },
    { id: 'customize', label: 'Skins & Biomes', mcName: 'Active Shader Pack', desc: 'Mute sounds, tune layout densities & change biomes', icon: Sparkles, color: 'text-[#ffff55] animate-pulse' },
    { id: 'export', label: 'Export Blueprints', mcName: 'Empty Map Atlas Scroll', desc: 'Convert applicant records into persistent backups', icon: FolderDown, color: 'text-stone-300' },
    { id: 'profile', label: 'Hero Skin Name', mcName: 'Player Badge Slate', desc: 'Configure candidate GPAs, nationality and certifications', icon: User, color: 'text-teal-400' }
  ];

  // Map active Tab to visual layouts
  const renderSandbox = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewRecommendationsView onNavigate={(view) => setActiveTab(view)} />;
      case 'scholarships':
        return <ScholarshipsView />;
      case 'universities':
        return <UniversitiesView />;
      case 'applications':
        return <ApplicationsView />;
      case 'simulator':
        return <DreamUniversityView />;
      case 'writing':
        return <WritingVaultView />;
      case 'counselling':
        return <CounsellingView />;
      case 'community':
        return <CommunityView />;
      case 'learning':
        return <RoadmapView />;
      case 'mentors':
        return <MentorView />;
      case 'customize':
        if (!profile) return null;
        return <CustomizeView />;
      case 'export':
        return <ExportCenterView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <OverviewRecommendationsView onNavigate={(view) => setActiveTab(view)} />;
    }
  };

  // Heart bars graphics representing student scores
  const renderHealthHearts = (gpa: number, maxGpa: number) => {
    const ratio = gpa / (maxGpa || 4);
    const totalHearts = 10;
    const filledHeartsCount = Math.min(10, Math.ceil(ratio * totalHearts));
    const hearts = [];
    for (let i = 1; i <= totalHearts; i++) {
      if (i <= filledHeartsCount) {
        hearts.push(
          <span 
            key={i} 
            className="text-red-500 text-lg drop-shadow-md cursor-help hover:scale-125 transition-transform" 
            title={`Academic Force: GPA ${gpa}/${maxGpa}`}
          >
            ❤️
          </span>
        );
      } else {
        hearts.push(<span key={i} className="text-stone-800 text-lg opacity-40">🖤</span>);
      }
    }
    return hearts;
  };

  // Shield indices representing qualifications
  const renderArmorShields = () => {
    const count = (profile?.projects?.length || 0) + (profile?.leadershipExperience?.length || 0);
    const shieldCount = Math.min(10, Math.max(1, count));
    const shields = [];
    for (let i = 1; i <= 10; i++) {
      if (i <= shieldCount) {
        shields.push(<Shield key={i} className="w-4.5 h-4.5 text-cyan-400 shrink-0 fill-cyan-400" />);
      } else {
        shields.push(<Shield key={i} className="w-4.5 h-4.5 text-stone-700 opacity-20 shrink-0" />);
      }
    }
    return shields;
  };

  const getEquipmentWeapon = () => {
    const deg = (profile?.intendedDegree || '').toLowerCase();
    if (deg.includes('ph') || deg.includes('doctor')) {
      return { name: 'Netherite Scholar Greatsword', rating: 'Relic V', icon: Sword, color: 'text-purple-400 animate-pulse' };
    }
    if (deg.includes('master') || deg.includes('msc')) {
      return { name: 'Diamond Scholar Battleaxe', rating: 'Master Class III', icon: Sword, color: 'text-cyan-400 font-bold' };
    }
    return { name: 'Iron Scholar Dagger', rating: 'Starter Tier I', icon: Sword, color: 'text-stone-300' };
  };

  // Securely lock application view until authorization checking resolves
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#110f0d] flex flex-col items-center justify-center font-press text-[11px] text-[#ffff55] gap-3">
        <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
        <span className="mc-text-shadow">RESPAWNING SCHOLAR STATUS...</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const currentWeapon = getEquipmentWeapon();

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${
      themeMode === 'minecraft' 
        ? `text-stone-200 ${currentThemeConfig.bodyBg}` 
        : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
    }`} id="scholarpath-main-container">
      
      {/* Minecraft Block Header Band */}
      <header className={`${currentThemeConfig.headerBg} border-b-8 ${currentThemeConfig.headerBorder} text-stone-100 sticky top-0 z-50 select-none pb-1 shadow-2xl`}>
        
        {/* Visual biome colored fringe block index at very top of header */}
        <div className={`h-3 w-full ${currentThemeConfig.fringeBg} border-b ${currentThemeConfig.fringeBorder}`} />
        
        <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden mc-btn p-2"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 ml-1" /> : <Menu className="w-4 h-4 ml-1" />}
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-800 border-4 border-black flex items-center justify-center font-press text-[#ffff55] text-xs shadow-inner [box-shadow:inset_-3px_-3px_0_#141414,inset_3px_3px_0_#555]">
                ⛏️
              </div>
              <div className="space-y-1">
                <h1 className="font-press text-sm tracking-widest text-[#ffff55] mc-text-shadow leading-none flex items-center gap-1.5">
                  SCHOLARPATH <span className="font-sans text-[10px] uppercase font-bold text-[#aaaaaa] tracking-normal pt-1">Minecraft Edition</span>
                </h1>
                <span className="text-[12px] font-mono text-stone-350 leading-none block font-semibold pt-1">
                  Biome: <span className="text-[#a586ff] font-bold">{currentThemeConfig.tagline}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Epic Minecraft HUD levels XP bar centered right inside the top bar */}
          <div className="flex flex-col items-center gap-2 w-full max-w-sm shrink-0">
            <div className="flex justify-between w-full text-[12px] font-mono text-[#55ff55] font-bold uppercase select-none">
              <span className="font-press text-[9px] text-[#ffea00] mc-text-shadow flex items-center gap-1 leading-none pt-1">
                <Trophy className="w-3.5 h-3.5" /> Level {profile.level} Player
              </span>
              <span>{profile.points} / {profile.level * 100} XP</span>
            </div>
            
            <div className="w-full mc-xp-bar border-4 border-black max-h-[16px] h-3">
              <div 
                className={`${currentThemeConfig.hudXpFill} h-full transition-all duration-700 ease-out`} 
                style={{ width: `${Math.min(100, Math.max(8, (profile.points % 100)))}%` }} 
              />
            </div>
          </div>

          {/* Working Theme Switcher Toggle (Light, Dark, Minecraft) */}
          <div className="flex items-center gap-1.5 bg-black/50 p-1.5 border-2 border-black rounded-none">
            <span className="text-[8px] font-press text-[#ffaa00] px-1 select-none hidden xl:inline">THEME:</span>
            <button
              onClick={() => setThemeMode('light')}
              className={`px-2 py-1 text-[8px] font-press uppercase cursor-pointer rounded-none transition-all ${
                themeMode === 'light'
                  ? 'bg-blue-600 text-white font-bold border-2 border-blue-400'
                  : 'bg-stone-800 text-stone-400 border border-stone-900 hover:text-stone-200'
              }`}
              title="Switch to Modern Light theme"
              id="theme-btn-light"
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`px-2 py-1 text-[8px] font-press uppercase cursor-pointer rounded-none transition-all ${
                themeMode === 'dark'
                  ? 'bg-indigo-600 text-white font-bold border-2 border-indigo-400'
                  : 'bg-stone-800 text-stone-400 border border-stone-900 hover:text-stone-200'
              }`}
              title="Switch to Cosmic Dark theme"
              id="theme-btn-dark"
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setThemeMode('minecraft')}
              className={`px-2 py-1 text-[8px] font-press uppercase cursor-pointer rounded-none transition-all ${
                themeMode === 'minecraft'
                  ? 'bg-amber-600 text-[#ffff55] font-bold border-2 border-amber-400'
                  : 'bg-stone-800 text-stone-400 border border-stone-900 hover:text-stone-200'
              }`}
              title="Switch to Minecraft Retro theme"
              id="theme-btn-minecraft"
            >
              ⛏️ Craft
            </button>
          </div>

          {/* Quick info right detail */}
          <div className="hidden lg:flex items-center gap-4 font-mono text-xs bg-black/40 px-3.5 py-2 border-2 border-black rounded-none">
            <div className="text-left space-y-1">
              <span className="text-[#ffaa00] font-bold block text-[10px] leading-none uppercase">PLAYER IDENT:</span>
              <span className="font-bold text-[#e1e1e1] block leading-none pt-1">{profile.fullName}</span>
            </div>
            
            {/* Logout button */}
            <button
              onClick={handleLogoutClick}
              className="bg-red-950 hover:bg-red-900 border-2 border-black px-2 py-1 text-[9px] text-red-200 uppercase font-black tracking-wider shadow-inner rounded-none cursor-pointer flex items-center gap-1 ml-2"
              title="Return to Launcher Menu"
            >
              <Undo className="w-3 h-3 text-red-400" /> Spawn Quit
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel Content matrix */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Left Side menu Panel (Minecraft Inventory Layout style) */}
        <aside className={`
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:sticky top-[86px] left-0 h-[calc(100vh-86px)]
          w-72 ${currentThemeConfig.panelBg} border-r-8 border-black p-4 z-40 transition-transform duration-200 ease-in-out select-none flex flex-col justify-between overflow-y-auto shrink-0 ${currentThemeConfig.boxShadow}
        `}>
          <div className="space-y-4">
            
            {/* Title block */}
            <div className="border-b-4 border-black pb-2.5 mb-2 bg-black/40 p-2.5 text-center rounded-none border-stone-900 border-2">
              <span className="text-[10px] text-[#ffaa00] font-press uppercase block tracking-wider mc-text-shadow leading-none">INVENTORY SLOTS</span>
            </div>
            
            {/* Nav Slot elements styled as clean vertical lists with both icons and labels side-by-side */}
            <div className="space-y-1.5 pb-4 border-b-4 border-black border-stone-850 h-[38vh] overflow-y-auto pr-1">
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center gap-3 p-2 cursor-pointer text-left font-mono border-2 transition-all rounded-none ${
                      isActive 
                        ? 'bg-black/50 border-[#ffff55] text-[#ffff55] [box-shadow:0_0_8px_rgba(255,255,85,0.2)] font-bold' 
                        : 'bg-black/15 border-transparent hover:bg-black/30 hover:border-stone-700 text-stone-300'
                    }`}
                  >
                    <IconComp className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#ffff55]' : item.color} drop-shadow-md`} />
                    <span className="text-[11.5px] truncate font-sans tracking-wide">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Live dynamic item detailed status display HUD based on hovered hotbar element */}
            <div className="min-h-[110px] bg-[#141212] border-4 border-[#3a3535] p-3 text-xs font-mono leading-relaxed flex flex-col justify-center rounded-none shadow-inner">
              {hoveredItem ? (
                (() => {
                  const item = navItems.find(i => i.id === hoveredItem);
                  return (
                    <div className="space-y-1 text-stone-200">
                      <p className="font-press text-[9px] text-[#e3e33b] uppercase leading-snug">{item?.label}</p>
                      <p className="text-[#a586ff] font-bold text-[10px]">Registry: {item?.mcName}</p>
                      <p className="text-stone-300 text-[11.5px] leading-relaxed mt-1 font-sans">{item?.desc}</p>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const item = navItems.find(i => i.id === activeTab);
                  return (
                    <div className="space-y-1 text-stone-200">
                      <p className="font-press text-[9px] text-[#ffaa00] uppercase leading-snug">{item?.label}</p>
                      <p className="text-[#55ff55] font-bold text-[10px]">Equipped Slot: {item?.mcName}</p>
                      <p className="text-stone-300 text-[11.5px] leading-relaxed mt-1 font-sans">{item?.desc}</p>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Dynamic Real-time Academics Vitality Stats Sheet (Hearts and Shield panel!) */}
            <div className="bg-[#1a1817] border-4 border-black p-3.5 space-y-4 shadow-inner">
              <span className="font-press text-[9px] text-[#ffaa00] uppercase block border-b border-stone-850 pb-2 leading-none animate-pulse">
                💖 CHARACTER METRICS
              </span>
              
              {/* GPA as Hearts */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono text-stone-400">
                  <span className="font-bold">GPA VITALITY</span>
                  <span className="text-[#ff5555] font-bold font-press text-[9px]">{(profile?.gpa ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1 bg-black/40 p-2 border border-stone-900 rounded-none">
                  {renderHealthHearts(profile.gpa, profile.maxGpa)}
                </div>
              </div>

              {/* Achievements as Armor level icons */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono text-stone-400 font-bold">
                  <span>PORTFOLIO SHIELD AP</span>
                  <span className="text-[#55ffff] font-press text-[9px]">+{ (profile.projects || []).length + (profile.leadershipExperience || []).length }</span>
                </div>
                <div className="flex flex-wrap gap-1 bg-black/40 p-2 border border-stone-900 rounded-none">
                  {renderArmorShields()}
                </div>
              </div>

              {/* Weapon level status item */}
              <div className="pt-2 border-t border-stone-850 flex items-center gap-3">
                <div className="h-10 w-10 mc-slot bg-[#38302b] shrink-0 active">
                  <Sword className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div className="font-mono text-xs leading-normal">
                  <p className="text-[#a586ff] font-bold text-[11.5px]">{currentWeapon.name}</p>
                  <p className="text-stone-400 text-[9.5px] mt-1 uppercase font-bold">Tier: {currentWeapon.rating}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer credentials credits info */}
          <div className="pt-4 border-t-4 border-black font-mono text-xs text-[#aaa] space-y-2 mt-4">
            <div className="flex justify-between text-[#ffaa00] font-bold px-1 select-none">
              <span>METADATA COINS:</span>
              <span className="font-press text-[9px]">{(profile.points || 0) * 2} 🪙</span>
            </div>
            
            <p className="text-[10px] text-stone-500 uppercase leading-normal text-center bg-black/30 py-1.5 font-bold font-mono tracking-wider">
              • ADMISSIONS CORES ONLINE •
            </p>
          </div>
        </aside>

        {/* Mobile menu opacity overlay background */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/85 z-30 transition-opacity"
          />
        )}

        {/* Right Active sandbox environment panel view - Wrapped inside an authentic Minecraft Chest Popup Window! */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden min-h-[calc(100vh-86px)] bg-[#110f0d]">
          <div className="mc-window max-w-6xl mx-auto min-h-full">
            
            {/* Header border-strip representing wood trim inside container */}
            <div className="bg-[#4d4d4d] text-[#ffffff] px-4 py-3 border-b-4 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 font-press text-[10px] mc-text-shadow">
              <span>ACTIVE ADMISSIONS BOARD (CHEST WINDOW)</span>
              <span className={`${currentThemeConfig.accentText} uppercase animate-pulse`}>Level {profile.level} Pathfinder</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {renderSandbox()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

      </div>
    </div>
  );
}
