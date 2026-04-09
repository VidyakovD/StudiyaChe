"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  categories: { id: string; name: string; slug: string }[];
  onFilterChange: (filters: {
    category: string;
    search: string;
    sort: string;
  }) => void;
}

export default function FilterBar({ categories, onFilterChange }: FilterBarProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    onFilterChange({ category: slug, search, sort });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ category: activeCategory, search: value, sort });
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    onFilterChange({ category: activeCategory, search, sort: value });
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          placeholder="Поиск курсов..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="input-dark pl-12 pr-4"
        />
      </div>

      {/* Categories + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <motion.button
            onClick={() => handleCategoryChange("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === "all"
                ? "bg-accent text-white neon-glow"
                : "bg-bg-card text-text-secondary hover:text-text-primary border border-border-default hover:border-accent/30"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            Все курсы
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.slug
                  ? "bg-accent text-white neon-glow"
                  : "bg-bg-card text-text-secondary hover:text-text-primary border border-border-default hover:border-accent/30"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-text-muted" />
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-bg-card border border-border-default rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent/30 transition-colors"
          >
            <option value="default">По умолчанию</option>
            <option value="price_asc">Сначала дешёвые</option>
            <option value="price_desc">Сначала дорогие</option>
          </select>
        </div>
      </div>
    </div>
  );
}
