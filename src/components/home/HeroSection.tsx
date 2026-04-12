"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "framer-motion";
import { useSession } from "next-auth/react";
import {
  staggerContainer,
  fadeInUp,
  scaleReveal,
  easing,
} from "@/hooks/useAnimations";

function MagneticButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  return (
    <motion.a
      href={href}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        x.set((e.clientX - cx) * 0.25);
        y.set((e.clientY - cy) * 0.25);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.a>
  );
}

export default function HeroSection() {
  const { data: session } = useSession();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax transforms
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const fadeOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background gradient orbs — parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]"
          style={{ y: orb1Y }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-neon-purple/5 blur-[120px]"
          style={{ y: orb2Y }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -25, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/3 blur-[150px]"
          style={{ y: orb3Y }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        style={{ y: textY, opacity: fadeOpacity }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 glass-card"
          variants={scaleReveal}
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm text-accent font-medium tracking-wide">
            Новые курсы уже доступны
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6"
          variants={fadeInUp}
        >
          <span className="text-text-primary">Освой </span>
          <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent neon-text">
            видеопроизводство
          </span>
          <br />
          <span className="text-text-primary">с помощью </span>
          <span className="bg-gradient-to-r from-neon-purple to-accent bg-clip-text text-transparent">
            ИИ
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-text-secondary mx-auto mb-10"
          variants={fadeInUp}
        >
          Практические курсы по видеомонтажу, нейросетям и ИИ-инструментам для бизнеса.
          <br className="hidden sm:block" />
          Учись в своём темпе, получай реальные навыки.
        </motion.p>

        {/* CTA buttons — magnetic */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          variants={fadeInUp}
        >
          <MagneticButton
            href="#courses"
            className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
          >
            <span>Смотреть курсы</span>
            <motion.svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </motion.svg>
          </MagneticButton>
          <MagneticButton
            href={session ? "/cabinet" : "/auth/register"}
            className="px-8 py-4 rounded-xl text-text-secondary hover:text-text-primary transition-all duration-300 text-lg glass-card"
          >
            {session ? "Личный кабинет" : "Создать аккаунт"}
          </MagneticButton>
        </motion.div>

      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </section>
  );
}
