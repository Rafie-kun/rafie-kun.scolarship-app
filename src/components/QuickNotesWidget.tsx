import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scroll, X, Save, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';

export default function QuickNotesWidget() {
  const { profile, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Hydrate notes state when profile loads
  useEffect(() => {
    if (profile) {
      setNotes(profile.quickNotes || '');
    }
  }, [profile?.quickNotes]);

  // Debounced auto-saving effect
  useEffect(() => {
    if (!profile || notes === (profile.quickNotes || '')) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      if (updateProfile) {
        await updateProfile({ quickNotes: notes });
      }
      setIsSaving(false);
      setSaveStatus('saved');
      
      const statusTimer = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      return () => clearTimeout(statusTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, [notes, profile, updateProfile]);

  const toggleOpen = () => {
    playClickSound();
    setIsOpen(!isOpen);
  };

  const handleManualSave = async () => {
    playAdvancementSound();
    setIsSaving(true);
    if (updateProfile) {
      await updateProfile({ quickNotes: notes });
    }
    setIsSaving(false);
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  if (!profile) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono text-stone-200 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mb-4 w-72 bg-[#2c2c2c] border-4 border-black p-4 shadow-2xl [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] relative"
          >
            {/* Wooden trim header */}
            <div className="bg-[#4d4d4d] text-[#ffffff] px-2 py-1.5 border-2 border-black flex justify-between items-center mb-3 font-press text-[9px] mc-text-shadow">
              <span className="flex items-center gap-1">📓 SCHOLAR SCROLL</span>
              <button
                onClick={toggleOpen}
                className="text-stone-300 hover:text-[#ff5555] cursor-pointer"
                title="Close Notes"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] text-stone-400 mb-2 font-sans italic leading-tight">
              Draft application ideas, essay prompts, or scholarship reminders.
            </p>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down notes, links, or admission criteria..."
              className="w-full h-36 bg-black border-2 border-stone-850 p-2.5 text-stone-200 text-xs outline-none focus:border-[#ffff55] resize-none font-mono"
            />

            <div className="flex justify-between items-center mt-3 text-[10px]">
              <span className="text-stone-400">
                {isSaving ? (
                  <span className="text-amber-400 animate-pulse">Scribing scroll...</span>
                ) : saveStatus === 'saved' ? (
                  <span className="text-[#55ff55] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Draft Saved!
                  </span>
                ) : (
                  <span className="text-stone-500">Drafting idle</span>
                )}
              </span>

              <button
                onClick={handleManualSave}
                className="mc-btn px-2.5 py-1 text-[8px] text-[#ffff55] uppercase font-bold flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3 h-3" /> Save Scroll
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={toggleOpen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-14 h-14 rounded-none border-4 border-black flex items-center justify-center text-stone-100 shadow-2xl transition-all cursor-pointer relative ${
          isOpen 
            ? 'bg-amber-950 border-[#ffaa00]' 
            : 'bg-stone-800 border-stone-600 hover:bg-stone-750'
        }`}
        title="Scholar Quick Notes Scroll"
      >
        <Scroll className={`w-6 h-6 ${isOpen ? 'text-[#ffff55]' : 'text-amber-400'}`} />
        
        {notes.trim().length > 0 && !isOpen && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-600 border-2 border-black animate-pulse rounded-full" />
        )}
      </motion.button>
    </div>
  );
}
