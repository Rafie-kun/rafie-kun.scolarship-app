import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, Sparkles, Navigation, RefreshCw } from 'lucide-react';
import { playClickSound, playAdvancementSound } from '../utils/sound';

interface AIAssistantProps {
  currentPage: string;
  profile: any;
  onNavigateTab: (tabId: string) => void;
}

export default function AIAssistant({ currentPage, profile, onNavigateTab }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [assistantNotification, setAssistantNotification] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Proactive guidance check when changing tabs
  useEffect(() => {
    // Show a small bubble preview notification based on the active tab page
    const notificationTimer = setTimeout(() => {
      let promptText = '';
      switch (currentPage) {
        case 'scholarships':
          promptText = `Explore matching fellowships or filter them down. Got GPA queries?`;
          break;
        case 'applications':
          promptText = `Tracking active applications! Let me check deadlines for you.`;
          break;
        case 'profile':
          promptText = `Is your Hero profile 100% configured? Let's check Gaps.`;
          break;
        case 'writing':
          promptText = `Ready to evaluate admissions drafts? Ask for formatting rules!`;
          break;
        case 'community':
          promptText = `Ask about the local handbook, alumni advice, or forum threads.`;
          break;
        default:
          promptText = `Greetings, candidate! Need help navigating the ScholarPath matrix?`;
          break;
      }
      setAssistantNotification(promptText);
      // Fade out after 6 seconds
      const fadeTimer = setTimeout(() => setAssistantNotification(null), 7000);
      return () => clearTimeout(fadeTimer);
    }, 2000);

    return () => clearTimeout(notificationTimer);
  }, [currentPage]);

  // Generate context-aware suggestions
  useEffect(() => {
    if (isOpen) {
      const contextSuggestions = getContextSuggestions(currentPage, profile);
      setSuggestions(contextSuggestions);
    }
  }, [isOpen, currentPage, profile]);

  const getFriendlyPageName = (page: string): string => {
    switch (page) {
      case 'overview': return 'Quest Dashboard';
      case 'scholarships': return 'Loot Registry';
      case 'universities': return 'Target Keeps';
      case 'applications': return 'Quest Book';
      case 'simulator': return 'Alchemist Lab';
      case 'writing': return 'Scroll Vault';
      case 'counselling': return 'Wise Wizard Chat';
      case 'learning': return 'Navigator Compass';
      case 'community': return 'Tavern Forum';
      case 'customize': return 'Skins & Biomes';
      case 'profile': return 'Hero Skin Profile';
      default: return 'Active Map Location';
    }
  };

  const getContextSuggestions = (page: string, prof: any): string[] => {
    const gpa = prof?.gpa || 3.5;
    const major = prof?.intendedMajor || 'Computer Science';
    const degree = prof?.intendedDegree || 'Master\'s';

    switch (page) {
      case 'scholarships':
        return [
          `Find fellowships for JPA ${gpa} threshold`,
          `Explore fully-funded in ${major}`,
          `How many scholarships do I qualify for?`
        ];
      case 'applications':
        return [
          `Check my pipeline deadlines`,
          `How to write a good Reference Request copy`,
          `What steps should I build next?`
        ];
      case 'profile':
        return [
          `Check profile completion and ECTS alignment`,
          `How does GPA Vitality impact scholarships?`,
          `Review armor shields experience metrics`
        ];
      case 'writing':
        return [
          `Format guidance for evaluation`,
          `Template rules for an Elite SOP scroll`,
          `Explain ECTS match relevance`
        ];
      case 'community':
        return [
          `Scan forum regarding ECTS mapping`,
          `How to request academic sponsors`,
          `Popular scholarship guides`
        ];
      default:
        return [
          `Help me navigate to Loot Registry`,
          `Explain how to get more XP points`,
          `Show me some advice matching my profile`
        ];
    }
  };

  const handleSend = async (messageText?: string) => {
    const messageToSend = messageText || input;
    if (!messageToSend.trim()) return;

    playClickSound();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setLoading(true);

    const customKey = localStorage.getItem('scholarpath_custom_gemini_key') || '';

    try {
      const res = await fetch('/api/gemini/study-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': customKey
        },
        body: JSON.stringify({
          message: `[User Location: on ${currentPage} ("${getFriendlyPageName(currentPage)}")] ${messageToSend}`,
          chatHistory: messages.map(m => ({ sender: m.role === 'user' ? 'user' : 'ai', text: m.content }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || data.response || "I couldn't process this admissions index. Keep checking.";
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

        // Auto-navigate user if the AI suggests moving to a page!
        if (reply.toLowerCase().includes('navigate to') || reply.toLowerCase().includes('go to')) {
          const lower = reply.toLowerCase();
          if (lower.includes('registry') || lower.includes('scholarship')) {
            onNavigateTab('scholarships');
          } else if (lower.includes('profile') || lower.includes('hero skin')) {
            onNavigateTab('profile');
          } else if (lower.includes('scroll') || lower.includes('writing') || lower.includes('vault') || lower.includes('cv')) {
            onNavigateTab('writing');
          } else if (lower.includes('forum') || lower.includes('community') || lower.includes('tavern')) {
            onNavigateTab('community');
          } else if (lower.includes('wizard') || lower.includes('librarian') || lower.includes('advisor')) {
            onNavigateTab('counselling');
          } else if (lower.includes('quest book') || lower.includes('application')) {
            onNavigateTab('applications');
          } else if (lower.includes('dashboard') || lower.includes('overview')) {
            onNavigateTab('overview');
          }
        }
      } else {
        throw new Error("HTTP failure");
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "🔌 Wise Wizard Link Interrupted! Please ensure a correct GEMINI_API_KEY is active in Skins & Biomes (Customize tab) or under Secure Settings, and retry." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (sug: string) => {
    handleSend(sug);
  };

  const handleToggle = () => {
    playClickSound();
    setIsOpen(!isOpen);
    setAssistantNotification(null);
  };

  return (
    <>
      {/* Dynamic persistent proactive prompt notification */}
      <AnimatePresence>
        {!isOpen && assistantNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-[9998] bg-[#ffff55] text-black text-[10px] font-mono p-3 border-4 border-black font-semibold max-w-xs cursor-pointer select-none [box-shadow:inset_-2px_-2px_0_#9a9a33,inset_2px_2px_0_#ff9,0_5px_15px_rgba(0,0,0,0.5)]"
            onClick={handleToggle}
          >
            <div className="flex items-center gap-1.5 font-press text-[8px] border-b border-black/20 pb-1 mb-1 text-black/70 uppercase">
              <Bot className="w-3.5 h-3.5" /> Navigation Navigator:
            </div>
            {assistantNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <button
        onClick={handleToggle}
        id="persistent-ai-navigator-btn"
        className="fixed bottom-6 right-6 z-[9998] cursor-pointer mc-btn p-4 bg-[#ffff55] text-black border-4 border-black [box-shadow:inset_-3px_-3px_0_#b2b212,inset_3px_3px_0_#fff,0_6px_20px_rgba(0,0,0,0.4)] hover:scale-105 transition-transform"
        title="Consult AI Navigation Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed bottom-24 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2.5rem)] bg-[#2c2c2c] border-4 border-black shadow-2xl flex flex-col [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555,0_12px_40px_rgba(0,0,0,0.6)]"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b-4 border-black bg-[#1a1818]">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#ffff55] animate-bounce" />
                <div>
                  <span className="font-press text-[9px] text-[#ffff55] block">AI MAP NAVIGATOR</span>
                  <span className="text-[8px] font-mono text-stone-400 block uppercase">
                    Location: {getFriendlyPageName(currentPage)}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleToggle} 
                className="text-stone-400 hover:text-stone-100 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions banner */}
            {messages.length === 0 && suggestions.length > 0 && (
              <div className="p-3 bg-black/40 border-b-2 border-black max-h-36 overflow-y-auto">
                <p className="text-[9px] font-press text-stone-400 mb-2 uppercase tracking-wide">💡 Suggestion shortcuts:</p>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(s)}
                      className="text-left text-[11px] font-mono text-stone-300 hover:text-[#ffff55] bg-neutral-800 hover:bg-neutral-750 p-2 border border-stone-700 hover:border-[#ffff55] transition-all cursor-pointer truncate"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat History Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[160px]"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full space-y-3 p-4 opacity-75">
                  <Bot className="w-12 h-12 text-[#ffff55] animate-pulse" />
                  <p className="text-xs font-mono text-[#ffff55] uppercase font-bold leading-relaxed">
                    AWAITING SYSTEM INSTRUCTIONS
                  </p>
                  <p className="text-[11px] font-sans text-stone-400 leading-relaxed max-w-xs">
                    I scan which page you are on and guide your admissions expedition. Ask anything or click a suggestion!
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 border-2 font-mono text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#333333] border-stone-700 text-stone-100' 
                        : 'bg-[#141414] border-stone-850 text-stone-200'
                    }`}>
                      <div className="text-[8px] font-press uppercase text-[#ffaa00] mb-1">
                        {msg.role === 'user' ? '👤 Candidate User' : '🤖 AI NAVIGATOR'}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-stone-900 border-2 border-stone-800 p-3 flex items-center gap-2 max-w-[200px]">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#ffff55]" />
                    <span className="text-[10px] uppercase font-mono text-stone-400">Poring over maps...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input form tray */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              className="p-3 border-t-4 border-black bg-stone-900 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me how to qualify, explore..."
                className="flex-1 bg-[#141414] border-2 border-black p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#ffff55]"
              />
              <button 
                type="submit" 
                disabled={loading} 
                className="mc-btn px-4 text-[#ffff55] flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4 font-extrabold" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
