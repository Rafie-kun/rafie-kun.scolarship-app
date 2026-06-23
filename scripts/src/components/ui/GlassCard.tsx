import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export default function GlassCard({ children, className = '', hoverEffect = true, ...props }: GlassCardProps) {
  return (
    <div
      className={`
        bg-white/10 dark:bg-slate-900/40 
        backdrop-blur-xl 
        border border-white/20 dark:border-slate-800/60 
        rounded-2xl p-6 
        shadow-[0_8px_32px_0_rgba(15,43,91,0.1)] 
        dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
        transition-all duration-300 ease-out 
        ${hoverEffect ? 'hover:shadow-[0_12px_40px_0_rgba(15,43,91,0.18)] dark:hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:border-white/35 dark:hover:border-slate-750/80 bg-gradient-to-br from-white/15 to-white/5 dark:from-slate-900/50 dark:to-slate-900/30' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
