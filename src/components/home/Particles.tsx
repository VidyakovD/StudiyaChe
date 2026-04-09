"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export default function Particles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = [
      "rgba(255, 107, 43, 0.6)",
      "rgba(255, 107, 43, 0.4)",
      "rgba(168, 85, 247, 0.5)",
      "rgba(168, 85, 247, 0.3)",
      "rgba(255, 140, 66, 0.4)",
    ];

    const items: Particle[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 12 + Math.random() * 15,
      delay: Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setParticles(items);
  }, []);

  return (
    <div className="particles-bg">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            bottom: `-${p.size}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
