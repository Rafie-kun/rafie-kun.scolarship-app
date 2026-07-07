import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number; // initial X %
  y: number; // initial Y %
  destX: number; // destination translation X (px)
  destY: number; // destination translation Y (px)
  color: string;
  size: number;
  rotation: number;
  delay: number;
  shape: 'square' | 'circle' | 'triangle';
}

interface ConfettiExplosionProps {
  onComplete?: () => void;
}

export default function ConfettiExplosion({ onComplete }: ConfettiExplosionProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const colors = [
    '#55ff55', // light green
    '#ffff55', // yellow
    '#ff5555', // light red
    '#55ffff', // cyan
    '#ff55ff', // purple/magenta
    '#ffaa00', // gold/orange
    '#ffffff', // white
  ];

  const shapes: Array<'square' | 'circle' | 'triangle'> = ['square', 'circle', 'triangle'];

  useEffect(() => {
    // Generate 120 particles bursting from center-bottom or left/right bottom
    const newParticles: Particle[] = Array.from({ length: 120 }).map((_, i) => {
      // Determine side: 0 = left bottom corner, 1 = right bottom corner, 2 = center bottom
      const side = i % 3;
      let startX = 50;
      let startY = 90;
      if (side === 0) {
        startX = 10;
        startY = 95;
      } else if (side === 1) {
        startX = 90;
        startY = 95;
      }

      // Physics params: shoot up and out
      const angleDeg = side === 0 
        ? -25 - Math.random() * 50 // Shoot right-up
        : side === 1
          ? -105 - Math.random() * 50 // Shoot left-up
          : -45 - Math.random() * 90; // Shoot up

      const angleRad = (angleDeg * Math.PI) / 180;
      const velocity = 350 + Math.random() * 500; // speed
      
      const destX = Math.cos(angleRad) * velocity;
      // Shoot up, then let gravity pull them down, so destination Y is a high upward offset first
      const destY = Math.sin(angleRad) * velocity;

      return {
        id: i,
        x: startX,
        y: startY,
        destX,
        destY,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 6, // 6px to 16px
        rotation: Math.random() * 720 - 360,
        delay: Math.random() * 0.25,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      };
    });

    setParticles(newParticles);

    // Auto cleanup
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden">
      {particles.map((p) => {
        // Draw triangles using clipPath
        const clipPathStyle = p.shape === 'triangle' 
          ? 'polygon(50% 0%, 0% 100%, 100% 100%)' 
          : 'none';
        const borderRadius = p.shape === 'circle' ? '50%' : '0%';

        return (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 1, 
              scale: 0,
              x: `${p.x}vw`, 
              y: `${p.y}vh`,
              rotate: 0 
            }}
            animate={{ 
              opacity: [1, 1, 1, 0.8, 0],
              scale: [0, 1.2, 1, 0.8, 0.3],
              // Simulate projectile motion
              x: [
                `${p.x}vw`, 
                `calc(${p.x}vw + ${p.destX * 0.4}px)`, 
                `calc(${p.x}vw + ${p.destX * 0.8}px)`, 
                `calc(${p.x}vw + ${p.destX}px)`
              ],
              y: [
                `${p.y}vh`, 
                `calc(${p.y}vh + ${p.destY * 0.7}px)`, // Peak of trajectory
                `calc(${p.y}vh + ${p.destY * 0.2}px + 150px)`, // Falling
                `calc(${p.y}vh + ${p.destY * 0.1}px + 500px)`  // Down off-screen
              ],
              rotate: p.rotation
            }}
            transition={{ 
              duration: 2.8 + Math.random() * 1.2, 
              ease: "easeOut",
              delay: p.delay
            }}
            className="absolute shadow-sm"
            style={{
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius,
              clipPath: clipPathStyle,
              border: '2px solid black', // retro pixel-art black border
            }}
          />
        );
      })}
    </div>
  );
}
