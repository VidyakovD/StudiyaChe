import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ courses: [] });
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          category: true,
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  const courses = await Promise.all(
    purchases.map(async (p) => {
      const totalLessons = p.course.lessons.length;
      const completedLessons = await prisma.lessonProgress.count({
        where: {
          userId: session.user.id,
          lessonId: { in: p.course.lessons.map((l) => l.id) },
          completed: true,
        },
      });

      return {
        id: p.course.id,
        title: p.course.title,
        imageUrl: p.course.imageUrl,
        price: p.course.price,
        category: p.course.category,
        _count: { lessons: totalLessons },
        progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    })
  );

  return NextResponse.json({ courses });
}
