"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { fadeInUp, staggerContainer, easing } from "@/hooks/useAnimations";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Ошибка сервера");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-text-muted mb-4">Недействительная ссылка для сброса пароля.</p>
        <a href="/auth/forgot-password" className="text-accent hover:text-accent-light transition-colors">
          Запросить новую ссылку
        </a>
      </div>
    );
  }

  return (
    <motion.div
      className="relative z-10"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="text-center mb-8" variants={fadeInUp}>
        <a href="/" className="text-2xl font-bold neon-text text-accent inline-block mb-4 tracking-tight">
          Студия ЧЕ
        </a>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {success ? "Пароль изменён" : "Новый пароль"}
        </h1>
        <p className="text-text-muted">
          {success ? "Теперь можешь войти с новым паролем" : "Придумай новый пароль"}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            className="text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: easing.outQuart }}
          >
            <div className="w-16 h-16 rounded-2xl bg-success/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <a
              href="/auth/login"
              className="btn-primary inline-flex items-center gap-2"
            >
              <span className="relative z-10">Войти в аккаунт</span>
            </a>
          </motion.div>
        ) : (
          <motion.div key="form" variants={fadeInUp}>
            {error && (
              <motion.div
                className="bg-error/10 border border-error/20 rounded-xl p-4 mb-6 text-error text-sm text-center"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-text-secondary mb-2 tracking-wide">Новый пароль</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors group-focus-within:text-accent" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    required
                    minLength={6}
                    className="input-dark !pl-12 !pr-12"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    whileTap={{ scale: 0.85 }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2 tracking-wide">Повтори пароль</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors group-focus-within:text-accent" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Повтори пароль"
                    required
                    minLength={6}
                    className="input-dark !pl-12"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {loading ? "Сохранение..." : "Сохранить пароль"}
                </span>
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">
      <motion.div
        className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-neon-purple/5 blur-[120px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: easing.outQuart }}
      >
        <div className="gradient-border p-8">
          <div className="card-glow" />
          <Suspense fallback={<div className="text-center text-text-muted">Загрузка...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
