"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  ShoppingCart,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  BarChart3,
  Layers,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Header from "@/components/layout/Header";

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalPurchases: number;
  totalRevenue: number;
}

interface Course {
  id: string;
  title: string;
  price: number;
  category: { name: string };
  _count: { purchases: number; lessons: number };
  createdAt: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { purchases: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { courses: number };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<"dashboard" | "courses" | "users" | "categories" | "chats">("dashboard");
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/courses").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([s, c, u, cat]) => {
      setStats(s);
      setCourses(c.courses || []);
      setUsers(u.users || []);
      setCategories(cat.categories || []);
    });
  }, [session]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCategory),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories([...categories, data.category]);
      setNewCategory({ name: "", slug: "" });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Удалить курс?")) return;
    const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    if (res.ok) setCourses(courses.filter((c) => c.id !== id));
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted">Доступ запрещён</p>
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: "Пользователи", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
        { label: "Курсы", value: stats.totalCourses, icon: BookOpen, color: "text-accent" },
        { label: "Покупки", value: stats.totalPurchases, icon: ShoppingCart, color: "text-green-400" },
        { label: "Выручка", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "text-neon-purple" },
      ]
    : [];

  return (
    <>
      <Header />
      <main className="flex-1 relative z-10 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-8">
            <span className="bg-gradient-to-r from-accent to-neon-purple bg-clip-text text-transparent">
              Админ-панель
            </span>
          </h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { key: "dashboard" as const, label: "Дашборд", icon: BarChart3 },
              { key: "courses" as const, label: "Курсы", icon: BookOpen },
              { key: "users" as const, label: "Пользователи", icon: Users },
              { key: "categories" as const, label: "Категории", icon: Layers },
              { key: "chats" as const, label: "Чаты", icon: MessageCircle },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all whitespace-nowrap ${
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

          {/* Dashboard */}
          {tab === "dashboard" && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card, idx) => (
                <motion.div
                  key={card.label}
                  className="gradient-border p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="card-glow" />
                  <div className="relative z-10">
                    <card.icon className={`w-8 h-8 ${card.color} mb-4`} />
                    <div className="text-2xl font-bold text-text-primary">{card.value}</div>
                    <div className="text-sm text-text-muted mt-1">{card.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Courses */}
          {tab === "courses" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary">Все курсы</h2>
                <a
                  href="/admin/courses/new/edit"
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Добавить курс
                  </span>
                </a>
              </div>

              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="gradient-border p-5 flex items-center gap-4"
                  >
                    <div className="relative z-10 flex items-center gap-4 w-full">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-text-primary font-medium">{course.title}</h3>
                        <div className="flex gap-4 text-xs text-text-muted mt-1">
                          <span>{course.category.name}</span>
                          <span>{course._count.lessons} уроков</span>
                          <span>{course._count.purchases} продаж</span>
                        </div>
                      </div>
                      <span className="text-accent font-bold">{formatPrice(course.price)}</span>
                      <div className="flex gap-2">
                        <a
                          href={`/admin/courses/${course.id}/edit`}
                          className="p-2 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-accent transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {tab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left py-3 px-4 text-sm text-text-muted font-medium">Имя</th>
                    <th className="text-left py-3 px-4 text-sm text-text-muted font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-sm text-text-muted font-medium">Роль</th>
                    <th className="text-left py-3 px-4 text-sm text-text-muted font-medium">Покупки</th>
                    <th className="text-left py-3 px-4 text-sm text-text-muted font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border-default/50 hover:bg-bg-card/50 transition-colors">
                      <td className="py-3 px-4 text-text-primary">{user.name}</td>
                      <td className="py-3 px-4 text-text-secondary">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === "ADMIN" ? "bg-neon-purple/15 text-neon-purple" : "bg-bg-card text-text-muted"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{user._count.purchases}</td>
                      <td className="py-3 px-4 text-text-muted text-sm">
                        {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Categories */}
          {tab === "categories" && (
            <div className="max-w-lg">
              <form onSubmit={handleAddCategory} className="gradient-border p-6 mb-8">
                <div className="relative z-10 space-y-4">
                  <h3 className="text-lg font-bold text-text-primary">Новая категория</h3>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-а-яё]/g, ""),
                      })
                    }
                    placeholder="Название категории"
                    className="input-dark"
                    required
                  />
                  <input
                    type="text"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    placeholder="slug"
                    className="input-dark"
                    required
                  />
                  <button type="submit" className="btn-primary text-sm">
                    <span className="relative z-10 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Добавить
                    </span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="gradient-border p-4 flex items-center justify-between">
                    <div className="relative z-10">
                      <span className="text-text-primary font-medium">{cat.name}</span>
                      <span className="text-text-muted text-sm ml-3">/{cat.slug}</span>
                    </div>
                    <span className="text-text-muted text-sm relative z-10">
                      {cat._count.courses} курсов
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chats */}
          {tab === "chats" && (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-accent/30 mx-auto mb-4" />
              <p className="text-text-secondary mb-4">Управление чатами курсов</p>
              <a
                href="/admin/chats"
                className="btn-primary inline-flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Открыть центр чатов
                </span>
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
