import React from 'react';
import { playClickSound } from '../../utils/sound';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'orange' | 'blue' | 'grape' | 'grass' | 'amber';
}

export default function GradientButton({ 
  children, 
  className = '', 
  variant = 'blue', 
  onClick, 
  ...props 
}: GradientButtonProps) {
  const gradientMap = {
    orange: 'from-orange-500 via-amber-500 to-orange-600 focus:ring-orange-400/50 shadow-orange-500/15 hover:shadow-orange-500/30',
    blue: 'from-blue-600 via-indigo-600 to-blue-700 focus:ring-blue-500/50 shadow-blue-600/15 hover:shadow-blue-600/30',
    grape: 'from-purple-600 via-pink-600 to-purple-700 focus:ring-pink-500/50 shadow-pink-600/15 hover:shadow-pink-600/30',
    grass: 'from-emerald-500 via-teal-500 to-emerald-600 focus:ring-emerald-400/50 shadow-emerald-500/15 hover:shadow-emerald-500/30',
    amber: 'from-[#f5c842] via-orange-400 to-[#db9c1a] focus:ring-amber-400/50 shadow-amber-500/15 hover:shadow-amber-500/30'
  };

  const selectedGradient = gradientMap[variant] || gradientMap.blue;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClickSound();
    if (onClick) onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative px-6 py-3 
        bg-gradient-to-r ${selectedGradient} 
        text-white font-extrabold text-sm tracking-wide 
        rounded-full shadow-lg 
        transition-all duration-300 ease-out 
        hover:scale-105 active:scale-95 
        focus:outline-none focus:ring-4 
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none 
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
