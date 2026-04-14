"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import CourseCard from "./CourseCard";
import FilterBar from "./FilterBar";
import { fadeInUp, staggerContainer } from "@/hooks/useAnimations";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: { id: string; name: string; slug: string };
  _count: { lessons: number; masterclasses: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

/* Beautiful empty state SVG illustration */
function EmptyStateIllustration() {
  return (
    <motion.svg
      width="200"
      height="160"
      viewBox="0 0 200 160"
      fill="none"
      className="mx-auto mb-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
    >
      {/* Desk / surface */}
      <ellipse cx="100" cy="140" rx="80" ry="12" fill="rgba(255,255,255,0.02)" />
      {/* Search window */}
      <motion.rect
        x="50" y="30" width="100" height="80" rx="12"
        fill="rgba(22,22,31,0.8)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1.5"
        initial={{ y: 40 }}
        animate={{ y: 30 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
      />
      {/* Search bar */}
      <rect x="62" y="42" width="76" height="10" rx="5" fill="rgba(255,255,255,0.04)" />
      <circle cx="70" cy="47" r="3" fill="rgba(255,107,43,0.3)" />
      {/* Lines — content placeholder */}
      <motion.rect
        x="62" y="60" width="60" height="4" rx="2"
        fill="rgba(255,255,255,0.04)"
        initial={{ width: 0 }}
        animate={{ width: 60 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      <motion.rect
        x="62" y="70" width="45" height="4" rx="2"
        fill="rgba(255,255,255,0.03)"
        initial={{ width: 0 }}
        animate={{ width: 45 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      <motion.rect
        x="62" y="80" width="55" height="4" rx="2"
        fill="rgba(255,255,255,0.03)"
        initial={{ width: 0 }}
        animate={{ width: 55 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      />
      {/* Magnifying glass icon */}
      <motion.g
        initial={{ rotate: -20, x: 10 }}
        animate={{ rotate: 0, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}
      >
        <circle cx="145" cy="55" r="16" stroke="rgba(255,107,43,0.25)" strokeWidth="2.5" fill="none" />
        <line x1="156" y1="67" x2="168" y2="79" stroke="rgba(255,107,43,0.25)" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>
      {/* Sparkle */}
      <motion.circle
        cx="160" cy="35"
        r="2"
        fill="rgba(168,85,247,0.4)"
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx="42" cy="60"
        r="1.5"
        fill="rgba(255,107,43,0.3)"
        animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.3, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
    </motion.svg>
  );
}

export default function CourseGrid() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState({ category: "all", search: "", sort: "default" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        setCourses(data.courses || []);
        setCategories(data.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...courses];

    if (filters.category !== "all") {
      result = result.filter((c) => c.category.slug === filters.category);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (filters.sort === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (filters.sort === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [courses, filters]);

  return (
    <section id="courses" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12"
        >
          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-4"
            variants={fadeInUp}
          >
            <span className="text-text-primary">Каталог </span>
            <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
              курсов
            </span>
          </motion.h2>
          <motion.p
            className="text-text-secondary text-lg"
            variants={fadeInUp}
          >
            Выбери направление и начни обучение уже сегодня
          </motion.p>
        </motion.div>

        <FilterBar categories={categories} onFilterChange={setFilters} />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="gradient-border overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className="h-48 skeleton" />
                <div className="p-5 space-y-3">
                  <div className="h-5 skeleton w-3/4" />
                  <div className="h-4 skeleton w-full" />
                  <div className="h-4 skeleton w-1/2" />
                  <div className="pt-4 border-t border-border-default flex justify-between">
                    <div className="h-6 skeleton w-20" />
                    <div className="h-4 skeleton w-16" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          >
            <EmptyStateIllustration />
            <p className="text-text-secondary text-lg font-medium">
              Курсы не найдены
            </p>
            <p className="text-text-muted mt-2">
              Попробуйте изменить параметры поиска или выбрать другую категорию
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {filtered.map((course, index) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                price={course.price}
                imageUrl={course.imageUrl}
                category={course.category.name}
                lessonsCount={course._count?.lessons || 0}
                masterclassesCount={course._count?.masterclasses || 0}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
