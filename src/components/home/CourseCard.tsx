"use client";

import { motion } from "framer-motion";
import { Play, Clock, BookOpen } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  category: string;
  lessonsCount: number;
}

export default function CourseCard({
  id,
  title,
  description,
  price,
  imageUrl,
  category,
  lessonsCount,
}: CourseCardProps) {
  return (
    <motion.a
      href={`/course/${id}`}
      className="gradient-border card-hover block group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="card-glow" />

      {/* Thumbnail */}
      <div className="relative h-48 bg-bg-secondary rounded-t-2xl overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-secondary to-bg-card">
            <Play className="w-12 h-12 text-accent/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-accent/15 text-accent border border-accent/20 backdrop-blur-sm">
            {category}
          </span>
        </div>

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center neon-glow">
            <Play className="w-6 h-6 text-white ml-1" fill="white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-accent transition-colors duration-300">
          {title}
        </h3>
        <p className="text-sm text-text-muted mb-4 line-clamp-2">{description}</p>

        <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {lessonsCount} уроков
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            В своём темпе
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-default">
          <span className="text-xl font-bold text-accent">{formatPrice(price)}</span>
          <span className="text-sm text-text-muted group-hover:text-accent transition-colors duration-300 flex items-center gap-1">
            Подробнее
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </motion.a>
  );
}
