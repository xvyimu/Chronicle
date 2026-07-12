'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
}

const PARTICLE_COUNT = 40;
const CONNECTION_DIST = 120;

function useFinePointerDesktop() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 768px) and (pointer: fine)');
    const apply = () => setOk(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return ok;
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const desktopFine = useFinePointerDesktop();
  const enabled = !reduced && desktopFine;

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let w = 0;
    let h = 0;
    let isVisible = true;
    let pageVisible = document.visibilityState !== 'hidden';

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      // Clamp devicePixelRatio to 2 — higher values cause excessive
      // canvas resolution on high-DPI displays without visible quality gain
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      // Reset transform before scaling to avoid accumulation on resize
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const particles: Particle[] = [];

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 2 + 1,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
    };

    const draw = () => {
      if (!isVisible || !pageVisible) return;

      ctx.clearRect(0, 0, w, h);

      // Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(89, 117, 109, ${p.opacity})`;
        ctx.fill();
      }

      // Connections — use squared distance to skip Math.sqrt for far pairs
      const connDistSq = CONNECTION_DIST * CONNECTION_DIST;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < connDistSq) {
            const alpha = (1 - Math.sqrt(distSq) / CONNECTION_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(89, 117, 109, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    const kick = () => {
      cancelAnimationFrame(animId);
      if (isVisible && pageVisible) {
        animId = requestAnimationFrame(draw);
      }
    };

    resize();
    initParticles();
    kick();

    const handleResize = () => {
      resize();
      // Keep particles in bounds after resize
      for (const p of particles) {
        if (p.x > w) p.x = Math.random() * w;
        if (p.y > h) p.y = Math.random() * h;
      }
    };

    window.addEventListener('resize', handleResize);

    const onVisibility = () => {
      pageVisible = document.visibilityState !== 'hidden';
      if (pageVisible) kick();
      else cancelAnimationFrame(animId);
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Pause animation when canvas scrolls out of view
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) kick();
        else cancelAnimationFrame(animId);
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibility);
      intersectionObserver.disconnect();
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return <canvas ref={canvasRef} className="hero__particles" aria-hidden="true" />;
}
