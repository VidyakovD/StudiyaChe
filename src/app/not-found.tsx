"use client";

import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { easing } from "@/hooks/useAnimations";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[120px]" />

      <motion.div
        className="text-center px-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easing.outQuart }}
      >
        <div className="text-8xl font-bold text-accent/20 mb-4 tracking-tighter">404</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">
          Страница не найдена
        </h1>
        <p className="text-text-muted mb-8">
          Возможно, она была перемещена или удалена
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Home className="w-4 h-4" />
              На главную
            </span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
