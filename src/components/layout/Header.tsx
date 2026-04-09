"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Menu, X, User, LogIn, Shield } from "lucide-react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="text-2xl font-bold neon-text text-accent flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-accent" />
          </div>
          Студия ЧЕ
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/#courses" className="text-text-secondary hover:text-text-primary transition-colors">
            Каталог
          </a>

          {session?.user ? (
            <div className="flex items-center gap-4">
              {session.user.role === "ADMIN" && (
                <a
                  href="/admin"
                  className="flex items-center gap-2 text-neon-purple hover:text-neon-purple/80 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Админ
                </a>
              )}
              <a
                href="/cabinet"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 transition-all"
              >
                <User className="w-4 h-4" />
                {session.user.name || "Кабинет"}
              </a>
            </div>
          ) : (
            <a
              href="/auth/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Войти
            </a>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-text-secondary hover:text-text-primary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden glass-strong border-t border-border-default"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="flex flex-col gap-2 p-6">
              <a
                href="/#courses"
                className="py-3 px-4 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all"
                onClick={() => setMobileOpen(false)}
              >
                Каталог
              </a>
              {session?.user ? (
                <>
                  {session.user.role === "ADMIN" && (
                    <a
                      href="/admin"
                      className="py-3 px-4 rounded-xl text-neon-purple hover:bg-neon-purple/5 transition-all flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Админ-панель
                    </a>
                  )}
                  <a
                    href="/cabinet"
                    className="py-3 px-4 rounded-xl text-accent hover:bg-accent/5 transition-all flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Личный кабинет
                  </a>
                </>
              ) : (
                <a
                  href="/auth/login"
                  className="py-3 px-4 rounded-xl text-accent hover:bg-accent/5 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Войти
                </a>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
