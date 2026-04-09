"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import CourseCard from "./CourseCard";
import FilterBar from "./FilterBar";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: { id: string; name: string; slug: string };
  _count: { lessons: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-text-primary">Каталог </span>
            <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
              курсов
            </span>
          </h2>
          <p className="text-text-secondary text-lg">
            Выбери направление и начни обучение уже сегодня
          </p>
        </motion.div>

        <FilterBar categories={categories} onFilterChange={setFilters} />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="gradient-border h-[400px] animate-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-text-secondary text-lg">Курсы не найдены</p>
            <p className="text-text-muted mt-2">Попробуйте изменить фильтры</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {filtered.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                price={course.price}
                imageUrl={course.imageUrl}
                category={course.category.name}
                lessonsCount={course._count?.lessons || 0}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
