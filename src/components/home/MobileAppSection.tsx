"use client";

import { motion } from "framer-motion";
import { Smartphone, Monitor, TabletSmartphone, Globe } from "lucide-react";
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer, easing } from "@/hooks/useAnimations";

export default function MobileAppSection() {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-accent/3 blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {/* Header */}
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 glass-card">
              <Smartphone className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-medium tracking-wide">
                Мобильная версия
              </span>
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-text-primary">Личный кабинет </span>
              <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                в кармане
              </span>
            </h2>
            <p className="text-text-secondary text-lg mx-auto max-w-2xl">
              Установи приложение на телефон — проходи уроки прямо с экрана,
              если нет второго монитора. Работает на iOS и Android.
            </p>
          </motion.div>

          {/* Two cards: iOS + Android */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* iOS */}
            <motion.div
              className="gradient-border p-6 group"
              variants={fadeInLeft}
            >
              <div className="card-glow" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-text-primary/5 border border-border-default flex items-center justify-center">
                    <TabletSmartphone className="w-6 h-6 text-text-primary" />
                  </div>
                  <div>
                    <h3 className="text-text-primary font-semibold tracking-tight">iPhone / iPad</h3>
                    <p className="text-text-muted text-sm">Safari</p>
                  </div>
                </div>

                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span className="text-text-secondary">Открой <span className="text-accent">studiache.ru</span> в Safari</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span className="text-text-secondary">Нажми кнопку <span className="text-text-primary font-medium">«Поделиться»</span> (⬆)</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span className="text-text-secondary">Выбери <span className="text-text-primary font-medium">«На экран Домой»</span></span>
                  </li>
                </ol>
              </div>
            </motion.div>

            {/* Android */}
            <motion.div
              className="gradient-border p-6 group"
              variants={fadeInRight}
            >
              <div className="card-glow" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-text-primary/5 border border-border-default flex items-center justify-center">
                    <Globe className="w-6 h-6 text-text-primary" />
                  </div>
                  <div>
                    <h3 className="text-text-primary font-semibold tracking-tight">Android</h3>
                    <p className="text-text-muted text-sm">Chrome / Яндекс Браузер</p>
                  </div>
                </div>

                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span className="text-text-secondary">Открой <span className="text-accent">studiache.ru</span> в Chrome</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span className="text-text-secondary">Нажми <span className="text-text-primary font-medium">меню ⋮</span> (три точки вверху справа)</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span className="text-text-secondary">Выбери <span className="text-text-primary font-medium">«Добавить на главный экран»</span> или <span className="text-text-primary font-medium">«Установить»</span></span>
                  </li>
                </ol>
              </div>
            </motion.div>
          </div>

          {/* Note */}
          <motion.p
            className="text-center text-text-muted text-sm mt-8 flex items-center justify-center gap-2"
            variants={fadeInUp}
          >
            <Monitor className="w-4 h-4" />
            Основная версия платформы — на компьютере. Мобильное приложение удобно для просмотра уроков на ходу.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
