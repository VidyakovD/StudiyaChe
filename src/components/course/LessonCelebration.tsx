"use client";

import { useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#ff6b2b", "#ff8c42", "#a855f7", "#fbbf24", "#34d399", "#f472b6"];

interface Props {
  show: boolean;
  onComplete: () => void;
}

interface Particle {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  color: string;
  delay: number;
  rotate: number;
  shape: "circle" | "square" | "star";
  duration: number;
}

interface Ring {
  id: number;
  delay: number;
  color: string;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  const count = 60;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + rand(-0.4, 0.4);
    const distance = rand(300, 900);
    const startX = rand(-20, 20);
    const startY = rand(-20, 20);
    const shapes: ("circle" | "square" | "star")[] = ["circle", "circle", "square", "star"];

    particles.push({
      id: i,
      startX,
      startY,
      endX: Math.cos(angle) * distance,
      endY: Math.sin(angle) * distance - rand(100, 400),
      size: rand(4, 14),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: rand(0, 0.3),
      rotate: rand(-720, 720),
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      duration: rand(1.4, 2.4),
    });
  }

  // Second wave — from multiple origins
  const origins = [
    { x: -200, y: 100 },
    { x: 200, y: 100 },
    { x: -150, y: -50 },
    { x: 150, y: -50 },
  ];

  for (let w = 0; w < origins.length; w++) {
    for (let i = 0; i < 12; i++) {
      const angle = rand(0, Math.PI * 2);
      const distance = rand(200, 600);
      particles.push({
        id: count + w * 12 + i,
        startX: origins[w].x,
        startY: origins[w].y,
        endX: origins[w].x + Math.cos(angle) * distance,
        endY: origins[w].y + Math.sin(angle) * distance - rand(50, 200),
        size: rand(3, 10),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: 0.3 + rand(0, 0.25),
        rotate: rand(-500, 500),
        shape: "circle",
        duration: rand(1.2, 2.0),
      });
    }
  }

  return particles;
}

function generateRings(): Ring[] {
  return [
    { id: 0, delay: 0, color: "rgba(255, 107, 43, 0.25)" },
    { id: 1, delay: 0.15, color: "rgba(168, 85, 247, 0.2)" },
    { id: 2, delay: 0.35, color: "rgba(255, 140, 66, 0.15)" },
  ];
}

function StarShape({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

export default function LessonCelebration({ show, onComplete }: Props) {
  const particles = useMemo(() => generateParticles(), []);
  const rings = useMemo(() => generateRings(), []);

  const stableOnComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(stableOnComplete, 2600);
    return () => clearTimeout(timer);
  }, [show, stableOnComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Flash */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle, rgba(255,107,43,0.15) 0%, transparent 70%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, times: [0, 0.15, 1] }}
          />

          {/* Shockwave rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            {rings.map((ring) => (
              <motion.div
                key={ring.id}
                className="absolute rounded-full"
                style={{
                  border: `2px solid ${ring.color}`,
                  boxShadow: `0 0 30px ${ring.color}, inset 0 0 30px ${ring.color}`,
                }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: "120vmax", height: "120vmax", opacity: 0 }}
                transition={{
                  duration: 1.2,
                  delay: ring.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
          </div>

          {/* Particles from center + multiple origins */}
          <div className="absolute inset-0 flex items-center justify-center">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  width: p.size,
                  height: p.size,
                }}
                initial={{
                  x: p.startX,
                  y: p.startY,
                  scale: 1,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  x: p.endX,
                  y: p.endY,
                  scale: [1, 1.2, 0],
                  opacity: [1, 1, 0],
                  rotate: p.rotate,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {p.shape === "star" ? (
                  <StarShape size={p.size} color={p.color} />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: p.color,
                      borderRadius: p.shape === "circle" ? "50%" : 2,
                      boxShadow: `0 0 ${p.size}px ${p.color}, 0 0 ${p.size * 2}px ${p.color}50`,
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Sparkle trails — falling glitter */}
          <div className="absolute inset-0">
            {Array.from({ length: 20 }, (_, i) => {
              const x = rand(5, 95);
              const color = COLORS[Math.floor(Math.random() * COLORS.length)];
              return (
                <motion.div
                  key={`trail-${i}`}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: "-5%",
                    width: rand(2, 5),
                    height: rand(12, 30),
                    background: `linear-gradient(to bottom, ${color}, transparent)`,
                    borderRadius: 4,
                    filter: `blur(${rand(0, 1)}px)`,
                  }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{
                    y: "110vh",
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: rand(1.2, 2.0),
                    delay: rand(0.1, 0.8),
                    ease: "easeIn",
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
