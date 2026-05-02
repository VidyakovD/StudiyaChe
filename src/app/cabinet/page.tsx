"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { User, BookOpen, Play, Settings, LogOut, Save, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { signOut } from "next-auth/react";
import { formatPrice } from "@/lib/utils";
import Header from "@/components/layout/Header";
import { fadeInUp, staggerContainer, easing } from "@/hooks/useAnimations";

interface PurchasedCourse {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number;
  category: { name: string };
  _count: { lessons: number };
  progress: number;
}

/* Beautiful empty state for "no courses" */
function EmptyCoursesIllustration() {
  return (
    <motion.svg
      width="180"
      height="140"
      viewBox="0 0 180 140"
      fill="none"
      className="mx-auto mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: easing.outQuart }}
    >
      {/* Base shadow */}
      <ellipse cx="90" cy="125" rx="60" ry="8" fill="rgba(255,255,255,0.02)" />
      {/* Stack of books / cards */}
      <motion.rect
        x="45" y="55" width="90" height="60" rx="10"
        fill="rgba(22,22,31,0.8)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        initial={{ rotate: -3 }}
        animate={{ rotate: -3 }}
      />
      <motion.rect
        x="50" y="48" width="90" height="60" rx="10"
        fill="rgba(26,26,38,0.9)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"
        initial={{ rotate: 2 }}
        animate={{ rotate: 2 }}
      />
      <motion.rect
        x="48" y="42" width="90" height="60" rx="10"
        fill="rgba(22,22,31,0.95)" stroke="rgba(255,107,43,0.15)" strokeWidth="1.5"
        initial={{ y: 48 }}
        animate={{ y: 42 }}
        transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
      />
      {/* Play icon on top card */}
      <motion.circle
        cx="93" cy="72" r="12"
        fill="rgba(255,107,43,0.15)"
        stroke="rgba(255,107,43,0.3)" strokeWidth="1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      />
      <motion.path
        d="M89 67 L99 72 L89 77Z"
        fill="rgba(255,107,43,0.5)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      />
      {/* Sparkles */}
      <motion.circle
        cx="150" cy="40" r="2" fill="rgba(168,85,247,0.4)"
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx="35" cy="55" r="1.5" fill="rgba(255,107,43,0.3)"
        animate={{ opacity: [0.2, 0.7, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
    </motion.svg>
  );
}

export default function CabinetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState<PurchasedCourse[]>([]);
  const [tab, setTab] = useState<"courses" | "settings">("courses");
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [subscribedToNewsletter, setSubscribedToNewsletter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Удаление аккаунта (152-ФЗ ст. 14, ст. 21).
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      setName(session.user.name || "");
      setNickname((session.user as { nickname?: string }).nickname || "");
      setAvatarUrl((session.user as { avatarUrl?: string }).avatarUrl || "");
      // Подписка на рассылку — отдельным запросом, в session её нет.
      fetch("/api/cabinet/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.subscribedToNewsletter !== undefined) {
            setSubscribedToNewsletter(!!data.subscribedToNewsletter);
          }
        })
        .catch(() => {});
      fetch("/api/cabinet/courses")
        .then((r) => r.json())
        .then((data) => setCourses(data.courses || []))
        .catch(() => {});
    }
  }, [session?.user?.id, session?.user?.name, session]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/cabinet/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nickname: nickname || undefined,
          avatarUrl: avatarUrl || undefined,
          password: newPassword || undefined,
          currentPassword: currentPassword || undefined,
          subscribedToNewsletter,
        }),
      });
      setSaved(true);
      setNewPassword("");
      setCurrentPassword("");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (!deletePassword) {
      setDeleteError("Введите текущий пароль для подтверждения");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/cabinet/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Не удалось удалить аккаунт");
        setDeleting(false);
        return;
      }
      // Аккаунт удалён — выходим и редиректим на главную.
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Ошибка сервера");
      setDeleting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <Header />
      <main className="flex-1 relative z-10 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Profile header */}
          <motion.div
            className="gradient-border p-8 mb-10"
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: easing.outQuart }}
          >
            <div className="card-glow" />
            <div className="relative z-10 flex items-center gap-6">
              <motion.div
                className="w-20 h-20 rounded-2xl bg-accent/15 flex items-center justify-center neon-glow"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <User className="w-10 h-10 text-accent" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">{session.user.name}</h1>
                <p className="text-text-muted">{session.user.email}</p>
              </div>
              <motion.button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="ml-auto px-4 py-2 rounded-xl border border-border-default text-text-muted hover:text-red-400 hover:border-red-400/30 transition-all flex items-center gap-2"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </motion.button>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            className="flex gap-2 mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: easing.outQuart }}
          >
            {[
              { key: "courses" as const, label: "Мои курсы", icon: BookOpen },
              { key: "settings" as const, label: "Настройки", icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <motion.button
                key={key}
                onClick={() => setTab(key)}
                className={`relative px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
                  tab === key ? "text-accent" : "text-text-muted hover:text-text-secondary"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                {tab === key && (
                  <motion.div
                    className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-xl"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {tab === "courses" ? (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: easing.outQuart }}
              >
                {courses.length === 0 ? (
                  <div className="text-center py-16">
                    <EmptyCoursesIllustration />
                    <p className="text-text-secondary text-lg font-medium mb-2">
                      У вас пока нет курсов
                    </p>
                    <p className="text-text-muted mb-6">
                      Выберите курс из каталога и начните обучение
                    </p>
                    <motion.a
                      href="/#courses"
                      className="btn-primary inline-flex items-center gap-2"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="relative z-10">Перейти к каталогу</span>
                    </motion.a>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {courses.map((course, idx) => (
                      <motion.a
                        key={course.id}
                        href={`/course/${course.id}/learn`}
                        className="gradient-border card-hover p-5 flex gap-4 group"
                        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: idx * 0.08, duration: 0.5, ease: easing.outQuart }}
                      >
                        <div className="card-glow" />
                        <div className="w-24 h-24 rounded-xl bg-bg-secondary overflow-hidden shrink-0 relative z-10">
                          {course.imageUrl ? (
                            <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-accent/30" />
                            </div>
                          )}
                        </div>
                        <div className="relative z-10 flex-1 min-w-0">
                          <span className="text-xs text-accent tracking-wide">{course.category.name}</span>
                          <h3 className="text-text-primary font-semibold truncate group-hover:text-accent transition-colors tracking-tight">
                            {course.title}
                          </h3>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-text-muted mb-1">
                              <span>Прогресс</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${course.progress}%` }}
                                transition={{ duration: 0.8, delay: 0.3 + idx * 0.1, ease: easing.outQuart }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                className="gradient-border p-8 max-w-lg"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: easing.outQuart }}
              >
                <div className="card-glow" />
                <form onSubmit={handleSaveProfile} className="relative z-10 space-y-5">
                  <h2 className="text-xl font-bold text-text-primary mb-6 tracking-tight">Настройки профиля</h2>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2 tracking-wide">Имя</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-dark"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2 tracking-wide">Email</label>
                    <input
                      type="email"
                      value={session.user.email || ""}
                      disabled
                      className="input-dark opacity-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2 tracking-wide">Ник в чате</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Отображается в чате курса"
                      className="input-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2 tracking-wide">URL аватара</label>
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-12 h-12 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: avatarUrl ? "transparent" : "#a855f7" }}
                        whileHover={{ scale: 1.08 }}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (nickname || name || "?").split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                        )}
                      </motion.div>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="input-dark flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2 tracking-wide">Текущий пароль</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Обязательно при смене пароля"
                      className="input-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2 tracking-wide">Новый пароль</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Оставь пустым, если не меняешь"
                      className="input-dark"
                      minLength={6}
                    />
                  </div>

                  <div className="pt-2 border-t border-border-default">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={subscribedToNewsletter}
                        onChange={(e) => setSubscribedToNewsletter(e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm text-text-secondary">
                          Получать письма о новых курсах и анонсах
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          Сервисные уведомления (оплата, чеки, восстановление пароля) приходят независимо от этой настройки.
                        </div>
                      </div>
                    </label>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <AnimatePresence mode="wait">
                        {saved ? (
                          <motion.span
                            key="saved"
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <CheckCircle className="w-5 h-5" />
                            Сохранено!
                          </motion.span>
                        ) : saving ? (
                          <motion.span
                            key="saving"
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Сохранение...
                          </motion.span>
                        ) : (
                          <motion.span
                            key="save"
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <Save className="w-5 h-5" />
                            Сохранить
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </motion.button>
                </form>

                {/* Опасная зона: удаление аккаунта (152-ФЗ ст. 14) */}
                <div className="relative z-10 mt-10 pt-6 border-t border-red-500/20">
                  <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Удаление аккаунта
                  </h3>
                  <p className="text-xs text-text-muted mb-4 leading-relaxed">
                    Вы вправе в любой момент потребовать удаления своих персональных данных.
                    После удаления вы потеряете доступ к приобретённым курсам и истории чатов.
                    Действие необратимо.
                  </p>
                  {!showDelete ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDelete(true);
                        setDeleteError("");
                        setDeletePassword("");
                      }}
                      className="text-xs px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Удалить мой аккаунт
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Подтвердите паролем"
                        className="input-dark text-sm"
                      />
                      {deleteError && (
                        <p className="text-xs text-red-400">{deleteError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                          className="text-xs px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {deleting ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Подтвердить удаление
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDelete(false);
                            setDeletePassword("");
                            setDeleteError("");
                          }}
                          className="text-xs px-3 py-2 rounded-lg border border-border-default text-text-muted hover:text-text-secondary transition-colors"
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
