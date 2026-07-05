import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Trophy, GraduationCap, Building, Briefcase, Compass, ArrowRight, Sparkles, Command, BookmarkCheck, Calculator, Save, BookOpen } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  category: string;
  description: string;
  tabId: string;
  icon: any;
  color: string;
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigationTargets: SearchResultItem[] = [
    { id: 'overview', title: 'Dashboard Overview', category: 'Overview', description: 'Overview of your academic journey and active applications', tabId: 'overview', icon: Trophy, color: 'text-amber-400' },
    { id: 'scholarships', title: 'Scholarship Finder', category: 'Funding', description: 'Find fully funded international scholarships and grants', tabId: 'scholarships', icon: GraduationCap, color: 'text-yellow-400' },
    { id: 'internships', title: 'Internship Finder', category: 'Career', description: 'Global paid internships, research posts and UN fellowships', tabId: 'internships', icon: Briefcase, color: 'text-emerald-400' },
    { id: 'universities', title: 'Universities', category: 'Institutions', description: 'Global university directory and admission GPA benchmarks', tabId: 'universities', icon: Building, color: 'text-sky-400' },
    { id: 'applications', title: 'Applications Tracker', category: 'Tracking', description: 'Track active application checkpoints and deadlines', tabId: 'applications', icon: BookmarkCheck, color: 'text-red-400' },
    { id: 'simulator', title: 'Admissions Calculator', category: 'Admissions', description: 'Estimate admission chances with custom parameters', tabId: 'simulator', icon: Calculator, color: 'text-indigo-400' },
    { id: 'writing', title: 'Document Center', category: 'Documents', description: 'Manage and review Statements of Purpose and essays', tabId: 'writing', icon: Save, color: 'text-cyan-400' },
    { id: 'counselling', title: 'AI Chat Assistant', category: 'AI Support', description: 'Get 24/7 AI-powered academic and scholarship guidance', tabId: 'counselling', icon: BookOpen, color: 'text-emerald-400' },
    { id: 'roadmap', title: 'Roadmap', category: 'Guidance', description: 'Structured timeline maps for global admission stages', tabId: 'learning', icon: Compass, color: 'text-orange-400' },
    { id: 'visa', title: 'Visa Guide', category: 'Immigration', description: 'Student visa requirements, proof of funds and embassy checklists', tabId: 'visa', icon: Compass, color: 'text-cyan-400' },
    { id: 'budget', title: 'Budget Planner', category: 'Finance', description: 'Estimate tuition, living costs and part-time earnings', tabId: 'budget', icon: Briefcase, color: 'text-green-400' },
    { id: 'community', title: 'Community Forum', category: 'Social', description: 'Connect with fellow applicants and mentors worldwide', tabId: 'community', icon: Sparkles, color: 'text-purple-400' },
    { id: 'search', title: 'Advanced Explorer', category: 'Search', description: 'Deep cross-database query engine for scholarships & universities', tabId: 'search', icon: Search, color: 'text-violet-400' },
  ];

  const filteredResults = query.trim() === '' 
    ? navigationTargets 
    : navigationTargets.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (item: SearchResultItem) => {
    playClickSound();
    onNavigate(item.tabId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 px-4">
      <div 
        className="bg-[#1c1a18] border-4 border-[#ffff55] max-w-2xl w-full rounded-none shadow-2xl overflow-hidden font-mono text-stone-200 animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 p-4 bg-black/60 border-b-2 border-stone-800">
          <Search className="w-5 h-5 text-[#ffff55] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or search destination (e.g. 'Scholarships', 'Visa', 'German Universities')..."
            className="flex-1 bg-transparent border-none text-sm text-stone-100 placeholder-stone-500 outline-none font-sans"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-stone-800 text-stone-400 border border-stone-700 rounded-none font-press">
            ESC
          </kbd>
          <button 
            onClick={onClose}
            className="p-1 hover:text-red-400 text-stone-400 font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">
              No portal endpoints matched "{query}". Try searching 'Scholarships' or 'Visa'.
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const IconComp = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 flex items-center justify-between transition-colors cursor-pointer border-2 ${
                    isSelected 
                      ? 'bg-[#2a2725] border-[#ffff55] text-[#ffff55]' 
                      : 'bg-black/20 border-transparent hover:bg-black/40 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-black/50 border border-stone-800 ${item.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-xs font-bold">{item.title}</span>
                        <span className="text-[9px] font-press uppercase bg-stone-800 text-stone-400 px-1.5 py-0.5">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 font-sans mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#ffff55] translate-x-1' : 'text-stone-600'} transition-transform`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="p-2.5 bg-black/70 border-t border-stone-800 flex justify-between items-center text-[10px] text-stone-400">
          <span className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1 bg-stone-800 border border-stone-700">↑↓</kbd>
            <span>Select:</span>
            <kbd className="px-1 bg-stone-800 border border-stone-700">↵</kbd>
          </span>
          <span className="font-press text-[8px] text-[#ffff55]">
            SCHOLARPATH QUICKSPY ENGINE
          </span>
        </div>
      </div>
    </div>
  );
}
