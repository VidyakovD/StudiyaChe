"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, Plus, Trash2, ArrowLeft, GripVertical, Upload, Link2, FileText, Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";

interface LessonFile {
  id: string;
  name: string;
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

interface LinkItem {
  url: string;
  label: string;
  description: string;
}

function parseLinks(linksStr: string): LinkItem[] {
  if (!linksStr) return [];
  try {
    const parsed = JSON.parse(linksStr);
    if (Array.isArray(parsed)) return parsed as LinkItem[];
  } catch {}
  // Legacy plain-text format
  return linksStr.split("\n").filter((l) => l.trim()).map((l) => ({ url: l.trim(), label: "", description: "" }));
}

function serializeLinks(links: LinkItem[]): string {
  return JSON.stringify(links);
}

type ThesisType = "thesis" | "theory" | "lifehack" | "important";

interface ThesisItem {
  type: ThesisType;
  text: string;
}

function parseTheses(str: string | null | undefined): ThesisItem[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((p) => p && typeof p === "object" && typeof p.text === "string")
        .map((p) => ({
          type: (["thesis", "theory", "lifehack", "important"].includes(p.type) ? p.type : "thesis") as ThesisType,
          text: String(p.text),
        }));
    }
  } catch {}
  return [];
}

function serializeTheses(items: ThesisItem[]): string {
  return JSON.stringify(items);
}

const THESIS_LABELS: Record<ThesisType, string> = {
  thesis: "Тезис",
  theory: "Теория",
  lifehack: "Лайфхак",
  important: "Важно",
};

interface ModuleItem {
  id?: string;
  title: string;
  order: number;
}

interface Lesson {
  id?: string;
  title: string;
  description: string;
  videoUrl: string;
  imageUrl: string;
  order: number;
  type: string;
  links: string;
  homework: string;
  theses: string;
  moduleId: string;
  files?: LessonFile[];
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
  modules: ModuleItem[];
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
    modules: [],
    lessons: [],
  });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const draftKey = `courseDraft:${params.id}`;

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
              modules: data.course.modules || [],
              lessons: (data.course.lessons || []).map((l: Record<string, unknown>) => ({ ...l, moduleId: l.moduleId || "" })),
            });
          }
        });
    } else {
      // Восстановить черновик нового курса из localStorage, если остался с прошлой попытки
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) setForm(JSON.parse(raw));
      } catch {}
    }
  }, [params.id, isNew, draftKey]);

  // Автосохранение черновика — не теряем данные если сабмит упал или браузер закрылся
  useEffect(() => {
    if (!isNew) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
    } catch {}
  }, [form, isNew, draftKey]);

  const addLesson = () => {
    setForm({
      ...form,
      lessons: [
        ...form.lessons,
        {
          title: "",
          description: "",
          videoUrl: "",
          imageUrl: "",
          order: form.lessons.length + 1,
          type: "LESSON",
          links: "",
          homework: "",
          theses: "",
          moduleId: "",
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

  const handleUploadLessonFile = async (idx: number, file: File) => {
    const lesson = form.lessons[idx];
    if (!lesson.id) {
      setSubmitError("Сначала сохрани курс, затем добавляй файлы к урокам — нужен ID урока.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setSubmitError("Файл больше 30 МБ");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("lessonId", lesson.id);
    fd.append("name", file.name);
    const res = await fetch("/api/admin/lesson-file", { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error || "Не удалось загрузить файл");
      return;
    }
    const created: LessonFile = await res.json();
    const lessons = [...form.lessons];
    lessons[idx] = {
      ...lesson,
      files: [...(lesson.files || []), created],
    };
    setForm({ ...form, lessons });
  };

  const handleDeleteLessonFile = async (idx: number, fileId: string) => {
    if (!confirm("Удалить файл?")) return;
    const res = await fetch(`/api/admin/lesson-file/${fileId}`, { method: "DELETE" });
    if (!res.ok) {
      setSubmitError("Не удалось удалить файл");
      return;
    }
    const lessons = [...form.lessons];
    lessons[idx] = {
      ...lessons[idx],
      files: (lessons[idx].files || []).filter((f) => f.id !== fileId),
    };
    setForm({ ...form, lessons });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSubmitError(null);

    // Отфильтровываем пустые уроки (пользователь мог добавить строку и не заполнить).
    const cleanLessons = form.lessons
      .filter((l) => l.title.trim().length > 0)
      .map((l, i) => ({ ...l, order: i + 1 }));

    const body = {
      ...form,
      lessons: cleanLessons,
      price: parseFloat(form.price),
      discountPercent: form.discountPercent ? parseInt(form.discountPercent) : null,
      recommendedCourseId: form.recommendedCourseId || null,
      videoUrl: form.videoUrl || null,
      imageUrl: form.imageUrl || null,
    };

    const url = isNew ? "/api/admin/courses" : `/api/admin/courses/${params.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (isNew) {
          try { localStorage.removeItem(draftKey); } catch {}
        }
        router.push("/admin");
        return;
      }

      // Разбираем ответ сервера: Zod возвращает {error, issues[]}
      let message = `Ошибка ${res.status}`;
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
        if (Array.isArray(data?.issues) && data.issues.length > 0) {
          message = data.issues
            .map((i: { path?: (string | number)[]; message?: string }) =>
              `${(i.path || []).join(".") || "поле"}: ${i.message || "ошибка"}`
            )
            .join("; ");
        }
      } catch {}
      setSubmitError(message);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Сеть недоступна");
    } finally {
      setSaving(false);
    }
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

            {/* Modules */}
            <div className="gradient-border p-6">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-text-primary">
                    Модули ({form.modules.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setForm({
                      ...form,
                      modules: [...form.modules, { title: "", order: form.modules.length + 1 }],
                    })}
                    className="px-4 py-2 rounded-xl bg-neon-purple/10 text-neon-purple border border-neon-purple/20 text-sm font-medium hover:bg-neon-purple/15 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить модуль
                  </button>
                </div>

                {form.modules.length === 0 && (
                  <p className="text-text-muted text-sm">Модули не обязательны. Без них уроки отображаются списком.</p>
                )}

                {form.modules.map((mod, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center shrink-0">
                      <span className="text-neon-purple font-bold text-sm">{mod.order}</span>
                    </div>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => {
                        const modules = [...form.modules];
                        modules[idx] = { ...modules[idx], title: e.target.value };
                        setForm({ ...form, modules });
                      }}
                      placeholder="Название модуля"
                      className="input-dark flex-1"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const modules = form.modules.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i + 1 }));
                        const lessons = form.lessons.map((l) => l.moduleId === mod.id ? { ...l, moduleId: "" } : l);
                        setForm({ ...form, modules, lessons });
                      }}
                      className="p-2 text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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
                          <span className={`font-bold ${lesson.type === "MASTERCLASS" ? "text-neon-purple" : "text-accent"}`}>
                            {lesson.type === "MASTERCLASS" ? "МК" : "Урок"} {lesson.order}
                          </span>
                          <select
                            value={lesson.type || "LESSON"}
                            onChange={(e) => updateLesson(idx, "type", e.target.value)}
                            className="bg-bg-secondary border border-border-default rounded-lg px-2 py-1 text-xs text-text-secondary"
                          >
                            <option value="LESSON">Урок</option>
                            <option value="MASTERCLASS">Мастер-класс</option>
                          </select>
                          {form.modules.length > 0 && (
                            <select
                              value={lesson.moduleId || ""}
                              onChange={(e) => updateLesson(idx, "moduleId", e.target.value)}
                              className="bg-bg-secondary border border-border-default rounded-lg px-2 py-1 text-xs text-neon-purple"
                            >
                              <option value="">Без модуля</option>
                              {form.modules.map((m, mi) => (
                                <option key={mi} value={m.id || `new-${mi}`}>
                                  {m.title || `Модуль ${m.order}`}
                                </option>
                              ))}
                            </select>
                          )}
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

                      {/* Обложка урока */}
                      <div>
                        <label className="text-xs text-text-muted mb-1 block">Обложка урока</label>
                        <div className="flex gap-2 items-center">
                          {lesson.imageUrl && (
                            <img src={lesson.imageUrl} alt="Превью" className="w-16 h-10 object-cover rounded-lg border border-border-default" />
                          )}
                          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-medium cursor-pointer hover:bg-accent/15 transition-colors">
                            <Upload className="w-3 h-3" />
                            Загрузить
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
                                if (data.url) updateLesson(idx, "imageUrl", data.url);
                              }}
                            />
                          </label>
                          <input
                            type="text"
                            value={lesson.imageUrl}
                            onChange={(e) => updateLesson(idx, "imageUrl", e.target.value)}
                            placeholder="или URL картинки..."
                            className="input-dark flex-1 !py-1.5 text-xs"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        value={lesson.videoUrl}
                        onChange={(e) => updateLesson(idx, "videoUrl", e.target.value)}
                        placeholder="URL видео (Kinescope)"
                        className="input-dark"
                      />

                      {/* Полезные ссылки */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-text-muted flex items-center gap-1.5">
                            <Link2 className="w-3 h-3" />
                            Полезные ссылки
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const links = parseLinks(lesson.links);
                              links.push({ url: "", label: "", description: "" });
                              updateLesson(idx, "links", serializeLinks(links));
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-medium hover:bg-accent/15 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Добавить ссылку
                          </button>
                        </div>
                        <div className="space-y-2">
                          {parseLinks(lesson.links).map((link, li) => (
                            <div key={li} className="bg-bg-secondary rounded-xl p-3 space-y-2 border border-border-default">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={link.url}
                                  onChange={(e) => {
                                    const links = parseLinks(lesson.links);
                                    links[li] = { ...links[li], url: e.target.value };
                                    updateLesson(idx, "links", serializeLinks(links));
                                  }}
                                  placeholder="https://... (сама ссылка)"
                                  className="input-dark flex-1 !py-1.5 text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const links = parseLinks(lesson.links).filter((_, i) => i !== li);
                                    updateLesson(idx, "links", serializeLinks(links));
                                  }}
                                  className="p-1.5 text-text-muted hover:text-red-400 transition-colors shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={link.label}
                                onChange={(e) => {
                                  const links = parseLinks(lesson.links);
                                  links[li] = { ...links[li], label: e.target.value };
                                  updateLesson(idx, "links", serializeLinks(links));
                                }}
                                placeholder="Текст для отображения пользователю"
                                className="input-dark !py-1.5 text-xs"
                              />
                              <input
                                type="text"
                                value={link.description}
                                onChange={(e) => {
                                  const links = parseLinks(lesson.links);
                                  links[li] = { ...links[li], description: e.target.value };
                                  updateLesson(idx, "links", serializeLinks(links));
                                }}
                                placeholder="Описание"
                                className="input-dark !py-1.5 text-xs"
                              />
                            </div>
                          ))}
                          {parseLinks(lesson.links).length === 0 && (
                            <p className="text-xs text-text-muted/50 text-center py-2">Нет ссылок</p>
                          )}
                        </div>
                      </div>

                      {/* Тезисы, теории и лайфхаки */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-text-muted flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            Тезисы / теории / лайфхаки (для закрепления)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const t = parseTheses(lesson.theses);
                              t.push({ type: "thesis", text: "" });
                              updateLesson(idx, "theses", serializeTheses(t));
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-medium hover:bg-accent/15 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Добавить пункт
                          </button>
                        </div>
                        <div className="space-y-2">
                          {parseTheses(lesson.theses).map((item, ti) => (
                            <div
                              key={ti}
                              className="flex gap-2 bg-bg-secondary rounded-xl p-3 border border-border-default items-start"
                            >
                              <select
                                value={item.type}
                                onChange={(e) => {
                                  const t = parseTheses(lesson.theses);
                                  t[ti] = { ...t[ti], type: e.target.value as ThesisType };
                                  updateLesson(idx, "theses", serializeTheses(t));
                                }}
                                className="bg-bg-primary border border-border-default rounded-lg px-2 py-1.5 text-xs text-text-secondary shrink-0"
                              >
                                <option value="thesis">Тезис</option>
                                <option value="theory">Теория</option>
                                <option value="lifehack">Лайфхак</option>
                                <option value="important">Важно</option>
                              </select>
                              <textarea
                                value={item.text}
                                onChange={(e) => {
                                  const t = parseTheses(lesson.theses);
                                  t[ti] = { ...t[ti], text: e.target.value };
                                  updateLesson(idx, "theses", serializeTheses(t));
                                }}
                                placeholder="Короткий тезис или лайфхак для студента"
                                className="input-dark flex-1 !py-1.5 text-xs min-h-[40px] resize-y"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const t = parseTheses(lesson.theses).filter((_, i) => i !== ti);
                                  updateLesson(idx, "theses", serializeTheses(t));
                                }}
                                className="p-1.5 text-text-muted hover:text-red-400 transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {parseTheses(lesson.theses).length === 0 && (
                            <p className="text-xs text-text-muted/50 text-center py-2">Нет пунктов</p>
                          )}
                        </div>
                      </div>

                      {/* Файлы-материалы к уроку */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-text-muted flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            Материалы (файлы до 30 МБ, только после покупки)
                          </label>
                          <label
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              lesson.id
                                ? "bg-accent/10 text-accent border border-accent/20 cursor-pointer hover:bg-accent/15"
                                : "bg-bg-secondary text-text-muted/60 border border-border-default cursor-not-allowed"
                            }`}
                            title={lesson.id ? "" : "Сначала сохраните курс"}
                          >
                            <Upload className="w-3 h-3" />
                            Добавить файл
                            <input
                              type="file"
                              className="hidden"
                              disabled={!lesson.id}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  await handleUploadLessonFile(idx, file);
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="space-y-1.5">
                          {(lesson.files || []).map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center gap-2 bg-bg-secondary border border-border-default rounded-lg px-3 py-2"
                            >
                              <FileText className="w-4 h-4 text-accent shrink-0" />
                              <span className="text-sm text-text-primary truncate flex-1">{f.name}</span>
                              <span className="text-xs text-text-muted shrink-0">{formatFileSize(f.size)}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteLessonFile(idx, f.id)}
                                className="p-1 text-text-muted hover:text-red-400 transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {(!lesson.files || lesson.files.length === 0) && (
                            <p className="text-xs text-text-muted/50 text-center py-2">Нет файлов</p>
                          )}
                        </div>
                      </div>

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

            {submitError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <strong className="block mb-1">Не удалось сохранить курс</strong>
                <span className="break-words whitespace-pre-wrap">{submitError}</span>
              </div>
            )}

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
