// src/components/WindBackground.jsx
// ------------------------------------------------------------------
// Realistic Atmospheric Wind & Clean Air Streamlines Background
//
// Features:
// - Silky smooth sinusoidal wind ribbons & streamlines flowing across the screen
// - Ambient micro-particles / airborne pollen drifting along atmospheric currents
// - Organic wind speed modulation (gentle gusts and calm breezes)
// - Highly performant 60fps canvas with automatic resize handling
// - Pointer-events none to ensure zero interaction interference
// ------------------------------------------------------------------

import React, { useEffect, useRef } from 'react';

export default function WindBackground({ className = '' }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let isTabVisible = true;

    // Handle high DPI crispness
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Number of streamlines and particles based on screen width
    const getStreamlineCount = () => Math.max(12, Math.floor(width / 90));
    const getParticleCount = () => Math.max(25, Math.floor(width / 45));

    // Colors matching BreatheRoute botanical mint & atmospheric sky tones
    const STREAM_COLORS = [
      'rgba(74, 222, 128, ',  // mint green
      'rgba(52, 211, 153, ',  // emerald mint
      'rgba(56, 189, 248, ',  // sky cyan
      'rgba(167, 243, 208, ', // pale jade
    ];

    // Initialize Wind Streamlines
    let streamlines = [];
    const initStreamlines = () => {
      streamlines = [];
      const count = getStreamlineCount();
      for (let i = 0; i < count; i += 1) {
        streamlines.push({
          x: Math.random() * (width + 400) - 200,
          y: Math.random() * height,
          length: 120 + Math.random() * 260,
          speed: 1.2 + Math.random() * 2.2,
          amplitude: 8 + Math.random() * 20,
          frequency: 0.003 + Math.random() * 0.005,
          phase: Math.random() * Math.PI * 2,
          width: 0.8 + Math.random() * 1.8,
          baseAlpha: 0.08 + Math.random() * 0.16,
          colorPrefix: STREAM_COLORS[Math.floor(Math.random() * STREAM_COLORS.length)],
        });
      }
    };

    // Initialize Atmospheric Dust / Spores / Breeze Particles
    let particles = [];
    const initParticles = () => {
      particles = [];
      const count = getParticleCount();
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.8 + Math.random() * 1.8,
          speedX: 0.8 + Math.random() * 2.4,
          speedY: (Math.random() - 0.5) * 0.4,
          alpha: 0.12 + Math.random() * 0.25,
          colorPrefix: STREAM_COLORS[Math.floor(Math.random() * STREAM_COLORS.length)],
          floatOffset: Math.random() * 100,
        });
      }
    };

    initStreamlines();
    initParticles();

    let globalTick = 0;

    const render = () => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      globalTick += 0.015;

      // Realistic global gust modulation (slow sinusoidal rise and fall)
      const gustFactor = 1 + 0.35 * Math.sin(globalTick * 0.6) + 0.2 * Math.cos(globalTick * 1.1);

      // 1. Draw and update Wind Streamlines
      for (let i = 0; i < streamlines.length; i += 1) {
        const s = streamlines[i];
        s.x += s.speed * gustFactor;

        // Reset when stream leaves right edge
        if (s.x - s.length > width) {
          s.x = -s.length - Math.random() * 150;
          s.y = Math.random() * height;
          s.speed = 1.2 + Math.random() * 2.2;
        }

        // Draw curved streamline with gradient fade
        const startX = s.x - s.length;
        const endX = s.x;

        if (endX > 0 && startX < width) {
          ctx.beginPath();
          const segments = 12;
          const step = s.length / segments;

          for (let seg = 0; seg <= segments; seg += 1) {
            const px = startX + seg * step;
            // Sinusoidal wave shape along y
            const py = s.y + Math.sin(px * s.frequency + s.phase + globalTick) * s.amplitude;

            if (seg === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }

          // Create subtle gradient so line tapers at head and tail
          const grad = ctx.createLinearGradient(startX, s.y, endX, s.y);
          grad.addColorStop(0, `${s.colorPrefix}0)`);
          grad.addColorStop(0.35, `${s.colorPrefix}${s.baseAlpha * 0.8})`);
          grad.addColorStop(0.7, `${s.colorPrefix}${s.baseAlpha})`);
          grad.addColorStop(1, `${s.colorPrefix}0)`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = s.width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // 2. Draw and update Floating Atmospheric Spores / Breeze Particles
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.speedX * gustFactor;
        p.y += p.speedY + Math.sin(globalTick + p.floatOffset) * 0.35;

        // Aerodynamic interaction: breeze deflects gently around cursor
        if (mouseRef.current.active) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100 && dist > 1) {
            const push = (1 - dist / 100) * 1.8;
            p.x += (dx / dist) * push;
            p.y += (dy / dist) * push;
          }
        }

        // Reset if drifted beyond canvas
        if (p.x > width + 20) {
          p.x = -20;
          p.y = Math.random() * height;
        }
        if (p.y > height + 20) p.y = -20;
        if (p.y < -20) p.y = height + 20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${p.alpha})`;
        ctx.shadowColor = `${p.colorPrefix}0.4)`;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // Subtle atmospheric breath glow following the cursor
      if (mouseRef.current.active) {
        const glow = ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          75
        );
        glow.addColorStop(0, 'rgba(74, 222, 128, 0.08)');
        glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.03)');
        glow.addColorStop(1, 'rgba(74, 222, 128, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 75, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        opacity: 0.85,
        mixBlendMode: 'screen',
      }}
    />
  );
}
