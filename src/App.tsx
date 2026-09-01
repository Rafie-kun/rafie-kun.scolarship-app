import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, BookOpen, GraduationCap, Calculator, Award, ArrowRight, Save, User, Sparkles,
  Search, BookmarkCheck, Calendar, CheckSquare, Square, MessageSquare, Plus, CheckCircle,
  FolderDown, Building, Navigation, Globe, Menu, X, Coins, HelpCircle, Shield, Sword,
  Undo, Settings, UserCog, FileText, TrendingUp, Compass, Briefcase, Target
} from 'lucide-react';

// Views are lazily loaded so each heavy view (jspdf, html2canvas, recharts...)
// lands in its own chunk and the initial bundle stays small.
const OverviewRecommendationsView = lazy(() => import('./components/OverviewRecommendationsView'));
const ScholarshipsView = lazy(() => import('./components/ScholarshipsView'));
const UniversitiesView = lazy(() => import('./components/UniversitiesView'));
const ApplicationsView = lazy(() => import('./components/ApplicationsView'));
const WritingVaultView = lazy(() => import('./components/WritingVaultView'));
const CounsellingView = lazy(() => import('./components/CounsellingView'));
const CommunityView = lazy(() => import('./components/CommunityView'));
const RoadmapView = lazy(() => import('./components/RoadmapView'));
const MentorView = lazy(() => import('./components/MentorView'));
const ProfileView = lazy(() => import('./components/ProfileView'));
const ExportCenterView = lazy(() => import('./components/ExportCenterView'));
const DreamUniversityView = lazy(() => import('./components/DreamUniversityView'));
const CustomizeView = lazy(() => import('./components/CustomizeView'));
const OnboardingTour = lazy(() => import('./components/OnboardingTour'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const CVBuilder = lazy(() => import('./components/CVBuilder'));
const BudgetPlanner = lazy(() => import('./components/BudgetPlanner'));
const PerformanceAnalyticsView = lazy(() => import('./components/PerformanceAnalyticsView'));
const CurrencySwitcher = lazy(() => import('./components/CurrencySwitcher'));
const AdvancedSearch = lazy(() => import('./components/AdvancedSearch'));
const VisaGuide = lazy(() => import('./components/VisaGuide'));
const InternshipExplorer = lazy(() => import('./components/InternshipExplorer'));
const AdmissionWizard = lazy(() => import('./components/AdmissionWizard'));
const CountryMatcherQuiz = lazy(() => import('./components/CountryMatcherQuiz'));
const IeltsToeflPractice = lazy(() => import('./components/IeltsToeflPractice'));
const MockVisaInterview = lazy(() => import('./components/MockVisaInterview'));

import GlobalSearch from './components/GlobalSearch';
import Tooltip from './components/Tooltip';
import QuickNotesWidget from './components/QuickNotesWidget';
import LevelUpModal from './components/LevelUpModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useBackgroundSync } from './hooks/useBackgroundSync';

import LoginScreen from './components/LoginScreen';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { playClickSound, playAdvancementSound } from './utils/sound';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationsBell from './components/NotificationsBell';
import SyncStatusDrawer from './components/SyncStatusDrawer';
import ToastContainer from './components/Toast';

// Single official Minecraft-inspired palette for the whole app
const THEME_STYLING = {
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
  tagline: 'ScholarPath Adventure'
};

// Navigations directory menu hotbar mappings
const navItems = [
  { id: 'overview', label: 'Overview', mcName: 'Dashboard', desc: 'View active targets, track progress scores, and application milestones', icon: Trophy, color: 'text-amber-400' },
  { id: 'analytics', label: 'Performance Analytics', mcName: 'Analytics', desc: 'Visualize academic GPA trends and target milestone completions', icon: TrendingUp, color: 'text-[#55ff55]' },
  { id: 'scholarships', label: 'Scholarship Finder', mcName: 'Scholarships', desc: 'Browse matched international fellowships & fully funded stipends', icon: GraduationCap, color: 'text-yellow-400' },
  { id: 'internships', label: 'Internship Finder', mcName: 'Internships', desc: 'Browse global paid internships, research posts & UN positions', icon: Briefcase, color: 'text-emerald-400 font-bold' },
  { id: 'universities', label: 'Universities', mcName: 'Universities Directory', desc: 'Browse entry GPA benchmarks for global institutions', icon: Building, color: 'text-sky-400' },
  { id: 'matcher', label: 'Country Matcher', mcName: 'Country Finder', desc: 'Answer 5 questions to find your best-fit countries with living costs and visa info', icon: Compass, color: 'text-[#ffaa00] font-bold' },
  { id: 'ielts', label: 'IELTS Practice', mcName: 'IELTS Drill', desc: '10-min IELTS/TOEFL practice test with band estimate', icon: BookOpen, color: 'text-sky-400' },
  { id: 'search', label: 'Advanced Search', mcName: 'Search Engine', desc: 'High-precision cross-database query engine for scholarships and universities', icon: Search, color: 'text-violet-400 font-bold' },
  { id: 'applications', label: 'Applications Tracker', mcName: 'Applications Ledger', desc: 'Manage your active application checkpoints, tasks, and deadlines', icon: BookmarkCheck, color: 'text-red-400' },
  { id: 'simulator', label: 'Admissions Calculator', mcName: 'Admission Chances', desc: 'Forecast acceptance margins with custom GPA and profile parameters', icon: Calculator, color: 'text-indigo-400' },
    { id: 'chances', label: 'Will I Get In?', mcName: 'Chance Wizard', desc: 'Enter your grades and see which universities are likely, a match, or a reach - plus how to improve', icon: Target, color: 'text-[#55ff55] font-bold' },
  { id: 'writing', label: 'Document Center', mcName: 'Statements & Documents', desc: 'Evaluate & draft professional Statement of Purpose documents', icon: Save, color: 'text-cyan-400' },
  { id: 'cv', label: 'CV Builder', mcName: 'Academic CV', desc: 'Synthesize custom admissions CV credentials & export PDF', icon: FileText, color: 'text-rose-450 font-bold' },
  { id: 'counselling', label: 'AI Chat Assistant', mcName: 'AI Advisor', desc: 'Speak to the AI student assistant about ECTS and scholarship matches', icon: BookOpen, color: 'text-emerald-400' },
  { id: 'budget', label: 'Budget Planner', mcName: 'Finances', desc: 'Calculate study costs, living expenses & part-time earnings', icon: Coins, color: 'text-[#2ecc71]' },
  { id: 'visa', label: 'Visa Guide', mcName: 'Visa & Immigration', desc: 'Study visa requirements, proof of funds & work permits', icon: Compass, color: 'text-[#55ffff] font-bold' },
  { id: 'learning', label: 'Roadmap', mcName: 'Timeline Maps', desc: 'Structured timeline maps for global admission stages', icon: Navigation, color: 'text-orange-400' },
  { id: 'community', label: 'Community Forum', mcName: 'Student Forum', desc: 'Interact with fellow students regarding admissions and visa advice', icon: MessageSquare, color: 'text-purple-400' },
  { id: 'mentors', label: 'Mentors', mcName: 'Alumni Mentors', desc: 'Consult with vetted alumni from top university fellowship programs', icon: Award, color: 'text-pink-400' },
  { id: 'customize', label: 'Theme Settings', mcName: 'Appearance & Themes', desc: 'Mute sounds, tune layout densities & customize visual themes', icon: Sparkles, color: 'text-[#ffff55]' },
  { id: 'export', label: 'Export Center', mcName: 'Data Backups', desc: 'Convert applicant records into persistent JSON backups', icon: FolderDown, color: 'text-stone-300' },
  { id: 'profile', label: 'Profile', mcName: 'User Profile', desc: 'Configure candidate GPAs, nationality, degree, and credentials', icon: User, color: 'text-teal-400' }
];

const VALID_TAB_IDS = new Set(navItems.map(item => item.id));

// Hash-based routing: tabs are addressable via #/scholarships etc., enabling
// deep links, back/forward navigation, and shareable views.
function getTabFromHash(): string {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return VALID_TAB_IDS.has(hash) ? hash : 'overview';
}

export default function App() {
  const { user, isLoggedIn, profile: authProfile, authLoading, isGuest, logout, rewardPoints, refreshProfile, updateProfile } = useAuth();
  const { currency, setCurrency } = useTheme();

  useBackgroundSync(25000);

  const [profile, setProfile] = useState(authProfile);

  useEffect(() => {
    setProfile(authProfile);
  }, [authProfile]);

  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      }
    };
    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('profile-updated', handleProfileUpdated);
  }, []);

  const [activeTab, setActiveTabState] = useState<string>(getTabFromHash);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keep the URL hash in sync with the active tab
  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId);
    const targetHash = `#/${tabId}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  };

  // React to browser back/forward and external deep links (#/scholarships)
  useEffect(() => {
    const onHashChange = () => setActiveTabState(getTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K to toggle search, Esc to close search)
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      action: () => setIsSearchOpen(prev => !prev),
      description: 'Open Quick Search'
    },
    {
      key: 'escape',
      action: () => {
        setIsSearchOpen(false);
        setMobileMenuOpen(false);
      },
      description: 'Close Modals'
    }
  ]);

  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (isLoggedIn && profile && !authLoading) {
      // Prevent showing the tour during transient loading states where profile is the placeholder defaultProfile
      if (!profile.fullName && !isGuest) {
        return;
      }
      
      const completedOnboarding = profile.hasCompletedOnboarding || localStorage.getItem(`scholarpath_onboarding_completed_${user || 'guest'}`) === 'true';
      if (!completedOnboarding) {
        setShowTour(true);
      } else {
        setShowTour(false);
      }
    } else {
      setShowTour(false);
    }
  }, [isLoggedIn, profile, authLoading, isGuest]);

  useEffect(() => {
    const handleStartTour = () => {
      setShowTour(true);
    };
    window.addEventListener('start-onboarding-tour', handleStartTour);
    return () => window.removeEventListener('start-onboarding-tour', handleStartTour);
  }, []);

  const handleLogoutClick = () => {
    playClickSound();
    logout();
    setActiveTab('overview');
  };

  const handleTabChange = (tabId: string) => {
    playClickSound();
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Map active Tab to visual layouts
  const renderSandbox = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewRecommendationsView onNavigate={(view) => setActiveTab(view)} />;
      case 'analytics':
        return <PerformanceAnalyticsView onNavigate={handleTabChange} />;
      case 'scholarships':
        return <ScholarshipsView />;
      case 'internships':
        return <InternshipExplorer />;
      case 'universities':
        return <UniversitiesView />;
      case 'matcher':
        return <CountryMatcherQuiz />;
      case 'ielts':
        return <IeltsToeflPractice />;
      case 'mock-visa':
        return <MockVisaInterview />;
      case 'search':
        return <AdvancedSearch />;
      case 'applications':
        return <ApplicationsView />;
      case 'simulator':
        return <DreamUniversityView />;
      case 'chances':
        return <AdmissionWizard />;
      case 'writing':
        return <WritingVaultView />;
      case 'cv':
        return <CVBuilder />;
      case 'counselling':
        return <CounsellingView />;
      case 'budget':
        return <BudgetPlanner />;
      case 'visa':
        return <VisaGuide />;
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

  const currentThemeConfig = THEME_STYLING;

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
        <span className="mc-text-shadow">LOADING...</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#110f0d] flex flex-col items-center justify-center font-press text-[11px] text-[#ffff55] gap-3">
        <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
        <span className="mc-text-shadow">LOADING YOUR PROFILE...</span>
      </div>
    );
  }

  const currentWeapon = getEquipmentWeapon();

  // XP progress within the current level (each level = 100 XP)
  const xpInLevel = Math.max(0, Math.min(100, (profile?.points ?? 0) - ((profile?.level ?? 1) - 1) * 100));

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col font-sans transition-all duration-300 tex-dirt-dark text-stone-200 ${currentThemeConfig.bodyBg}`} id="scholarpath-main-container">
      
      {/* Minecraft Block Header Band */}
      <header className={`${currentThemeConfig.headerBg} border-b-8 ${currentThemeConfig.headerBorder} text-stone-100 sticky top-0 z-50 select-none pb-1 shadow-2xl`}>
        
        {/* Grass fringe at the very top of the header */}
        <div className={`h-3 w-full tex-grass border-b ${currentThemeConfig.fringeBorder}`} />
        
        <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Player Profile / Spec Settings direct shortcut */}
            <button
              onClick={() => handleTabChange('profile')}
              className="mc-btn p-2 flex items-center justify-center cursor-pointer transition-all active:scale-95 text-[#55ffff] hover:text-[#ffff55] hover:bg-[#343434] hover:scale-105 border-2 border-[#55ffff] [box-shadow:0_0_10px_rgba(85,255,255,0.3)] transition-transform rounded-none"
              title="Player Profile / Settings Cog"
              id="header-profile-shortcut"
            >
              {isLoggedIn ? (
                <UserCog className="w-4.5 h-4.5" />
              ) : (
                <Settings className="w-4.5 h-4.5" />
              )}
            </button>

            {/* Mobile Inventory menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden mc-btn p-2"
              title="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 ml-1" /> : <Menu className="w-4 h-4 ml-1" />}
            </button>

            {/* Quick Search Ctrl+K Button */}
            <button
              onClick={() => { playClickSound(); setIsSearchOpen(true); }}
              className="hidden sm:flex items-center gap-2 bg-black/50 border-2 border-stone-700 hover:border-[#ffff55] px-2.5 py-1.5 text-[11px] font-mono text-stone-300 cursor-pointer transition-colors"
              title="Quick Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#ffff55]" />
              <span className="hidden lg:inline text-stone-400">Search...</span>
              <kbd className="px-1.5 py-0.5 text-[9px] bg-stone-800 text-stone-300 border border-stone-600 font-press">Ctrl+K</kbd>
            </button>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleTabChange('customize')}
                className="w-12 h-12 bg-stone-800 border-4 border-black hover:bg-stone-750 flex items-center justify-center text-xs shadow-inner active:scale-95 transition-all cursor-pointer [box-shadow:inset_-3px_-3px_0_#141414,inset_3px_3px_0_#555]"
                title="Settings & Preferences"
              >
                ⚙️
              </button>
              <div className="space-y-1">
                <h1 className="font-press text-xs sm:text-sm tracking-widest text-[#ffff55] mc-text-shadow leading-tight flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  SCHOLARPATH <span className="font-sans text-[9px] sm:text-[10px] uppercase font-bold text-[#aaaaaa] tracking-normal">Scholarship & Internship Finder</span>
                </h1>
                <span className="text-[10px] sm:text-[12px] font-mono text-stone-350 leading-none block font-semibold">
                  <span className="text-[#a586ff] font-bold">Find funding. Plan your future.</span>
                </span>
              </div>
            </div>
          </div>

          {/* XP / Level progress bar */}
          <div className="flex flex-col items-center gap-2 w-full max-w-sm shrink-0">
            <div className="flex justify-between w-full text-[10px] sm:text-[12px] font-mono text-[#55ff55] font-bold uppercase select-none gap-2">
              <span className="font-press text-[8px] sm:text-[9px] text-[#ffea00] mc-text-shadow flex items-center gap-1 leading-none pt-1">
                <Trophy className="w-3.5 h-3.5" /> Level {profile?.level ?? 1}
              </span>
              <span>{xpInLevel} / 100 XP to Level {(profile?.level ?? 1) + 1}</span>
            </div>

            <div className="w-full mc-xp-bar border-4 border-black max-h-[16px] h-3">
              <div
                className={`${currentThemeConfig.hudXpFill} h-full transition-all duration-700 ease-out`}
                style={{ width: `${Math.min(100, Math.max(4, xpInLevel))}%` }}
              />
            </div>
          </div>

          {/* Notifications Bell Icon */}
          <NotificationsBell />

          {/* Sync Status Drawer Icon */}
          <SyncStatusDrawer />

          {/* Currency selector (amounts across the app follow this) */}
          <Suspense fallback={null}>
            <CurrencySwitcher />
          </Suspense>

          {/* Signed-in user info + logout */}
          <div className="hidden lg:flex items-center gap-4 font-mono text-xs bg-black/40 px-3.5 py-2 border-2 border-black rounded-none">
            <div className="text-left space-y-1">
              <span className="text-[#ffaa00] font-bold block text-[10px] leading-none uppercase">Signed in as:</span>
              <span className="font-bold text-[#e1e1e1] block leading-none pt-1">{profile?.fullName || "Guest"}</span>
            </div>
            
            {/* Logout button */}
            <button
              onClick={handleLogoutClick}
              className="bg-red-950 hover:bg-red-900 border-2 border-black px-2 py-1 text-[9px] text-red-200 uppercase font-black tracking-wider shadow-inner rounded-none cursor-pointer flex items-center gap-1 ml-2"
              title="Log out of ScholarPath"
            >
              <Undo className="w-3 h-3 text-red-400" /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Offline Mode Banner */}
      {profile?.offlineMode && (
        <div className="w-full bg-amber-950/95 border-b-4 border-amber-600 text-amber-100 text-center py-2 px-4 flex items-center justify-center gap-2 font-mono text-xs shadow-md z-50 transition-all duration-300">
          <div className="animate-pulse w-2 h-2 rounded-full bg-amber-500 mr-1" />
          <span className="font-bold tracking-wider text-amber-400 uppercase">OFFLINE SYNCHRONIZATION:</span>
          <span>We are temporarily unable to reach the mainframe. Your progress is saved locally and will synchronize automatically once the connection is restored.</span>
        </div>
      )}

      {/* Main Panel Content matrix */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Left Side menu Panel (Minecraft Inventory Layout style) */}
        <aside className={`
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:sticky top-[86px] left-0 h-[calc(100vh-86px)]
          w-72 tex-stone border-r-8 border-black p-4 z-40 transition-transform duration-200 ease-in-out select-none flex flex-col justify-between overflow-y-auto shrink-0 ${currentThemeConfig.boxShadow}
        `}>
          <div className="space-y-4">
            
            {/* Title block */}
            <div className="border-b-4 border-black pb-2.5 mb-2 bg-black/40 p-2.5 text-center rounded-none border-stone-900 border-2">
              <span className="text-[10px] text-[#ffaa00] font-press uppercase block tracking-wider mc-text-shadow leading-none">MENU</span>
            </div>
            
            {/* Nav Slot elements styled as clean vertical lists with both icons and labels side-by-side */}
            <div className="space-y-1.5 pb-4 border-b-4 border-black border-stone-850 h-[38vh] overflow-y-auto pr-1">
              {navItems.map((item, index) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Tooltip key={item.id} content={`${item.label}: ${item.desc}`} position="right">
                    <motion.button
                      onClick={() => handleTabChange(item.id)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      initial={{ scale: 0.9, y: 15, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 240,
                        damping: 12,
                        delay: index * 0.02
                      }}
                      className={`w-full flex items-center gap-3 p-2 cursor-pointer text-left font-mono border-2 transition-all rounded-none ${
                        isActive 
                          ? 'bg-black/50 border-[#ffff55] text-[#ffff55] [box-shadow:0_0_8px_rgba(255,255,85,0.2)] font-bold' 
                          : 'bg-black/15 border-transparent hover:bg-black/30 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <IconComp className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#ffff55]' : item.color} drop-shadow-md`} />
                      <span className="text-[11.5px] truncate font-sans tracking-wide">{item.label}</span>
                    </motion.button>
                  </Tooltip>
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
                      <p className="text-[#a586ff] font-bold text-[10px]">Section: {item?.label}</p>
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
                      <p className="text-[#55ff55] font-bold text-[10px]">Current page</p>
                      <p className="text-stone-300 text-[11.5px] leading-relaxed mt-1 font-sans">{item?.desc}</p>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Dynamic Real-time Academics Vitality Stats Sheet (Hearts and Shield panel!) */}
            <div className="bg-[#1a1817] border-4 border-black p-3.5 space-y-4 shadow-inner">
              <span className="font-press text-[9px] text-[#ffaa00] uppercase block border-b border-stone-850 pb-2 leading-none animate-pulse">
                💖 YOUR STATS
              </span>
              
              {/* GPA as Hearts */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono text-stone-400">
                  <span className="font-bold">GPA (out of 4)</span>
                  <span className="text-[#ff5555] font-bold font-press text-[9px]">{(profile?.gpa ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1 bg-black/40 p-2 border border-stone-900 rounded-none">
                  {renderHealthHearts(profile.gpa, profile.maxGpa)}
                </div>
              </div>

              {/* Achievements as Armor level icons */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono text-stone-400 font-bold">
                  <span>PORTFOLIO STRENGTH</span>
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
            <button
              onClick={() => {
                playClickSound();
                window.dispatchEvent(new CustomEvent('start-onboarding-tour'));
              }}
              className="w-full text-center mc-btn py-2 text-[10.5px] text-[#ffff55] font-bold flex items-center justify-center gap-2 border-2 border-black"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ffff55]" />
              <span>? HOW THIS APP WORKS</span>
            </button>

            <div className="flex justify-between text-[#ffaa00] font-bold px-1 select-none">
              <span>EARNED COINS:</span>
              <span className="font-press text-[9px]">{(profile?.points || 0) * 2} 🪙</span>
            </div>
            
            <p className="text-[10px] text-stone-500 uppercase leading-normal text-center bg-black/30 py-1.5 font-bold font-mono tracking-wider">
              All systems online
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
              <span>WORKSPACE</span>
              <span className={`${currentThemeConfig.accentText} uppercase animate-pulse`}>Level {profile.level} Scholar</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <ErrorBoundary>
                  <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-24 gap-3 font-press text-[10px] text-[#ffff55]">
                      <Sparkles className="w-6 h-6 animate-spin text-[#ffff55]" />
                      <span className="mc-text-shadow">LOADING...</span>
                    </div>
                  }>
                    {renderSandbox()}
                  </Suspense>
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

      </div>

      {/* Global Search Modal Popup */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleTabChange}
      />

      {/* Floating Dynamic AI Navigation Assistant */}
      {isLoggedIn && profile && (
        <Suspense fallback={null}>
          <AIAssistant
            currentPage={activeTab}
            profile={profile}
            onNavigateTab={handleTabChange}
          />
        </Suspense>
      )}

      {/* --- INTERACTIVE ONBOARDING TOUR OVERLAY --- */}
      {showTour && isLoggedIn && profile && (
        <Suspense fallback={null}>
          <OnboardingTour
          onComplete={async (totalXP) => {
            localStorage.setItem(`scholarpath_onboarding_completed_${user || 'guest'}`, 'true');
            if (updateProfile) {
              await updateProfile({ hasCompletedOnboarding: true });
            }
            setShowTour(false);
            if (rewardPoints) {
              await rewardPoints(totalXP, "Completed Guided Onboarding Quest", "Onboarding Master");
            }
          }}
          onSkip={async () => {
            localStorage.setItem(`scholarpath_onboarding_completed_${user || 'guest'}`, 'true');
            if (updateProfile) {
              await updateProfile({ hasCompletedOnboarding: true });
            }
            setShowTour(false);
          }}
          onNavigateTab={(tabId) => {
            setActiveTab(tabId);
          }}
          />
        </Suspense>
      )}

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Global Quick Notes Widget */}
      {isLoggedIn && <QuickNotesWidget />}

      {/* Global Level Up Modal */}
      {isLoggedIn && profile && (
        <LevelUpModal 
          currentLevel={profile.level || 1} 
          points={profile.points || 0} 
        />
      )}
    </div>
    </ErrorBoundary>
  );
}
