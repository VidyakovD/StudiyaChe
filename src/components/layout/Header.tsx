"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useSession } from "next-auth/react";
import { Menu, X, User, LogIn, Shield } from "lucide-react";

function MagneticLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15 });
  const springY = useSpring(y, { stiffness: 200, damping: 15 });

  return (
    <motion.a
      href={href}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        x.set((e.clientX - cx) * 0.3);
        y.set((e.clientY - cy) * 0.3);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.a>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <MagneticLink
          href="/"
          className="text-2xl font-bold neon-text text-accent flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-accent" />
          </div>
          <span className="tracking-tight">Студия ЧЕ</span>
        </MagneticLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="/#courses"
            className="nav-link text-text-secondary hover:text-text-primary"
          >
            Каталог
          </a>

          {session?.user ? (
            <div className="flex items-center gap-4">
              {session.user.role === "ADMIN" && (
                <MagneticLink
                  href="/admin"
                  className="flex items-center gap-2 text-neon-purple hover:text-neon-purple/80 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Админ</span>
                </MagneticLink>
              )}
              <MagneticLink
                href="/cabinet"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 transition-all"
              >
                <User className="w-4 h-4" />
                <span>{session.user.name || "Кабинет"}</span>
              </MagneticLink>
            </div>
          ) : (
            <MagneticLink
              href="/auth/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Войти</span>
            </MagneticLink>
          )}
        </nav>

        {/* Mobile menu button */}
        <motion.button
          className="md:hidden text-text-secondary hover:text-text-primary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden glass-strong border-t border-border-default overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
          >
            <motion.nav
              className="flex flex-col gap-2 p-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {[
                { href: "/#courses", label: "Каталог", icon: null, color: "text-text-secondary hover:text-text-primary" },
                ...(session?.user?.role === "ADMIN"
                  ? [{ href: "/admin", label: "Админ-панель", icon: Shield, color: "text-neon-purple hover:bg-neon-purple/5" }]
                  : []),
                ...(session?.user
                  ? [{ href: "/cabinet", label: "Личный кабинет", icon: User, color: "text-accent hover:bg-accent/5" }]
                  : [{ href: "/auth/login", label: "Войти", icon: LogIn, color: "text-accent hover:bg-accent/5" }]),
              ].map((item) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className={`py-3 px-4 rounded-xl transition-all flex items-center gap-2 ${item.color}`}
                  onClick={() => setMobileOpen(false)}
                  variants={{
                    hidden: { opacity: 0, x: -12 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  whileTap={{ scale: 0.97, x: 4 }}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </motion.a>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
