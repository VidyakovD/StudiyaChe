"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  CheckCircle,
  Lock,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  Trophy,
  FileText,
  Download,
} from "lucide-react";
import Header from "@/components/layout/Header";
import ProtectedVideoPlayer from "@/components/course/ProtectedVideoPlayer";
import CourseChat from "@/components/course/CourseChat";
import LessonCelebration from "@/components/course/LessonCelebration";

interface LessonFile {
  id: string;
  name: string;
  size: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  order: number;
  links: string | null;
  homework: string | null;
  files: LessonFile[] | null;
}

interface LessonWithProgress extends Lesson {
  completed: boolean;
  moduleId: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

interface ModuleData {
  id: string;
  title: string;
  order: number;
}

interface CourseData {
  id: string;
  title: string;
  modules: ModuleData[];
  lessons: LessonWithProgress[];
  recommendedCourseId: string | null;
  discountPercent: number | null;
}

export default function LearnPage() {
  const params = useParams();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${params.id}?learn=true`)
      .then((r) => r.json())
      .then((data) => {
        if (data.course) {
          setCourse(data.course);
          const firstIncomplete = data.course.lessons.find(
            (l: LessonWithProgress) => !l.completed
          );
          setActiveLesson(firstIncomplete || data.course.lessons[0]);
          setAllCompleted(data.course.lessons.every((l: LessonWithProgress) => l.completed));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const isLessonAccessible = (lesson: LessonWithProgress) => {
    if (!course) return false;
    if (lesson.completed) return true;
    const idx = course.lessons.findIndex((l) => l.id === lesson.id);
    if (idx === 0) return true;
    return course.lessons[idx - 1]?.completed || false;
  };

  const handleComplete = async () => {
    if (!activeLesson || !course) return;
    setCompleting(true);

    try {
      const res = await fetch(`/api/lessons/${activeLesson.id}/complete`, {
        method: "POST",
      });

      if (res.ok) {
        setShowCelebration(true);
        const updatedLessons = course.lessons.map((l) =>
          l.id === activeLesson.id ? { ...l, completed: true } : l
        );
        const updatedCourse = { ...course, lessons: updatedLessons };
        setCourse(updatedCourse);

        const nextLesson = updatedLessons.find(
          (l) => l.order === activeLesson.order + 1
        );
        if (nextLesson) {
          setActiveLesson({ ...nextLesson, completed: nextLesson.completed });
        } else {
          setActiveLesson({ ...activeLesson, completed: true });
          setAllCompleted(true);
        }
      }
    } catch {
      // ignore
    }
    setCompleting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted">Курс не найден или нет доступа</p>
      </div>
    );
  }

  const completedCount = course.lessons.filter((l) => l.completed).length;
  const progress = Math.round((completedCount / course.lessons.length) * 100);

  return (
    <>
      <Header />
      <div className="flex-1 flex min-h-[calc(100vh-80px)]">
        {/* Sidebar - lesson list */}
        <aside className="w-80 shrink-0 bg-bg-secondary border-r border-border-default overflow-y-auto hidden lg:block">
          <div className="p-6">
            <a
              href={`/course/${course.id}`}
              className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              К описанию курса
            </a>
            <h2 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">{course.title}</h2>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-text-muted mb-2">
                <span>{completedCount} из {course.lessons.length}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Lessons grouped by modules */}
            <div className="space-y-1">
              {(() => {
                const hasModules = course.modules && course.modules.length > 0;
                if (!hasModules) {
                  // No modules — flat list
                  return course.lessons.map((lesson) => renderLessonButton(lesson));
                }
                // Group by modules
                const groups: { module: ModuleData | null; lessons: LessonWithProgress[] }[] = [];
                // Lessons without module
                const noModule = course.lessons.filter((l) => !l.moduleId);
                if (noModule.length > 0) groups.push({ module: null, lessons: noModule });
                // Each module
                for (const mod of course.modules) {
                  const modLessons = course.lessons.filter((l) => l.moduleId === mod.id);
                  if (modLessons.length > 0) groups.push({ module: mod, lessons: modLessons });
                }
                return groups.map((g, gi) => (
                  <div key={gi} className="mb-3">
                    {g.module && (
                      <div className="flex items-center gap-2 px-2 py-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
                        <span className="text-xs font-bold text-neon-purple uppercase tracking-wider">
                          {g.module.title}
                        </span>
                      </div>
                    )}
                    {g.lessons.map((lesson) => renderLessonButton(lesson))}
                  </div>
                ));

                function renderLessonButton(lesson: LessonWithProgress) {
                  const accessible = isLessonAccessible(lesson);
                  const isActive = activeLesson?.id === lesson.id;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => accessible && setActiveLesson(lesson)}
                      disabled={!accessible}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                        isActive
                          ? "bg-accent/10 border border-accent/20"
                          : accessible
                          ? "hover:bg-bg-card-hover"
                          : "opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          lesson.completed
                            ? "bg-green-500/15 text-green-400"
                            : isActive
                            ? "bg-accent/15 text-accent"
                            : "bg-bg-card text-text-muted"
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : accessible ? (
                          <span className="text-xs font-bold">{lesson.order}</span>
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span
                        className={`text-sm truncate ${
                          isActive ? "text-accent font-medium" : "text-text-secondary"
                        }`}
                      >
                        {lesson.title}
                      </span>
                    </button>
                  );
                }
              })()}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {allCompleted && activeLesson?.completed ? (
              <motion.div
                key="completed"
                className="flex items-center justify-center min-h-full p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center max-w-md">
                  <motion.div
                    className="w-24 h-24 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-6 neon-glow"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Trophy className="w-12 h-12 text-accent" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-text-primary mb-4">
                    Курс пройден!
                  </h2>
                  <p className="text-text-secondary mb-8">
                    Поздравляем! Вы успешно завершили курс &ldquo;{course.title}&rdquo;
                  </p>
                  {course.recommendedCourseId && (
                    <a
                      href={`/course/${course.recommendedCourseId}`}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <span className="relative z-10">
                        Следующий курс {course.discountPercent ? `со скидкой ${course.discountPercent}%` : ""}
                      </span>
                    </a>
                  )}
                  <div className="mt-4">
                    <a href="/cabinet" className="text-text-muted hover:text-accent transition-colors">
                      Вернуться в кабинет
                    </a>
                  </div>
                </div>
              </motion.div>
            ) : activeLesson ? (
              <motion.div
                key={activeLesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="p-6 lg:p-10 max-w-4xl"
              >
                {/* Protected video player */}
                <div className="mb-8">
                  <ProtectedVideoPlayer
                    videoUrl={activeLesson.videoUrl}
                    title={activeLesson.title}
                  />
                </div>

                {/* Lesson info */}
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                  <span className="text-accent mr-2">#{activeLesson.order}</span>
                  {activeLesson.title}
                </h1>

                {activeLesson.description && (
                  <div className="text-text-secondary text-lg leading-relaxed mb-8 whitespace-pre-wrap">
                    {activeLesson.description.split(/(\d{1,2}:\d{2}(?::\d{2})?)/).map((part, i) => {
                      const timeMatch = part.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
                      if (timeMatch) {
                        const h = timeMatch[3] ? parseInt(timeMatch[1]) : 0;
                        const m = timeMatch[3] ? parseInt(timeMatch[2]) : parseInt(timeMatch[1]);
                        const s = timeMatch[3] ? parseInt(timeMatch[3]) : parseInt(timeMatch[2]);
                        const totalSeconds = h * 3600 + m * 60 + s;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              const seekFn = (window as unknown as Record<string, unknown>).__videoSeekTo as ((s: number) => void) | undefined;
                              if (seekFn) seekFn(totalSeconds);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-mono cursor-pointer border border-accent/20 mx-1"
                          >
                            <Play className="w-3 h-3" fill="currentColor" />
                            {part}
                          </button>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                )}

                {/* Links */}
                {activeLesson.links && (() => {
                  interface LinkItem { url: string; label: string; description: string; }
                  let links: LinkItem[] = [];
                  try {
                    const parsed = JSON.parse(activeLesson.links);
                    if (Array.isArray(parsed)) links = parsed as LinkItem[];
                  } catch {
                    // Legacy plain-text
                    links = activeLesson.links.split("\n").filter((l) => l.trim()).map((l) => ({ url: l.trim(), label: "", description: "" }));
                  }
                  if (links.length === 0) return null;
                  return (
                    <div className="gradient-border p-5 mb-6">
                      <h3 className="text-text-primary font-semibold mb-4">Полезные ссылки</h3>
                      <div className="space-y-2">
                        {links.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent transition-colors text-sm"
                          >
                            {link.description || link.label || link.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Homework */}
                {activeLesson.homework && (
                  <div className="gradient-border p-5 mb-8">
                    <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-neon-purple" />
                      Домашнее задание
                    </h3>
                    <p className="text-text-secondary text-sm whitespace-pre-wrap">
                      {activeLesson.homework}
                    </p>
                  </div>
                )}

                {/* Lesson files — materials */}
                {activeLesson.files && activeLesson.files.length > 0 && (
                  <div className="gradient-border p-5 mb-8">
                    <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent" />
                      Материалы
                    </h3>
                    <div className="space-y-2">
                      {activeLesson.files.map((f) => (
                        <a
                          key={f.id}
                          href={`/api/lesson-file/${f.id}`}
                          className="flex items-center gap-3 bg-bg-secondary border border-border-default rounded-xl px-4 py-3 transition-colors hover:border-accent/40 hover:bg-bg-card-hover group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-text-primary truncate">{f.name}</div>
                            <div className="text-xs text-text-muted">{formatFileSize(f.size)}</div>
                          </div>
                          <Download className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete button */}
                {!activeLesson.completed && (
                  <motion.button
                    onClick={handleComplete}
                    disabled={completing}
                    className="btn-primary flex items-center gap-2 text-lg disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {completing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {completing ? "Сохранение..." : "Урок пройден"}
                      <ChevronRight className="w-5 h-5" />
                    </span>
                  </motion.button>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
      {course && <CourseChat courseId={course.id} />}
      <LessonCelebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}
