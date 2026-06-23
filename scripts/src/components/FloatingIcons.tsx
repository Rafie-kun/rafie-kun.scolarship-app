import React from 'react';
import { motion } from 'motion/react';

interface IconData {
  emoji: string;
  top: string;
  left: string;
  duration: number;
  delay: number;
  size: string;
}

const FLOATERS: IconData[] = [
  { emoji: '🎓', top: '15%', left: '8%', duration: 4.5, delay: 0, size: 'text-4xl' },
  { emoji: '🌍', top: '75%', left: '5%', duration: 5.2, delay: 0.8, size: 'text-3xl animate-pulse' },
  { emoji: '📚', top: '25%', left: '85%', duration: 4.8, delay: 0.3, size: 'text-4xl' },
  { emoji: '💡', top: '82%', left: '88%', duration: 5.5, delay: 1.2, size: 'text-3.5xl' },
  { emoji: '🏆', top: '50%', left: '92%', duration: 4.2, delay: 0.5, size: 'text-4xl' },
  { emoji: '✍️', top: '65%', left: '12%', duration: 5.0, delay: 1.5, size: 'text-2.5xl' },
  { emoji: '🌟', top: '8%', left: '72%', duration: 3.8, delay: 0.2, size: 'text-3.5xl' }
];

export default function FloatingIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {FLOATERS.map((floater, i) => (
        <motion.div
          key={i}
          className={`absolute ${floater.size} opacity-40 dark:opacity-25 hover:opacity-60 transition-opacity filter drop-shadow-[0_4px_12px_rgba(245,200,66,0.25)]`}
          style={{
            top: floater.top,
            left: floater.left,
          }}
          animate={{
            y: [0, -25, 0],
            rotate: [2, -6, 2],
          }}
          transition={{
            duration: floater.duration,
            delay: floater.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {floater.emoji}
        </motion.div>
      ))}
    </div>
  );
}
