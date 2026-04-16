"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#ff6b2b", "#ff8c42", "#a855f7", "#fbbf24"];
const PARTICLE_COUNT = 28;

interface Props {
  show: boolean;
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  rotate: number;
  isSquare: boolean;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.6;
    const distance = 180 + Math.random() * 320;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 80 - Math.random() * 120,
      size: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.15,
      rotate: Math.random() * 720 - 360,
      isSquare: i % 5 === 0,
    };
  });
}

export default function LessonCelebration({ show, onComplete }: Props) {
  const particles = useMemo(() => generateParticles(), []);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onComplete, 2600);
    return () => clearTimeout(timer);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.isSquare ? 2 : "50%",
                boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}40`,
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: 0,
                opacity: 0,
                rotate: p.rotate,
              }}
              transition={{
                duration: 1.8,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}

          {/* Text flash */}
          <motion.div
            className="absolute text-5xl font-bold"
            style={{
              background: "linear-gradient(135deg, #ff6b2b, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
              filter: "drop-shadow(0 0 20px rgba(255, 107, 43, 0.5)) drop-shadow(0 0 40px rgba(168, 85, 247, 0.3))",
            }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 15,
              delay: 0.1,
            }}
          >
            <motion.span
              animate={{ opacity: 0, scale: 1.1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
            >
              {"\u041E\u0442\u043B\u0438\u0447\u043D\u043E! \uD83C\uDF1F"}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
