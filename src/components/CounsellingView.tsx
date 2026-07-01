import React, { useState } from 'react';
import { Sparkles, MessageSquare, Send, Award, Target, HelpCircle, CheckCircle, Flame, Mic, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import ScholarshipAdvisor from './AIAdvisor/ScholarshipAdvisor';
import UniversityAdvisor from './AIAdvisor/UniversityAdvisor';
import BudgetAdvisor from './AIAdvisor/BudgetAdvisor';

export default function CounsellingView() {
  const { authorizedFetch, rewardPoints, profile, user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'copilot' | 'interview' | 'scholarship' | 'university' | 'budget'>('copilot');

  // Copilot (The Wise Librarian) states
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');

  // Dynamically load chat history scoped by username
  React.useEffect(() => {
    const userSuffix = user || 'guest';
    const userKey = `scholarpath_copilot_chatHistory_v1_${userSuffix}`;
    try {
      const saved = localStorage.getItem(userKey);
      if (saved) {
        setChatHistory(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.warn("Failed to load persistent chat history", e);
    }
    // Default welcome message
    setChatHistory([
      { sender: 'ai', text: 'Greetings, scholar. I am **The Wise Librarian**. Paste your academic details, ECTS queries, or ask me which fully-funded programs match your scorecards!' }
    ]);
  }, [user]);

  // Persist chat history scoped by username
  React.useEffect(() => {
    const userSuffix = user || 'guest';
    const userKey = `scholarpath_copilot_chatHistory_v1_${userSuffix}`;
    if (chatHistory.length === 0) return;
    try {
      localStorage.setItem(userKey, JSON.stringify(chatHistory));
    } catch (e) {
      console.error(e);
    }
  }, [chatHistory, user]);

  // Mock Interviewer states
  const [interviewInput, setInterviewInput] = useState('');
  const [previousTurns, setPreviousTurns] = useState<{ role: 'interviewer' | 'candidate'; text: string }[]>([]);
  const [interviewerText, setInterviewerText] = useState(
    'Welcome candidate! We are the admissions board committee. Instruct me "Ready to Begin" or click start to trigger our mock panel simulation guidelines.'
  );
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [claimXpSuccess, setClaimXpSuccess] = useState('');

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSendChat = async (e?: React.FormEvent, retryMsg?: string) => {
    if (e) e.preventDefault();
    playClickSound();

    const userMsg = retryMsg || chatInput.trim();
    if (!userMsg || chatLoading) return;

    if (!retryMsg) {
      setChatInput('');
    }
    
    setLastUserMessage(userMsg);
    setChatError(null);

    // Don't duplicate the user message on retry rendering
    if (!retryMsg) {
      setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    }
    setChatLoading(true);

    const customKey = localStorage.getItem('scholarpath_custom_gemini_key') || '';

    try {
      const res = await authorizedFetch('/api/gemini/study-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': customKey
        },
        body: JSON.stringify({ message: userMsg, chatHistory })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        throw new Error("HTTP chat endpoint returned failure code");
      }
    } catch (e) {
      console.error(e);
      setChatError("Wisdom transmission disrupted. The Librarian could not link to the Admissions indices.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (interviewLoading) return;

    const userAns = interviewInput.trim() || "I am ready to begin.";
    setInterviewInput('');
    if (interviewInput.trim()) {
      setPreviousTurns(prev => [...prev, { role: 'candidate', text: userAns }]);
    }
    setInterviewLoading(true);

    const customKey = localStorage.getItem('scholarpath_custom_gemini_key') || '';

    try {
      const res = await authorizedFetch('/api/gemini/mock-interview', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': customKey
        },
        body: JSON.stringify({ message: userAns, previousTurns })
      });
      if (res.ok) {
        const data = await res.json();
        setInterviewerText(data.response);
        setPreviousTurns(prev => [...prev, { role: 'interviewer', text: data.response }]);

        // Reward points intermittently
        if (previousTurns.length > 2 && previousTurns.length % 2 === 0) {
          const actionName = `Speaking Practice: Admissions Oral Panel Drill Turn #${previousTurns.length}`;
          if (!rewardedActionsRef.current.has(actionName)) {
            rewardedActionsRef.current.add(actionName);
            await rewardPoints(15, actionName);
            setClaimXpSuccess('Practiced Admissions Response! +15 Fellowship XP Claimed!');
            playAdvancementSound();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setClaimXpSuccess(''), 4000);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInterviewLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="scholarpath-counselling-v2">
      
      {/* Visual Subtabs Nav */}
      <div className="flex flex-wrap md:flex-nowrap bg-[#141414] border-4 border-black p-1 rounded-none gap-2">
        <button
          onClick={() => { setActiveSubTab('copilot'); playClickSound(); }}
          className={`flex-1 text-center py-2.5 cursor-pointer font-press text-[9px] uppercase tracking-wider transition-all rounded-none min-w-[120px] ${
            activeSubTab === 'copilot'
              ? 'bg-[#ffff55] text-black font-semibold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          🎓 AI Copilot
        </button>
        <button
          onClick={() => { setActiveSubTab('interview'); playClickSound(); }}
          className={`flex-1 text-center py-2.5 cursor-pointer font-press text-[9px] uppercase tracking-wider transition-all rounded-none min-w-[120px] ${
            activeSubTab === 'interview'
              ? 'bg-[#ffaa00] text-black font-semibold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          🎙️ Panel Trainer
        </button>
        <button
          onClick={() => { setActiveSubTab('scholarship'); playClickSound(); }}
          className={`flex-1 text-center py-2.5 cursor-pointer font-press text-[9px] uppercase tracking-wider transition-all rounded-none min-w-[120px] ${
            activeSubTab === 'scholarship'
              ? 'bg-[#ffff55] text-black font-semibold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          🏆 Scholarship AI
        </button>
        <button
          onClick={() => { setActiveSubTab('university'); playClickSound(); }}
          className={`flex-1 text-center py-2.5 cursor-pointer font-press text-[9px] uppercase tracking-wider transition-all rounded-none min-w-[120px] ${
            activeSubTab === 'university'
              ? 'bg-[#55ffff] text-black font-semibold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          🏢 University AI
        </button>
        <button
          onClick={() => { setActiveSubTab('budget'); playClickSound(); }}
          className={`flex-1 text-center py-2.5 cursor-pointer font-press text-[9px] uppercase tracking-wider transition-all rounded-none min-w-[120px] ${
            activeSubTab === 'budget'
              ? 'bg-[#2ecc71] text-black font-semibold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          💰 Budget AI
        </button>
      </div>

      {claimXpSuccess && (
        <div className="bg-emerald-950/40 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-[#55ff55] shrink-0" />
          <span className="mc-text-shadow">{claimXpSuccess}</span>
        </div>
      )}

      {activeSubTab === 'copilot' && (
         /* Copilot View */
        <div className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] rounded-none flex flex-col justify-between h-[550px]">
          <div className="border-b-2 border-black pb-3 flex justify-between items-center text-stone-100 flex-wrap gap-2">
            <h4 className="font-press text-[9px] uppercase tracking-wider text-[#ffff55] flex items-center gap-2 mc-text-shadow">
              <BookOpen className="w-5 h-5 text-[#ffff55] shrink-0" /> THE WISE LIBRARIAN COPILOT
            </h4>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (confirm("Reset current admissions registry session history?")) {
                    setChatHistory([{ sender: 'ai', text: 'Greetings, scholar. I am **The Wise Librarian**. Paste your academic details, ECTS queries, or ask me which fully-funded programs match your scorecards!' }]);
                    setChatError(null);
                  }
                }}
                className="text-[9px] font-mono hover:text-[#ff5552] text-stone-400 bg-stone-900 p-1 border border-stone-800 hover:border-[#ff5552] rounded-none"
              >
                🧹 CLEAR SYSTEM LOGS
              </button>
              <span className="text-[10px] font-mono text-stone-400">Node Secure Endpoint</span>
            </div>
          </div>

          {/* Messages block */}
          <div className="flex-1 my-4 overflow-y-auto space-y-4 pr-1 max-h-[350px]">
            {chatHistory.map((item, idx) => (
              <div 
                key={idx}
                className={`p-3 border-2 font-mono text-xs max-w-2xl rounded-none leading-relaxed ${
                  item.sender === 'ai'
                    ? 'bg-[#141414] border-stone-800 text-stone-200 mr-auto shadow-md'
                    : 'bg-[#333333] border-stone-700 text-stone-100 ml-auto shadow-sm'
                }`}
              >
                <div className="text-[8px] font-press uppercase text-[#ffaa00] mb-1">
                  {item.sender === 'ai' ? '💬 Lib-OS Copilot' : '👤 Candidate User'}
                </div>
                <div className="markdown-body">
                  <ReactMarkdown>{item.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="p-3 bg-stone-900 border-2 border-amber-500 text-amber-400 mr-auto max-w-xs font-mono text-[10px] animate-pulse flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                <span>Wise Librarian is reading scroll volumes...</span>
              </div>
            )}

            {chatError && (
              <div className="p-3 bg-red-950/40 border-4 border-red-500 text-red-450 mr-auto max-w-md font-mono text-[11px] gap-2">
                <p className="font-bold uppercase tracking-wider mb-2">📡 REDSTONE CHANNEL FAILURE:</p>
                <p className="mb-3 leading-relaxed">{chatError}</p>
                <button
                  type="button"
                  onClick={() => handleSendChat(undefined, lastUserMessage)}
                  className="mc-btn px-3 py-1.5 text-[9px] uppercase font-bold text-[#ffff55] bg-stone-900 hover:bg-stone-800 transition-all border-2 border-[#ffff55]"
                >
                  🔄 Retry Consultation
                </button>
              </div>
            )}
          </div>

          {/* Input tray */}
          <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t-2 border-black">
            <input
              id="copilot-chat-input"
              type="text"
              placeholder="Query credit hours matching, GPA limits, IELTS targets, or check Erasmus guidelines..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-[#141414] border-2 border-black p-3 text-xs text-stone-200 font-mono rounded-none focus:outline-none focus:border-[#ffff55]"
              required
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="mc-btn px-5 text-[9px] uppercase font-bold text-[#ffff55]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'interview' && (
        /* Mock Panel Trainer View */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Interview simulator visual board */}
          <div className="md:col-span-12 bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] rounded-none flex flex-col justify-between min-h-[460px]">
            <div className="border-b-2 border-black pb-3 flex justify-between items-center text-stone-100 flex-wrap gap-2">
              <h4 className="font-press text-[9px] uppercase tracking-wider text-[#ffaa00] flex items-center gap-2 mc-text-shadow">
                <Mic className="w-5 h-5 text-[#ffaa00] shrink-0" /> INTERVIEW PANEL SIMPROMPT
              </h4>
              <span className="text-[10px] font-mono text-stone-400 animate-pulse flex items-center gap-1">
                ● LIVE COMMIITTEE FEEDS
              </span>
            </div>

            {/* AI Professor Box */}
            <div className="my-5 p-4 bg-[#141414] border-2 border-black text-stone-200 font-mono text-xs rounded-none shadow-inner leading-relaxed space-y-3">
              <div className="flex items-center gap-2 text-[#ffaa00] font-press text-[9px] mc-text-shadow">
                <Flame className="w-4 h-4 animate-bounce shrink-0" />
                <span>Professor Miller & Professor Dubois</span>
              </div>
              
              <div className="markdown-body p-2 bg-[#1e1c1b] border-2 border-black italic text-stone-300">
                <ReactMarkdown>{interviewerText}</ReactMarkdown>
              </div>
            </div>

            {/* History backlog */}
            {previousTurns.length > 0 && (
              <div className="border border-black p-3 bg-black/40 text-[10px] font-mono text-stone-405 max-h-[140px] overflow-y-auto space-y-1">
                <span className="text-[9px] uppercase font-bold text-stone-500">Admissions transcript registers:</span>
                {previousTurns.map((turn, i) => (
                  <div key={i} className="py-1 border-b border-stone-800 flex gap-2">
                    <span className="text-stone-300 shrink-0 font-bold">[{turn.role.toUpperCase()}]:</span>
                    <span className="line-clamp-1 text-stone-400">{turn.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Input answer prompt */}
            <form onSubmit={handleSendInterview} className="mt-4 flex flex-col sm:flex-row gap-2 pt-3 border-t-2 border-black">
              <input
                type="text"
                placeholder="Declare oral responses (e.g. 'My previous computing projects demonstrate strong scalability...')"
                value={interviewInput}
                onChange={(e) => setInterviewInput(e.target.value)}
                className="flex-1 bg-[#141414] border-2 border-black p-3 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#ffff55] rounded-none w-full"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSendInterview}
                  disabled={interviewLoading}
                  className="mc-btn px-4 py-3 text-[9px] uppercase font-bold text-[#ffff55]"
                >
                  {previousTurns.length === 0 ? 'Start Mock Loop' : 'Declare speaking'}
                </button>
              </div>
            </form>

            <p className="text-[9.5px] text-stone-400 font-mono mt-3 leading-tight uppercase font-bold">
              *Advisor tip: admissions reviews favor numerical credentials, joint ECTS workloads, and structured speaking guidelines!
            </p>
          </div>
        </div>
      )}

      {activeSubTab === 'scholarship' && <ScholarshipAdvisor />}
      {activeSubTab === 'university' && <UniversityAdvisor />}
      {activeSubTab === 'budget' && <BudgetAdvisor />}

    </div>
  );
}
