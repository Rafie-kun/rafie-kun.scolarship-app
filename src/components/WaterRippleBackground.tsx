import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function WaterRippleBackground() {
  const { theme, themeMode } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let animationId: number;

    // Ripple parameters
    interface Ripple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      strength: number;
      speed: number;
    }

    const ripples: Ripple[] = [];

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const addRipple = (x: number, y: number, isClick = false) => {
      ripples.push({
        x,
        y,
        radius: 0,
        maxRadius: isClick ? Math.min(width, height) * 0.45 : 125,
        strength: isClick ? 1.0 : 0.4,
        speed: isClick ? 5.5 : 3.5,
      });

      // Keep array size checked
      if (ripples.length > 22) {
        ripples.shift();
      }
    };

    // Listeners
    const handleMouseMove = (e: MouseEvent) => {
      // Periodic chance to emit standard move ripple to save performance
      if (Math.random() < 0.12) {
        addRipple(e.clientX, e.clientY, false);
      }
    };

    const handleClick = (e: MouseEvent) => {
      addRipple(e.clientX, e.clientY, true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // Auto spawn random gentle drops
    const dropInterval = setInterval(() => {
      if (Math.random() < 0.4) {
        addRipple(Math.random() * width, Math.random() * height, false);
      }
    }, 2800);

    // Gradient properties based on themes
    const getThemeColors = () => {
      if (themeMode === 'light') {
        return {
          bg1: '#f5f7fb',
          bg2: '#eaf0f9',
          rippleColor: 'rgba(129, 140, 248, 0.08)',
          gridColor: 'rgba(15, 43, 91, 0.02)',
        };
      } else {
        // Dark/Cosmic Spec
        if (theme === 'nether') {
          return {
            bg1: '#0f0505',
            bg2: '#200808',
            rippleColor: 'rgba(239, 68, 68, 0.06)',
            gridColor: 'rgba(239, 68, 68, 0.015)',
          };
        } else if (theme === 'end') {
          return {
            bg1: '#090312',
            bg2: '#160824',
            rippleColor: 'rgba(192, 38, 211, 0.06)',
            gridColor: 'rgba(192, 38, 211, 0.015)',
          };
        } else if (theme === 'aether') {
          return {
            bg1: '#020d1a',
            bg2: '#081c33',
            rippleColor: 'rgba(6, 182, 212, 0.06)',
            gridColor: 'rgba(6, 182, 212, 0.015)',
          };
        }
        // Overworld/Default Dark
        return {
          bg1: '#080a10',
          bg2: '#0e1220',
          rippleColor: 'rgba(59, 130, 246, 0.06)',
          gridColor: 'rgba(59, 130, 246, 0.015)',
        };
      }
    };

    const draw = () => {
      const colors = getThemeColors();

      // Clear with soft gradient transition
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, colors.bg1);
      bgGrad.addColorStop(1, colors.bg2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render mesh grid affected by Active Rings
      const gridSize = 45;
      ctx.strokeStyle = colors.gridColor;
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y < height; y += 15) {
          // Deform vertex coord based on active expanding ripples math
          let offsetX = 0;
          let offsetY = 0;

          ripples.forEach((ripple) => {
            const dx = x - ripple.x;
            const dy = y - ripple.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Sine modulation representing actual mechanical water waves
            if (dist < ripple.radius && dist > ripple.radius - 80) {
              const fade = (1 - dist / ripple.maxRadius) * ripple.strength;
              if (fade > 0) {
                const angle = Math.atan2(dy, dx);
                const shift = Math.sin((dist - ripple.radius) * 0.15) * 12 * fade;
                offsetX += Math.cos(angle) * shift;
                offsetY += Math.sin(angle) * shift;
              }
            }
          });

          if (y === 0) {
            ctx.moveTo(x + offsetX, y + offsetY);
          } else {
            ctx.lineTo(x + offsetX, y + offsetY);
          }
        }
        ctx.stroke();
      }

      // Draw expanding concentric circle waves
      ripples.forEach((ripple, index) => {
        ripple.radius += ripple.speed;
        ripple.strength *= 0.975; // decay strength

        if (ripple.radius > ripple.maxRadius || ripple.strength < 0.01) {
          ripples.splice(index, 1);
          return;
        }

        // Concentric waves
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = colors.rippleColor.replace('0.06', (0.12 * ripple.strength).toFixed(3));
        ctx.lineWidth = 2.5 * ripple.strength;
        ctx.stroke();

        // Secondary ripple step
        if (ripple.radius > 30) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius - 30, 0, Math.PI * 2);
          ctx.strokeStyle = colors.rippleColor.replace('0.06', (0.06 * ripple.strength).toFixed(3));
          ctx.lineWidth = 1.2 * ripple.strength;
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      clearInterval(dropInterval);
      cancelAnimationFrame(animationId);
    };
  }, [theme, themeMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-normal transition-opacity duration-500"
      style={{ opacity: themeMode === 'minecraft' ? 0 : 1 }}
    />
  );
}
