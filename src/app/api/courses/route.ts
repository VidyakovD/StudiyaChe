import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      include: {
        category: true,
        lessons: { select: { type: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Считаем уроки и мастер-классы отдельно
  const coursesWithCounts = courses.map((course) => ({
    ...course,
    lessons: undefined,
    _count: {
      lessons: course.lessons.filter((l) => l.type === "LESSON").length,
      masterclasses: course.lessons.filter((l) => l.type === "MASTERCLASS").length,
    },
  }));

  return NextResponse.json({ courses: coursesWithCounts, categories });
}
