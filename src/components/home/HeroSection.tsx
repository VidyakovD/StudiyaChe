"use client";

import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-neon-purple/5 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/3 blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,107,43,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,43,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-accent font-medium">Новые курсы уже доступны</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-text-primary">Освой </span>
            <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent neon-text">
              видеопроизводство
            </span>
            <br />
            <span className="text-text-primary">с помощью </span>
            <span className="bg-gradient-to-r from-neon-purple to-accent bg-clip-text text-transparent">
              ИИ
            </span>
          </h1>

          <motion.p
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Практические курсы по видеомонтажу, нейросетям и ИИ-инструментам для бизнеса.
            Учись в своём темпе, получай реальные навыки.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <a href="#courses" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
              <span>Смотреть курсы</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="/auth/register"
              className="px-8 py-4 rounded-xl border border-border-default text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all duration-300 text-lg"
            >
              Создать аккаунт
            </a>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          {[
            { value: "10+", label: "Курсов" },
            { value: "200+", label: "Уроков" },
            { value: "500+", label: "Студентов" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-accent neon-text">{stat.value}</div>
              <div className="text-sm text-text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </section>
  );
}
