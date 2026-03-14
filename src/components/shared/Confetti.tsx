"use client";

import { useMemo } from "react";

interface ConfettiProps {
  active: boolean;
  particleCount?: number;
}

interface Particle {
  id: number;
  x: string;
  y: string;
  color: string;
  rotation: string;
  delay: string;
  size: number;
}

const COLORS = [
  "var(--accent-amber)",
  "var(--accent-rose)",
  "var(--accent-cyan)",
  "var(--accent-violet)",
  "var(--accent-emerald)",
  "var(--accent-blue)",
  "var(--accent-pink)",
  "var(--accent-orange)",
];

const DURATION_MS = 1400;

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const spread = 40 + Math.random() * 60;
    return {
      id: i,
      x: `${Math.cos(angle) * spread}px`,
      y: `${Math.sin(angle) * spread - 20}px`,
      color: COLORS[i % COLORS.length],
      rotation: `${Math.random() * 720 - 360}deg`,
      delay: `${Math.random() * 150}ms`,
      size: 4 + Math.random() * 4,
    };
  });
}

/**
 * CSS-only confetti burst. When `active` is true, renders particles
 * that animate outward and fade via CSS animations.
 * Parent controls lifecycle — mount/unmount this component to replay.
 */
export function Confetti({ active, particleCount = 24 }: ConfettiProps) {
  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      <div className="absolute left-1/2 top-1/2">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-sm"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              "--confetti-x": p.x,
              "--confetti-y": p.y,
              "--confetti-rotation": p.rotation,
              animation: `confetti-burst ${DURATION_MS}ms ease-out forwards`,
              animationDelay: p.delay,
              opacity: 0,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
