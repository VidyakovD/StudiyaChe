"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Cookies-баннер: информирует о использовании только строго необходимых
// cookies (сессия, CSRF). Аналитики/рекламы у нас нет, поэтому отдельные
// тумблеры не нужны — достаточно одного «Понятно».
//
// 152-ФЗ + ГОСТ Р 7.0.93 + рекомендации РКН: достаточно проинформировать
// и дать ссылку на политику. Хранение факта прочтения — в localStorage.
const STORAGE_KEY = "che-cookies-acknowledged-v1";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Откладываем показ на следующий тик, чтобы не флешить при гидратации.
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // localStorage может быть заблокирован — тогда показываем каждый раз, не страшно.
    }
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleAcknowledge = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label="Уведомление об использовании cookies"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50"
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="gradient-border p-5">
            <div className="card-glow" />
            <div className="relative z-10">
              <p className="text-sm text-text-secondary leading-relaxed">
                Сайт использует cookies, необходимые для работы авторизации и поддержания
                пользовательской сессии. Аналитика и реклама третьих лиц не используются.
                Подробнее — в{" "}
                <a
                  href="/privacy"
                  className="text-accent hover:text-accent-light underline transition-colors"
                >
                  политике конфиденциальности
                </a>
                .
              </p>
              <button
                onClick={handleAcknowledge}
                className="mt-4 px-4 py-2 rounded-xl bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent text-sm font-medium transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
