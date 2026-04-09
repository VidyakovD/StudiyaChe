import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      include: {
        category: true,
        _count: { select: { lessons: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ courses, categories });
}
