"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, Plus, Trash2, ArrowLeft, GripVertical, Upload, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";

interface Lesson {
  id?: string;
  title: string;
  description: string;
  videoUrl: string;
  order: number;
  links: string;
  homework: string;
}

interface CourseForm {
  title: string;
  description: string;
  price: string;
  videoUrl: string;
  imageUrl: string;
  categoryId: string;
  recommendedCourseId: string;
  discountPercent: string;
  lessons: Lesson[];
}

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [form, setForm] = useState<CourseForm>({
    title: "",
    description: "",
    price: "",
    videoUrl: "",
    imageUrl: "",
    categoryId: "",
    recommendedCourseId: "",
    discountPercent: "",
    lessons: [],
  });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));

    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then((data) => setCourses(data.courses || []));

    if (!isNew) {
      fetch(`/api/admin/courses/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.course) {
            setForm({
              title: data.course.title,
              description: data.course.description,
              price: String(data.course.price),
              videoUrl: data.course.videoUrl || "",
              imageUrl: data.course.imageUrl || "",
              categoryId: data.course.categoryId,
              recommendedCourseId: data.course.recommendedCourseId || "",
              discountPercent: data.course.discountPercent ? String(data.course.discountPercent) : "",
              lessons: data.course.lessons || [],
            });
          }
        });
    }
  }, [params.id, isNew]);

  const addLesson = () => {
    setForm({
      ...form,
      lessons: [
        ...form.lessons,
        {
          title: "",
          description: "",
          videoUrl: "",
          order: form.lessons.length + 1,
          links: "",
          homework: "",
        },
      ],
    });
  };

  const updateLesson = (idx: number, field: keyof Lesson, value: string | number) => {
    const lessons = [...form.lessons];
    (lessons[idx] as unknown as Record<string, unknown>)[field] = value;
    setForm({ ...form, lessons });
  };

  const removeLesson = (idx: number) => {
    const lessons = form.lessons.filter((_, i) => i !== idx).map((l, i) => ({ ...l, order: i + 1 }));
    setForm({ ...form, lessons });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      ...form,
      price: parseFloat(form.price),
      discountPercent: form.discountPercent ? parseInt(form.discountPercent) : null,
      recommendedCourseId: form.recommendedCourseId || null,
      videoUrl: form.videoUrl || null,
      imageUrl: form.imageUrl || null,
    };

    const url = isNew ? "/api/admin/courses" : `/api/admin/courses/${params.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/admin");
    }
    setSaving(false);
  };

  return (
    <>
      <Header />
      <main className="flex-1 relative z-10 py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к админ-панели
          </a>

          <h1 className="text-2xl font-bold text-text-primary mb-8">
            {isNew ? "Новый курс" : "Редактирование курса"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Course details */}
            <div className="gradient-border p-6">
              <div className="relative z-10 space-y-5">
                <h2 className="text-lg font-bold text-text-primary">Основная информация</h2>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Название</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input-dark"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Описание</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-dark min-h-[120px] resize-y"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Цена (руб.)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="input-dark"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Категория</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="input-dark"
                      required
                    >
                      <option value="">Выберите</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Обложка курса</label>
                  <div className="flex gap-3 items-start">
                    {form.imageUrl && (
                      <img src={form.imageUrl} alt="Превью" className="w-24 h-16 object-cover rounded-lg border border-border-default" />
                    )}
                    <div className="flex-1 space-y-2">
                      <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 text-sm font-medium cursor-pointer hover:bg-accent/15 transition-colors w-fit">
                        <Upload className="w-4 h-4" />
                        Загрузить картинку
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append("file", file);
                            const res = await fetch("/api/upload", { method: "POST", body: fd });
                            const data = await res.json();
                            if (data.url) setForm({ ...form, imageUrl: data.url });
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        className="input-dark"
                        placeholder="или вставьте URL..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">URL видео-превью</label>
                  <input
                    type="text"
                    value={form.videoUrl}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    className="input-dark"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Рекомендуемый курс</label>
                    <select
                      value={form.recommendedCourseId}
                      onChange={(e) => setForm({ ...form, recommendedCourseId: e.target.value })}
                      className="input-dark"
                    >
                      <option value="">Нет</option>
                      {courses.filter((c) => c.id !== params.id).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Скидка (%)</label>
                    <input
                      type="number"
                      value={form.discountPercent}
                      onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                      className="input-dark"
                      min="0"
                      max="100"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">
                  Уроки ({form.lessons.length})
                </h2>
                <button
                  type="button"
                  onClick={addLesson}
                  className="px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 text-sm font-medium hover:bg-accent/15 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить урок
                </button>
              </div>

              <div className="space-y-4">
                {form.lessons.map((lesson, idx) => (
                  <motion.div
                    key={idx}
                    className="gradient-border p-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-text-muted" />
                          <span className="text-accent font-bold">Урок {lesson.order}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLesson(idx)}
                          className="p-1 text-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLesson(idx, "title", e.target.value)}
                        placeholder="Название урока"
                        className="input-dark"
                        required
                      />

                      <textarea
                        value={lesson.description}
                        onChange={(e) => updateLesson(idx, "description", e.target.value)}
                        placeholder="Описание"
                        className="input-dark min-h-[80px] resize-y"
                      />

                      <input
                        type="text"
                        value={lesson.videoUrl}
                        onChange={(e) => updateLesson(idx, "videoUrl", e.target.value)}
                        placeholder="URL видео"
                        className="input-dark"
                      />

                      <textarea
                        value={lesson.links}
                        onChange={(e) => updateLesson(idx, "links", e.target.value)}
                        placeholder="Полезные ссылки (по одной на строку)"
                        className="input-dark min-h-[60px] resize-y"
                      />

                      <textarea
                        value={lesson.homework}
                        onChange={(e) => updateLesson(idx, "homework", e.target.value)}
                        placeholder="Домашнее задание"
                        className="input-dark min-h-[80px] resize-y"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-lg disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center gap-2">
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? "Сохранение..." : isNew ? "Создать курс" : "Сохранить"}
              </span>
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
