"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/hooks/useAnimations";
import { Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border-default bg-bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Logo & description */}
          <motion.div variants={fadeInUp}>
            <a href="/" className="text-xl font-bold neon-text text-accent inline-flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
              </div>
              <span className="tracking-tight">Студия ЧЕ</span>
            </a>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              Обучающая платформа по видеопроизводству, нейросетям и ИИ-инструментам для бизнеса.
            </p>
            {/* Telegram */}
            <a
              href="https://t.me/studiyaCHE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2AABEE]/10 border border-[#2AABEE]/20 text-[#2AABEE] hover:bg-[#2AABEE]/15 hover:border-[#2AABEE]/30 transition-all text-sm font-medium group"
            >
              <Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              Telegram-канал
            </a>
          </motion.div>

          {/* Links */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-text-primary font-semibold mb-4 tracking-tight">Навигация</h3>
            <div className="space-y-2">
              {[
                { href: "/#courses", label: "Каталог курсов" },
                { href: "/auth/login", label: "Войти" },
                { href: "/auth/register", label: "Регистрация" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-text-muted hover:text-accent transition-colors duration-200 text-sm hover:translate-x-1 transform"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Legal */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-text-primary font-semibold mb-4 tracking-tight">Документы</h3>
            <div className="space-y-2">
              <p className="text-text-muted text-sm">ИП Видяков Д.К.</p>
              {[
                { href: "/offer", label: "Договор оферты" },
                { href: "/privacy", label: "Политика конфиденциальности" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-text-muted hover:text-accent transition-colors duration-200 text-sm hover:translate-x-1 transform"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Telegram CTA */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-text-primary font-semibold mb-4 tracking-tight">Сообщество</h3>
            <a
              href="https://t.me/studiyaCHE"
              target="_blank"
              rel="noopener noreferrer"
              className="block gradient-border p-4 group hover:border-[#2AABEE]/20 transition-all"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/15 flex items-center justify-center group-hover:bg-[#2AABEE]/20 transition-colors">
                    <Send className="w-5 h-5 text-[#2AABEE]" />
                  </div>
                  <div>
                    <p className="text-text-primary font-medium text-sm">Telegram</p>
                    <p className="text-text-muted text-xs">@studiyaCHE</p>
                  </div>
                </div>
                <p className="text-text-muted text-xs leading-relaxed">
                  Новости, анонсы курсов, полезные материалы
                </p>
              </div>
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-10 pt-8 border-t border-border-default text-center text-text-muted text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          &copy; {new Date().getFullYear()} Студия ЧЕ. Все права защищены.
        </motion.div>
      </div>
    </footer>
  );
}
