import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * 🌠 ThreeScene - A fully modular, ultra-high-performance 3D canvas constellation
 * rendering engine. Color spectra, velocities, and link distances dynamically respond 
 * to active academic unlockable Biomes (Overworld, Nether, End, Aether).
 * Respects user's preferences by toggling on/off instantly.
 */
export default function ThreeScene() {
  const { theme, threeDActive, themeMode } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!threeDActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic configuration variables based on Biomes
    let nodeColor = '#55ff55';
    let lineColor = 'rgba(85, 255, 85, 0.15)';
    let particleCount = 65;
    let maxDistance = 145;
    let speedMultiplier = 1;

    if (theme === 'nether') {
      nodeColor = '#ff5555';
      lineColor = 'rgba(255, 85, 85, 0.18)';
      speedMultiplier = 1.6;
      particleCount = 75;
    } else if (theme === 'end') {
      nodeColor = '#ff55ff';
      lineColor = 'rgba(255, 85, 255, 0.16)';
      speedMultiplier = 0.8;
      maxDistance = 180;
    } else if (theme === 'aether') {
      nodeColor = '#55ffff';
      lineColor = 'rgba(85, 255, 255, 0.2)';
      speedMultiplier = 1.1;
      particleCount = 55;
    }

    // Light mode contrast correction
    if (themeMode === 'light') {
      nodeColor = theme === 'nether' ? '#c2410c' : theme === 'end' ? '#7e22ce' : theme === 'aether' ? '#0369a1' : '#15803d';
      lineColor = 'rgba(100, 116, 139, 0.08)';
    }

    interface Particle {
      x: number;
      y: number;
      z: number; // 3D depth coordinate
      vx: number;
      vy: number;
      vz: number;
      size: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 400 - 200, // Depth spans -200 to +200 pixel layers
        vx: (Math.random() * 0.8 - 0.4) * speedMultiplier,
        vy: (Math.random() * 0.8 - 0.4) * speedMultiplier,
        vz: (Math.random() * 0.6 - 0.3) * speedMultiplier,
        size: Math.random() * 2 + 1.2
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse interactive coordinates to bend particle pathways
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const renderLoop = () => {
      ctx.clearRect(0, 0, width, height);

      // 3D Projection calculations
      const fov = 350; // Field of view focal length
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Update locations
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Mouse hover interaction: gentle gravity attraction in 3D matrix
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        if (distToMouse < 200) {
          p.x += dx * 0.003;
          p.y += dy * 0.003;
        }

        // Clip bounds wrapping with depth security
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        if (p.z < -250) p.z = 250;
        if (p.z > 250) p.z = -250;

        // Project 3D vector -> 2D plane screen coordinates
        const scale = fov / (fov + p.z);
        const projX = (p.x - centerX) * scale + centerX;
        const projY = (p.y - centerY) * scale + centerY;
        const projSize = p.size * scale;

        // Skip rendering if scaling out of projection bounds
        if (projX < 0 || projY < 0 || projX > width || projY > height) continue;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(0.5, projSize), 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.shadowBlur = themeMode === 'minecraft' ? 0 : 4;
        ctx.shadowColor = nodeColor;
        ctx.fill();

        // Draw lines between proximate nodes projected in perspective space
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distSq = Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2);
          if (distSq < maxDistance * maxDistance) {
            const distance = Math.sqrt(distSq);
            const opacity = (1 - distance / maxDistance) * 0.65;
            
            // Adjust line styling
            const scale2 = fov / (fov + p2.z);
            const projX2 = (p2.x - centerX) * scale2 + centerX;
            const projY2 = (p2.y - centerY) * scale2 + centerY;

            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(projX2, projY2);
            ctx.shadowBlur = 0; // Disable blur for line performance
            ctx.strokeStyle = lineColor.replace(/[^,)]+\)$/, `${opacity})`);
            ctx.lineWidth = 0.8 * scale;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [theme, threeDActive, themeMode]);

  if (!threeDActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ mixBlendMode: themeMode === 'light' ? 'multiply' : 'screen' }}
    />
  );
}
