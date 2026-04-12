"use client";

import { motion } from "framer-motion";
import { RefreshCcw, Home } from "lucide-react";
import { easing } from "@/hooks/useAnimations";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">
      <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-neon-purple/3 blur-[120px]" />

      <motion.div
        className="text-center px-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easing.outQuart }}
      >
        <div className="text-6xl font-bold text-error/20 mb-4 tracking-tighter">Ошибка</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">
          Что-то пошло не так
        </h1>
        <p className="text-text-muted mb-8">
          Попробуй обновить страницу или вернуться на главную
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center gap-2"
          >
            <span className="relative z-10 flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" />
              Повторить
            </span>
          </button>
          <a
            href="/"
            className="px-5 py-3 rounded-xl text-text-muted hover:text-text-primary transition-colors glass-card inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            На главную
          </a>
        </div>
      </motion.div>
    </div>
  );
}
