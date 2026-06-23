export interface TourStep {
  id: string;
  title: string;
  description: string;
  page: string; // tab ID to navigate to
  targetSelector: string; // CSS selector or element ID
  xpReward: number;
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to ScholarPath!',
    description: 'Your AI-powered journey to find and win scholarships starts here. Let\'s explore the features together!',
    page: 'overview',
    targetSelector: '#app-header',
    xpReward: 10
  },
  {
    id: 'profile',
    title: '📝 Configure Your Hero Profile',
    description: 'First, add your basic identity, nationality, and target major. This feeds into our real-time AI recommendation matrices!',
    page: 'profile',
    targetSelector: '#scholarpath-candidate-profile',
    xpReward: 15
  },
  {
    id: 'education',
    title: '🎓 Set Your Academic standing',
    description: 'Select your correct current learning level and graduation checkpoint to filter competitive fellowship criteria.',
    page: 'profile',
    targetSelector: '#education-level-select',
    xpReward: 15
  },
  {
    id: 'scholarships',
    title: '🔍 Explore the Loot Registry',
    description: 'Browse global fellowships and stipend rewards. Use the live search bar and filters to narrow down matches.',
    page: 'scholarships',
    targetSelector: '.scholarship-search-input',
    xpReward: 20
  },
  {
    id: 'track',
    title: '📌 Track Your First Scholarship',
    description: 'Bind a fellowship to your active tracker by clicking "Track Quest Loot". This adds it to your application checklists!',
    page: 'scholarships',
    targetSelector: '.tour-track-btn',
    xpReward: 20
  },
  {
    id: 'ai-copilot',
    title: '🤖 Speak to the Wise Librarian',
    description: 'Pose academic queries about credits mapping, GPA limits, or ECTS conversions to the custom AI advisor counsellor.',
    page: 'counselling',
    targetSelector: '#copilot-chat-input',
    xpReward: 25
  },
  {
    id: 'cv-builder',
    title: '📄 Draft SOP & Scholar Credentials',
    description: 'Evaluate motivation letters and personal essay drafts. Let our AI Admissions Panel grade your drafts with feedback scores!',
    page: 'writing',
    targetSelector: '#load-sop-template-btn',
    xpReward: 25
  },
  {
    id: 'community',
    title: '💬 Join Tavern Forum discussions',
    description: 'Interact with fellow globally-bound scholars. Share interview logs, certified translation guides, and academic advice.',
    page: 'community',
    targetSelector: '#community-new-post-btn',
    xpReward: 15
  },
  {
    id: 'complete',
    title: '🎉 You\'re Ready to Go!',
    description: 'You\'ve completed the onboarding quest! You have earned bonus XP for exploring. Check your progress anytime on the core dashboard.',
    page: 'overview',
    targetSelector: '#overview-profile-card',
    xpReward: 30
  }
];
