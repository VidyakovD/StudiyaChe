import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isLearnMode = req.nextUrl.searchParams.get("learn") === "true";

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      modules: { orderBy: { order: "asc" } },
      lessons: {
        orderBy: { order: "asc" },
        include: {
          files: {
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, size: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
  }

  let purchased = false;
  if (session?.user?.id) {
    const purchase = await prisma.purchase.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: id } },
    });
    purchased = !!purchase;
  }

  if (isLearnMode) {
    if (!purchased) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const progress = await prisma.lessonProgress.findMany({
      where: { userId: session!.user.id },
    });

    const lessonsWithProgress = course.lessons.map((lesson) => ({
      ...lesson,
      completed: progress.some((p) => p.lessonId === lesson.id && p.completed),
    }));

    return NextResponse.json({
      course: {
        ...course,
        lessons: lessonsWithProgress,
      },
    });
  }

  // Не купившим отдаём только превью-поля уроков. videoUrl, homework, links и files —
  // платный контент, его нельзя слать на клиент по публичному GET.
  const publicLessons = course.lessons.map((l) => ({
    id: l.id,
    courseId: l.courseId,
    moduleId: l.moduleId,
    title: l.title,
    description: l.description,
    imageUrl: l.imageUrl,
    order: l.order,
    type: l.type,
  }));
  const filesCount = course.lessons.reduce(
    (acc, l) => acc + ((l.files && Array.isArray(l.files)) ? l.files.length : 0),
    0
  );
  return NextResponse.json({
    course: { ...course, lessons: publicLessons, filesCount },
    purchased,
  });
}
