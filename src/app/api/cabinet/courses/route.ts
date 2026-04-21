import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ courses: [] });
  }

  const userId = session.user.id;

  // Один запрос к purchases с вложенными lessons
  const purchases = await prisma.purchase.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          category: true,
          lessons: { select: { id: true } },
        },
      },
    },
  });

  const allLessonIds = purchases.flatMap((p) => p.course.lessons.map((l) => l.id));

  // Один запрос за всем прогрессом пользователя
  const completedProgress = allLessonIds.length
    ? await prisma.lessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: allLessonIds },
          completed: true,
        },
        select: { lessonId: true },
      })
    : [];

  const completedSet = new Set(completedProgress.map((p) => p.lessonId));

  const courses = purchases.map((p) => {
    const totalLessons = p.course.lessons.length;
    const completedLessons = p.course.lessons.reduce(
      (acc, l) => (completedSet.has(l.id) ? acc + 1 : acc),
      0
    );

    return {
      id: p.course.id,
      title: p.course.title,
      imageUrl: p.course.imageUrl,
      price: p.course.price,
      category: p.course.category,
      _count: { lessons: totalLessons },
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  });

  return NextResponse.json({ courses });
}
