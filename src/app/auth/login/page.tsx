"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { fadeInUp, staggerContainer, easing } from "@/hooks/useAnimations";
import NeuralNetwork from "@/components/home/NeuralNetwork";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Неверный email или пароль");
      setLoading(false);
    } else {
      router.push("/cabinet");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Neural network background + blur overlay */}
      <NeuralNetwork />
      <div className="absolute inset-0 bg-bg-primary/60 backdrop-blur-md z-[1]" />
      {/* Gradient orbs */}
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
            {/* Header */}
            <motion.div className="text-center mb-8" variants={fadeInUp}>
              <a href="/" className="text-2xl font-bold neon-text text-accent inline-block mb-4 tracking-tight">
                Студия ЧЕ
              </a>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Вход в аккаунт</h1>
              <p className="text-text-muted">Введите свои данные для входа</p>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="bg-error/10 border border-error/20 rounded-xl p-4 mb-6 text-error text-sm text-center flex items-center justify-center gap-2"
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: easing.outQuart }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form onSubmit={handleSubmit} className="space-y-5" variants={fadeInUp}>
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

              <div>
                <label className="block text-sm text-text-secondary mb-2 tracking-wide">Пароль</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors group-focus-within:text-accent" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    required
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

              <div className="text-right">
                <a href="/auth/forgot-password" className="text-sm text-text-muted hover:text-accent transition-colors">
                  Забыл пароль?
                </a>
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
                    <LogIn className="w-5 h-5" />
                  )}
                  {loading ? "Вход..." : "Войти"}
                </span>
              </motion.button>
            </motion.form>

            <motion.p
              className="text-center mt-6 text-text-muted text-sm"
              variants={fadeInUp}
            >
              Нет аккаунта?{" "}
              <a href="/auth/register" className="text-accent hover:text-accent-light transition-colors">
                Зарегистрироваться
              </a>
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
