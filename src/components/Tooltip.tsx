import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
}

export default function Tooltip({ content, position = 'right', children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div 
      className="relative inline-block w-full"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div 
          className={`absolute z-50 pointer-events-none whitespace-normal max-w-xs bg-[#1a1816] text-[#ffff55] border-2 border-stone-700 px-2.5 py-1.5 text-[10.5px] font-mono leading-tight shadow-xl ${positionClasses[position]} animate-in fade-in zoom-in-95 duration-100`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
