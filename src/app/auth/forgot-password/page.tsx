"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, Send } from "lucide-react";
import { fadeInUp, staggerContainer, easing } from "@/hooks/useAnimations";
import NeuralNetwork from "@/components/home/NeuralNetwork";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Ошибка сервера");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <NeuralNetwork />
      <div className="absolute inset-0 bg-bg-primary/60 backdrop-blur-md z-[1]" />
      <motion.div
        className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px] z-[2]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-neon-purple/5 blur-[100px] z-[2]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <motion.div
        className="w-full max-w-md mx-4 relative z-10"
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: easing.outQuart }}
      >
        <div className="gradient-border p-8">
          <div className="card-glow" />
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
              <h1 className="text-2xl font-bold text-text-primary mb-2">Восстановление пароля</h1>
              <p className="text-text-muted">
                {sent ? "Проверь свою почту" : "Введи email для получения ссылки сброса"}
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {sent ? (
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
                  <p className="text-text-secondary mb-6">
                    Если аккаунт с адресом <span className="text-accent">{email}</span> существует, мы отправили ссылку для сброса пароля.
                  </p>
                  <a
                    href="/auth/login"
                    className="text-accent hover:text-accent-light transition-colors inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Вернуться к входу
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
                      <label className="block text-sm text-text-secondary mb-2 tracking-wide">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors group-focus-within:text-accent" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
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
                          <Send className="w-5 h-5" />
                        )}
                        {loading ? "Отправка..." : "Отправить ссылку"}
                      </span>
                    </motion.button>
                  </form>

                  <p className="text-center mt-6 text-text-muted text-sm">
                    <a href="/auth/login" className="text-accent hover:text-accent-light transition-colors inline-flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3" />
                      Вернуться к входу
                    </a>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
