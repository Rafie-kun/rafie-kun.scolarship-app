import React, { useRef, useEffect } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Cube {
  id: number;
  x: number; // initial position
  y: number;
  z: number;
  size: number;
  colorType: 'gold' | 'diamond' | 'emerald' | 'obsidian';
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  angleX: number;
  angleY: number;
  angleZ: number;
  hoverOffset: number;
  hoverSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export default function MinecraftWorld() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track cursor for smooth parallax shifts
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX - width / 2) / (width / 2);
      mouseRef.current.targetY = (e.clientY - height / 2) / (height / 2);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Instantiate beautifully floating voxel models
    const cubeCount = 6;
    const cubes: Cube[] = [];
    const colors: Cube['colorType'][] = ['gold', 'diamond', 'emerald', 'obsidian', 'diamond', 'gold'];

    for (let i = 0; i < cubeCount; i++) {
      const angle = (i / cubeCount) * Math.PI * 2;
      const radius = 220 + Math.random() * 80;
      cubes.push({
        id: i,
        // Place them in a nice circle around the edges
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * (radius * 0.6) - 50,
        z: -100 + Math.random() * 200,
        size: 35 + Math.random() * 20,
        colorType: colors[i % colors.length],
        rotSpeedX: 0.003 + Math.random() * 0.005,
        rotSpeedY: 0.004 + Math.random() * 0.006,
        rotSpeedZ: 0.002 + Math.random() * 0.004,
        angleX: Math.random() * Math.PI,
        angleY: Math.random() * Math.PI,
        angleZ: Math.random() * Math.PI,
        hoverOffset: Math.random() * Math.PI * 2,
        hoverSpeed: 0.015 + Math.random() * 0.01
      });
    }

    // Sparkle dust elements
    const particles: Particle[] = [];
    const createExplosion = (x: number, y: number, colorTheme: string) => {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 1 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 1,
          color: colorTheme,
          size: 2 + Math.random() * 3,
          life: 0,
          maxLife: 30 + Math.random() * 20
        });
      }
    };

    // When clicking canvas, trigger block break particle animations blocky style
    const handleCanvasClick = (e: MouseEvent) => {
      // Find closest cube on screen space
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let closestCube: Cube | null = null;
      let minDist = 80; // trigger radius

      cubes.forEach(cube => {
        // Simple bounding box proxy
        const parallaxX = mouseRef.current.x * 30;
        const parallaxY = mouseRef.current.y * 30;
        const screenX = width / 2 + cube.x + parallaxX;
        const screenY = height / 2 + cube.y + parallaxY + Math.sin(cube.hoverOffset) * 15;
        
        const dist = Math.hypot(clickX - screenX, clickY - screenY);
        if (dist < minDist) {
          minDist = dist;
          closestCube = cube;
        }
      });

      if (closestCube) {
        const c = closestCube as Cube;
        const parallaxX = mouseRef.current.x * 30;
        const parallaxY = mouseRef.current.y * 30;
        const screenX = width / 2 + c.x + parallaxX;
        const screenY = height / 2 + c.y + parallaxY + Math.sin(c.hoverOffset) * 15;

        let col = '#ffff55';
        if (c.colorType === 'diamond') col = '#55ffff';
        if (c.colorType === 'emerald') col = '#55ff55';
        if (c.colorType === 'obsidian') col = '#d155ff';

        createExplosion(screenX, screenY, col);

        // Boost speed momentarily
        c.rotSpeedX *= 4;
        c.rotSpeedY *= 4;
        setTimeout(() => {
          c.rotSpeedX /= 4;
          c.rotSpeedY /= 4;
        }, 800);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    // 3D Projection Matrices math functions
    const project = (point: Point3D, angleX: number, angleY: number, angleZ: number, size: number): Point3D => {
      // Rotate around X
      let y1 = point.y * Math.cos(angleX) - point.z * Math.sin(angleX);
      let z1 = point.y * Math.sin(angleX) + point.z * Math.cos(angleX);

      // Rotate around Y
      let x2 = point.x * Math.cos(angleY) + z1 * Math.sin(angleY);
      let z2 = -point.x * Math.sin(angleY) + z1 * Math.cos(angleY);

      // Rotate around Z
      let x3 = x2 * Math.cos(angleZ) - y1 * Math.sin(angleZ);
      let y3 = x2 * Math.sin(angleZ) + y1 * Math.cos(angleZ);

      // Apply size scaling
      return { x: x3 * size, y: y3 * size, z: z2 };
    };

    // Main Canvas Render Loop
    const render = () => {
      // Background clean with gentle voxel gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#100c0a');
      bgGrad.addColorStop(0.5, '#161311');
      bgGrad.addColorStop(1, '#0c0a0a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Parallax smooth interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      const parallaxX = mouseRef.current.x * 25;
      const parallaxY = mouseRef.current.y * 25;

      // Draw starry ambient ash rising
      if (Math.random() < 0.15) {
        particles.push({
          x: Math.random() * width,
          y: height + 10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.4 - Math.random() * 0.8,
          color: Math.random() > 0.5 ? 'rgba(255,234,85,0.45)' : 'rgba(85,255,255,0.3)',
          size: 1.5 + Math.random() * 2,
          life: 0,
          maxLife: 150 + Math.random() * 100
        });
      }

      // Render & update active particle streams
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const opacity = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, opacity);
        ctx.fillRect(p.x, p.y, p.size, p.size); // pixelated squares

        if (p.life >= p.maxLife || p.x < 0 || p.x > width || p.y < 0) {
          particles.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1.0;

      // Render rotating isometric 3D cubes
      cubes.forEach(cube => {
        cube.angleX += cube.rotSpeedX;
        cube.angleY += cube.rotSpeedY;
        cube.angleZ += cube.rotSpeedZ;
        cube.hoverOffset += cube.hoverSpeed;

        const cy = cube.y + Math.sin(cube.hoverOffset) * 12;
        const cx = cube.x + parallaxX;
        const worldY = height / 2 + cy + parallaxY;
        const worldX = width / 2 + cx;

        // Cube corner point coordinates
        const vertices = [
          { x: -1, y: -1, z: -1 },
          { x: 1, y: -1, z: -1 },
          { x: 1, y: 1, z: -1 },
          { x: -1, y: 1, z: -1 },
          { x: -1, y: -1, z: 1 },
          { x: 1, y: -1, z: 1 },
          { x: 1, y: 1, z: 1 },
          { x: -1, y: 1, z: 1 }
        ];

        // Map vertices through angle projections
        const projectedPoints = vertices.map(v => 
          project(v, cube.angleX, cube.angleY, cube.angleZ, cube.size)
        );

        // Define faces mapping with index indices
        const faces = [
          { indices: [0, 1, 2, 3], normalZ: -1, colorShift: 1.15 }, // Front
          { indices: [1, 5, 6, 2], normalZ: 0, colorShift: 0.95 },  // Right
          { indices: [4, 5, 6, 7], normalZ: 1, colorShift: 0.65 },  // Back
          { indices: [0, 4, 7, 3], normalZ: 0, colorShift: 1.0 },   // Left
          { indices: [0, 1, 5, 4], normalZ: 0, colorShift: 1.3 },   // Top
          { indices: [3, 2, 6, 7], normalZ: 0, colorShift: 0.8 }    // Bottom
        ];

        // Sort faces using simple painter's back-to-front depth calculation (Z average)
        const sortedFaces = faces
          .map(f => {
            const avgZ = f.indices.reduce((sum, idx) => sum + projectedPoints[idx].z, 0) / 4;
            return { f, avgZ };
          })
          .sort((a, b) => b.avgZ - a.avgZ);

        // Fetch palette color strings representing textures
        const getVoxelColor = (type: Cube['colorType'], shift: number) => {
          let r = 100, g = 100, b = 100;
          if (type === 'gold') { r = 245; g = 200; b = 66; }
          if (type === 'diamond') { r = 85; g = 255; b = 255; }
          if (type === 'emerald') { r = 85; g = 255; b = 85; }
          if (type === 'obsidian') { r = 40; g = 25; b = 75; }

          const finalR = Math.max(0, Math.min(255, Math.floor(r * shift)));
          const finalG = Math.max(0, Math.min(255, Math.floor(g * shift)));
          const finalB = Math.max(0, Math.min(255, Math.floor(b * shift)));
          return `rgb(${finalR}, ${finalG}, ${finalB})`;
        };

        // Draw cube facets
        sortedFaces.forEach(({ f }) => {
          ctx.beginPath();
          f.indices.forEach((pIdx, idx) => {
            const pt = projectedPoints[pIdx];
            if (idx === 0) {
              ctx.moveTo(worldX + pt.x, worldY + pt.y);
            } else {
              ctx.lineTo(worldX + pt.x, worldY + pt.y);
            }
          });
          ctx.closePath();

          ctx.fillStyle = getVoxelColor(cube.colorType, f.colorShift);
          ctx.fill();

          // Black block outline like Minecraft cell shaders
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.lineJoin = 'miter';
          ctx.stroke();

          // Highlight overlay to give blockiness
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fill();
        });
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="scholarpath-3d-background-grid"
      className="fixed inset-0 w-full h-full pointer-events-auto z-[-1] overflow-hidden opacity-90 transition-opacity duration-500"
      style={{ touchAction: 'none' }}
    />
  );
}
