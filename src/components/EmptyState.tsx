import React from 'react';
import { Sparkles, Calendar, Award } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({ 
  title, 
  description, 
  buttonText, 
  onAction, 
  icon 
}: EmptyStateProps) {
  return (
    <div className="mc-window bg-[#2a2421] border-4 border-black p-8 text-center max-w-2xl mx-auto [box-shadow:inset_-4px_-4px_0_#171412,inset_4px_4px_0_#433833] space-y-6" id="mc-empty-state">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-black/40 border-4 border-black flex items-center justify-center relative">
          {icon || <Sparkles className="w-8 h-8 text-[#ffff55] animate-pulse" />}
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ffff55] border border-black"></div>
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#ffff55] border border-black"></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-press text-xs text-[#ffff55] mc-text-shadow uppercase tracking-wider">{title}</h3>
        <p className="font-mono text-stone-300 text-xs leading-relaxed max-w-md mx-auto">{description}</p>
      </div>

      {buttonText && onAction && (
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onAction();
          }}
          className="mc-btn font-press text-[9px] py-3 px-6 text-black bg-[#ffff55] border-2 border-black inline-flex items-center gap-2"
        >
          ⛏️ {buttonText}
        </button>
      )}
    </div>
  );
}
