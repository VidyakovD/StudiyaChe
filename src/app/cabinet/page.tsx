"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { User, BookOpen, Play, Settings, LogOut, Save, CheckCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { formatPrice } from "@/lib/utils";
import Header from "@/components/layout/Header";

interface PurchasedCourse {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number;
  category: { name: string };
  _count: { lessons: number };
  progress: number;
}

export default function CabinetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState<PurchasedCourse[]>([]);
  const [tab, setTab] = useState<"courses" | "settings">("courses");
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setNickname((session.user as { nickname?: string }).nickname || "");
      setAvatarUrl((session.user as { avatarUrl?: string }).avatarUrl || "");
      fetch("/api/cabinet/courses")
        .then((r) => r.json())
        .then((data) => setCourses(data.courses || []))
        .catch(() => {});
    }
  }, [session]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/cabinet/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nickname: nickname || undefined, avatarUrl: avatarUrl || undefined, password: newPassword || undefined }),
      });
      setSaved(true);
      setNewPassword("");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-glow" />
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-accent/15 flex items-center justify-center neon-glow">
                <User className="w-10 h-10 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{session.user.name}</h1>
                <p className="text-text-muted">{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="ml-auto px-4 py-2 rounded-xl border border-border-default text-text-muted hover:text-red-400 hover:border-red-400/30 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {[
              { key: "courses" as const, label: "Мои курсы", icon: BookOpen },
              { key: "settings" as const, label: "Настройки", icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                  tab === key
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === "courses" ? (
            <div>
              {courses.length === 0 ? (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <BookOpen className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
                  <p className="text-text-muted text-lg mb-4">У вас пока нет курсов</p>
                  <a href="/#courses" className="btn-primary inline-flex items-center gap-2">
                    <span className="relative z-10">Перейти к каталогу</span>
                  </a>
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {courses.map((course, idx) => (
                    <motion.a
                      key={course.id}
                      href={`/course/${course.id}/learn`}
                      className="gradient-border card-hover p-5 flex gap-4 group"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="card-glow" />
                      <div className="w-24 h-24 rounded-xl bg-bg-secondary overflow-hidden shrink-0 relative z-10">
                        {course.imageUrl ? (
                          <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-accent/30" />
                          </div>
                        )}
                      </div>
                      <div className="relative z-10 flex-1 min-w-0">
                        <span className="text-xs text-accent">{course.category.name}</span>
                        <h3 className="text-text-primary font-semibold truncate group-hover:text-accent transition-colors">
                          {course.title}
                        </h3>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-text-muted mb-1">
                            <span>Прогресс</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <motion.div
              className="gradient-border p-8 max-w-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="card-glow" />
              <form onSubmit={handleSaveProfile} className="relative z-10 space-y-5">
                <h2 className="text-xl font-bold text-text-primary mb-6">Настройки профиля</h2>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-dark"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Email</label>
                  <input
                    type="email"
                    value={session.user.email || ""}
                    disabled
                    className="input-dark opacity-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Ник в чате</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Отображается в чате курса"
                    className="input-dark"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">URL аватара</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold text-white" style={{ background: avatarUrl ? "transparent" : "#a855f7" }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        (nickname || name || "?").split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                      )}
                    </div>
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
                  <label className="block text-sm text-text-secondary mb-2">Новый пароль</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Оставьте пустым, если не меняете"
                    className="input-dark"
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {saved ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Сохранено!
                      </>
                    ) : saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Сохранить
                      </>
                    )}
                  </span>
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}
