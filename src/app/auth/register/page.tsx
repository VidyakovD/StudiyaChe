"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeOffer, setAgreeOffer] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка регистрации");
        setLoading(false);
        return;
      }

      router.push("/auth/login?registered=true");
    } catch {
      setError("Ошибка сервера");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">
      <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-neon-purple/5 blur-[120px]" />
      <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px]" />

      <motion.div
        className="w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="gradient-border p-8">
          <div className="card-glow" />
          <div className="relative z-10">
            <div className="text-center mb-8">
              <a href="/" className="text-2xl font-bold neon-text text-accent inline-block mb-4">
                Студия ЧЕ
              </a>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Регистрация</h1>
              <p className="text-text-muted">Создайте аккаунт для доступа к курсам</p>
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
                <label className="block text-sm text-text-secondary mb-2">Имя</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    required
                    className="input-dark pl-12"
                  />
                </div>
              </div>

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
                    placeholder="Минимум 6 символов"
                    required
                    minLength={6}
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

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeOffer}
                  onChange={(e) => setAgreeOffer(e.target.checked)}
                  required
                  className="mt-1 w-4 h-4 rounded accent-[var(--accent)] bg-bg-secondary border-border-default"
                />
                <span className="text-sm text-text-muted leading-relaxed">
                  Я ознакомился с{" "}
                  <a href="/offer" target="_blank" className="text-accent hover:text-accent-light underline transition-colors">
                    договором оферты
                  </a>{" "}
                  и{" "}
                  <a href="/privacy" target="_blank" className="text-accent hover:text-accent-light underline transition-colors">
                    политикой конфиденциальности
                  </a>
                  , даю согласие на обработку персональных данных и получение чеков на указанный email
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !agreeOffer}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                  {loading ? "Регистрация..." : "Создать аккаунт"}
                </span>
              </button>
            </form>

            <p className="text-center mt-6 text-text-muted text-sm">
              Уже есть аккаунт?{" "}
              <a href="/auth/login" className="text-accent hover:text-accent-light transition-colors">
                Войти
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
