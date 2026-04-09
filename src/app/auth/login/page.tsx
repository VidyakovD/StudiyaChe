"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-neon-purple/5 blur-[100px]" />

      <motion.div
        className="w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="gradient-border p-8">
          <div className="card-glow" />
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <a href="/" className="text-2xl font-bold neon-text text-accent inline-block mb-4">
                Студия ЧЕ
              </a>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Вход в аккаунт</h1>
              <p className="text-text-muted">Введите свои данные для входа</p>
            </div>

            {error && (
              <motion.div
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="input-dark pl-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    required
                    className="input-dark pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  {loading ? "Вход..." : "Войти"}
                </span>
              </button>
            </form>

            <p className="text-center mt-6 text-text-muted text-sm">
              Нет аккаунта?{" "}
              <a href="/auth/register" className="text-accent hover:text-accent-light transition-colors">
                Зарегистрироваться
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
