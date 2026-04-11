"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Play, BookOpen, Clock, CheckCircle, Lock, ArrowLeft, ShoppingCart, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer, easing } from "@/hooks/useAnimations";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  videoUrl: string | null;
  imageUrl: string | null;
  category: { name: string };
  modules: { id: string; title: string; order: number }[];
  lessons: { id: string; title: string; order: number; description: string | null; moduleId: string | null }[];
  recommendedCourseId: string | null;
  discountPercent: number | null;
}

export default function CoursePage() {
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setCourse(data.course);
        setPurchased(data.purchased || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleBuy = async () => {
    setBuying(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setPurchased(true);
      } else if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        alert(data.error || "Ошибка оплаты");
      }
    } catch {
      alert("Ошибка сервера");
    }
    setBuying(false);
  };

  if (loading) {
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

  if (!course) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <BookOpen className="w-16 h-16 text-text-muted/20 mx-auto mb-4" />
          <p className="text-text-muted text-lg">Курс не найден</p>
          <a href="/" className="text-accent hover:text-accent-light transition-colors mt-2 inline-block">
            Вернуться на главную
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 relative z-10">
        {/* Hero section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-0 left-1/4 w-[500px] h-[300px] rounded-full bg-accent/5 blur-[120px]"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-neon-purple/5 blur-[100px]"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </div>

          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <motion.a
              href="/"
              className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-8"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: easing.outQuart }}
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к курсам
            </motion.a>

            <div className="grid lg:grid-cols-5 gap-12">
              {/* Course info */}
              <div className="lg:col-span-3">
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.span
                    className="inline-flex px-3 py-1 rounded-full text-sm bg-accent/15 text-accent border border-accent/20 mb-4 tracking-wide"
                    variants={fadeInLeft}
                  >
                    {course.category.name}
                  </motion.span>
                  <motion.h1
                    className="text-4xl md:text-5xl font-bold text-text-primary mb-6"
                    variants={fadeInLeft}
                  >
                    {course.title}
                  </motion.h1>
                  <motion.p
                    className="text-lg text-text-secondary mb-8"
                    variants={fadeInLeft}
                  >
                    {course.description}
                  </motion.p>

                  <motion.div
                    className="flex flex-wrap gap-6 text-text-muted"
                    variants={fadeInLeft}
                  >
                    {[
                      { icon: BookOpen, text: `${course.lessons.length} уроков` },
                      { icon: Clock, text: "В своём темпе" },
                      { icon: Star, text: "Доступ навсегда" },
                    ].map(({ icon: Icon, text }) => (
                      <span key={text} className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-accent" />
                        {text}
                      </span>
                    ))}
                  </motion.div>
                </motion.div>
              </div>

              {/* Purchase card */}
              <motion.div
                className="lg:col-span-2"
                variants={fadeInRight}
                initial="hidden"
                animate="visible"
              >
                <div className="gradient-border p-6 sticky top-24">
                  <div className="card-glow" />
                  <div className="relative z-10">
                    {/* Video preview */}
                    <div className="relative bg-bg-secondary rounded-xl overflow-hidden mb-6">
                      {showVideo && course.videoUrl ? (
                        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                          <iframe
                            src={course.videoUrl.includes("kinescope.io") ? course.videoUrl + "?autoplay=1" : course.videoUrl}
                            className="absolute inset-0 w-full h-full rounded-xl"
                            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; screen-wake-lock"
                            allowFullScreen
                            style={{ border: "none" }}
                          />
                        </div>
                      ) : (
                        <div
                          className="relative h-48 cursor-pointer group"
                          onClick={() => course.videoUrl && setShowVideo(true)}
                        >
                          {course.imageUrl ? (
                            <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-12 h-12 text-accent/30" />
                            </div>
                          )}
                          {course.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                              <motion.div
                                className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center neon-glow"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Play className="w-6 h-6 text-white ml-1" fill="white" />
                              </motion.div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-3xl font-bold text-accent mb-6 neon-text tracking-tight">
                      {formatPrice(course.price)}
                    </div>

                    {purchased ? (
                      <motion.a
                        href={`/course/${course.id}/learn`}
                        className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <Play className="w-5 h-5" />
                          Перейти к курсу
                        </span>
                      </motion.a>
                    ) : (
                      <motion.button
                        onClick={handleBuy}
                        disabled={buying}
                        className="btn-primary w-full flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {buying ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ShoppingCart className="w-5 h-5" />
                          )}
                          {buying ? "Оплата..." : "Купить курс"}
                        </span>
                      </motion.button>
                    )}

                    <ul className="mt-6 space-y-3 text-sm text-text-secondary">
                      {[
                        "Доступ навсегда",
                        "Последовательное прохождение",
                        "Домашние задания",
                      ].map((item, i) => (
                        <motion.li
                          key={item}
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.08, duration: 0.4, ease: easing.outQuart }}
                        >
                          <CheckCircle className="w-4 h-4 text-success" />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Lesson list */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              className="text-2xl font-bold text-text-primary mb-8 tracking-tight"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: easing.outQuart }}
            >
              Программа курса
              <span className="text-text-muted font-normal text-lg ml-3">
                {course.lessons.length} уроков
              </span>
            </motion.h2>

            <div className="space-y-3">
              {(() => {
                const hasModules = course.modules && course.modules.length > 0;
                if (!hasModules) {
                  return course.lessons.map((lesson, idx) => renderLesson(lesson, idx));
                }
                const groups: { module: { id: string; title: string } | null; lessons: typeof course.lessons }[] = [];
                const noModule = course.lessons.filter((l) => !l.moduleId);
                if (noModule.length > 0) groups.push({ module: null, lessons: noModule });
                for (const mod of course.modules) {
                  const modLessons = course.lessons.filter((l) => l.moduleId === mod.id);
                  if (modLessons.length > 0) groups.push({ module: mod, lessons: modLessons });
                }
                return groups.map((g, gi) => (
                  <div key={gi} className="mb-6">
                    {g.module && (
                      <motion.div
                        className="flex items-center gap-3 mb-3 mt-4"
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, ease: easing.outQuart }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-neon-purple/15 flex items-center justify-center">
                          <span className="text-neon-purple font-bold text-sm">{gi + 1}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-neon-purple tracking-tight">{g.module.title}</h3>
                        <span className="text-xs text-text-muted">{g.lessons.length} уроков</span>
                      </motion.div>
                    )}
                    {g.lessons.map((lesson, idx) => renderLesson(lesson, idx))}
                  </div>
                ));

                function renderLesson(lesson: { id: string; title: string; order: number; description: string | null; moduleId: string | null }, idx: number) {
                  return (
                    <motion.div
                      key={lesson.id}
                      className="gradient-border p-4 flex items-center gap-4 group"
                      initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                      whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.04, ease: easing.outQuart }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-accent/15">
                        <span className="text-accent font-bold text-sm">{lesson.order}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-text-primary font-medium truncate tracking-tight">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="text-sm text-text-muted truncate">{lesson.description}</p>
                        )}
                      </div>
                      {!purchased && (
                        <Lock className="w-4 h-4 text-text-muted shrink-0" />
                      )}
                    </motion.div>
                  );
                }
              })()}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
