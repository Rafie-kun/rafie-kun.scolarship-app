import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, User, Bot, HelpCircle } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { playClickSound, playAdvancementSound } from '../../utils/sound';

export default function OnboardingAIAssistant() {
  const onboarding = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'user' | 'bot' }>>([
    { 
      id: 'init-1', 
      text: `Hello! I am your ScholarPath AI Academic Guide. I see you are configuring your profile. How can I help you optimize your academic paths or estimate study costs today?`, 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    "What subjects should I take for Computer Science?",
    "How much does it cost to study in Germany?",
    "Am I eligible for DAAD scholarships?",
    "Can I work part-time as a student?"
  ];

  const handleToggle = () => {
    playClickSound();
    setIsOpen(!isOpen);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    playClickSound();
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, text: textToSend, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('scholarpath_token');
      const response = await fetch('/api/ai/wizard-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          question: textToSend,
          onboardingState: {
            country: onboarding.country,
            educationLevel: onboarding.educationLevel,
            selectedCurricula: onboarding.selectedCurricula,
            targetCountry: onboarding.targetCountry,
            gpaResults: onboarding.gpaResults,
            subjects: onboarding.subjects,
            rent: onboarding.rent,
            food: onboarding.food,
            monthlyNetWage: onboarding.monthlyNetWage
          }
        })
      });

      if (!response.ok) {
        throw new Error("Network response failed");
      }

      const data = await response.json();
      playAdvancementSound();
      setMessages(prev => [...prev, { 
        id: `bot-${Date.now()}`, 
        text: data.answer || "I received your message! Let me know if you need help with GPA, subjects, or budget estimations.", 
        sender: 'bot' 
      }]);
    } catch (err) {
      console.error("AI assistant error:", err);
      setMessages(prev => [...prev, { 
        id: `bot-err-${Date.now()}`, 
        text: "Apologies, I encountered a response failure. Please make sure your server is running and your database is online.", 
        sender: 'bot' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono text-xs" id="onboarding-ai-assistant">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="bg-stone-900 border-4 border-black p-3 text-[#ffff55] hover:text-[#55ff55] hover:border-[#ffff55] transition-all flex items-center gap-2 [box-shadow:inset_-2px_-2px_0_#141414,inset_2px_2px_0_#555] active:scale-95 cursor-pointer shadow-2xl animate-bounce"
        >
          <Sparkles className="w-5 h-5 text-[#ffff55]" />
          <span className="font-press text-[9px] uppercase tracking-wider hidden sm:inline">Ask AI Scribe</span>
        </button>
      )}

      {/* Floating Chat Window Overlay */}
      {isOpen && (
        <div className="w-[340px] sm:w-[400px] h-[480px] bg-[#221c19] border-4 border-black flex flex-col [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] shadow-2xl">
          
          {/* Header */}
          <div className="bg-[#2c2420] border-b-4 border-black p-3.5 flex justify-between items-center text-stone-200">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="font-press text-[9px] text-[#ffff55] uppercase mc-text-shadow flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#ffff55]" /> AI Advisor Companion
              </h4>
            </div>
            <button 
              onClick={handleToggle} 
              className="text-stone-400 hover:text-white cursor-pointer hover:scale-115 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Log Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/35">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 shrink-0 bg-stone-950 border border-stone-800 flex items-center justify-center text-[#ffff55]">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                
                <div 
                  className={`p-3 max-w-[80%] border ${
                    msg.sender === 'user' 
                      ? 'bg-stone-900/90 border-[#ffff55]/20 text-stone-200' 
                      : 'bg-stone-950 border-stone-800 text-stone-300 leading-relaxed'
                  }`}
                >
                  <p className="whitespace-pre-line text-[11px] font-mono">{msg.text}</p>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 shrink-0 bg-[#ffff55] border border-black flex items-center justify-center text-black font-extrabold text-[9px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2 items-center text-[#ffff55] font-press text-[8px] animate-pulse py-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#ffff55]" />
                <span>AI IS TRANSLATING LEDGERS...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          <div className="p-2 border-t border-stone-900 bg-[#1e1816]/75">
            <span className="text-[8px] uppercase font-bold text-stone-400 block mb-1.5 px-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Quick inquiries:
            </span>
            <div className="flex flex-wrap gap-1">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={loading}
                  className="bg-black/55 text-stone-300 border border-stone-800 text-[9px] px-2 py-1 hover:border-[#ffff55] hover:text-[#ffff55] cursor-pointer text-left transition-all max-w-full truncate rounded-none font-sans"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
            className="p-3 bg-[#1e1816] border-t-4 border-black flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about studies & budgets..."
              disabled={loading}
              className="flex-1 bg-[#120f0d] border-2 border-black p-2.5 text-stone-200 outline-none focus:border-[#ffff55] disabled:opacity-50 text-[11px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-[#ffff55] hover:bg-yellow-400 text-black border-2 border-black px-3 py-1 flex items-center justify-center disabled:opacity-20 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4 shrink-0" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
